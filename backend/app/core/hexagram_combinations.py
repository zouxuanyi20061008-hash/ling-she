"""V39: static 六冲/六合卦 shape and candidate 三合局 branch patterns.

Based on 浑天纳甲 (inner/outer branch pairing), 《增删卜易》六合章.
A pair of static lines can characterize a hexagram's type, but static lines
do not become moving; matching three branches is never proof of effective 合化.
"""
from __future__ import annotations

from itertools import product
from .calendar import OPPOSITES
from .dynamics import LIUHE
from .hexagrams import BY_LINES
from .najia import NAJIA

TRIADS=(
    ("水",("申","子","辰"),"子"),
    ("木",("亥","卯","未"),"卯"),
    ("火",("寅","午","戌"),"午"),
    ("金",("巳","酉","丑"),"酉"),
)
SOURCE="https://zh.wikisource.org/zh-hans/增删卜易/19"
HE_NAMES={"否","泰","困","节","旅","贲","豫","复"}
CHONG_NAMES={"乾","兑","离","震","巽","坎","艮","坤","无妄","大壮"}


def _palace_shape(lines:tuple[int,...])->dict:
    if len(lines)!=6 or any(type(bit) is not int or bit not in (0,1) for bit in lines):
        raise ValueError("六冲六合要求六条阴阳爻")
    low=BY_LINES[tuple(lines[:3])]
    high=BY_LINES[tuple(lines[3:])]
    branches=[g[1] for g in NAJIA[low]["inner"]+NAJIA[high]["outer"]]
    evidence=[]
    for i in range(3):
        bottom,top=branches[i],branches[i+3]
        evidence.append({"positions":[i+1,i+4],"branches":[bottom,top],
            "is_six_he":LIUHE[bottom]==top,
            "is_six_chong":OPPOSITES[bottom]==top})
    status=("six_he" if all(e["is_six_he"] for e in evidence) else
            "six_chong" if all(e["is_six_chong"] for e in evidence) else "other")
    return {"kind":status,"pair_evidence":evidence}


def _cross_checks(chart,positions):
    originals=chart["najia_lines"]
    month=chart["calendar"]["month"]
    day=chart["calendar"]["day"]
    warnings=[]
    if not day:warnings.append("未确认日辰，旬空未核")
    if not month:warnings.append("未确认节令月建，月破未核")
    for pos in set(positions):
        line=originals[pos-1]
        if day and line.get("is_xunkong") is True:
            warnings.append(str(pos)+"爻旬空，须复核实效")
        if month and line.get("month_break_marker") is True:
            warnings.append(str(pos)+"爻逢月冲，须复核实效")
    return warnings


def _matches(rows,branches):
    indices=[[r["position"] for r in rows if r["branch"]==branch] for branch in branches]
    if any(not group for group in indices):return []
    return [tuple(combo) for combo in product(*indices)
            if len(set(combo))==3]


