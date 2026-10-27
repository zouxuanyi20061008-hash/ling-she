"""V22 · 六爻旬空与日支时间条件研究（非应期预测）。

只使用已算六十甲子及本卦实际明现用神爻。无历法来源不补公历日期；
即使已换算日期，也只列传统历法条件，绝不把关系等同真实应事。
"""
from __future__ import annotations

from datetime import date, datetime, timedelta
from .calendar import SIXTY_DAYS, OPPOSITES, XUNKONG
from .moving_season import season_for_element
from .solar_calendar import preview_solar_calendar

WINDOW_DAYS=30


def _future_month_context(chart:dict, anchor:date|None, day_index:int)->dict|None:
    """Only a verified China-time source permits dated solar-term month checks.

    Compute once per cast, not once per candidate. Compare a fixed Beijing clock
    instant on each date and never borrow the cast's month for a future date.
    """
    if anchor is None:
        return None
    provenance=chart["calendar_provenance"]
    if provenance.get("source")!="server_recomputed_calendar":
        raise ValueError("未确认历法来源，不可产生未来月建")
    clock=datetime.fromisoformat(provenance["beijing_time"]).time()
    boundary=provenance["day_boundary"]
    baseline=preview_solar_calendar(anchor,clock,day_boundary=boundary)
    month=chart["calendar"]["month"]
    if (month is None or baseline["day_ganzhi"]!=chart["calendar"]["day"]["ganzhi"]
            or baseline["month_branch"]!=month["branch"]
            or provenance.get("month_branch")!=month["branch"]):
        raise ValueError("原始日期的日辰/月建与重新换算不符，不能延伸未来月建")
    result={}
    previous=month["branch"]
    for offset in range(1,WINDOW_DAYS+1):
        target=anchor+timedelta(days=offset)
        if not 1901<=target.year<=2099:
            # The calendar module has an explicit validity range. Mark missing
            # rather than extrapolating past that boundary.
            result[offset]={
                "status":"outside_supported_years","month_branch":None,
                "month_changed":None,"near_solar_term":None,
            }
            continue
        preview=preview_solar_calendar(target,clock,day_boundary=boundary)
        actual_day=SIXTY_DAYS[(day_index+offset)%60]
        if preview["day_ganzhi"]!=actual_day:
            raise ValueError("未来日干支与原日起算序列不符，请复核子时换日")
        branch=preview["month_branch"]
        result[offset]={
            "status":"server_recomputed",
            "month_branch":branch,
            "month_changed":branch!=previous,
            "near_solar_term":preview["near_solar_term"],
            "previous_jie":preview["previous_jie"]["name"],
            "next_jie":preview["next_jie"]["name"],
        }
        previous=branch
    return result


def _month_snapshot(month:dict|None, original:dict, changed:dict|None)->dict:
    if not month or month["month_branch"] is None:
        return {"status":month["status"] if month else "unanchored_manual",
                "month_branch":None,"month_changed":None,
                "near_solar_term":None,"original_month_break":None,
                "original_same_month":None,"original_season":None,
                "changed_month_break":None,"changed_same_month":None,
                "changed_season":None}
    branch=month["month_branch"]
    other=changed["branch"] if changed is not None else None
    return {
        "status":"server_recomputed","month_branch":branch,
        "month_changed":month["month_changed"],
        "near_solar_term":month["near_solar_term"],
        "original_month_break":OPPOSITES[branch]==original["branch"],
        "original_same_month":branch==original["branch"],
        "original_season":season_for_element(branch,original["element"])["grade"],
        "changed_month_break":(OPPOSITES[branch]==other if other else None),
        "changed_same_month":(branch==other if other else None),
        "changed_season":(season_for_element(branch,changed["element"])["grade"]
                          if changed is not None else None),
    }


