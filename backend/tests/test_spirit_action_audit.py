"""V45 追溯原忌真动直连与仇经原/忌的两段真实明动边。"""
from copy import deepcopy
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.hexagrams import TRIGRAMS
from app.core.liuyao import cast_six_yao
from app.core.spirit_action_audit import decorate_spirit_action_audit


def test_all_movers_produce_both_yuan_ji_direct_edges_and_true_two_hop_candidates():
    c=cast_six_yao([9]*6,"甲子","辰","父母",3)
    audit=c["spirit_action_audit"]
    assert audit["version"]=="V45"
    assert audit["status"]=="condition_review_ready"
    assert audit["selected_position"]==3
    assert [x["position"] for x in audit["candidates"]]==[3,6]
    first=audit["candidates"][0]
    assert first["selected_by_user"] is True
    assert first["active_direct_positions"]=={"原神":[4],"忌神":[2]}
    assert "yuan_ji_both_active" in {x["id"] for x in first["checks"]}
    assert first["roles"]["仇神"]
    assert all(not x["actual_original_moving_edge"] for x in first["roles"]["仇神"])
    assert first["two_hop_paths"]
    assert {tuple(x["positions"]) for x in first["two_hop_paths"]}=={(1,4,3),(1,2,3)}
    assert {x["via_role"] for x in first["two_hop_paths"]}=={"原神","忌神"}
    for x in first["two_hop_paths"]:
        assert x["two_confirmed_original_moving_edges"] is True
        assert x["actual_effectiveness"] is None
        assert x["first_relation"]==("动爻克本卦爻" if x["via_role"]=="原神" else "动爻生本卦爻")
        assert x["second_relation"]==("动爻生本卦爻" if x["via_role"]=="原神" else "动爻克本卦爻")
    assert first["strength_verdict"] is None
    assert first["effective_chou"] is None
    assert audit["effective_action_computed"] is False
    assert c["review_flow"]["report"]["spirit_action_digest"]
    assert c["review_flow"]["report"]["conclusion"] is None


def test_all_static_has_roles_but_zero_active_edges_or_two_hop():
    c=cast_six_yao([7]*6,"甲子","辰","父母")
    audit=c["spirit_action_audit"]
    assert audit["status"]=="multiple_candidates_pending"
    assert len(audit["candidates"])==2
    for focus in audit["candidates"]:
        assert focus["active_direct_positions"]=={"原神":[],"忌神":[]}
        assert focus["two_hop_paths"]==[]
        for role in ("原神","忌神"):
            assert all(source["kind"]=="static_role_reference" for source in focus["roles"][role])
        assert all(source["kind"]=="indirect_role" for source in focus["roles"]["仇神"])


def test_single_ji_mover_is_real_direct_without_invented_two_hop():
    c=cast_six_yao([7,9,7,7,7,7],"甲子","辰","父母")
    for focus in c["spirit_action_audit"]["candidates"]:
        assert focus["active_direct_positions"]["忌神"]==[2]
        assert focus["active_direct_positions"]["原神"]==[]
        assert focus["two_hop_paths"]==[]
        s=focus["roles"]["忌神"][0]
        assert s["kind"]=="active_direct_edge"
        assert s["relation_to_target"]=="动爻克本卦爻"
        assert s["actual_effectiveness"] is None
        assert s["source_state"]["moving"] is True


def test_no_date_produces_unknown_xunkong_month_for_source_and_change():
    c=cast_six_yao([9]*6,focus_liuqin="父母")
    for focus in c["spirit_action_audit"]["candidates"]:
        assert focus["missing_inputs"]
        for role in ("原神","忌神","仇神"):
            for source in focus["roles"][role]:
                state=source["source_state"]
                assert state["original_void"] is None
                assert state["month_clash"] is None
                if state["moving"]:
                    assert state["changed_void"] is None
                    assert state["changed_month_clash"] is None
                assert "original_xun_void" not in source["source_limit_flags"]
                assert "original_month_clash" not in source["source_limit_flags"]
        assert all(h["actual_effectiveness"] is None for h in focus["two_hop_paths"])


def test_no_focus_and_hidden_focus_have_no_computed_yongshen_paths():
    none=cast_six_yao([9]*6,"甲子","辰")
    block=none["spirit_action_audit"]
    assert block["status"]=="focus_not_selected"
    assert block["candidates"]==[]
    assert none["review_flow"]["report"]["spirit_action_digest"]==[]
    hidden=cast_six_yao([8,7,7,7,7,7],"甲子","卯","妻财")
    block=hidden["spirit_action_audit"]
    assert block["status"]=="focus_not_visible"
    assert block["candidates"]==[]
    assert block["auto_selects_yongshen"] is False
    assert block["fortune_conclusion"] is None


def test_corrupted_direct_edge_is_rejected_before_making_a_fake_action_chain():
    c=cast_six_yao([9]*6,"甲子","辰","父母",3)
    damaged=deepcopy(c)
    incoming=damaged["cross_condition_audit"]["rows"][2]["incoming_movers"]
    direct=next(e for e in incoming if e["source_position"]==4)
    direct["relation"]="动爻克本卦爻"
    with pytest.raises(ValueError,match="不一致"):
        decorate_spirit_action_audit(damaged)
    damaged=deepcopy(c)
    damaged["cross_condition_audit"]["rows"][3]["incoming_movers"]=[
        e for e in damaged["cross_condition_audit"]["rows"][3]["incoming_movers"]
        if e["source_position"]!=1
    ]
    with pytest.raises(ValueError,match="缺少"):
        decorate_spirit_action_audit(damaged)


def test_64_hexagrams_one_mover_never_forge_two_mover_chain():
    for lo in TRIGRAMS.values():
        for hi in TRIGRAMS.values():
            bits=lo["lines"]+hi["lines"]
            arr=[7 if x else 8 for x in bits]
            arr[0]=9 if bits[0] else 6
            c=cast_six_yao(arr,"甲子","卯","世爻")
            result=c["spirit_action_audit"]
            assert len(result["candidates"])==1
            assert result["candidates"][0]["two_hop_paths"]==[]
            assert result["candidates"][0]["fortune_conclusion"] is None
            assert result["effective_action_computed"] is False


def test_cast_api_exports_new_data_without_real_world_verdict():
    r=TestClient(app).post("/api/liuyao/cast",json={
        "numbers":[9]*6,"day_ganzhi":"甲子","month_branch":"辰",
        "focus_liuqin":"父母","focus_position":3})
    assert r.status_code==200,r.text
    chart=r.json()
    assert chart["spirit_action_audit"]["candidates"][0]["two_hop_paths"]
    assert chart["review_flow"]["report"]["spirit_action_digest"]
    assert chart["review_flow"]["report"]["has_final_decision"] is False
