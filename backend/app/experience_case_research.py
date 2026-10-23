"""V32 descriptive counts for owner-imported cases only.

Counting self-reported result categories is *not* measuring divination accuracy.
No identifying fields or individual case text appear in the summary output.
"""
from __future__ import annotations
from datetime import datetime

OUTCOMES = {"基本吻合", "部分吻合", "未吻合"}
UNRESOLVED = {"尚无结果", "无法判断"}
STATUSES = ("pending", "approved", "rejected")


def _date(value):
    if not isinstance(value,str) or not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z","+00:00"))
    except ValueError:
        return None


def summarize_imported_cases(rows):
    """Rows are (status, case dict) pairs; content is only held for this request."""
    statuses={name:0 for name in STATUSES}
    counts={name:0 for name in (*OUTCOMES,*UNRESOLVED)}
    category_counts={}
    result={
        "scope":"owner_uploaded_case_files","total_cases":0,
        "status_counts":statuses,
        "with_followup":0,"missing_followup":0,
        "missing_calendar":0,"time_order_needs_review":0,
        "unresolved_self_reports":0,
        "self_report_tags":counts,"top_categories":[],
        "independently_verified":False,"prediction_accuracy":None,
        "notice":"仅统计站长导入并由分享者自愿提交的案例；结果是未经独立核验的自述，不代表预测准确率。",
    }
    for status,c in rows:
        if not isinstance(c,dict):
            continue
        result["total_cases"]+=1
        if status in statuses:
            statuses[status]+=1
        if not c.get("day_ganzhi") or not c.get("month_branch"):
            result["missing_calendar"]+=1
        category=c.get("chosen_category")
        if not isinstance(category,str) or not category.strip():
            category="未标记"
        else:
            category=category.strip()[:50]
        category_counts[category]=category_counts.get(category,0)+1
        feedback=c.get("feedback",[])
        feedback=feedback if isinstance(feedback,list) else []
        valid_followup=False
        has_unresolved=False
        has_early=False
        original=_date(c.get("created_at"))
        if not original:
            has_early=True
        reported=set()
        for item in feedback:
            if not isinstance(item,dict):
                continue
            name=item.get("result_type")
            if name in counts:
                reported.add(name)
            if name in UNRESOLVED:
                has_unresolved=True
            if name in OUTCOMES and isinstance(item.get("observations"),str):
                valid_followup|=len(item["observations"].strip())>=2
            observed=_date(item.get("recorded_at"))
            if original and observed:
                try:
                    if (observed-original).total_seconds() < -60:
                        has_early=True
                except TypeError:
                    has_early=True
        for name in reported:
            counts[name]+=1
        if valid_followup:
            result["with_followup"]+=1
        else:
            result["missing_followup"]+=1
        if has_early:
            result["time_order_needs_review"]+=1
        if has_unresolved:
            result["unresolved_self_reports"]+=1
    result["top_categories"]=[
        {"name":name,"count":qty} for name,qty in sorted(
            category_counts.items(),key=lambda pair:(-pair[1],pair[0]))[:8]]
    return result
