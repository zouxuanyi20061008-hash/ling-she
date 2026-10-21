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
