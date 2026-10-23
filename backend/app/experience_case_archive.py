"""V30 owner-reviewed case imports from voluntary V27 exchange bundles.

The server rejects unknown formats and drops untrusted/private extra fields.
This module does not determine divination accuracy or independent verification.
"""
from __future__ import annotations

import hashlib
import json

FORMAT = "wanxiang-sixyao-case-v1"
CONSENT = "由分享者主动导出、交给收件人审核的研究材料"
OUTCOMES = {"基本吻合", "部分吻合", "未吻合", "尚无结果", "无法判断"}

class CaseImportError(ValueError):
    pass

def _str(value, length=1500, *, mandatory=False):
    if not isinstance(value, str) or len(value) > length or "\x00" in value:
        raise CaseImportError("案例文字字段不符合格式或超长")
    if mandatory and not value.strip():
        raise CaseImportError("案例必须有事前研判记录")
    return value

def _date(value):
    if value is None:
        return ""
    return _str(value, 60)

def _notes(obj):
    if obj is None:
        return None
    if not isinstance(obj, dict):
        raise CaseImportError("人工研判笔记格式错误")
    return {name: _str(obj.get(name, ""), 1400)
            for name in ("hypothesis", "support", "counter", "verification")}

def _choice(obj):
    if obj is None:
        return None
    if not isinstance(obj, dict):
        raise CaseImportError("择用依据格式错误")
    pos=obj.get("position")
    if pos is not None and (type(pos) is not int or not 1 <= pos <= 6):
        raise CaseImportError("择用爻位格式错误")
    return {"position":pos,"reason":_str(obj.get("reason",""),1200),
            "counter":_str(obj.get("counter",""),1200),
            "context":_str(obj.get("context",""),1200)}

def parse_shared_case(raw: str) -> dict:
    if not isinstance(raw, str) or len(raw.encode("utf-8")) > 60000:
        raise CaseImportError("文件超过60KB，或不是有效分享文件")
    try:
        item=json.loads(raw)
    except (ValueError, TypeError):
        raise CaseImportError("无法解析案例 JSON 文件") from None
    if not isinstance(item,dict) or item.get("format")!=FORMAT or item.get("version")!=1:
        raise CaseImportError("只接受 V27 单份案例分享包，不接受整个收案簿备份")
    if item.get("consent")!=CONSENT:
        raise CaseImportError("缺少分享者主动导出的同意声明")
    source=_str(item.get("source_key"),120,mandatory=True)
    if len(source)>120:
        raise CaseImportError("案例编号不合法")
    c=item.get("case")
    if not isinstance(c,dict):
        raise CaseImportError("案例正文格式无效")
    nums=c.get("original_numbers")
    if not isinstance(nums,list) or len(nums)!=6 or any(
            type(n) is not int or n not in (6,7,8,9) for n in nums):
        raise CaseImportError("六爻原数格式不合法")
    before=_str(c.get("before"),1500,mandatory=True)
    selected=c.get("selected_position")
    if selected is not None and (type(selected) is not int or not 1 <= selected <= 6):
        raise CaseImportError("研习主爻编号无效")
    feedback=c.get("feedback",[])
    if not isinstance(feedback,list) or len(feedback)>20:
        raise CaseImportError("事后反馈条数无效")
    clean_feedback=[]
    for f in feedback:
        if not isinstance(f,dict) or f.get("result_type") not in OUTCOMES:
            raise CaseImportError("事后反馈结果类型不合法")
        clean_feedback.append({
            "recorded_at":_date(f.get("recorded_at")),
            "result_type":_str(f["result_type"],12),
            "observations":_str(f.get("observations"),1600),
        })
    clean={
        "original_numbers":nums,"before":before,
        "ben_gua":_str(c.get("ben_gua",""),100),
        "bian_gua":_str(c.get("bian_gua",""),100),
        "day_ganzhi":_str(c.get("day_ganzhi",""),24),
        "month_branch":_str(c.get("month_branch",""),24),
        "chosen_category":_str(c.get("chosen_category",""),50),
        "selected_position":selected,
        "created_at":_date(c.get("created_at")),
        "feedback":clean_feedback,
        "human_review":_notes(c.get("human_review")),
        "focus_selection":_choice(c.get("focus_selection")),
    }
    # Excluded: question, private notes outside opt-in, API keys, device info,
    # uploaded client-provided status/rating and any other unknown field.
    return {
        "id":hashlib.sha256(source.encode("utf-8")).hexdigest(),
        "source_key":source,
        "shared_at":_date(item.get("shared_at")),
        "case":clean,
        "verified":False,
        "accuracy_score":None,
    }
