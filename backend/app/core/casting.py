"""确定性起卦：阴阳拆字、数字起卦及独体阴数方案。"""
from __future__ import annotations
from datetime import datetime
import re
from typing import Literal
from .hexagrams import arrange
from .strokes import split_character, is_hanzi, load_data



class ObservationNeedsNumbers(ValueError):
    """求测者提供任意起卦契机，必须有明确取数依据。"""


def earthly_hour(now: datetime) -> int:
    """子=1, 丑=2 ... 亥=12；必须传明确时区的时间。"""
    if now.tzinfo is None or now.utcoffset() is None:
        raise ValueError("时间须携带时区，例如 2026-10-22T23:00:00+08:00")
    return ((now.hour + 1) // 2) % 12 + 1


def cast(value: str, at: datetime, manual_strokes: tuple[int, int] | None = None,
         independent_yin: Literal["one", "hour"] = "one",
         manual_structure: str | None = None,
         manual_parts: tuple[str, str] | None = None,
         observation_numbers: tuple[int, int] | None = None,
         observation_reason: str | None = None) -> dict:
    value = value.strip()
    if not value:
        raise ValueError("请输入汉字或数字")
    if independent_yin not in ("one", "hour"):
        raise ValueError("独体阴数只能选择 one 或 hour")
    if observation_numbers is not None:
        if not all(type(n) is int and 0 < n <= 99999999 for n in observation_numbers):
            raise ValueError("自定取数必须填写两组 1～99999999 的正整数")
        reason = (observation_reason or "").strip()
        if len(reason) < 4:
            raise ValueError("自定取数请说明两个数来自什么观察或取象依据，不能让 AI 凭空编数")
        a, b = observation_numbers
        moving_number = a + b
        origin = {
            "method": "observation-confirmed", "observation": value,
            "structure": "自由取象", "yang_part": "上卦自定数", "yin_part": "下卦自定数",
            "yang_strokes": a, "yin_strokes": b, "first_number": a, "second_number": b,
            "yin_yang_rule": "用户自行根据所见所感取两数；第一数为上卦，第二数为下卦",
            "moving_basis": "两数之和", "observation_reason": reason,
            "source": "求测者提供并确认的取数依据，尚未经核验",
        }
    elif manual_strokes is not None:
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
    elif len(value) == 2 and all(is_hanzi(ch) for ch in value):
        # 两字起卦：前一字为上、后一字为下，均用唯一整字笔画。
        _ids, counts = load_data()
        options = [counts.get(ch, ()) for ch in value]
        if any(len(items) != 1 or items[0] <= 0 for items in options):
            raise ObservationNeedsNumbers("这两个字的笔画在数据库中有缺失或歧义，请自行确认两字取数")
        a, b = options[0][0], options[1][0]
        moving_number = a + b
        origin = {
            "method": "hanzi-pair", "structure": "两字取数", "observation": value,
            "yang_part": value[0], "yin_part": value[1],
            "yang_strokes": a, "yin_strokes": b,
            "first_strokes": a, "second_strokes": b, "total_strokes": moving_number,
            "moving_basis": "两字总笔画之和",
            "yin_yang_rule": "本体系的两字取数约定：前字为上卦，后字为下卦",
            "source": "CJKVI 整字笔画（唯一记录）",
            "stroke_policy": "按整字简体常用笔画取数；不对两字分别作阴阳拆字",
        }
    elif is_hanzi(value):
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
    else:
        raise ObservationNeedsNumbers(
            "所见所感都可以作为起卦契机，但这段内容没有唯一的自动取数方法。请确认两个数及其取数依据。"
        )
    return {"origin": origin, **arrange(a, b, moving_number)}