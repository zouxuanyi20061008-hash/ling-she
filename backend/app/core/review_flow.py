"""六爻 V12：循序研判的可复核证据清单，不给吉凶评分。

从已排出的确定性字段组成五个教学步骤。每步明确“可核对”“尚待
输入”“人工复核”，不得把软件无法验证的日辰、节气、事实背景
包装成已核实的结论。前端仅负责分页显示，不自行发明断卦结果。
"""
from __future__ import annotations


def _step(key: str, title: str, status: str, summary: str, action: str) -> dict:
    return {"id":key,"title":title,"status":status,"summary":summary,"action":action}


def decorate_review_flow(chart: dict) -> dict:
    calendar=chart["calendar"]
    focus=chart.get("focus")
    decision=chart["focus_decision"]
    selected=decision.get("selected_candidate")
    day=calendar["day"]
    month=calendar["month"]
    moving=chart["moving_influences"]
    special=chart["special_conditions"]
    voids=chart["void_interactions"]

    missing_calendar=[
        text for present,text in ((day,"请核对六十甲子日"),(month,"请核对交节后的节令月建"))
        if not present
    ]
    if len(missing_calendar)==2:
        calendar_state="pending"
    elif missing_calendar:
        calendar_state="partial"
    else:
        calendar_state="review"
    stages=[_step(
        "calendar","核日月",calendar_state,
        ("日辰："+(day["ganzhi"] if day else "未确认")+
         "；月建："+(month["branch"]+"月" if month else "未确认")+
         "。均为手动参数，并未自动校验交节和换日。"),
        "、".join(missing_calendar) if missing_calendar else "请用可靠历书再次核对日期、时区、换日与交节。"
    )]

    if not focus:
        focus_state="pending"
        focus_summary="尚未选择六亲或世应；软件不会自动取用。"
        focus_action="先结合具体问题，亲自确认所问主体与关注对象。"
    elif decision["status"]=="not_visible":
        focus_state="review"
        focus_summary="所选"+focus["category"]+"在本卦不现；已列本宫伏神候选，但未确定是否可用。"
        focus_action="先核对日月能否取用，再对照飞伏生克、旬空与月破。"
    elif selected:
        focus_state="review"
        focus_summary=("你已主动指定"+str(selected["position"])+"爻 "+selected["ganzhi"]+
                       "为本次研习主爻；所有其他同类候选仍保留。")
        focus_action="把本次指定当作研究焦点，不把它当作唯一正确用神。"
    else:
        focus_state="partial"
        count=len(decision["candidates"])
        focus_summary="本卦有"+str(count)+"处"+focus["category"]+"相关爻；尚未主动指定研习主爻。"
        focus_action="逐条比较月令、动静、空破与回头关系，再亲自决定研究哪一爻。"
    stages.append(_step("focus","因事取用",focus_state,focus_summary,focus_action))

    dynamics=chart["line_dynamics"]
    strength=chart["strength_evidence"]
    effect=chart["moving_effect_review"]
    stages.append(_step(
        "relations","辨生克","review",
        ("本卦共"+str(len(moving["moving_positions"]))+"个动爻；已核对"+
         str(len(moving["edges"]))+"条动爻对本卦其他爻的静态关系、"+
         str(len(dynamics["movements"]))+"条本位动变关系，其中"+str(len(effect["movements"]))+
         "条已与日月空破对照；"+
         str(len(strength["opposing_positions"]))+"爻同时存在生扶与制约线索；"+
         str(len(special["affected_positions"]))+"爻有六合、墓或绝地核对条件。"),
        "查看综合证据对照，先分辨支持与限制条件，再考察原忌仇神；不可把证据条数当旺衰权重。"
    ))
    void_count=len(voids["original_void_positions"])
    void_status="review" if day else "pending"
    stages.append(_step(
        "conflicts","参空破",void_status,
        ("日旬空支："+("、".join(voids["empty_branches"]) if day else "未确认")+
         "；本卦有"+str(void_count)+"处旬空标记。")
        if day else "尚未确认日辰，不能计算旬空与冲空。",
        "合查日冲、月破、明动、化空、伏神；不得只凭单个标记断真假空或吉凶。"
    ))

    unresolved=[]
    if not day:unresolved.append("日辰未确认，六神、旬空与日冲相关数据不全")
    if not month:unresolved.append("节令月建未确认，旺相、月破与月令关系不全")
    if not focus:unresolved.append("尚未明确所问事项对应的用神关注对象")
    elif decision["status"]=="not_visible":
        unresolved.append("本卦用神不现，须人工审查日月取用与伏神可用性")
    elif not selected:
        unresolved.append("尚未主动指定研习主爻；不能代替人工取舍")
    if decision.get("status")=="multiple_visible":
        unresolved.append("同类用神多现，不能按旺、动、不空不破机械排除其他候选")
    if selected:
        pos=selected["position"]
        main=chart["najia_lines"][pos-1]
        rev=main["void_review"]
        if rev.get("is_void"):unresolved.append("研习主爻旬空，真假空与冲空需要合参")
        if main.get("month_break_marker"):unresolved.append("研习主爻遇月冲，月破实际效力尚未判定")
        if rev.get("moving_into_void"):unresolved.append("研习主爻化空，需查动变与日月条件")
        if main.get("turnback"):unresolved.append("研习主爻存在回头关系，实际生克仍需复核")
    if strength["opposing_positions"]:
        unresolved.append("部分爻同时受生扶与制约：请在辨生克步骤逐条核对，不得简单相减")
    if effect["movements"]:
        unresolved.append("已列出动爻与本位变爻的日月空破条件；回头关系能否实际发生作用仍待人工复核")
    if special["affected_positions"]:
        unresolved.append("已列出六合、合绊、三墓及逢绝条件；实际合住、入墓、绝处逢生仍须人工审议")
    unresolved.extend([
        "未核验实际所问背景，需用可核实的现实证据检验推论",
        "未完成强弱综合取用、用神吉凶或应期计算",
    ])
    stages.append(_step(
        "report","整理研究","review",
        "把已计算的盘面、研习焦点、证据与待核实事项分别记下，不生成确定性预言。",
        "导出学习笔记，记录事前思路，日后对照实际结果复盘。"
    ))

    facts=[
        "本卦："+chart["ben_gua"]["full_name"],
        "之卦："+chart["bian_gua"]["full_name"],
        "动爻："+("、".join(str(i) for i in chart["dong_yao"])+"爻" if chart["dong_yao"] else "无"),
        "日辰："+(day["ganzhi"] if day else "未确认"),
        "月建："+(month["branch"]+"月" if month else "未确认"),
        "关注对象："+(focus["category"] if focus else "未选择"),
        "研习主爻："+(
            str(selected["position"])+"爻 "+selected["ganzhi"]+"（由用户指定）"
            if selected else "未指定"
        ),
    ]
    digest=[
        str(row["position"])+"爻 "+row["ganzhi"]+"："+
        str(len(row["supporting"]))+"条生扶线索，"+
        str(len(row["restraining"]))+"条制约条件；"+row["summary"]
        for row in (strength["focus_candidates"] or
                    ([] if focus else strength["rows"]))
    ]
    moving_digest=[
        str(x["position"])+"爻 "+x["moving"]["ganzhi"]+"→"+
        x["transformed"]["ganzhi"]+"："+x["returning_term"]+
        "；日月空破需合参，未判效力"
        for x in effect["movements"]
    ]
    special_digest=[
        str(row["position"])+"爻 "+row["ganzhi"]+"："+
        "、".join(item["kind"]+"("+item["source"]+")"
                 for group in ("combinations","tombs","extinctions")
                 for item in row[group])+
        "；相关实效尚未判断"
        for row in special["rows"] if row["has_any_condition"]
    ]
    report={
        "title":"六爻研判学习笔记",
        "special_conditions_digest":special_digest,
        "moving_effect_digest":moving_digest,
        "evidence_digest":digest,
        "strength_conclusion":None,
        "verified_by_program":facts,
        "selected_position":selected["position"] if selected else None,
        "focus_candidate_count":len(decision.get("candidates",[])),
        "outstanding_questions":list(dict.fromkeys(unresolved)),
        "notice":"本报告仅列可复核的传统排盘关系。用户手动日辰与节令月建未经真实历法验证；无自动断吉凶、应期或专业建议。",
        "conclusion":None,
        "has_final_decision":False,
    }
    chart["review_flow"]={
        "version":"V12",
        "stages":stages,
        "report":report,
        "is_complete_prediction":False,
        "workflow_note":"分页流程是教学组织，并不代表程序已自动完成整卦旺衰判定。",
    }
    return chart
