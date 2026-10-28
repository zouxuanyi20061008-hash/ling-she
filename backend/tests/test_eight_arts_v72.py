"""V72 八门统一验收契约：不能以 API 200 或菜单出现替代真计算。"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from scripts.eight_arts_v72_audit import SCHOOLS, audit_all, verify_structure


def test_eight_schools_all_exist_at_deterministic_cast_routes():
    assert list(SCHOOLS)==[
        "meihua","liuyao","qimen","bazi","liuren","taiyi","ziwei","fengshui"]
    client=TestClient(app)
    for school,case in SCHOOLS.items():
        result=client.post(case["route"],json=case["payload"])
        assert result.status_code==200,(school,result.text)
        assert verify_structure(school,result.json())
        assert case["verified"] and case["pending"]
        assert not case["route"].startswith("/api/interpret")


@pytest.mark.parametrize("school",list(SCHOOLS))
def test_each_school_forbids_ghost_fields_and_ambiguous_timezone(school):
    case=SCHOOLS[school]
    client=TestClient(app)
    for key,value in (("bogus_v72",True),("timezone","Asia/Tokyo"),
                      ("latitude",35.0)):
        res=client.post(case["route"],json={**case["payload"],key:value})
        assert res.status_code==422,(school,key,res.status_code,res.text)


@pytest.mark.parametrize("value",[7.0,True,"7"])
def test_liuyao_rejects_coerced_coin_state(value):
    res=TestClient(app).post("/api/liuyao/cast",json={"numbers":[7]*5+[value]})
    assert res.status_code==422,res.text


@pytest.mark.parametrize("value",[2026.0,True,"2026"])
def test_taiyi_rejects_coerced_annual_year(value):
    res=TestClient(app).post("/api/taiyi/cast",json={"gregorian_year":value})
    assert res.status_code==422,res.text


def test_orphan_time_not_silently_discarded():
    client=TestClient(app)
    for path,payload in (
        ("/api/fengshui/cast",{"bearing_degrees":180,"foundation_clock":"12:00"}),
        ("/api/bazi/cast",{"solar_date":"2026-02-04","clock":"12:00","flow_clock":"12:00"}),
    ):
        res=client.post(path,json=payload)
        assert res.status_code==422,(path,res.text)


def test_full_v72_artifact_records_scope_and_all_eight_not_full_judgements():
    audit=audit_all()
    assert audit["status"]=="passed"
    assert audit["school_count"]==audit["passed_school_count"]==8
    assert len(audit["schools"])==8
    assert all(row["status"]=="calculated_with_known_limits" for row in audit["schools"])
    assert all(row["not_yet_complete"] for row in audit["schools"])
    assert audit["contract_guards"]["unknown_fields_rejected_for_each_school"]
