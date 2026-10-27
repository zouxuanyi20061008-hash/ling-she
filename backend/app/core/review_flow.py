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
    pathways=chart["yongshen_pathways"]
    voids=chart["void_interactions"]
    evidence_chain=chart["evidence_chain"]
    temporal=chart["temporal_review"]
    void_context=chart["void_context_review"]
    focus_effect=chart["focus_effect_review"]
    sheet=chart["review_sheet"]
    comparison=chart["focus_comparison"]
    progression=chart["progression_review"]
    combinations=chart["hexagram_combinations"]
    sanhe_focus=chart["sanhe_focus_review"]
    sanhe_audit=chart["sanhe_condition_audit"]
    cross=chart["cross_condition_audit"]
    provenance=chart.get("calendar_provenance")
    source_verified=bool(provenance and provenance.get("source")=="server_recomputed_calendar")
    calendar_origin=(
        "已由服务器使用中国历法库按北京时间和选定换日规则复算；边界时刻仍需核对。"
        if source_verified else "均为手动参数，尚未按实际日期验证交节与换日。"
    )

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
         "。"+calendar_origin),
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
    if (day or month) and not source_verified:
        unresolved.append("日月为手动输入，尚未按实际日期核查公历、交节和换日")
    if source_verified:
        unresolved.extend(provenance["warnings"])
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
    if pathways["status"]=="visible_candidates":
        unresolved.append("原忌仇神的五行作用路径已追溯；实际能否生扶或克害仍未完成综合效力判断")
        if pathways["moving_yuan_ji_together"]:
            unresolved.append("原神忌神同动，不能简单互相抵消，需核实各自日月动变状态")
    if void_context["attention_positions"]:
        unresolved.append("V23 已提供真假空六段审议，冲空、动空、化空等作用是否成立仍待合参")
    if focus_effect["candidates"]:
        unresolved.append("V24 已逐项核对原忌仇来源的日月空破和本位动变，实际作用效力仍需合参")
    if cross["attention_positions"]:
        unresolved.append("V44 已标出多条件并见与受限的明动来源；这不是旺衰、真假空或回头作用的实际裁定")
    unresolved.extend([
        "未核验实际所问背景，需用可核实的现实证据检验推论",
        "仍未完成实际应期推断；V22/V42/V43 仅复核日旬与真实动变、采纳日期后的未来节令月建，不裁定事件发生时间",
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
        "历法来源："+(
            "服务器历法库重算；北京时间 "+provenance["beijing_time"]+
            "；"+provenance["day_boundary_label"]+"（非权威历书）"
            if source_verified else "手动填写，未自动核对真实日期"
        ),
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
    pathway_digest=[
        str(c["position"])+"爻 "+c["ganzhi"]+"："+
        "；".join(role+"明动"+("、".join(str(p)+"爻" for p in c["active_direct_sources"][role]) or "无")
                 for role in ("原神","忌神"))+
        "；仇神为间接五行链，作用效力未判定"
        for c in pathways["focus_candidates"]
    ]
    chain_digest=[
        str(c["position"])+"爻 "+c["ganzhi"]+"："+
        "、".join(axis["title"]+"["+axis["status"]+"]" for axis in c["axes"])+
        "；全项作用效力未决"
        for c in evidence_chain["candidates"]
    ]
    temporal_digest=[
        str(candidate["position"])+"爻 "+candidate["ganzhi"]+"："+
        "；".join(
            (event["solar_date"] or "第"+str(event["offset_days"])+"日")+
            " "+event["day_ganzhi"]+"（"+
            "、".join(x["title"] for x in event["conditions"])+"）"
            for event in candidate["events"]
        )
        for candidate in temporal["candidates"]
    ]
    temporal_month_digest=[
        "V43 "+str(candidate["position"])+"爻 "+candidate["ganzhi"]+"："+(
            "服务端逐日复算节令月建；后续30日出现"+
            str(len(candidate["future_month_transitions"]))+"次跨节气月建切换"+
            ("（第"+",".join(str(o) for o in candidate["future_month_transitions"])+"日）"
             if candidate["future_month_transitions"] else "")+
            ("；"+str(len(candidate["future_month_out_of_range"]))+"日超出历法支持范围"
             if candidate["future_month_out_of_range"] else "")
            if candidate["future_month_status"]=="server_recomputed" else
            "缺可核验公历原始日期，后续月建/月破/月令等级保持未知"
        )+"；用神旺衰、真假空、回头作用与真实应期未判定。"
        for candidate in temporal["candidates"]
    ]
    temporal_crosscheck_digest=[
        "V42 "+str(candidate["position"])+"爻 "+candidate["ganzhi"]+"："+
        ("本卦原旬空" if candidate["originally_void"] else "本卦原不空")+
        ("；真实明动，本位化支"+candidate["changed_branch"]+
         ("原逢旬空" if candidate["original_changed_void"] else "原不空")
         if candidate["has_actual_change"] else "；本爻安静，无本位化支效力")+
        "；后续30日按日旬重算空支，列"+
        str(len(candidate["events"]))+"个有干支条件的日期；旺衰、真假空、回头作用及应期仍待合参。"
        for candidate in temporal["candidates"]
    ]
    cross_condition_digest=[
        "V44 "+str(row["position"])+"爻 "+row["ganzhi"]+"："+
        ("；".join(x["title"] for x in row["checks"]) if row["checks"] else
         "未发现需关联的已算复合标记")+
        ("；缺项："+ "、".join(row["missing_inputs"]) if row["missing_inputs"] else "")+
        "；旺衰、真假空、回头作用与应期均未判定"
        for row in (cross["focus_candidates"] if cross["focus_candidates"] else
                    ([] if chart.get("focus") else
                     [r for r in cross["rows"] if r["checks"]]))
    ]
    if cross["status"]=="focus_not_visible":
        cross_condition_digest=["V44 本卦关注用神不现：这里只核验可见六爻；不将伏神误认明现用神，不作最终取用。"]
    void_context_digest=[
        str(row["position"])+"爻 "+row["ganzhi"]+" · "+
        ("本爻及变爻均空" if row["category"]=="original_and_transformed_void" else
         "本卦旬空" if row["category"]=="original_void" else
         "动而化空（本爻不空）" if row["category"]=="transformed_void_only" else
         "缺日辰未核空" if row["category"]=="day_missing" else "本卦不空且无真实化空")+
        "；"+("、".join(row["cross_checks"]) if row["cross_checks"] else "无额外交叉冲突标记")+"；真假空未定"
        for row in void_context["rows"]
        if row["category"] not in ("neither_void","day_missing") or row["cross_checks"]
    ]
    focus_effect_digest=[
        str(c["position"])+"爻 "+c["ganzhi"]+"："+
        "；".join(role+"（"+
                 "、".join(
                     str(source["source_position"])+"爻"+
                     ("明动直连待复核" if source["kind"]=="active_direct_edge_pending_effect"
                      else "间接参考" if source["kind"]=="indirect_five_element_reference"
                      else "静态五行关系")
                     for source in c["roles"][role]
                 )+"）"
                 for role in ("原神","忌神","仇神"))+
        "；实际效力未定"
        for c in focus_effect["candidates"]
    ]
    sheet_digest=[
        str(item["position"])+"爻 "+item["ganzhi"]+
        "：支持"+str(len(item["supporting"]))+"条、限制"+
        str(len(item["restraining"]))+"条、待复核"+
        str(len(item["pending"]))+"项（数量不是旺衰评分）"
        for item in sheet["candidates"]
    ]
    focus_comparison_digest=[
        str(pair["first_position"])+"爻与"+str(pair["second_position"])+"爻："+
        ("、".join(x["title"] for x in pair["axes"] if x["state"]=="different") or "现有可比规则未见差异")+
        ("；另有"+str(len(pair["missing_keys"]))+"项日月资料待补" if pair["missing_keys"] else "")+
        "；不判断哪一爻较优"
        for pair in comparison["pairs"]
    ]
    progression_digest=[
        str(row["position"])+"爻 "+row["original_ganzhi"]+"→"+
        row["transformed_ganzhi"]+"："+row["label"]+
        ("；"+("、".join(row["cautions"])) if row["cautions"] else
         "；这是静态转化关系，实际效力待核")
        for row in progression["rows"] if row["is_actual_change"]
    ]
    combination_digest=[
        combinations["transition"]+"（卦类结构，不是吉凶结论）",
        "三合：本卦三支俱见"+str(combinations["counts"]["visible"])+
        "组；动变候选"+str(combinations["counts"]["mixed"])+
        "组；虚三待用"+str(combinations["counts"]["waiting"])+
        "组。实际成局及效力未定。",
    ]
    sanhe_focus_digest=[
        ("三合与关注对象："+("未指定" if sanhe_focus["status"]=="no_focus" else
            "本卦不现" if sanhe_focus["status"]=="hidden_focus" else
            str(sanhe_focus["focus_category"])+"（候选爻 "+
            "、".join(str(p) for p in sanhe_focus["focus_positions"])+"）"))+
        "；共有"+str(sanhe_focus["candidate_count"])+"组三合结构候选，实际效力待核。",
    ]
    if sanhe_focus["selected_position"] is not None:
        sanhe_focus_digest.append(
            "研习主爻"+str(sanhe_focus["selected_position"])+"爻位于"+
            str(sanhe_focus["selected_overlap_count"])+"个三合候选的结构位置；"+
            "结构包含不代表成局或吉凶。"
        )
    sanhe_audit_digest=[
        "三合 V41：原卦静态三支 "+str(sanhe_audit["counts"]["static_three_branches"])+
        " 组；有真实明动参与 "+str(sanhe_audit["counts"]["with_actual_movers"])+
        " 组；尚缺一支 "+str(sanhe_audit["counts"]["missing_one_branch"])+
        " 组；全部保持待复核，不自动判成局或吉凶。"
    ]
    report={
        "title":"六爻研判学习笔记",
        "sanhe_audit_digest":sanhe_audit_digest,
        "sanhe_focus_digest":sanhe_focus_digest,
        "combination_digest":combination_digest,
        "progression_digest":progression_digest,
        "focus_comparison_digest":focus_comparison_digest,
        "review_sheet_digest":sheet_digest,
        "focus_effect_digest":focus_effect_digest,
        "void_context_digest":void_context_digest,
        "cross_condition_digest":cross_condition_digest,
        "temporal_digest":temporal_digest,
        "temporal_crosscheck_digest":temporal_crosscheck_digest,
        "temporal_month_digest":temporal_month_digest,
        "temporal_notice":temporal["notice"],
        "evidence_chain_digest":chain_digest,
        "yongshen_pathway_digest":pathway_digest,
        "special_conditions_digest":special_digest,
        "moving_effect_digest":moving_digest,
        "evidence_digest":digest,
        "strength_conclusion":None,
        "verified_by_program":facts,
        "selected_position":selected["position"] if selected else None,
        "focus_candidate_count":len(decision.get("candidates",[])),
        "outstanding_questions":list(dict.fromkeys(unresolved)),
        "notice":(
            "本报告仅列可复核的传统排盘关系。日月已由服务器按历法库重算，临界交节仍需人工核对；无自动断吉凶、应期或专业建议。"
            if source_verified else
            "本报告仅列可复核的传统排盘关系。用户手动日辰与节令月建未经真实历法验证；无自动断吉凶、应期或专业建议。"
        ),
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
