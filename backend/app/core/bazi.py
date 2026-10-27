"""V55 四柱八字真实排盘：以北京时间为准的节气四柱及藏干十神。

年柱取立春即时交节、月柱取12节即时交节，非农历春节/月初。
日柱子初23:00或零点00:00由用户明确选取；时柱由所选日干按
五鼠遁推导，不盲用与用户换日规则不一致的库默认时干。
五行、藏干和十神仅为结构对应，不计算人的命运或性格结论。
"""
from __future__ import annotations
from datetime import date,datetime,time
from zoneinfo import ZoneInfo

from lunar_python import Solar
from lunar_python.util import LunarUtil

from .calendar import STEMS,BRANCHES,SIXTY_DAYS
from .solar_calendar import preview_solar_calendar,DAY_BOUNDARIES
from .qimen import hour_ganzhi

STEM_ELEMENT=dict(zip(STEMS,("木","木","火","火","土","土","金","金","水","水")))
BRANCH_ELEMENT=dict(zip(BRANCHES,("水","土","木","木","土","火","火","土","金","金","土","水")))
GENERATES={"木":"火","火":"土","土":"金","金":"水","水":"木"}
CONTROLS={"木":"土","土":"水","水":"火","火":"金","金":"木"}
HIDDEN_STEMS={
 "子":("癸",),"丑":("己","癸","辛"),"寅":("甲","丙","戊"),
 "卯":("乙",),"辰":("戊","乙","癸"),"巳":("丙","戊","庚"),
 "午":("丁","己"),"未":("己","丁","乙"),"申":("庚","壬","戊"),
 "酉":("辛",),"戌":("戊","辛","丁"),"亥":("壬","甲"),
}
PILLAR_LABELS=(("year","年柱"),("month","月柱"),("day","日柱"),("hour","时柱"))
REF="https://github.com/6tail/lunar-python/blob/master/lunar_python/EightChar.py"
GOLDEN_REF="https://github.com/6tail/lunar-python/blob/master/test/EightCharTest.py"


def ten_god(day_stem:str,other_stem:str)->str:
    if day_stem not in STEM_ELEMENT or other_stem not in STEM_ELEMENT:
        raise ValueError("V55 十神必须基于两个合法天干")
    day=STEM_ELEMENT[day_stem]
    other=STEM_ELEMENT[other_stem]
    same_polarity=STEMS.index(day_stem)%2==STEMS.index(other_stem)%2
    if day==other:return "比肩" if same_polarity else "劫财"
    if GENERATES[day]==other:return "食神" if same_polarity else "伤官"
    if CONTROLS[day]==other:return "偏财" if same_polarity else "正财"
    if CONTROLS[other]==day:return "七杀" if same_polarity else "正官"
    if GENERATES[other]==day:return "偏印" if same_polarity else "正印"
    raise ValueError("V55 天干五行关系不一致")


def _format_pillar(kind:str,name:str,ganzhi:str,day_stem:str)->dict:
    if ganzhi not in SIXTY_DAYS:raise ValueError("V55 出现不合法的六十甲子")
    stem,branch=ganzhi
    return {
        "kind":kind,"label":name,"ganzhi":ganzhi,
        "stem":stem,"branch":branch,
        "stem_element":STEM_ELEMENT[stem],
        "branch_element":BRANCH_ELEMENT[branch],
        "stem_ten_god":"日主" if kind=="day" else ten_god(day_stem,stem),
        "hidden_stems":[{
            "stem":h,"element":STEM_ELEMENT[h],
            "ten_god":ten_god(day_stem,h)
        } for h in HIDDEN_STEMS[branch]],
        "na_yin":LunarUtil.NAYIN.get(ganzhi),
    }


