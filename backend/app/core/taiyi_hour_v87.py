"""V87: 卷九阴遁第三纪52局乙卯时——完整360时同余排除与同源文本校勘。

甲子60时、五元72局、六纪60时共同按360时周闭合。穷尽360种余数
证明古例三条件不可同时成立；数字转录一致≠证实独立古籍异本。
不把只命中两条件的候选冒充原典全盘，亦不据此校准王希明气应上元。
"""
from __future__ import annotations

from .calendar import SIXTY_DAYS
from .taiyi_hour_v86 import YIN_SOURCE,audit_vol9_yin_conflict

# 均是同一《太乙金镜式经》四库全书卷九的转录/再展示，未核独立刻本。
SAME_TEXT_TRANSCRIPTIONS=(
    {"label":"维基文库·四库全书本卷九",
     "url":"https://zh.wikisource.org/zh-hans/太乙金鏡式經_(四庫全書本)/卷09",
     "edition_family":"四库全书本","has_independent_manuscript_proof":False},
    {"label":"中国哲学书电子化计划·卷九",
     "url":"https://ctext.org/wiki.pl?chapter=435698&if=en",
     "edition_family":"四库全书本","has_independent_manuscript_proof":False},
    {"label":"知命书院·卷九转录",
     "url":"https://shuyuan.zhiming.life/read/太乙金镜式经/13",
     "edition_family":"四库全书本","has_independent_manuscript_proof":False},
)
CONSTRAINT_NAMES=("six_ji_number","ju","hour_ganzhi_from_jiazi_start")
EXPECTED_PAIRS=(
    ("six_ji_number","ju",124,"hour_ganzhi_from_jiazi_start"),
    ("six_ji_number","hour_ganzhi_from_jiazi_start",172,"ju"),
    ("ju","hour_ganzhi_from_jiazi_start",52,"six_ji_number"),
)

def _plain_hour_labels(n:int)->dict:
    """只依同余索引独立重算元纪/局/干支，不调用V78或V86排盘。"""
    if isinstance(n,bool) or not isinstance(n,int) or n<1:
        raise ValueError("V87 仅允许正整数积时")
    t=(n-1)%360
    return {"six_ji_number":t//60+1,"ju":t%72+1,
            "hour_ganzhi_from_jiazi_start":SIXTY_DAYS[t%60]}

def exhaustive_yin_source_congruence()->dict:
    ancient={k:YIN_SOURCE[k] for k in CONSTRAINT_NAMES}
    values={k:[] for k in CONSTRAINT_NAMES}
    triple=[]
    for n in range(1,361):
        actual=_plain_hour_labels(n)
        hit=[k for k in CONSTRAINT_NAMES if actual[k]==ancient[k]]
        for k in hit:
            values[k].append(n)
        if len(hit)==3:
            triple.append(n)
    pairs=[]
    for left,right,only_count,contradictory in EXPECTED_PAIRS:
        indices=sorted(set(values[left]).intersection(values[right]))
        if indices!=[only_count]:
            raise ValueError("V87 六纪/72局/甲子循环的两项交集意外变化")
        labels=_plain_hour_labels(only_count)
        if labels[contradictory]==ancient[contradictory]:
            raise ValueError("V87 相容的两个条件不得误称同时满足第三条件")
        pairs.append({
            "constraints":[left,right],"matching_hours":indices,
            "candidate_hour":only_count,"conflicting_field":contradictory,
            "source_value":ancient[contradictory],
            "calculated_value":labels[contradictory],
            "all_three_source_constraints_matched":False,
            "not_a_preferred_emendation":True,
        })
    if triple or [len(values[k]) for k in CONSTRAINT_NAMES]!=[60,5,6]:
        raise ValueError("V87 360时全周穷举出现原典三条件全合或周期不封闭")
    old=audit_vol9_yin_conflict()
    by_hour={x["in_cycle_360"]:x for x in old["hypotheses"]}
    for pair in pairs:
        n=pair["candidate_hour"]
        if n not in by_hour or by_hour[n]["source_field_matches"][pair["conflicting_field"]]:
            raise ValueError("V87 原典冲突必须与V86逐宫盘的不符字段对应")
    return {
        "version":"V87","status":"three_way_congruence_impossible_within_360_hour_cycle",
        "source_reading":ancient,"period_hours":360,
        "constraint_match_counts":{k:len(v) for k,v in values.items()},
        "matching_hours_by_constraint":values,
        "pairwise_intersections":pairs,
        "triple_intersection":triple,
        "same_edition_transcriptions":list(SAME_TEXT_TRANSCRIPTIONS),
        "transcriptions_agree_on_literal_reading":True,
        "independent_printed_variant_verified":False,
        "historical_error_location_identified":False,
        "may_emend_text_from_modular_math":False,
        "modern_qiying_epoch_identified":False,
        "cannot_relabel_any_pair_as_complete_witness":True,
        "reason":"360=最小公倍数(72,60)，三项同余不可同时满足；同源转录不能证明真实异本",
        "preferred_correction":None,"fortune_verdict":None,
    }

def decorate_taiyi_v87(chart:dict)->dict:
    if (chart.get("version")!="V77" or
        chart.get("hour_source_review_version")!="V86" or
        chart.get("qiying_phase_review_version")!="V85" or
        chart.get("hour_v86_classical_examples",{}).get("yin_source_conflict",{}).get("preferred_interpretation") is not None):
        raise ValueError("V87 只能继续V86未选定阴遁原典冲突的原始时计盘")
    qi=chart["hour_v84_qiying_plate"]["qiying"]
    if (qi["qiying_wenchang"] is not None or qi["qiying_shiji"] is not None or
        qi["qiying_main_general"]["palace"] is not None or
        qi["qiying_guest_general"]["palace"] is not None):
        raise ValueError("V87 不得将历史纪局同余解移植为当代气应主客")
    result=exhaustive_yin_source_congruence()
    chart["hour_v87_modular_source_audit"]=result
    chart["hour_source_review_version"]="V87"
    chart["has_full_hour_chart"]=False
    chart["warnings"].append(
        "V87 完整360时同余穷举证实《金镜式经》卷九阴遁第三纪52局乙卯三项无法同真；"
        "三份数字转录均属同一四库全书本，尚无独立异本证据，不对古籍擅自改字。"
        "现代气应文昌、始击、主客将及绝对上元仍待证。")
    return chart
