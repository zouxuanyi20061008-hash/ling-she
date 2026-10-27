"""V39: six clash/harmony hexagram geometry and conservative sanhe candidates."""
from app.core.hexagrams import TRIGRAMS
from app.core.liuyao import cast_six_yao
from app.core.hexagram_combinations import HE_NAMES, CHONG_NAMES, TRIADS

def _num(bits,movers=()):
    return [9 if b and i+1 in movers else 6 if not b and i+1 in movers
            else 7 if b else 8 for i,b in enumerate(bits)]

def _chart(lower,upper,movers=(),**kwargs):
    bits=TRIGRAMS[lower]["lines"]+TRIGRAMS[upper]["lines"]
    return cast_six_yao(_num(bits,movers),**kwargs)

def test_all_sixty_four_derive_exactly_eight_harmony_ten_clash_from_real_najia():
    harmony=set()
    clash=set()
    for lo in TRIGRAMS:
        for up in TRIGRAMS:
            chart=_chart(lo,up)
            group=chart["hexagram_combinations"]
            assert group["version"]=="V39"
            assert len(group["ben"]["pair_evidence"])==3
            assert group["ben"]["kind"]==group["bian"]["kind"]
            assert group["moving_positions"]==[]
            if group["ben"]["kind"]=="six_he":
                harmony.add(chart["ben_gua"]["name"])
                assert all(x["is_six_he"] for x in group["ben"]["pair_evidence"])
            if group["ben"]["kind"]=="six_chong":
                clash.add(chart["ben_gua"]["name"])
                assert all(x["is_six_chong"] for x in group["ben"]["pair_evidence"])
            assert group["fortunate"] is None
            assert group["formed_strength"] is None
            assert group["timing_conclusion"] is None
    assert harmony==HE_NAMES
    assert clash==CHONG_NAMES
    assert len(harmony)==8
    assert len(clash)==10

def test_qian_to_tai_three_outer_true_movers_six_chong_changes_six_he():
    chart=_chart(1,1,(4,5,6))
    r=chart["hexagram_combinations"]
    assert chart["ben_gua"]["name"]=="乾"
    assert chart["bian_gua"]["name"]=="泰"
    assert r["ben"]["kind"]=="six_chong"
    assert r["bian"]["kind"]=="six_he"
    assert r["transition"]=="六冲卦 → 六合卦"
    assert any("六冲卦 → 六合卦" in x
               for x in chart["review_flow"]["report"]["combination_digest"])
    assert all(e["formed"] is None for e in r["original_triad_candidates"])

def test_original_three_visible_with_no_movers_is_static_not_formed():
    chart=_chart(1,1)
    candidates=chart["hexagram_combinations"]["original_triad_candidates"]
    assert len(candidates)>=2
    water=next(x for x in candidates if x["element"]=="水")
    assert water["branches"]==["申","子","辰"]
    assert water["positions"]==[5,1,3]
    assert water["kind"]=="static_three_branches"
    assert water["moving_positions"]==[]
    assert water["formed"] is None

def test_one_mover_two_movers_and_missing_calendar_are_never_final_formation():
    one=_chart(1,1,(5,))["hexagram_combinations"]
    water=next(x for x in one["original_triad_candidates"] if x["element"]=="水")
    assert water["kind"]=="one_moving_three_branches"
    assert water["moving_positions"]==[5]
    assert water["formed"] is None
    assert "未确认日辰，旬空未核" in water["calendar_warnings"]
    assert "未确认节令月建，月破未核" in water["calendar_warnings"]
    two=_chart(1,1,(1,5))["hexagram_combinations"]
    water=next(x for x in two["original_triad_candidates"] if x["element"]=="水")
    assert water["kind"]=="multiple_moving_three_branches"
    assert water["moving_positions"]==[1,5]
    assert two["fortunate"] is None

def test_waiting_for_missing_third_only_detects_two_real_movers_and_absent_branch():
    # 天风姤 has inner 丑亥酉 and outer 午申戌;
    # inner 丑+酉 move but 巳 is not visible in this original plate.
    chart=_chart(5,1,(1,3))
    r=chart["hexagram_combinations"]
    gold=[x for x in r["missing_branch_candidates"] if x["element"]=="金"]
    assert gold
    assert any(x["missing_branch"]=="巳" for x in gold)
    assert all(x["formed"] is False for x in gold)
    assert all(x["positions"]==[1,3] or x["positions"]==[3,1] for x in gold)

def test_mixed_three_candidates_require_inner_1_and_3_or_outer_4_and_6_to_move():
    # Scan all valid geometry once to ensure any reported mixed triple has a
    # genuine same-position changed branch and never a static phantom.
    found=False
    for lo in TRIGRAMS:
        for up in TRIGRAMS:
            chart=_chart(lo,up,(1,3))
            candidates=chart["hexagram_combinations"]["moving_transformed_candidates"]
            for c in candidates:
                found=True
                assert c["positions"]==[1,3]
                assert c["changed_position"] in (1,3)
                assert c["changed_branch"]==chart["bian_najia_lines"][c["changed_position"]-1]["branch"]
                originals={chart["najia_lines"][0]["branch"],
                           chart["najia_lines"][2]["branch"],c["changed_branch"]}
                assert originals==set(c["branches"])
                assert c["formed"] is None
            static=_chart(lo,up)["hexagram_combinations"]
            assert static["moving_transformed_candidates"]==[]
    assert found

def test_all_four_five_element_triad_sets_are_distinct():
    assert {e for e,_,_ in TRIADS}=={"木","水","火","金"}
    all_branches=[b for _,branches,_ in TRIADS for b in branches]
    assert len(all_branches)==12
    assert len(set(all_branches))==12
