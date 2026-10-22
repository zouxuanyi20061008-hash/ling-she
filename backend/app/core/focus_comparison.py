"""V26 同类用神两现比较：由已算规则逐项罗列差异，不判哪爻优胜。

直接引用 V11 的人工选择、V24 真实来源与 V25 综合证据。
隐藏伏神单列日月及飞伏，不冒称本卦可见用神。
"""
from __future__ import annotations

AXES=[
    ("season","节令旺相概要"),
    ("day_relation","日辰五行关系"),
    ("month_relation","月建五行关系"),
    ("movement","本卦爻动静"),
    ("void","本爻旬空"),
    ("month_break","月建冲爻"),
    ("day_clash","日辰冲爻"),
    ("turnback","本位动变"),
    ("hua_void","本位动爻化空"),
    ("active_yuan","明动原神直连来源"),
    ("active_ji","明动忌神直连来源"),
]
SOURCE="https://www.shidianguji.com/book/XYXZSBY/chapter/1lzxsny7db6rt"

def _fact(value,known:bool=True):
    return {"status":"recorded" if known else "missing",
            "value":value if known else None,
            "effectiveness":"not_determined"}

def _candidate(chart:dict,focus:dict)->dict:
    pos=focus["position"]
    row=chart["najia_lines"][pos-1]
    sheet=next(x for x in chart["review_sheet"]["candidates"] if x["position"]==pos)
    effect=next(x for x in chart["focus_effect_review"]["candidates"] if x["position"]==pos)
    day=chart["calendar"]["day"]
    month=chart["calendar"]["month"]
    void=chart["void_context_review"]["rows"][pos-1]
    relations={
        "season":_fact(row["seasonal_status"]["grade"] if month else None,bool(month)),
        "day_relation":_fact(row["day_action"]["element_relation"] if day else None,bool(day)),
        "month_relation":_fact(row["month_action"]["element_relation"] if month else None,bool(month)),
        "movement":_fact("明动" if row["moving"] else "安静"),
        "void":_fact("旬空" if void["original_void"] else "不空",bool(day)),
        "month_break":_fact("月冲" if row["month_break_marker"] else "无月冲",bool(month)),
        "day_clash":_fact("日冲" if row["day_clash"] else "无日冲",bool(day)),
        "turnback":_fact(row["turnback"]["term"] if row["turnback"] else "无真实本位回头关系"),
        "hua_void":_fact("动而化空" if void["transformed_void"] else "无真实化空",bool(day)),
        "active_yuan":_fact(tuple(x["source_position"] for x in effect["roles"]["原神"]
                                  if x["kind"]=="active_direct_edge_pending_effect")),
        "active_ji":_fact(tuple(x["source_position"] for x in effect["roles"]["忌神"]
                                if x["kind"]=="active_direct_edge_pending_effect")),
    }
    return {
        "position":pos,"ganzhi":row["ganzhi"],
        "selected_by_user":chart["focus_decision"]["selected_position"]==pos,
        "facts":relations,
        "supporting":sheet["supporting"],
        "restraining":sheet["restraining"],
        "pending":sheet["pending"],
        "cross_checks":list(void["cross_checks"]),
        "selection_reason_from_program":None,
        "determined_effect":None,
    }

def decorate_focus_comparison(chart:dict)->dict:
    decision=chart["focus_decision"]
    calendar=chart["calendar"]
    candidates=[_candidate(chart,focus) for focus in decision["candidates"]]
    diffs=[]
    for i,left in enumerate(candidates):
        for right in candidates[i+1:]:
            difference=[]
            for key,title in AXES:
                a,b=left["facts"][key],right["facts"][key]
                if a["status"]=="missing" or b["status"]=="missing":
                    state="missing"
                elif a["value"]!=b["value"]:
                    state="different"
                else:
                    state="same"
                difference.append({
                    "id":key,"title":title,"state":state,
                    "first_value":a["value"],"second_value":b["value"]})
            diffs.append({
                "first_position":left["position"],"second_position":right["position"],
                "axes":difference,
                "different_keys":[x["id"] for x in difference if x["state"]=="different"],
                "missing_keys":[x["id"] for x in difference if x["state"]=="missing"],
                "winner":None,"score":None,
            })
    if decision["status"]=="not_selected":status="focus_not_selected"
    elif decision["status"]=="not_visible":status="focus_not_visible"
    elif not calendar["day"] or not calendar["month"]:status="calendar_incomplete"
    elif len(candidates)>1:status="comparison_ready"
    else:status="single_candidate"
    chart["focus_comparison"]={
        "version":"V26","status":status,"focus_category":chart["focus"]["category"] if chart.get("focus") else None,
        "selected_position":decision["selected_position"],
        "candidates":candidates,"pairs":diffs,
        "axis_labels":[{"id":key,"title":title} for key,title in AXES],
        "hidden_candidates":list(decision.get("hidden_candidates",[])),
        "calendar_source":"server_recomputed_calendar" if chart.get("calendar_provenance") else "manual_ganzhi_unverified",
        "selected_by_user_only":True,
        "has_auto_ranking":False,"final_yongshen":None,
        "fortune_conclusion":None,"timing_conclusion":None,
        "boundary":"只对比实有本卦候选爻的日月、动静、空破与原忌真明动来源。缺日或月必须显示未核；同条件不代表作用相等，差异不代表排名；用户选择也不等于已证实唯一用神。",
        "references":{"liangxian":SOURCE},
    }
    return chart
