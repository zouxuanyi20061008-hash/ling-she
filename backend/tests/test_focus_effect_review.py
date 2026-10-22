"""V24：用神原忌仇真实来源与静态关系严格分开，并保留日月空破限制。"""
from app.core.liuyao import cast_six_yao


def test_missing_focus_produces_no_invented_effect():
    c=cast_six_yao([7]*6,"甲子","辰")
    data=c["focus_effect_review"]
    assert data["status"]=="focus_not_selected"
    assert not data["candidates"]
    assert data["fortune_conclusion"] is None


def test_missing_relative_has_no_visible_mover_paths():
    c=cast_six_yao([8,7,7,7,7,7],"甲子","卯","妻财")
    data=c["focus_effect_review"]
    assert data["status"]=="focus_not_visible"
    assert data["candidates"]==[]


def test_static_line_is_not_counted_as_active_support_or_restriction():
    c=cast_six_yao([7]*6,"甲子","辰","父母")
    data=c["focus_effect_review"]
    assert len(data["candidates"])==2
    assert data["status"]=="multiple_candidates_pending"
    for focus in data["candidates"]:
        assert not focus["selected_by_user"]
        for role,sources in focus["roles"].items():
            for path in sources:
                assert path["kind"]!="active_direct_edge_pending_effect"
                assert path["effective"] is None
                assert path["relation_to_target"] is None


def test_each_actual_active_source_requires_joint_review():
    c=cast_six_yao([7,9,7,7,7,7],"甲子","辰","父母")
    effect=c["focus_effect_review"]
    assert effect["candidates"]
    active=[src for candidate in effect["candidates"] for role in ("原神","忌神")
            for src in candidate["roles"][role]
            if src["kind"]=="active_direct_edge_pending_effect"]
    assert active
    for source in active:
        assert source["moving"]
        assert source["relation_to_target"]
        assert source["effective"] is None
        assert source["final_strength"] is None
        assert {x["id"] for x in source["checks"]}=={"day","month","void","motion","special"}
        assert source["true_void"] is None and source["false_void"] is None
        assert source["status"]=="requires_joint_review"


def test_missing_day_and_month_do_not_fabricate_input_conditions():
    c=cast_six_yao([7,9,7,7,7,7],focus_liuqin="父母")
    assert c["focus_effect_review"]["status"]=="calendar_incomplete"
    for focus in c["focus_effect_review"]["candidates"]:
        for group in focus["roles"].values():
            for source in group:
                checks={r["id"]:r for r in source["checks"]}
                for key in ("day","month","void"):
                    assert checks[key]["status"]=="missing"
                    assert checks[key]["facts"]==[]
                assert source["date_complete"] is False


def test_user_selection_records_only_the_user_selected_candidate():
    c=cast_six_yao([7]*6,"甲子","辰","父母",6)
    data=c["focus_effect_review"]
    assert data["selected_position"]==6
    assert [x["position"] for x in data["candidates"] if x["selected_by_user"]]==[6]
    assert all(not x["chosen_by_algorithm"] for x in data["candidates"])
    assert c["review_flow"]["report"]["focus_effect_digest"]
    assert c["review_flow"]["report"]["conclusion"] is None
