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
    assert "尚未装纳甲" in result["note"]

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
    assert "六亲" not in data
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
