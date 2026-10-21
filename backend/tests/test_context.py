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
