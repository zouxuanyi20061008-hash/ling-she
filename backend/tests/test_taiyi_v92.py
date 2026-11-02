"""V92 卷九文字转录叶定位与扫描页/明钞本证据边界。"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.taiyi_hour_v77 import hour_basic_board
from app.core.taiyi_hour_v92 import audit_volume_nine_text_locator, decorate_taiyi_v92


def test_v92_locates_target_passage_in_wyg_text_leaf_1b():
    locator = audit_volume_nine_text_locator()
    target = locator["target_passage"]
    assert locator["version"] == "V92"
    assert locator["volume"] == 9
    assert locator["volume_title_leaf_marker"] == "KR3g0047_WYG_009-1a"
    assert target["leaf_marker"] == "KR3g0047_WYG_009-1b"
    assert target["leaf_side"] == "1b"
    assert target["textually_located"] is True
    assert "隂遁第三紀第五十二局乙夘時" in target["excerpt"]
    assert "太乙在八宫陽徳為天目巳為計神" in target["excerpt"]
    assert "客計得七大将七參将一" in target["excerpt"]
    assert target["physical_scan_page"] is None
    assert target["ming_manuscript_page"] is None


def test_v92_distinguishes_ocr_transcription_and_scan_sources():
    locator = audit_volume_nine_text_locator()
    sources = locator["sources"]
    assert sources["cadal_ocr"]["chapter_id"] == 367760
    assert sources["cadal_volume_nine_text"]["chapter_id"] == 435698
    assert sources["cadal_scan"]["scan_page_count"] == 120
    assert sources["cadal_scan"]["physical_target_page"] is None
    assert sources["kanripo"]["source_type"] == "WYG文字转录"
    assert locator["source_lineage"]["belongs_to_siku_text_family"] is True
    assert locator["source_lineage"]["is_independent_ming_witness"] is False
    assert locator["source_lineage"]["cadal_ocr_is_independent_witness"] is False
    assert locator["source_lineage"]["kanripo_wyg_is_independent_witness"] is False


def test_v92_does_not_resolve_ming_manuscript_conflict_or_complete_hour_chart():
    locator = audit_volume_nine_text_locator()
    collation = locator["collation"]
    assert collation["target_text_located"] is True
    assert collation["cadal_scan_page_mapped"] is False
    assert collation["ncl_ming_scan_page_mapped"] is False
    assert collation["ming_manuscript_transcribed"] is False
    assert collation["character_level_collation_completed"] is False
    assert collation["verified_independent_yin_variant"] is False
    assert collation["can_resolve_v87_conflict"] is False
    assert collation["may_emend_ming_text"] is False


def test_v92_decorates_existing_hour_board_without_changing_core_calculation():
    chart = hour_basic_board(date(2026, 10, 28), time(17, 30))
    locator = chart["hour_v92_textual_locator"]
    assert locator["target_passage"]["leaf_marker"].endswith("-1b")
    assert locator["target_passage"]["physical_scan_page"] is None
    assert chart["hour_textual_locator_version"] == "V92"
    assert chart["has_verified_independent_yin_variant"] is False
    assert chart["has_full_hour_chart"] is False


def test_v92_rejects_missing_v91_scan_scope():
    with pytest.raises(ValueError, match="V91"):
        decorate_taiyi_v92({"hour_cadal_locator_version": "V90"})


def test_v92_hour_api_exposes_textual_locator_without_changing_annual_endpoint():
    client = TestClient(app)
    response = client.post("/api/taiyi/hour/cast", json={
        "solar_date": "2026-10-28", "clock": "17:30"
    })
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["hour_v92_textual_locator"]["target_passage"]["leaf_marker"] == "KR3g0047_WYG_009-1b"
    assert data["hour_v92_textual_locator"]["target_passage"]["physical_scan_page"] is None
    annual = client.post("/api/taiyi/cast", json={"gregorian_year": 2026})
    assert annual.status_code == 200
    assert "hour_v92_textual_locator" not in annual.json()
