"""V49: optional factual review of hidden and flying line conditions.

《增删卜易》飞伏神章 contains examples and lists potential conditions; this
module calculates only explicit, auditable element and branch comparisons.
A hidden line is never transformed into a seventh actual moving line, nor does
a seasonal/movement hint become an efficacy, yongshen-selection or omen.
"""
from __future__ import annotations
from .calendar import OPPOSITES
from .hexagrams import GENERATES, CONTROLS
from .moving_season import season_for_element
from .najia import BRANCH_ELEMENT
from .fushen import ORIGINAL


def _relation(source:str,target:str)->str:
    if source==target:return "比和"
    if GENERATES[source]==target:return "生伏"
    if CONTROLS[source]==target:return "克伏"
    if GENERATES[target]==source:return "伏生源"
    if CONTROLS[target]==source:return "伏克源"
    raise ValueError("V49 五行关系无效")


def _entry(chart:dict,item:dict)->dict:
    hidden=item["hidden"]
    flying=item["flying"]
    position=item["position"]
    main=chart["najia_lines"][position-1]
    if (main["position"]!=position or main["ganzhi"]!=flying["ganzhi"] or
        main["moving"]!=flying["moving"] or hidden["position"]!=position):
        raise ValueError("V49 飞伏同位来源或本卦动静不一致")
    if main["liuqin"]==hidden["liuqin"]:
        raise ValueError("V49 本卦明现相同六亲不得装伏神")
    day=chart["calendar"]["day"]
    month=chart["calendar"]["month"]
    hbranch=hidden["branch"]
    fbranch=flying["branch"]
    hel=hidden["element"]
    fel=flying["element"]
    hvoid=item["void_review"]
    if hvoid["is_void"]!=(hbranch in day["xunkong"] if day else None):
        raise ValueError("V49 伏神旬空必须来自独立本位地支")
    if hvoid["flying_is_void"]!=(main["is_xunkong"] if day else None):
        raise ValueError("V49 飞神旬空必须与本卦同位爻一致")
    day_rel=_relation(BRANCH_ELEMENT[day["day_branch"]],hel) if day else None
    month_rel=_relation(month["element"],hel) if month else None
    fly_rel=_relation(fel,hel)
    fly_kind={
        "比和":"飞伏比和","生伏":"飞生伏","克伏":"飞克伏",
        "伏生源":"伏生飞","伏克源":"伏克飞"
    }[fly_rel]
    if fly_kind!=item["flying_hidden_relation"]:
        raise ValueError("V49 飞伏五行关系与装卦结果不一致")
    movers=[]
    for line in chart["najia_lines"]:
        if line["moving"] and line["position"]!=position:
            movers.append({
                "source_position":line["position"],
                "source_ganzhi":line["ganzhi"],
                "source_element":line["element"],
                "element_relation_to_hidden":_relation(line["element"],hel),
                "element_relation_to_flying":_relation(line["element"],fel),
                "real_mover":True,
                "acts_on_hidden_proven":False,
            })
    hidden_month_break=(hbranch==OPPOSITES[month["branch"]]) if month else None
    flying_month_break=(fbranch==OPPOSITES[month["branch"]]) if month else None
    flying_day_clash=(fbranch==OPPOSITES[day["day_branch"]]) if day else None
    fly_controlled_by_calendar=(
        (CONTROLS[BRANCH_ELEMENT[day["day_branch"]]]==fel if day else False) or
        (CONTROLS[month["element"]]==fel if month else False)
    )
    mover_fly_clash=any(
        OPPOSITES[x["branch"]]==fbranch for x in chart["najia_lines"]
        if x["moving"] and x["position"]!=position
    )
    mover_fly_controls=any(x["element_relation_to_flying"]=="克伏" for x in movers)
    month_grade=season_for_element(month["branch"],hel)["grade"] if month else None
    day_month_help=(
        any(r=="生伏" for r in (day_rel,month_rel) if r is not None)
        if day or month else None
    )
    fly_release=(
        bool(hvoid["flying_is_void"] or flying_month_break or
             flying_day_clash or fly_controlled_by_calendar or
             mover_fly_clash or mover_fly_controls)
        if day or month or movers else None
    )
    def indicator(code,title,status,note):
        return {"id":code,"title":title,"observed":status,
                "kind":"structural_reference_only",
                "note":note,"actual_effectiveness":None}
    conditions=[
        indicator("hidden_calendar_generation","伏神得日月生候选",day_month_help,
                  "仅日月五行直接生伏；同类及旺相另列，不自动判可用"),
        indicator("hidden_month_grade","伏神月令旺相概要",
                  month_grade in ("旺","相") if month_grade else None,
                  "仅月令分类，真实旺衰还需合参"),
        indicator("flying_generates_hidden","飞神生伏候选",fly_rel=="生伏",
                  "飞伏五行方向确定，不等于实际生扶成功"),
        indicator("mover_generates_hidden","其他本卦明动爻五行生伏候选",
                  any(x["element_relation_to_hidden"]=="生伏" for x in movers),
                  "只证明有真实明动爻的五行生伏方向，未证明其能直接作用隐藏伏神"),
        indicator("flying_restrained_reference","飞神受冲克候选",fly_release,
                  "飞神临空破、日月冲克或他动爻克冲可列候选，不判飞神已被制住"),
        indicator("flying_void_break_context","飞神空破参考",
                  (bool(hvoid["flying_is_void"] or flying_month_break)
                   if day or month else None),
                  "不能把飞神旬空与伏神旬空互相混同"),
    ]
    return {
        "position":position,"hidden_ganzhi":hidden["ganzhi"],
        "flying_ganzhi":flying["ganzhi"],
        "hidden_element":hel,"flying_element":fel,
        "flying_hidden_relation":fly_kind,
        "hidden_void":hvoid["is_void"],
        "flying_void":hvoid["flying_is_void"],
        "hidden_month_break":hidden_month_break,
        "flying_month_break":flying_month_break,
        "hidden_day_clash":hvoid["day_clashes_hidden"],
        "flying_day_clash":flying_day_clash,
        "hidden_month_grade":month_grade,
        "day_relation_to_hidden":day_rel,
        "month_relation_to_hidden":month_rel,
        "other_actual_movers":movers,
        "conditions":conditions,
        "actual_hidden_available":None,
        "actual_flying_suppression":None,
        "hidden_chosen_as_yongshen":False,
        "strength_verdict":None,"timing_verdict":None,
    }


def decorate_hidden_condition_review(chart:dict)->dict:
    selected=chart["fushen"]["selected"]
    candidates=[]
    if selected and selected["status"]=="hidden_in_palace":
        candidates=[_entry(chart,x) for x in selected["entries"]]
        selected["condition_review"]={"version":"V49","rows":candidates,
             "decision":None,
             "note":"古籍六种伏神可用条件仅作为逐项核验参照；有一项候选不等于实际有用。"}
    else:
        if selected is not None:selected["condition_review"]=None
    chart["hidden_condition_review"]={
        "version":"V49",
        "status":"hidden_candidates" if candidates else
                 "no_focus" if not chart.get("focus") else
                 "visible_or_position_focus",
        "rows":candidates,
        "selected_relative":selected.get("category") if selected else None,
        "references":{"fei_fu":ORIGINAL},
        "has_final_decision":False,
        "real_mover_can_act_on_hidden_computed":False,
        "fortune_conclusion":None,"timing_conclusion":None,
        "boundary":"伏神与飞神只按本支、日月和其他真正明动爻标示可复算条件；未计算伏神实战能否透出、飞神已被制伏、真假空、最终旺衰或吉凶应期。"
    }
    return chart
