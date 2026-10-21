"""《增删卜易》原神、忌神、仇神五行关系学习层。

只在用户明确选择用神关注对象、且本卦存在相关爻时计算。
「原神」=生用神之行，「忌神」=克用神之行，
「仇神」=克原神而生忌神之行。
计算只标出五行和本卦可见的爻；不对旺衰、动变作用、回头生克作断语。
"""
from __future__ import annotations

from .hexagrams import GENERATES, CONTROLS

ELEMENTS = tuple(GENERATES)
ROLE_DESCRIPTIONS = {
    "用神":"当前由求测者选择关注的爻位；如同类多现仍属候选，并非自动择用。",
    "原神":"五行上生用神。能否实际生扶，需要另查旺衰、动静与日月等。",
    "忌神":"五行上克用神。是否实际成克，需要另查旺衰、动静与日月等。",
    "仇神":"五行上克原神、生忌神。此术语不是指现实中有仇人。",
}


def _inverted(mapping: dict[str,str], target: str) -> str:
    return next(key for key,val in mapping.items() if val == target)


def relation_elements(yong_element: str) -> dict[str,str]:
    """所有五行必须恰好形成一条无歧义的取用关系。"""
    if yong_element not in ELEMENTS:
        raise ValueError("未知的用神五行")
    yuan = _inverted(GENERATES, yong_element)
    ji = _inverted(CONTROLS, yong_element)
    chou = _inverted(GENERATES, ji)
    if CONTROLS[chou] != yuan:
        raise ValueError("仇神关系不同时满足生忌神、克原神")
    return {"用神":yong_element, "原神":yuan, "忌神":ji, "仇神":chou}


def _represent(row: dict) -> dict:
    return {
        "position": row["position"], "ganzhi":row["ganzhi"],
        "liuqin":row["liuqin"], "element":row["element"],
        "moving":bool(row["moving"]),
        "is_xunkong":row.get("is_xunkong"),
        "is_yuejian":row.get("is_yuejian"),
        "is_yuechong":row.get("is_yuechong"),
    }


def decorate_spirit_relations(chart: dict) -> dict:
    focus = chart.get("focus")
    if not focus:
        chart["spirit_relations"] = None
        return chart
    target_positions = set(focus["primary_positions"])
    if not target_positions:
        chart["spirit_relations"] = {
            "status":"not_visible",
            "basis":focus["category"],
            "roles":{},
            "note":"本卦不现所选对象的六亲；暂无明确的本卦用神爻位，因此不生成卦内原神、忌神与仇神位置。不得编造伏神。",
            "reference":"https://zh.wikisource.org/zh-hans/增删卜易/9",
        }
        return chart

    ben=chart["najia_lines"]
    focus_elements={line["element"] for line in ben if line["position"] in target_positions}
    if len(focus_elements)!=1:
        raise ValueError("所选用神候选出现多种五行，无法统一定位原忌仇神")
    target_element=focus_elements.pop()
    elemental=relation_elements(target_element)
    roles={}
    for name,element in elemental.items():
        relevant=[line for line in ben if line["element"]==element and
                  (name!="用神" or line["position"] in target_positions)]
        roles[name]={
            "element":element,
            "description":ROLE_DESCRIPTIONS[name],
            "positions":[r["position"] for r in relevant],
            "moving_positions":[r["position"] for r in relevant if r["moving"]],
            "lines":[_represent(r) for r in relevant],
            "visible":bool(relevant),
        }
    transformed=[_represent(line) for line in chart["bian_najia_lines"]
                 if line["position"] in chart["dong_yao"]]
    chart["spirit_relations"]={
        "status":"ready",
        "basis":focus["category"],
        "focus_positions":sorted(target_positions),
        "focus_element":target_element,
        "source":"用户选择的本卦六亲或世应爻位",
        "roles":roles,
        "moving_transforms":transformed,
        "note":"这里展示的是本卦可见爻的基本五行关系。动爻变出何支另列以便核对；未计算伏神、回头生克、日月旺衰、用神强弱或应期，不据此断吉凶。",
        "reference":"https://zh.wikisource.org/zh-hans/增删卜易/9",
    }
    return chart
