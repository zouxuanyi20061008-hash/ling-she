"""V46 多动爻双向作用、合冲/动墓与原忌仇角色交叉核验。

复用 V44 本卦实际明动作用边、V45 来源状态及 V17 合墓证据。
每对只算一次位置组合，方向各记一次，不把变爻跨位当明动。
所有结果只是可复算的传统条件；效力、旺衰和应期仍为未知。
"""
from __future__ import annotations
from itertools import combinations

from .spirit_action_audit import _snapshot, _limits


def _direction(chart:dict,source:int,target:int)->dict:
    edges=chart["cross_condition_audit"]["rows"][target-1]["incoming_movers"]
    matches=[x for x in edges if x["source_position"]==source]
    if len(matches)!=1:
        raise ValueError("V46 明动爻之间必须恰有一条真实本卦定向作用边")
    x=matches[0]
    if x["target_position"]!=target or x["source_position"]!=source:
        raise ValueError("V46 本卦作用边起止位置不一致")
    return {
        "source_position":source,"target_position":target,
        "relation":x["relation"],
        "clash":x["clash"],"combine":x["combine"],
        "actual_original_mover":True,
        "effective":None,
    }


def _special_pair(chart:dict,a:int,b:int)->dict:
    first=chart["special_conditions"]["rows"][a-1]
    second=chart["special_conditions"]["rows"][b-1]
    def matching(row:dict,key:str,other:int)->list[str]:
        return [x["kind"] for x in row[key] if x["other_position"]==other]
    a_to_b_tomb=matching(first,"tombs",b)
    b_to_a_tomb=matching(second,"tombs",a)
    first_union=matching(first,"combinations",b)
    second_union=matching(second,"combinations",a)
    if bool(first_union)!=bool(second_union):
        raise ValueError("V46 两动爻六合标记在两侧不一致")
    return {
        "both_moving_combine_candidate":bool(first_union),
        "combination_kinds":list(dict.fromkeys(first_union+second_union)),
        "a_tomb_source_at_b":a_to_b_tomb,
        "b_tomb_source_at_a":b_to_a_tomb,
        "has_moving_tomb_candidate":bool(a_to_b_tomb or b_to_a_tomb),
        "conclusion":None,
    }


def _source_state(chart:dict,pos:int)->dict:
    a=chart["cross_condition_audit"]["rows"][pos-1]
    if a["position"]!=pos or not a["moving"] or a["actual_change"] is None:
        raise ValueError("V46 只能读取真实明动的本卦及本位化爻")
    state=_snapshot(a)
    return {
        "position":pos,"ganzhi":state["ganzhi"],
        "original_void":state["original_void"],
        "month_clash":state["month_clash"],
        "day_clash":state["day_clash"],
        "season":state["season"],
        "actual_changed_void":state["changed_void"],
        "actual_changed_month_clash":state["changed_month_clash"],
        "returning_term":state["returning_term"],
        "restriction_flags":_limits(state),
        "missing_inputs":list(state["missing_inputs"]),
        "effective":None,
    }


def _focus_links(chart:dict,a:int,b:int)->list[dict]:
    links=[]
    for focus in chart["spirit_action_audit"]["candidates"]:
        positions={}
        for role in ("原神","忌神","仇神"):
            for src in focus["roles"][role]:
                if src["source_position"] in (a,b):
                    positions[src["source_position"]]=role
        if a not in positions or b not in positions:
            continue
        matching_hops=[
            h["via_role"] for h in focus["two_hop_paths"]
            if set(h["positions"][:2])=={a,b}
        ]
        links.append({
            "focus_position":focus["position"],
            "focus_ganzhi":focus["ganzhi"],
            "selected_by_user":focus["selected_by_user"],
            "a_role":positions[a],"b_role":positions[b],
            "yuan_ji_pair":{positions[a],positions[b]}=={"原神","忌神"},
            "two_hop_via_roles":sorted(set(matching_hops)),
            "actual_effectiveness":None,
        })
    return links


def decorate_multi_mover_audit(chart:dict)->dict:
    original=chart["najia_lines"]
    positions=sorted(chart["moving_influences"]["moving_positions"])
    if positions!=sorted(chart["dong_yao"]):
        raise ValueError("V46 明动位置与原始起卦不一致")
    if any(original[p-1]["position"]!=p or not original[p-1]["moving"] for p in positions):
        raise ValueError("V46 不接受非明动爻作为动爻来源")
    pairs=[]
    for a,b in combinations(positions,2):
        ab=_direction(chart,a,b)
        ba=_direction(chart,b,a)
        if ab["clash"]!=ba["clash"] or ab["combine"]!=ba["combine"]:
            raise ValueError("V46 两动爻冲合应当双向一致")
        special=_special_pair(chart,a,b)
        if special["both_moving_combine_candidate"]!=bool(ab["combine"]):
            raise ValueError("V46 V17 两动爻六合与本卦动爻冲合标记不一致")
        a_state=_source_state(chart,a)
        b_state=_source_state(chart,b)
        pairs.append({
            "positions":[a,b],
            "a_to_b":ab,"b_to_a":ba,
            "a_state":a_state,"b_state":b_state,
            "mutual_clash":bool(ab["clash"]),
            "mutual_combine":bool(ab["combine"]),
            "special":special,
            "focus_links":_focus_links(chart,a,b),
            "a_has_constraint_flags":bool(a_state["restriction_flags"]),
            "b_has_constraint_flags":bool(b_state["restriction_flags"]),
            "joint_effectiveness":None,
            "strength_verdict":None,"timing_verdict":None,
        })
    count=len(positions)
    if count>=2 and len(pairs)!=count*(count-1)//2:
        raise ValueError("V46 明动两两配对数量不完整")
    candidate_links=[link for p in pairs for link in p["focus_links"]]
    chart["multi_mover_audit"]={
        "version":"V46",
        "status":"multiple_movers_ready" if pairs else
                 "single_mover_only" if positions else "no_moving_lines",
        "moving_positions":positions,
        "pair_count":len(pairs),"pairs":pairs,
        "focus_links":candidate_links,
        "focus_status":chart["spirit_action_audit"]["status"],
        "calendar_origin":("server_recomputed_calendar" if
            chart.get("calendar_provenance",{}).get("source")=="server_recomputed_calendar"
            else "manual_or_missing"),
        "rules":[
            "两动爻之间按两个方向分别读取本卦真实明动边；静爻和变爻都不作为跨位主动来源。",
            "冲与六合两侧须一致；两动爻相合候选与 V17 标记交叉验证，动墓方向分别记录。",
            "同一对原忌仇来源仅在本卦真实明动、且确为用神可见来源时挂接 V45 角色链。",
            "来源本卦旬空月冲及本位变爻的化空、回头克只标明审议条件，不等于关系失效。",
        ],
        "auto_rank_movers":False,"effective_action_computed":False,
        "has_complete_strength":False,"has_timing_prediction":False,
        "fortune_conclusion":None,"timing_conclusion":None,
        "boundary":"多动爻双向生克、冲合和动墓仅是同时出现的排盘规则；不作合绊/墓绝实效、旺衰胜负、原忌相消或实际应期判断。",
    }
    return chart
