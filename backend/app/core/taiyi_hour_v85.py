"""V85 太乙时计：金镜式经阴遁壬子元27局独立真例，及气应天目六纪相位候选。

《太乙金镜式经》卷一载阴遁第六纪壬子元二十七局，太乙九宫、
大武天目、计神午，主算29，主大将9/主参将7，
始击高丛、客算4，客大将4/客参将2。
这份独立例盘按一周360数重建为第315算，绝不将局内27冒充
积时27（后者时柱及元纪不同），亦不把古例冒充今日气应排盘。

同卷另载张良六纪天目起点（阳武德、地主、大炅；阴吕申、
大威、阴德，三相重复），但王希明明确批评每次二至均假定
甲子纪首。气应派可在假设「气应第一时恰从某纪首」下计算
三组天目/始击/主客将条件结果；未知实际纪首，不能任选一套
作为今日实盘。V84真实太乙/计神/直使完全不受影响。
"""
from __future__ import annotations

from .taiyi_hour_v78 import classical_hour_ju,hour_wenchang_from_count
from .taiyi_hour_v79 import calculate_hour_main_guest
from .taiyi_hour_v84 import qiying_hour_core
from .taiyi_v65 import _count_result,shiji_from_wenchang,DIRECTIONS,GODS,INDEX,GONG

SOURCE_JING="https://zh.wikisource.org/zh-hans/太乙金鏡式經_(四庫全書本)/卷01"
SOURCE_JING_ALT="https://www.shidianguji.com/zh/book/SK1615/chapter/1l9lir739jmyy"
YIN_315={
 "description":"《太乙金镜式经》卷一·立冬庚申日戊寅时之第六纪壬子元27局",
 "dun":"阴遁","six_ji_number":6,"five_yuan_name":"壬子元","ju":27,
 "in_cycle_360":315,"hour_ganzhi_from_jiazi_start":"戊寅",
 "taiyi_palace":9,"wenchang_god":"大武","wenchang_direction":"坤",
 "jishen":"午","shiji_god":"高丛","shiji_direction":"卯",
 "main_count":29,"guest_count":4,
 "main_general":9,"main_assistant":7,
 "guest_general":4,"guest_assistant":2,
 "source":SOURCE_JING,
}
JI_SEEDS={
 "阳遁":("武德","地主","大炅"),
 "阴遁":("吕申","大威","阴德"),
}

# 《太乙金镜式经》卷一张良旧六纪逐纪独立真值：太乙宫与计神起支。
# 旧法甲子纪首并非王希明「每次二至气应」的现代已证纪首。
HISTORICAL_JI_ORIGINS={
    "阳遁":{"taiyi_palaces":(1,6,1,6,1,6),"jishen":"寅"},
    "阴遁":{"taiyi_palaces":(9,4,9,4,9,4),"jishen":"申"},
}

def independent_historical_six_ji_starts(dun:str)->dict:
    """按历史六纪原文核对逐纪太乙/文昌/计神，不用作现代气应盘。"""
    if dun not in HISTORICAL_JI_ORIGINS:
        raise ValueError("V85 六纪原典验收仅支持阴阳遁")
    original=HISTORICAL_JI_ORIGINS[dun]
    rows=[]
    for i in range(6):
        count=60*i+1
        c=classical_hour_ju(count,dun)
        taiyi=c["taiyi_palace"]["number"]
        eye=c["time_wenchang"]["god"]
        jishen=c["time_jishen"]
        if (c["six_ji_number"]!=i+1 or c["in_cycle_360"]!=count or
            taiyi!=original["taiyi_palaces"][i] or
            eye!=JI_SEEDS[dun][i%3] or jishen!=original["jishen"]):
            raise ValueError("V85 金镜式经旧六纪起宫天目计神真值不符")
        rows.append({
            "ji_number":i+1,"first_hour_in_360":count,
            "taiyi_palace":taiyi,"wenchang_god":eye,"jishen":jishen,
            "source":SOURCE_JING,"is_modern_qiying_initial_hour":False,
        })
    return {
        "status":"verified_historical_zhangliang_six_ji_starts",
        "dun":dun,"rows":rows,"source":SOURCE_JING,
        "modern_solstice_ji_phase_verified":False,
        "may_be_used_as_modern_qiying_anchor":False,
    }

