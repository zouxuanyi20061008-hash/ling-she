from fastapi.testclient import TestClient
from app.main import app
from app.core.liuyao import cast_six_yao

def test_six_yao_all_old_yin_to_qian():
    result=cast_six_yao([6]*6)
    assert result["ben_gua"]["full_name"]=="坤为地"
    assert result["bian_gua"]["full_name"]=="乾为天"
    assert result["dong_yao"]==[1,2,3,4,5,6]

def test_six_yao_old_yang_changes_first():
    result=cast_six_yao([9,7,7,7,7,7])
    assert result["ben_gua"]["full_name"]=="乾为天"
    assert result["bian_gua"]["full_name"]=="天风姤"
    assert result["dong_yao"]==[1]
    assert result["lines"][0]["name"]=="老阳"
    assert result["lines"][0]["changing"] is True
    assert result["lines"][1]["changing"] is False

def test_six_yao_no_moving_lines():
    result=cast_six_yao([7,8,7,8,7,8])
    assert result["dong_yao"] == []
    assert result["ben_gua"]["full_name"]==result["bian_gua"]["full_name"]

def test_multi_changing_lines_preserved():
    result=cast_six_yao([6,7,8,9,7,8])
    assert result["dong_yao"] == [1,4]
    assert "纳甲干支" in result["note"]
    assert len(result["najia_lines"]) == 6
    assert result["najia_lines"][0]["moving"] is True

def test_six_yao_backend_rejects_bad_or_partial_input():
    client=TestClient(app)
    for numbers in ([6,7,8], [7]*5+[5], [7]*5+[True], [7]*5+[9,9]):
        result=client.post("/api/liuyao/cast",json={"numbers":numbers})
        assert result.status_code == 422

def test_six_yao_api_exposes_instructions_not_invented_degrees():
    client=TestClient(app)
    result=client.post("/api/liuyao/cast",json={"numbers":[7]*6})
    assert result.status_code==200
    data=result.json()
    assert data["ben_gua"]["full_name"]=="乾为天"
    assert "六亲" in data["note"]
    assert data["eight_palaces"]["ben"]["palace"]=="乾"
    assert data["najia_lines"][0]["liuqin"]=="子孙"
    assert data["school"]=="六爻纳甲"

def test_six_yao_ai_needs_reality_background():
    client=TestClient(app)
    r=client.post("/api/liuyao/interpret",json={"numbers":[7]*6,"question":"工作怎样？"})
    assert r.status_code==428
    assert r.json()["detail"]["code"]=="BACKGROUND_REQUIRED"

def test_six_yao_ai_uses_only_computed_data(monkeypatch):
    import importlib
    server=importlib.import_module("app.main")
    captured={}
    def fake_model(request,model,messages):
        captured["model"]=model
        captured["messages"]=messages
        return "请核实现实条件"
    monkeypatch.setattr(server,"_call_llm",fake_model)
    client=TestClient(server.app)
    res=client.post("/api/liuyao/interpret",json={
        "numbers":[6,7,8,9,7,8],"question":"朋友的合作是否继续？",
        "background":"正在谈合同分成","background_confirmed":True,
        "ai_model":"deepseek-chat"})
    assert res.status_code==200
    assert "请核实" in res.json()["interpretation"]
    assert "绝对禁止补造" in captured["messages"][0]["content"]
    assert "动爻" in captured["messages"][0]["content"]
    assert '"dong_yao": [1, 4]' in captured["messages"][1]["content"]


def test_bagong_exhaustive_name_order_uniqueness():
    from app.core.najia import PALACE_BY_LINES,STAGES,SHI_POSITIONS
    from app.core.hexagrams import hexagram_from_lines
    expected={
      "乾":["乾为天","天风姤","天山遁","天地否","风地观","山地剥","火地晋","火天大有"],
      "兑":["兑为泽","泽水困","泽地萃","泽山咸","水山蹇","地山谦","雷山小过","雷泽归妹"],
      "离":["离为火","火山旅","火风鼎","火水未济","山水蒙","风水涣","天水讼","天火同人"],
      "震":["震为雷","雷地豫","雷水解","雷风恒","地风升","水风井","泽风大过","泽雷随"],
      "巽":["巽为风","风天小畜","风火家人","风雷益","天雷无妄","火雷噬嗑","山雷颐","山风蛊"],
      "坎":["坎为水","水泽节","水雷屯","水火既济","泽火革","雷火丰","地火明夷","地水师"],
      "艮":["艮为山","山火贲","山天大畜","山泽损","火泽睽","天泽履","风泽中孚","风山渐"],
      "坤":["坤为地","地雷复","地泽临","地天泰","雷天大壮","泽天夬","水天需","水地比"],
    }
    assert len(PALACE_BY_LINES)==64
    for palace,names in expected.items():
        selected={v["order"]: (hexagram_from_lines(bits)["full_name"],v)
                  for bits,v in PALACE_BY_LINES.items() if v["palace"]==palace}
        assert len(selected)==8
        for i,name in enumerate(names):
            got,pal=selected[i]
            assert got==name
            assert pal["stage"]==STAGES[i]
            assert pal["shi_position"]==SHI_POSITIONS[i]
            assert (pal["shi_position"]-pal["ying_position"])%6==3

