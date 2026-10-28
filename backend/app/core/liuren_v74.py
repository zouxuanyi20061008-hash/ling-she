"""V74 六壬三传安全边界：古籍互刑杜传与未决课式可追溯审查。

在 V63 已附天将、日旬遁空之后增补审查元数据，不篡改未决三传，
不将不同流派的涉害优先法自动合并；保持 V63 旧字段契约。
"""
from __future__ import annotations

from .calendar import BRANCHES
from .liuren_v59 import PUNISH

CLASSIC_SPECIAL="https://www.zhaosir.online/Books/BookChapterDetail.aspx?did=1650"
SECONDARY_SPECIAL="https://orasage.com/zh-CN/daozang/docs/zh-cn/5_5_3"
REMOTE="https://libokang.com/classics/liuren/%E5%A4%A7%E5%85%AD%E5%A3%AC%E6%8C%87%E5%8D%97/"
FANYIN="https://libokang.com/classics/liuren/%E5%85%AD%E5%A3%AC%E7%B2%B9%E8%A8%80/"
SHEHAI="https://www.zhaosir.online/Books/BookChapterDetail.aspx?did=885"

def _pending_type(trans:dict,offset:int)->tuple[str,str,str]:
    method=trans["method"]
    if offset==6 and "涉害" in method:
        return ("fanyin_multi_conflict","反吟多贼克需涉害",
                "反吟多克须经比用/涉害审定，尚缺本流派唯一实例；不得首候选自动发用。")
    if offset==0:
        return ("fuyin_multi_conflict","伏吟多贼克待核",
                "伏吟出现多个贼克上神且比用不唯一，须依据原典选择后再刑冲取中末。")
    if "涉害" in method:
        return ("shehai_unresolved","涉害同深或异法未决",
                "循宫计害及孟仲季取用仍未给出唯一结论，应对照各候选实际路径。")
    if "遥克" in method:
        return ("remote_multi_candidate","遥克上神多候选未决",
                "必须保留神遥克日、日遥克神优先层与阴阳比用，未达唯一不得擅选。")
    return ("special_method_unresolved","九宗门特殊分支待校",
            "未满足目前独立校验的三传条件；天地盘与四课仍可核对。")

def decorate_liuren_v74(chart:dict)->dict:
    if chart.get("version")!="V63" or not chart.get("has_real_plates_and_four_lessons"):
        raise ValueError("V74 仅审查已有完整V63天地盘四课与旬空天将盘")
    t=chart["three_transmissions"]
    if t["status"] not in ("pending","computed"):
        raise ValueError("三传状态必须明确为 computed/pending")
    review=chart["transmission_review"]
    if review["status"]!=t["status"]:
        raise ValueError("三传判决与来源审查状态不一致")
    if t["status"]=="pending":
        if t["transmissions"] is not None or chart["has_three_transmissions"]:
            raise ValueError("尚未唯一发用，不能伪造三传或已完成标记")
        code,label,action=_pending_type(t,review["offset_palaces"])
        data={
            "version":"V74","status":"pending","category":code,
            "label":label,"method":t["method"],"reason":t["reason"],
            "candidate_branches":list(t["initial_candidates"]),
            "candidate_count":len(t["initial_candidates"]),
            "can_auto_select":False,"three_transmissions":None,
            "next_check":action,
            "source":SHEHAI if "shehai" in code else (
                FANYIN if "fanyin" in code else REMOTE),
            "real_world_verdict":None,
        }
    else:
        rows=t.get("transmissions")
        if not isinstance(rows,list) or len(rows)!=3 or not chart["has_three_transmissions"]:
            raise ValueError("已定三传的三地支与状态不一致")
        branches=[p.get("branch") for p in rows]
        if any(q not in BRANCHES for q in branches):
            raise ValueError("三传不是合法地支")
        special=chart["day_ganzhi"] in ("丁卯","己卯","辛卯") and (
            review["offset_palaces"]==0)
        marker=t.get("rule_audit",{}).get("reciprocal_punishment_broken_by_clash",False)
        if special:
            if branches!=["卯","子","午"] or not marker:
                raise ValueError("丁己辛卯伏吟必须按古籍卯子午互刑杜传，不可往返误判")
            if PUNISH["卯"]!="子" or PUNISH["子"]!="卯":
                raise ValueError("卯子互刑来源发生变化")
        elif marker:
            raise ValueError("卯子互刑例外不可扩散到普通伏吟课")
        data={
           "version":"V74","status":"computed",
           "category":"fuyin_reciprocal_punishment" if special else "already_verified",
           "label":"伏吟卯子互刑特例，改冲午" if special else "已按现有口径计算三传",
           "classical_exception_applied":special,
           "candidate_branches":list(t.get("initial_candidates",[])),
           "three_transmissions":branches,
           "can_auto_select":False,
           "source":CLASSIC_SPECIAL if special else t.get("source"),
           "real_world_verdict":None,
        }
    chart["pending_branch_review"]=data
    chart["audit_version"]="V74"
    chart["has_full_nine_methods"]=False
    chart["fortune_verdict"]=None
    chart["limits"]=[
        "V74 核对丁卯、己卯、辛卯伏吟卯子午互刑杜传；不使用卯子互刑往返作为末传。",
        "每张起课盘区分已确定的三传与尚未裁决的反吟多克、涉害及遥克多候选，不自动排序或补造。",
        "古籍不同计害/起传口径的分歧仍在，最终吉凶和现实应期不可自动推断。",
    ]
    return chart
