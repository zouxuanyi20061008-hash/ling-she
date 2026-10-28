"""V80 时计合神、定计目、逐宫定算与八门直使。

古籍《太乙金钥匙·续集》庚戌时原文：
合神卯高丛、定计目大神(巳间辰)、列出的加数1+2+7+6+1+8+3+4；
原文却称「计算三十三」并据此定大将三、参将九。
实际逐项为 **32**，与原文33冲突。算法绝不偷偷调和；
遇该同构盘计作 source_conflict，完整算轨和原文两值分别列示，
不把任何一方标成唯一认证的时计定计大参将。

时计八门：阳遁「开、生、惊、休」；阴遁「杜、死、伤、景」；
一门30时，四门120时一周；庚戌时甲戌子起47时，生门第17时。
本轮求值使与其可定位的定计目锚位，不伪造八门完整飞宫排列。

代码复用岁计 V67 的通用十六神六合映射/旋宫和 V65 逐位投算，
但仅输入 V78 时计干支、元局与 V79 时计文昌；不输入岁计积年。
"""
from __future__ import annotations

from .taiyi_v65 import DIRECTIONS,GODS,INDEX,GONG,_count_result
from .taiyi_v67 import SIX_HARMONY,locate_dingji_eye,_middle_general_status
from .taiyi_hour_v78 import classical_hour_ju
from .taiyi_hour_v79 import calculate_hour_main_guest

PRIMARY="https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkylq3yn8"
METHOD="https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkvlnkx7u"
DOORS={"阳遁":("开","生","惊","休"),"阴遁":("杜","死","伤","景")}
WITNESS_887={
    "accumulated_hours":887,"short_count_from_jiaxu":47,"dun":"阳遁",
    "hour_ganzhi":"庚戌","hour_branch":"戌","harmony_branch":"卯",
    "harmony_god":"高丛","dingji_eye":"巳","dingji_god":"大神",
    "listed_contributions":[1,2,7,6,1,8,3,4],
    "listed_sum":32,"printed_count":33,
    "printed_main_general":3,"printed_assistant_general":9,
    "printed_door":"生","printed_hours_in_door":17,
    "source":PRIMARY,
}

