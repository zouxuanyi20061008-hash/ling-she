"""V50: auditable Shi-Jia Qimen foundation (拆补 · six instruments and three wonders).

Implements actual solar-term / 日符头 determination, 18 ju numbers, earth
plate distribution, hourly 旬首 and origin 值符/值使. Does NOT render a
finished rotating sky-star, eight-gates or eight-spirits time plate.

Normative fixed examples: 《奇门遁甲元灵经》卷一 “奇门起例”:
芒种后癸亥日丙辰时, 阳遁九局; 霜降后甲寅日辛未时, 阴遁八局.
"""
from __future__ import annotations
from datetime import date, datetime, time
from zoneinfo import ZoneInfo
from lunar_python import Solar
from .calendar import SIXTY_DAYS, STEMS, BRANCHES
from .solar_calendar import preview_solar_calendar

# 上元、中元、下元；《奇门遁甲元灵经》卷一。
TERM_JU={
    "冬至":("阳",(1,7,4)),"小寒":("阳",(2,8,5)),"大寒":("阳",(3,9,6)),
    "立春":("阳",(8,5,2)),"雨水":("阳",(9,6,3)),"惊蛰":("阳",(1,7,4)),
    "春分":("阳",(3,9,6)),"清明":("阳",(4,1,7)),"谷雨":("阳",(5,2,8)),
    "立夏":("阳",(4,1,7)),"小满":("阳",(5,2,8)),"芒种":("阳",(6,3,9)),
    "夏至":("阴",(9,3,6)),"小暑":("阴",(8,2,5)),"大暑":("阴",(7,1,4)),
    "立秋":("阴",(2,5,8)),"处暑":("阴",(1,4,7)),"白露":("阴",(9,3,6)),
    "秋分":("阴",(7,1,4)),"寒露":("阴",(6,9,3)),"霜降":("阴",(5,8,2)),
    "立冬":("阴",(6,9,3)),"小雪":("阴",(5,8,2)),"大雪":("阴",(4,7,1)),
}
INSTRUMENTS=("戊","己","庚","辛","壬","癸","丁","丙","乙")
LO_SHU=(4,9,2,3,5,7,8,1,6)
PALACES={
    1:("坎","北","天蓬","休门"),2:("坤","西南","天芮","死门"),
    3:("震","东","天冲","伤门"),4:("巽","东南","天辅","杜门"),
    5:("中","中央","天禽",None),6:("乾","西北","天心","开门"),
    7:("兑","西","天柱","惊门"),8:("艮","东北","天任","生门"),
    9:("离","南","天英","景门"),
}
XUN_INSTRUMENTS=("戊","己","庚","辛","壬","癸")
XUN_STARTS=("甲子","甲戌","甲申","甲午","甲辰","甲寅")
YUAN_BRANCHES={
    "上元":set("子午卯酉"),
    "中元":set("寅申巳亥"),
    "下元":set("辰戌丑未"),
}
REF="https://daizhige.org/易藏/术数/奇门遁甲元灵经.html"


