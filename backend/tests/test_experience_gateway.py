"""V29 login gate regression: owner independent from public academy, mobile proxy-safe."""
import json
import re
import pytest
from fastapi.testclient import TestClient
from app.main import app
import app.experience_gateway as gate


@pytest.fixture
def setup_beta(monkeypatch,tmp_path):
    monkeypatch.setenv("ACCESS_GATE_ENABLED","1")
    monkeypatch.delenv("ADMIN_PORTAL_ENABLED",raising=False)
    monkeypatch.setenv("APP_SESSION_SECRET","session-secret-longer-than-thirty-two-characters-for-tests")
    monkeypatch.setenv("ADMIN_PASSWORD","private-owner-password-not-for-guests")
    monkeypatch.setenv("FRIEND_INVITES_JSON",json.dumps(
        {"DEMOFRIEND88":"测试朋友一","DEMOFRIEND99":"测试朋友二"}))
    monkeypatch.setenv("EXPERIENCE_SQLITE_PATH",str(tmp_path/"experience.db"))
    monkeypatch.delenv("DATABASE_URL",raising=False)
    monkeypatch.setattr(gate,"_SCHEMA_READY",False)
    with gate._RATE_LOCK:
        gate._RATE.clear()
    return TestClient(app,base_url="https://testserver",follow_redirects=False)


def _proof(client,path):
    r=client.get(path)
    assert r.status_code==200,r.text
    found=re.search(r"name='login_proof' value='([^']+)'",r.text)
    assert found is not None
    assert "httponly" in r.headers["set-cookie"].lower()
    assert "secure" in r.headers["set-cookie"].lower()
    assert "samesite=lax" in r.headers["set-cookie"].lower()
    return found.group(1)


def login_guest(client,analytics=False,headers=None):
    proof=_proof(client,"/invite")
    response=client.post("/invite",headers=headers or {},
             data={"login_proof":proof,"code":"DEMOFRIEND88",
                   "analytics":"yes" if analytics else "no"})
    assert response.status_code==303,response.text
    assert "httponly" in response.headers["set-cookie"].lower()
    assert "secure" in response.headers["set-cookie"].lower()
    session=client.get("/api/experience/session")
    assert session.status_code==200
    return session.json()


def login_owner(client,headers=None):
    proof=_proof(client,"/admin/login")
    response=client.post("/admin/login",headers=headers or {},
        data={"login_proof":proof,"password":"private-owner-password-not-for-guests"})
    assert response.status_code==303,response.text
    session=client.get("/api/experience/session")
    assert session.status_code==200
    return session.json()


def test_gate_blocks_uninvited_public_and_owner_data(setup_beta):
    c=setup_beta
    assert c.get("/health").json()["status"]=="ok"
    assert c.get("/").headers["location"]=="/invite"
    assert c.get("/api/liuyao/cast").status_code==401
    assert c.get("/admin/export").headers["location"]=="/admin/login"
    nonce=_proof(c,"/invite")
    bad=c.post("/invite",data={"login_proof":nonce,"code":"WRONGCODE"})
    assert bad.status_code==403


def test_mobile_null_origin_and_forwarded_host_still_allow_valid_login(setup_beta):
    c=setup_beta
    mobile={"Origin":"null","Referer":"https://proxy.example.invalid/admin/login",
            "Sec-Fetch-Site":"same-origin"}
    guest=login_guest(c,False,headers=mobile)
    assert guest["role"]=="guest"
    assert guest["analytics"] is False
    assert c.get("/admin").headers["location"]=="/admin/login"
    assert c.post("/api/experience/event",
                  headers={"X-Experience-Csrf":guest["csrf"]},
                  json={"module":"liuyao"}).json()["recorded"] is False
    assert c.post("/api/experience/event",json={"module":"liuyao"}).status_code==403
    owner=login_owner(c,headers=mobile)
    assert owner["role"]=="admin"
    assert c.get("/admin").status_code==200


def test_signed_form_proof_required_and_cross_site_requests_denied(setup_beta):
    c=setup_beta
    assert c.post("/admin/login",data={"password":"private-owner-password-not-for-guests"}).status_code==403
    proof=_proof(c,"/admin/login")
    r=c.post("/admin/login",data={"login_proof":"tampered."+proof,"password":"private-owner-password-not-for-guests"})
    assert r.status_code==403
    r=c.post("/admin/login",headers={"Sec-Fetch-Site":"cross-site"},
             data={"login_proof":proof,"password":"private-owner-password-not-for-guests"})
    assert r.status_code==403
    good=c.post("/admin/login",data={"login_proof":proof,"password":"private-owner-password-not-for-guests"})
    assert good.status_code==303