def hour_door_chief(hour_count:int,dun:str)->dict:
    if isinstance(hour_count,bool) or not isinstance(hour_count,int) or hour_count<=0:
        raise ValueError("V80 八门时计必须为正整数时实")
    if dun not in DOORS:
        raise ValueError("V80 时计八门仅支持阴阳遁")
    position=(hour_count-1)%120
    door=DOORS[dun][position//30]
    return {
        "version":"V80","status":"computed",
        "chief_door":door,"sequence":list(DOORS[dun]),
        "index_in_four":position//30+1,
        "hour_in_door":position%30+1,
        "hour_in_120":position+1,
        "completed_120_circuits":(hour_count-1)//120,
        "remaining_hours_until_change":30-(position%30+1),
        "hour_count":hour_count,"dun":dun,
        "basis":"《太乙金钥匙》时计二至阴阳各四值使，一门三十时，百二十时一周",
        "does_not_assign_all_eight_palaces":True,"source":METHOD,
    }

def _source_conflict(count:int,dun:str,branch:str,eye:dict,calc:dict)->dict|None:
    """Compare ancient text without making its 33 a magical extra unit."""
    if ((count-1)%360)!=(887-1)%360 or dun!="阳遁":
        return None
    # 逐宫保留零项以供溯源；原典只抄入真正加数的八项。
    actual=[row["added"] for row in calc["trace"] if row["added"]>0]
    reference=WITNESS_887
    if (branch!="戌" or eye["dingji_ground_direction"]!="巳" or
        eye["dingji_ground_god"]!="大神" or
        actual!=reference["listed_contributions"]):
        raise ValueError("V80 庚戌时同构原例算轨不符；不得以原文33覆盖错误")
    if sum(actual)!=reference["listed_sum"] or sum(actual)==reference["printed_count"]:
        raise ValueError("V80 原例定算原文与逐宫算术分歧消失，必须重新复核")
    return {
        "status":"unresolved_printed_vs_arithmetic",
        "source":PRIMARY,
        "witness_hour":"嘉靖四十年辛酉十二月庚戌时",
        "actual_listed_addends":actual,"listed_sum":sum(actual),
        "printed_total":reference["printed_count"],
        "difference":reference["printed_count"]-sum(actual),
        "printed_big_general":reference["printed_main_general"],
        "printed_assistant_general":reference["printed_assistant_general"],
        "do_not_invent_extra_count":True,
        "do_not_auto_pick_a_general":True,
        "not_same_historical_datetime_for_modern_equal_cycle":True,
        "reason":"古籍逐项列数计32，正文另写33；未经独立异本解决，定算大参不得只择其一",
    }

def hour_harmony_dingji(classical:dict,main_guest:dict)->dict:
    if not isinstance(classical,dict) or not classical.get("has_cycle_360_72"):
        raise ValueError("V80 合神定计只能接V78真实时计元局")
    count=classical.get("accumulated_hours")
    dun=classical.get("time_wenchang",{}).get("dun")
    verified=classical_hour_ju(count,dun)
    for k in ("time_jishen","ju","hour_ganzhi_from_jiazi_start","five_yuan_name"):
        if classical.get(k)!=verified[k]:
            raise ValueError("V80 时计历元或时柱不一致，禁止求定计")
    if classical.get("taiyi_palace")!=verified["taiyi_palace"]:
        raise ValueError("V80 实际太乙宫与元局推演不一致")
    w=verified["time_wenchang"]
    if not isinstance(main_guest,dict) or main_guest.get("version")!="V79":
        raise ValueError("V80 缺失经V79确认的始击主客基础")
    confirm=calculate_hour_main_guest(classical)
    for k in ("accumulated_hours","ju","taiyi_palace","jishen","status"):
        if main_guest.get(k)!=confirm[k]:
            raise ValueError("V80 不能改写V79实际时计始击主客计算结果")
    if main_guest.get("heaven_eye_wenchang",{}).get("index")!=w["index"]:
        raise ValueError("V80 文昌盘与V79前置数据不符")
    branch=verified["hour_ganzhi_from_jiazi_start"][1]
    if branch not in SIX_HARMONY:
        raise ValueError("V80 时支六合无合法映射")
    joined=SIX_HARMONY[branch]
    eye=locate_dingji_eye(branch,w["index"])
    if eye["harmony_branch"]!=joined:
        raise ValueError("V80 时支合神与六合旋宫不符")
    n=verified["taiyi_palace"]["number"]
    calc=_count_result({"index":eye["dingji_ground_index"]},n)
    conflict=_source_conflict(count,dun,branch,eye,calc) if calc["status"]=="computed" else None
    state=("source_conflict" if conflict else calc["status"])
    if calc["status"]=="computed":
        if sum(p["added"] for p in calc["trace"])!=calc["count"]:
            raise ValueError("V80 定算逐宫总数与轨迹不一致")
        if any(p["direction"]==calc["stop_direction"] for p in calc["trace"]):
            raise ValueError("V80 不可将太乙本宫纳入定算")
    else:
        if calc["count"] is not None or not calc["same_palace_as_taiyi"]:
            raise ValueError("V80 时计同宫未决必须保持空计数")
    eye_position={
        "index":eye["dingji_ground_index"],
        "direction":eye["dingji_ground_direction"],
        "god":eye["dingji_ground_god"],
        "palace":GONG.get(eye["dingji_ground_direction"]),
        "is_intermediate":eye["dingji_ground_direction"] not in GONG,
    }
    return {
        "version":"V80","status":state,
        "hour_ganzhi":verified["hour_ganzhi_from_jiazi_start"],
        "hour_branch":branch,
        "harmony":{"branch":joined,"direction":joined,
                   "god":GODS[INDEX[joined]],"index":INDEX[joined],
                   "palace":GONG.get(joined),"hour_branch":branch,
                   "source":PRIMARY},
        "dingji_eye":eye_position,
        "formula":"合神加占时支，文昌下临地神为定计目，再顺数正宫到太乙前止",
        "rotation":{
            "hour_branch":branch,"harmony_branch":joined,
            "harmony_sky_index":eye["harmony_sky_index"],
            "hour_ground_index":eye["year_ground_index"],
            "wenchang_sky_index":eye["wenchang_sky_index"],
            "ground_index":eye["dingji_ground_index"],
            "rotated_sixteen":eye["rotated_sixteen"],
            "is_annual_time_source":False,
        },
        "source_calc_status":calc["status"],
        "computed_trace":calc["trace"],
        "computed_trace_sum":calc["count"],
        "count":None if conflict else calc["count"],
        "main_general":None if conflict else calc["main_general"],
        "assistant_general":None if conflict else calc["assistant_general"],
        "unadopted_arithmetic_candidate":(
            {"count":calc["count"],"main_general":calc["main_general"],
             "assistant_general":calc["assistant_general"]}
            if conflict else None),
        "source_disagreement":conflict,
        "big_general_state":_middle_general_status(
            {"main_general":None if conflict else calc["main_general"]},"main_general"),
        "assistant_general_state":_middle_general_status(
            {"assistant_general":None if conflict else calc["assistant_general"]},"assistant_general"),
        "same_palace_conservative":calc["status"]=="pending",
        "has_verified_unique_dingji":state=="computed",
        "reason":(
            conflict["reason"] if conflict else
            calc.get("reason") if state=="pending" else
            "定计目按时支六合旋宫，沿十六神逐宫累数，未遇古籍数字矛盾"
        ),
        "sources":{"classical":PRIMARY,"rule":METHOD},
        "fortune_verdict":None,
    }

def decorate_taiyi_v80(chart:dict)->dict:
    if (chart.get("version")!="V77" or
        chart.get("historical_ju_version")!="V78" or
        chart.get("main_guest_version")!="V79"):
        raise ValueError("V80 必须在V77→V78→V79真实时计盘后执行")
    classic=chart.get("classical_jiazi_hour_v78")
    main=chart.get("hour_main_guest_v79")
    if (not isinstance(classic,dict) or
        classic.get("is_absolute_upper_jiazi_epoch") is not False):
        raise ValueError("V80 不能把简捷积时冒充绝对上元积时")
    calc=hour_harmony_dingji(classic,main)
    gate=hour_door_chief(classic["accumulated_hours"],main["dun"])
    ancient=None
    if ((classic["accumulated_hours"]-1)%360)==(887-1)%360 and main["dun"]=="阳遁":
        if (calc["harmony"]["god"],calc["dingji_eye"]["god"],
            gate["chief_door"],gate["hour_in_door"])!=("高丛","大神","生",17):
            raise ValueError("V80 庚戌古籍合神/定目/生门直使例不吻合")
        ancient={
           "status":"partially_verified_textual_conflict_on_dingji_total",
           "witness":WITNESS_887,
           "actual_harmony":calc["harmony"]["god"],
           "actual_dingji_eye":calc["dingji_eye"]["god"],
           "actual_chief_door":gate["chief_door"],
           "actual_hour_in_door":gate["hour_in_door"],
           "actual_dingji_trace_sum":calc["computed_trace_sum"],
           "printed_dingji_count":WITNESS_887["printed_count"],
           "no_silent_reconciliation":True,
        }
    # Before first calculating V80 none of these sources were used as annual values.
    chart["hour_dingji_v80"]=calc
    chart["hour_eight_doors_v80"]={
       **gate,"chief_door_anchored_at_dingji_eye":calc["dingji_eye"],
       "all_eight_doors_placed":False,
       "historical_47_shortcut_from_jiaxu":{
         "source":PRIMARY,"ancient_count":47,
         "independent_chief":"生",
         "gate_from_47":hour_door_chief(47,"阳遁")["chief_door"],
         "not_a_wenchang_epoch":True},
    }
    chart["hour_v80_historical_audit"]=ancient
    chart["has_hour_harmony"]=True
    chart["has_hour_dingji_eye"]=True
    chart["has_hour_dingji"]=calc["has_verified_unique_dingji"]
    chart["has_hour_door_chief"]=True
    chart["has_all_hour_eight_door_positions"]=False
    chart["has_full_hour_chart"]=False
    chart["classical_hour_extension_version"]="V80"
    chart["warnings"].append(
        "V80 时支六合、定计目与四门轮值可实算；原典庚戌时列数合32却写33，"
        "该同构局定计大参不自动取一边，其他同宫照旧待判；八门全飞布未验。")
    from .taiyi_hour_v81 import decorate_taiyi_v81
    return decorate_taiyi_v81(chart)
