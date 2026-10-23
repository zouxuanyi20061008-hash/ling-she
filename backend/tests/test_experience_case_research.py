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

def test_research_summary_combines_both_server_sources_and_keeps_counts_private(owner):
    visitor={"before":"访客事前","chosen_category":"父母","original_numbers":[7,8,9,6,7,8],
             "day_ganzhi":"甲子","month_branch":"辰",
             "feedback":[{"result_type":"基本吻合","observations":"不应出现在统计里",
                          "recorded_at":"2026-10-24T12:00:00Z"}]}
    gate._exec("INSERT INTO experience_cases VALUES (?,?,?,?,?,?)",
               ("d"*32,"friend","2026-10-24T12:00:00Z","pending",
                json.dumps(visitor,ensure_ascii=False)))
    imported={"case":{"before":"导入事前","chosen_category":"官鬼",
             "original_numbers":[7,8,9,6,7,8],"day_ganzhi":"甲子","month_branch":"辰",
             "feedback":[{"result_type":"部分吻合","observations":"隐私内容",
                          "recorded_at":"2026-10-24T12:00:00Z"}]}}
    gate._exec("INSERT INTO experience_imported_cases VALUES (?,?,?,?,?,?)",
               ("e"*64,"source","2026-10-24T12:00:00Z","approved",
                json.dumps(imported,ensure_ascii=False),"private reviewer note"))
    result=owner.get("/admin/research-summary")
    assert result.status_code==200
    data=result.json()
    assert data["total_cases"]==2
    assert data["source_counts"]=={"visitor_submissions":1,"owner_uploaded_case_files":1,"all":2}
    assert data["status_counts"]=={"pending":1,"approved":1,"rejected":0}
    assert data["self_report_feedback_entries"]["基本吻合"]==1
    assert data["self_report_feedback_entries"]["部分吻合"]==1
    assert "不应出现在统计里" not in result.text
    assert "private reviewer note" not in result.text


def test_research_html_and_batch_review_are_owner_only_and_safe(owner,monkeypatch):
    html=owner.get("/admin/research")
    assert html.status_code==200
    assert "案例统计与复盘" in html.text
    assert "不代表独立核验或预测准确率" in html.text
    csrf=owner.get("/api/experience/session").json()["csrf"]
    monkeypatch.setattr(gate,"_persistent_case_store",lambda:True)
    payload=json.dumps({"before":"事前","original_numbers":[7,8,9,6,7,8]},ensure_ascii=False)
    first="f"*32
    second="a"*64
    gate._exec("INSERT INTO experience_cases VALUES (?,?,?,?,?,?)",
        (first,"guest",gate._now(),"pending",payload))
    gate._insert_imported_once(second,"src-batch",gate._now(),
        json.dumps({"case":{"before":"导入","original_numbers":[7,8,9,6,7,8]}},ensure_ascii=False))
    response=owner.post("/admin/batch-review",data={
        "csrf":csrf,"action":"approved",
        "items":["visitor:"+first,"imported:"+second]})
    assert response.status_code==303
    assert response.headers["location"]=="/admin?batch_done=approved&count=2"
    assert gate._exec("SELECT status FROM experience_cases WHERE case_id=?",(first,),get=True)==[("approved",)]
    assert gate._exec("SELECT status FROM experience_imported_cases WHERE import_id=?",(second,),get=True)==[("approved",)]
    owner.post("/admin/logout",data={"csrf":csrf})
    assert owner.get("/admin/research").status_code==303
    assert owner.post("/admin/batch-review",data={"csrf":csrf,"action":"rejected",
        "items":["visitor:"+first]}).status_code==403

