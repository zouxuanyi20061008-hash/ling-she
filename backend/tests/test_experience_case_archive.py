"""V30 private archive intake: consent, fail-closed DB guard, HTML escaping, dedup."""
import json
import pytest
from fastapi.testclient import TestClient

from app.main import app
import app.experience_gateway as gate
from app.experience_case_archive import parse_shared_case,CaseImportError

OWNER_PASS = "v30-owner-test-password"
SECRET = "v30-session-signing-secret-long-enough-for-tests"
CONSENT = "由分享者主动导出、交给收件人审核的研究材料"


def sample_case(source="visitor-case-0001",before="事前要验证实际结果",feedback=None):
    return {
        "format":"wanxiang-sixyao-case-v1","version":1,
        "consent":CONSENT,"source_key":source,
        "shared_at":"2026-10-23T11:33:00Z",
        "case":{
            "original_numbers":[7,8,9,6,7,8],
            "ben_gua":"水天需","bian_gua":"火天大有",
            "day_ganzhi":"甲子","month_branch":"辰",
            "chosen_category":"父母","selected_position":3,
            "created_at":"2026-10-22T12:00:00Z",
            "before":before,
            "feedback":feedback or [],
            "human_review":None,"focus_selection":None,
            "question":"只有原始私密问题，不得保存",
            "api_key":"sk-NO-TRANSFER",
        },
        "device_id":"never-store-device-identifiers",
    }


@pytest.fixture
def admin_client(monkeypatch,tmp_path):
    monkeypatch.setenv("ACCESS_GATE_ENABLED","0")
    monkeypatch.setenv("ADMIN_PORTAL_ENABLED","1")
    monkeypatch.setenv("APP_SESSION_SECRET",SECRET)
    monkeypatch.setenv("ADMIN_PASSWORD",OWNER_PASS)
    monkeypatch.setenv("EXPERIENCE_SQLITE_PATH",str(tmp_path/"admin-test.db"))
    monkeypatch.delenv("DATABASE_URL",raising=False)
    monkeypatch.setattr(gate,"_SCHEMA_READY",False)
    with gate._RATE_LOCK:
        gate._RATE.clear()
    client=TestClient(app,base_url="https://testserver",follow_redirects=False)
    page=client.get("/admin/login")
    assert page.status_code==200
    import re
    nonce=re.search(r"name='login_proof' value='([^']+)'",page.text).group(1)
    login=client.post("/admin/login",data={"login_proof":nonce,"password":OWNER_PASS})
    assert login.status_code==303
    auth=client.get("/api/experience/session")
    assert auth.status_code==200
    return client,auth.json()["csrf"]


def post_import(client,csrf,data,reviewed="yes"):
    return client.post("/admin/import-case",data={
        "csrf":csrf,"reviewed":reviewed,"share_json":json.dumps(data,ensure_ascii=False)
    })


def test_shared_parser_only_keeps_explicitly_allowed_fields():
    data=sample_case()
    result=parse_shared_case(json.dumps(data,ensure_ascii=False))
    assert result["case"]["original_numbers"]==[7,8,9,6,7,8]
    assert result["case"]["before"]=="事前要验证实际结果"
    assert result["verified"] is False and result["accuracy_score"] is None
    output=json.dumps(result,ensure_ascii=False)
    for private in ("api_key","sk-NO-TRANSFER","device_id","never-store-device-identifiers",
                    "只有原始私密问题"):
        assert private not in output


@pytest.mark.parametrize("corrupt",[
    {"format":"other"},
    {"consent":"automatically uploaded"},
    {"source_key":""},
    {"case":{"original_numbers":[1,2,3,4,5,6]}},
    {"case":{"original_numbers":[7,8,9,6,7,True]}},
    {"case":{"before":""}},
    {"case":{"feedback":[{"result_type":"获胜","observations":"something"}]}}
])
def test_corrupt_or_nonconsensual_input_is_rejected(corrupt):
    incoming=sample_case()
    if "case" in corrupt:
        incoming["case"].update(corrupt["case"])
    else:
        incoming.update(corrupt)
    with pytest.raises(CaseImportError):
        parse_shared_case(json.dumps(incoming,ensure_ascii=False))


