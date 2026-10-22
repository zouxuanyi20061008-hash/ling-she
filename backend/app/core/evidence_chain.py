"""V21 六爻综合证据链：合并既有确定性条件，不再创造第二套断卦算法。

每处本卦可见用神候选沿日月、动变、旬空、墓绝及原忌仇五条线索审阅。
条件被算出不代表作用有效；此模块不评分、不自动择用、更不生成应期。
"""
from __future__ import annotations


def _part(key:str, title:str, status:str, observations:list[str],
          caution:str, references:list[str]|None=None)->dict:
    return {
        "id":key, "title":title, "status":status,
        "observations":list(dict.fromkeys(observations)),
        "caution":caution, "references":references or [],
        "effectiveness":"not_determined",
    }


def _candidate(chart:dict, row:dict, source:dict|None)->dict:
    position=row["position"]
    line=chart["najia_lines"][position-1]
    calendar=chart["calendar"]
    condition=chart["special_conditions"]["rows"][position-1]
    strength=chart["strength_evidence"]["rows"][position-1]
    motion=next((m for m in chart["moving_effect_review"]["movements"]
                 if m["position"]==position),None)
    incoming=[e for e in chart["moving_influences"]["edges"]
              if e["target_position"]==position]
    paths=source["pathways"] if source else {}
    axes=[]

    month=[]
    if calendar["month"]:
        if line["seasonal_status"]:
            month.append("月令概要："+line["seasonal_status"]["grade"])
        if line["month_action"]:
            month.append(line["month_action"]["element_relation"])
        if line["month_break_marker"]:
            month.append("月冲本爻：月破条件，实际作用尚未判定")
    axes.append(_part("month","节令月建",
        "pending" if not calendar["month"] else "review" if line["month_break_marker"] else "recorded",
        month, "须先确认交节；月破不可一票否决。",["月将章","四时旺相"]))

    day=[]
    if calendar["day"]:
        if line["day_action"]:
            day.append(line["day_action"]["element_relation"])
        if line["day_clash"]:
            day.append("本爻逢日冲，暗动/日破实效待辨")
    axes.append(_part("day","日辰与六神",
        "pending" if not calendar["day"] else "review" if line["day_clash"] else "recorded",
        day, "日辰冲合与六神不能单独定吉凶。",["日辰章"]))

    moving=["本爻明动" if line["moving"] else "本爻安静"]
    moving += [str(e["source_position"])+"爻明动："+e["element_relation"] for e in incoming]
    if motion:
        moving.append("本位动变："+motion["returning_term"])
        moving.extend(motion["conditions_to_review"])
    axes.append(_part("movement","明动与本位动变",
        "review" if motion or incoming else "recorded",
        moving, "变爻仅可回头作用本位动爻；动变的实效尚待合参。",["动变生克"]))

    void=[]
    if calendar["day"]:
        check=line["void_review"]
        void.append("本爻旬空" if check["is_void"] else "本爻不在此日旬空支内")
        if check["possible_chongkong"]:
            void.append("日冲空支：冲空候选")
        if check["moving_into_void"]:
            void.append("本位明动化空候选")
    if calendar["month"] and line["month_break_marker"]:
        void.append("同时存在月冲条件")
    axes.append(_part("void","旬空与月破",
        "pending" if not calendar["day"] else
        "review" if (line["void_review"]["is_void"] or
                     line["void_review"]["moving_into_void"] or line["month_break_marker"]) else "recorded",
        void, "有空亡不等于真空或无用，出空填实与应期均未计算。",["旬空章"]))

    details=[item["kind"]+"（"+item["source"]+"）"
             for kind in ("combinations","tombs","extinctions")
             for item in condition[kind]]
    axes.append(_part("special","六合、墓、绝",
        "review" if details else "pending" if not calendar["day"] and not calendar["month"] else "recorded",
        details, "合住、入墓、逢绝实际效力尚未验证。",["六合章","墓绝规则"]))

    origins=[]
    for role in ("原神","忌神","仇神"):
        for path in paths.get(role,[]):
            relation="明动直连本卦主爻" if path["relation_scope"]=="active_original_line_edge" else (
                "间接五行路径" if role=="仇神" else "静态五行关系")
            origins.append(role+"："+str(path["source_position"])+"爻，"+relation)
            if path["source_flags"]:
                origins.append(role+str(path["source_position"])+"爻需核对："+ "、".join(path["source_flags"]))
    axes.append(_part("roles","原神、忌神、仇神",
        "review" if origins else "recorded",
        origins, "五行角色不等于实际生扶或制约；不能用数量相减。",["原忌仇神章"]))

    cautions=list(strength["pending"])
    if strength["has_opposing_indicators"]:
        cautions.append("本爻兼有生扶与限制条件，不能抵消或加权评分")
    if line["void_review"]["is_void"] is True:
        cautions.append("旬空真伪及冲空作用尚待审议")
    if line["month_break_marker"] is True:
        cautions.append("月冲条件实际效力尚待审议")
    if condition["has_any_condition"]:
        cautions.append("六合墓绝条件不能代替实际作用裁定")
    if motion and motion["conditions_to_review"]:
        cautions.extend(motion["conditions_to_review"])
    return {
        "position":position, "ganzhi":row["ganzhi"],
        "selected_by_user":position==chart["focus_decision"]["selected_position"],
        "axes":axes, "cautions":list(dict.fromkeys(cautions)),
        "has_conflicting_evidence":strength["has_opposing_indicators"],
        "final_strength":None, "effectiveness_determined":False,
        "judgment":"只作源头可追溯的联合审议，不做强弱、吉凶或应期裁断。",
    }


