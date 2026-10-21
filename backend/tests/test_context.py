from fastapi.testclient import TestClient
from app.main import app
from app.clarification import followup_question
from app.yaoci import moving_line_text
from app.core.hexagrams import arrange
from app.prompts import build_messages

def test_clarification_by_question():
    assert "断联" in followup_question("还可能复合吗")
    assert "工作" in followup_question("跳槽是否合适")
    assert "见到" in followup_question("寻找发簪")

def test_yaoci_and_chart():
    chart=arrange(4,4,8)
    assert chart["ben_gua"]["name"] == "震"
    assert chart["hu_gua"]["name"] == "蹇"
    assert chart["bian_gua"]["name"] == "归妹"
    assert "勿逐" in moving_line_text(chart)
    assert moving_line_text(arrange(1,1,6)) is None

def test_interpret_context_precondition(monkeypatch):
    monkeypatch.delenv("LLM_API_KEY",raising=False)
    client=TestClient(app)
    data={"question":"还能复合吗","value":"3,6","time_iso":"2026-10-22T01:20:00+08:00"}
    assert client.post("/api/cast",json=data).status_code==200
    response=client.post("/api/interpret",json=data)
    assert response.status_code==428
    assert response.json()["detail"]["code"]=="BACKGROUND_REQUIRED"
    checked=client.post("/api/interpret",json={**data,"background_confirmed":True,"background":"断联一个月"})
    assert checked.status_code==503

def test_messages_separate_inference_and_facts():
    content=build_messages("能复合吗",arrange(4,4,8),"刚分手","震卦六二：勿逐")[1]["content"]
    assert "user_background_unverified" in content
    assert "moving_line_text_verified" in content


def test_any_observation_requires_user_chosen_numbers():
    client=TestClient(app)
    data={"question":"这件事如何发展","value":"窗外听见三声鸟叫",
          "time_iso":"2026-10-22T02:15:00+09:00"}
    no_numbers=client.post("/api/cast",json=data)
    assert no_numbers.status_code==422
    assert no_numbers.json()["detail"]["code"]=="NUMBERS_REQUIRED"
    missing_reason=client.post("/api/cast",json={
        **data,"observation_first":3,"observation_second":5
    })
    assert missing_reason.status_code==422
    result=client.post("/api/cast",json={
        **data,"observation_first":3,"observation_second":5,
        "observation_reason":"三声鸟叫取3，见五个窗格取5"
    })
    assert result.status_code==200
    obj=result.json()
    assert obj["method_numbers"] == {"upper":3,"lower":5,"moving":8}
    assert obj["origin"]["observation"]=="窗外听见三声鸟叫"
    assert obj["origin"]["observation_reason"]=="三声鸟叫取3，见五个窗格取5"

def test_two_character_cast(monkeypatch):
    import app.core.casting as casting
    from datetime import datetime
    monkeypatch.setattr(casting,"load_data",lambda: ({},{"迷":(9,),"茫":(9,)}))
    obj=casting.cast("迷茫",datetime.fromisoformat("2026-10-22T02:15:00+09:00"))
    assert obj["ben_gua"]["name"]=="乾"
    assert obj["bian_gua"]["name"]=="夬"
    assert obj["origin"]["method"]=="hanzi-pair"
    assert obj["method_numbers"]["moving"]==18

def test_invalid_or_ambiguous_pair_needs_confirmation(monkeypatch):
    import app.core.casting as casting
    from datetime import datetime
    monkeypatch.setattr(casting,"load_data",lambda: ({},{"迷":(9,10),"茫":(9,)}))
    with __import__("pytest").raises(casting.ObservationNeedsNumbers):
        casting.cast("迷茫",datetime.fromisoformat("2026-10-22T02:15:00+09:00"))

def test_freeform_notes_do_not_trigger_ai_without_context():
    client=TestClient(app)
    req={"question":"我的合作进展如何","value":"看到三只鸟",
          "time_iso":"2026-10-22T02:15:00+09:00",
          "observation_first":3,"observation_second":7,"observation_reason":"三只鸟为三，旁边七棵树为七"}
    response=client.post("/api/interpret",json=req)
    assert response.status_code==428


