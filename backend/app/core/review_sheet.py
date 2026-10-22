"""V25 可复核研判模板：程序事实/限制/未决分列，供用户独立书写。"""
from __future__ import annotations

def _evidences(items):
    return [{"title":e["title"],"detail":e["detail"],"origin":e["origin"]} for e in items]

def decorate_review_sheet(chart:dict)->dict:
    focus=chart["focus_decision"]
    strength={x["position"]:x for x in chart["strength_evidence"]["rows"]}
    chain={x["position"]:x for x in chart["evidence_chain"]["candidates"]}
    effects={x["position"]:x for x in chart["focus_effect_review"]["candidates"]}
    voids={x["position"]:x for x in chart["void_context_review"]["rows"]}
    candidates=[]
    for item in focus["candidates"]:
        pos=item["position"]
        row=strength[pos]
        evidence=chain[pos]
        effect=effects[pos]
        void=voids[pos]
        questions=list(dict.fromkeys(row["pending"]+evidence["cautions"]+effect["cautions"]+void["cross_checks"]))
        candidates.append({
            "position":pos,"ganzhi":item["ganzhi"],
            "selected_by_user":pos==focus["selected_position"],
            "supporting":_evidences(row["supporting"]),
            "restraining":_evidences(row["restraining"]),
            "context":_evidences(row["context"]),
            "pending":questions or ["尚需对照现实事实，现有标记不等于完整判断"],
            "axis_ids":[x["id"] for x in evidence["axes"]],
            "active_sources":{
                role:[src["source_position"] for src in effect["roles"][role]
                      if src["kind"]=="active_direct_edge_pending_effect"]
                for role in ("原神","忌神")},
            "conclusion":None,"score":None
        })
    calendar=chart["calendar"]
    if chart.get("focus") is None:status="focus_not_selected"
    elif focus["status"]=="not_visible":status="focus_not_visible"
    elif not calendar["day"] or not calendar["month"]:status="date_incomplete"
    elif len(candidates)>1 and focus["selected_position"] is None:status="candidate_comparison"
    else:status="ready_to_record"
    chart["review_sheet"]={
        "version":"V25","status":status,
        "calendar_source":"server_recomputed_calendar" if chart.get("calendar_provenance") else "manual_unverified",
        "focus_category":chart["focus"]["category"] if chart.get("focus") else None,
        "selected_position":focus["selected_position"],"candidates":candidates,
        "questions":[
            "事前背景是什么，哪些现实事实已经核实？",
            "哪些已计算盘面条件支持初步假设？",
            "哪些相反证据和未决条件可能推翻假设？",
            "后续需要观察什么事实才能检验原先记录？"],
        "program_determined":False,"final_strength":None,
        "fortune_conclusion":None,"timing_conclusion":None,
        "user_notes_stored_by_backend":False,
        "boundary":"此模板只是程序证据分组，任何个人研判和事后反馈都不能与程序事实混同。未实现自动断旺衰、吉凶和应期。"
    }
    return chart