def _triad_candidates(chart):
    rows=chart["najia_lines"]
    changed=chart["bian_najia_lines"]
    moving=set(chart["dong_yao"])
    visible=[]
    mixed=[]
    waiting=[]
    for element,branches,center in TRIADS:
        matches=_matches(rows,branches)
        for triple in matches:
            movers=sorted(p for p in triple if p in moving)
            if len(movers)==0:
                kind="static_three_branches"
            elif len(movers)==1:
                kind="one_moving_three_branches"
            else:
                kind="multiple_moving_three_branches"
            visible.append({
                "element":element,"branches":list(branches),"central_branch":center,
                "positions":list(triple),"moving_positions":movers,"kind":kind,
                "formed":None,"calendar_warnings":_cross_checks(chart,triple)
            })
        # '虚三待用': only 2 confirmed moving visible branches, absent third.
        for absent in branches:
            present=[r for r in rows if r["branch"] in branches and r["branch"]!=absent
                     and r["position"] in moving]
            if any(r["branch"]==absent for r in rows):
                continue
            first=[r for r in present if r["branch"]==branches[0]] if branches[0]!=absent else []
            second=[r for r in present if r["branch"]==branches[1]] if branches[1]!=absent else []
            third=[r for r in present if r["branch"]==branches[2]] if branches[2]!=absent else []
            active=[group for group in (first,second,third) if group]
            if len(active)!=2:continue
            for left,right in product(*active):
                waiting.append({
                    "element":element,"present_branches":[left["branch"],right["branch"]],
                    "positions":[left["position"],right["position"]],
                    "missing_branch":absent,"kind":"two_moving_missing_third",
                    "formed":False,
                    "note":"虚三待用仅列现有两明动与缺支，不推断何时补足"
                })

        # One inner/outer group at 1,3 or 4,6 is really moving at both ends.
        # Evaluate ORIGINAL pair plus one changed branch at one moving position.
        for edge in ((1,3),(4,6)):
            a,b=edge
            if a not in moving or b not in moving:continue
            for position in edge:
                branches_on_edges=[
                    rows[a-1]["branch"],rows[b-1]["branch"],
                    changed[position-1]["branch"]
                ]
                if set(branches_on_edges)==set(branches):
                    mixed.append({
                        "element":element,"branches":list(branches),
                        "positions":[a,b],"changed_position":position,
                        "changed_branch":changed[position-1]["branch"],
                        "kind":"inner_or_outer_moving_transformed_candidate",
                        "formed":None,"calendar_warnings":_cross_checks(chart,edge),
                        "note":"仅列初三/四六双动与本位化支凑齐三支，效力待核"
                    })
    return visible,mixed,waiting


def decorate_hexagram_combinations(chart:dict)->dict:
    main=_palace_shape(tuple(chart["ben_gua"]["lines_bottom_to_top"]))
    changed=_palace_shape(tuple(chart["bian_gua"]["lines_bottom_to_top"]))
    # Both names are checked against the branch geometry, not used as lookup.
    ben_name=chart["ben_gua"]["name"]
    bian_name=chart["bian_gua"]["name"]
    for name,record in ((ben_name,main),(bian_name,changed)):
        if (name in HE_NAMES)!=(record["kind"]=="six_he"):
            raise RuntimeError("六合卦名与纳甲支对照不一致："+name)
        if (name in CHONG_NAMES)!=(record["kind"]=="six_chong"):
            raise RuntimeError("六冲卦名与纳甲支对照不一致："+name)
    visible,mixed,waiting=_triad_candidates(chart)
    label={"six_he":"六合卦","six_chong":"六冲卦","other":"非六冲六合卦"}
    main["name"]=ben_name
    main["label"]=label[main["kind"]]
    changed["name"]=bian_name
    changed["label"]=label[changed["kind"]]
    chart["hexagram_combinations"]={
        "version":"V39","ben":main,"bian":changed,
        "transition":main["label"]+" → "+changed["label"],
        "original_triad_candidates":visible,
        "moving_transformed_candidates":mixed,
        "missing_branch_candidates":waiting,
        "counts":{"visible":len(visible),"mixed":len(mixed),"waiting":len(waiting)},
        "moving_positions":list(chart["dong_yao"]),
        "formed_strength":None,"fortunate":None,"timing_conclusion":None,
        "rules":[
            "六合卦与六冲卦由本、变卦上下三对纳甲支全部相合/相冲确定；与单个动爻合冲严格区分。",
            "三合局列四组地支及原卦是否齐全，明确区分全静、一动、两动以上与初三/四六动变候选。",
            "三支静态俱全不代表实际合局，更不能据此得出旺衰、真假空、吉凶或应期。",
            "日月空破资料缺失、局内爻空破或不同流派条件，须先人工复核。",
        ],
        "scope":"卦类与地支组合之可核对结构。三合都标候选，不认定合化实效。",
        "reference":SOURCE,
    }
    return chart
