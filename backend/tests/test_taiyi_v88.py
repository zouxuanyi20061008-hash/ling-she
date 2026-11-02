"""V88 明钞本馆藏线索登记：元数据可追溯，未读文本不冒充异文。"""
from copy import deepcopy
from datetime import date, time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.taiyi_hour_v77 import hour_basic_board
from app.core.taiyi_hour_v88 import audit_ming_manuscript_candidate, decorate_taiyi_v88


def test_v88_records_a_catalogued_ming_manuscript_and_scan_metadata_only():
    chart = hour_basic_board(date(2026, 10, 28), time(17, 30))
    registry = chart["hour_v88_manuscript_witness_registry"]
    witness, collation, lineage = registry["witness"], registry["collation"], registry["lineage"]
    assert registry["version"] == "V88"
    assert registry["status"] == "catalog_and_scan_identified_text_not_collated"
    assert witness["edition"] == "明鈔本"
    assert witness["institution"] == "國家圖書館（臺灣）"
    assert witness["volume_count"] == 10 and witness["bound_volume_count"] == 4
    assert witness["shelfmark"] == "306.6 06604" and witness["scan_page_count"] == 124
    assert witness["catalog_metadata_confirmed"] and witness["digital_scan_metadata_confirmed"]
    assert collation["target_passage"] == "卷九·推敌国动静"
    assert collation["target_leaf_or_page"] is None and collation["transcribed_reading"] is None
    assert collation["compared_character_count"] == 0
    assert lineage["separate_catalogued_physical_artifact_from_siku_transcription"]
    assert lineage["textual_independence_established"] is False
    assert lineage["is_verified_independent_variant"] is False
    assert registry["can_resolve_v87_conflict"] is False
    assert registry["may_emend_text"] is False and registry["preferred_correction"] is None
    assert chart["hour_v87_modular_source_audit"]["triple_intersection"] == []
    assert chart["hour_v87_modular_source_audit"]["preferred_correction"] is None
    assert chart["hour_v86_classical_examples"]["yin_source_conflict"]["preferred_interpretation"] is None
    assert chart["hour_v84_qiying_plate"]["qiying"]["qiying_wenchang"] is None
    assert chart["hour_v84_qiying_plate"]["qiying"]["qiying_main_general"]["palace"] is None
    assert chart["has_verified_independent_yin_variant"] is False
    assert chart["has_full_hour_chart"] is False


def test_v88_registry_function_contains_no_transcribed_reading():
    item = audit_ming_manuscript_candidate()
    assert item["witness"]["scan_sha1"] == "46b2774f6d66fb61db3617673672ec721bdc0904"
    assert item["collation"]["status"] == "not_started"
    assert item["collation"]["compared_fields"] == []
    assert item["lineage"]["relationship_to_siku_text"] == "unknown_until_collated"
    assert item["preferred_correction"] is None


def test_v88_rejects_a_changed_or_preferred_v87_historical_correction():
    chart = hour_basic_board(date(2026, 12, 23), time(10, 30))
    tampered = deepcopy(chart)
    tampered["hour_v87_modular_source_audit"]["preferred_correction"] = "改为第一纪"
    with pytest.raises(ValueError, match="V88"):
        decorate_taiyi_v88(tampered)
    tampered = deepcopy(chart)
    tampered["hour_v87_modular_source_audit"]["triple_intersection"] = [52]
    with pytest.raises(ValueError, match="V88"):
        decorate_taiyi_v88(tampered)


def test_v88_api_exposes_the_candidate_without_promoting_the_hour_chart():
    client = TestClient(app)
    response = client.post("/api/taiyi/hour/cast", json={"solar_date": "2026-10-28", "clock": "17:30"})
    assert response.status_code == 200, response.text
    data = response.json()
    registry = data["hour_v88_manuscript_witness_registry"]
    assert registry["witness"]["accession_number"] == "06604"
    assert registry["collation"]["transcribed_reading"] is None
    assert data["has_full_hour_chart"] is False
    assert data["hour_v87_modular_source_audit"]["preferred_correction"] is None
    annual = client.post("/api/taiyi/cast", json={"gregorian_year": 2026})
    assert annual.status_code == 200
    assert "hour_v88_manuscript_witness_registry" not in annual.json()
