"""六爻 V17：六合合起/合绊、日墓/动墓/化墓、逢绝的条件审议。

《增删卜易》六合章、随鬼入墓章；《卜筮正宗》绝处逢生克处逢生论。
只计算传统规则的可核对关系，不自动断成败、出墓、合化或应期。
土五行墓绝寄宫依本文所据约定（土墓辰，土绝巳），有其他流派差异。
"""
from __future__ import annotations

from .dynamics import LIUHE

TOMBS={"木":"未","火":"戌","土":"辰","金":"丑","水":"辰"}
EXTINCTIONS={"木":"申","火":"亥","土":"巳","金":"寅","水":"巳"}
REFERENCES={
 "liuhe":"https://zh.wikisource.org/zh-hans/增删卜易/19",
 "three_tombs":"https://www.shidianguji.com/book/XYXZSBY/chapter/1lzxsny7dahhl",
 "extinction":"https://libokang.com/classics/liuyao/%E5%8D%9C%E7%AD%AE%E6%AD%A3%E5%AE%97/",
}
SCOPE="这里只标识古籍规则条件，不判合绊是否实际成立、合化、墓库开闭、绝处逢生的实际效力、旺衰、吉凶或应期。"


def _item(kind:str,source:str,detail:str,other_position:int|None=None)->dict:
    return {"kind":kind,"source":source,"detail":detail,"other_position":other_position,
            "status":"candidate_only"}


def _row(row:dict,changed:dict,chart:dict)->dict:
    position=row["position"]
    branch=row["branch"]
    element=row["element"]
    moving=row["moving"]
    day=chart["calendar"]["day"]
    month=chart["calendar"]["month"]
    day_branch=day["day_branch"] if day else None
    month_branch=month["branch"] if month else None
    tomb=TOMBS[element]
    extinction=EXTINCTIONS[element]
    combinations=[]
    tombs=[]
    extinctions=[]
    pending=[]

    for name,b in (("日辰",day_branch),("月建",month_branch)):
        if b is None:
            pending.append("未确认"+name+"，相关六合/墓绝条件不计算")
            continue
        if LIUHE[branch]==b:
            combinations.append(_item("动逢合·合绊候选" if moving else "静逢合·合起候选",
                                      name, name+b+"与"+branch+"六合；是否真的绊住或合起需合参"))
        if b==extinction:
            extinctions.append(_item("逢绝条件",name,
                                     element+"绝于"+extinction+"；须看是否还有日月动爻生扶"))
        if b==tomb:
            if name=="日辰":
                tombs.append(_item("日墓条件","日辰",
                                   element+"之墓在"+tomb+"，日辰临墓；实际入墓另辨"))
            else:
                tombs.append(_item("月支墓库对照","月建",
                                   element+"之墓支为"+tomb+"；月建同支，但不混同三墓之日墓"))

    # 爻与爻合只计两处明动。静静两爻支六合不能冒作动爻合好。
    for other in chart["najia_lines"]:
        if other["position"]==position or not moving or not other["moving"]:
            continue
        if LIUHE[branch]==other["branch"]:
            combinations.append(_item("两动爻相合候选","本卦其他动爻",
                                      str(position)+"爻"+branch+"与"+
                                      str(other["position"])+"爻"+other["branch"]+
                                      "六合；合好或合绊实效待辨",other["position"]))

    # 入动墓只对本卦其他真正发动的墓库爻列出，不把静态墓支算进去。
    for other in chart["najia_lines"]:
        if other["position"]!=position and other["moving"] and other["branch"]==tomb:
            tombs.append(_item("动墓条件","本卦其他动爻",
                                str(other["position"])+"爻"+tomb+
                                "明动，与本爻"+element+"墓库同支",other["position"]))

    if moving:
        if LIUHE[branch]==changed["branch"]:
            combinations.append(_item("动而化合·化扶候选","本位变爻",
                                      str(position)+"爻"+branch+"化"+
                                      changed["branch"]+"，本位六合"))
        if changed["branch"]==tomb:
            tombs.append(_item("化墓条件","本位变爻",
                                str(position)+"爻"+branch+"化"+changed["branch"]+
                                "，化出此五行的墓支"))
        if changed["branch"]==extinction:
            extinctions.append(_item("动而化绝条件","本位变爻",
                                     str(position)+"爻化"+changed["branch"]+
                                     "，是"+element+"的绝地；须辨是否逢生"))

    warnings=[]
    if row.get("month_break_marker") is True:
        warnings.append("此爻又遇月冲，合、墓、绝关系不得单独裁决")
    if row["void_review"]["is_void"] is True:
        warnings.append("此爻同时旬空，须查空破与出空条件")
    if row["seasonal_status"] and row["seasonal_status"]["grade"]=="余气":
        warnings.append("该爻月令为余气，不能直接以墓绝判死绝")
    if element=="土":
        warnings.append("土五行墓辰、绝巳采用本版教学约定；不同体系寄宫有差异")
    return {
        "position":position,"ganzhi":row["ganzhi"],"element":element,
        "moving":moving,
        "tomb_branch":tomb,"extinction_branch":extinction,
        "combinations":combinations,"tombs":tombs,"extinctions":extinctions,
        "pending":pending,"warnings":warnings,
        "has_any_condition":bool(combinations or tombs or extinctions),
        "status":"evidence_only",
    }


def decorate_union_tomb_extinction(chart:dict)->dict:
    rows=[_row(original,changed,chart) for original,changed in
          zip(chart["najia_lines"],chart["bian_najia_lines"])]
    focus=chart["focus_decision"]
    pos=focus.get("selected_position")
    chart["special_conditions"]={
        "version":"V17",
        "rows":rows,
        "selected_focus_position":pos,
        "selected_focus":rows[pos-1] if pos else None,
        "affected_positions":[row["position"] for row in rows if row["has_any_condition"]],
        "rules":[
            "日月合静爻标静合起候选，合动爻标动合绊候选；实际能否绊住另辨。",
            "爻与爻六合仅将两明动爻作为相合候选；动爻变出六合支另列化扶候选。",
            "三墓分别记录日墓、他爻真正发动的动墓和本位动而化墓；月墓只作对照。",
            "金绝寅、木绝申、水土绝巳、火绝亥；若又有生扶不得因绝字判无用。",
        ],
        "reference_style":"《增删卜易》六合章/随鬼入墓章及《卜筮正宗》绝处逢生论",
        "references":REFERENCES,
        "scope":SCOPE,
        "conclusion":None,
        "resolved_effectiveness":False,
    }
    return chart