def _candidate(chart:dict, position:int, day_index:int, anchor:date|None,
               months:dict|None)->dict:
    line=chart["najia_lines"][position-1]
    branch=line["branch"]
    origin_void=line["void_review"]["is_void"] is True
    # 之卦静态同位支绝不冒充真实动变。只有本爻明动，才研究其本位化支。
    changed=chart["bian_najia_lines"][position-1] if line["moving"] else None
    changed_branch=changed["branch"] if changed else None
    current_empty=set(XUNKONG[day_index//10])
    prior_origin_void=branch in current_empty
    prior_changed_void=(changed_branch in current_empty) if changed_branch else None
    first_new_xun=10-day_index%10
    events=[]
    for offset in range(1, WINDOW_DAYS+1):
        ganzhi=SIXTY_DAYS[(day_index+offset)%60]
        day_branch=ganzhi[1]
        # 逐日以当天所属甲旬复算旬空，不能沿用起卦日的空支。
        # 这只是未来日期的干支对应，不自动裁定填实、出空或应期。
        future_empty=XUNKONG[((day_index+offset)%60)//10]
        future_origin_void=branch in future_empty
        future_changed_void=(changed_branch in future_empty) if changed_branch else None
        monthly=_month_snapshot(months.get(offset) if months else None,line,changed)
        checks=[]
        if monthly["month_changed"]:
            checks.append({
                "id":"future_jie_month_transition","title":"节令月建发生切换",
                "basis":"已按此日相同北京时间钟面时刻与节气交接复算月支；"
                        "不据月令变化认定原爻或回头作用旺衰，也不推断应期",
            })
        if monthly["near_solar_term"]:
            checks.append({
                "id":"future_jie_boundary_review","title":"交节边界人工复核",
                "basis":"历法时刻距交节15分钟内，月支须与可靠历书再核对",
            })
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
        if future_origin_void!=prior_origin_void:
            checks.append({
                "id":"original_xun_void_transition","title":"本爻当日旬空状态切换",
                "basis":"该日所属甲旬的空支重新计算，与前一日状态不同；不等于实际出空、填实或真空假空",
            })
        if changed_branch is not None:
            if day_branch==changed_branch:
                checks.append({
                    "id":"changed_same_branch","title":"本位化支值日（参照）",
                    "basis":"只有本卦此爻真实明动，才对照其本位化支；不是回头作用生效或应期",
                })
            if day_branch==OPPOSITES[changed_branch]:
                checks.append({
                    "id":"changed_clash_branch","title":"日支冲本位化支（参照）",
                    "basis":"候选日地支冲本位真实化支；不说明回头生克已生效",
                })
            if future_changed_void!=prior_changed_void:
                checks.append({
                    "id":"changed_xun_void_transition","title":"本位化支当日旬空状态切换",
                    "basis":"仅真实动爻的本位化支逐日重算旬空；不据此断化空已解或动变有力",
                })
        if checks:
            events.append({
                "offset_days":offset,
                "day_ganzhi":ganzhi,
                "solar_date":(anchor+timedelta(days=offset)).isoformat() if anchor else None,
                "conditions":checks,
                "future_xunkong":list(future_empty),
                "original_void_on_day":future_origin_void,
                "changed_void_on_day":future_changed_void,
                "changed_branch":changed_branch,
                "future_month":monthly,
                "timing_verdict":None,
                "confidence":"calendar_relation_only",
            })
        prior_origin_void=future_origin_void
        prior_changed_void=future_changed_void
    return {
        "position":position,
        "ganzhi":line["ganzhi"],
        "branch":branch,
        "originally_void":origin_void,
        "has_actual_change":changed is not None,
        "changed_branch":changed_branch,
        "original_changed_void":(changed["void_review"]["is_void"] if changed else None),
        "daily_xunkong_recomputed":True,
        "future_month_status":("server_recomputed" if months else "unanchored_manual"),
        "future_month_transitions":[offset for offset,m in (months or {}).items()
                                    if m["month_changed"]],
        "future_month_out_of_range":[offset for offset,m in (months or {}).items()
                                     if m["status"]=="outside_supported_years"],
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
    months=None
    if available and decision["candidates"]:
        day_index=SIXTY_DAYS.index(day["ganzhi"])
        months=_future_month_context(chart,anchor,day_index)
        candidates=[_candidate(chart,x["position"],day_index,anchor,months)
                    for x in decision["candidates"]]
    note=(
        "已由服务器复算原始日期，按所选北京时间钟面时刻及换日规则，列出其后30个日历日的干支条件。"
        if anchor else
        "没有可核对的原始公历日期，仅以手填干支日为第0日演示后续30日；不提供具体年月日。"
    )
    chart["temporal_review"]={
        "version":"V22",
        "condition_audit_version":"V42",
        "monthly_context_version":"V43",
        "future_month_status":("server_recomputed" if months else "unanchored_manual"),
        "future_month_transition_offsets":[offset for offset,m in (months or {}).items()
                                           if m["month_changed"]],
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
        "notice":note+(
            " V43 已按所选北京时间钟面时刻逐日重算节令月建；只显示传统月令条件，不评定未来旺衰。"
            if months else
            " V43 没有已核验原始日期，未来月建及月破月令等级保持未知，不生成跨节气结论。"
        ),
        "has_timing_prediction":False,
        "final_event_date":None,
        "references":{"void":"https://zh.wikisource.org/zh-hans/增删卜易/26",
                      "day":"https://zh.wikisource.org/zh-hans/增删卜易/17"},
        "limitations":[
            "值日、日冲、换旬只是干支对应条件，不能认定必然应事、填实、冲空或吉凶。",
            "日期只以原换算时采用的钟面时刻及换日规则逐日对照；若改变时刻或换日规则，必须重新确认历法。",
            "V42 按未来各日所属甲旬分别复算空支；旬空状态切换、化支相值相冲均只是历法证据，不能认定真假空或回头作用有效。",
            "V43 只有采纳日期并经服务端复算后，才按相同北京时间逐日重算节令月建；月冲、同支、旺相余气休囚仍不是未来效力与吉凶。",
            "1901～2099年之外不外推节令月建；临交节15分钟内保留历法复核警示，无法核实则不输出已算结论。",
            "当用神不现或没有明确关注对象时，不补造伏神的应期。",
        ],
    }
    return chart
