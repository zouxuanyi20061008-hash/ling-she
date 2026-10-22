"""传统三钱六掷与纳甲教学：八宫、飞伏、日月、动变均以确定性规则计算，不假造实战断语。"""
from __future__ import annotations

from .hexagrams import hexagram_from_lines
from .najia import decorate_six_yao
from .calendar import decorate_calendar
from .yongshen import focus_six_yao
from .spirit_relations import decorate_spirit_relations
from .fushen import decorate_hidden_spirits
from .dynamics import decorate_line_dynamics
from .moving_season import decorate_moving_and_seasons
from .conflict_review import decorate_conflicts_and_focus_review

LINE_KIND = {
    6: {"name":"老阴", "symbol":"⚋ ×", "yin_yang":"阴", "changing":True},
    7: {"name":"少阳", "symbol":"⚊", "yin_yang":"阳", "changing":False},
    8: {"name":"少阴", "symbol":"⚋", "yin_yang":"阴", "changing":False},
    9: {"name":"老阳", "symbol":"⚊ ○", "yin_yang":"阳", "changing":True},
}

def cast_six_yao(lines: list[int], day_ganzhi: str | None = None,
                 month_branch: str | None = None, focus_liuqin: str | None = None) -> dict:
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
        "note":"已计算本变卦、八宫世应、纳甲干支与六亲；输入有效日辰可装六神、旬空，输入节令月支可标记月支关系。日月历法换算、完整旺衰及最终用神取舍尚未实现；选定关注对象后可查本卦可见的原神、忌神、仇神五行关系；本卦缺失六亲可按八宫首卦装伏神、辨飞伏。已增加日月对各爻的五行、冲合标记，以及动爻本位的回头生克冲合；新增动爻对其他本卦爻的静态生克冲合、节令月支的旺相余气休囚概览；新增日冲的暗动/日破候选、月破条件复核与用神证据汇总；完整旺衰与应期仍未自动判断。",
        "rules":"以三枚铜钱分别记字为2、背为3；三字6为老阴、两字一背7为少阳、两背一字8为少阴、三背9为老阳。第一次为初爻，从下往上记录六次。",
    }
    return decorate_conflicts_and_focus_review(
        decorate_moving_and_seasons(
            decorate_line_dynamics(
                decorate_hidden_spirits(
                    decorate_spirit_relations(
                        focus_six_yao(
                            decorate_calendar(decorate_six_yao(result), day_ganzhi, month_branch),
                            focus_liuqin))))))
