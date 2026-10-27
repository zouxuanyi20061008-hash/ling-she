"""V62 大六壬贵人及十二天将：固定时支分昼夜、天盘贵神下临定顺逆。

采用公开校核的《大六壬指南》贵人/天将次序及常见
“甲戊庚牛羊、乙己鼠猴、丙丁猪鸡、壬癸蛇兔、辛逢马虎”
贵人表。昼卯辰巳午未申，夜酉戌亥子丑寅，是明确可选的
传统*定时辰*判法，不是假设实际日出日落。提供 day/night
显式覆盖供不同占课传统比较；不预言吉凶。
"""
from __future__ import annotations

from .calendar import BRANCHES,STEMS
from .liuren import sky_plate

NOBLE_BY_STEM={
    "甲":("丑","未"),"乙":("子","申"),
    "丙":("亥","酉"),"丁":("亥","酉"),
    "戊":("丑","未"),"己":("子","申"),
    "庚":("丑","未"),"辛":("午","寅"),
    "壬":("巳","卯"),"癸":("巳","卯"),
}
GENERALS=("贵人","螣蛇","朱雀","六合","勾陈","青龙",
          "天空","白虎","太常","玄武","太阴","天后")
GENERAL_ELEMENT={
    "贵人":"土","螣蛇":"火","朱雀":"火","六合":"木",
    "勾陈":"土","青龙":"木","天空":"土","白虎":"金",
    "太常":"土","玄武":"水","太阴":"金","天后":"水",
}
DAY_HOURS=set("卯辰巳午未申")
FORWARD_GROUNDS=set("亥子丑寅卯辰")
MODES=("hour_branch","day","night")
SOURCE="https://libokang.com/classics/liuren/%E6%B3%A8%E8%A7%A3%E5%A4%A7%E5%85%AD%E5%A3%AC%E6%8C%87%E5%8D%97/"
NOBLE_SOURCE="https://libokang.com/classics/liuren/%E5%85%AD%E5%A3%AC%E5%AD%98%E9%AA%8C/"
HOUR_SOURCE="https://qimen.yi958.com/lrrk/14393"
EXTERNAL_EXAMPLE="https://multifate.com/zh/guides/daliuren/twelve-generals"


def noble_choice(day_stem:str,hour_branch:str,mode:str="hour_branch")->dict:
    if day_stem not in STEMS or hour_branch not in BRANCHES:
        raise ValueError("贵人须以合法日干及占时支为据")
    if mode not in MODES:
        raise ValueError("请明确贵人昼夜采用时支自动/手动昼贵/手动夜贵")
    day=hour_branch in DAY_HOURS if mode=="hour_branch" else mode=="day"
    noble=NOBLE_BY_STEM[day_stem][0 if day else 1]
    return {
       "day_stem":day_stem,"hour_branch":hour_branch,
       "mode":mode,"period":"昼贵" if day else "夜贵",
       "is_day":day,"noble_branch":noble,
       "day_noble":NOBLE_BY_STEM[day_stem][0],
       "night_noble":NOBLE_BY_STEM[day_stem][1],
       "day_hours":list(b for b in BRANCHES if b in DAY_HOURS),
       "night_hours":list(b for b in BRANCHES if b not in DAY_HOURS),
       "clock_basis":"固定卯至申为昼、酉至寅为夜；非真实天文日出日落",
       "manual_override":mode!="hour_branch",
    }