def test_najia_all_eight_pure_hexagrams():
    from app.core.najia import NAJIA,najia_for_lines
    from app.core.hexagrams import TRIGRAMS
    assert len(NAJIA)==8
    expected={
      1:["甲子","甲寅","甲辰","壬午","壬申","壬戌"],
      2:["丁巳","丁卯","丁丑","丁亥","丁酉","丁未"],
      3:["己卯","己丑","己亥","己酉","己未","己巳"],
      4:["庚子","庚寅","庚辰","庚午","庚申","庚戌"],
      5:["辛丑","辛亥","辛酉","辛未","辛巳","辛卯"],
      6:["戊寅","戊辰","戊午","戊申","戊戌","戊子"],
      7:["丙辰","丙午","丙申","丙戌","丙子","丙寅"],
      8:["乙未","乙巳","乙卯","癸丑","癸亥","癸酉"],
    }
    for trigram,row in TRIGRAMS.items():
        calculated=najia_for_lines(row["lines"]*2,row["element"])
        assert [r["ganzhi"] for r in calculated]==expected[trigram]
        assert len(calculated)==6

def test_najia_palace_not_up_trigram_for_liuqin():
    # 火天大有归乾金，不是离火；甲子水对乾金为子孙。
    from app.core.hexagrams import TRIGRAMS
    from app.core.najia import decorate_six_yao
    # 初至三爻乾，四至六爻离，其他爻阴阳通过固定数构成。
    ben=tuple(TRIGRAMS[1]["lines"]+TRIGRAMS[3]["lines"])
    chart={"ben_gua":{"lines_bottom_to_top":list(ben)},
           "bian_gua":{"lines_bottom_to_top":list(ben)},"dong_yao":[]}
    result=decorate_six_yao(chart)
    pal=result["eight_palaces"]["ben"]
    assert pal["palace"]=="乾"
    assert pal["palace_element"]=="金"
    assert pal["stage"]=="归魂"
    assert pal["shi_position"]==3
    assert pal["ying_position"]==6
    assert result["najia_lines"][0]["ganzhi"]=="甲子"
    assert result["najia_lines"][0]["liuqin"]=="子孙"
    assert result["najia_lines"][3]["ganzhi"]=="己酉"
    assert result["najia_lines"][3]["liuqin"]=="兄弟"

def test_najia_example_tianfeng_gou():
    chart=cast_six_yao([8,7,7,7,7,7]) # 初爻阴，其余阳
    assert chart["ben_gua"]["full_name"]=="天风姤"
    assert chart["eight_palaces"]["ben"]["palace"]=="乾"
    assert chart["eight_palaces"]["ben"]["shi_position"]==1
    assert chart["najia_lines"][0]["ganzhi"]=="辛丑"
    assert chart["najia_lines"][1]["ganzhi"]=="辛亥"
    assert chart["najia_lines"][2]["ganzhi"]=="辛酉"
    assert chart["najia_lines"][3]["ganzhi"]=="壬午"
    assert chart["najia_lines"][4]["ganzhi"]=="壬申"
    assert chart["najia_lines"][5]["ganzhi"]=="壬戌"
    assert chart["najia_lines"][0]["role"]=="世"
    assert chart["najia_lines"][3]["role"]=="应"

def test_six_yao_api_exposes_najia_and_shi_ying():
    c=TestClient(app)
    r=c.post("/api/liuyao/cast",json={"numbers":[7]*6})
    assert r.status_code==200
    d=r.json()
    assert d["eight_palaces"]["ben"]["palace"]=="乾"
    assert d["eight_palaces"]["ben"]["shi_position"]==6
    assert d["eight_palaces"]["ben"]["ying_position"]==3
    assert [line["liuqin"] for line in d["najia_lines"]]==["子孙","妻财","父母","官鬼","兄弟","父母"]
    assert len(d["bian_najia_lines"])==6
    assert "旬空" in d["najia_note"]
