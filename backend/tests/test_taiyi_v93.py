"""V93 CText OCR文本行定位与实体页码证据边界。"""
from datetime import date, time

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.taiyi_hour_v77 import hour_basic_board
from app.core.taiyi_hour_v93 import audit_volume_nine_scan_anchor, decorate_taiyi_v93


def test_v93_locates_ctext_library_resource_and_ocr_text_rows():
    anchor = audit_volume_nine_scan_anchor()
    ctext = anchor["ctext"]
    assert anchor["version"] == "V93"
    assert ctext["library_resource"]["resource_id"] == 5784
    assert ctext["library_resource"]["volume_five_to_ten_included"] is True
    assert ctext["library_resource"]["scanned_by"] == "CADAL"
    assert ctext["ocr_chapter"]["chapter_id"] == 367760
    assert ctext["ocr_chapter"]["target_row_number"] == 7
    assert ctext["ocr_chapter"]["image_href_verified"] is False
    assert ctext["wyg_text_chapter"]["chapter_id"] == 435698
    assert ctext["wyg_text_chapter"]["target_row_number"] == 5
    assert ctext["wyg_text_chapter"]["leaf_marker"] == "KR3g0047_WYG_009-1b"


def test_v93_keeps_all_physical_page_numbers_unresolved_until_image_review():
    anchor = audit_volume_nine_scan_anchor()
    mapping = anchor["physical_mapping"]
    assert mapping["ctext_file_id"] is None
    assert mapping["ctext_library_page_number"] is None
    assert mapping["cadal_physical_page"] is None
    assert mapping["cadal_page_located"] is False
    assert mapping["ncl_ming_physical_page"] is None
    assert mapping["ncl_ming_page_located"] is False
    assert mapping["target_scan_image_visually_reviewed"] is False


def test_v93_distinguishes_siku_scans_from_ming_manuscript():
    anchor = audit_volume_nine_scan_anchor()
    candidates = anchor["scan_candidates"]
    assert candidates["cadal_06056495"]["page_count"] == 120
    assert candidates["cadal_06056495"]["independent_ming_witness"] is False
    assert candidates["ncl_06604"]["page_count"] == 124
    assert candidates["ncl_06604"]["edition_family"] == "明鈔本"
    assert candidates["ncl_06604"]["independent_ming_witness"] is True
    assert candidates["ssid_13003380"]["page_count"] == 121
    assert candidates["ssid_13003380"]["independent_ming_witness"] is False
    assert anchor["collation"]["can_resolve_v87_conflict"] is False
    assert anchor["collation"]["may_emend_ming_text"] is False


def test_v93_decorates_hour_board_without_changing_core_calculation():
    chart = hour_basic_board(date(2026, 10, 28), time(17, 30))
    anchor = chart["hour_v93_scan_anchor"]
    assert anchor["physical_mapping"]["cadal_physical_page"] is None
    assert anchor["ctext"]["ocr_chapter"]["target_row_number"] == 7
    assert chart["hour_scan_anchor_version"] == "V93"
    assert chart["has_verified_independent_yin_variant"] is False
    assert chart["has_full_hour_chart"] is False


def test_v93_rejects_missing_v92_textual_locator():
    with pytest.raises(ValueError, match="V92"):
        decorate_taiyi_v93({"hour_textual_locator_version": "V91"})


def test_v93_hour_api_exposes_text_rows_but_not_fake_physical_page():
    client = TestClient(app)
    response = client.post("/api/taiyi/hour/cast", json={
        "solar_date": "2026-10-28", "clock": "17:30"
    })
    assert response.status_code == 200, response.text
    data = response.json()
    anchor = data["hour_v93_scan_anchor"]
    assert anchor["ctext"]["ocr_chapter"]["target_row_number"] == 7
    assert anchor["physical_mapping"]["cadal_physical_page"] is None
    annual = client.post("/api/taiyi/cast", json={"gregorian_year": 2026})
    assert annual.status_code == 200
    assert "hour_v93_scan_anchor" not in annual.json()
