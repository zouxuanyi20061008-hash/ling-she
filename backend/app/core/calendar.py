"""六爻手动确认的干支日与节令月支：起六神、求旬空、标记月支关系。

只根据用户确认的六十甲子日、节令月支推导，不通过公历日期猜测，
避免各时区、子初换日、交节时刻造成误盘。此模块是象数规则计算，
不是日月干支历法换算，也不等于完整旺衰判断。
"""
from __future__ import annotations

from .najia import BRANCH_ELEMENT
from .hexagrams import GENERATES, CONTROLS

STEMS = tuple("甲乙丙丁戊己庚辛壬癸")
BRANCHES = tuple("子丑寅卯辰巳午未申酉戌亥")
SIXTY_DAYS = tuple(STEMS[i % 10] + BRANCHES[i % 12] for i in range(60))
SIX_SPIRITS = ("青龙","朱雀","勾陈","螣蛇","白虎","玄武")
FIRST_SPIRIT = {"甲":0,"乙":0,"丙":1,"丁":1,"戊":2,"己":3,
                "庚":4,"辛":4,"壬":5,"癸":5}
XUNKONG = (("戌","亥"),("申","酉"),("午","未"),("辰","巳"),("寅","卯"),("子","丑"))
MONTH_STARTS = tuple("寅卯辰巳午未申酉戌亥子丑")
OPPOSITES = {"子":"午","丑":"未","寅":"申","卯":"酉","辰":"戌","巳":"亥"}
OPPOSITES.update({v:k for k,v in OPPOSITES.items()})
MONTH_SOLAR_TERMS = {
    "寅":"立春→惊蛰", "卯":"惊蛰→清明", "辰":"清明→立夏",
    "巳":"立夏→芒种", "午":"芒种→小暑", "未":"小暑→立秋",
    "申":"立秋→白露", "酉":"白露→寒露", "戌":"寒露→立冬",
    "亥":"立冬→大雪", "子":"大雪→小寒", "丑":"小寒→立春"
}

def month_element_relation(month_el: str, line_el: str) -> str:
    if month_el == line_el:
        return "月爻同五行"
    if GENERATES[month_el] == line_el:
        return "月生爻"
    if GENERATES[line_el] == month_el:
        return "爻生月"
    if CONTROLS[month_el] == line_el:
        return "月克爻"
    if CONTROLS[line_el] == month_el:
        return "爻克月"
    raise ValueError("五行关系不可计算")


def decorate_calendar(chart: dict, day_ganzhi: str | None = None,
                      month_branch: str | None = None) -> dict:
    if day_ganzhi is not None and day_ganzhi not in SIXTY_DAYS:
        raise ValueError("日辰必须是六十甲子中的合法干支，例如甲子、庚午。不可把任意天干与地支拼成一天。")
    if month_branch is not None and month_branch not in MONTH_STARTS:
        raise ValueError("节令月支必须是十二地支之一，请按实际交节时刻核实。")

    empty = ()
    spirits = ()
    daily = None
    if day_ganzhi:
        day_index = SIXTY_DAYS.index(day_ganzhi)
        group = day_index // 10
        empty = XUNKONG[group]
        spirits = tuple(SIX_SPIRITS[(FIRST_SPIRIT[day_ganzhi[0]]+i)%6] for i in range(6))
        daily = {
            "ganzhi":day_ganzhi,
            "day_stem":day_ganzhi[0],
            "day_branch":day_ganzhi[1],
            "xun":SIXTY_DAYS[group*10],
            "xunkong":list(empty),
            "liushen_bottom_to_top":list(spirits),
            "source":"用户手动选择六十甲子日；软件尚未核对公历、时区及换日界限。",
        }

    monthly = None
    if month_branch:
        monthly = {
            "branch":month_branch,
            "element":BRANCH_ELEMENT[month_branch],
            "term_window":MONTH_SOLAR_TERMS[month_branch],
            "source":"用户手动确认节令月支；系统未自动测算具体交节时刻。",
        }
    chart["calendar"] = {
        "day":daily,"month":monthly,
        "verification":"manual" if daily or monthly else "not_provided",
        "boundary":"六神据日干、旬空据日旬；月支按节令起止而非公历月或农历初一。未计算历法日期、真正交节、日月旺衰、用神、应期。",
    }

    for key in ("najia_lines","bian_najia_lines"):
        for line in chart[key]:
            idx=line["position"] - 1
            line["liushen"]=spirits[idx] if spirits else None
            line["is_xunkong"]=line["branch"] in empty if daily else None
            line["month_relation"]=month_element_relation(BRANCH_ELEMENT[month_branch],line["element"]) if monthly else None
            line["is_yuechong"]=line["branch"]==OPPOSITES[month_branch] if monthly else None
            line["is_yuejian"]=line["branch"]==month_branch if monthly else None
    return chart
