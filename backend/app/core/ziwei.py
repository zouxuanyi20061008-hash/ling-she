"""紫微斗数 V68 基础命盘：北京时间、公农历互转及十四正曜安星。

本版采用《紫微斗数全书》常见安星诀（详见 sources），绝不把占验结果当成事实。
流派分歧尤其是闰月取法，以选择参数及盘面 provenance 显式保留。
"""
from __future__ import annotations

from datetime import date, time

from .calendar import STEMS, BRANCHES
from .solar_calendar import preview_lunar_calendar, preview_solar_calendar
from .ziwei_v69 import decorate_ziwei_v69

PALACE_NAMES = ("命宫", "兄弟", "夫妻", "子女", "财帛", "疾厄",
                "迁移", "交友", "官禄", "田宅", "福德", "父母")
FIVE_ELEMENT_BUREAUS = {"水": 2, "木": 3, "金": 4, "土": 5, "火": 6}
# 行为甲乙、丙丁、戊己、庚辛、壬癸；列为子丑/午未、寅卯/申酉、辰巳/戌亥。
NAYIN_TABLE = (
    ("金", "水", "火"),
    ("水", "火", "土"),
    ("火", "土", "木"),
    ("土", "木", "金"),
    ("木", "金", "水"),
)
ZIWEI_SYSTEM = {"紫微": 0, "天机": -1, "太阳": -3,
                 "武曲": -4, "天同": -5, "廉贞": -8}
TIANFU_SYSTEM = {"天府": 0, "太阴": 1, "贪狼": 2, "巨门": 3,
                  "天相": 4, "天梁": 5, "七杀": 6, "破军": 10}
SOURCES = {
    "xingjue": "https://www.iztro.com/zh_CN/learn/setup",
    "step_by_step": "https://www.doushu.ai/star-rules",
    "fourteen_main_stars": "https://www.108s.tw/article/info/91",
}

