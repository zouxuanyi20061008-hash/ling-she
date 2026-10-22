"""V23 真假空审议：依据已排盘证据建立有序检查单，不裁定实际真假空。

六爻不因单一空亡而断无用；明动所化之空与静爻变卦同位支逢空严格区分。
各项日月、动变、月破条件只是需要进一步核对的证据，并非强弱评分。
"""
from __future__ import annotations


def _step(key:str,title:str,notes:list[str],pending:list[str]|None=None)->dict:
    pending=pending or []
    return {"id":key,"title":title,"status":"missing" if pending else "review",
            "observations":notes,"pending":pending,"effectiveness":"not_determined"}


def _audit(original:dict, changed:dict, chart:dict)->dict:
    position=original["position"]
    day=chart["calendar"]["day"]
    month=chart["calendar"]["month"]
    context=original["void_review"]
    change_status=changed["void_review"]
    moving=bool(original["moving"])
    original_void=context["is_void"]
    transformed_void=change_status["is_void"] if moving else None
    # 未发动时，即使之卦同位支逢空，也不可把它当成本位「化空」。
    category=("day_missing" if day is None else
              "original_and_transformed_void" if original_void and transformed_void else
              "original_void" if original_void else
              "transformed_void_only" if transformed_void else "neither_void")
    focus=chart["focus_decision"]
    source="服务器复算的北京时间日期" if chart.get("calendar_provenance") else "用户手动日干支"
    steps=[]
    steps.append(_step("xun","先核日旬与本卦爻",
        ([day["ganzhi"]+"日，旬空："+ "、".join(day["xunkong"]),
          "本卦"+original["ganzhi"]+("属于当日旬空支" if original_void else "不属于当日旬空支")]
         if day else []),
        [] if day else ["先按北京时间、子时换日规则确认六十甲子日。"]))

    day_notes=[]
    if day is not None:
        action=original["day_action"]
        day_notes.append(action["element_relation"])
        if action["clash"]:
            day_notes.append("日辰冲本卦爻"+("，且本卦原爻旬空：只成立冲空条件" if original_void else "，不能据此确定暗动、日破"))
        if action["combine"]:
            day_notes.append("日辰与本卦爻六合，合绊效力尚待判断")
    steps.append(_step("day","再察日辰生克冲合",day_notes,
        [] if day else ["未提供日辰，不计算日辰冲合和冲空。"]))

    month_notes=[]
    if month is not None:
        month_notes.append(original["month_action"]["element_relation"])
        if original["seasonal_status"]:
            month_notes.append("四时月令概要："+original["seasonal_status"]["grade"])
        if original["month_break_marker"]:
            month_notes.append("月建冲本卦爻，月破条件成立；不能因此断为永远无用")
        if original["month_action"]["same_branch"]:
            month_notes.append("本卦爻临月建，仍须与其他条件合参")
    steps.append(_step("month","核节令月建与空破并见",month_notes,
        [] if month else ["节令月建未核，不能判断月破与月令类别。"]))

    movers=chart["moving_influences"]["edges"]
    incoming=[e for e in movers if e["target_position"]==position]
    motion_notes=["本卦此爻明动" if moving else "本卦此爻安静；不得因为静态变卦支而推定发动"]
    motion_notes.extend(str(e["source_position"])+"爻明动："+e["element_relation"]+
                        ("，有冲" if e["clash"] else "")+
                        ("，有合" if e["combine"] else "")
                        for e in incoming)
    if moving and original["turnback"]:
        motion_notes.append("本位回头关系："+original["turnback"]["term"]+"；作用效力尚未确认")
    steps.append(_step("movement","查本卦明动与来爻",motion_notes))

    turnback_notes=[]
    if day:
        if moving:
            turnback_notes.append("本位变爻："+changed["ganzhi"]+
                                  ("，逢本日旬空（化空条件）" if transformed_void else "，不逢本日旬空"))
            if changed["day_action"]:
                turnback_notes.append("日辰作用于变爻："+changed["day_action"]["element_relation"])
            if changed["month_action"]:
                turnback_notes.append("月建作用于变爻："+changed["month_action"]["element_relation"])
            if original["turnback"]:
                turnback_notes.append("仅允许该变爻回头作用本位动爻，不跨位生克其他爻")
        elif change_status["is_void"]:
            turnback_notes.append("变卦同位支虽逢旬空，但本卦此爻安静，不属于明动化空")
        else:
            turnback_notes.append("此爻未发动，不存在实际回头关系及动而化空")
    steps.append(_step("transformation","最后分辨本位化空与静态同位",
        turnback_notes,[] if day else ["未确认旬空，不能分辨动爻化空。"]))

    specialty=chart["special_conditions"]["rows"][position-1]
    special_notes=[
        kind["kind"]+" · "+kind["source"] for group in ("combinations","tombs","extinctions")
        for kind in specialty[group]
    ]
    if not special_notes:
        special_notes.append("现有日月和动爻资料中未标记六合墓绝条件；不等于已排除一切作用")
    steps.append(_step("special","对照六合墓绝及其他制约",special_notes,
        [] if day and month else ["日月输入不全，部分六合墓绝条件仍未核。"]))

    cross_checks=[]
    if original_void is True and original["day_action"]["clash"]:
        cross_checks.append("旬空兼日冲：核对冲空条件，但不自动判冲实")
    if original_void is True and original["month_break_marker"]:
        cross_checks.append("旬空兼月破：空破同时存在，不能只看其中一项")
    if original_void is True and moving:
        cross_checks.append("明动爻旬空：动空之实效尚待合参")
    if transformed_void is True:
        cross_checks.append("真实动爻化空：本卦本爻是否旬空要单独核实")
    strength=chart["strength_evidence"]["rows"][position-1]
    if strength["has_opposing_indicators"]:
        cross_checks.append("此爻同时出现生扶与制约线索，不能计数抵消")
    if not month:
        cross_checks.append("缺节令月建，无法完整讨论旬空真假与月破交互")
    if not day:
        cross_checks.append("缺日辰，无法计算本卦旬空与动而化空")
    cross_checks=list(dict.fromkeys(cross_checks))
    return {
        "position":position,"ganzhi":original["ganzhi"],"branch":original["branch"],
        "moving":moving,"category":category,"original_void":original_void,
        "transformed_void":transformed_void,
        "transformed_is_actual_change":moving,
        "same_position_reference_void":change_status["is_void"] if day else None,
        "selected_by_user":focus["selected_position"]==position,
        "focus_candidate":any(x["position"]==position for x in focus["candidates"]),
        "steps":steps,"cross_checks":cross_checks,
        "calendar_origin":source if day else "日辰待确认",
        "true_void":None,"false_void":None,"void_resolved":False,
        "note":"此处只列真假空审议的核查路径，不会把生扶、冲空、明动或化空机械当作真假空结论。",
    }


