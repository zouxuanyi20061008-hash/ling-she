"""V44: deterministic cross-condition audit, never efficacy or prediction."""
from copy import deepcopy

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.hexagrams import TRIGRAMS
from app.core.liuyao import cast_six_yao
from app.core.cross_condition_audit import decorate_cross_condition_audit


def test_void_month_break_focus_is_cross_checked_without_outcome():
    chart=cast_six_yao([7]*6,"甲子","辰","父母",6)
    data=chart["cross_condition_audit"]
    assert data["version"]=="V44"
    assert data["focus_candidate_positions"]==[3,6]
    assert data["selected_position"]==6
    assert data["status"]=="condition_review_ready"
    top=data["rows"][5]
    assert top["computed"]["original_void"] is True
    assert top["computed"]["original_month_clash"] is True
    assert "void_and_month_break" in {x["id"] for x in top["checks"]}
    assert top["actual_change"] is None
    assert top["true_void"] is None and top["false_void"] is None
    assert top["strength_verdict"] is None
    assert data["has_final_strength"] is False
    assert data["has_final_void_decision"] is False
    assert data["effective_movement_computed"] is False
    assert data["timing_conclusion"] is None
    assert any("V44 6爻" in s for s in chart["review_flow"]["report"]["cross_condition_digest"])
    assert chart["review_flow"]["report"]["conclusion"] is None


def test_missing_day_month_keeps_missing_tristate_and_no_void_assertions():
    chart=cast_six_yao([7]*6)
    data=chart["cross_condition_audit"]
    assert data["status"]=="focus_not_selected"
    assert data["focus_candidates"]==[]
    assert chart["review_flow"]["report"]["cross_condition_digest"]==[]
    for line in data["rows"]:
        assert line["computed"]["day"]["status"]=="missing"
        assert line["computed"]["month"]["status"]=="missing"
        assert line["computed"]["original_void"] is None
        assert line["computed"]["original_month_clash"] is None
        assert len(line["missing_inputs"])==2
        assert "void_and_month_break" not in {x["id"] for x in line["checks"]}
        assert line["actual_change"] is None


def test_real_movers_alone_produce_source_edges_and_returning_scope():
    arr=[9,6,9,7,9,6]
    chart=cast_six_yao(arr,"甲子","午","世爻")
    data=chart["cross_condition_audit"]
    assert len(data["rows"])==6
    for row in data["rows"]:
        pos=row["position"]
        original=chart["najia_lines"][pos-1]
        changed=chart["bian_najia_lines"][pos-1]
        if original["moving"]:
            assert row["actual_change"] is not None
            assert row["actual_change"]["ganzhi"]==changed["ganzhi"]
            assert row["actual_change"]["returning_term"]==original["turnback"]["term"]
            assert row["actual_change"]["original_void"]==changed["is_xunkong"]
            assert row["actual_change"]["effective_returning_action"] is None
        else:
            assert row["actual_change"] is None
        for source in row["incoming_movers"]:
            assert source["source_position"] in chart["dong_yao"]
            assert source["source_position"]!=pos
            srcline=chart["najia_lines"][source["source_position"]-1]
            assert source["source_original_void"]==srcline["is_xunkong"]
            assert source["source_month_clash"]==srcline["month_break_marker"]
            assert source["effectiveness"] is None
            assert source["source_changed_void"]==chart["bian_najia_lines"][source["source_position"]-1]["is_xunkong"]
        assert all(c["actual_effectiveness"] is None for c in row["checks"])
    assert data["effective_movement_computed"] is False


def test_hidden_focus_does_not_invent_visible_yongshen():
    chart=cast_six_yao([8,7,7,7,7,7],"甲子","卯","妻财")
    data=chart["cross_condition_audit"]
    assert data["status"]=="focus_not_visible"
    assert data["focus_candidates"]==[]
    assert data["selected_position"] is None
    assert any("本卦关注用神不现" in x for x in chart["review_flow"]["report"]["cross_condition_digest"])


def test_partial_calendar_preserves_null_and_true_conditions_independently():
    only_day=cast_six_yao([7,7,7,7,7,9],"甲子",focus_liuqin="世爻")
    only_month=cast_six_yao([7,7,7,7,7,9],month_branch="辰",focus_liuqin="世爻")
    assert only_day["cross_condition_audit"]["status"]=="calendar_incomplete"
    assert only_month["cross_condition_audit"]["status"]=="calendar_incomplete"
    for row in only_day["cross_condition_audit"]["rows"]:
        assert row["computed"]["original_month_clash"] is None
        assert "void_and_month_break" not in {c["id"] for c in row["checks"]}
    for row in only_month["cross_condition_audit"]["rows"]:
        assert row["computed"]["original_void"] is None
        assert "void_and_month_break" not in {c["id"] for c in row["checks"]}


def test_detects_misaligned_inputs_instead_of_silently_merging():
    chart=cast_six_yao([9,7,7,7,7,7],"甲子","辰")
    invalid=deepcopy(chart)
    invalid["strength_evidence"]["rows"][0]["position"]=2
    with pytest.raises(ValueError,match="错位"):
        decorate_cross_condition_audit(invalid)
    bad_edge=deepcopy(chart)
    bad_edge["moving_influences"]["edges"][0]["source_position"]=2
    with pytest.raises(ValueError,match="静爻"):
        decorate_cross_condition_audit(bad_edge)


def test_smoke_64_hexagrams_with_one_mover_preserves_nondecisive_contract():
    for low in TRIGRAMS.values():
        for high in TRIGRAMS.values():
            bits=low["lines"]+high["lines"]
            seq=[7 if bit else 8 for bit in bits]
            seq[0]=9 if bits[0] else 6
            chart=cast_six_yao(seq,"甲子","卯","世爻")
            block=chart["cross_condition_audit"]
            assert len(block["rows"])==6
            assert block["rows"][0]["actual_change"] is not None
            assert all(r["actual_change"] is None for r in block["rows"][1:])
            assert block["has_final_strength"] is False
            assert block["has_timing_prediction"] is False
            assert block["fortune_conclusion"] is None


def test_api_has_same_v44_evidence_without_fictional_prediction():
    body={"numbers":[7]*6,"day_ganzhi":"甲子","month_branch":"辰",
          "focus_liuqin":"父母","focus_position":6}
    result=TestClient(app).post("/api/liuyao/cast",json=body)
    assert result.status_code==200,result.text
    chart=result.json()
    assert chart["cross_condition_audit"]["rows"][5]["computed"]["original_void"] is True
    assert chart["review_flow"]["report"]["cross_condition_digest"]
    assert chart["review_flow"]["report"]["has_final_decision"] is False