def compute_basic_ziwei(lunar_year: int, lunar_month: int, lunar_day: int,
                        hour: int, gender: str = "unspecified",
                        leap_month_rule: str = "same_month") -> dict:
    """纯安星核：传入经外部农历库核实的有效月份和日号。"""
    if not 1901 <= lunar_year <= 2099 or not 1 <= lunar_month <= 12 or not 1 <= lunar_day <= 30:
        raise ValueError("农历出生日期范围不合法。")
    if not 0 <= hour <= 23:
        raise ValueError("北京时间小时必须在0至23之间。")
    if gender not in ("unspecified", "male", "female"):
        raise ValueError("性别选项无效。")
    if leap_month_rule not in ("same_month", "next_month"):
        raise ValueError("闰月安命宫口径无效。")
    # 甲子年1984、子时23:00至次日00:59；此处不擅自另换子初日期。
    year_index = (lunar_year - 1984) % 60
    year_stem_idx, year_branch_idx = year_index % 10, year_index % 12
    year_ganzhi = STEMS[year_stem_idx] + BRANCHES[year_branch_idx]
    hour_idx = ((hour + 1) // 2) % 12
    month_anchor = (2 + lunar_month - 1) % 12
    ming = (month_anchor - hour_idx) % 12
    shen = (month_anchor + hour_idx) % 12

    # 五虎遁：甲己丙寅、乙庚戊寅、丙辛庚寅、丁壬壬寅、戊癸甲寅。
    tiger_stem = (2 * (year_stem_idx % 5) + 2) % 10
    stem_indices = [(tiger_stem + (idx - 2) % 12) % 10 for idx in range(12)]
    palace_stem = stem_indices[ming]
    nayin_element = NAYIN_TABLE[palace_stem // 2][(ming // 2) % 3]
    bureau = FIVE_ELEMENT_BUREAUS[nayin_element]

    # 《起紫微星诀》：寅起商数，补数奇逆偶顺；商数一从寅宫开始。
    borrowed = (-lunar_day) % bureau
    quotient = (lunar_day + borrowed) // bureau
    ziwei = (2 + quotient - 1 + (borrowed if borrowed % 2 == 0 else -borrowed)) % 12
    # 寅申同宫、丑卯互换；按子序号0~11折射，天府=(4-紫微)%12。
    tianfu = (4 - ziwei) % 12
    star_positions = {
        **{name: BRANCHES[(ziwei + offset) % 12] for name, offset in ZIWEI_SYSTEM.items()},
        **{name: BRANCHES[(tianfu + offset) % 12] for name, offset in TIANFU_SYSTEM.items()},
    }
    stars_by_branch = {b: [] for b in BRANCHES}
    for name, b in star_positions.items():
        stars_by_branch[b].append(name)

    year_is_yang = year_stem_idx % 2 == 0
    direction = None
    if gender != "unspecified":
        direction = "顺行" if (year_is_yang == (gender == "male")) else "逆行"
    limit_index = {(ming + i * (1 if direction == "顺行" else -1)) % 12: i
                   for i in range(12)} if direction is not None else {}
    palaces = []
    for idx, branch in enumerate(BRANCHES):
        limit_no = limit_index.get(idx)
        palaces.append({
            "branch": branch, "stem": STEMS[stem_indices[idx]],
            "ganzhi": STEMS[stem_indices[idx]] + branch,
            "name": PALACE_NAMES[(ming - idx) % 12],
            "is_ming": idx == ming, "is_shen": idx == shen,
            "main_stars": stars_by_branch[branch],
            "has_main_stars": bool(stars_by_branch[branch]),
            "great_limit": ({"start_age": bureau + limit_no * 10,
                            "end_age": bureau + limit_no * 10 + 9}
                            if limit_no is not None else None),
        })
    return {
        "year_ganzhi": year_ganzhi,
        "hour_branch": BRANCHES[hour_idx], "hour_index": hour_idx,
        "month_anchor_branch": BRANCHES[month_anchor],
        "ming_branch": BRANCHES[ming], "shen_branch": BRANCHES[shen],
        "ming_ganzhi": STEMS[palace_stem] + BRANCHES[ming],
        "five_element_bureau": {"element": nayin_element, "number": bureau,
                                 "label": f"{nayin_element}{'二三四五六'[bureau - 2]}局"},
        "ziwei_branch": BRANCHES[ziwei], "tianfu_branch": BRANCHES[tianfu],
        "ziwei_trace": {"day": lunar_day, "bureau": bureau,
                         "borrowed": borrowed, "quotient": quotient,
                         "borrow_direction": ("不借数" if borrowed == 0 else
                             "偶数顺行" if borrowed % 2 == 0 else "奇数逆行"),
                         "result": BRANCHES[ziwei]},
        "gender": gender, "great_limit_direction": direction,
        "star_positions": star_positions, "palaces": palaces,
    }

def cast_ziwei(calendar_type: str, solar_date: date | None, lunar_year: int | None,
               lunar_month: int | None, lunar_day: int | None, is_leap_month: bool,
               clock: time, gender: str = "unspecified",
               leap_month_rule: str = "same_month",
               four_transform_school: str = "quanshu") -> dict:
    if calendar_type not in ("solar", "lunar"):
        raise ValueError("只支持公历、农历出生日期。")
    if clock.tzinfo is not None:
        raise ValueError("请输入北京时间本地钟面时间，不得带时区偏移。")
    if gender not in ("male", "female", "unspecified"):
        raise ValueError("性别选项无效。")
    if leap_month_rule not in ("same_month", "next_month"):
        raise ValueError("闰月口径无效。")
    if calendar_type == "solar":
        if solar_date is None or any(x is not None for x in (lunar_year, lunar_month, lunar_day)) or is_leap_month:
            raise ValueError("公历模式只可填写公历日期，不能混用农历字段。")
        calendar = preview_solar_calendar(solar_date, clock)
    else:
        if solar_date is not None or None in (lunar_year, lunar_month, lunar_day):
            raise ValueError("农历模式必须完整填写农历年、月、日及闰月选项。")
        calendar = preview_lunar_calendar(lunar_year, lunar_month, lunar_day, is_leap_month, clock)
    lunar = calendar["lunar"]
    effective_month = lunar["month"]
    if lunar["is_leap_month"] and leap_month_rule == "next_month":
        effective_month = effective_month % 12 + 1
    calculation = compute_basic_ziwei(
        lunar["year"], effective_month, lunar["day"], clock.hour, gender, leap_month_rule
    )
    warnings = list(calendar["warnings"])
    if lunar["is_leap_month"]:
        warnings.append("此生辰在农历闰月：本盘按所选口径安命身宫；不同流派有不同取法，应对照手工盘。")
    if clock.hour == 23:
        warnings.append("23:00至23:59属子时；晚子时是否提前换日有争议，V68固定按历法原日，不自动挪动农历生日。")
    result = {
        "version": "V68", "system": "紫微斗数", "status": "basic_fourteen_stars_computed",
        "input": {
            "calendar_type": calendar_type,
            "solar_date": solar_date.isoformat() if solar_date else None,
            "lunar_year": lunar_year, "lunar_month": lunar_month,
            "lunar_day": lunar_day, "is_leap_month": is_leap_month,
            "clock": clock.strftime("%H:%M"), "timezone": "Asia/Shanghai",
            "gender": gender, "leap_month_rule": leap_month_rule,
            "four_transform_school": four_transform_school
        },
        "calendar": {"solar_date": calendar["solar_date"], "lunar": lunar,
                     "beijing_time": calendar["beijing_time"],
                     "birth_lunar_month_used": effective_month,
                     "verification": "lunar_python_1.4.8_not_official_almanac"},
        **calculation,
        "warnings": warnings,
        "rules": {
            "year_boundary": "农历正月初一界定生年干支，不采用四柱立春年界",
            "hour": "北京时间子时23:00-00:59，不进行出生地真太阳时校正",
            "ming_shen": "寅起正月顺数月，子时起逆数命宫、顺数身宫",
            "palace_stems": "五虎遁自寅起十二宫干",
            "bureau": "命宫干支六十甲子纳音五行局（水二木三金四土五火六）",
            "main_stars": "起紫微星借数奇逆偶顺，寅申轴定天府，六星逆行八星顺行",
            "leap_month": ("闰月当本月" if leap_month_rule == "same_month" else "闰月按下月"),
            "limits": "阳男阴女顺、阴男阳女逆；未填性别不计算大限",
        },
        "not_implemented": ["生年四化", "辅曜煞曜与杂曜", "流年及小限", "实务论断"],
        "sources": SOURCES,
    }

    return decorate_ziwei_v69(result, effective_month, four_transform_school)
