"""V86《太乙金镜式经》卷九三张阳遁时计例课与阴遁纪/局/时柱冲突审计。

史文逐项独立录入；用已有古法纯函数重算，不据古例指定现代
二至气应的纪首/文昌/始击或主客将。卷九所谓阴遁第三纪第五十二
局乙卯时若依V78的360周/72局/60时六纪三制不能同时成立，
保留三种解释的逐字段差异，不把近似命中当作全盘认证。
"""
from __future__ import annotations

from .taiyi_hour_v78 import classical_hour_ju
from .taiyi_hour_v79 import calculate_hour_main_guest

SOURCE_VOL9="https://zh.wikisource.org/zh-hans/太乙金鏡式經_(四庫全書本)/卷09"
# 原书明确写出的字段才作为核验真值；未经原书记载的主算、主大将等不伪称验证。
YANG_CASES=(
    {"id":"yang_ji1_ju2","source_section":"推敌国有无间谍",
     "dun":"阳遁","six_ji_number":1,"ju":2,"hour_ganzhi_from_jiazi_start":"乙丑",
     "taiyi_palace":1,"wenchang_god":"太簇","jishen":"丑",
     "shiji_god":"阴主","guest_count":1,"guest_general":1},
    {"id":"yang_ji1_ju8","source_section":"推敌来方面法",
     "dun":"阳遁","six_ji_number":1,"ju":8,"hour_ganzhi_from_jiazi_start":"辛未",
     "taiyi_palace":3,"wenchang_god":"阳德","jishen":"未",
     "shiji_god":"大武","guest_count":22},
    {"id":"yang_ji1_ju25","source_section":"推敌使言虚实",
     "dun":"阳遁","six_ji_number":1,"ju":25,"hour_ganzhi_from_jiazi_start":"戊子",
     "taiyi_palace":1,"wenchang_god":"地主","jishen":"寅",
     "shiji_god":"大义","guest_count":40,
     "guest_general":4,"guest_assistant":2},
)
YIN_SOURCE={
    "id":"yin_third_ji_52_ju_yimao",
    "dun":"阴遁","six_ji_number":3,"ju":52,
    "hour_ganzhi_from_jiazi_start":"乙卯",
    "taiyi_palace":8,"wenchang_god":"阳德","jishen":"巳",
    "shiji_god":"太簇","guest_count":7,
    "guest_general":7,"guest_assistant":1,
}
CORE_KEYS=("dun","six_ji_number","ju","hour_ganzhi_from_jiazi_start",
           "taiyi_palace","wenchang_god","jishen","shiji_god",
           "guest_count","guest_general","guest_assistant")

def _recalculate(count:int,dun:str)->tuple[dict,dict]:
    historical=classical_hour_ju(count,dun)
    result=calculate_hour_main_guest(historical)
    actual={
        "dun":dun,
        "six_ji_number":historical["six_ji_number"],
        "ju":historical["ju"],
        "hour_ganzhi_from_jiazi_start":historical["hour_ganzhi_from_jiazi_start"],
        "taiyi_palace":historical["taiyi_palace"]["number"],
        "wenchang_god":historical["time_wenchang"]["god"],
        "jishen":historical["time_jishen"],
        "shiji_god":result["earth_eye_shiji"]["god"],
        "guest_count":result["guest_calculated"],
        "guest_general":result["guest_general"],
        "guest_assistant":result["guest_assistant"],
    }
    return actual,result

def audit_vol9_yang_examples()->dict:
    rows=[]
    for ancient in YANG_CASES:
        # 第一纪中的局数即周内时数，和V85第六纪局27不同。
        count=ancient["ju"]
        actual,plate=_recalculate(count,ancient["dun"])
        expected={key:value for key,value in ancient.items() if key in CORE_KEYS}
        calculated={k:actual[k] for k in expected}
        if expected!=calculated or plate["guest"]["status"]!="computed":
            raise ValueError("V86 卷九阳遁独立时计例课未通过原文逐字段验收："+ancient["id"])
        if sum(row["added"] for row in plate["guest"]["trace"])!=ancient["guest_count"]:
            raise ValueError("V86 客方逐宫加数与古籍不一致")
        rows.append({
            "id":ancient["id"],"source_section":ancient["source_section"],
            "in_cycle_360":count,"source":SOURCE_VOL9,
            "status":"verified_independent_hour_example",
            "attested_expected":expected,"actual_on_attested_fields":calculated,
            "guest_count_trace":plate["guest"]["trace"],
            "unattested_computed_fields_not_promoted":True,
            "is_historical_ji_case":True,
            "is_verified_modern_qiying_epoch":False,
        })
    return {"version":"V86","status":"three_yang_source_cases_verified",
            "source":SOURCE_VOL9,"cases":rows,
            "confirmed_qiying_epoch":None,"fortune_verdict":None}

