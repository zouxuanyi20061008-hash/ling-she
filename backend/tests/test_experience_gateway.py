"""Private-beta regression: no public app access, owner isolation, opt-in cases."""
import json
import pytest
from fastapi.testclient import TestClient
from app.main import app
import app.experience_gateway as gate


@pytest.fixture
def setup_beta(monkeypatch,tmp_path):
    monkeypatch.setenv("ACCESS_GATE_ENABLED","1")
    monkeypatch.setenv("APP_SESSION_SECRET","session-secret-longer-than-thirty-two-characters-for-tests")
    monkeypatch.setenv("ADMIN_PASSWORD","private-owner-password-not-for-guests")
    monkeypatch.setenv("FRIEND_INVITES_JSON",json.dumps({"DEMOFRIEND88":"测试朋友一","DEMOFRIEND99":"测试朋友二"}))
    monkeypatch.setenv("EXPERIENCE_SQLITE_PATH",str(tmp_path/"experience.db"))
    monkeypatch.delenv("DATABASE_URL",raising=False)
    monkeypatch.setattr(gate,"_SCHEMA_READY",False)
    with gate._RATE_LOCK:
        gate._RATE.clear()
    return TestClient(app,base_url="https://testserver",follow_redirects=False)


def login_guest(client,analytics=False):
    response=client.post("/invite",data={"code":"DEMOFRIEND88",
                                       "analytics":"yes" if analytics else "no"})
    assert response.status_code==303
    assert "httponly" in response.headers["set-cookie"].lower()
    assert "secure" in response.headers["set-cookie"].lower()
    return client.get("/api/experience/session").json()


def login_owner(client):
    result=client.post("/admin/login",data={"password":"private-owner-password-not-for-guests"})
    assert result.status_code==303
    return client.get("/api/experience/session").json()


def test_no_auth_denies_spa_backend_and_admin(setup_beta):
    c=setup_beta
    assert c.get("/health").json()["status"]=="ok"
    assert c.get("/").status_code==303
    assert c.get("/").headers["location"]=="/invite"
    assert c.get("/api/liuyao/cast").status_code==401
    assert c.get("/admin/export").status_code==303
    assert c.get("/admin/export").headers["location"]=="/admin/login"
    assert c.get("/invite").status_code==200
    bad=c.post("/invite",data={"code":"WRONGCODE"})
    assert bad.status_code==403


def test_invite_session_consents_and_role_separation(setup_beta):
    c=setup_beta
    guest=login_guest(c,False)
    assert guest["role"]=="guest" and guest["label"]=="测试朋友一"
    assert guest["analytics"] is False
    assert c.get("/").status_code==200 or c.get("/").status_code==404
    assert c.get("/admin").status_code==303
    assert c.post("/api/experience/event",headers={"X-Experience-Csrf":guest["csrf"]},
                  json={"module":"liuyao"}).json()["recorded"] is False
    assert c.post("/api/experience/event",json={"module":"liuyao"}).status_code==403
    assert c.post("/api/experience/cases",
                  headers={"X-Experience-Csrf":guest["csrf"]},
                  json={"share_consent":False,"case":{"original_numbers":[7]*6,"before":"记录"}}).status_code==422


def test_case_is_opt_in_and_review_requires_owner(setup_beta):
    c=setup_beta
    guest=login_guest(c,True)
    csrf={"X-Experience-Csrf":guest["csrf"]}
    assert c.post("/api/experience/event",headers=csrf,json={"module":"liuyao"}).json()["recorded"]
    sample={"original_numbers":[7]*6,"ben_gua":"乾为天","bian_gua":"乾为天",
            "before":"事前研究，与现实核验","feedback":[{"observations":"未有结果"}],
            "question":"私人问题不得被上传","x-user-api-key":"sk-NEVER-SEND"}
    submitted=c.post("/api/experience/cases",headers=csrf,json={"share_consent":True,"case":sample})
    assert submitted.status_code==200,submitted.text
    cid=submitted.json()["case_id"]
    assert c.get("/admin/export").status_code==303
    owner=login_owner(c)
    assert owner["role"]=="admin"
    dashboard=c.get("/admin")
    assert dashboard.status_code==200
    assert "测试朋友一" in dashboard.text
    assert "事前研究" in dashboard.text
    exported=c.get("/admin/export")
    assert exported.status_code==200
    payload=exported.json()
    assert len(payload["cases"])==1
    assert payload["cases"][0]["case"]["before"]=="事前研究，与现实核验"
    assert "question" not in payload["cases"][0]["case"]
    assert "x-user-api-key" not in payload["cases"][0]["case"]
    assert len(payload["events"])>=2
    assert c.post("/admin/review",data={"case_id":cid,"action":"approved","csrf":"wrong"}).status_code==403
    assert c.post("/admin/review",data={"case_id":cid,"action":"approved","csrf":owner["csrf"]}).status_code==303
    assert c.get("/admin/export").json()["cases"][0]["status"]=="approved"


def test_login_and_content_are_escaped_and_wrong_origin_denied(setup_beta):
    c=setup_beta
    guest=login_guest(c,True)
    res=c.post("/api/experience/cases",
       headers={"X-Experience-Csrf":guest["csrf"],"Origin":"https://attacker.example"},
       json={"share_consent":True,"case":{"original_numbers":[7]*6,"before":"test"}})
    assert res.status_code==403
    sample={"original_numbers":[7]*6,"before":"<script>alert('unsafe')</script>"}
    assert c.post("/api/experience/cases",headers={"X-Experience-Csrf":guest["csrf"]},
                  json={"share_consent":True,"case":sample}).status_code==200
    login_owner(c)
    admin=c.get("/admin").text
    assert "<script>alert('unsafe')</script>" not in admin
    assert "&lt;script&gt;" in admin


def test_correct_login_not_blocked_by_proxy_shared_address(setup_beta):
    """Wrong guesses are throttled; valid credentials still work behind a shared IP."""
    c=setup_beta
    for _ in range(12):
        response=c.post("/admin/login",data={"password":"definitely-wrong"})
    assert response.status_code==429
    # A legitimate owner may share the proxy source address with failed requests.
    correct=c.post("/admin/login",
                   data={"password":"private-owner-password-not-for-guests"})
    assert correct.status_code==303
    assert c.get("/api/experience/session").json()["role"]=="admin"

    for _ in range(13):
        response=c.post("/invite",data={"code":"BAD-CODE-0000"})
    assert response.status_code==429
    friend=c.post("/invite",data={"code":"DEMOFRIEND88"})
    assert friend.status_code==303
    assert c.get("/api/experience/session").json()["role"]=="guest"


def test_wrong_origin_is_a_distinct_forbidden_error_not_rate_limit(setup_beta):
    c=setup_beta
    for _ in range(10):
        res=c.post("/admin/login",headers={"Origin":"https://evil.example"},
                  data={"password":"private-owner-password-not-for-guests"})
        assert res.status_code==403
    allowed=c.post("/admin/login",
                  data={"password":"private-owner-password-not-for-guests"})
    assert allowed.status_code==303
