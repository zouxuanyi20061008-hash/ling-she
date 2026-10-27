"""V63 大六壬六甲旬遁与旬空：仅按起课日的旬，不混入时旬或五子遁。

《大六壬探原·推演篇》：三传既得，遁干须详；以日辰所属旬
十日配干，余两支无干为旬空。天盘各支的遁干/空亡随天盘支走，
地盘本位支的旬空另外标识，不能偷换为同一层含义。
十二天将「天空」是将名，不等于旬空。
"""
from __future__ import annotations

from .calendar import BRANCHES,STEMS,SIXTY_DAYS,XUNKONG

PRIMARY="https://shuyuan.zhiming.life/read/%E5%A4%A7%E5%85%AD%E5%A3%AC%E6%8E%A2%E5%8E%9F%28%E6%8E%A8%E6%BC%94%E7%AF%87%29-%E4%B8%8A/7"
ALT="https://www.zhaosir.online/Books/BookChapterDetail.aspx?did=886"
SOURCE_TABLE="https://www.zhaosir.online/Books/BookChapterDetail.aspx?did=811"


def calculate_xun_dun(day_ganzhi:str)->dict:
    """Map the 10 stems into the 10 used branches of this day's 10-day 旬."""
    if day_ganzhi not in SIXTY_DAYS:
        raise ValueError("日干支必须是六十甲子之一，不能任意拼接")
    day_index=SIXTY_DAYS.index(day_ganzhi)
    xun_index=day_index//10
    first_gz=SIXTY_DAYS[xun_index*10]
    first_branch=first_gz[1]
    first_index=BRANCHES.index(first_branch)
    void=tuple(XUNKONG[xun_index])
    assignments={b:None for b in BRANCHES}
    used=[]
    for i,stem in enumerate(STEMS):
        branch=BRANCHES[(first_index+i)%12]
        assignments[branch]=stem
        used.append({"position":i+1,"branch":branch,"stem":stem,
                     "ganzhi":stem+branch})
        if SIXTY_DAYS[xun_index*10+i]!=stem+branch:
            raise ValueError("六甲旬天干/地支配对与六十甲子不一致")
    missing=tuple(x for x in BRANCHES if assignments[x] is None)
    if set(missing)!=set(void) or len(missing)!=2:
        raise ValueError("旬空须恰为旬内两支未配干地支")
    if assignments[day_ganzhi[1]]!=day_ganzhi[0]:
        raise ValueError("日干不是所属旬中日支对应的旬遁干")
    return {
        "version":"V63",
        "basis":"日旬（非时旬）",
        "day_ganzhi":day_ganzhi,
        "xun_number":xun_index+1,
        "xun_head":first_gz,
        "xun_days":used,
        "empty_branches":list(void),
        "by_branch":assignments,
        "branch_table":[{
           "branch":b,"xun_dun_stem":assignments[b],
           "is_void":b in void,
           "label":("旬空" if b in void else assignments[b]),
        } for b in BRANCHES],
        "stems_assigned_exactly_once":True,
        "source":{"classic":PRIMARY,"independent":ALT,"table":SOURCE_TABLE},
        "day_stem_check":True,
        "interpretation_boundary":"仅为日旬支序的结构对应；不推断真空假空、填实及吉凶",
    }


def decorate_liuren_v63(chart:dict)->dict:
    if chart.get("version")!="V62" or not chart.get("has_real_plates_and_four_lessons"):
        raise ValueError("V63 必须基于 V62 已验证的真实天地盘四课")
    if len(chart["palaces"])!=12 or len(chart["four_lessons"])!=4:
        raise ValueError("十二宫与四课数量不完整")
    datum=calculate_xun_dun(chart["day_ganzhi"])
    m=datum["by_branch"]
    empty=set(datum["empty_branches"])
    sky=chart["heaven_plate"]
    if set(sky)!=set(BRANCHES) or set(sky.values())!=set(BRANCHES):
        raise ValueError("V63 不接受天盘非全排列")
    for p in chart["palaces"]:
        earth,heaven=p["earth"],p["heaven"]
        if sky[earth]!=heaven:
            raise ValueError("天地盘来源不一致")
        p["heaven_xun_dun"]=m[heaven]
        p["heaven_is_void"]=heaven in empty
        p["earth_xun_dun"]=m[earth]
        p["earth_is_void"]=earth in empty
        p["void_annotation_layer"]="heavenly_branch" if heaven in empty else "none"
        # Heavenly general “天空” remains an independently computed symbol.
        p["general_is_distinct_from_xun_void"]=True
    for p in chart["four_lessons"]:
        upper=p["upper"]
        if upper not in m:raise ValueError("四课上神非法")
        p["upper_xun_dun"]=m[upper]
        p["upper_is_void"]=upper in empty
        # 下神可能是日干、或天盘上神、或日支。只标符号本身，不
        # 把其支的本位地盘当成四课下神实际地盘坐标。
        lower=p["lower"]
        p["lower_symbol_xun_dun"]=m[lower] if lower in m else None
        p["lower_symbol_is_void"]=lower in empty if lower in m else None
        p["lower_void_basis"]=("地支符号（非实际下临地盘）"
                               if lower in m else "日干：此项不适用")
    transmissions=chart["three_transmissions"]
    if transmissions["status"]=="computed":
        if len(transmissions["transmissions"])!=3:
            raise ValueError("已定三传须恰为三个地支")
        for p in transmissions["transmissions"]:
            branch=p["branch"]
            if branch not in m:raise ValueError("三传出现非法支")
            p["xun_dun_stem"]=m[branch]
            p["is_xun_void"]=branch in empty
            p["xun_void_label"]="旬空" if branch in empty else None
    elif transmissions.get("transmissions") is not None:
        raise ValueError("未决三传不能伪造遁干或旬空")
    datum["heaven_void_earth_palaces"]=[
        {"earth":p["earth"],"heaven":p["heaven"]}
        for p in chart["palaces"] if p["heaven_is_void"]]
    datum["earth_branch_void_palaces"]=[
        p["earth"] for p in chart["palaces"] if p["earth_is_void"]]
    datum["void_four_lesson_numbers"]=[
        p["number"] for p in chart["four_lessons"] if p["upper_is_void"]]
    datum["void_transmission_names"]=[
        p["name"] for p in transmissions["transmissions"]
        if p["is_xun_void"]] if transmissions["status"]=="computed" else None
    if len(datum["heaven_void_earth_palaces"])!=2 or len(datum["earth_branch_void_palaces"])!=2:
        raise ValueError("天空/地空在十二支映射中各须对应两支")
    chart["xun_void_and_dun"]=datum
    chart["has_xun_void_and_dun"]=True
    chart["version"]="V63"
    chart["transmission_review"]["version"]="V63"
    chart["has_full_nine_methods"]=False
    chart["limits"]=[
        "旬遁干以起课日所属六甲旬推算；十支配十干，另两支为旬空。",
        "天盘上神旬空与地盘本位支旬空分别计算：地盘空亡不可替代天盘上神的旬空。",
        "十二天将中的「天空」为独立将名，绝非六甲旬空；未决三传绝不添加伪造旬遁干。",
        "仅显示传统结构排盘，不判断真空假空、填实、吉凶、健康或现实事件应期。",
    ]
    return chart
