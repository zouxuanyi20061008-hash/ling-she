"""V79 太乙时计始击、主客逐宫投算与大参将（简捷甲子历元口径）。

《太乙金钥匙·续集》庚戌时原典完整独立真值：
  戊子元阳遁23局、太乙巽九、文昌阴德、计神辰、
  始击武德、主算16、客算23、主大/参6/8、客大/参3/9。
计算须复用V65经过独立岁计验算的十六神起宫、旋转及正宫计数，
但所用起点必须是V78时计甲子前积时，绝非V67岁计积年。
始击以计神加艮和德，读取文昌下临神位。
遇文昌/始击与太乙同宫，当前时计严格沿V65保守待判；
V66岁计同宫《武备志》异派只展示来源，不自动用于时计。
"""
from __future__ import annotations

from .taiyi_v65 import (DIRECTIONS,GODS,INDEX,GONG,_position,
                         shiji_from_wenchang,_count_result)
from .taiyi_hour_v78 import classical_hour_ju

PRIMARY="https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkylq3yn8"
METHOD="https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkvlnkx7u"
JING="https://www.shidianguji.com/book/SK1615/chapter/1l9lir7w2mwii"

# Independently transcribed from the complete 嘉靖四十年庚戌時計式, never copied to generated counts.
ANCIENT_887={
 "hour_count":887,"dun":"阳遁","five_yuan_name":"戊子元","ju":23,
 "taiyi_palace":9,"wenchang_god":"阴德","wenchang_direction":"乾",
 "jishen":"辰","shiji_god":"武德","shiji_direction":"申",
 "main_count":16,"guest_count":23,
 "main_general":6,"main_assistant":8,
 "guest_general":3,"guest_assistant":9,
 "source":PRIMARY,
}

def _safe_side(eye:dict,taiyi:int,label:str)->dict:
    result=_count_result(eye,taiyi)
    if result["status"]=="computed":
        if result["count"]!=sum(x["added"] for x in result["trace"]):
            raise ValueError("V79 "+label+"算的逐宫轨迹和总数不符")
        if result["trace"][-1]["index"]==next(
            i for i,d in enumerate(DIRECTIONS) if GONG.get(d)==taiyi):
            raise ValueError("V79 不可把太乙本宫纳入主客算")
        if not 1<=result["main_general"]<=9 or not 1<=result["assistant_general"]<=9:
            raise ValueError("V79 大参将迁宫超出九宫")
    elif result["status"]!="pending" or result["count"] is not None:
        raise ValueError("V79 未确认同宫时不得产生虚构主客算")
    return {**result,"side":label,"source":METHOD,
        "uses_annual_year_accumulation":False,
        "is_real_world_outcome":False}

