"""六爻 V11 · 因事取用后按《增删卜易》两现章逐条审议候选。

允许使用者明确指定一处「研习主爻」，但拒绝无依据的程序自动选优。
两现的传统比较条件并非绝对淘汰条件：野鹤老人另举旬空/月破应事反例。
用神不现先核查日月是否同类，再对照本宫伏神，不把日月同五行
直接认定为已经完成择用。所有字段只引用已排出的六爻数据。
"""
from __future__ import annotations

from .najia import BRANCH_ELEMENT

REFERENCES = {
    "multiple":"https://www.shidianguji.com/book/XYXZSBY/chapter/1lzxsny7db6rt",
    "hidden":"https://www.shidianguji.com/book/XYXZSBY/chapter/1lzxsny7d9s7d",
}

CRITERIA = (
    ("月令概要","season"),
    ("明动与静爻","moving"),
    ("月破条件","month_break"),
    ("旬空条件","xunkong"),
    ("日辰冲合","day_clash"),
    ("本位回头关系","turnback"),
)
UNRESOLVED = "尚未校验日月真实历法、动变效力、墓绝、合绊以及事情本身的取用条件"


def _candidate(row:dict,chart:dict)->dict:
    day=row.get("day_action")
    month=row.get("month_action")
    dynamics=row.get("turnback")
    evidence=next((item for item in chart["day_month_review"]["candidates"]
                   if item["position"]==row["position"]),None)
    if evidence is None:
        raise ValueError("研习主爻与已有用神证据无法对应")
    season=row.get("seasonal_status")
    return {
        "position":row["position"],
        "ganzhi":row["ganzhi"],
        "liuqin":row["liuqin"],
        "element":row["element"],
        "indicators":{
            "season":season["grade"] if season else None,
            "moving":"明动" if row["moving"] else "安静",
            "month_break":row["month_break_marker"],
            "xunkong":row["is_xunkong"],
            "day_clash":row["conflict_review"]["day_clash"]["status"] if day else None,
            "turnback":dynamics["term"] if dynamics else None,
            "day_action":day["element_relation"] if day else None,
            "month_action":month["element_relation"] if month else None,
            "huakong":row.get("void_review",{}).get("moving_into_void"),
        },
        "supportive_observations":list(evidence["supportive_observations"]),
        "cautionary_observations":list(evidence["cautionary_observations"]),
        "note":"这里只陈列已算出的条件，不代表哪一爻较强或必然应事。",
    }


def _pairwise(first:dict,second:dict)->dict:
    differences=[]
    for label,key in CRITERIA:
        a,b=first["indicators"][key],second["indicators"][key]
        if a is not None and b is not None and a!=b:
            differences.append({"criterion":label,"first_value":a,"second_value":b})
    return {
        "first_position":first["position"],
        "second_position":second["position"],
        "differences":differences,
        "note":"按两现章比较差异，不能见动、旺、不空、不破便机械淘汰另一候选；原典另载旬空月破应事的反例。",
    }


def decorate_focus_decision(chart:dict,chosen_position:int|None=None)->dict:
    focus=chart.get("focus")
    if chosen_position is not None and (
        type(chosen_position) is not int or not 1<=chosen_position<=6
    ):
        raise ValueError("研习主爻只能选择初爻至上爻的一处")
    if not focus:
        if chosen_position is not None:
            raise ValueError("请先选择六亲或世应，再指定研习主爻")
        chart["focus_decision"]={
            "status":"not_selected","source":"user_required",
            "candidates":[],"selected_position":None,
            "message":"先由求测者明确事项与关注六亲或世应，不自动替用户取用。",
            "comparisons":[],"references":REFERENCES,
        }
        return chart

    positions=focus["primary_positions"]
    if chosen_position is not None and chosen_position not in positions:
        raise ValueError("所选爻位不是当前六亲或世应的本卦候选；请先切换关注类别")
    if not positions:
        if chosen_position is not None:
            raise ValueError("所选六亲本卦不现，不可虚构明现主爻")
        hidden=chart["fushen"]["selected"]
        month=chart["calendar"]["month"]
        day=chart["calendar"]["day"]
        possible=[]
        for candidate in hidden["entries"] if hidden else []:
            element=candidate["hidden"]["element"]
            possible.append({
                "position":candidate["position"],
                "hidden_ganzhi":candidate["hidden"]["ganzhi"],
                "flying_ganzhi":candidate["flying"]["ganzhi"],
                "element":element,
                "day_element_match":BRANCH_ELEMENT[day["day_branch"]]==element if day else None,
                "month_element_match":month["element"]==element if month else None,
                "flying_hidden_relation":candidate["flying_hidden_relation"],
                "hidden_is_void":candidate.get("void_review",{}).get("is_void"),
                "flying_is_void":candidate.get("void_review",{}).get("flying_is_void"),
            })
        chart["focus_decision"]={
            "status":"not_visible","source":"user_selected","category":focus["category"],
            "candidates":[],"hidden_candidates":possible,
            "selected_position":None,"comparisons":[],
            "message":"本卦不现所选六亲。《增删卜易》先核日月同类取用的可能，再参本宫伏神；当前仅核对五行和飞伏位置，不自动确定真实用神。",
            "needs":["确认所问对象","核实日辰及节令月建","考虑日月取用","逐项核对飞伏、空破与生克"],
            "references":REFERENCES,
        }
        return chart

    candidates=[_candidate(chart["najia_lines"][pos-1],chart) for pos in positions]
    comparisons=[_pairwise(a,b) for i,a in enumerate(candidates)
                 for b in candidates[i+1:]]
    status="multiple_visible" if len(candidates)>1 else "single_visible"
    unknown=[]
    if not chart["calendar"]["day"]:unknown.append("未确认六十甲子日，日辰/旬空证据不全")
    if not chart["calendar"]["month"]:unknown.append("未确认节令月建，月令/旺相/破证据不全")
    if any(item["indicators"]["season"]=="余气" for item in candidates):
        unknown.append("候选有月令余气，不能直接归入旺或休囚")
    if any(item["indicators"]["xunkong"] or item["indicators"]["month_break"] for item in candidates):
        unknown.append("至少一处候选逢空或月破；两现章记载空破之爻亦可能应事")
    if len(candidates)>1:
        unknown.append("同一六亲多现，不自动按动静、旺相、空破决定取舍")
    chart["focus_decision"]={
        "status":status,"category":focus["category"],"source":"user_selected",
        "candidates":candidates,"comparisons":comparisons,
        "selected_position":chosen_position,
        "selection_origin":"user_explicit" if chosen_position is not None else None,
        "selected_candidate":next((x for x in candidates if x["position"]==chosen_position),None),
        "outstanding_checks":unknown,
        "requires_human_judgment":True,
        "complete_strength_computed":False,"fortune_conclusion":None,
        "message":("本卦有多个候选，逐项对照月令、动静、空破与回头作用；"
                   "传统优先条件及其反例一并保留，不由程序评出唯一优胜者。"
                   if status=="multiple_visible" else
                   "本卦有一处相关爻，但还没有完成真实历法核对与旺衰取用判断。"),
        "limitation":UNRESOLVED,
        "references":REFERENCES,
    }
    return chart