def test_full_64_hexagram_names_and_meanings():
    from app.core.hexagrams import TRIGRAMS, HEXAGRAM_NAMES, hexagram_from_lines
    from app.core.guides import HEXAGRAM_GUIDES
    expected = [
        "乾为天 天泽履 天火同人 天雷无妄 天风姤 天水讼 天山遁 天地否",
        "泽天夬 兑为泽 泽火革 泽雷随 泽风大过 泽水困 泽山咸 泽地萃",
        "火天大有 火泽睽 离为火 火雷噬嗑 火风鼎 火水未济 火山旅 火地晋",
        "雷天大壮 雷泽归妹 雷火丰 震为雷 雷风恒 雷水解 雷山小过 雷地豫",
        "风天小畜 风泽中孚 风火家人 风雷益 巽为风 风水涣 风山渐 风地观",
        "水天需 水泽节 水火既济 水雷屯 水风井 坎为水 水山蹇 水地比",
        "山天大畜 山泽损 山火贲 山雷颐 山风蛊 山水蒙 艮为山 山地剥",
        "地天泰 地泽临 地火明夷 地雷复 地风升 地水师 地山谦 坤为地",
    ]
    assert len(HEXAGRAM_GUIDES) == 64
    for up in range(1,9):
        for low in range(1,9):
            obj=hexagram_from_lines(TRIGRAMS[low]["lines"]+TRIGRAMS[up]["lines"])
            assert obj["name"]==HEXAGRAM_NAMES[up-1][low-1]
            assert obj["full_name"]==expected[up-1].split()[low-1]
            assert obj["keywords"]
            assert len(obj["meaning"]) >= 8

def test_user_screen_shows_full_names_and_free_guide():
    client=TestClient(app)
    payload={"question":"我该怎样处理朋友关系？","value":"5,2",
             "time_iso":"2026-10-22T02:27:00+09:00"}
    response=client.post("/api/cast",json=payload)
    assert response.status_code==200
    chart=response.json()
    assert chart["ben_gua"]["full_name"]=="风泽中孚"
    assert chart["hu_gua"]["full_name"]=="山雷颐"
    assert chart["bian_gua"]["full_name"]=="风水涣"
    assert chart["sheng_ke"]=="用克体"
    assert "外部制约" in chart["reading_guide"]["relationship"]
    assert chart["ben_gua"]["meaning"]
    assert chart["hu_gua"]["meaning"]
    assert chart["bian_gua"]["meaning"]
    assert "moving_position" in chart["reading_guide"]


def test_xiantian_and_houtian_layers():
    # 风泽中孚：5巽木上、2兑金下、初爻动。体=巽木，用=兑金。
    chart=arrange(5,2,7)
    data=chart["dual_layer"]
    assert chart["ben_gua"]["full_name"]=="风泽中孚"
    assert data["xiantian"]["upper_number"]==5
    assert data["xiantian"]["lower_number"]==2
    assert data["xiantian"]["relation"]=="用克体"
    assert data["houtian"]["ti"]["name"]=="巽"
    assert data["houtian"]["ti"]["direction"]=="东南"
    assert data["houtian"]["yong"]["name"]=="兑"
    assert data["houtian"]["yong"]["direction"]=="西"
    assert "沟通" in data["houtian"]["yong"]["themes"]
    assert "先天定理" in data["boundary"]

def test_eight_houtian_trigram_directions_are_fixed():
    from app.core.hexagrams import houtian_reference
    expected={1:"西北",2:"西",3:"南",4:"东",5:"东南",6:"北",7:"东北",8:"西南"}
    assert {n:houtian_reference(n)["direction"] for n in range(1,9)}==expected
    assert all(houtian_reference(n)["themes"] for n in expected)

def test_moving_upper_reverses_ti_yong_correctly():
    chart=arrange(5,2,10) # 四爻动，上卦为用，下卦为体
    assert chart["dong_yao"]==4
    assert chart["ti_gua"]["name"]=="兑"
    assert chart["yong_gua"]["name"]=="巽"
    assert chart["dual_layer"]["houtian"]["ti"]["direction"]=="西"
    assert chart["dual_layer"]["houtian"]["yong"]["direction"]=="东南"

def test_offline_cast_keeps_new_dual_layer_without_ai():
    client=TestClient(app)
    r=client.post("/api/cast",json={
        "question":"朋友关系怎么处理？","value":"5,2",
        "time_iso":"2026-10-22T02:20:00+09:00"
    })
    assert r.status_code==200
    chart=r.json()
    assert chart["dual_layer"]["xiantian"]["relation"]=="用克体"
    assert "后天方位" in chart["dual_layer"]["houtian"]["title"]
    assert chart["reading_guide"]["relationship"]
