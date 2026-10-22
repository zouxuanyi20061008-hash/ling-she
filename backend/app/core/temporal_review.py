"""V22 · 六爻旬空与日支时间条件研究（非应期预测）。

只使用已算六十甲子及本卦实际明现用神爻。无历法来源不补公历日期；
即使已换算日期，也只列传统历法条件，绝不把关系等同真实应事。
"""
from __future__ import annotations

from datetime import date, timedelta
from .calendar import SIXTY_DAYS, OPPOSITES

WINDOW_DAYS=30


def _candidate(chart:dict, position:int, day_index:int, anchor:date|None)->dict:
    line=chart["najia_lines"][position-1]
    branch=line["branch"]
    origin_void=line["void_review"]["is_void"] is True
    first_new_xun=10-day_index%10
    events=[]
    for offset in range(1, WINDOW_DAYS+1):
        ganzhi=SIXTY_DAYS[(day_index+offset)%60]
        day_branch=ganzhi[1]
        checks=[]
        if day_branch==branch:
            checks.append({
                "id":"same_branch","title":"本爻支值日",
                "basis":"候选日地支与本卦该爻地支相同",
            })
            if origin_void:
                checks.append({
                    "id":"void_branch_day","title":"原旬空支逢值日（参照）",
                    "basis":"原起卦日此爻旬空，现遇同支日；不等于已判填实",
                })
        if day_branch==OPPOSITES[branch]:
            checks.append({
                "id":"clash_branch","title":"日支冲本爻",
                "basis":"候选日支与本卦该爻支六冲；不等于断暗动或应期",
            })
        if origin_void and offset==first_new_xun:
            checks.append({
                "id":"next_xun","title":"原旬空后的换旬参照",
                "basis":"从起卦日所在甲旬进入下一甲旬；不等于自动出空或填实",
            })
        if checks:
            events.append({
                "offset_days":offset,
                "day_ganzhi":ganzhi,
                "solar_date":(anchor+timedelta(days=offset)).isoformat() if anchor else None,
                "conditions":checks,
                "confidence":"calendar_relation_only",
            })
    return {
        "position":position,
        "ganzhi":line["ganzhi"],
        "branch":branch,
        "originally_void":origin_void,
        "selected_by_user":chart["focus_decision"]["selected_position"]==position,
        "events":events,
        "outcome":None,
    }


def decorate_temporal_review(chart:dict)->dict:
    day=chart["calendar"]["day"]
    decision=chart["focus_decision"]
    provenance=chart.get("calendar_provenance")
    anchor=None
    if provenance is not None:
        if day is None or provenance.get("day_ganzhi")!=day["ganzhi"]:
            raise ValueError("日期来源与正式排盘日干支不一致，不能列时间条件")
        anchor=date.fromisoformat(provenance["solar_date"])
    available=day is not None
    if not chart.get("focus"):
        status="focus_not_selected"
    elif decision["status"]=="not_visible":
        status="focus_not_visible"
    elif not available:
        status="day_missing"
    elif anchor is None:
        status="relative_ganzhi_only"
    else:
        status="dated_calendar_relations"
    candidates=[]
    if available and decision["candidates"]:
        day_index=SIXTY_DAYS.index(day["ganzhi"])
        candidates=[_candidate(chart,x["position"],day_index,anchor)
                    for x in decision["candidates"]]
    note=(
        "已由服务器复算原始日期，按所选北京时间钟面时刻及换日规则，列出其后30个日历日的干支条件。"
        if anchor else
        "没有可核对的原始公历日期，仅以手填干支日为第0日演示后续30日；不提供具体年月日。"
    )
    chart["temporal_review"]={
        "version":"V22",
        "status":status,
        "window_days":WINDOW_DAYS,
        "anchor_date":anchor.isoformat() if anchor else None,
        "base_day_ganzhi":day["ganzhi"] if day else None,
        "day_boundary":provenance["day_boundary"] if anchor else None,
        "beijing_clock":provenance["beijing_time"][11:16] if anchor else None,
        "calendar_provenance":"server_recomputed_calendar" if anchor else "manual_ganzhi_unanchored",
        "focus_category":chart["focus"]["category"] if chart.get("focus") else None,
        "candidates":candidates,
        "selected_position":decision["selected_position"],
        "notice":note,
        "has_timing_prediction":False,
        "final_event_date":None,
        "references":{"void":"https://zh.wikisource.org/zh-hans/增删卜易/26",
                      "day":"https://zh.wikisource.org/zh-hans/增删卜易/17"},
        "limitations":[
            "值日、日冲、换旬只是干支对应条件，不能认定必然应事、填实、冲空或吉凶。",
            "日期只以原换算时采用的钟面时刻及换日规则逐日对照；若改变时刻或换日规则，必须重新确认历法。",
            "跨越节气的月建会变化，此页没有重算未来每一日的月建；不能用原月建推断未来各日旺衰。",
            "当用神不现或没有明确关注对象时，不补造伏神的应期。",
        ],
    }
    return chart