def independent_yin_315_witness()->dict:
    """真正以阴遁积数315校验，不把古例常量输入计算过程。"""
    c=classical_hour_ju(315,"阴遁")
    m=calculate_hour_main_guest(c)
    actual={
       "dun":"阴遁","six_ji_number":c["six_ji_number"],
       "five_yuan_name":c["five_yuan_name"],"ju":c["ju"],
       "in_cycle_360":c["in_cycle_360"],
       "hour_ganzhi_from_jiazi_start":c["hour_ganzhi_from_jiazi_start"],
       "taiyi_palace":c["taiyi_palace"]["number"],
       "wenchang_god":c["time_wenchang"]["god"],
       "wenchang_direction":c["time_wenchang"]["direction"],
       "jishen":c["time_jishen"],
       "shiji_god":m["earth_eye_shiji"]["god"],
       "shiji_direction":m["earth_eye_shiji"]["direction"],
       "main_count":m["main_calculated"],"guest_count":m["guest_calculated"],
       "main_general":m["main_general"],"main_assistant":m["main_assistant"],
       "guest_general":m["guest_general"],"guest_assistant":m["guest_assistant"],
    }
    expected={k:YIN_315[k] for k in actual}
    if actual!=expected:
        raise ValueError("V85 金镜式经阴遁第六纪壬子元27局全盘原典真值校验失败")
    if m["main"]["status"]!="computed" or m["guest"]["status"]!="computed":
        raise ValueError("V85 原典独立阴遁主客将不应是同宫待判")
    if (sum(t["added"] for t in m["main"]["trace"])!=29 or
        sum(t["added"] for t in m["guest"]["trace"])!=4):
        raise ValueError("V85 阴遁29/4逐宫算与原典不符")
    return {
       "version":"V85","status":"verified_independent_yin_315_witness",
       "source":SOURCE_JING,"source_other_version":SOURCE_JING_ALT,
       "expected":expected,"actual":actual,
       "main_trace":m["main"]["trace"],"guest_trace":m["guest"]["trace"],
       "not_a_modern_solstice_clock_anchor":True,
       "local_ju_27_must_not_be_used_as_total_315":True,
       "does_not_confirm_a_unique_modern_qiying_wenchang":True,
    }