def cast_bazi(solar_date:date,clock:time,day_boundary:str="midnight",
              luck_direction:str="none")->dict:
    if not isinstance(solar_date,date) or isinstance(solar_date,datetime):
        raise ValueError("V55 须提供正确公历日期")
    if not isinstance(clock,time) or clock.tzinfo is not None:
        raise ValueError("V55 输入必须是无附带时区的北京时间钟面时刻")
    if day_boundary not in DAY_BOUNDARIES:
        raise ValueError("V55 请选择子初或午夜换日")
    # Reuse the exact Beijing calendar provenance already accepted for six yao.
    preview=preview_solar_calendar(solar_date,clock,day_boundary=day_boundary)
    lunar=Solar.fromYmdHms(solar_date.year,solar_date.month,solar_date.day,
                           clock.hour,clock.minute,clock.second).getLunar()
    year=lunar.getYearInGanZhiExact()
    month=lunar.getMonthInGanZhiExact()
    day=preview["day_ganzhi"]
    hour=hour_ganzhi(day,clock.hour)
    if month!=preview["month_ganzhi"] or month[1]!=preview["month_branch"]:
        raise ValueError("V55 节令月柱和原有北京历法预览不一致")
    # Independent year/month/day check against the lunar-python 八字 API.
    chars=lunar.getEightChar()
    if (chars.getYear(),chars.getMonth())!=(year,month):
        raise ValueError("V55 原始八字年、月与交节历法不一致")
    chars.setSect(1 if day_boundary=="zi_hour" else 2)
    if chars.getDay()!=day:
        raise ValueError("V55 23点子初/零点的日干支没有和所选流派一致")
    # The library's timeGan may use its native rollover regardless of sect.
    # Cross-check its clock-only 时支; derive 时干 explicitly from selected day.
    if chars.getTimeZhi()!=hour[1]:
        raise ValueError("V55 所选北京时间时支与独立万年历库不一致")
    values=(year,month,day,hour)
    if any(gz not in SIXTY_DAYS for gz in values):
        raise ValueError("V55 四柱未通过六十甲子验证")
    pillars=[
        _format_pillar(kind,label,gz,day[0])
        for (kind,label),gz in zip(PILLAR_LABELS,values)
    ]
    warnings=list(preview["warnings"])
    if solar_date.year in (1901,2099):
        warnings.append("当前处于历法计算允许的端点年份，请按权威历书复核跨年交节。")
    result={
        "version":"V55",
        "school":"四柱八字",
        "state":"real_four_pillars_computed",
        "solar_date":solar_date.isoformat(),
        "beijing_time":preview["beijing_time"],
        "timezone":"Asia/Shanghai",
        "day_boundary":day_boundary,
        "day_boundary_label":DAY_BOUNDARIES[day_boundary],
        "year_ganzhi":year,"month_ganzhi":month,
        "day_ganzhi":day,"hour_ganzhi":hour,
        "day_master":day[0],"day_master_element":STEM_ELEMENT[day[0]],
        "pillars":pillars,
        "solar_term_boundary":{
            "previous_jie":preview["previous_jie"],
            "next_jie":preview["next_jie"],
            "minutes_to_closest_jie":preview["minutes_to_closest_jie"],
            "near_solar_term":preview["near_solar_term"],
            "year_basis":"立春交节即换年柱",
            "month_basis":"十二节即时交节即换月柱（非农历初一）",
            "solar_month_branch":preview["month_branch"],
        },
        "lunar_date":preview["lunar"],
        "warnings":warnings,
        "source":{
            "calendar_library":"lunar_python==1.4.8",
            "calendar_code_reference":REF,
            "independent_fixed_cases_reference":GOLDEN_REF,
            "day_hour_calculation":"四柱日柱用已有北京时间节令历法；时柱按该日干用五鼠遁推算",
            "birth_location_correction_used":False,
            "true_solar_time_used":False,
            "birth_place_requested":False,
        },
        "has_real_four_pillars":True,
        "has_hidden_stems_and_ten_gods":True,
        "has_decade_luck_cycles":False,
        "has_final_fortune_judgement":False,
        "fortune_conclusion":None,
        "limits":[
            "按北京时间（UTC+8）的钟面时刻，而非出生地真太阳时；暂不输入经纬度或进行经度校正。",
            "年柱以立春交节、月柱以十二节而非春节或农历初一；接近交节15分钟需核查精确历书。",
            "23点子时可选午夜换日与子初换日，日柱变动后时柱也重新推导。",
            "藏干、五行与十神仅为传统规则的结构映射，不等于个人性格、财富、健康、婚姻或命运的实际预测。",
            "大运顺逆、起运岁数、流年流月、完整命理分析尚未实现。",
        ],
    }
    if luck_direction!="none":
        from .bazi_yun import compute_bazi_luck
        result["luck"]=compute_bazi_luck(result,solar_date,clock,luck_direction)
        result["version"]="V56"
        result["has_decade_luck_cycles"]=True
        result["has_luck_start_date"]=True
        result["limits"]=[
            x for x in result["limits"] if not x.startswith("大运顺逆")
        ]+["大运起运已按指定口径计算，但流年流月、合冲关系、完整命理分析仍未实现。"]
    return result
