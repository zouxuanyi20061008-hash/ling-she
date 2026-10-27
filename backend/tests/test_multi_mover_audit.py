"""V46 多动爻两两真实本卦边，冲合动墓与 V45 原忌仇复核。"""
from copy import deepcopy
from itertools import combinations

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.hexagrams import TRIGRAMS
from app.core.liuyao import cast_six_yao
from app.core.multi_mover_audit import decorate_multi_mover_audit


def pair_at(data,a,b):
    return next(x for x in data["pairs"] if x["positions"]==[a,b])


def test_all_six_moving_has_15_unordered_pairs_and_30_directions():
    chart=cast_six_yao([9]*6,"甲子","辰","父母",3)
    result=chart["multi_mover_audit"]
    assert result["version"]=="V46"
    assert result["moving_positions"]==[1,2,3,4,5,6]
    assert result["pair_count"]==15
    assert len(result["pairs"])==15
    assert {tuple(p["positions"]) for p in result["pairs"]}==set(combinations(range(1,7),2))
    assert all(p["a_to_b"]["effective"] is None and
               p["b_to_a"]["effective"] is None and
               p["joint_effectiveness"] is None for p in result["pairs"])
    ab=pair_at(result,2,4)
    assert ab["a_to_b"]["source_position"]==2
    assert ab["b_to_a"]["source_position"]==4
    links=[x for x in ab["focus_links"] if x["focus_position"]==3]
    assert len(links)==1
    assert links[0]["yuan_ji_pair"] is True
    assert {links[0]["a_role"],links[0]["b_role"]}=={"原神","忌神"}
    assert any(x["two_hop_via_roles"]==["忌神"] for x in
               pair_at(result,1,2)["focus_links"] if x["focus_position"]==3)
    assert any(x["two_hop_via_roles"]==["原神"] for x in
               pair_at(result,1,4)["focus_links"] if x["focus_position"]==3)
    assert result["auto_rank_movers"] is False
    assert result["fortune_conclusion"] is None
    assert chart["review_flow"]["report"]["multi_mover_digest"]


def test_static_and_one_real_mover_have_zero_pairs():
    for arr,status in (([7]*6,"no_moving_lines"),([9,7,7,7,7,7],"single_mover_only")):
        d=cast_six_yao(arr,"甲子","辰","父母")["multi_mover_audit"]
        assert d["status"]==status
        assert d["pairs"]==[]
        assert d["focus_links"]==[]
        assert d["pair_count"]==0


def test_without_calendar_pair_relations_exist_but_void_month_unknown():
    d=cast_six_yao([9,9,7,7,7,7],focus_liuqin="世爻")["multi_mover_audit"]
    p=d["pairs"][0]
    assert p["positions"]==[1,2]
    assert p["a_to_b"]["relation"] and p["b_to_a"]["relation"]
    for state in (p["a_state"],p["b_state"]):
        assert state["original_void"] is None
        assert state["month_clash"] is None
        assert state["actual_changed_void"] is None
        assert state["actual_changed_month_clash"] is None
        assert state["restriction_flags"]==[]
        assert state["missing_inputs"]
    assert d["effective_action_computed"] is False


def test_both_moving_combine_and_tomb_match_existing_classical_condition_marks():
    # Several hexagrams exercise the deterministic clash/combine/tomb comparison
    # without ever claiming that any of these conditions is effective.
    for lo in TRIGRAMS.values():
        for hi in TRIGRAMS.values():
            bits=lo["lines"]+hi["lines"]
            arr=[9 if x else 6 for x in bits]
            c=cast_six_yao(arr,"甲子","辰","世爻")
            for p in c["multi_mover_audit"]["pairs"]:
                assert p["mutual_combine"]==p["special"]["both_moving_combine_candidate"]
                assert p["mutual_clash"]==p["a_to_b"]["clash"]==p["b_to_a"]["clash"]
                assert p["special"]["conclusion"] is None
                assert p["strength_verdict"] is None


def test_no_focus_or_hidden_focus_do_not_invent_role_source_pairs():
    none=cast_six_yao([9]*6,"甲子","辰")["multi_mover_audit"]
    assert none["pair_count"]==15
    assert none["focus_links"]==[]
    hidden=cast_six_yao([6,9,6,9,6,9],"甲子","卯","妻财")["multi_mover_audit"]
    if hidden["focus_status"]=="focus_not_visible":
        assert hidden["focus_links"]==[]


def test_corrupt_one_direction_or_mover_set_fails_validation():
    c=cast_six_yao([9]*6,"甲子","辰","父母",3)
    broken=deepcopy(c)
    row=broken["cross_condition_audit"]["rows"][1]
    row["incoming_movers"]=[x for x in row["incoming_movers"] if x["source_position"]!=1]
    with pytest.raises(ValueError,match="恰有一条"):
        decorate_multi_mover_audit(broken)
    broken=deepcopy(c)
    broken["moving_influences"]["moving_positions"]=[1,2]
    with pytest.raises(ValueError,match="不一致"):
        decorate_multi_mover_audit(broken)


def test_64_hexagrams_two_real_movers_no_fake_extra_pairs():
    for lo in TRIGRAMS.values():
        for hi in TRIGRAMS.values():
            bits=lo["lines"]+hi["lines"]
            arr=[7 if x else 8 for x in bits]
            arr[0]=9 if bits[0] else 6
            arr[5]=9 if bits[5] else 6
            d=cast_six_yao(arr,"甲子","卯","世爻")["multi_mover_audit"]
            assert d["moving_positions"]==[1,6]
            assert d["pair_count"]==1
            assert d["pairs"][0]["positions"]==[1,6]
            assert d["has_complete_strength"] is False


def test_api_returns_v46_without_computed_future_or_ranking():
    r=TestClient(app).post("/api/liuyao/cast",json={
        "numbers":[9]*6,"day_ganzhi":"甲子","month_branch":"辰",
        "focus_liuqin":"父母","focus_position":3})
    assert r.status_code==200,r.text
    payload=r.json()
    assert payload["multi_mover_audit"]["pair_count"]==15
    assert payload["multi_mover_audit"]["timing_conclusion"] is None
    assert payload["review_flow"]["report"]["multi_mover_digest"]
    assert payload["review_flow"]["report"]["conclusion"] is None
