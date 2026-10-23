"""V32 case research: owner-only privacy and honest descriptive summary."""
import json
import re
import pytest
from fastapi.testclient import TestClient
from app.main import app
import app.experience_gateway as gate
from app.experience_case_research import summarize_imported_cases


def scenario():
    return [
        ("pending",{"before":"一", "chosen_category":"父母",
          "original_numbers":[7]*6,"created_at":"2026-10-23T12:00:00Z",
          "day_ganzhi":"甲子","month_branch":"辰","feedback":[]}),
        ("approved",{"before":"私人提问，不能出现在统计结果",
          "chosen_category":"官鬼","created_at":"2026-10-23T12:00:00Z",
          "day_ganzhi":"甲子","month_branch":"辰",
          "feedback":[{"result_type":"未吻合","observations":"后续事实确实不同",
                       "recorded_at":"2026-10-24T12:00:00Z"}]}),
        ("rejected",{"before":"三","chosen_category":"官鬼",
          "created_at":"2026-10-24T12:00:00Z",
          "feedback":[{"result_type":"尚无结果","observations":"未出结果",
                       "recorded_at":"2026-10-22T12:00:00Z"},
                      {"result_type":"部分吻合","observations":"有材料",
                       "recorded_at":"2026-10-22T12:00:00Z"}]})
    ]


def test_summary_counts_only_cases_not_success_rates_or_private_text():
    result=summarize_imported_cases(scenario())
    assert result["total_cases"]==3
    assert result["status_counts"]=={"pending":1,"approved":1,"rejected":1}
    assert result["with_followup"]==2
    assert result["missing_followup"]==1
    assert result["time_order_needs_review"]==1
    assert result["missing_calendar"]==1
    assert result["self_report_tags"]["未吻合"]==1
    assert result["self_report_tags"]["尚无结果"]==1
    assert result["top_categories"][0]=={"name":"官鬼","count":2}
    assert result["independently_verified"] is False
    assert result["prediction_accuracy"] is None
    raw=json.dumps(result,ensure_ascii=False)
    assert "私人提问" not in raw
    assert "后续事实确实不同" not in raw


@pytest.fixture
def owner(monkeypatch,tmp_path):
    monkeypatch.setenv("ACCESS_GATE_ENABLED","0")
    monkeypatch.setenv("ADMIN_PORTAL_ENABLED","1")
    monkeypatch.setenv("ADMIN_PASSWORD","test-only-owner-secret")
    monkeypatch.setenv("APP_SESSION_SECRET","v32-test-session-secret-longer-than-32-chars")
    monkeypatch.delenv("DATABASE_URL",raising=False)
    monkeypatch.setenv("EXPERIENCE_SQLITE_PATH",str(tmp_path/"v32-admin.db"))
    monkeypatch.setattr(gate,"_SCHEMA_READY",False)
    c=TestClient(app,base_url="https://testserver",follow_redirects=False)
    assert c.get("/admin/research-summary").status_code==303
    page=c.get("/admin/login")
    proof=re.search(r"name='login_proof' value='([^']+)'",page.text).group(1)
    ok=c.post("/admin/login",data={"login_proof":proof,"password":"test-only-owner-secret"})
    assert ok.status_code==303
    return c


def test_research_summary_only_for_logged_in_owner_and_empty_state(owner):
    res=owner.get("/admin/research-summary")
    assert res.status_code==200
    s=res.json()
    assert s["database_state"]=="unconfigured"
    assert s["total_cases"]==0
    assert s["max_scanned"]==1000
    assert s["partial_scan"] is False
    assert "站长导入案例统计" in owner.get("/admin").text


def test_research_summary_contains_approved_and_rejected_without_private_case_text(owner):
    for i,(status,c) in enumerate(scenario()):
        record={"case":c,"id":str(i)}
        gate._exec("INSERT INTO experience_imported_cases VALUES (?,?,?,?,?,?)",
                   (f"case-{i}",f"src-{i}","2026-10-24T01:01:00Z",status,
                    json.dumps(record,ensure_ascii=False),"复盘私密备注"))
    res=owner.get("/admin/research-summary")
    assert res.status_code==200
    text=res.text
    assert res.json()["total_cases"]==3
    assert res.json()["self_report_tags"]["未吻合"]==1
    for word in ["复盘私密备注","私人提问，不能出现在统计结果","src-0"]:
        assert word not in text


def test_visitor_cannot_see_summary_after_logout(owner):
    csrf=owner.get("/api/experience/session").json()["csrf"]
    assert owner.post("/admin/logout",data={"csrf":csrf}).status_code==303
    res=owner.get("/admin/research-summary")
    assert res.status_code==303
    assert res.headers["location"]=="/admin/login"
    assert owner.get("/").status_code in (200,404)
