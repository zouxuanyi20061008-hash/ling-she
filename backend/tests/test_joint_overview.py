"""V37 full six-yao rule confluence with no invented strength or void verdict."""
from app.core.liuyao import cast_six_yao


def test_six_line_joint_board_matches_actual_pillar_and_month_relation():
    c=cast_six_yao([7]*6,"甲子","午","父母")
    board=c["joint_overview"]
    assert len(board["rows"])==6
    assert board["version"]=="V37"
    assert board["focus_positions"]==[3,6]
    assert board["selected_position"] is None
    assert board["requires_user_choice"] is True
    assert board["status"]=="waiting_user_choice"
    first=board["rows"][0]
    assert first["ganzhi"]=="甲子"
    assert first["day"]["known"] and first["day"]["same_branch"]
    assert first["month"]["known"] and first["month_break"] is True
    assert first["day_clash"] is False
    assert first["has_opposing_indicators"] is True
    assert first["supporting"] and first["restraining"]
    assert board["strength_score"] is None
    assert board["fortune_conclusion"] is None
    assert board["timing_conclusion"] is None
    assert all(row["final_strength"] is None for row in board["rows"])


def test_joint_board_keeps_missing_day_and_month_unknown_not_false():
    c=cast_six_yao([7]*6)
    board=c["joint_overview"]
    assert board["status"]=="focus_not_selected"
    assert board["calendar"]["day_confirmed"] is False
    assert board["calendar"]["month_confirmed"] is False
    assert board["has_complete_calendar"] is False
    for row in board["rows"]:
        assert row["day"]["known"] is False
        assert row["day"]["clash"] is None
        assert row["month"]["known"] is False
        assert row["month"]["clash"] is None
        assert row["original_void"] is None
        assert row["month_break"] is None
        assert row["day_clash"] is None
        assert row["season"] is None
        assert row["self_change"]["transformed_void"] is None
        assert row["supporting"]==[]
        assert row["restraining"]==[]
        assert len(row["pending"])>=2


def test_actual_movers_influence_original_other_positions_and_changed_stays_local():
    c=cast_six_yao([9,7,7,7,7,7],"甲子","辰","世爻")
    board=c["joint_overview"]
    assert board["moving_positions"]==[1]
    first=board["rows"][0]
    assert first["moving"] is True
    assert first["incoming_movers"]==[]
    assert first["self_change"]["is_actual_change"] is True
    assert first["self_change"]["returning_term"] is not None
    for row in board["rows"][1:]:
        assert row["moving"] is False
        assert len(row["incoming_movers"])==1
        assert row["incoming_movers"][0]["from_position"]==1
        assert row["incoming_movers"][0]["to_position"]==row["position"]
        assert row["incoming_movers"][0]["confirmed_mover"] is True
        assert row["incoming_movers"][0]["effectiveness"] is None
        assert row["self_change"]["is_actual_change"] is False
        assert row["self_change"]["returning_term"] is None
        assert row["self_change"]["transformed_void"] is None
    assert board["focus_positions"]==[6]
    assert board["requires_user_choice"] is False


def test_hidden_focus_is_not_fabricated_visible_yongshen():
    c=cast_six_yao([8,7,7,7,7,7],"甲子","卯","妻财")
    board=c["joint_overview"]
    assert board["status"]=="hidden_focus"
    assert board["focus_positions"]==[]
    assert board["selected_position"] is None
    assert board["hidden_focus"]
    for item in board["hidden_focus"]:
        assert item["effective"] is None
        pos=item["position"]
        assert any(x["ganzhi"]==item["hidden_ganzhi"]
                   for x in board["rows"][pos-1]["hidden_relatives"])
    assert all(not x["focus_candidate"] for x in board["rows"])


def test_user_position_is_marked_without_auto_winner_or_removing_second_candidate():
    c=cast_six_yao([7]*6,"甲子","辰","父母",6)
    board=c["joint_overview"]
    assert board["selected_position"]==6
    assert board["focus_positions"]==[3,6]
    assert [r["position"] for r in board["rows"] if r["focus_candidate"]]==[3,6]
    assert [r["position"] for r in board["rows"] if r["selected_by_user"]]==[6]
    assert c["focus_decision"]["selected_position"]==6
    assert "candidates_positions" not in c["focus_decision"]
    assert board["effective_strength_computed"] is False
    assert board["strength_score"] is None