def calculate_hour_main_guest(classical:dict)->dict:
    """独立纯函数：必须先有经过V78原历元核验的时计局，不能从岁计盘调用。"""
    if not isinstance(classical,dict) or not classical.get("has_cycle_360_72"):
        raise ValueError("V79 时计必须提供V78真实360/72起局")
    count=classical.get("accumulated_hours")
    w=classical.get("time_wenchang")
    if not isinstance(w,dict) or w.get("status")!="computed":
        raise ValueError("V79 文昌必须先完成时计十八算")
    dun=w.get("dun")
    check=classical_hour_ju(count,dun)
    for name in ("ju","five_yuan_name","time_jishen"):
        if check[name]!=classical.get(name):
            raise ValueError("V79 V78时计元局或计神被篡改，拒绝继续取算")
    taiyi=check["taiyi_palace"]["number"]
    if classical.get("taiyi_palace")!=check["taiyi_palace"]:
        raise ValueError("V79 太乙入宫与甲子积时不符")
    for field in ("index","direction","god","count_in_18"):
        if w.get(field)!=check["time_wenchang"][field]:
            raise ValueError("V79 时计文昌十八算与甲子历元不符")
    if classical.get("hour_ganzhi_from_jiazi_start")!=check["hour_ganzhi_from_jiazi_start"]:
        raise ValueError("V79 时柱干支不符甲子起点序列")
    position={**_position(w["index"]),"count_in_18":w["count_in_18"],
              "trace":w["trace"],"source":w["source"]}
    shiji=shiji_from_wenchang(w["index"],check["time_jishen"])
    if shiji["index"]!=(w["index"]+INDEX["艮"]-INDEX[check["time_jishen"]])%16:
        raise ValueError("V79 计神加和德后始击下临映射不正确")
    shiji["source"]=METHOD
    main=_safe_side(position,taiyi,"主")
    guest=_safe_side(shiji,taiyi,"客")
    if main["status"]=="computed" and guest["status"]=="computed":
        status="computed"
    elif "computed" in (main["status"],guest["status"]):
        status="partially_computed"
    else:
        status="pending"
    # 原文出自庚戌时单例；只把数据作独立验收，不把其结果移植到现代日期。
    independent=None
    if count==ANCIENT_887["hour_count"] and dun==ANCIENT_887["dun"]:
        actual={"five_yuan_name":classical["five_yuan_name"],"ju":classical["ju"],
           "taiyi_palace":taiyi,"wenchang_god":position["god"],
           "wenchang_direction":position["direction"],
           "jishen":check["time_jishen"],"shiji_god":shiji["god"],
           "shiji_direction":shiji["direction"],
           "main_count":main["count"],"guest_count":guest["count"],
           "main_general":main["main_general"],"main_assistant":main["assistant_general"],
           "guest_general":guest["main_general"],"guest_assistant":guest["assistant_general"]}
        expected={k:ANCIENT_887[k] for k in actual}
        if actual!=expected:
            raise ValueError("V79 庚戌时原典887算：始击、主客算或大小将验收不符")
        independent={"status":"verified_independent_classical_math_case",
            "historical_hour":"嘉靖四十年辛酉十二月二十二日庚戌时",
            "source":PRIMARY,"expected":expected,"actual":actual,
            "modern_same_count_is_not_same_historical_date":True}
    n=check["taiyi_palace"]["number"]
    spirits=[
        {**_position(i),
         "has_wenchang":i==w["index"],"has_shiji":i==shiji["index"],
         "has_jishen":DIRECTIONS[i]==check["time_jishen"]}
        for i in range(16)]
    nine=[
        {"number":p,"is_taiyi":p==n,
         "has_wenchang":GONG.get(position["direction"])==p,
         "has_shiji":GONG.get(shiji["direction"])==p,
         "main_general_here":main["main_general"]==p,
         "main_assistant_here":main["assistant_general"]==p,
         "guest_general_here":guest["main_general"]==p,
         "guest_assistant_here":guest["assistant_general"]==p,
         "has_pending_general":(p==n and (main["status"]=="pending" or guest["status"]=="pending"))}
        for p in (9,2,7,4,5,6,3,8,1)]
    return {
       "version":"V79","status":status,"epoch":"V78 二至前最近甲子日简捷积时",
       "dun":dun,"accumulated_hours":count,
       "five_yuan_name":check["five_yuan_name"],"ju":check["ju"],
       "taiyi_palace":n,"jishen":check["time_jishen"],
       "heaven_eye_wenchang":position,"earth_eye_shiji":shiji,
       "main":main,"guest":guest,
       "main_calculated":main["count"],"guest_calculated":guest["count"],
       "main_general":main["main_general"],"main_assistant":main["assistant_general"],
       "guest_general":guest["main_general"],"guest_assistant":guest["assistant_general"],
       "sixteen_spirits":spirits,"nine_palace_positions":nine,
       "same_palace_conservative":status!="computed",
       "has_complete_hour_main_guest":status=="computed",
       "historical_case_audit":independent,
       "historical_witness":ANCIENT_887,
       "sources":{"ancient_887":PRIMARY,"method":METHOD,"jingshi":JING},
       "scope_limits":[
           "只在V78甲子日简捷时计起点算始击与主客；不以V67岁计积年代入。",
           "起算目与太乙同宫时保留主/客独立待判，不套用岁计《武备志》异法。",
           "未实现完整时计定计、合神、八门及古代绝对上元历元，不作现实吉凶判断。",
       ],
       "is_complete_all_hours":False,"fortune_verdict":None,
    }

def decorate_taiyi_v79(chart:dict)->dict:
    if chart.get("version")!="V77" or chart.get("historical_ju_version")!="V78":
        raise ValueError("V79 只能基于V77/V78校核通过的真实时计盘")
    classic=chart.get("classical_jiazi_hour_v78")
    if not isinstance(classic,dict) or classic.get("is_absolute_upper_jiazi_epoch") is not False:
        raise ValueError("V79 必须保留二至前甲子日简捷历元来源说明")
    result=calculate_hour_main_guest(classic)
    chart["hour_main_guest_v79"]=result
    chart["has_hour_shiji"]=True
    chart["has_complete_shiji_and_hour_main_guest"]=result["status"]=="computed"
    chart["has_full_hour_chart"]=False
    chart["main_guest_version"]="V79"
    chart["warnings"].append(
        "V79按甲子日简捷时计起点逐位求始击与主客算及大参将；"
        "遇与太乙同宫保守待判，定计、合神、八门及吉凶断课仍未完成。")
    return chart
