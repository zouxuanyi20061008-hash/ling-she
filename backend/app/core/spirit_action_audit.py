"""V45 · 元忌仇作用链的真实明动边与来源制约（非作用效力裁定）。

单段：元/忌本卦爻确实明动 => 选定可见用神本卦爻；
双段：仇本卦明动 => 元/忌本卦明动 => 选定可见用神。
双段仅证明两条【本卦真实明动】的五行边存在；不预测其效力、
力量胜负、取用、真空假空、吉凶或应期。静态角色不构成主动边。
"""
from __future__ import annotations

from .yongshen_pathways import SOURCES

DIRECT_ROLE_RELATIONS={
    "原神":"动爻生本卦爻",
    "忌神":"动爻克本卦爻",
}
FIRST_HOP_RELATIONS={
    "原神":"动爻克本卦爻",  # 仇克原
    "忌神":"动爻生本卦爻",  # 仇生忌
}

def _snapshot(audit:dict)->dict:
    computed=audit["computed"]
    change=audit["actual_change"]
    return {
        "position":audit["position"],"ganzhi":audit["ganzhi"],
        "moving":audit["moving"],
        "original_void":computed["original_void"],
        "month_clash":computed["original_month_clash"],
        "day_clash":computed["original_day_clash"],
        "season":computed["season"],
        "changed_void":change["original_void"] if change else None,
        "changed_month_clash":change["month_clash"] if change else None,
        "returning_term":change["returning_term"] if change else None,
        "missing_inputs":list(audit["missing_inputs"]),
        "cross_check_ids":[x["id"] for x in audit["checks"]],
    }


def _limits(state:dict)->list[str]:
    result=[]
    if state["original_void"] is True:result.append("original_xun_void")
    if state["month_clash"] is True:result.append("original_month_clash")
    if state["day_clash"] is True:result.append("original_day_clash")
    if state["changed_void"] is True:result.append("actual_changed_xun_void")
    if state["changed_month_clash"] is True:result.append("actual_changed_month_clash")
    if state["returning_term"]=="回头克":result.append("returning_restrains_source")
    if state["returning_term"]=="回头冲":result.append("returning_clash")
    if state["season"]=="余气":result.append("residual_month_qi")
    return result


def _edge(chart:dict,source:int,target:int)->dict|None:
    incoming=chart["cross_condition_audit"]["rows"][target-1]["incoming_movers"]
    matching=[e for e in incoming if e["source_position"]==source]
    if len(matching)>1:
        raise ValueError("V45 本卦两个爻位之间不能有重复明动作用边")
    return matching[0] if matching else None


def _line_sources(paths:dict,role:str,chart:dict,target:int)->list[dict]:
    rows=chart["cross_condition_audit"]["rows"]
    results=[]
    for path in paths:
        src=path["source_position"]
        if src==target or not 1<=src<=6:
            raise ValueError("V45 来源与用神不能同爻且爻位必须有效")
        original=chart["najia_lines"][src-1]
        if original["position"]!=src or original["moving"]!=path["moving"]:
            raise ValueError("V45 既有来源角色与本卦动静状态不一致")
        state=_snapshot(rows[src-1])
        kind=("indirect_role" if role=="仇神" else
              "active_direct_edge" if path["relation_scope"]=="active_original_line_edge" else
              "static_role_reference")
        edge=_edge(chart,src,target)
        if role in DIRECT_ROLE_RELATIONS:
            if kind=="active_direct_edge":
                if not path["moving"] or edge is None or (
                        edge["relation"]!=DIRECT_ROLE_RELATIONS[role] or
                        path["relation_to_target"]!=edge["relation"]):
                    raise ValueError("V45 元忌真实明动路径与 V44 本卦作用边不一致")
            elif path["moving"] or edge is not None:
                raise ValueError("V45 元忌明动必须有已确认的本卦直达用神作用边")
        elif path["relation_scope"]!="indirect_elemental_chain" or path["relation_to_target"] is not None:
            raise ValueError("V45 仇神不得冒充直接作用用神的路径")
        flags=_limits(state)
        results.append({
            "role":role,"source_position":src,"source_ganzhi":original["ganzhi"],
            "target_position":target,"moving":path["moving"],
            "kind":kind,
            "actual_original_moving_edge":kind=="active_direct_edge",
            "relation_to_target":edge["relation"] if kind=="active_direct_edge" else None,
            "source_state":state,"source_limit_flags":flags,
            "missing_inputs":state["missing_inputs"],
            "status":"active_edge_pending_effect" if kind=="active_direct_edge" else "reference_only",
            "actual_effectiveness":None,
        })
    return results


