"""V54 factual Qimen three-wonder grave & six-armor patterns, with named variants.

Sources distinguish classic six-jia instrument overlays from alternative
same-palace chief-door readings. Do NOT combine them or infer good/bad luck.

Historically crosschecked 《遁甲演义·三奇入墓》 and 《奇门遁甲统宗·奇门四十格》.
"""
from __future__ import annotations
from .qimen_rotation import OUTER_RING
from .qimen import INSTRUMENTS
from .qimen_patterns import CLASSIC

BURIAL_RULES={
    "乙":(2,"坤二","未","日奇"),
    "丙":(6,"乾六","戌","月奇"),
    "丁":(8,"艮八","丑","星奇"),
}
# 六甲藏于六仪：甲戌己 / 甲午辛；甲子戊 / 甲申庚；
# 甲辰壬 / 甲寅癸。《奇门遁甲统宗》“三奇得使”。
CLASSICAL_INSTRUMENTS={
    "乙":{"己":"甲戌","辛":"甲午"},
    "丙":{"戊":"甲子","庚":"甲申"},
    "丁":{"壬":"甲辰","癸":"甲寅"},
}
AUSPICIOUS_DOORS=("开门","休门","生门")
CLASSIC_BURIAL_REF="https://www.shidianguji.com/book/SK1616/chapter/1l9lopdno0utc"
CLASSIC_SIX_REF="https://zh.wikisource.org/zh/奇門遁甲統宗"
VARIANTS_REF="https://www.qimenpai.com/blog/1662"
DOOR_CONDITION_REF="https://libokang.com/classics/qimen/奇门法窍/"


def classify_wonder(sky:str,earth:str,palace:int,gate:str,
                    duty_gate:str,duty_display_palace:int)->dict:
    """Pure, independent comparison that can be exercised against primary fixtures."""
    if sky not in INSTRUMENTS or earth not in INSTRUMENTS:
        raise ValueError("V54 三奇判据必须取真实天地盘三奇六仪")
    if palace not in OUTER_RING or duty_display_palace not in OUTER_RING:
        raise ValueError("V54 三奇判据不得把中五寄宫当独立八门")
    if not isinstance(gate,str) or not gate.endswith("门") or not duty_gate.endswith("门"):
        raise ValueError("V54 需要真实八门和值使门")
    rule=BURIAL_RULES.get(sky)
    burial=bool(rule and palace==rule[0])
    classic_xun=CLASSICAL_INSTRUMENTS.get(sky,{}).get(earth)
    door_overlap=sky in CLASSICAL_INSTRUMENTS and palace==duty_display_palace and gate==duty_gate
    good_duty_gate=door_overlap and gate in AUSPICIOUS_DOORS
    candidates=[]
    if burial:
        candidates.append({
            "id":"three_wonders_burial","title":"三奇入墓",
            "rule_version":"遁甲演义王璋三奇临宫口径",
            "evidence":f"{rule[3]}{sky}奇临{rule[1]}（{rule[2]}方）",
            "source":CLASSIC_BURIAL_REF,
        })
    if classic_xun:
        candidates.append({
            "id":"three_wonders_de_shi_six_jia",
            "title":"三奇得使 · 古籍六甲遁仪条件",
            "rule_version":"奇门遁甲统宗六甲遁仪口径",
            "evidence":f"天盘{sky}加地盘{earth}（遁{classic_xun}）",
            "source":CLASSIC_SIX_REF,
        })
    if door_overlap:
        candidates.append({
            "id":"three_wonders_meets_chief_door",
            "title":"三奇遇值使门 · 另一口径",
            "rule_version":"三奇与值使门同宫口径；不与古籍六甲式合并",
            "evidence":f"天盘{sky}与值使{gate}同在{palace}宫",
            "source":VARIANTS_REF,
        })
        if good_duty_gate:
            candidates.append({
                "id":"three_wonders_meets_auspicious_chief_door",
                "title":"三奇遇开休生值使门 · 严格门条件",
                "rule_version":"奇门法窍得奇得吉值使门口径",
                "evidence":f"天盘{sky}、值使{gate}同在{palace}宫；值使为开休生之一",
                "source":DOOR_CONDITION_REF,
            })
    return {
        "palace":palace,"sky_stem":sky,"earth_stem":earth,
        "gate":gate,"duty_gate":duty_gate,
        "burial":burial,"burial_grave_branch":rule[2] if burial else None,
        "classical_six_jia_instrument":classic_xun,
        "classical_six_jia_de_shi":bool(classic_xun),
        "alternative_chief_door_overlap":door_overlap,
        "strict_good_chief_door_overlap":good_duty_gate,
        "classical_and_alternative_disagree":bool(classic_xun)!=door_overlap,
        "candidates":[{
            **item,"observed":True,
            "actual_strength":None,"effective":None,"fortune_verdict":None,
        } for item in candidates],
        "fortune_verdict":None,"time_verdict":None,
    }


