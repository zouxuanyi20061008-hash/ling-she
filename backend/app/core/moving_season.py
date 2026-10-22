"""六爻 V10：动爻对本卦其他爻的静态生克冲合、节令五行提纲。

据《增删卜易》「四处生克冲合」「动变生克冲合」「四时旺相」。
仅计算已确认月支条件下的概览，不自动推断日破/暗动/用神吉凶。
特别避免把「四时旺相」当作精确的「旺相休囚死」五分法，
因为原典土月还有余气等细节；休囚不再细分为休/囚/死。
"""
from __future__ import annotations

from .dynamics import branch_relation
from .hexagrams import GENERATES

SEASONAL_RULES={
    "寅":("木","火",None), "卯":("木","火",None),
    "辰":("土","金","木"),
    "巳":("火","土",None), "午":("火","土",None),
    "未":("土","金","火"),
    "申":("金","水",None), "酉":("金","水",None),
    "戌":("土","金",None),
    "亥":("水","木",None), "子":("水","木",None),
    "丑":("土","金","水"),
}
SEASONAL_SOURCE="https://www.shidianguji.com/book/XYXZSBY/chapter/1lzxsn553lws2"
MOVING_SOURCE="https://www.shidianguji.com/book/XYXZSBY/chapter/1lzxsn553lk4y"
FOUR_ACTIONS_SOURCE="https://www.shidianguji.com/book/XYXZSBY/chapter/1laba3s8ovar2"
SEASONAL_ORDER=("木","火","土","金","水")


def season_for_element(month_branch: str, element: str) -> dict:
    if month_branch not in SEASONAL_RULES or element not in GENERATES:
        raise ValueError("月支或五行不存在于校勘表")
    prosperous, supporting, residue=SEASONAL_RULES[month_branch]
    grade=("旺" if element==prosperous else
           "相" if element==supporting else
           "余气" if element==residue else
           "休囚（未细分）")
    return {
        "element":element, "grade":grade,
        "month_branch":month_branch,
        "basis":("依《增删卜易》四时旺相章的月令五行概要分类；"
                 "不包含日辰、动静、变爻、旬空、月冲和具体旺衰综合判断。"),
    }


def _moving_effect(source: dict, target: dict) -> dict:
    relation=branch_relation(source["branch"],target["branch"],"动爻","本卦爻")
    return {
        "source_position":source["position"],
        "target_position":target["position"],
        "source_ganzhi":source["ganzhi"],
        "target_ganzhi":target["ganzhi"],
        "source_element":source["element"],
        "target_element":target["element"],
        "target_moving":bool(target["moving"]),
        "element_relation":relation["element_relation"],
        "clash":relation["clash"],
        "combine":relation["combine"],
        "same_branch":relation["same_branch"],
        "tags":relation["tags"],
        "scope":"仅对本卦目标爻进行静态比较；不可据此直接断作用强弱、吉凶与应期。",
    }


def decorate_moving_and_seasons(chart: dict) -> dict:
    ben=chart["najia_lines"]
    bian=chart["bian_najia_lines"]
    movers=[line for line in ben if line["moving"]]
    influences=[]
    for source in movers:
        for target in ben:
            if source["position"]==target["position"]:
                continue
            influences.append(_moving_effect(source,target))

    month=chart["calendar"]["month"]
    branch=month["branch"] if month else None
    season_table=[season_for_element(branch,el) for el in SEASONAL_ORDER] if branch else []

    for key in ("najia_lines","bian_najia_lines"):
        for line in chart[key]:
            line["seasonal_status"]=season_for_element(branch,line["element"]) if branch else None

    chart["moving_influences"]={
        "moving_positions":[line["position"] for line in movers],
        "edges":influences,
        "rule":"只有本卦动爻对本卦其他爻逐位列出生克与冲合；变爻只能回头作用本位动爻，其他爻不能跨位作用变爻。",
        "limit":"本图列的是静态作用方向，不包含日月下的实际作用强弱；不计算合绊、暗动、动爻入墓或结果吉凶。",
        "source":MOVING_SOURCE,
        "four_actions_source":FOUR_ACTIONS_SOURCE,
    }
    chart["seasonal_outline"]={
        "month_branch":branch,
        "grades":season_table,
        "visible":bool(branch),
        "system":"《增删卜易》四时旺相章之节令概要（含余气）",
        "rule":"木月木旺火相；火月火旺土相；金月金旺水相；水月水旺木相；辰未戌丑土月土旺金相，并保留辰木、未火、丑水余气提示。",
        "limit":"休囚合并而不假造精确的休、囚、死层级；这不是最终的六爻旺衰定论，不考虑日辰和动变等综合因素。",
        "source":SEASONAL_SOURCE,
    }
    return chart
