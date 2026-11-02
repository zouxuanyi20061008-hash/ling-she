"""V90 NCL-06604 明钞本扫描前段页序定位与未决状态保护。"""
from copy import deepcopy
from datetime import date, time

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.taiyi_hour_v77 import hour_basic_board
from app.core.taiyi_hour_v90 import audit_ming_scan_page_locator, decorate_taiyi_v90
from app.core.taiyi_hour_v91 import audit_cadal_volume_five_to_ten, decorate_taiyi_v91


def test_v90_maps_only_the_nine_visually_reviewed_scan_pages():
    chart = hour_basic_board(date(2026, 10, 28), time(17, 30))
    locator = chart["hour_v90_scan_locator"]
    witness = locator["witness"]
    structure = locator["scan_structure"]
    assert locator["version"] == "V90"
    assert locator["status"] == "opening_scan_pages_mapped_volume_nine_leaf_not_located"
    assert witness["edition"] == "明钞本"
    assert witness["volume_count"] == 10 and witness["bound_volume_count"] == 4
    assert witness["scan_page_count"] == 124
    assert witness["scan_sha1"] == "46b2774f6d66fb61db3617673672ec721bdc0904"
    assert structure["visually_reviewed_page_numbers"] == list(range(1, 13))
    assert structure["visually_reviewed_page_count"] == 12
    assert structure["opening_preface_pages"] == [1, 2, 3]
    assert structure["blank_page_numbers"] == [4]
    assert structure["volume_one_title_and_contents_start_page"] == 5
    assert structure["volume_one_contents_pages"] == [6, 7, 8]
    assert structure["volume_one_body_start_page"] == 9
    assert structure["volume_one_body_reviewed_pages"] == [9, 10, 11, 12]
    assert structure["volume_nine_start_page"] is None
    assert structure["page_sequence_extrapolated_beyond_reviewed_pages"] is False
    assert [p["scan_page"] for p in locator["scan_page_map"]] == list(range(1, 13))
    assert all(p["visually_reviewed"] for p in locator["scan_page_map"])
    assert locator["target_passage"]["target_leaf_or_scan_page"] is None
    assert locator["target_passage"]["full_text_collation_status"] == "not_started"
    assert locator["target_passage"]["transcribed_ming_reading"] is None
    assert locator["can_resolve_v87_conflict"] is False
    assert locator["may_emend_text"] is False
    assert locator["preferred_correction"] is None
    assert chart["has_full_hour_chart"] is False


def test_v90_keeps_siku_transcription_separate_from_the_ming_scan():
    locator = audit_ming_scan_page_locator()
    baseline = locator["siku_transcription_baseline"]
    assert "第三纪第五十二局乙卯时" in baseline["text"]
    assert "巳为计神" in baseline["text"]
    assert baseline["edition_family"] == "四库全书本转录"
    assert baseline["is_ncl_ming_manuscript_transcription"] is False
    assert baseline["is_independent_manuscript_witness"] is False
    assert len(baseline["transcription_sources"]) == 3
    fields = locator["target_passage"]["source_key_fields"]
    assert fields["six_ji_number"] == 3
    assert fields["ju"] == 52
    assert fields["hour_ganzhi_from_jiazi_start"] == "乙卯"
    assert fields["jishen"] == "巳"
    assert fields["shiji_god"] == "太簇"


def test_v90_rejects_v89_claims_that_the_target_leaf_or_correction_is_known():
    chart = hour_basic_board(date(2026, 12, 23), time(10, 30))
    tampered = deepcopy(chart)
    tampered["hour_v89_digitized_witness_census"]["can_resolve_v87_conflict"] = True
    with pytest.raises(ValueError, match="V90"):
        decorate_taiyi_v90(tampered)
    tampered = deepcopy(chart)
    tampered["hour_v89_digitized_witness_census"]["preferred_correction"] = "改为第一纪"
    with pytest.raises(ValueError, match="V90"):
        decorate_taiyi_v90(tampered)


def test_v90_hour_api_exposes_scan_locator_without_changing_annual_endpoint():
    client = TestClient(app)
    response = client.post("/api/taiyi/hour/cast", json={
        "solar_date": "2026-10-28", "clock": "17:30"
    })
    assert response.status_code == 200, response.text
    data = response.json()
    locator = data["hour_v90_scan_locator"]
    assert locator["scan_structure"]["volume_one_body_start_page"] == 9
    assert locator["target_passage"]["target_leaf_or_scan_page"] is None
    assert data["has_full_hour_chart"] is False
    annual = client.post("/api/taiyi/cast", json={"gregorian_year": 2026})
    assert annual.status_code == 200
    assert "hour_v90_scan_locator" not in annual.json()



def test_v91_registers_cadal_volume_five_to_ten_as_siku_scan_only():
    data = audit_cadal_volume_five_to_ten()
    scan = data["candidate_scan"]
    assert data["version"] == "V91" and data["target_volume"] == 9
    assert scan["id"] == "cadal_06056495"
    assert scan["volumes_included"] == [5, 6, 7, 8, 9, 10]
    assert scan["volume_nine_included"] is True and scan["scan_page_count"] == 120
    assert scan["edition_family"] == "四库全书系统"
    assert scan["volume_nine_scan_page"] is None and scan["target_passage_page"] is None
    assert scan["visually_reviewed_pages"] == []
    assert scan["independent_ming_witness"] is False
    assert data["historical_conflict_resolved"] is False


def test_v91_decorates_hour_chart_without_claiming_ming_collation():
    chart = hour_basic_board(date(2026, 10, 28), time(17, 30))
    result = decorate_taiyi_v91(chart)
    assert result["hour_v91_cadal_volume_locator"]["candidate_scan"]["volume_nine_included"]
    assert result["hour_v91_cadal_volume_locator"]["candidate_scan"]["target_passage_page"] is None
    assert result["has_verified_independent_yin_variant"] is False
    assert result["has_full_hour_chart"] is False


def test_v91_rejects_non_v90_input():
    with pytest.raises(ValueError, match="V91"):
        decorate_taiyi_v91({"hour_scan_locator_version": "V89"})


def test_v91_hour_api_exposes_cadal_locator_only_on_hour_endpoint():
    client = TestClient(app)
    response = client.post("/api/taiyi/hour/cast", json={
        "solar_date": "2026-10-28", "clock": "17:30"
    })
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["hour_v91_cadal_volume_locator"]["candidate_scan"]["volume_nine_included"]
    assert data["hour_v91_cadal_volume_locator"]["candidate_scan"]["target_passage_page"] is None
    annual = client.post("/api/taiyi/cast", json={"gregorian_year": 2026})
    assert annual.status_code == 200
    assert "hour_v91_cadal_volume_locator" not in annual.json()