def hour_ganzhi(day_ganzhi:str,hour:int)->str:
    """五鼠遁：甲己日起甲子时；依日干和北京时间双时辰求干支。"""
    if day_ganzhi not in SIXTY_DAYS or not 0<=hour<=23:
        raise ValueError("V50 需要合法日干支及北京时间小时")
    i=((hour+1)//2)%12
    stem=(STEMS.index(day_ganzhi[0])%5*2+i)%10
    result=STEMS[stem]+BRANCHES[i]
    if result not in SIXTY_DAYS:
        raise ValueError("五鼠遁得时柱未通过六十甲子核验")
    return result


def fu_tou(day_ganzhi:str)->dict:
    """每五日甲/己符头：日旬序号向前取最近甲日或己日。"""
    if day_ganzhi not in SIXTY_DAYS:
        raise ValueError("V50 日柱须为六十甲子")
    start=SIXTY_DAYS.index(day_ganzhi)//5*5
    text=SIXTY_DAYS[start]
    yuan=next(y for y,group in YUAN_BRANCHES.items() if text[1] in group)
    if text[0] not in ("甲","己"):
        raise ValueError("V50 当前符头不是甲己日")
    return {"ganzhi":text,"yuan":yuan,"day_offset":SIXTY_DAYS.index(day_ganzhi)-start}


def _plate(term:str,day_ganzhi:str,time_ganzhi:str,metadata:dict|None=None)->dict:
    if term not in TERM_JU:
        raise ValueError("V50 需要二十四节气中的合法节令")
    if time_ganzhi not in SIXTY_DAYS:
        raise ValueError("V50 时柱不是合法六十甲子")
    head=fu_tou(day_ganzhi)
    yin_yang,ju_set=TERM_JU[term]
    yuan_index=("上元","中元","下元").index(head["yuan"])
    ju=ju_set[yuan_index]
    order=1 if yin_yang=="阳" else -1
    earth={((ju-1+order*i)%9)+1:instrument
           for i,instrument in enumerate(INSTRUMENTS)}
    if len(earth)!=9 or set(earth.values())!=set(INSTRUMENTS):
        raise ValueError("V50 三奇六仪地盘出现重复或缺失")
    xun_index=SIXTY_DAYS.index(time_ganzhi)//10
    xun=XUN_STARTS[xun_index]
    xun_instrument=XUN_INSTRUMENTS[xun_index]
    origin=next(k for k,v in earth.items() if v==xun_instrument)
    star,door=PALACES[origin][2:]
    # 中五天禽借坤二死门起值使。本阶段不计算星门随时转移。
    duty={
        "time_xun":xun,"concealed_stem":xun_instrument,
        "earth_origin_palace":origin,"origin_star":star,
        "origin_door":door if door else "死门",
        "door_borrow_palace":2 if origin==5 else None,
        "rotated_star_palace":None,"rotated_door_palace":None,
        "sky_plate_computed":False,"gates_rotated":False,
    }
    palaces=[
        {"number":num,"name":PALACES[num][0],"direction":PALACES[num][1],
         "earth_stem":earth[num],
         "original_star":PALACES[num][2],
         "original_door":PALACES[num][3],
         "sky_stem":None,"actual_star":None,"actual_gate":None,"actual_spirit":None}
        for num in LO_SHU
    ]
    return {
        "version":"V50","school":"时家奇门遁甲",
        "method":"拆补法 · 甲己日符头三元（节气交接按即时换节）",
        "state":"earth_plate_computed_sky_gate_pending",
        "solar_term":term,"yin_yang_dun":yin_yang+"遁",
        "yuan":head["yuan"],"day_fu_tou":head["ganzhi"],
        "days_since_fu_tou":head["day_offset"],
        "ju_number":ju,"ju_label":yin_yang+"遁"+str(ju)+"局",
        "day_ganzhi":day_ganzhi,"hour_ganzhi":time_ganzhi,
        "palaces":palaces,"earth_plate":{str(k):v for k,v in sorted(earth.items())},
        "duty_origin":duty,
        "input_provenance":metadata,
        "has_complete_rotating_plate":False,
        "has_final_divination":False,"fortune_conclusion":None,
        "reference":REF,
        "limitations":[
            "V50 已按选定日与节气计算三元局数及九宫地盘，固定本宫九星/八门只是寻找旬首值符值使的原始索引。",
            "天盘九星、八门与八神随时辰转宫暂未实现：此处的原始星门不得当作起局后实际落宫。",
            "时辰用所选中国北京时间和换日规则推导；接近节气交接或23点须复核精确历书。"
        ]
    }


def _current_term(lunar,clock:datetime)->dict:
    # lunar-python 提供节（12次）与中气（12次）。六爻只需要节；
    # 奇门须用两者各12，共24节气，不能直接复用六爻前一“节”。
    candidates=(lunar.getPrevJie(False),lunar.getPrevQi(False))
    items=[]
    for jie in candidates:
        moment=datetime.strptime(jie.getSolar().toYmdHms(),"%Y-%m-%d %H:%M:%S").replace(
            tzinfo=ZoneInfo("Asia/Shanghai"))
        items.append((moment,jie.getName()))
    moment,term=max(items)
    if moment>clock or term not in TERM_JU:
        raise ValueError("V50 所属二十四节气无法核定")
    return {"name":term,"started_at_beijing":moment.isoformat(timespec="seconds")}


def cast_qimen(solar_date:date,clock:time,day_boundary:str="zi_hour")->dict:
    if not isinstance(solar_date,date) or not isinstance(clock,time):
        raise ValueError("V50 日期与钟面时刻不能为空")
    preview=preview_solar_calendar(solar_date,clock,day_boundary=day_boundary)
    moment=datetime.combine(solar_date,clock).replace(tzinfo=ZoneInfo("Asia/Shanghai"))
    lunar=Solar.fromYmdHms(solar_date.year,solar_date.month,solar_date.day,
                           clock.hour,clock.minute,clock.second).getLunar()
    term=_current_term(lunar,moment)
    day=preview["day_ganzhi"]
    hour=hour_ganzhi(day,clock.hour)
    metadata={
        "beijing_time":moment.isoformat(timespec="seconds"),
        "day_boundary":day_boundary,
        "solar_term_start":term["started_at_beijing"],
        "year_ganzhi":lunar.getYearInGanZhiExact(),
        "month_ganzhi":lunar.getMonthInGanZhiExact(),
        "calendar_preview_day":day,
        "calendar_preview_month_branch":preview["month_branch"],
        "near_solar_term":preview["near_solar_term"],
        "warnings":list(preview["warnings"]),
        "verification":"lunar_python_1.4.8_not_official_almanac",
    }
    return _plate(term["name"],day,hour,metadata)
