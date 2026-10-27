"""V47 stable canonical evidence / provenance, missing input and nondecisive review order."""
from copy import deepcopy
from datetime import date, time

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.hexagrams import TRIGRAMS
from app.core.liuyao import cast_six_yao
from app.core.solar_calendar import preview_solar_calendar
from app.core.evidence_priority_audit import decorate_evidence_priority_audit


def test_all_movers_dedupe_sources_preserve_pair_directions_and_zero_final_verdicts():
    c=cast_six_yao([9]*6,"甲子","辰","父母",3)
    d=c["evidence_priority_audit"]
    assert d["version"]=="V47"
    assert len(d["rows"])==6
    assert len(d["pairs"])==15
    assert d["deduplicated_reference_count"]>0
    ids=[f["id"] for f in d["facts"]]
    assert len(ids)==len(set(ids))
    assert len(ids)==d["fact_count"]
    f=next(x for x in d["facts"] if x["id"]=="line:2:original:void")
    assert f["sources"]==["V44","V46"]
    assert "edge:2:4:relation" in d["pairs"][5]["evidence_ids"] or any(
        "edge:2:4:relation" in p["evidence_ids"] for p in d["pairs"])
    assert all(x["joint_effectiveness"] is None for x in d["pairs"])
    assert all(x["priority"] in (0,1,2) for x in d["review_queue"])
    assert d["auto_selects_yongshen"] is False
    assert d["fortune_conclusion"] is None
    assert d["timing_conclusion"] is None
    assert c["review_flow"]["report"]["evidence_priority_digest"]


def test_absent_day_month_preserves_unknown_not_false_and_still_knows_motion():
    d=cast_six_yao([9,9,7,7,7,7],focus_liuqin="世爻")["evidence_priority_audit"]
    assert d["has_calendar_input"] is False
    factids={x["id"] for x in d["facts"]}
    for pos in (1,2):
        assert f"line:{pos}:original:void" not in factids
        assert f"line:{pos}:original:month_clash" not in factids
        assert f"line:{pos}:original:moving" in factids
        assert f"line:{pos}:changed:returning" in factids
    assert any(x["priority"]==0 and "日辰" in x["title"] for x in d["review_queue"])
    assert any(x["priority"]==0 and "月建" in x["title"] for x in d["review_queue"])
    assert not any("旬空与月冲" in x["title"] for x in d["review_queue"])


def test_manual_calendar_source_is_priority_one_not_trusted_verified_date():
    d=cast_six_yao([7]*6,"甲子","辰","父母")["evidence_priority_audit"]
    assert d["has_calendar_input"] is True
    assert d["calendar_provenance_verified"] is False
    assert any(x["priority"]==1 for x in d["review_queue"])
    assert not any(x["priority"]==0 for x in d["review_queue"])
    assert d["priority_semantics"]["2"].startswith("多条件")


def test_calendar_provenance_from_source_is_not_silently_treated_as_manual():
    # Calendar provenance cannot be fabricated independently of the true day.
    day=preview_solar_calendar(date(2026,2,1),time(10,0))
    chart=cast_six_yao(
        [7]*6,day["day_ganzhi"],day["month_branch"],calendar_provenance={
            "source":"server_recomputed_calendar",
            "day_ganzhi":day["day_ganzhi"],
            "month_branch":day["month_branch"],
            "solar_date":"2026-02-01",
            "beijing_time":"2026-02-01T10:00:00",
            "day_boundary":"midnight",
            "day_boundary_label":"午夜换日",
            "warnings":[],
        }
    )
    d=chart["evidence_priority_audit"]
    assert d["calendar_provenance_verified"] is True
    assert not any(x["priority"]==1 for x in d["review_queue"])


def test_original_void_and_month_break_are_one_review_event_not_double_counted():
    d=cast_six_yao([7]*6,"甲子","辰","父母",6)["evidence_priority_audit"]
    q=[x for x in d["review_queue"] if x["id"]=="line:6:tension:void_month"]
    assert len(q)==1
    assert q[0]["evidence_ids"]==[
        "line:6:original:void","line:6:original:month_clash"]
    assert all(x["effective"] is None for x in d["facts"])


def test_no_movers_or_hidden_focus_do_not_forge_active_pairs():
    still=cast_six_yao([7]*6,"甲子","辰")["evidence_priority_audit"]
    assert still["pairs"]==[]
    assert not any(f["id"].startswith("edge:") for f in still["facts"])
    hidden=cast_six_yao([8,7,7,7,7,7],"甲子","卯","妻财")["evidence_priority_audit"]
    assert hidden["pairs"]==[]
    assert hidden["auto_selects_yongshen"] is False


def test_cross_module_mutated_duplicate_field_fails_loudly():
    c=cast_six_yao([9]*6,"甲子","辰","父母")
    bad=deepcopy(c)
    bad["multi_mover_audit"]["pairs"][0]["a_state"]["original_void"]=(
        not bad["multi_mover_audit"]["pairs"][0]["a_state"]["original_void"])
    with pytest.raises(ValueError,match="不一致"):
        decorate_evidence_priority_audit(bad)


def test_64_hexagrams_two_movers_preserve_single_source_ids_and_no_predictions():
    for lo in TRIGRAMS.values():
        for hi in TRIGRAMS.values():
            bits=lo["lines"]+hi["lines"]
            arr=[7 if x else 8 for x in bits]
            arr[0]=9 if bits[0] else 6
            arr[-1]=9 if bits[-1] else 6
            d=cast_six_yao(arr,"甲子","卯","世爻")["evidence_priority_audit"]
            assert len(d["pairs"])==1
            assert len({f["id"] for f in d["facts"]})==d["fact_count"]
            assert d["effective_movement_computed"] is False
            assert d["strength_conclusion"] is None


def test_cast_endpoint_exports_v47_and_report():
    r=TestClient(app).post("/api/liuyao/cast",json={
        "numbers":[9]*6,"day_ganzhi":"甲子","month_branch":"辰",
        "focus_liuqin":"父母","focus_position":3})
    assert r.status_code==200,r.text
    j=r.json()
    assert j["evidence_priority_audit"]["deduplicated_reference_count"]>0
    assert j["review_flow"]["report"]["evidence_priority_digest"]
    assert j["review_flow"]["report"]["conclusion"] is None