def decorate_void_context(chart:dict)->dict:
    rows=[_audit(o,b,chart) for o,b in
          zip(chart["najia_lines"],chart["bian_najia_lines"])]
    day=chart["calendar"]["day"]
    focus=chart["focus_decision"]
    chart["void_context_review"]={
        "version":"V23",
        "status":"day_unconfirmed" if not day else "joint_review_ready",
        "rows":rows,
        "empty_branches":day["xunkong"] if day else None,
        "calendar_origin":"server_recomputed_calendar" if chart.get("calendar_provenance") else "manual_or_missing",
        "focus_status":focus["status"],
        "focus_candidate_positions":[x["position"] for x in focus["candidates"]],
        "selected_position":focus["selected_position"],
        "attention_positions":[r["position"] for r in rows if
            r["category"] not in ("neither_void","day_missing") or r["cross_checks"]],
        "requires_human_review":True,
        "has_final_void_decision":False,
        "fortune_conclusion":None,
        "boundary":"先核日旬，再分日辰、月建、动静、本位变爻与墓绝。只辨条件是否成立，不自动认定真空、假空、冲实、出空、填实或应期；日月交界仍应核查原始历法。",
        "references":{"void":"https://zh.wikisource.org/zh-hans/增删卜易/26",
                      "day":"https://zh.wikisource.org/zh-hans/增删卜易/17"}
    }
    return chart