def decorate_evidence_chain(chart:dict)->dict:
    decision=chart["focus_decision"]
    paths=chart["yongshen_pathways"]
    rows=chart["strength_evidence"]["rows"]
    by_position={x["position"]:x for x in paths["focus_candidates"]}
    candidates=[
        _candidate(chart, rows[c["position"]-1], by_position.get(c["position"]))
        for c in decision["candidates"]
    ]
    blockers=[]
    if not chart["calendar"]["day"]:
        blockers.append("缺少日辰，旬空、日冲证据无法齐备")
    if not chart["calendar"]["month"]:
        blockers.append("缺少节令月建，月令与月破证据无法齐备")
    if decision["status"]=="not_selected":
        blockers.append("尚未选择所问六亲或世应")
    elif decision["status"]=="not_visible":
        blockers.append("本卦用神不现，须另研究日月取用与伏神，不能造出本卦主爻")
    elif decision["selected_position"] is None:
        blockers.append("未指定研习主爻，所有明现候选平等保留")
    if decision["status"]=="multiple_visible":
        blockers.append("同类用神多现：不得通过证据条数替用户择优")
    status=(
        "focus_not_selected" if decision["status"]=="not_selected" else
        "focus_not_visible" if decision["status"]=="not_visible" else
        "comparison_pending" if len(candidates)>1 and decision["selected_position"] is None else
        "date_incomplete" if not chart["calendar"]["day"] or not chart["calendar"]["month"] else
        "evidence_review_ready"
    )
    chart["evidence_chain"]={
        "version":"V21",
        "status":status,
        "focus_category":chart["focus"]["category"] if chart.get("focus") else None,
        "selected_position":decision["selected_position"],
        "candidates":candidates,
        "blockers":blockers,
        "date_origin":"server_recomputed_calendar" if chart.get("calendar_provenance") else "unverified_manual_values",
        "has_final_strength":False,
        "has_final_decision":False,
        "fortune_conclusion":None,
        "timing_conclusion":None,
        "method":"先核日月及用神候选，再按月、日、动变、空破、墓绝、原忌仇六组核对来源；逐项保留不确定性。",
        "boundary":"六组对照不是评分表，不能按条数择优，也不保证传统象义对应现实事件。",
    }
    return chart
