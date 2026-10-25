"""V34 portable owner archive restoration: admin/CSRF, validation and fail-closed DB."""
import copy
import hashlib
import json
import re

import pytest
from fastapi.testclient import TestClient

from app.main import app
import app.experience_gateway as gate
from app.experience_backup_restore import (
    CLOUD_BACKUP_FORMAT,parse_owner_imported_backup,MAX_RESTORE_CASES)
from app.experience_case_archive import CaseImportError


def record(source="portable-record-1",status="approved",before="事前研究先封存，不可被后续覆盖"):
    ident=hashlib.sha256(source.encode("utf-8")).hexdigest()
    return {
        "id":ident,"source_key":source,"imported_at":"2026-10-23T16:00:00Z",
        "status":status,"reviewer_note":"保留站长复盘原意见",
        "independently_verified":False,
        "case":{"original_numbers":[7,8,9,6,7,8],
            "before":before,"ben_gua":"水天需","bian_gua":"火天大有",
            "day_ganzhi":"甲子","month_branch":"辰",
            "selected_position":3,"chosen_category":"父母",
            "created_at":"2026-10-22T09:00:00Z",
            "feedback":[{"result_type":"未吻合","observations":"实际与之前研判不同",
                         "recorded_at":"2026-10-24T09:00:00Z"}],
            "private_question":"不能转发的私密问题",
            "api_key":"sk-DO-NOT-ARCHIVE"}
    }


def backup(items=None,old=False):
    items=[record()] if items is None else items
    d={"exported_at":"2026-10-26T09:00:00Z",
        "cases":[{"case_id":"guest-case-hidden"}],
        "events":[{"device":"private-device-data"}],
        "owner_imported_cases":items}
    if not old:
        d.update(format=CLOUD_BACKUP_FORMAT,version=2)
    return d


@pytest.fixture
def owner(monkeypatch,tmp_path):
    monkeypatch.setenv("ACCESS_GATE_ENABLED","0")
    monkeypatch.setenv("ADMIN_PORTAL_ENABLED","1")
    monkeypatch.setenv("APP_SESSION_SECRET","v34-session-signing-key-longer-than-32")
    monkeypatch.setenv("ADMIN_PASSWORD","owner-v34-test-password")
    monkeypatch.setenv("EXPERIENCE_SQLITE_PATH",str(tmp_path/"v34-private.db"))
    monkeypatch.delenv("DATABASE_URL",raising=False)
    monkeypatch.setattr(gate,"_SCHEMA_READY",False)
    with gate._RATE_LOCK:
        gate._RATE.clear()
    c=TestClient(app,base_url="https://testserver",follow_redirects=False)
    page=c.get("/admin/login")
    assert page.status_code==200
    proof=re.search(r"name='login_proof' value='([^']+)'",page.text).group(1)
    res=c.post("/admin/login",data={"login_proof":proof,"password":"owner-v34-test-password"})
    assert res.status_code==303
    return c,c.get("/api/experience/session").json()["csrf"]


def submit(c,csrf,b,confirm="yes",headers=None):
    return c.post("/admin/restore-imported",headers=headers or {},data={
        "csrf":csrf,"restore_confirm":confirm,
        "backup_json":json.dumps(b,ensure_ascii=False)})


def test_v34_owner_backup_parser_accepts_current_and_legacy_but_strips_untrusted_fields():
    for old in (False,True):
        rows=parse_owner_imported_backup(json.dumps(backup(old=old),ensure_ascii=False))
        assert len(rows)==1
        case=json.loads(rows[0][4])["case"]
        assert case["before"]=="事前研究先封存，不可被后续覆盖"
        assert rows[0][3]=="approved"
        assert rows[0][5]=="保留站长复盘原意见"
        source=json.dumps(rows,ensure_ascii=False)
        assert "sk-DO-NOT-ARCHIVE" not in source
        assert "private_question" not in source
        assert "private-device-data" not in source
        assert "guest-case-hidden" not in source


@pytest.mark.parametrize("change",["id","status","source","note","duplicate","format","too_many"])
def test_v34_reject_invalid_backups_before_db_write(change):
    data=backup()
    if change=="id": data["owner_imported_cases"][0]["id"]="not-the-source-hash"
    elif change=="status":data["owner_imported_cases"][0]["status"]="unknown"
    elif change=="source":data["owner_imported_cases"][0]["source_key"]=""
    elif change=="note":data["owner_imported_cases"][0]["reviewer_note"]="x"*601
    elif change=="duplicate":data["owner_imported_cases"].append(copy.deepcopy(data["owner_imported_cases"][0]))
    elif change=="format":data["format"]="false-format"
    elif change=="too_many":
        data["owner_imported_cases"]=[record("id-"+str(i)) for i in range(MAX_RESTORE_CASES+1)]
    with pytest.raises(CaseImportError):
        parse_owner_imported_backup(json.dumps(data,ensure_ascii=False))


