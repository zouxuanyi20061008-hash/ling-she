"""V89 数字化见证谱系清点：不把重复扫描或来源不明文件冒充独立异本。"""
from copy import deepcopy
from datetime import date, time

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.taiyi_hour_v77 import hour_basic_board
from app.core.taiyi_hour_v89 import audit_digitized_witness_families, decorate_taiyi_v89


def test_v89_classifies_all_seven_digitized_resources_without_inflating_independent_witnesses():
    chart = hour_basic_board(date(2026, 10, 28), time(17, 30))
    census = chart["hour_v89_digitized_witness_census"]
    counts = census["source_family_counts"]
    assert census["version"] == "V89"
    assert census["catalogue_category_resource_count"] == 7
    assert counts == {
        "catalogued_ming_manuscript_candidate": 1,
        "siku_transmission": 4,
        "unattributed_scan": 2,
    }
    assert len(census["resources"]) == 7
    assert sum(r["independent_textual_witness_verified"] for r in census["resources"]) == 0
    assert census["lineage_conclusion"]["verified_independent_textual_witnesses"] == 0
    assert census["lineage_conclusion"]["unattributed_files_count_as_independent"] is False
    assert census["lineage_conclusion"]["siku_files_count_as_independent"] is False
    ncl = census["ncl_ming_manuscript"]
    assert ncl["scan_page_count"] == 124
    assert ncl["scan_preview_pages_inspected"] == [2, 3]
    assert ncl["target_leaf_or_scan_page"] is None
    assert ncl["full_text_collation_status"] == "not_started"
    assert census["can_resolve_v87_conflict"] is False
    assert census["may_emend_text"] is False
    assert census["preferred_correction"] is None
    assert chart["has_verified_independent_yin_variant"] is False
    assert chart["has_full_hour_chart"] is False


def test_v89_explicitly_identifies_siku_and_unattributed_files():
    census = audit_digitized_witness_families()
    resources = {r["id"]: r for r in census["resources"]}
    assert resources["cadal_06056495"]["classification"] == "siku_transmission"
    assert "四库全书" in resources["cadal_06056495"]["source_evidence"]
    assert resources["ssid_13003380_siku"]["classification"] == "siku_transmission"
    assert resources["ssid_12326977"]["classification"] == "unattributed_scan"
    assert resources["ssid_12326978"]["classification"] == "unattributed_scan"
    assert resources["ncl_06604_ming_manuscript"]["classification"] == "catalogued_ming_manuscript_candidate"


def test_v89_rejects_a_v88_record_that_claims_an_unverified_correction():
    chart = hour_basic_board(date(2026, 12, 23), time(10, 30))
    tampered = deepcopy(chart)
    tampered["hour_v88_manuscript_witness_registry"]["preferred_correction"] = "改为第一纪"
    with pytest.raises(ValueError, match="V89"):
        decorate_taiyi_v89(tampered)
    tampered = deepcopy(chart)
    tampered["hour_v88_manuscript_witness_registry"]["collation"]["target_leaf_or_page"] = 98
    with pytest.raises(ValueError, match="V89"):
        decorate_taiyi_v89(tampered)


def test_v89_api_exposes_source_census_only_on_hour_endpoint():
    client = TestClient(app)
    response = client.post("/api/taiyi/hour/cast", json={
        "solar_date": "2026-10-28", "clock": "17:30"
    })
    assert response.status_code == 200, response.text
    data = response.json()
    census = data["hour_v89_digitized_witness_census"]
    assert census["source_family_counts"]["siku_transmission"] == 4
    assert census["source_family_counts"]["unattributed_scan"] == 2
    assert census["ncl_ming_manuscript"]["target_leaf_or_scan_page"] is None
    assert data["has_full_hour_chart"] is False
    annual = client.post("/api/taiyi/cast", json={"gregorian_year": 2026})
    assert annual.status_code == 200
    assert "hour_v89_digitized_witness_census" not in annual.json()
