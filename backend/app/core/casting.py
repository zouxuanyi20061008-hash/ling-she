"""确定性起卦：阴阳拆字、数字起卦及独体阴数方案。"""
from __future__ import annotations
from datetime import datetime
import re
from typing import Literal
from .hexagrams import arrange
from .strokes import split_character, is_hanzi


def earthly_hour(now: datetime) -> int:
    """子=1, 丑=2 ... 亥=12；必须传明确时区的时间。"""
    if now.tzinfo is None or now.utcoffset() is None:
        raise ValueError("时间须携带时区，例如 2026-10-22T23:00:00+08:00")
    return ((now.hour + 1) // 2) % 12 + 1


def cast(value: str, at: datetime, manual_strokes: tuple[int, int] | None = None,
         independent_yin: Literal["one", "hour"] = "one",
         manual_structure: str | None = None,
         manual_parts: tuple[str, str] | None = None) -> dict:
    value = value.strip()
    if not value:
        raise ValueError("请输入汉字或数字")
    if independent_yin not in ("one", "hour"):
        raise ValueError("独体阴数只能选择 one 或 hour")
    if manual_strokes is not None:
        if (not is_hanzi(value)
                or not all(type(n) is int and 0 < n <= 100 for n in manual_strokes)):
            raise ValueError("手动模式仅接受单字和两组 1～100 的正整数笔画")
        a, b = manual_strokes
        structure = manual_structure or "人工归类"
        moving_number = a if structure == "独体" else a + b
        origin = {
            "method": "hanzi-manual", "character": value, "structure": structure,
            "yang_part": (manual_parts[0].strip() if manual_parts and manual_parts[0].strip() else "用户指定阳部"),
            "yin_part": (manual_parts[1].strip() if manual_parts and manual_parts[1].strip() else "用户指定阴部"),
            "yang_strokes": a, "yin_strokes": b,
            "first_strokes": a, "second_strokes": b,
            "total_strokes": moving_number, "moving_basis": "整字总笔画" if structure == "独体" else "阳部 + 阴部笔画",
            "yin_yang_rule": "人工确认：阳作上卦，阴作下卦",
            "stroke_policy": "用户手动确认，未由模型计算", "source": "用户人工确认",
        }
    elif re.fullmatch(r"[0-9]+\s*[,，/、 ]\s*[0-9]+", value):
        a, b = map(int, re.split(r"\s*[,，/、 ]\s*", value))
        if not (0 < a <= 99999999 and 0 < b <= 99999999):
            raise ValueError("两个起卦数需为 1～99999999")
        moving_number = a + b
        origin = {"method": "number-pair", "first_number": a, "second_number": b,
                  "yang_strokes": a, "yin_strokes": b,
                  "yin_yang_rule": "第一个数作上卦，第二个数作下卦", "moving_basis": "两数之和"}
    elif re.fullmatch(r"[0-9]+", value):
        a = int(value)
        if not 0 < a <= 99999999:
            raise ValueError("起卦数需为 1～99999999")
        b = earthly_hour(at)
        moving_number = a + b
        origin = {"method": "number-hour", "first_number": a, "earthly_hour_number": b,
                  "yang_strokes": a, "yin_strokes": b,
                  "yin_yang_rule": "输入数作上卦，时辰数作下卦", "moving_basis": "两数之和",
                  "input_time": at.isoformat()}
    else:
        origin = {"method": "hanzi-auto", **split_character(value)}
        a = origin["yang_strokes"]
        b = origin["yin_strokes"]
        if origin["structure"] == "独体":
            b = 1 if independent_yin == "one" else earthly_hour(at)
            origin["yin_strokes"] = b
            origin["second_strokes"] = b
            origin["yin_part"] = "默认数 1" if independent_yin == "one" else "当前时辰数"
            origin["stroke_policy"] += "；阴数取 " + ("1" if independent_yin == "one" else "时辰")
            origin["independent_yin_mode"] = independent_yin
        moving_number = origin["total_strokes"]  # 独体：只取整字笔画数，不把阴默认值加进动爻
    return {"origin": origin, **arrange(a, b, moving_number)}