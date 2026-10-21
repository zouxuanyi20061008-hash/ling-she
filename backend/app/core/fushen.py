"""京房八宫本宫卦伏神装配：不现六亲向本宫首卦寻伏，按同一爻位认飞神。

《增删卜易》飞伏神章：天风姤的妻财甲寅木伏于二爻辛亥水之下；
天山遁的子孙甲子水伏于初爻丙辰土之下。

只机械装配伏神位置及飞伏五行关系。不选择最佳伏神、不把有伏神当
已确定用神；日辰月建是否可作取用仍需另行讨论，绝不据此断吉凶。
"""
from __future__ import annotations

from .hexagrams import TRIGRAMS, GENERATES, CONTROLS, hexagram_from_lines
from .najia import BRANCH_ELEMENT, najia_for_lines

FIVE_RELATIVES = ("父母", "官鬼", "兄弟", "妻财", "子孙")
ORIGINAL = "https://www.shidianguji.com/book/XYXZSBY/chapter/1lzxsny7d9s7d"


def flying_hidden_relation(flying_element: str, hidden_element: str) -> str:
    if flying_element == hidden_element:
        return "飞伏比和"
    if GENERATES[flying_element] == hidden_element:
        return "飞生伏"
    if GENERATES[hidden_element] == flying_element:
        return "伏生飞"
    if CONTROLS[flying_element] == hidden_element:
        return "飞克伏"
    if CONTROLS[hidden_element] == flying_element:
        return "伏克飞"
    raise ValueError("五行关系有误")


def _as_line(line: dict) -> dict:
    return {
        "position": line["position"],
        "ganzhi": line["ganzhi"],
        "branch": line["branch"],
        "element": line["element"],
        "liuqin": line["liuqin"],
    }


def decorate_hidden_spirits(chart: dict) -> dict:
    palace = chart["eight_palaces"]["ben"]
    palace_info = TRIGRAMS[palace["palace_num"]]
    pure_lines = palace_info["lines"] * 2
    pure_najia = najia_for_lines(pure_lines, palace["palace_element"])
    main = chart["najia_lines"]
    present = {row["liuqin"] for row in main}
    missing = [relative for relative in FIVE_RELATIVES if relative not in present]
    entries_by_relative = {}

    # Place each absent relative at its exact position in the pure palace hexagram.
    # Never substitute the flying hexagram's own six-relative for the hidden relative.
    for relative in missing:
        candidates = []
        for hidden in pure_najia:
            if hidden["liuqin"] != relative:
                continue
            position = hidden["position"]
            flying = main[position - 1]
            candidates.append({
                "position": position,
                "hidden": _as_line(hidden),
                "flying": {**_as_line(flying), "moving": flying["moving"]},
                "flying_hidden_relation": flying_hidden_relation(
                    flying["element"], hidden["element"]
                ),
            })
        if not candidates:
            raise RuntimeError(f"本宫纯卦未出现{relative}，请复核纳甲表")
        entries_by_relative[relative] = candidates

    for line in main:
        line["fushen"] = [
            {"liuqin":relative,
             "ganzhi":entry["hidden"]["ganzhi"],
             "element":entry["hidden"]["element"],
             "relation":entry["flying_hidden_relation"]}
            for relative,entries in entries_by_relative.items()
            for entry in entries if entry["position"] == line["position"]
        ]

    focus = chart.get("focus")
    selected = None
    if focus:
        name = focus["category"]
        if focus["is_position"]:
            selected = {
                "status":"position_only", "category":name, "entries":[],
                "note":"世爻和应爻是本卦的位置角色，不是缺失的六亲，无须另装伏神。",
            }
        elif name in entries_by_relative:
            hidden_element = entries_by_relative[name][0]["hidden"]["element"]
            day = chart["calendar"]["day"]
            month = chart["calendar"]["month"]
            selected = {
                "status":"hidden_in_palace", "category":name,
                "entries":entries_by_relative[name],
                "day_month_review":{
                    "element":hidden_element,
                    "day_branch":day["day_branch"] if day else None,
                    "day_same_element":(
                        BRANCH_ELEMENT[day["day_branch"]] == hidden_element if day else None
                    ),
                    "month_branch":month["branch"] if month else None,
                    "month_same_element":(
                        month["element"] == hidden_element if month else None
                    ),
                    "note":"古籍有先从日月求用之说。此处仅比较手动确认的日支、月支五行；并未自动确定是否应以日月取用。",
                },
                "note":"本卦不现此六亲，已按八宫本宫首卦找到同位伏神和本卦飞神。多候选均列出；飞伏生克仅为五行基本关系，不代表实战能否生克。",
            }
        else:
            selected = {
                "status":"visible", "category":name, "entries":[],
                "note":"该六亲已经出现在本卦，通常先看明现的用神候选，此处不额外编造伏神。",
            }

    chart["fushen"] = {
        "pure_hexagram":hexagram_from_lines(pure_lines)["full_name"],
        "palace":palace["palace"],
        "palace_element":palace["palace_element"],
        "missing_relatives":missing,
        "by_relative":entries_by_relative,
        "selected":selected,
        "method":"缺失六亲从本宫首卦寻之；按相同爻位安伏，当前本卦该爻为飞神。",
        "boundary":"此模块只装明伏和飞伏五行关系；未定实际用神、飞伏旺衰、日月应期、出伏和伏神可用与否。",
        "reference":ORIGINAL,
    }
    return chart