def test_consent_escapes_untrusted_content_and_review_requires_admin(setup_beta):
    c=setup_beta
    guest=login_guest(c,True)
    csrf={"X-Experience-Csrf":guest["csrf"]}
    assert c.post("/api/experience/event",headers=csrf,
                  json={"module":"liuyao"}).json()["recorded"] is True
    assert c.post("/api/experience/cases",headers=csrf,
                  json={"share_consent":False,"case":{"original_numbers":[7]*6,"before":"记录"}}).status_code==422
    assert c.post("/api/experience/cases",headers={**csrf,"Sec-Fetch-Site":"cross-site"},
                  json={"share_consent":True,"case":{"original_numbers":[7]*6,"before":"记录"}}).status_code==403
    sample={"original_numbers":[7]*6,"before":"<script>alert('unsafe')</script>",
            "question":"私人问题不得被上传","x-user-api-key":"sk-NEVER-SEND"}
    submitted=c.post("/api/experience/cases",headers=csrf,json={"share_consent":True,"case":sample})
    assert submitted.status_code==200,submitted.text
    cid=submitted.json()["case_id"]
    assert c.get("/admin/export").headers["location"]=="/admin/login"
    owner=login_owner(c)
    assert owner["role"]=="admin"
    dashboard=c.get("/admin")
    assert dashboard.status_code==200
    assert "<script>alert('unsafe')</script>" not in dashboard.text
    assert "&lt;script&gt;" in dashboard.text
    payload=c.get("/admin/export").json()
    assert len(payload["cases"])==1
    assert "question" not in payload["cases"][0]["case"]
    assert "x-user-api-key" not in payload["cases"][0]["case"]
    assert c.post("/admin/review",data={"case_id":cid,"action":"approved","csrf":"wrong"}).status_code==403
    assert c.post("/admin/review",data={"case_id":cid,"action":"approved","csrf":owner["csrf"]}).status_code==303
    assert c.get("/admin/export").json()["cases"][0]["status"]=="approved"


def test_valid_password_not_locked_out_by_other_invalid_attempts(setup_beta):
    c=setup_beta
    proof=_proof(c,"/admin/login")
    for _ in range(12):
        wrong=c.post("/admin/login",data={"login_proof":proof,"password":"wrong"})
    assert wrong.status_code==429
    good=c.post("/admin/login",data={"login_proof":proof,
                 "password":"private-owner-password-not-for-guests"})
    assert good.status_code==303
    # Logout before switching role; authenticated users are redirected away
    # from both login forms by design.
    owner=c.get("/api/experience/session").json()
    assert c.post("/api/experience/logout",
                  headers={"X-Experience-Csrf":owner["csrf"]}).status_code==200
    proof=_proof(c,"/invite")
    for _ in range(13):
        wrong=c.post("/invite",data={"login_proof":proof,"code":"BAD-CODE-0000"})
    assert wrong.status_code==429
    good=c.post("/invite",data={"login_proof":proof,"code":"DEMOFRIEND88"})
    assert good.status_code==303


def test_public_academy_remains_open_when_owner_portal_enabled(setup_beta,monkeypatch):
    c=setup_beta
    monkeypatch.setenv("ACCESS_GATE_ENABLED","0")
    monkeypatch.setenv("ADMIN_PORTAL_ENABLED","1")
    assert c.get("/").status_code in (200,404)
    assert c.get("/invite").status_code==200
    assert "公开体验" in c.get("/invite").text
    assert c.get("/admin").headers["location"]=="/admin/login"
    assert c.get("/admin/export").headers["location"]=="/admin/login"
    owner=login_owner(c,headers={"Origin":"null","Sec-Fetch-Site":"same-origin"})
    assert owner["role"]=="admin"
    dash=c.get("/admin")
    assert dash.status_code==200
    assert "普通书院目前公开访问" in dash.text
    assert c.get("/admin/export").status_code==200
    assert c.get("/").status_code in (200,404)


def test_disabled_owner_portal_cannot_open_with_known_password(setup_beta,monkeypatch):
    c=setup_beta
    monkeypatch.setenv("ACCESS_GATE_ENABLED","0")
    monkeypatch.setenv("ADMIN_PORTAL_ENABLED","0")
    assert "暂未启用" in c.get("/admin/login").text
    assert c.post("/admin/login",data={"password":"private-owner-password-not-for-guests"}).status_code==503
    assert c.get("/admin").status_code==503
    assert c.get("/admin/export").status_code==503
    assert c.get("/").status_code in (200,404)


def test_password_rotation_revokes_old_owner_session(setup_beta,monkeypatch):
    c=setup_beta
    login_owner(c)
    assert c.get("/admin").status_code==200
    monkeypatch.setenv("ADMIN_PASSWORD","different-password-rotated")
    assert c.get("/admin").headers["location"]=="/admin/login"
    assert c.get("/admin/export").headers["location"]=="/admin/login"


def test_no_cross_site_case_submit_without_signed_session(setup_beta):
    c=setup_beta
    guest=login_guest(c,True)
    wrong=c.post("/api/experience/cases",headers={"X-Experience-Csrf":"bad"},
                 json={"share_consent":True,"case":{"original_numbers":[7]*6,"before":"研究"}})
    assert wrong.status_code==403
    assert c.post("/api/experience/logout",
             headers={"X-Experience-Csrf":guest["csrf"]}).status_code==200
    assert c.get("/api/experience/session").status_code==401


def test_standalone_owner_can_log_out_without_closing_public_academy(setup_beta,monkeypatch):
    c=setup_beta
    monkeypatch.setenv("ACCESS_GATE_ENABLED","0")
    monkeypatch.setenv("ADMIN_PORTAL_ENABLED","1")
    owner=login_owner(c)
    assert "安全退出站长后台" in c.get("/admin").text
    assert c.post("/admin/logout",data={"csrf":"bad"}).status_code==403
    result=c.post("/admin/logout",data={"csrf":owner["csrf"]},
                  headers={"Origin":"null"})
    assert result.status_code==303
    assert result.headers["location"]=="/admin/login"
    assert c.get("/admin").headers["location"]=="/admin/login"
    assert c.get("/").status_code in (200,404)
