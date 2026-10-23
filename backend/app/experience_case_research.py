"""V32 descriptive counts for the server-side case archive.

Counting self-reported result categories is *not* measuring divination accuracy.
No identifying fields or individual case text appear in summary output.
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
        "missing_calendar":0,"missing_before":0,"missing_created_at":0,
        "invalid_original_numbers":0,"time_order_needs_review":0,
        "unresolved_self_reports":0,
        "self_report_tags":counts,
        "self_report_feedback_entries":{name:0 for name in counts},
        "top_categories":[],
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
        before=c.get("before")
        if not isinstance(before,str) or not before.strip():
            result["missing_before"]+=1
        numbers=c.get("original_numbers")
        if not isinstance(numbers,list) or len(numbers)!=6 or any(
                type(n) is not int or n not in (6,7,8,9) for n in numbers):
            result["invalid_original_numbers"]+=1
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
            result["missing_created_at"]+=1
        has_early=False
        reported=set()
        for item in feedback:
            if not isinstance(item,dict):
                continue
            name=item.get("result_type")
            if name in counts:
                reported.add(name)
                result["self_report_feedback_entries"][name]+=1
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


def _status_totals(rows):
    counts={name:0 for name in STATUSES}
    other=0
    for row in rows or ():
        if not isinstance(row,(tuple,list)) or len(row)<2:
            continue
        try:
            number=max(0,int(row[1]))
        except (TypeError,ValueError):
            continue
        if row[0] in counts:
            counts[row[0]]+=number
        else:
            other+=number
    return counts,other,sum(counts.values())+other


def summarize_case_archive(visitor_rows, imported_rows, *,
                           visitor_status_rows=None, imported_status_rows=None):
    """Summarize both server-side sources without returning case text or identifiers."""
    visitor_rows=list(visitor_rows or ())
    imported_rows=list(imported_rows or ())
    summary=summarize_imported_cases(visitor_rows+imported_rows)
    visitor_status,visitor_other,visitor_total=_status_totals(visitor_status_rows)
    imported_status,imported_other,imported_total=_status_totals(imported_status_rows)
    if visitor_status_rows is None:
        visitor_status,visitor_other,visitor_total=_status_totals(
            [(status,1) for status,_ in visitor_rows])
    if imported_status_rows is None:
        imported_status,imported_other,imported_total=_status_totals(
            [(status,1) for status,_ in imported_rows])
    summary["scope"]="server_case_archive"
    summary["sampled_cases"]=summary["total_cases"]
    summary["source_counts"]={
        "visitor_submissions":visitor_total,
        "owner_uploaded_case_files":imported_total,
        "all":visitor_total+imported_total,
    }
    summary["source_status_counts"]={
        "visitor_submissions":visitor_status,
        "owner_uploaded_case_files":imported_status,
    }
    summary["status_counts"]={
        name:visitor_status[name]+imported_status[name] for name in STATUSES
    }
    summary["other_status_counts"]={
        "visitor_submissions":visitor_other,"owner_uploaded_case_files":imported_other,
        "all":visitor_other+imported_other,
    }
    summary["total_cases"]=visitor_total+imported_total
    summary["independently_verified"]=False
    summary["prediction_accuracy"]=None
    summary["notice"]=(
        "只统计书院服务器收到的访客自愿提交和站长导入案例；不包含浏览器本机收案簿。"
        "反馈分类为分享者自述，不代表独立核验或预测准确率。"
    )
    return summary
