"""V67 太乙岁计定计目、定计大参将以及主客落中五状态。

依据《太乙指津》定计目法和《古今图书集成·艺术典》主客定计：
以岁支六合神加岁支，旋十六神，视文昌下临何位为定计目；
同 V65 正宫/间神累加至太乙前止；同宫依 V66 显式选择口径。

"落中五"只作将的状态标注，不误把太乙本人搬入中五。
五宫并非空值，也不把大将5改成其他宫位。
"""
from __future__ import annotations

from .taiyi_v65 import DIRECTIONS,GODS,INDEX,_count_result
from .taiyi_v66 import _count_same_palace

SIX_HARMONY={
 "子":"丑","丑":"子","寅":"亥","亥":"寅",
 "卯":"戌","戌":"卯","辰":"酉","酉":"辰",
 "巳":"申","申":"巳","午":"未","未":"午",
}
PRIMARY="https://ctext.org/wiki.pl?chapter=948786&if=gb"
CLASSICAL="https://higrid.net/show/ancient/80-36.html"
SECONDARY="https://zh.wikisource.org/zh-hans/%E5%A4%AA%E4%B9%99%E7%A7%98%E6%9B%B8"
CLASSICAL_ALTERNATE="https://www.shidianguji.com/mid-page/7589398935292002330"
MIDDLE_SOURCE="https://zh.wikisource.org/zh-hans/%E5%A4%AA%E4%B9%99%E7%A7%98%E6%9B%B8"


def locate_dingji_eye(year_branch:str,wenchang_index:int)->dict:
    """If 六合作天盘 above the year branch, where does 文昌 fall on ground?"""
    if year_branch not in SIX_HARMONY or (
        isinstance(wenchang_index,bool) or
        not isinstance(wenchang_index,int) or wenchang_index not in range(16)):
        raise ValueError("定计需有效太岁地支与文昌十六神索引")
    harmony=SIX_HARMONY[year_branch]
    placed=INDEX[year_branch]
    upper=INDEX[harmony]
    ground=(wenchang_index-upper+placed)%16
    return {
        "year_branch":year_branch,
        "harmony_branch":harmony,
        "year_ground_index":placed,
        "harmony_sky_index":upper,
        "wenchang_sky_index":wenchang_index,
        "wenchang_sky_direction":DIRECTIONS[wenchang_index],
        "dingji_ground_index":ground,
        "dingji_ground_direction":DIRECTIONS[ground],
        "dingji_ground_god":GODS[ground],
        "rotated_sixteen":[
          {"ground":DIRECTIONS[i],"heaven":DIRECTIONS[(i-placed+upper)%16],
           "is_year_ground":i==placed,
           "is_dingji_eye":i==ground}
          for i in range(16)
        ],
        "formula":"(文昌天盘位 - 六合神位 + 太岁地盘位) mod 16",
        "source":PRIMARY,
    }


def calculate_dingji(year_branch:str,wenchang_index:int,
                    taiyi_palace:int,same_palace_rule:str="wubeizhi")->dict:
    if same_palace_rule not in ("wubeizhi","conservative"):
        raise ValueError("定计同宫口径不支持")
    position=locate_dingji_eye(year_branch,wenchang_index)
    calc=_count_result({"index":position["dingji_ground_index"]},taiyi_palace)
    if calc["status"]=="pending" and same_palace_rule=="wubeizhi":
        calc=_count_same_palace(calc,taiyi_palace)
    return {
        **position,"version":"V67","status":calc["status"],
        "count":calc["count"],"main_general":calc["main_general"],
        "assistant_general":calc["assistant_general"],
        "trace":calc["trace"],"count_basis":"岁计定计目依主客算同法至太乙宫前止",
        "stop_palace":taiyi_palace,"rule":same_palace_rule,
        "same_palace_rule_applied":calc.get("special_rule_applied",False),
        "historical_alternative":calc.get("historical_alternative"),
        "reason":calc.get("reason"),
        "sources":{"annual_dingji":PRIMARY,"six_harmony":CLASSICAL,
                   "alternate_text":CLASSICAL_ALTERNATE},
        "fortune_verdict":None,
    }


