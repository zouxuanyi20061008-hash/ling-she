"""V94 CText OCR row-number semantics and WYG cross-reference audit."""
from datetime import date, time

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.taiyi_hour_v77 import hour_basic_board
from app.core.taiyi_hour_v94 import audit_volume_nine_ocr_rows, decorate_taiyi_v94


def test_v94_distinguishes_ocr_row_numbers_from_physical_scan_pages():
    audit = audit_volume_nine_ocr_rows()
    assert audit["numbering_semantics"]["is_physical_scan_page"] is False
    assert audit["numbering_semantics"]["is_image_id"] is False
    assert audit["ctext_ocr"]["target_row_number"] == 7
    assert audit["ctext_ocr"]["volume_nine_context"][0]["text"] == "太乙金鏡式經卷九"
    assert audit["ctext_ocr"]["volume_nine_context"][1]["text"] == "唐王希明撰"
    assert audit["ctext_ocr"]["volume_nine_context"][2]["role"] == "table_of_contents"
    assert audit["ctext_ocr"]["volume_nine_context"][3]["role"] == "target_passage"
    assert audit["ctext_ocr"]["physical_scan_page"] is None


def test_v94_cross_references_wyg_volume_nine_target_row_five():
    audit = audit_volume_nine_ocr_rows()
    wyg = audit["ctext_wyg_transcription"]
    assert wyg["target_row_number"] == 5
    assert wyg["context"][0]["role"] == "edition_heading"
    assert wyg["context"][1]["role"] == "volume_heading"
    assert wyg["context"][3]["text"] == "推敵國動靜"
    assert wyg["context"][4]["role"] == "target_passage"
    assert wyg["leaf_marker"] == "KR3g0047_WYG_009-1b"
    assert wyg["physical_scan_page"] is None


def test_v94_records_ocr_divergences_without_treating_ocr_as_corrected_text():
    audit = audit_volume_nine_ocr_rows()
    divergences = audit["observed_ocr_divergences"]
    assert len(divergences) >= 4
    assert {"ocr": "乙叩時", "wyg": "乙夘時", "type": "character_recognition"} in divergences
    assert "乙叩時" in audit["transcriptions"]["ocr_excerpt"]
    assert "乙夘時" in audit["transcriptions"]["wyg_reference_excerpt"]
    assert audit["collation"]["character_level_ming_vs_siku_collation_completed"] is False
    assert audit["collation"]["may_emend_ming_text"] is False


def test_v94_keeps_cadal_and_ming_physical_pages_unknown():
    audit = audit_volume_nine_ocr_rows()
    mapping = audit["physical_mapping"]
    assert mapping["cadal_file_page_count"] == 120
    assert mapping["cadal_physical_page"] is None
    assert mapping["ncl_ming_file_page_count"] == 124
    assert mapping["ncl_ming_physical_page"] is None
    assert mapping["target_scan_image_visually_reviewed"] is False


def test_v94_decorates_hour_board_after_v93_without_changing_core_board():
    chart = hour_basic_board(date(2026, 10, 28), time(17, 30))
    audit = chart["hour_v94_ocr_row_audit"]
    assert audit["ctext_ocr"]["target_row_number"] == 7
    assert audit["ctext_wyg_transcription"]["target_row_number"] == 5
    assert chart["hour_ocr_audit_version"] == "V94"
    assert chart["hour_scan_anchor_version"] == "V93"
    assert chart["has_full_hour_chart"] is False


def test_v94_rejects_missing_v93_anchor():
    with pytest.raises(ValueError, match="V93"):
        decorate_taiyi_v94({"hour_scan_anchor_version": "V92"})


def test_v94_hour_api_exposes_text_audit_but_no_fake_scan_page():
    client = TestClient(app)
    response = client.post("/api/taiyi/hour/cast", json={
        "solar_date": "2026-10-28", "clock": "17:30"
    })
    assert response.status_code == 200, response.text
    data = response.json()
    audit = data["hour_v94_ocr_row_audit"]
    assert audit["ctext_ocr"]["target_row_number"] == 7
    assert audit["ctext_wyg_transcription"]["target_row_number"] == 5
    assert audit["physical_mapping"]["cadal_physical_page"] is None
    annual = client.post("/api/taiyi/cast", json={"gregorian_year": 2026})
    assert annual.status_code == 200
    assert "hour_v94_ocr_row_audit" not in annual.json()
