import pytest
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def preflight(origin, path, headers="content-type"):
    return client.options(path, headers={
        "Origin": origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": headers,
    })


@pytest.mark.parametrize("origin", ["null", "https://appassets.androidplatform.net"])
def test_packaged_origins_can_read_public_api_responses(monkeypatch, origin):
    monkeypatch.setenv("ACCESS_GATE_ENABLED", "0")
    health = client.get("/health", headers={"Origin": origin})
    assert health.status_code == 200
    assert health.headers["access-control-allow-origin"] == origin

    chart = preflight(origin, "/api/fengshui/cast")
    assert chart.status_code == 200
    assert chart.headers["access-control-allow-origin"] == origin
    assert "access-control-allow-credentials" not in chart.headers
    assert "Origin" in chart.headers["vary"]

    interpretation = preflight(origin, "/api/interpret", "content-type,x-user-api-key")
    assert interpretation.status_code == 200
    assert interpretation.headers["access-control-allow-origin"] == origin

    response = client.post("/api/fengshui/cast", headers={"Origin": origin}, json={"bearing_degrees": 90})
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin
    assert "access-control-allow-credentials" not in response.headers


def test_packaged_cors_keeps_private_routes_and_unrelated_origins_out():
    for path in ("/api/experience/cases", "/api/experience/session", "/admin/export"):
        response = preflight("null", path)
        assert response.status_code == 400
        assert "access-control-allow-origin" not in response.headers

    for origin in ("https://unrelated.example", "https://appassets.androidplatform.net.unrelated.example"):
        response = preflight(origin, "/api/liuyao/cast")
        assert response.status_code == 400
        assert "access-control-allow-origin" not in response.headers

    assert preflight("null", "/api/interpret", "x-experience-csrf").status_code == 400
    assert preflight("http://localhost:5173", "/api/experience/cases", "x-experience-csrf").status_code == 200


def test_packaged_cors_does_not_bypass_invitation_gate(monkeypatch):
    monkeypatch.setenv("ACCESS_GATE_ENABLED", "1")
    assert preflight("null", "/api/fengshui/cast").status_code == 200
    response = client.post("/api/fengshui/cast", headers={"Origin": "null"}, json={"bearing_degrees": 90})
    assert response.status_code == 401
    assert response.headers["access-control-allow-origin"] == "null"
