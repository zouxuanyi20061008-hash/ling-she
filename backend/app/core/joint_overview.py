"""Six-yao integrated evidence workspace (V37).

Reuses deterministically computed calendar, moving line, five-element and void
fields. Presents independent layers of evidence; does NOT rank line strength,
resolve void, select a unique focus, or predict real-world outcomes.
"""
from __future__ import annotations

from .yongshen import FOCUS_CHOICES

ORDER=("父母","官鬼","兄弟","妻财","子孙","世爻","应爻")


def _calendar_action(row:dict,kind:str)->dict:
    action=row.get(kind+"_action")
    if action is None:
        return {
            "known":False,"relation":None,"clash":None,"combine":None,
            "same_branch":None,"reason":"未确认相关日辰/节令月建",
        }
    return {
        "known":True,"relation":action["element_relation"],
        "clash":bool(action["clash"]),"combine":bool(action["combine"]),
        "same_branch":bool(action["same_branch"]),"reason":"原始干支关系已计算，实际效力待合参",
    }


def _moving_edges(chart:dict,position:int)->list[dict]:
    # Only ACTUAL moving lines in the original hexagram may target another
    # original line. A changed line NEVER targets any other position.
    return [
        {"from_position":edge["source_position"],
         "from_ganzhi":edge["source_ganzhi"],
         "to_position":position,
         "relation":edge["element_relation"],
         "clash":bool(edge["clash"]),"combine":bool(edge["combine"]),
         "confirmed_mover":True,"effectiveness":None}
        for edge in chart["moving_influences"]["edges"]
        if edge["target_position"]==position
    ]


def _line_overview(chart:dict,position:int)->dict:
    original=chart["najia_lines"][position-1]
    transformed=chart["bian_najia_lines"][position-1]
    strength=chart["strength_evidence"]["rows"][position-1]
    void=chart["void_context_review"]["rows"][position-1]
    has_day=bool(chart["calendar"]["day"])
    has_month=bool(chart["calendar"]["month"])
    changed=bool(original["moving"])
    return_relation=original.get("turnback") if changed else None
    # On static lines, transformed plate is a comparison, not a moving line.
    return {
        "position":position,
        "ganzhi":original["ganzhi"],"liuqin":original["liuqin"],
        "element":original["element"],"role":original["role"],
        "moving":changed,"focus_candidate":position in chart["focus_decision"].get("candidates_positions",[]),
        "selected_by_user":chart["focus_decision"].get("selected_position")==position,
        "day":_calendar_action(original,"day"),
        "month":_calendar_action(original,"month"),
        "season":original["seasonal_status"]["grade"] if has_month else None,
        "original_void":bool(original["is_xunkong"]) if has_day else None,
        "month_break":bool(original["month_break_marker"]) if has_month else None,
        "day_clash":bool(original["day_clash"]) if has_day else None,
        "incoming_movers":_moving_edges(chart,position),
        "self_change":{
            "ganzhi":transformed["ganzhi"],
            "liuqin":transformed["liuqin"],
            "returning_term":return_relation["term"] if return_relation else None,
            "returning_clash":bool(return_relation["returning_clash"]) if return_relation else None,
            "returning_combine":bool(return_relation["returning_combine"]) if return_relation else None,
            "transformed_void":bool(void["transformed_void"]) if changed and has_day else None,
            "is_actual_change":changed,
            "effectiveness":None,
        },
        "hidden_relatives":list(original.get("fushen",[])),
        "supporting":[{"title":x["title"],"detail":x["detail"]} for x in strength["supporting"]],
        "restraining":[{"title":x["title"],"detail":x["detail"]} for x in strength["restraining"]],
        "pending":list(strength["pending"]),
        "has_opposing_indicators":strength["has_opposing_indicators"],
        "cross_checks":list(void["cross_checks"]),
        "final_strength":None,
        "outcome":None,
    }


def decorate_joint_overview(chart:dict)->dict:
    focus=chart.get("focus")
    decision=chart["focus_decision"]
    positions=[x["position"] for x in decision["candidates"]]
    decision["candidates_positions"]=positions
    all_lines=[_line_overview(chart,p) for p in range(1,7)]
    for line in all_lines:
        line["focus_candidate"]=line["position"] in positions
    hidden=[]
    if focus and not positions:
        for entry in chart["fushen"]["selected"]["entries"]:
            hidden.append({
                "position":entry["position"],
                "hidden_ganzhi":entry["hidden"]["ganzhi"],
                "hidden_liuqin":entry["hidden"]["liuqin"],
                "flying_ganzhi":entry["flying"]["ganzhi"],
                "flying_liuqin":entry["flying"]["liuqin"],
                "relation":entry["flying_hidden_relation"],
                "effective":None,
            })

    status=("focus_not_selected" if not focus else
            "hidden_focus" if not positions else
            "calendar_incomplete" if not chart["calendar"]["day"] or not chart["calendar"]["month"] else
            "waiting_user_choice" if len(positions)>1 and decision["selected_position"] is None else
            "structured_review_ready")
    chart["joint_overview"]={
        "version":"V37",
        "status":status,
        "calendar":{
            "day_ganzhi":chart["calendar"]["day"]["ganzhi"] if chart["calendar"]["day"] else None,
            "month_branch":chart["calendar"]["month"]["branch"] if chart["calendar"]["month"] else None,
            "day_confirmed":bool(chart["calendar"]["day"]),
            "month_confirmed":bool(chart["calendar"]["month"]),
            "server_recomputed":chart.get("calendar_provenance",{}).get("source")=="server_recomputed_calendar",
        },
        "focus_choices":[{"id":x,"themes":FOCUS_CHOICES[x]["themes"]} for x in ORDER],
        "focus_category":focus["category"] if focus else None,
        "focus_positions":positions,
        "selected_position":decision["selected_position"],
        "hidden_focus":hidden,
        "rows":all_lines,
        "moving_positions":list(chart["dong_yao"]),
        "requires_user_choice":len(positions)>1 and decision["selected_position"] is None,
        "has_complete_calendar":bool(chart["calendar"]["day"] and chart["calendar"]["month"]),
        "strength_score":None,
        "effective_strength_computed":False,
        "fortune_conclusion":None,
        "timing_conclusion":None,
        "rules":[
            "用神候选必须来自所选六亲/世应的本卦真实位置，不能由系统悄悄挑选。",
            "本卦明动爻可以与其他本卦爻进行五行生克冲合对照；静爻不视为发动。",
            "变爻只能在本位作回头关系比较；其他变爻不可跨位作用本卦爻。",
            "日月关系及旬空月破只在输入对应历法参数后计算。",
            "生扶、制约、冲合、旬空并列显示，不做正负分相减，不冒充最终旺衰。",
        ],
        "boundary":"传统六爻规则的事实对照盘。支持、克制与动变等关系成立，不等于实际效力或吉凶应期已确定。",
    }
    # No extra mutation of earlier focus_decision schema is needed.
    decision.pop("candidates_positions",None)
    return chart
