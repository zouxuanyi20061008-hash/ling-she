"""V41: audit sanhe structural, movement, role and missing-calendar evidence."""
from copy import deepcopy

import pytest

from app.core.liuyao import cast_six_yao
from app.core.hexagrams import TRIGRAMS
from app.core.sanhe_condition_audit import decorate_sanhe_condition_audit


def sequence(low=1,high=1,movers=()):
    bits=TRIGRAMS[low]["lines"]+TRIGRAMS[high]["lines"]
    return [9 if bit and i+1 in movers else
            6 if not bit and i+1 in movers else
            7 if bit else 8 for i,bit in enumerate(bits)]


def water_audit(chart):
    return next(row for row in chart["sanhe_condition_audit"]["rows"]
                if row["element"]=="水" and row["structural_state"]=="three_original_branches")


def test_roles_present_without_focus_and_no_automatic_formation_or_favor():
    chart=cast_six_yao(sequence())
    audit=chart["sanhe_condition_audit"]
    water=water_audit(chart)
    assert audit["version"]=="V41"
    assert audit["focus_category"] is None
    assert water["selected_focus_position"] is None
    assert water["roles"]["世"]["position"]==chart["eight_palaces"]["ben"]["shi_position"]
    assert water["roles"]["应"]["position"]==chart["eight_palaces"]["ben"]["ying_position"]
    assert water["roles"]["世"]["relation_to_pattern"]
    assert water["roles"]["应"]["relation_to_pattern"]
    assert water["movement_state"]=="three_branches_static"
    assert water["moving_count"]==0
    assert water["affected_original"]["void_positions"] is None
    assert water["affected_original"]["month_clash_positions"] is None
    assert water["formation_verdict"] is None
    assert water["strength_verdict"] is None
    assert water["favorable_to_shi"] is None
    assert water["favorable_to_ying"] is None
    assert audit["counts"]["requires_human_review"]==audit["candidate_count"]
    assert chart["review_flow"]["report"]["sanhe_audit_digest"]


def test_selected_yongshen_does_not_replace_independent_shi_ying():
    chart=cast_six_yao(sequence(),"甲子","午","父母",3)
    water=water_audit(chart)
    assert water["selected_focus_position"]==3
    assert water["selected_focus_position_in_pattern"] is True
    assert water["roles"]["世"]["position"]==6
    assert water["roles"]["应"]["position"]==3
    assert water["roles"]["应"]["originally_in_positions"] is True
    assert water["roles"]["世"]["originally_in_positions"] is False
    assert water["affected_original"]["month_clash_positions"]==[1]
    assert water["affected_original"]["void_positions"]==[]
    assert water["calendar"]["day_known"] is True
    assert water["calendar"]["month_known"] is True
    assert water["gates"][-1]["state"]=="requires_traditional_judgment"
    assert water["formation_verdict"] is None


def test_two_moving_lacking_one_branch_day_month_match_are_only_clues():
    chart=cast_six_yao(sequence(5,1,(1,3)),"丁巳","巳","世爻")
    waiting=[r for r in chart["sanhe_condition_audit"]["rows"]
             if r["structural_state"]=="one_branch_missing"]
    assert waiting
    gold=next(x for x in waiting if x["element"]=="金" and
              x["calendar"]["day_branch_matches_missing"])
    assert gold["calendar"]["month_branch_matches_missing"] is True
    assert gold["movement_state"]=="two_original_movers_missing_one_branch"
    assert gold["moving_count"]==2
    assert gold["formation_verdict"] is None
    assert any("不自动认定三合" in warning for warning in gold["pending"])


def test_mixed_candidate_only_checks_real_changed_branch_with_void_clash_provenance():
    # A geometry scan confirms the actual location of a mixed triad without
    # inventing a specific forced fixture.
    found=None
    for low in TRIGRAMS:
        for high in TRIGRAMS:
            chart=cast_six_yao(sequence(low,high,(1,3)),"甲子","申")
            items=[x for x in chart["sanhe_condition_audit"]["rows"]
                   if x["structural_state"]=="original_and_changed_branches"]
            if items:
                found=(chart,items[0])
                break
        if found:break
    assert found is not None
    chart,row=found
    assert row["movement_state"]=="two_original_movers_plus_local_change"
    assert row["transformed_branch_used"] is True
    transformed=row["changed_position_check"]
    assert transformed is not None
    pos=transformed["position"]
    assert pos in chart["dong_yao"]
    assert transformed["branch"]==chart["bian_najia_lines"][pos-1]["branch"]
    assert transformed["is_void"]==chart["bian_najia_lines"][pos-1]["is_xunkong"]
    assert transformed["month_clash"]==chart["bian_najia_lines"][pos-1]["month_break_marker"]
    assert row["formation_verdict"] is None
    invalid=deepcopy(chart)
    bad=next(x for x in invalid["sanhe_focus_review"]["rows"]
             if x["candidate_key"]==row["candidate_key"])
    bad["transformed_branch"]="不存在"
    with pytest.raises(ValueError,match="本位真实化支"):
        decorate_sanhe_condition_audit(invalid)


def test_different_missing_calendar_states_do_not_default_false():
    variants=((None,None),(None,"午"),("甲子",None))
    for day,month in variants:
        chart=cast_six_yao(sequence(),day,month,focus_liuqin="父母")
        item=water_audit(chart)
        assert item["calendar"]["day_known"] is bool(day)
        assert item["calendar"]["month_known"] is bool(month)
        assert (item["affected_original"]["void_positions"] is None)==(day is None)
        assert (item["affected_original"]["month_clash_positions"] is None)==(month is None)
        assert item["formation_verdict"] is None
        assert item["timing_verdict"] is None


def test_64_hexagrams_single_actual_mover_never_infer_formation():
    for low in TRIGRAMS:
        for high in TRIGRAMS:
            chart=cast_six_yao(sequence(low,high,(1,)),"甲子","辰")
            audit=chart["sanhe_condition_audit"]
            assert audit["candidate_count"]==sum(chart["hexagram_combinations"]["counts"].values())
            assert all(row["formation_verdict"] is None for row in audit["rows"])
            assert all(row["favorable_to_shi"] is None for row in audit["rows"])
            assert all(row["favorable_to_ying"] is None for row in audit["rows"])
            assert all(row["movement_state"]!="three_branches_static" or
                       row["moving_count"]==0 for row in audit["rows"])