def _candidate(chart:dict,focus:dict)->dict:
    target=focus["position"]
    rows=chart["cross_condition_audit"]["rows"]
    target_state=_snapshot(rows[target-1])
    roles={role:_line_sources(focus["pathways"][role],role,chart,target)
           for role in ("原神","忌神","仇神")}
    direct={role:[s for s in roles[role] if s["actual_original_moving_edge"]]
            for role in DIRECT_ROLE_RELATIONS}
    # Use only original-moving edges for both legs. A nonmoving middle role
    # cannot relay a source's movement, and a changed-line edge is forbidden.
    hops=[]
    for role,expected_first in FIRST_HOP_RELATIONS.items():
        for middle in direct[role]:
            mid_pos=middle["source_position"]
            for chou in roles["仇神"]:
                if not chou["moving"]:
                    continue
                first=_edge(chart,chou["source_position"],mid_pos)
                second=_edge(chart,mid_pos,target)
                if first is None:
                    raise ValueError("V45 仇神明动缺少指向本卦原忌爻的基础作用边")
                if first["relation"]!=expected_first:
                    raise ValueError("V45 仇神到原忌的五行方向与角色定义不符")
                if second is None or second["relation"]!=DIRECT_ROLE_RELATIONS[role]:
                    raise ValueError("V45 原忌到用神的第二段明动作用边不一致")
                hops.append({
                    "via_role":role,
                    "positions":[chou["source_position"],mid_pos,target],
                    "first_relation":first["relation"],
                    "second_relation":second["relation"],
                    "first_source_limit_flags":list(chou["source_limit_flags"]),
                    "middle_source_limit_flags":list(middle["source_limit_flags"]),
                    "target_limit_flags":_limits(target_state),
                    "two_confirmed_original_moving_edges":True,
                    "actual_effectiveness":None,
                    "note":"两段本卦明动的五行方向成立，不证明间接生克已传递或有效。",
                })
    limited=[s["source_position"] for role in DIRECT_ROLE_RELATIONS
             for s in direct[role] if s["source_limit_flags"]]
    checks=[]
    if direct["原神"] and direct["忌神"]:
        checks.append({"id":"yuan_ji_both_active","title":"原忌同时明动直连",
                       "effective":None,"note":"两者不能净额相减或自动择优"})
    if limited:
        checks.append({"id":"direct_sources_with_conditions","title":"直连明动来源有空破或回头等待审条件",
                       "source_positions":sorted(set(limited)),"effective":None})
    if _limits(target_state) and (direct["原神"] or direct["忌神"]):
        checks.append({"id":"target_and_direct_sources","title":"直连来源与用神自身限制需同时合参",
                       "target_flags":_limits(target_state),"effective":None})
    if hops:
        checks.append({"id":"two_hop_original_edges","title":"仇神经原/忌至用神的双段本卦明动结构候选",
                       "candidate_count":len(hops),"effective":None})
    return {
        "position":target,"ganzhi":focus["ganzhi"],
        "selected_by_user":focus["selected_by_user"],
        "target_state":target_state,
        "target_limit_flags":_limits(target_state),
        "roles":roles,
        "active_direct_positions":{r:[x["source_position"] for x in direct[r]]
                                    for r in DIRECT_ROLE_RELATIONS},
        "two_hop_paths":hops,
        "checks":checks,
        "missing_inputs":list(target_state["missing_inputs"]),
        "unique_yongshen_selected_by_algorithm":False,
        "effective_yuan":None,"effective_ji":None,"effective_chou":None,
        "strength_verdict":None,"fortune_conclusion":None,"timing_conclusion":None,
    }


def decorate_spirit_action_audit(chart:dict)->dict:
    decision=chart["focus_decision"]
    old=chart["yongshen_pathways"]
    cross=chart["cross_condition_audit"]
    if [x["position"] for x in old["focus_candidates"]]!=cross["focus_candidate_positions"]:
        raise ValueError("V45 用神来源与 V44 可见候选爻位不一致")
    candidates=[_candidate(chart,focus) for focus in old["focus_candidates"]]
    if not chart.get("focus"):status="focus_not_selected"
    elif decision["status"]=="not_visible":status="focus_not_visible"
    elif not chart["calendar"]["day"] or not chart["calendar"]["month"]:
        status="calendar_incomplete"
    elif len(candidates)>1 and decision["selected_position"] is None:
        status="multiple_candidates_pending"
    else:status="condition_review_ready"
    chart["spirit_action_audit"]={
        "version":"V45","status":status,
        "focus_category":old["category"],
        "selected_position":decision["selected_position"],
        "candidates":candidates,
        "all_visible_candidates_retained":True,
        "auto_selects_yongshen":False,
        "effective_action_computed":False,
        "true_void_decision":None,"strength_verdict":None,
        "fortune_conclusion":None,"timing_conclusion":None,
        "rules":[
            "原神生用、忌神克用，仅本卦明动且已有真实本卦作用边才列为直连来源。",
            "仇神为克原、生忌的间接角色，不直接冒充克用神；双段候选两段均需真实明动。",
            "来源本爻、真实本位化爻及用神空破回头条件分别核查；受限标记不是失效结论。",
            "同类用神多现保留全部候选，不按路径数量、空破标记或明动数自动评分取舍。",
        ],
        "references":SOURCES,
        "boundary":"V45 只核验明动边的来源、方向与组合链；不判断传导实效、真假空、最终旺衰、吉凶或应期。",
    }
    return chart
