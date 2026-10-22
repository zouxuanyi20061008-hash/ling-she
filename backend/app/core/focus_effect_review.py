"""V24 用神与原忌仇来源联合审议：辨清静态角色、明动作用方向和限制条件。

完全引用 V18 作用链、V23 旬空检查及现成日月/动变/墓绝标记。
不重新算法，不用生扶克制条数抵消，不裁断吉凶或真实效力。
"""
from __future__ import annotations

SOURCE_URL="https://zh.wikisource.org/zh-hans/增删卜易/9"


def _condition(scope:str,label:str,items:list[str],missing:bool=False)->dict:
    return {"id":scope,"title":label,"status":"missing" if missing else "recorded",
            "facts":list(dict.fromkeys(items)),"effectiveness":"not_determined"}


def _source_review(path:dict,chart:dict)->dict:
    pos=path["source_position"]
    row=chart["najia_lines"][pos-1]
    void=chart["void_context_review"]["rows"][pos-1]
    special=chart["special_conditions"]["rows"][pos-1]
    motion=next((x for x in chart["moving_effect_review"]["movements"]
                 if x["position"]==pos),None)
    calendar=chart["calendar"]
    direct=path["relation_scope"]=="active_original_line_edge"
    role=path["role"]

    # 仅真实明动之原神/忌神可记为有直接来源；仇神恒为间接链。
    if role=="仇神":
        kind="indirect_five_element_reference"
    elif direct:
        kind="active_direct_edge_pending_effect"
    else:
        kind="static_element_relation_only"

    checks=[
        _condition("day","来源爻的日辰关系",
                   [row["day_action"]["element_relation"]]+
                   (["日辰冲来源爻"] if row["day_action"]["clash"] else [])+
                   (["日辰合来源爻"] if row["day_action"]["combine"] else [])
                   if row["day_action"] else [],
                   calendar["day"] is None),
        _condition("month","来源爻的月建关系",
                   [row["month_action"]["element_relation"],
                    "节令概要："+row["seasonal_status"]["grade"]]+
                   (["来源爻逢月冲条件"] if row["month_break_marker"] else [])
                   if row["month_action"] else [],
                   calendar["month"] is None),
        _condition("void","来源爻的旬空与化空",
                   ["来源本爻"+("旬空" if void["original_void"] else "不旬空")]+
                   (["真正明动之本位变支逢空"] if void["transformed_void"] else [])+
                   list(void["cross_checks"])
                   if void["original_void"] is not None else [],
                   calendar["day"] is None),
        _condition("motion","来源爻明动及回头作用",
                   ["本卦明动；对主爻已存在可追溯的作用边" if direct else
                    "本卦明动，仇神仅提供间接传统五行链" if row["moving"] else
                    "来源爻安静，仅有静态角色"]+
                   (["本位动变："+motion["returning_term"]]+motion["conditions_to_review"]
                    if motion else [])),
        _condition("special","来源爻的六合墓绝条件",
                   [x["kind"]+"（"+x["source"]+"）"
                    for group in ("combinations","tombs","extinctions")
                    for x in special[group]]),
    ]
    # Pathway flags carry the original line's month break, void and effect cautions;
    # do not erase them after making the structured checks.
    notes=list(dict.fromkeys(path["source_flags"]+[
        "原忌仇为五行角色，不能直接推断作用已经有效。",
        "变爻不能跨位作用其他本卦爻，不能把静爻当已发动。",
    ]))
    return {
        "role":role,"source_position":pos,"source_ganzhi":row["ganzhi"],
        "target_position":path["target_position"],
        "moving":row["moving"],"kind":kind,
        "relation_to_target":path["relation_to_target"],
        "checks":checks,"source_flags":notes,
        "date_complete":bool(calendar["day"] and calendar["month"]),
        "true_void":void["true_void"],"false_void":void["false_void"],
        "effective":None,"final_strength":None,
        "status":"requires_joint_review" if direct else "reference_only",
    }


def decorate_focus_effect_review(chart:dict)->dict:
    pathways=chart["yongshen_pathways"]
    selected=chart["focus_decision"]["selected_position"]
    day=chart["calendar"]["day"]
    month=chart["calendar"]["month"]
    candidates=[]
    for focus in pathways["focus_candidates"]:
        pos=focus["position"]
        target=chart["najia_lines"][pos-1]
        target_void=chart["void_context_review"]["rows"][pos-1]
        sources={role:[_source_review(p,chart) for p in focus["pathways"][role]]
                 for role in ("原神","忌神","仇神")}
        yuan=[x for x in sources["原神"] if x["kind"]=="active_direct_edge_pending_effect"]
        ji=[x for x in sources["忌神"] if x["kind"]=="active_direct_edge_pending_effect"]
        cautions=[]
        if target_void["original_void"] is None:
            cautions.append("日辰尚未确认：主爻旬空与来源爻旬空均不可断定")
        elif target_void["original_void"]:
            cautions.append("主爻旬空：须核真假空、冲空与动变")
        if target["month_break_marker"]:
            cautions.append("主爻月冲：须同查原忌来源而非一票否决")
        if target_void["transformed_void"]:
            cautions.append("主爻明动化空：不得只凭化空判结果")
        if not month:
            cautions.append("尚缺节令月建，作用来源的旺相、月冲情况不完整")
        if yuan and ji:
            cautions.append("原神与忌神均有明动直连来源，不得直接相减或认定一方获胜")
        elif yuan or ji:
            cautions.append("已见明动作用来源，但源爻本身条件仍可能限制作用")
        if chart["strength_evidence"]["rows"][pos-1]["has_opposing_indicators"]:
            cautions.append("主爻已有生扶与制约并存的标记，不能将条数当强弱分数")
        candidates.append({
            "position":pos,"ganzhi":focus["ganzhi"],
            "selected_by_user":pos==selected,
            "target":{"position":pos,"ganzhi":target["ganzhi"],
                      "moving":target["moving"],
                      "void_category":target_void["category"],
                      "month_break":target["month_break_marker"],
                      "true_void":target_void["true_void"]},
            "roles":sources,
            "simultaneous_yuan_ji_moving":bool(yuan and ji),
            "cautions":list(dict.fromkeys(cautions)),
            "chosen_by_algorithm":False,
            "resolved_effect":None,"resolved_fortune":None,
        })
    decision=chart["focus_decision"]
    if not chart.get("focus"):status="focus_not_selected"
    elif decision["status"]=="not_visible":status="focus_not_visible"
    elif not day or not month:status="calendar_incomplete"
    elif len(candidates)>1 and selected is None:status="multiple_candidates_pending"
    else:status="conditional_review_ready"
    chart["focus_effect_review"]={
        "version":"V24","status":status,
        "focus_category":pathways["category"],
        "selected_position":selected,
        "candidates":candidates,
        "selected_by_user_only":True,
        "calendar_origin":"verified_beijing_date" if chart.get("calendar_provenance") else "manual_ganzhi",
        "rules":[
            "只将原神、忌神真实明动的本卦作用边视为直接关系来源。",
            "静爻仅有五行角色；仇神是间接传统链，不是跨位主动克制。",
            "所有作用来源都同时检查其自身日月、旬空、回头与墓绝条件。",
            "多处用神候选逐处保留，不按证据条数排名，也不自动选用。",
        ],
        "effective_strength_computed":False,"fortune_conclusion":None,
        "timing_conclusion":None,
        "references":{"roles":SOURCE_URL},
        "boundary":"仅属传统术数的来源追溯教学，已确认五行方向不等于有效力量。未完成现实结果判断、最终旺衰或应期预测。",
    }
    return chart