def rotate_twelve_generals(day:str,month_general:str,hour_branch:str,
                           noble_mode:str="hour_branch")->dict:
    if len(day)!=2 or day[0] not in STEMS or hour_branch not in BRANCHES:
        raise ValueError("六壬贵人排将须合法日干与时支")
    selection=noble_choice(day[0],hour_branch,noble_mode)
    plate=sky_plate(month_general,hour_branch)
    noble=selection["noble_branch"]
    noble_ground=next(earth for earth,sky in plate.items() if sky==noble)
    clockwise=noble_ground in FORWARD_GROUNDS
    step=1 if clockwise else -1
    start=BRANCHES.index(noble_ground)
    on_earth={BRANCHES[(start+step*i)%12]:g
              for i,g in enumerate(GENERALS)}
    if len(on_earth)!=12 or set(on_earth.values())!=set(GENERALS):
        raise ValueError("十二天将必须一宫一将且不重复")
    by_sky={sky:on_earth[earth] for earth,sky in plate.items()}
    if by_sky[noble]!="贵人":
        raise ValueError("天盘贵人并未乘贵人天将")
    for i,gen in enumerate(GENERALS):
        earth=BRANCHES[(start+step*i)%12]
        if on_earth[earth]!=gen or by_sky[plate[earth]]!=gen:
            raise ValueError("十二天将顺逆排布校验失败")
    return {
      "version":"V62",
      **selection,
      "noble_ground_palace":noble_ground,
      "direction":"顺行" if clockwise else "逆行",
      "forward":clockwise,
      "direction_basis":"贵人天盘上神下临的地盘在亥子丑寅卯辰顺行，否则逆行",
      "order":list(GENERALS),
      "by_earth":on_earth,
      "by_heaven":by_sky,
      "twelve_palaces":[{
         "earth":earth,"heaven":plate[earth],
         "heavenly_general":on_earth[earth],
         "general_element":GENERAL_ELEMENT[on_earth[earth]],
         "is_noble":earth==noble_ground,
      } for earth in BRANCHES],
      "full_unique_generals":True,
      "fortune_verdict":None,
      "sources":{"order_and_direction":SOURCE,"noble_day_night":NOBLE_SOURCE,
                 "fixed_hour_example":HOUR_SOURCE,"independent_case":EXTERNAL_EXAMPLE},
      "limits":[
        "采用常用贵人歌诀和卯至申昼占的固定时辰划分，不代表所有古籍或门派。",
        "可手动选昼贵／夜贵用于校勘；并没有依据出生地太阳高度推断真实昼夜。",
        "十二天将属传统符号与排盘结构，不是对现实事件、吉凶或身份的推断。",
      ],
    }


def decorate_liuren_v62(chart:dict,noble_mode:str="hour_branch")->dict:
    if chart.get("version")!="V61" or not chart.get("has_real_plates_and_four_lessons"):
        raise ValueError("V62 必须以已核验的 V61 六壬盘为基础")
    value=rotate_twelve_generals(chart["day_ganzhi"],chart["month_general"],
                                 chart["hour_branch"],noble_mode)
    plate=chart["heaven_plate"]
    if set(value["by_earth"])!=set(plate) or len(chart["palaces"])!=12:
        raise ValueError("天将与真实十二宫不匹配")
    for palace in chart["palaces"]:
        earth=palace["earth"]
        if palace["heaven"]!=plate[earth]:
            raise ValueError("十二天将不能附到不一致的地天双层盘")
        palace["heavenly_general"]=value["by_earth"][earth]
        palace["general_element"]=GENERAL_ELEMENT[palace["heavenly_general"]]
        palace["is_noble"]=earth==value["noble_ground_palace"]
    for lesson in chart["four_lessons"]:
        upper=lesson["upper"]
        lesson["heavenly_general"]=value["by_heaven"][upper]
        lesson["general_element"]=GENERAL_ELEMENT[lesson["heavenly_general"]]
    trans=chart["three_transmissions"]
    if trans["status"]=="computed":
        for row in trans["transmissions"]:
            sky=row["branch"]
            ground=next(p for p,v in plate.items() if v==sky)
            row["earth_palace"]=ground
            row["heavenly_general"]=value["by_heaven"][sky]
            row["general_element"]=GENERAL_ELEMENT[row["heavenly_general"]]
    elif trans.get("transmissions") is not None:
        raise ValueError("未决三传绝不可附加假天将")
    chart["heavenly_generals"]=value
    chart["version"]="V62"
    chart["has_twelve_heavenly_generals"]=True
    chart["has_full_nine_methods"]=False
    chart["transmission_review"]["version"]="V62"
    chart["limits"]=[
      "V62 按指定固定时支昼夜/手动昼夜贵人，在真实天盘上寻找贵人下临地盘，再按地盘区域顺逆排满十二天将。",
      "贵人及昼夜口径有古籍差异；本版清楚标明采用的单一常用贵人表，且手动允许切换昼夜，不自动估算当地日出日落。",
      "天将已落完整十二宫、四课和已确认三传，未决三传不补假信息；九宗门全部变例仍需交叉验收。",
      "未排全年真太阳时、旬遁干、完整课体吉凶或个人命运断语。",
    ]
    return chart
