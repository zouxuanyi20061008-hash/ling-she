"""V60 大六壬昴星、别责、八专与涉害实际地盘落宫审计。

Only count unique 四课 after converting day-stem lower to its real lodge.
Sources: 《六壬大全》卷七、《大六壬金铰剪》.
涉害逐宫计害深浅和孟仲季流派次序未达到独立验收，保持 pending。
"""
from __future__ import annotations
from .calendar import BRANCHES,STEMS
from .liuren import LODGES
from .liuren_v59 import _triple,BRANCH_INDEX,THREE_PART

SOURCE="https://zh.wikisource.org/wiki/%E5%85%AD%E5%A3%AC%E5%A4%A7%E5%85%A8/7"
SECONDARY="https://libokang.com/classics/liuren/%E5%A4%A7%E5%85%AD%E5%A3%AC%E9%87%91%E9%93%B0%E5%89%AA/"
COMBINATIONS={"甲":"己","己":"甲","乙":"庚","庚":"乙",
              "丙":"辛","辛":"丙","丁":"壬","壬":"丁",
              "戊":"癸","癸":"戊"}
TRINES=(("申","子","辰"),("寅","午","戌"),
        ("巳","酉","丑"),("亥","卯","未"))
NEXT_TRINE={group[i]:group[(i+1)%3] for group in TRINES for i in range(3)}


def lesson_audit(lessons:list[dict])->dict:
    if len(lessons)!=4:raise ValueError("V60 必须有四课")
    pairs=[]
    for p in lessons:
        ground=LODGES.get(p["lower"],p["lower"])
        if ground not in BRANCHES or p["upper"] not in BRANCHES:
            raise ValueError("V60 四课干寄宫、地支无效")
        pairs.append((ground,p["upper"]))
    unique=list(dict.fromkeys(pairs))
    return {
        "distinct_lesson_count":len(unique),
        "original_logical_pairs":[{"ground":g,"heaven":h} for g,h in pairs],
        "unique_pairs":[{"ground":g,"heaven":h,
                         "from_original_lessons":[i+1 for i,x in enumerate(pairs) if x==(g,h)]}
                        for g,h in unique],
        "first_stem_mapped_to_lodge":True,
        "meaning":"日干的下神按寄宫归地盘；只有完全相同的地盘/天盘成一课",
    }


def _maoxing(day,plate,lessons,audit):
    yang=STEMS.index(day[0])%2==0
    ground_below_you=next(g for g in BRANCHES if plate[g]=="酉")
    first=plate["酉"] if yang else ground_below_you
    middle=lessons[2]["upper"] if yang else lessons[0]["upper"]
    last=lessons[0]["upper"] if yang else lessons[2]["upper"]
    method=("昴星·阳日虎视转蓬（地酉上神）" if yang
            else "昴星·阴日冬蛇掩目（天酉下神）")
    return _triple(first,middle,last,method,[first],SOURCE,{
        **audit,"source_condition":"四课全备、无直接贼克、无遥克",
        "you_heaven_above_earth":plate["酉"],
        "you_earth_beneath_heaven":ground_below_you,
        "middle_from":"支上神" if yang else "干上神",
        "last_from":"干上神" if yang else "支上神",
    })


def _bieze(day,plate,lessons,audit):
    yang=STEMS.index(day[0])%2==0
    if yang:
        combined=COMBINATIONS[day[0]]
        lodge=LODGES[combined]
        first=plate[lodge]
        selected={"combined_stem":combined,"combined_stem_lodge":lodge,
                  "heaven_over_combined_lodge":first}
        method="别责·刚日合干寄宫上神"
    else:
        first=NEXT_TRINE[day[1]]
        selected={"three_harmony_next_branch":first,
                  "take_direct_branch_not_upper_of_branch":True}
        method="别责·柔日支前三合"
    return _triple(first,lessons[0]["upper"],lessons[0]["upper"],
        method,[first],SOURCE,{
          **audit,"source_condition":"四课合成三课、无直接贼克、无遥克",
          "selection":selected,"middle_and_last":"干上神"})