def audit_vol9_yin_conflict()->dict:
    """逐列对照第三纪52局乙卯，不能通过只吻合局部宫神的伪证。"""
    cases=[]
    for label,count in (
        ("cycle_52_ju_and_yimao",52),
        ("third_ji_ju52",124),
        ("third_ji_hour52_yimao",172),
    ):
        actual,plate=_recalculate(count,"阴遁")
        matches={key:(actual[key]==YIN_SOURCE[key])
                 for key in CORE_KEYS}
        cases.append({
            "interpretation":label,"in_cycle_360":count,
            "actual":actual,"source_field_matches":matches,
            "mismatched_source_fields":[k for k,v in matches.items() if not v],
            "matches_every_attested_field":all(matches.values()),
            "guest_count_trace":plate["guest"]["trace"],
            "may_be_used_as_modern_qiying_anchor":False,
        })
    if any(item["matches_every_attested_field"] for item in cases):
        raise ValueError("V86 阴遁第三纪52局乙卯原文冲突审查改变，需人工复核")
    if (cases[0]["mismatched_source_fields"]!=["six_ji_number"]
        or cases[1]["mismatched_source_fields"]!=["hour_ganzhi_from_jiazi_start"]
        or "ju" not in cases[2]["mismatched_source_fields"]):
        raise ValueError("V86 阴遁原文冲突字段边界异常")
    return {"version":"V86","status":"historical_ji_ju_hour_conflict_pending",
            "source":SOURCE_VOL9,"source_section":"推敌国动静",
            "source_attested_fields":{k:YIN_SOURCE[k] for k in CORE_KEYS},
            "hypotheses":cases,"preferred_interpretation":None,
            "source_not_repaired":True,"can_promote_full_yin_plate":False,
            "can_anchor_modern_qiying_wenchang":False,
            "not_an_independent_modern_qiying_epoch":True,
            "fortune_verdict":None}

def decorate_taiyi_v86(chart:dict)->dict:
    if (chart.get("version")!="V77" or
        chart.get("qiying_phase_review_version")!="V85" or
        chart.get("hour_v85_phase_hypotheses",{}).get("preferred_phase") is not None):
        raise ValueError("V86 只接未经选定现代气应纪首的V85盘")
    yin=audit_vol9_yin_conflict()
    yang=audit_vol9_yang_examples()
    qi=chart["hour_v84_qiying_plate"]["qiying"]
    if (qi["qiying_wenchang"] is not None or
        qi["qiying_shiji"] is not None or
        qi["qiying_main_general"]["palace"] is not None or
        qi["qiying_guest_general"]["palace"] is not None):
        raise ValueError("V86 不得由历史例课冒充现代气应主客")
    chart["hour_v86_classical_examples"]={"version":"V86",
        "yang_examples":yang,"yin_source_conflict":yin,
        "has_ancient_example_crosschecks":True,
        "has_verified_unique_modern_qiying_epoch":False,
        "cannot_import_historical_guest_general_to_qiying":True,
        "fortune_verdict":None}
    chart["hour_source_review_version"]="V86"
    chart["has_full_hour_chart"]=False
    chart["warnings"].append(
        "V86《金镜式经》卷九阳遁2/8/25局客方原例已逐项校验；"
        "阴遁第三纪52局乙卯时存在纪/局/时柱互相冲突，保留三路候选待校。"
        "古代例盘不等于现代二至气应上元，文昌、始击、主客将不移植。")
    from .taiyi_hour_v87 import decorate_taiyi_v87
    return decorate_taiyi_v87(chart)