def three_historical_ji_phase_hypotheses(relative_hours:int,dun:str,term:str)->dict:
    """纪首假设的三相：不是已证现代二至天目，不是所有历元偏移穷举。"""
    qi=qiying_hour_core(relative_hours,dun,term)
    seeds=JI_SEEDS.get(dun)
    if seeds is None:
        raise ValueError("V85 须有合法阴阳遁")
    palace=qi["taiyi_palace"]["number"]
    jishen=qi["jishen"]
    cases=[]
    for i,first in enumerate(seeds):
        # 古籍60时为一纪，文昌18位一周，跨纪移60使相位+6；
        # 三纪起点相位循环，1/4、2/5、3/6 分组。
        conditional_count=relative_hours+i*60
        wen=hour_wenchang_from_count(conditional_count,dun)
        first_at_ji=hour_wenchang_from_count(i*60+1,dun)
        if first_at_ji["god"]!=first:
            raise ValueError("V85 金镜式经六纪纪首天目与十八算循环冲突")
        shiji=shiji_from_wenchang(wen["index"],jishen)
        main=_count_result({"index":wen["index"]},palace)
        guest=_count_result(shiji,palace)
        status=("computed" if main["status"]==guest["status"]=="computed"
           else "partially_computed" if "computed" in (main["status"],guest["status"])
           else "pending")
        cases.append({
           "phase":i+1,"hypothetical_ji_numbers":[i+1,i+4],
           "first_eye_in_historical_ji":first,
           "conditional_hour_count":conditional_count,
           "conditional_60_hour_phase_offset":i*60,
           "wenchang":{"index":wen["index"],"direction":wen["direction"],
              "god":wen["god"],"palace":GONG.get(wen["direction"]),
              "count_in_18":wen["count_in_18"],"trace":wen["trace"]},
           "shiji":{"index":shiji["index"],"direction":shiji["direction"],
              "god":shiji["god"],"palace":shiji["palace"]},
           "jishen":jishen,"taiyi_palace":palace,
           "main":{"status":main["status"],"count":main["count"],
              "big_general":main["main_general"],
              "assistant_general":main["assistant_general"],"trace":main["trace"],
              "reason":main.get("reason")},
           "guest":{"status":guest["status"],"count":guest["count"],
              "big_general":guest["main_general"],
              "assistant_general":guest["assistant_general"],"trace":guest["trace"],
              "reason":guest.get("reason")},
           "status":status,
           "has_verified_qiying_phase_anchor":False,
           "does_not_prove_historical_main_guest_movement":True,
           "is_only_a_conditional_model":True,
        })
    if len({z["wenchang"]["index"] for z in cases})!=3:
        raise ValueError("V85 六纪三相天目必须互异")
    return {
       "version":"V85",
       "status":"historical_ji_seed_hypotheses_only",
       "dun":dun,"solstice_name":term,"relative_hours":relative_hours,
       "qiying_taiyi_palace":palace,"qiying_jishen":jishen,
       "historical_three_seeds":list(seeds),
       "historical_ji_origin_witness":independent_historical_six_ji_starts(dun),
       "six_ji_seed_cycle":{
          "ji_1":seeds[0],"ji_2":seeds[1],"ji_3":seeds[2],
          "ji_4":seeds[0],"ji_5":seeds[1],"ji_6":seeds[2]},
       "hypotheses":cases,"number_of_conditional_phases":3,
       "hypotheses_not_exhaustive_for_arbitrary_unknown_epoch_offset":True,
       "cannot_assign_modern_solstice_to_ji_1_2_or_3":True,
       "preferred_phase":None,
       "confirmed_qiying_wenchang":None,
       "confirmed_qiying_shiji":None,
       "confirmed_qiying_main_general":None,
       "confirmed_qiying_guest_general":None,
       "all_conditions_keep_original_qiying_taiyi_jishen":True,
       "six_ji_historical_seed_source":SOURCE_JING,
       "intermediate_gods_can_be_count_starts":True,
       "same_palace_without_attested_exception_kept_pending":True,
       "fortune_verdict":None,
    }

def decorate_taiyi_v85(chart:dict)->dict:
    if (chart.get("version")!="V77" or
        chart.get("qiying_plate_version")!="V84" or
        chart.get("hour_door_epoch_version")!="V83"):
        raise ValueError("V85 仅接真正V84二至气应派、且仍保留V83双起点")
    qi=chart["hour_v84_qiying_plate"]["qiying"]
    detail=three_historical_ji_phase_hypotheses(
        qi["relative_hours"],qi["dun"],qi["solstice_name"])
    if (detail["qiying_taiyi_palace"]!=qi["taiyi_palace"]["number"] or
        detail["qiying_jishen"]!=qi["jishen"] or
        detail["relative_hours"]!=chart["time_cycle"]["relative_time_count"]):
        raise ValueError("V85 六纪候选不能改写已证二至气应太乙与计神")
    if (qi["qiying_wenchang"] is not None or
        qi["qiying_shiji"] is not None or
        qi["qiying_main_general"]["palace"] is not None or
        qi["qiying_guest_general"]["palace"] is not None):
        raise ValueError("V85 不能篡改已明确待证的气应派文昌主客")
    chart["hour_v85_phase_hypotheses"]=detail
    chart["hour_v85_independent_yin_witness"]=independent_yin_315_witness()
    chart["qiying_phase_review_version"]="V85"
    chart["has_verified_qiying_main_guest"]=False
    chart["has_verified_qiying_wenchang"]=False
    chart["has_full_hour_chart"]=False
    chart["warnings"].append(
        "V85《金镜式经》阴遁第六纪壬子元27局已有独立主29客4整盘验收。"
        "另按六纪文昌三种起点计算气应派主客条件候选，但现代节气并非"
        "必从甲子纪首起，缺真实纪相位时不选择大将，不将候选冒充已认证时盘。")
    from .taiyi_hour_v86 import decorate_taiyi_v86
    return decorate_taiyi_v86(chart)