def decorate_qimen_v54(chart:dict)->dict:
    if chart.get("version")!="V53" or not chart.get("has_ten_stem_lookup"):
        raise ValueError("V54 需通过 V53 十干克应及完整星门校验")
    rows={p["number"]:p for p in chart["palaces"]}
    if set(rows)!=set(range(1,10)) or len(chart["palaces"])!=9:
        raise ValueError("V54 九宫缺失或重号")
    duty=chart["duty_origin"]
    duty_position=duty["rotated_door_display_palace"]
    value_gate=duty["origin_door"]
    if duty_position not in OUTER_RING or rows[duty_position]["actual_gate"]!=value_gate:
        raise ValueError("V54 值使实际落宫及值使门名称不匹配")
    summary={"burial":[],"classical":[],"alternative":[],"strict":[],"disagreement":[]}
    for n in OUTER_RING:
        p=rows[n]
        if not p.get("ten_stem_response") or not p.get("actual_gate"):
            raise ValueError("V54 不可用模拟的固定八门/十干克应")
        if (p["ten_stem_response"]["sky_stem"]!=p["sky_stem"] or
            p["ten_stem_response"]["earth_stem"]!=p["earth_stem"]):
            raise ValueError("V54 天地干与 V53 来源不一致")
        item=classify_wonder(p["sky_stem"],p["earth_stem"],n,
                             p["actual_gate"],value_gate,duty_position)
        p["wonder_rule_review"]=item
        for key,field in [
            ("burial","burial"),("classical","classical_six_jia_de_shi"),
            ("alternative","alternative_chief_door_overlap"),
            ("strict","strict_good_chief_door_overlap"),
            ("disagreement","classical_and_alternative_disagree"),
        ]:
            if item[field]:
                summary[key].append(n)
    rows[5]["wonder_rule_review"]=None
    chart["wonder_rule_review"]={
        "version":"V54",
        "sources":{
            "burial":CLASSIC_BURIAL_REF,
            "six_jia":CLASSIC_SIX_REF,
            "alternative":VARIANTS_REF,
            "strict_chief_door":DOOR_CONDITION_REF,
        },
        "burial_positions":summary["burial"],
        "classical_six_jia_positions":summary["classical"],
        "chief_door_overlap_positions":summary["alternative"],
        "strict_good_chief_door_positions":summary["strict"],
        "interpretation_disagreements":summary["disagreement"],
        "rule_conflation_forbidden":True,
        "fixture_source":"遁甲演义、奇门遁甲统宗独立表与既有 V51 公共整盘",
        "dark_stem_used_in_patterns":False,
        "real_effectiveness_computed":False,
        "actual_fortune_verdict":None,"actual_timing_verdict":None,
        "note":"三奇入墓按乙临坤二、丙临乾六、丁临艮八；三奇得使的六甲遁仪与值使门同宫分开列条件，不能偷换或等同吉凶。",
    }
    chart["version"]="V54"
    chart["state"]="verified_qimen_structural_wonder_rules_and_explicit_variants"
    chart["has_three_wonders_grave_check"]=True
    chart["has_classical_three_wonders_de_shi"]=True
    chart["has_alternative_chief_door_wonder_check"]=True
    chart["has_complete_rotating_plate"]=False
    chart["has_final_divination"]=False
    chart["fortune_conclusion"]=None
    chart["limitations"]=[
        *chart.get("limitations",[]),
        "V54 三奇入墓、三奇得使按独立古籍宫位/遁仪规则识别；现代值使门同宫和开休生门口径明确分栏。",
        "同宫只代表传统几何条件，未裁决实际吉凶、旺衰、应期或流派标准。",
        "暗干仅沿用 V53 的注明流派试算，尚无与所选起法完全一致的古籍九宫真值，绝不作为格局判据。",
    ]
    return chart
