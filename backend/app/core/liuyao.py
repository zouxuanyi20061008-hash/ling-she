"""传统三钱六掷入门：仅确定性推算本卦、动爻与之卦，不假造纳甲六亲等。"""
from __future__ import annotations

from .hexagrams import hexagram_from_lines
from .najia import decorate_six_yao
from .calendar import decorate_calendar

LINE_KIND = {
    6: {"name":"老阴", "symbol":"⚋ ×", "yin_yang":"阴", "changing":True},
    7: {"name":"少阳", "symbol":"⚊", "yin_yang":"阳", "changing":False},
    8: {"name":"少阴", "symbol":"⚋", "yin_yang":"阴", "changing":False},
    9: {"name":"老阳", "symbol":"⚊ ○", "yin_yang":"阳", "changing":True},
}

def cast_six_yao(lines: list[int], day_ganzhi: str | None = None,
                 month_branch: str | None = None) -> dict:
    """lines 从初爻至上爻，数为6/7/8/9。铜钱记分约定：字2、背3。"""
    if len(lines)!=6 or any(type(x) is not int or x not in LINE_KIND for x in lines):
        raise ValueError("请按初爻至上爻顺序，填写六次摇得的 6、7、8、9")
    main_bits = tuple(x % 2 for x in lines)
    changed_bits = tuple(1 - x%2 if x in (6,9) else x%2 for x in lines)
    changing = [i+1 for i,x in enumerate(lines) if x in (6,9)]
    result = {
        "school":"六爻纳甲", "variant":"三钱起卦 · 基础教学",
        "lines": [
            {"position":i+1,"number":v,**LINE_KIND[v]} for i,v in enumerate(lines)
        ],
        "ben_gua":hexagram_from_lines(main_bits),
        "bian_gua":hexagram_from_lines(changed_bits),
        "dong_yao":changing,
        "note":"已计算本变卦、八宫世应、纳甲干支与六亲；输入有效日辰可装六神、旬空，输入节令月支可标记月支关系。日月历法换算、完整旺衰及用神取用尚未实现。",
        "rules":"以三枚铜钱分别记字为2、背为3；三字6为老阴、两字一背7为少阳、两背一字8为少阴、三背9为老阳。第一次为初爻，从下往上记录六次。",
    }
    return decorate_calendar(decorate_six_yao(result), day_ganzhi, month_branch)