def test_unconfigured_postgres_rejects_owner_import_without_touching_file(admin_client):
    client,csrf=admin_client
    response=post_import(client,csrf,sample_case())
    assert response.status_code==503
    assert "持久数据库" in response.text
    assert gate._exec("SELECT import_id FROM experience_imported_cases",get=True)==[]
    dashboard=client.get("/admin")
    assert dashboard.status_code==200
    assert "云端正式收案尚未启用" in dashboard.text
    assert "普通书院目前公开访问" in dashboard.text


def test_admin_csrf_and_explicit_import_review_required(admin_client,monkeypatch):
    client,csrf=admin_client
    monkeypatch.setattr(gate,"_persistent_case_store",lambda:True)
    assert post_import(client,"wrong",sample_case()).status_code==403
    assert post_import(client,csrf,sample_case(),reviewed="no").status_code==422
    assert client.post("/admin/import-case",headers={"Sec-Fetch-Site":"cross-site"},
        data={"csrf":csrf,"reviewed":"yes",
              "share_json":json.dumps(sample_case())}).status_code==403
    assert gate._exec("SELECT import_id FROM experience_imported_cases",get=True)==[]


def test_owner_upload_dedup_moderation_export_and_privacy(admin_client,monkeypatch):
    client,csrf=admin_client
    monkeypatch.setattr(gate,"_persistent_case_store",lambda:True)
    data=sample_case(before="<script>alert('private')</script>")
    r=post_import(client,csrf,data)
    assert r.status_code==303,r.text
    assert post_import(client,csrf,data).status_code==409
    row=gate._exec("SELECT import_id,status,payload FROM experience_imported_cases",get=True)[0]
    identifier=row[0]
    assert row[1]=="pending"
    assert "只有原始私密问题" not in row[2]
    assert "sk-NO-TRANSFER" not in row[2]
    dashboard=client.get("/admin")
    assert "<script>alert('private')</script>" not in dashboard.text
    assert "&lt;script&gt;" in dashboard.text
    bad=client.post("/admin/imported/review",data={
        "csrf":"wrong","import_id":identifier,"action":"approved","reviewer_note":"reviewed"})
    assert bad.status_code==403
    good=client.post("/admin/imported/review",data={
        "csrf":csrf,"import_id":identifier,"action":"rejected",
        "reviewer_note":"不同解释尚待核验"})
    assert good.status_code==303
    state=gate._exec("SELECT status,reviewer_note FROM experience_imported_cases WHERE import_id=?",
                     (identifier,),get=True)[0]
    assert state==("rejected","不同解释尚待核验")
    exported=client.get("/admin/export")
    assert exported.status_code==200
    results=exported.json()
    assert len(results["owner_imported_cases"])==1
    assert results["owner_imported_cases"][0]["status"]=="rejected"
    assert results["owner_imported_cases"][0]["independently_verified"] is False
    assert results["owner_imported_cases"][0]["reviewer_note"]=="不同解释尚待核验"
    rm=client.post("/admin/imported/review",data={
        "csrf":csrf,"import_id":identifier,"action":"deleted"})
    assert rm.status_code==303
    assert gate._exec("SELECT import_id FROM experience_imported_cases",get=True)==[]


def test_guest_cannot_import_and_bad_shares_reject_without_db_edit(admin_client,monkeypatch):
    client,csrf=admin_client
    monkeypatch.setattr(gate,"_persistent_case_store",lambda:True)
    raw=sample_case()
    raw["case"]["original_numbers"]=[10,6,7,8,9,6]
    assert post_import(client,csrf,raw).status_code==422
    client.post("/admin/logout",data={"csrf":csrf})
    assert client.post("/admin/import-case",data={
        "csrf":csrf,"share_json":json.dumps(sample_case()),"reviewed":"yes"
    }).status_code==303
    assert gate._exec("SELECT import_id FROM experience_imported_cases",get=True)==[]
