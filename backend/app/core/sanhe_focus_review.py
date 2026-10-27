"""V40: describe how each 三合 pattern relates to user-chosen 六爻 positions.

This module reuses V39 original/changed pattern detection without treating
presence as effective 合局. Day/month branch and seasonal relationships are
observations, not additional moving lines or inferred 合化.
"""
from __future__ import annotations

from .hexagrams import GENERATES, CONTROLS
from .najia import BRANCH_ELEMENT

PATTERN_KEYS=(
    ("original_triad_candidates","本卦三支俱见"),
    ("moving_transformed_candidates","动变三支候选"),
    ("missing_branch_candidates","虚三待用"),
)


def _relation(group_element:str,line_element:str)->str:
    if group_element==line_element:return "同五行"
    if GENERATES[group_element]==line_element:return "局五行生该爻"
    if GENERATES[line_element]==group_element:return "该爻五行生局"
    if CONTROLS[group_element]==line_element:return "局五行克该爻"
    if CONTROLS[line_element]==group_element:return "该爻五行克局"
    raise ValueError("三合候选五行不合法")


def _season_context(chart:dict,group_element:str,pattern_branches:list[str],
                    positions:list[int])->dict:
    day=chart["calendar"]["day"]
    month=chart["calendar"]["month"]
    originals=chart["najia_lines"]
    return {
        "day_known":bool(day),"month_known":bool(month),
        "day_branch":day["day_branch"] if day else None,
        "month_branch":month["branch"] if month else None,
        "day_branch_in_pattern":day["day_branch"] in pattern_branches if day else None,
        "month_branch_in_pattern":month["branch"] in pattern_branches if month else None,
        "day_element_relation":_relation(group_element,BRANCH_ELEMENT[day["day_branch"]]) if day else None,
        "month_element_relation":_relation(group_element,month["element"]) if month else None,
        "original_void_positions":[p for p in positions if originals[p-1].get("is_xunkong") is True] if day else None,
        "original_month_clash_positions":[p for p in positions if originals[p-1].get("month_break_marker") is True] if month else None,
        "calendar_confirmed_by_server":chart.get("calendar_provenance",{}).get("source")=="server_recomputed_calendar",
        "effective_formation":None,
        "note":"日月与局支的同支、生克及空破标记是待核条件；日月不会因此自动成为第三个明动爻。",
    }


def decorate_sanhe_focus(chart:dict)->dict:
    combination=chart["hexagram_combinations"]
    focus=chart.get("focus")
    decision=chart["focus_decision"]
    positions=list(focus["primary_positions"]) if focus else []
    selected=decision.get("selected_position")
    rows=[]
    matches_selected=0
    for key,label in PATTERN_KEYS:
        for number,item in enumerate(combination[key],1):
            actual_positions=list(item["positions"])
            pattern_branches=(list(item["present_branches"]) if key=="missing_branch_candidates"
                              else list(item["branches"]))
            members=[]
            for pos in positions:
                line=chart["najia_lines"][pos-1]
                overlaps=pos in actual_positions
                members.append({
                    "position":pos,"ganzhi":line["ganzhi"],"liuqin":line["liuqin"],
                    "role":line["role"],"element":line["element"],
                    "is_selected_by_user":pos==selected,
                    "is_pattern_member":overlaps,
                    "five_element_relation":_relation(item["element"],line["element"]),
                    "actual_formation_or_strength":None,
                })
            selected_member=(selected in actual_positions if selected is not None else None)
            if selected_member:matches_selected+=1
            rows.append({
                "candidate_key":key+":"+str(number),
                "kind":item["kind"],"source_type":key,"source_label":label,
                "element":item["element"],"branches":pattern_branches,
                "positions":actual_positions,
                "moving_positions":list(item.get("moving_positions",actual_positions if key=="missing_branch_candidates" else [])),
                "missing_branch":item.get("missing_branch"),
                "transformed_branch":item.get("changed_branch"),
                "transformed_position":item.get("changed_position"),
                "focus_members":members,
                "selected_position_is_member":selected_member,
                "season":_season_context(chart,item["element"],pattern_branches,actual_positions),
                "formed":None if key!="missing_branch_candidates" else False,
                "supports_focus":None,"restrains_focus":None,"outcome":None,
            })
    if focus is None:status="no_focus"
    elif not positions:status="hidden_focus"
    elif selected is not None:status="user_selected"
    elif len(positions)>1:status="multiple_visible"
    else:status="one_visible"
    chart["sanhe_focus_review"]={
        "version":"V40","status":status,
        "focus_category":focus["category"] if focus else None,
        "focus_positions":positions,"selected_position":selected,
        "candidate_count":len(rows),"selected_overlap_count":matches_selected if selected is not None else None,
        "rows":rows,
        "actual_formation_computed":False,"strength_conclusion":None,
        "fortune_conclusion":None,"timing_conclusion":None,
        "notes":[
            "先核定求测事项与用神；多现六亲并不自动优选，也不可因三合位置而擅选。",
            "三合局五行与用神五行可计算生克关系，但实际成局、合化及其对用神的效力仍须结合动静与空破人工核查。",
            "日辰或月建同某局支，不代表该支自动发动或补全三合；缺少日月时相应条件保持未知。",
            "若没有明确选择用神，三合与用神的交集及影响均不自动判定。",
        ],
        "boundary":"只列三合候选与用神、世应、日月之间可核算的结构关系；不判成局效力、旺衰、吉凶和应期。",
    }
    return chart
