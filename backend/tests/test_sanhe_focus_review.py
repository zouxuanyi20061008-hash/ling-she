"""V40 sanhe + chosen yongshen / shi-ying / day-month confluence tests."""
from app.core.liuyao import cast_six_yao
from app.core.hexagrams import TRIGRAMS

def _nums(low=1,up=1,moving=()):
    bits=TRIGRAMS[low]["lines"]+TRIGRAMS[up]["lines"]
    return [9 if b and i+1 in moving else 6 if not b and i+1 in moving
            else 7 if b else 8 for i,b in enumerate(bits)]

def _water(report):
    return next(r for r in report["rows"] if
                r["source_type"]=="original_triad_candidates" and r["element"]=="水")

def test_sanhe_no_focus_does_not_select_person_or_claim_effect():
    chart=cast_six_yao(_nums())
    review=chart["sanhe_focus_review"]
    assert review["version"]=="V40"
    assert review["status"]=="no_focus"
    assert review["focus_category"] is None
    assert review["focus_positions"]==[]
    assert review["selected_position"] is None
    assert review["selected_overlap_count"] is None
    assert all(r["focus_members"]==[] for r in review["rows"])
    assert all(r["formed"] is None or r["formed"] is False for r in review["rows"])
    assert review["actual_formation_computed"] is False
    assert review["fortune_conclusion"] is None
    assert review["timing_conclusion"] is None
    assert chart["review_flow"]["report"]["sanhe_focus_digest"]

def test_multiple_fumu_keep_all_candidates_and_positions_not_automatically_selected():
    chart=cast_six_yao(_nums(),focus_liuqin="父母")
    review=chart["sanhe_focus_review"]
    assert review["status"]=="multiple_visible"
    assert review["focus_positions"]==[3,6]
    assert review["selected_position"] is None
    water=_water(review)
    assert water["positions"]==[5,1,3]
    assert len(water["focus_members"])==2
    at3=next(r for r in water["focus_members"] if r["position"]==3)
    at6=next(r for r in water["focus_members"] if r["position"]==6)
    assert at3["is_pattern_member"] is True
    assert at6["is_pattern_member"] is False
    assert at3["element"]=="土"
    assert at3["five_element_relation"]=="该爻五行克局"
    assert all(not r["is_selected_by_user"] for r in water["focus_members"])
    assert all(r["supports_focus"] is None and r["restrains_focus"] is None
               for r in review["rows"])

def test_user_selection_moves_overlap_flag_but_not_strength_or_formation():
    chart=cast_six_yao(_nums(),focus_liuqin="父母",focus_position=3)
    review=chart["sanhe_focus_review"]
    assert review["status"]=="user_selected"
    assert review["selected_position"]==3
    assert review["selected_overlap_count"]>=1
    water=_water(review)
    assert water["selected_position_is_member"] is True
    assert [r["position"] for r in water["focus_members"] if r["is_selected_by_user"]]==[3]
    chart2=cast_six_yao(_nums(),focus_liuqin="父母",focus_position=6)
    water2=_water(chart2["sanhe_focus_review"])
    assert water2["selected_position_is_member"] is False
    assert chart2["sanhe_focus_review"]["selected_overlap_count"]>=0
    assert review["strength_conclusion"] is None
    assert review["actual_formation_computed"] is False

def test_day_month_relations_stay_observations_and_list_original_void_clash_only():
    chart=cast_six_yao(_nums(),"甲子","午","父母",3)
    water=_water(chart["sanhe_focus_review"])
    season=water["season"]
    assert season["day_branch"]=="子"
    assert season["month_branch"]=="午"
    assert season["day_branch_in_pattern"] is True
    assert season["month_branch_in_pattern"] is False
    assert season["day_known"] is True
    assert season["month_known"] is True
    assert season["original_void_positions"]==[]
    assert 1 in season["original_month_clash_positions"]
    assert season["effective_formation"] is None
    missing=_water(cast_six_yao(_nums(),focus_liuqin="父母")["sanhe_focus_review"])
    assert missing["season"]["day_known"] is False
    assert missing["season"]["day_branch_in_pattern"] is None
    assert missing["season"]["month_element_relation"] is None
    assert missing["season"]["original_void_positions"] is None

def test_hidden_focus_is_not_fabricated_visible_candidate():
    chart=cast_six_yao([8,7,7,7,7,7],"甲子","卯","妻财")
    review=chart["sanhe_focus_review"]
    assert review["status"]=="hidden_focus"
    assert review["focus_category"]=="妻财"
    assert review["focus_positions"]==[]
    assert all(r["focus_members"]==[] for r in review["rows"])
    assert review["selected_position"] is None

def test_actual_movers_and_waiting_missing_branch_preserve_provenance():
    chart=cast_six_yao(_nums(5,1,(1,3)),"甲子","辰","世爻")
    review=chart["sanhe_focus_review"]
    waiting=[x for x in review["rows"] if x["source_type"]=="missing_branch_candidates"]
    assert waiting
    assert all(r["formed"] is False for r in waiting)
    assert all(len(r["moving_positions"])==2 for r in waiting)
    assert all(r["missing_branch"] not in r["branches"] for r in waiting)
    assert all(r["transformed_branch"] is None for r in waiting)
    assert all(r["season"]["effective_formation"] is None for r in waiting)

def test_mixed_sanhe_positions_are_true_movers_never_an_empty_list():
    found=0
    for low in TRIGRAMS:
        for high in TRIGRAMS:
            for moves in ((1,3),(4,6)):
                chart=cast_six_yao(_nums(low,high,moves))
                for row in chart["sanhe_focus_review"]["rows"]:
                    if row["source_type"]!="moving_transformed_candidates":
                        continue
                    found+=1
                    assert row["moving_positions"]==list(moves)
                    assert row["positions"]==list(moves)
                    assert row["formed"] is None
                    assert row["transformed_position"] in moves
                    assert row["transformed_branch"]==chart["bian_najia_lines"][
                        row["transformed_position"]-1]["branch"]
    assert found>0


def test_exhaustive_no_mutation_of_original_sanhe_geometry():
    # Each of 64 combinations, one mover, with/without focus.
    for low in TRIGRAMS:
        for high in TRIGRAMS:
            for focus in (None,"世爻"):
                chart=cast_six_yao(_nums(low,high,(1,)),focus_liuqin=focus)
                reference=chart["hexagram_combinations"]
                review=chart["sanhe_focus_review"]
                assert review["candidate_count"]==sum(reference["counts"].values())
                assert reference["formed_strength"] is None
                assert review["actual_formation_computed"] is False
                assert review["strength_conclusion"] is None
                assert review["timing_conclusion"] is None