def _middle_general_status(count:dict,role:str)->dict:
    value=count.get(role)
    if value is None:
        return {"number":None,"status":"pending","is_middle_five":False,
                "can_mark_external_palace":False}
    if not isinstance(value,int) or not 1<=value<=9:
        raise ValueError("定计主客将宫只能在1到9")
    is_middle=value==5
    return {
        "number":value,
        "status":"中五不出" if is_middle else "八宫正常定位",
        "is_middle_five":is_middle,
        "can_mark_external_palace":not is_middle,
        "symbolic_location":"中五" if is_middle else f"{value}宫",
        "source":MIDDLE_SOURCE,
        "interpretation_boundary":"中五不出只是古籍排盘状态，不是现实吉凶断定",
    }


def decorate_taiyi_v67(board:dict)->dict:
    if board.get("version")!="V66" or board.get("calculation")!="岁计":
        raise ValueError("V67 只能从完整 V66 岁计十六神盘扩展")
    annual=board["year"]
    w=board["main_guest"]["heaven_eye_wenchang"]
    year_ganzhi=annual["sexagenary_year"]
    if len(year_ganzhi)!=2 or year_ganzhi[1] not in SIX_HARMONY:
        raise ValueError("V67 必须从合法太岁支定计")
    taiyi=annual["taiyi_palace"]["number"]
    mode=board["same_palace_rule"]
    dingji=calculate_dingji(year_ganzhi[1],w["index"],taiyi,mode)
    board["dingji_v67"]=dingji
    board["has_annual_dingji"]=dingji["status"]=="computed"
    board["has_full_annual_chart"]=False
    generals=board["main_guest"]
    middle=[]
    for side,label in (("main_general","主方"),("guest_general","客方")):
        calc=generals[side]
        positions={
          "big":_middle_general_status(calc,"main_general"),
          "assistant":_middle_general_status(calc,"assistant_general"),
        }
        calc["middle_palace_states"]=positions
        for kind,position in positions.items():
            if position["is_middle_five"]:
                middle.append({"side":label,"kind":"大将" if kind=="big" else "参将",
                               **position})
    dingji["big_general_state"]=_middle_general_status(dingji,"main_general")
    dingji["assistant_general_state"]=_middle_general_status(dingji,"assistant_general")
    for kind,name in (("big_general_state","大将"),("assistant_general_state","参将")):
        pos=dingji[kind]
        if pos["is_middle_five"]:
            middle.append({"side":"定计","kind":name,**pos})
    board["middle_five_states"]={
        "version":"V67","taiyi_can_enter_center":False,
        "generals_may_take_number_five":True,
        "rule":"主客与定计大参将数为五时保留五宫，不移入其他宫；古籍有「不出中宫」状态。",
        "case_count":len(middle),"cases":middle,
        "source":MIDDLE_SOURCE,
    }
    for palace in board["nine_palaces"]:
        n=palace["number"]
        palace["dingji_eye_here"]=(
            dingji["dingji_ground_direction"] in (
               "子","艮","卯","巽","午","坤","酉","乾")
            and n=={"子":8,"艮":3,"卯":4,"巽":9,
                    "午":2,"坤":7,"酉":6,"乾":1}.get(
                        dingji["dingji_ground_direction"]))
        palace["dingji_big_general_here"]=dingji["main_general"]==n
        palace["dingji_assistant_here"]=dingji["assistant_general"]==n
        palace["any_general_five"]=(n==5 and len(middle)>0)
        if palace["is_taiyi"] and n==5:
            raise ValueError("太乙绝不可移入中五宫")
    if dingji["status"]=="computed":
        if dingji["count"]!=sum(x["added"] for x in dingji["trace"]):
            raise ValueError("定计逐宫投算加数与总和不一致")
    elif dingji["count"] is not None:
        raise ValueError("保守待算不能附加定计假算")
    board["version"]="V67"
    board["warnings"]=[
        "V67 定计：六合神加太岁，文昌下临成定计目，再按十六神主客算规则求定计大、参将。",
        "中五宫可为大将、参将之数，但太乙本身不入中五；中五不出仅作原典状态标记，不自动改宫。",
        "沿用 V66 同宫双口径；保守口径遇定计目与太乙同宫时仍标待算。",
        "定计为岁计一个构件，未覆盖所有长周期神、月计日计时计或吉凶判断。",
    ]
    return board
