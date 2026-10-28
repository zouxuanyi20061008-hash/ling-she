"""V78 太乙时计甲子前起点：三百六十时周纪、七十二局五元、时文昌十八算。

《太乙金钥匙·续集》校准：
  阳遁丁丑庚戌时，冬至前甲子积74日 => (74-1)*12+11=887
  887 去二周360 得167，去二元72 得戊子元23局；
  太乙巽九第2时，文昌起武德，第5算到阴德乾。
  另一阴遁第63局：太乙震四、文昌坤大武、计神午。

本版对现代日期选定“当前冬/夏至前最近一个甲子日子时”作为
文献记载的简捷历元。每小时按双时辰计数，一日十二时。
它是**甲子前起点的简捷派**，不是古代绝对上元积时，也不代表
所有换遁口径（是否至日交节立即换遁或甲子时换遁另有流派）。
V77 交节后相对时实继续独立存在，二者差值必须明列。
"""
from __future__ import annotations
from datetime import datetime,timedelta
from lunar_python import Solar

from .calendar import BRANCHES,SIXTY_DAYS
from .taiyi import YUAN_NAMES
from .taiyi_v65 import DIRECTIONS,GODS,INDEX
from .taiyi_hour_v77 import hour_cycle_from_count,_clock_slot,BEIJING

PRIMARY="https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkylq3yn8"
GENERAL="https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkvlnkx7u"
YIN_CASE="https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkvlnkx7u"
SCHOOLS={
  "阳遁":{"first":"申","double":("乾","坤"),"start_branch":"寅"},
  "阴遁":{"first":"寅","double":("巽","艮"),"start_branch":"申"},
}

def _wenchang_order(dun:str)->tuple[int,...]:
    if dun not in SCHOOLS:raise ValueError("V78 只能按阴阳遁推时文昌")
    school=SCHOOLS[dun]
    start=INDEX[school["first"]]
    series=[]
    for delta in range(16):
        pos=(start+delta)%16
        series.append(pos)
        if DIRECTIONS[pos] in school["double"]:
            series.append(pos)
    if len(series)!=18 or len(set(series))!=16:
        raise ValueError("V78 时文昌双留十六神十八周不闭合")
    return tuple(series)

def hour_wenchang_from_count(count:int,dun:str)->dict:
    if isinstance(count,bool) or not isinstance(count,int) or count<1:
        raise ValueError("时文昌必须有正整数时计积数")
    order=_wenchang_order(dun)
    offset=(count-1)%18
    index=order[offset]
    seq=[]
    for i in range(offset+1):
        n=order[i]
        seq.append({"count":i+1,"direction":DIRECTIONS[n],
            "god":GODS[n],"index":n,
            "double_stay":i>0 and order[i]==order[i-1]})
    return {
       "status":"computed","source":GENERAL,"dun":dun,
       "index":index,"direction":DIRECTIONS[index],
       "god":GODS[index],"count_in_18":offset+1,
       "full_18_cycles":(count-1)//18,
       "sequence_start":SCHOOLS[dun]["first"],
       "double_stay_directions":list(SCHOOLS[dun]["double"]),
       "movement":"十六神顺行，四隅两宫各重留一算",
       "trace":seq,"has_real_eighteen_count":True,
    }

def classical_hour_ju(accum:int,dun:str)->dict:
    """正整数积时 -> 六纪/五元七十二局/八宫三时/时计文昌。

    年代来源和起点由调用方证明，此纯函数绝不自行认定古代绝对积时。
    """
    if isinstance(accum,bool) or not isinstance(accum,int) or accum<1:
        raise ValueError("V78 需要合法积时正整数")
    if dun not in SCHOOLS:raise ValueError("V78 时计阴阳遁口径无效")
    cycle=(accum-1)%360
    ju=cycle%72+1
    yuan=cycle//72+1
    ji=cycle//60+1
    palace=hour_cycle_from_count(ju,dun)
    wenchang=hour_wenchang_from_count(ju,dun)
    # 十二时一周、十八算一周、二十四时一宫周，均是360的因数；
    # 可用全积数与元内局数双路径计算，防止余数边界出错。
    by_accum=hour_cycle_from_count(accum,dun)
    by_wenchang=hour_wenchang_from_count(accum,dun)
    if (palace["taiyi_palace"]["number"]!=by_accum["taiyi_palace"]["number"]
        or palace["jishen"]!=by_accum["jishen"]
        or wenchang["index"]!=by_wenchang["index"]):
        raise ValueError("V78 六纪/七十二局/十八文昌循环与积时不一致")
    return {
        "accumulated_hours":accum,
        "completed_360_circuits":(accum-1)//360,
        "in_cycle_360":cycle+1,
        "six_ji_number":ji,"six_ji_hour_index":cycle%60+1,
        "five_yuan_number":yuan,"five_yuan_name":YUAN_NAMES[yuan-1],
        "ju":ju,"ju_label":dun+str(ju)+"局",
        "hour_ganzhi_from_jiazi_start":SIXTY_DAYS[(accum-1)%60],
        "taiyi_palace":palace["taiyi_palace"],
        "hour_in_palace":palace["hours_in_current_palace"],
        "time_jishen":palace["jishen"],
        "time_wenchang":wenchang,
        "count_formula":"积时先以360去周，余以72约五元局；24去宫，18去文昌，12去计神",
        "sources":{"independent_887_and_47":PRIMARY,"yin_63":YIN_CASE},
        "has_cycle_360_72":True,"has_hour_wenchang":True,
        "has_main_guest":False,"fortune_verdict":None,
    }

