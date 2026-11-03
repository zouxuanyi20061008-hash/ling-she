"""V95 scan candidate inventory and physical-page evidence boundary."""
from datetime import date, time

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.taiyi_hour_v77 import hour_basic_board
from app.core.taiyi_hour_v95 import audit_volume_nine_scan_candidates, decorate_taiyi_v95


def test_v95_registers_eight_candidates_with_conservative_lineage():
    data = audit_volume_nine_scan_candidates()
    assert data["version"] == "V95"
    assert data["candidate_count"] == 8
    assert data["candidate_counts"] == {
        "catalogued_ming_manuscript": 1,
        "siku_transmission_or_candidate": 5,
        "commercial_press_edition_unverified": 2,
        "total": 8,
    }
    by_id = {item["id"]: item for item in data["candidate_sources"]}
    assert by_id["ncl_06604_ming_manuscript"]["page_count"] == 124
    assert by_id["cadal_06056495"]["page_count"] == 120
    assert by_id["cadal_06066055"]["page_count"] == 120
    assert by_id["ssid_13003380_siku"]["page_count"] == 121
    assert by_id["wenyuan_0810_siku"]["page_count"] == 1031
    assert by_id["xiaocui_siku_810_66p"]["page_count"] == 66
    assert by_id["ntut_3100478"]["page_count"] == 148
    assert by_id["ntut_3100479"]["page_count"] == 122


def test_v95_ntut_records_are_not_mislabeled_as_ming_manuscript_or_independent():
    data = audit_volume_nine_scan_candidates()
    ntut = [x for x in data["candidate_sources"] if x["id"].startswith("ntut_")]
    assert len(ntut) == 2
    assert {x["publisher"] for x in ntut} == {"商務印書館"}
    assert {x["publication_year"] for x in ntut} == {None}
    assert all(x["classification"] == "commercial_press_digitization_edition_unverified" for x in ntut)
    assert all(x["textual_independence_verified"] is False for x in ntut)
    assert data["lineage"]["ntut_commercial_press_edition_relationship_unverified"] is True


def test_v95_distinguishes_the_second_cadal_scan_from_a_verified_new_witness():
    data = audit_volume_nine_scan_candidates()
    by_id = {item["id"]: item for item in data["candidate_sources"]}
    second = by_id["cadal_06066055"]
    assert second["institution"] == "浙江大學"
    assert second["page_count"] == 120
    assert "duplicate or distinct physical scan not established" in second["relationship_to_cadal_06056495"]
    assert second["textual_independence_verified"] is False
    assert data["lineage"]["duplicate_scan_relationships_resolved"] is False


def test_v95_fingerprint_uses_wyg_leaf_only_as_textual_anchor():
    data = audit_volume_nine_scan_candidates()
    fingerprint = data["target_fingerprint"]
    assert fingerprint["wyg_text_leaf_marker"] == "KR3g0047_WYG_009-1b"
    assert fingerprint["wyg_leaf_is_physical_scan_page"] is False
    assert [x["role"] for x in fingerprint["anchors"]] == [
        "section_heading",
        "paragraph_opening",
        "target_case_opening",
        "key_configuration",
        "case_ending",
    ]
    assert fingerprint["anchors"][2]["text"] == "假令隂遁第三紀第五十二局乙夘時"


def test_v95_does_not_infer_ncl_volume_nine_page_from_the_first_twelve_pages():
    data = audit_volume_nine_scan_candidates()
    review = data["ncl_ming_scan_review"]
    assert review["previously_visually_reviewed_pages"] == list(range(1, 13))
    assert review["previously_visually_reviewed_page_count"] == 12
    assert review["new_pages_visually_reviewed_this_version"] == []
    assert review["volume_nine_start_page"] is None
    assert review["target_passage_page"] is None
    assert review["target_page_located"] is False
    assert data["physical_mapping"]["page_numbers_inferred_from_volume_order"] is False


def test_v95_keeps_all_physical_pages_and_historical_conflict_unresolved():
    data = audit_volume_nine_scan_candidates()
    mapping = data["physical_mapping"]
    assert mapping["ncl_ming_physical_page"] is None
    assert mapping["cadal_06056495_physical_page"] is None
    assert mapping["cadal_06066055_physical_page"] is None
    assert mapping["ntut_3100478_physical_page"] is None
    assert mapping["ntut_3100479_physical_page"] is None
    assert mapping["target_scan_image_visually_reviewed"] is False
    assert data["lineage"]["textually_independent_additional_witnesses_verified"] == 0
    assert data["collation"]["can_resolve_v87_conflict"] is False
    assert data["collation"]["may_emend_ming_text"] is False


def test_v95_decorates_existing_hour_board_after_v94_without_completing_chart():
    chart = hour_basic_board(date(2026, 10, 28), time(17, 30))
    assert chart["hour_v95_scan_candidate_audit"]["candidate_count"] == 8
    assert chart["hour_scan_candidate_audit_version"] == "V95"
    assert chart["hour_ocr_audit_version"] == "V94"
    assert chart["has_full_hour_chart"] is False


def test_v95_rejects_missing_v94_anchor():
    with pytest.raises(ValueError, match="V94"):
        decorate_taiyi_v95({"hour_ocr_audit_version": "V93"})


def test_v95_hour_api_exposes_candidate_audit_without_changing_annual_endpoint():
    client = TestClient(app)
    response = client.post("/api/taiyi/hour/cast", json={
        "solar_date": "2026-10-28", "clock": "17:30"
    })
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["hour_v95_scan_candidate_audit"]["candidate_count"] == 8
    assert data["hour_v95_scan_candidate_audit"]["ncl_ming_scan_review"]["target_page_located"] is False
    annual = client.post("/api/taiyi/cast", json={"gregorian_year": 2026})
    assert annual.status_code == 200
    assert "hour_v95_scan_candidate_audit" not in annual.json()
