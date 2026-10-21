"""京房八宫、世应、纳甲、六亲的确定性装卦基础。
初爻至上爻自下而上编号。与梅花体用计算完全独立。

京房八宫及世应：各宫本宫、一至五世、游魂、归魂，定世应。
浑天纳甲：内三爻取下卦内纳甲，外三爻取上卦外纳甲。
六亲以本卦的卦宫五行为「我」，不取上卦五行、也不借用梅花体用。
目前六神、旬空及月支辅助标记由独立日辰模块在用户确认后生成；
尚未自动核对真实历法、伏神与完整旺衰。
"""
from __future__ import annotations

from .hexagrams import TRIGRAMS, BY_LINES, GENERATES, CONTROLS, hexagram_from_lines

BRANCH_ELEMENT = {
    "子":"水","丑":"土","寅":"木","卯":"木","辰":"土","巳":"火",
    "午":"火","未":"土","申":"金","酉":"金","戌":"土","亥":"水",
}
# 从下往上，六宫通行浑天纳甲表。内卦按初二三，外卦按四五上。
NAJIA = {
    1: {"inner":("甲子","甲寅","甲辰"),"outer":("壬午","壬申","壬戌")},
    2: {"inner":("丁巳","丁卯","丁丑"),"outer":("丁亥","丁酉","丁未")},
    3: {"inner":("己卯","己丑","己亥"),"outer":("己酉","己未","己巳")},
    4: {"inner":("庚子","庚寅","庚辰"),"outer":("庚午","庚申","庚戌")},
    5: {"inner":("辛丑","辛亥","辛酉"),"outer":("辛未","辛巳","辛卯")},
    6: {"inner":("戊寅","戊辰","戊午"),"outer":("戊申","戊戌","戊子")},
    7: {"inner":("丙辰","丙午","丙申"),"outer":("丙戌","丙子","丙寅")},
    8: {"inner":("乙未","乙巳","乙卯"),"outer":("癸丑","癸亥","癸酉")},
}
STAGES = ("本宫","一世","二世","三世","四世","五世","游魂","归魂")
SHI_POSITIONS = (6,1,2,3,4,5,4,3)


def _palace_map() -> dict[tuple[int,...],dict]:
    found={}
    for trigram_num,pure in TRIGRAMS.items():
        bits=list(pure["lines"]*2)
        for index in range(8):
            if index in (1,2,3,4,5):
                bits[index-1]^=1
            elif index==6:
                bits[3]^=1
            elif index==7:
                for j in (0,1,2):bits[j]^=1
            key=tuple(bits)
            if key in found:
                raise RuntimeError("八宫出现重复卦象，请检查世次规则")
            shi=SHI_POSITIONS[index]
            found[key]={
                "palace":pure["name"],
                "palace_element":pure["element"],
                "palace_num":trigram_num,
                "order":index,
                "stage":STAGES[index],
                "shi_position":shi,
                "ying_position":(shi+2)%6+1, # 世初应四、世四应初
            }
    if len(found)!=64:
        raise RuntimeError(f"京房八宫应为六十四卦，实际 {len(found)}")
    return found

PALACE_BY_LINES=_palace_map()


def relation_to_palace(palace_element: str, line_element: str) -> str:
    if line_element==palace_element:return "兄弟"
    if GENERATES[line_element]==palace_element:return "父母"
    if GENERATES[palace_element]==line_element:return "子孙"
    if CONTROLS[palace_element]==line_element:return "妻财"
    if CONTROLS[line_element]==palace_element:return "官鬼"
    raise ValueError("六亲五行关系无效")


def najia_for_lines(lines: tuple[int,...], palace_element: str) -> list[dict]:
    low=BY_LINES[tuple(lines[:3])]
    up=BY_LINES[tuple(lines[3:])]
    stems_branches=NAJIA[low]["inner"]+NAJIA[up]["outer"]
    return [
        {
            "position":i+1,
            "ganzhi":item,
            "stem":item[0],
            "branch":item[1],
            "element":BRANCH_ELEMENT[item[1]],
            "liuqin":relation_to_palace(palace_element,BRANCH_ELEMENT[item[1]]),
            "trigram":TRIGRAMS[low if i<3 else up]["name"]
        }
        for i,item in enumerate(stems_branches)
    ]


def decorate_six_yao(base: dict) -> dict:
    ben_bits=tuple(base["ben_gua"]["lines_bottom_to_top"])
    changed_bits=tuple(base["bian_gua"]["lines_bottom_to_top"])
    palace=dict(PALACE_BY_LINES[ben_bits])
    changed_palace=dict(PALACE_BY_LINES[changed_bits])
    ben_najia=najia_for_lines(ben_bits,palace["palace_element"])
    bian_najia=najia_for_lines(changed_bits,palace["palace_element"])
    for row in ben_najia:
        row["role"]="世" if row["position"]==palace["shi_position"] else "应" if row["position"]==palace["ying_position"] else ""
        row["moving"]=row["position"] in base["dong_yao"]
    for row in bian_najia:
        row["moving"]=row["position"] in base["dong_yao"]
    base["eight_palaces"]={
        "ben":palace,
        "bian":changed_palace,
        "rule":"本卦分宫定本卦世应，八宫序次依本宫、一至五世、游魂、归魂。变卦所属宫可供学习对照，但不移用作本卦世应。",
    }
    base["najia_lines"]=ben_najia
    base["bian_najia_lines"]=bian_najia
    base["najia_note"]="已据浑天纳甲配本卦和变卦干支；本卦及变爻六亲均以本卦卦宫五行为参照。六神、旬空与月支辅助标记需由求测者确认日辰或节令月支后另行推导；用神与旺衰仍未实现。"
    base["documentation"]=[
        {"title":"八宫与世应","url":"https://www.guyujian.cn/learn/liuyao/05"},
        {"title":"传统纳甲表","url":"https://shunshi.ai/zh-cn/wiki/liuyao/zhuangua/najia"},
    ]
    return base