def _solar_day_ganzhi(at:datetime)->str:
    noon=Solar.fromYmdHms(at.year,at.month,at.day,12,0,0).getLunar()
    day=noon.getDayInGanZhi()
    if day not in SIXTY_DAYS:
        raise ValueError("V78 不能按北京民用日历获取合法六十甲子日")
    return day

def latest_jiazi_before_solstice(solstice:datetime)->dict:
    if solstice.tzinfo is None or solstice.utcoffset()!=solstice.astimezone(BEIJING).utcoffset():
        raise ValueError("V78 起点必须是北京时间二至时刻")
    calendar_day=_solar_day_ganzhi(solstice)
    day_idx=SIXTY_DAYS.index(calendar_day)
    anchor_day=solstice.date()-timedelta(days=day_idx)
    # 用跨年真日期验证，不依赖在某个年份硬编码甲子日期。
    noon=datetime.combine(anchor_day,datetime.min.time()).replace(tzinfo=BEIJING)
    if _solar_day_ganzhi(noon)!="甲子":
        raise ValueError("V78 冬夏至前最近甲子日历算不闭合")
    return {
        "solstice_ganzhi_day":calendar_day,
        "prior_jiazi_date":anchor_day.isoformat(),
        "days_between_jiazi_and_solstice":day_idx,
        "day_boundary":"北京时间民用日取午间干支；子时23:00至次日00:59为同一时段",
        "source":PRIMARY,
    }

def decorate_taiyi_v78(chart:dict,now:datetime,solstice:datetime)->dict:
    if chart.get("version")!="V77" or not chart.get("has_hour_taiyi"):
        raise ValueError("V78 只能建立于真实二至时计基本盘")
    if now.tzinfo is None or solstice.tzinfo is None or now<solstice:
        raise ValueError("V78 不可脱离真实节气时刻")
    epoch=latest_jiazi_before_solstice(solstice)
    origin=datetime.fromisoformat(epoch["prior_jiazi_date"]+"T00:00:00").replace(
        tzinfo=BEIJING)
    days=(now.date()-origin.date()).days
    accum=days*12+_clock_slot(now)+1
    if accum<1:
        raise ValueError("V78 甲子日起时序无法求正数")
    classic=classical_hour_ju(accum,chart["time_cycle"]["dun"])
    computed_relative=chart["time_cycle"]["relative_time_count"]
    if (accum-computed_relative)!=(solstice.date()-origin.date()).days*12+_clock_slot(solstice):
        raise ValueError("V78 甲子前历元积时与二至相对时差值不符")
    if classic["time_jishen"]!=chart["jishen"]["branch"]:
        # 不应当同：不同起点可导致两套计神不同；不得静默覆盖 V77。
        pass
    same=(classic["taiyi_palace"]["number"]==chart["taiyi_palace"]["number"])
    chart["classical_jiazi_hour_v78"]={
        **classic,"anchor":epoch,
        "school":"《太乙金钥匙》二至前甲子日简捷历元（非古代绝对上元）",
        "compared_to_v77":{
            "v77_relative_since_solstice":computed_relative,
            "v78_from_prior_jiazi":accum,
            "offset_in_double_hours":accum-computed_relative,
            "palace_agrees":same,
            "v77_palace":chart["taiyi_palace"]["number"],
            "v78_palace":classic["taiyi_palace"]["number"],
            "v77_jishen":chart["jishen"]["branch"],
            "v78_jishen":classic["time_jishen"],
            "claim_same_epoch":False,
            "reason":"二至交节时实与前甲子子时积时不是同一零点；仅把两套结果并列",
        },
        "is_absolute_upper_jiazi_epoch":False,
        "historical_360_72_derived_from_prior_jiazi":True,
    }
    chart["has_jiazi_anchor_360_72"]=True
    chart["has_classical_hour_wenchang_v78"]=True
    chart["has_full_hour_chart"]=False
    chart["canonical_historical_hour_count"]=None
    chart["canonical_five_yuan_72_ju"]=None
    chart["warnings"].append(
       "V78 甲子前起点可核算五元六纪72局和18算文昌，但不同于V77二至交节时实；"
       "未建立古代绝对上元历元和完整时计主客算，两套太乙宫、计神可能不同。")
    if now.hour==23 or solstice.hour==23:
        chart["warnings"].append(
           "交节或占时落23点子初换日边界：不同历书换日口径可能改变甲子日校准，"
           "请用另一历元排盘交叉核对。")
    chart["historical_ju_version"]="V78"
    from .taiyi_hour_v79 import decorate_taiyi_v79
    return decorate_taiyi_v79(chart)
