"""V33 admin-only, aggregated case-condition contrasts; no private text leaves this module."""
from .experience_case_research import summarize_imported_cases

DIMENSIONS={"ben_gua","bian_gua","day_ganzhi","month_branch","moving_count",
            "moving_lines","selected_position","chosen_category"}
PUBLIC_STATS=("total_cases","status_counts","with_followup","missing_followup",
              "missing_calendar","time_order_needs_review","unresolved_self_reports",
              "self_report_tags","independently_verified","prediction_accuracy")

def condition_value(case,dimension):
    if dimension not in DIMENSIONS:
        raise ValueError("不支持的对照条件")
    c=case if isinstance(case,dict) else {}
    if dimension in ("moving_count","moving_lines"):
        nums=c.get("original_numbers")
        if not isinstance(nums,list) or len(nums)!=6 or any(
            type(n) is not int or n not in (6,7,8,9) for n in nums):
            return "未记录"
        idx=[str(i+1) for i,n in enumerate(nums) if n in (6,9)]
        if dimension=="moving_count":
            return str(len(idx))+"爻"
        return "、".join("第"+s+"爻" for s in idx) if idx else "无动爻"
    if dimension=="selected_position":
        pos=c.get(dimension)
        if type(pos) is not int or pos<1 or pos>6:
            return "未记录"
        return "第"+str(pos)+"爻"
    value=c.get(dimension)
    return value.strip()[:100] if isinstance(value,str) and value.strip() else "未记录"

def research_contrast(rows,dimension,target):
    if dimension not in DIMENSIONS or not isinstance(target,str) or not 0<len(target)<=100:
        raise ValueError("对照参数不合法")
    matched,other=[],[]
    for status,c in rows:
        if not isinstance(c,dict):
            continue
        (matched if condition_value(c,dimension)==target else other).append((status,c))
    def safe_summary(bucket):
        s=summarize_imported_cases(bucket)
        return {k:s[k] for k in PUBLIC_STATS}
    result={"dimension":dimension,"target":target,"matching":safe_summary(matched),
            "other":safe_summary(other),
            "scope":"server_voluntary_cases_sampled",
            "independently_verified":False,"prediction_accuracy":None,
            "notice":"同一条件与其他条件的描述性对照；记录可能来自不同背景或选择性分享。自述不是事实核实，不能推断规则、因果或预测准确率。"}
    if len(matched)<5 or len(other)<5:
        result["small_sample_warning"]="至少一组不足5份，仅可整理案例和提出待验证问题。"
    return result
