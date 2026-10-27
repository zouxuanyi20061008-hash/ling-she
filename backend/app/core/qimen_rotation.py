"""V51 时家奇门转盘：值符随时干、值使随时宫，九星与八门分层旋转。

不同转法不能混用：星干按外八宫环旋转；值使从旬首宫按时序在
洛书九宫数字顺逆数，再在外八宫围绕值使落宫重排八门。

中五不安八门，以坤二为显示寄宫。天禽随天芮寄布，
其地盘中五本干单列随寄，而不是伪造第九个外宫。
八神尚未计算，不作完整奇门断盘结论。
"""
from __future__ import annotations

from .calendar import SIXTY_DAYS
from .qimen import PALACES, INSTRUMENTS, LO_SHU

# 外圈按坎、艮、震、巽、离、坤、兑、乾依次行。
OUTER_RING=(1,8,3,4,9,2,7,6)
EXTERNAL_STARS={p:PALACES[p][2] for p in OUTER_RING}
EXTERNAL_DOORS={p:PALACES[p][3] for p in OUTER_RING}


def _turn_ring(source:dict[int,str],base:int,destination:int)->dict[int,dict]:
    """将源宫的星/门对齐目的宫；其余七宫沿外圈整体等距转移。"""
    if base not in OUTER_RING or destination not in OUTER_RING:
        raise ValueError("V51 外八宫转布不得使用中五物理位置")
    shift=OUTER_RING.index(destination)-OUTER_RING.index(base)
    return {
        OUTER_RING[(index+shift)%8]:{
            "source_palace":origin,"value":source[origin]
        }
        for index,origin in enumerate(OUTER_RING)
    }


