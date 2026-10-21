"""梅花易数：确定性六爻位运算。所有爻按自下而上排序。"""
from __future__ import annotations

from dataclasses import dataclass, asdict

# 三爻顺序：初爻 -> 三爻（底 -> 顶），1 阳爻，0 阴爻。
TRIGRAMS = {
    1: {"name": "乾", "element": "金", "direction": "西北", "family": "父", "lines": (1, 1, 1), "symbol": "☰"},
    2: {"name": "兑", "element": "金", "direction": "西", "family": "少女", "lines": (1, 1, 0), "symbol": "☱"},
    3: {"name": "离", "element": "火", "direction": "南", "family": "中女", "lines": (1, 0, 1), "symbol": "☲"},
    4: {"name": "震", "element": "木", "direction": "东", "family": "长男", "lines": (1, 0, 0), "symbol": "☳"},
    5: {"name": "巽", "element": "木", "direction": "东南", "family": "长女", "lines": (0, 1, 1), "symbol": "☴"},
    6: {"name": "坎", "element": "水", "direction": "北", "family": "中男", "lines": (0, 1, 0), "symbol": "☵"},
    7: {"name": "艮", "element": "土", "direction": "东北", "family": "少男", "lines": (0, 0, 1), "symbol": "☶"},
    8: {"name": "坤", "element": "土", "direction": "西南", "family": "母", "lines": (0, 0, 0), "symbol": "☷"},
}

# 行为上卦、列为下卦；索引均为先天八卦序号 1..8。
HEXAGRAM_NAMES = (
    ("乾", "履", "同人", "无妄", "姤", "讼", "遁", "否"),
    ("夬", "兑", "革", "随", "大过", "困", "咸", "萃"),
    ("大有", "睽", "离", "噬嗑", "鼎", "未济", "旅", "晋"),
    ("大壮", "归妹", "丰", "震", "恒", "解", "小过", "豫"),
    ("小畜", "中孚", "家人", "益", "巽", "涣", "渐", "观"),
    ("需", "节", "既济", "屯", "井", "坎", "蹇", "比"),
    ("大畜", "损", "贲", "颐", "蛊", "蒙", "艮", "剥"),
    ("泰", "临", "明夷", "复", "升", "师", "谦", "坤"),
)

BY_LINES = {info["lines"]: num for num, info in TRIGRAMS.items()}
GENERATES = {"木": "火", "火": "土", "土": "金", "金": "水", "水": "木"}
CONTROLS = {"木": "土", "土": "水", "水": "火", "火": "金", "金": "木"}


def rem_1_to_n(value: int, modulus: int) -> int:
    """余 0 改作 modulus。"""
    if not isinstance(value, int) or isinstance(value, bool) or value <= 0:
        raise ValueError("起卦数必须为正整数")
    return (value - 1) % modulus + 1


def trigram_from_lines(lines: tuple[int, int, int]) -> int:
    return BY_LINES[lines]


def hexagram_from_lines(lines: tuple[int, ...]) -> dict:
    if len(lines) != 6 or any(bit not in (0, 1) for bit in lines):
        raise ValueError("六爻数据无效")
    low = trigram_from_lines(tuple(lines[:3]))
    up = trigram_from_lines(tuple(lines[3:]))
    return {
        "name": HEXAGRAM_NAMES[up - 1][low - 1],
        "upper": TRIGRAMS[up],
        "lower": TRIGRAMS[low],
        "lines_bottom_to_top": list(lines),
    }


def relation(ti_element: str, yong_element: str) -> str:
    if ti_element == yong_element:
        return "比和"
    if GENERATES[yong_element] == ti_element:
        return "用生体"
    if GENERATES[ti_element] == yong_element:
        return "体生用"
    if CONTROLS[yong_element] == ti_element:
        return "用克体"
    if CONTROLS[ti_element] == yong_element:
        return "体克用"
    raise ValueError("未知五行")


def arrange(upper_number: int, lower_number: int, changing_number: int) -> dict:
    """只进行确定性运算；不做任何语言模型推演。"""
    up = rem_1_to_n(upper_number, 8)
    low = rem_1_to_n(lower_number, 8)
    moving = rem_1_to_n(changing_number, 6)
    lines = TRIGRAMS[low]["lines"] + TRIGRAMS[up]["lines"]

    # 二三四爻组成互卦下卦，三四五爻组成互卦上卦。
    hu_lines = tuple(lines[1:4]) + tuple(lines[2:5])
    bian_lines = list(lines)
    bian_lines[moving - 1] ^= 1  # 初爻索引为 0，六爻从底往上。

    # 有动爻的三爻卦为用，另一个为体。
    ti = TRIGRAMS[up] if moving <= 3 else TRIGRAMS[low]
    yong = TRIGRAMS[low] if moving <= 3 else TRIGRAMS[up]

    return {
        "method_numbers": {"upper": upper_number, "lower": lower_number, "moving": changing_number},
        "ben_gua": hexagram_from_lines(lines),
        "hu_gua": hexagram_from_lines(hu_lines),
        "bian_gua": hexagram_from_lines(tuple(bian_lines)),
        "dong_yao": moving,
        "ti_gua": ti,
        "yong_gua": yong,
        "sheng_ke": relation(ti["element"], yong["element"]),
    }