def _bazhuan(day,lessons,audit):
    yang=STEMS.index(day[0])%2==0
    origin=lessons[0]["upper"] if yang else lessons[3]["upper"]
    first=BRANCHES[(BRANCH_INDEX[origin]+(2 if yang else -2))%12]
    return _triple(first,lessons[0]["upper"],lessons[0]["upper"],
        "八专·阳顺数三（干上）" if yang else "八专·阴逆数三（支阴）",
        [first],SOURCE,{
           **audit,"source_condition":"四课合成两课，无直接贼克，不取普通遥克",
           "counting_start":origin,"count_including_origin":3,
           "direction":"阳顺" if yang else "阴逆",
           "middle_and_last":"干上神"})


def _correct_shehai_ground(chart,audit):
    t=chart["three_transmissions"]
    evidence=t.get("rule_audit",{})
    details=evidence.get("candidate_details",[])
    if not details:return
    plate=chart["heaven_plate"]
    for item in details:
        b=item["upper"]
        actual_ground=next(g for g in BRANCHES if plate[g]==b)
        item["original_upper_branch_class"]=THREE_PART[b]
        item["actual_ground_palace"]=actual_ground
        item["actual_ground_class"]=THREE_PART[actual_ground]
        item["candidate_branch_class"]=THREE_PART[actual_ground]
        item["classification_basis"]="天盘上神下临的实际地盘宫"
        item["depth_verified"]=False
    evidence["uses_true_ground_palace"]=True
    evidence["depths_computed"]=False
    evidence["automatically_selected"]=False
    evidence["classification_corrected_in"]="V60"
    evidence["distinct_lesson_audit"]=audit


def decorate_liuren_v60(chart):
    if chart.get("version")!="V59" or not chart.get("has_real_plates_and_four_lessons"):
        raise ValueError("V60 需先真实 V59 天地盘和四课")
    lessons=chart["four_lessons"];plate=chart["heaven_plate"]
    if set(plate)!=set(BRANCHES) or set(plate.values())!=set(BRANCHES):
        raise ValueError("V60 十二宫不完整")
    audit=lesson_audit(lessons)
    count=audit["distinct_lesson_count"]
    original=chart["three_transmissions"]
    offset=chart["transmission_review"]["offset_palaces"]
    no_direct=all(x["relation"]=="无直接克" for x in lessons)
    selected=False
    if offset not in (0,6) and no_direct:
        # 八专不以遥克优先；原 V59 可能已经用遥克选错了两课。
        if count==2:
            chart["three_transmissions"]=_bazhuan(chart["day_ganzhi"],lessons,audit)
            selected=True
        elif (original["status"]=="pending"
              and original["method"].startswith("昴星/别责/八专")):
            if count==3:
                chart["three_transmissions"]=_bieze(chart["day_ganzhi"],plate,lessons,audit)
                selected=True
            elif count==4:
                chart["three_transmissions"]=_maoxing(chart["day_ganzhi"],plate,lessons,audit)
                selected=True
    _correct_shehai_ground(chart,audit)
    t=chart["three_transmissions"]
    if t["status"]=="pending" and t["transmissions"] is not None:
        raise ValueError("V60 待判课不能输出三传")
    if t["status"]=="computed" and len(t["transmissions"])!=3:
        raise ValueError("V60 已判课必须输出三传")
    review=chart["transmission_review"]
    chart["transmission_review"]={
        **review,"version":"V60",
        "status":t["status"],
        "method_family":t["method"].split("·")[0] if selected else review["method_family"],
        "distinct_lesson_audit":audit,
        "newly_implemented":["昴星虎视/冬蛇","别责阳刚/阴柔","八专阳顺/阴逆"],
        "shehai_ground_classification_fixed":True,
        "shehai_depths_verified":False,
        "pending_methods":["涉害逐宫计害深浅及流派次序"],
        "all_nine_method_families_have_cases":True,
        "all_nine_methods_fully_verified":False,
        "source_references":{**review["source_references"],
            "maoxing_bieze_bazhuan":SOURCE,"independent_text":SECONDARY},
    }
    chart["version"]="V60"
    chart["has_three_transmissions"]=t["status"]=="computed"
    chart["has_full_nine_methods"]=False
    chart["limits"]=[
        "昴星、别责、八专严格依实际两课/三课/四课与贼克遥克前置条件排布。",
        "涉害只列原课与候选下临地盘宫、孟仲季；逐宫涉害深浅与流派次序尚未完全校验。",
        "沿用 V58 贼克比用与 V59 遥克伏吟反吟已通过的规则；未决课式不强判。",
        "未完成贵人十二天将、神煞或命运吉凶应期。",
    ]
    return chart