def rotate_qimen(chart:dict)->dict:
    """V50 原始九宫 → V51 天盘干、九星、八门；保持来源可追溯。"""
    if chart.get("version")!="V50" or len(chart["palaces"])!=9:
        raise ValueError("V51 必须从完整 V50 定局地盘转布")
    earth={int(k):v for k,v in chart["earth_plate"].items()}
    if (set(earth)!=set(range(1,10)) or
        set(earth.values())!=set(INSTRUMENTS) or
        {p["number"]:p["earth_stem"] for p in chart["palaces"]}!=earth):
        raise ValueError("V51 九宫地盘及三奇六仪来源不一致")
    duty=chart["duty_origin"]
    source_palace=duty["earth_origin_palace"]
    if earth[source_palace]!=duty["concealed_stem"]:
        raise ValueError("V51 时旬首遁干与地盘源宫不一致")
    hour=chart["hour_ganzhi"]
    if hour not in SIXTY_DAYS:
        raise ValueError("V51 时柱须是合法六十甲子")
    idx=SIXTY_DAYS.index(hour)
    if duty["time_xun"]!=SIXTY_DAYS[(idx//10)*10]:
        raise ValueError("V51 时旬首与时柱不一致")
    if duty["origin_star"]!=PALACES[source_palace][2]:
        raise ValueError("V51 值符本宫九星错误")
    if duty["origin_door"]!=(PALACES[source_palace][3] or "死门"):
        raise ValueError("V51 值使本宫八门错误")
    yang=chart["yin_yang_dun"]=="阳遁"
    if chart["yin_yang_dun"] not in ("阳遁","阴遁"):
        raise ValueError("V51 阴阳遁必须先确定")
    step=idx%10

    # 甲为旬首，遁于六仪下；地盘不可能直接查到显甲。
    time_stem=duty["concealed_stem"] if hour[0]=="甲" else hour[0]
    time_source=next(p for p,s in earth.items() if s==time_stem)
    star_target_logical=time_source
    star_target_display=2 if time_source==5 else time_source
    star_source_display=2 if source_palace==5 else source_palace

    # 值使必须按洛书数字+/-时序计数，不可沿外八宫顺着数。
    step_dir=1 if yang else -1
    door_target_logical=((source_palace-1+step_dir*step)%9)+1
    door_target_display=2 if door_target_logical==5 else door_target_logical
    door_source_display=2 if source_palace==5 else source_palace

    sky_stars=_turn_ring(EXTERNAL_STARS,star_source_display,star_target_display)
    sky_gates=_turn_ring(EXTERNAL_DOORS,door_source_display,door_target_display)
    sky_stems=_turn_ring({p:earth[p] for p in OUTER_RING},
                         star_source_display,star_target_display)

    origin_of_duty_star=star_source_display
    if sky_stars[star_target_display]["source_palace"]!=origin_of_duty_star:
        raise ValueError("V51 值符星与时干落宫未对齐")
    if sky_gates[door_target_display]["source_palace"]!=door_source_display:
        raise ValueError("V51 值使门与按时序取得的落宫未对齐")
    by_palace={p["number"]:p for p in chart["palaces"]}
    for num in OUTER_RING:
        star_info=sky_stars[num]
        door_info=sky_gates[num]
        stem_info=sky_stems[num]
        row=by_palace[num]
        row["actual_star"]=star_info["value"]
        row["actual_gate"]=door_info["value"]
        row["sky_stem"]=stem_info["value"]
        row["star_from_palace"]=star_info["source_palace"]
        row["gate_from_palace"]=door_info["source_palace"]
        row["sky_stem_from_palace"]=stem_info["source_palace"]
        # 天禽寄坤二的星干跟着天芮转到同一外宫；非额外九宫。
        row["attached_center_star"]="天禽" if star_info["source_palace"]==2 else None
        row["attached_center_stem"]=earth[5] if star_info["source_palace"]==2 else None
        row["actual_spirit"]=None
    center=by_palace[5]
    center["sky_stem"]=earth[5]   # 原中宫干保留为对照
    center["actual_star"]=None   # 不在中宫另造转宫九星
    center["actual_gate"]=None
    center["actual_spirit"]=None
    center["center_borrow_palace"]=2

    if ({by_palace[p]["actual_star"] for p in OUTER_RING}!=set(EXTERNAL_STARS.values())
        or {by_palace[p]["actual_gate"] for p in OUTER_RING}!=set(EXTERNAL_DOORS.values())
        or {by_palace[p]["sky_stem"] for p in OUTER_RING}!={earth[p] for p in OUTER_RING}
        or sum(p["attached_center_star"]=="天禽" for p in by_palace.values())!=1):
        raise ValueError("V51 转盘九星、八门或天盘干出现缺失或重复")

    duty.update({
        "rotated_star_palace":star_target_logical,
        "rotated_star_display_palace":star_target_display,
        "rotated_door_palace":door_target_logical,
        "rotated_door_display_palace":door_target_display,
        "sky_plate_computed":True,"gates_rotated":True,
        "time_stem_for_earth_lookup":time_stem,
        "hourly_jia_concealed":hour[0]=="甲",
        "time_stem_earth_palace":time_source,
        "xun_hour_step":step,
        "origin_star_display_palace":star_source_display,
        "origin_door_display_palace":door_source_display,
        "center_star_borrowed":source_palace==5 or star_target_logical==5,
        "center_gate_borrowed":source_palace==5 or door_target_logical==5,
        "actual_spirit":None,
    })
    chart["rotation"]={
        "version":"V51","clockwise_external_ring":list(OUTER_RING),
        "stars":{str(num):{"from":sky_stars[num]["source_palace"],
                            "to":num,"name":sky_stars[num]["value"]}
                 for num in OUTER_RING},
        "gates":{str(num):{"from":sky_gates[num]["source_palace"],
                            "to":num,"name":sky_gates[num]["value"]}
                 for num in OUTER_RING},
        "star_source":source_palace,
        "star_target_logical":star_target_logical,
        "star_target_display":star_target_display,
        "gate_source":source_palace,
        "gate_target_logical":door_target_logical,
        "gate_target_display":door_target_display,
        "gate_hour_steps":step,
        "gate_counting_method":"洛书宫数阴逆阳顺（1～9，中五显示寄坤二）",
        "stars_method":"外八宫等距旋转，星与天盘干同行",
        "center_host":"天禽寄天芮；中五不安八门；中五干另记为天芮所携寄附",
        "stars_and_gates_verified_by_structure":True,
        "actual_spirits_computed":False,
        "source_reference":"https://zh.wikisource.org/zh/奇門遁甲元靈經",
    }
    chart["version"]="V51"
    chart["state"]="sky_stars_and_eight_gates_rotated_spirits_pending"
    chart["has_rotated_stars_and_gates"]=True
    chart["has_complete_rotating_plate"]=False
    chart["has_final_divination"]=False
    chart["fortune_conclusion"]=None
    chart["limitations"]=[
        "V51 已由真实时干/旬首计算值符星、天盘干及八门实际落宫，九宫中宫不安独立八门。",
        "中五的实际目标宫与寄坤二展示宫同时记录；天禽随天芮寄，中心干单列附挂，须按所采纳流派解释。",
        "八神、暗干、时旬空、马星以及具体吉凶应期尚未实现；不是全部层次齐全的奇门时盘。",
    ]
    return chart
