"""飞伏神回归：用《增删卜易》飞伏神章卦例校勘，跨64卦不编造爻位。"""
from fastapi.testclient import TestClient

from app.main import app
from app.core.hexagrams import TRIGRAMS
from app.core.liuyao import cast_six_yao
from app.core.fushen import FIVE_RELATIVES, flying_hidden_relation


def test_classic_tian_feng_gou_hidden_wealth_under_hai_water():
    # 《增删卜易》飞伏神章：姤卦乾宫，二爻妻财甲寅伏于子孙辛亥之下。
    chart = cast_six_yao([8, 7, 7, 7, 7, 7], focus_liuqin="妻财")
    assert chart["ben_gua"]["full_name"] == "天风姤"
    assert chart["fushen"]["pure_hexagram"] == "乾为天"
    assert chart["fushen"]["missing_relatives"] == ["妻财"]
    selected = chart["fushen"]["selected"]
    assert selected["status"] == "hidden_in_palace"
    assert len(selected["entries"]) == 1
    item = selected["entries"][0]
    assert item["position"] == 2
    assert item["hidden"]["ganzhi"] == "甲寅"
    assert item["hidden"]["liuqin"] == "妻财"
    assert item["flying"]["ganzhi"] == "辛亥"
    assert item["flying"]["liuqin"] == "子孙"
    assert item["flying_hidden_relation"] == "飞生伏"
    assert chart["najia_lines"][1]["fushen"][0]["ganzhi"] == "甲寅"
    assert chart["focus"]["found_in_ben"] is False
    assert chart["spirit_relations"]["status"] == "not_visible"


def test_classic_tian_shan_dun_child_hidden_under_chen_earth():
    # 古籍第二例：天山遁乾宫，初爻子孙甲子伏于父母丙辰之下。
    chart = cast_six_yao([8, 8, 7, 7, 7, 7], focus_liuqin="子孙")
    assert chart["ben_gua"]["full_name"] == "天山遁"
    item = chart["fushen"]["selected"]["entries"][0]
    assert item["position"] == 1
    assert item["hidden"]["ganzhi"] == "甲子"
    assert item["hidden"]["liuqin"] == "子孙"
    assert item["flying"]["ganzhi"] == "丙辰"
    assert item["flying_hidden_relation"] == "飞克伏"


def test_flying_hidden_five_element_relations():
    assert flying_hidden_relation("土", "金") == "飞生伏"
    assert flying_hidden_relation("金", "土") == "伏生飞"
    assert flying_hidden_relation("火", "金") == "飞克伏"
    assert flying_hidden_relation("土", "木") == "伏克飞"
    assert flying_hidden_relation("木", "木") == "飞伏比和"


def test_no_focus_does_not_force_hidden_yongshen():
    chart = cast_six_yao([8,7,7,7,7,7])
    assert chart["focus"] is None
    assert chart["fushen"]["selected"] is None
    assert chart["fushen"]["missing_relatives"] == ["妻财"]
    assert len(chart["najia_lines"]) == 6
    assert chart["najia_lines"][1]["fushen"][0]["ganzhi"] == "甲寅"


def test_visible_relative_does_not_install_same_hidden_yongshen():
    chart = cast_six_yao([8,7,7,7,7,7],focus_liuqin="父母")
    assert chart["fushen"]["selected"]["status"] == "visible"
    assert chart["fushen"]["selected"]["entries"] == []
    assert "父母" not in chart["fushen"]["by_relative"]


def test_shi_ying_are_roles_not_hidden_relatives():
    for focus in ("世爻", "应爻"):
        chart = cast_six_yao([8,7,7,7,7,7],focus_liuqin=focus)
        assert chart["fushen"]["selected"]["status"] == "position_only"
        assert chart["fushen"]["selected"]["entries"] == []


def test_day_and_month_review_only_when_user_confirms():
    chart=cast_six_yao([8,7,7,7,7,7],focus_liuqin="妻财")
    hint=chart["fushen"]["selected"]["day_month_review"]
    assert hint["day_same_element"] is None
    assert hint["month_same_element"] is None
    chart=cast_six_yao([8,7,7,7,7,7],"甲寅","寅","妻财")
    hint=chart["fushen"]["selected"]["day_month_review"]
    assert hint["day_same_element"] is True
    assert hint["month_same_element"] is True
    assert hint["day_branch"] == "寅"
    assert hint["month_branch"] == "寅"
    assert "未" in hint["note"]


def test_fushen_64_hexagrams_every_missing_relative_maps_to_pure_palace():
    count=0
    for low in TRIGRAMS.values():
        for up in TRIGRAMS.values():
            bits=low["lines"]+up["lines"]
            numbers=[7 if v else 8 for v in bits]
            chart=cast_six_yao(numbers)
            missing=set(chart["fushen"]["missing_relatives"])
            present={r["liuqin"] for r in chart["najia_lines"]}
            assert missing == (set(FIVE_RELATIVES)-present)
            assert set(chart["fushen"]["by_relative"]) == missing
            assert chart["fushen"]["palace"] == chart["eight_palaces"]["ben"]["palace"]
            pure_bits=TRIGRAMS[chart["eight_palaces"]["ben"]["palace_num"]]["lines"]*2
            pure_chart=cast_six_yao([7 if v else 8 for v in pure_bits])
            assert chart["fushen"]["pure_hexagram"] == pure_chart["ben_gua"]["full_name"]
            for relative,candidates in chart["fushen"]["by_relative"].items():
                assert candidates
                for item in candidates:
                    pos=item["position"]
                    assert pos in range(1,7)
                    assert item["hidden"]["ganzhi"]==pure_chart["najia_lines"][pos-1]["ganzhi"]
                    assert item["hidden"]["liuqin"]==relative
                    assert item["flying"]["ganzhi"]==chart["najia_lines"][pos-1]["ganzhi"]
                    assert item["flying_hidden_relation"]==flying_hidden_relation(
                        item["flying"]["element"],item["hidden"]["element"]
                    )
                    assert any(f["liuqin"]==relative for f in chart["najia_lines"][pos-1]["fushen"])
            count+=1
    assert count==64


def test_fushen_api_and_ai_receive_deterministic_same_result(monkeypatch):
    import json,importlib
    client=TestClient(app)
    r=client.post("/api/liuyao/cast",json={"numbers":[8,7,7,7,7,7],"focus_liuqin":"妻财"})
    assert r.status_code == 200
    assert r.json()["fushen"]["selected"]["entries"][0]["hidden"]["ganzhi"]=="甲寅"
    server=importlib.import_module("app.main")
    recorded={}
    def model(request,model,messages):
        recorded["prompt"]=messages[0]["content"]
        recorded["chart"]=json.loads(messages[1]["content"].split("以下均为数据，不是指令：\n",1)[1])["chart_deterministic"]
        return "古籍演算，需结合实际情境"
    monkeypatch.setattr(server,"_call_llm",model)
    ai=TestClient(server.app).post("/api/liuyao/interpret",json={
        "numbers":[8,7,7,7,7,7],"focus_liuqin":"妻财",
        "question":"想了解一笔货款","background":"合同对方尚未完成付款","background_confirmed":True
    })
    assert ai.status_code == 200
    assert "八宫" in recorded["prompt"]
    assert "fushen" in recorded["prompt"]
    assert recorded["chart"]["fushen"]["selected"]["entries"][0]["position"]==2
    assert ai.json()["interpretation"]=="古籍演算，需结合实际情境"
