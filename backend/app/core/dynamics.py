"""六爻 V9：日月对爻关系，动爻与本位变爻的回头生克冲合。

规则取自《增删卜易》日辰、月将、六合、动变生克冲合章。
日辰/月建在本站必须经用户手工确认；本模块不进行公历换算。
本模块只呈现可验证的干支、五行和六冲六合标签，并不根据单一
标签宣称旺衰、吉凶或暗动成立。不同性质的标签可同时存在。
"""
from __future__ import annotations

from .calendar import OPPOSITES
from .najia import BRANCH_ELEMENT
from .hexagrams import GENERATES, CONTROLS

LIUHE_PAIRS = (("子","丑"),("寅","亥"),("卯","戌"),
              ("辰","酉"),("巳","申"),("午","未"))
LIUHE = {a:b for a,b in LIUHE_PAIRS} | {b:a for a,b in LIUHE_PAIRS}

SOURCE_PAGES = {
    "day_month":"https://www.shidianguji.com/book/XYXZSBY/chapter/1laba3s8ovar2",
    "liuhe":"https://zh.wikisource.org/zh-hans/增删卜易/19",
    "moving":"https://www.quanxue.cn/qt_mingxiang/zengshanpy/zengshanpy16.html",
}


def element_action(source: str, target: str, source_name: str, target_name: str) -> str:
    if source==target:
        return f"{source_name}{target_name}同五行"
    if GENERATES[source]==target:
        return f"{source_name}生{target_name}"
    if GENERATES[target]==source:
        return f"{target_name}生{source_name}"
    if CONTROLS[source]==target:
        return f"{source_name}克{target_name}"
    if CONTROLS[target]==source:
        return f"{target_name}克{source_name}"
    raise ValueError("无效的五行关系")


def branch_relation(source_branch: str, target_branch: str,
                    source_name: str, target_name: str) -> dict:
    source_el=BRANCH_ELEMENT[source_branch]
    target_el=BRANCH_ELEMENT[target_branch]
    same=source_branch==target_branch
    clash=OPPOSITES[source_branch]==target_branch
    combine=LIUHE[source_branch]==target_branch
    return {
        "source_branch":source_branch,
        "target_branch":target_branch,
        "source_element":source_el,
        "target_element":target_el,
        "same_branch":same,
        "clash":clash,
        "combine":combine,
        "element_relation":element_action(source_el,target_el,source_name,target_name),
        "tags":(
            ([f"{source_name}临{target_name}"] if same else [])
            + ([f"{source_name}冲{target_name}"] if clash else [])
            + ([f"{source_name}合{target_name}"] if combine else [])
        ),
    }


def _returning_relation(base: dict, transformed: dict) -> dict:
    # Only transformed at this same position can "回头"生克冲合 this moving line.
    data=branch_relation(transformed["branch"],base["branch"],"变爻","动爻")
    element=data["element_relation"]
    if element=="变爻生动爻": term="回头生"
    elif element=="变爻克动爻": term="回头克"
    elif element=="动爻生变爻": term="动爻生变爻"
    elif element=="动爻克变爻": term="动爻克变爻"
    else: term="五行比和"
    tags=[term]
    if data["clash"]:tags.append("回头冲")
    if data["combine"]:tags.append("回头合")
    if data["same_branch"]:tags.append("动变同支")
    return {
        "position":base["position"],
        "moving":{"ganzhi":base["ganzhi"],"branch":base["branch"],
                  "element":base["element"],"liuqin":base["liuqin"]},
        "transformed":{"ganzhi":transformed["ganzhi"],"branch":transformed["branch"],
                       "element":transformed["element"],"liuqin":transformed["liuqin"]},
        "five_element_relation":element,
        "term":term,
        "returning_clash":data["clash"],
        "returning_combine":data["combine"],
        "tags":tags,
        "limitation":"变爻只与本位动爻比较，不在本模块跨爻生克。静态关系不代表实际生克成败。",
    }


def decorate_line_dynamics(chart: dict) -> dict:
    calendar=chart["calendar"]
    day=calendar["day"]["day_branch"] if calendar["day"] else None
    month=calendar["month"]["branch"] if calendar["month"] else None
    changing=set(chart["dong_yao"])
    movements=[]
    for original,transformed in zip(chart["najia_lines"],chart["bian_najia_lines"]):
        position=original["position"]
        for name,row in (("本卦",original),("变卦",transformed)):
            row["day_action"]=branch_relation(day,row["branch"],"日辰","爻") if day else None
            row["month_action"]=branch_relation(month,row["branch"],"月建","爻") if month else None
            row["day_clash"]=row["day_action"]["clash"] if day else None
            row["day_combine"]=row["day_action"]["combine"] if day else None
            row["month_combine"]=row["month_action"]["combine"] if month else None
            row["month_break_marker"]=row["month_action"]["clash"] if month else None
        # The six transformed rows may have new NAJIA even if no line moves.
        # A transformed branch is not an active "变爻" without a moving coin line.
        original["turnback"]=None
        transformed["turnback"]=None
        if position in changing:
            movement=_returning_relation(original,transformed)
            movements.append(movement)
            original["turnback"]=movement
            transformed["turnback"]=movement

    chart["line_dynamics"]={
        "day_branch":day,
        "month_branch":month,
        "movements":movements,
        "moving_positions":sorted(changing),
        "method":"日月可作用本、变爻；只有动爻本位变化形成回头生克冲合，静爻不产生回头关系。",
        "calendar_boundary":"日辰和节令月支来自用户选择，未经公历/交节核验；若未提供，则对应标签为未计算。",
        "interpretation_boundary":"月冲标为月破条件，日冲只标冲，不自动判暗动或日破。冲与合可与五行生克并列；不得用单一标签决定旺衰、吉凶或应期。",
        "sources":SOURCE_PAGES,
    }
    return chart
