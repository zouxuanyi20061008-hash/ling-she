"""V21 六轴合参：能追溯候选爻，缺资料不造结论；静动与本位变爻不能混用。"""
from app.core.liuyao import cast_six_yao


AXES=["month","day","movement","void","special","roles"]


def test_no_focus_never_creates_an_auto_selected_main_line():
    chart=cast_six_yao([7]*6)
    chain=chart["evidence_chain"]
    assert chain["status"]=="focus_not_selected"
    assert chain["selected_position"] is None
    assert chain["candidates"]==[]
    assert chain["fortune_conclusion"] is None
    assert chain["timing_conclusion"] is None


def test_lacking_calendar_remains_pending_and_no_void_or_day_claims():
    chart=cast_six_yao([7]*6,focus_liuqin="世爻")
    chain=chart["evidence_chain"]
    assert chain["status"]=="date_incomplete"
    assert len(chain["candidates"])==1
    candidate=chain["candidates"][0]
    axes={a["id"]:a for a in candidate["axes"]}
    assert list(axes)==AXES
    assert axes["month"]["status"]=="pending"
    assert axes["day"]["status"]=="pending"
    assert axes["void"]["status"]=="pending"
    assert axes["void"]["observations"]==[]
    assert candidate["final_strength"] is None


def test_multiple_focus_candidates_stay_equal_until_explicit_choice():
    chart=cast_six_yao([7]*6,"甲子","辰","父母")
    chain=chart["evidence_chain"]
    assert chain["status"]=="comparison_pending"
    assert len(chain["candidates"])==2
    assert [x["position"] for x in chain["candidates"]]==[3,6]
    assert not any(x["selected_by_user"] for x in chain["candidates"])
    assert chain["selected_position"] is None
    assert any("多现" in x for x in chain["blockers"])


def test_selected_candidate_traces_real_movement_and_same_line_transformation():
    chart=cast_six_yao([7,9,7,7,7,7],"甲子","卯","世爻",6)
    chain=chart["evidence_chain"]
    assert chain["selected_position"]==6
    candidate=chain["candidates"][0]
    assert candidate["selected_by_user"]
    axes={a["id"]:a for a in candidate["axes"]}
    assert axes["movement"]["status"]=="review"
    assert any("2爻明动" in x for x in axes["movement"]["observations"])
    assert all(a["effectiveness"]=="not_determined" for a in candidate["axes"])
    assert chain["fortune_conclusion"] is None
    assert chart["review_flow"]["report"]["evidence_chain_digest"]


def test_missing_relative_does_not_masquerade_as_visible_line():
    chart=cast_six_yao([8,7,7,7,7,7],"甲子","卯","妻财")
    chain=chart["evidence_chain"]
    assert chain["status"]=="focus_not_visible"
    assert chain["candidates"]==[]
    assert any("伏神" in x for x in chain["blockers"])


def test_no_mover_has_no_invented_moving_relation():
    chart=cast_six_yao([7]*6,"甲子","辰","世爻",6)
    candidate=chart["evidence_chain"]["candidates"][0]
    movement=next(x for x in candidate["axes"] if x["id"]=="movement")
    assert movement["status"]=="recorded"
    assert movement["observations"]==["本爻安静"]
    assert chart["review_flow"]["report"]["conclusion"] is None