def test_v34_unconfigured_db_disables_server_restore_and_preserves_open_academy(owner):
    c,csrf=owner
    dashboard=c.get("/admin")
    assert "云端正式收案尚未启用" in dashboard.text
    assert "恢复以前的云端案例备份" not in dashboard.text
    assert submit(c,csrf,backup()).status_code==503
    assert gate._exec("SELECT import_id FROM experience_imported_cases",get=True)==[]
    assert c.get("/").status_code in (200,404)


def test_v34_admin_and_signed_csrf_required_for_restore(owner,monkeypatch):
    c,csrf=owner
    monkeypatch.setattr(gate,"_persistent_case_store",lambda:True)
    assert submit(c,"invalid",backup()).status_code==403
    assert submit(c,csrf,backup(),confirm="no").status_code==422
    assert submit(c,csrf,backup(),headers={"Sec-Fetch-Site":"cross-site"}).status_code==403
    assert gate._exec("SELECT import_id FROM experience_imported_cases",get=True)==[]
    c.post("/admin/logout",data={"csrf":csrf})
    assert submit(c,csrf,backup()).status_code==303


def test_v34_restore_is_atomic_and_does_not_overwrite_existing_status_notes(owner,monkeypatch):
    c,csrf=owner
    monkeypatch.setattr(gate,"_persistent_case_store",lambda:True)
    prior=record("already-exists","rejected","原有封存事前原话")
    gate._exec("INSERT INTO experience_imported_cases VALUES (?,?,?,?,?,?)",
        (prior["id"],prior["source_key"],prior["imported_at"],prior["status"],
         json.dumps({"case":prior["case"]},ensure_ascii=False),"原有复核备注，不能被恢复文件覆盖"))
    incoming=[record("already-exists","approved","备份企图改变内容"),
              record("new-import","approved","新增资料")]
    resp=submit(c,csrf,backup(incoming))
    assert resp.status_code==303,resp.text
    assert resp.headers["location"]=="/admin?restore_added=1&restore_skipped=1"
    prior_saved=gate._exec("SELECT status,payload,reviewer_note FROM experience_imported_cases WHERE import_id=?",
                           (prior["id"],),get=True)[0]
    assert prior_saved[0]=="rejected"
    assert json.loads(prior_saved[1])["case"]["before"]=="原有封存事前原话"
    assert prior_saved[2]=="原有复核备注，不能被恢复文件覆盖"
    new=gate._exec("SELECT status,payload FROM experience_imported_cases WHERE import_id=?",
                   (record("new-import")["id"],),get=True)
    assert new[0][0]=="approved"
    assert "sk-DO-NOT-ARCHIVE" not in new[0][1]
    exported=c.get("/admin/export")
    assert exported.status_code==200
    assert exported.json()["format"]==CLOUD_BACKUP_FORMAT
    assert exported.json()["version"]==2
    assert len(exported.json()["owner_imported_cases"])==2
    dashboard=c.get(resp.headers["location"])
    assert "跳过已有编号 1 份" in dashboard.text


def test_v34_invalid_later_case_does_not_restore_valid_earlier_case(owner,monkeypatch):
    c,csrf=owner
    monkeypatch.setattr(gate,"_persistent_case_store",lambda:True)
    items=[record("valid-one"),record("bad-two")]
    items[1]["case"]["original_numbers"]=[10,7,8,9,7,8]
    response=submit(c,csrf,backup(items))
    assert response.status_code==422
    assert gate._exec("SELECT import_id FROM experience_imported_cases",get=True)==[]


def test_v34_backup_preview_html_has_explicit_manual_consent_and_privacy(owner,monkeypatch):
    c,_=owner
    monkeypatch.setattr(gate,"_storage_status",lambda:{
        "state":"ready","connected":True,"store":"postgresql",
        "description":"测试环境连接可用"})
    dashboard=c.get("/admin")
    assert dashboard.status_code==200
    assert "V34 · 恢复以前的云端案例备份" in dashboard.text
    assert "不恢复访客活动日志" in dashboard.text
    assert "我已核查这是自己导出的备份" in dashboard.text
    assert "同编号内容不同也不会覆盖现有记录" in dashboard.text
