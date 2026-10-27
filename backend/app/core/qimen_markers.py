"""V52: historical shi-jia spirit plate, time-xunkong, time-horse and conditions.

All labels are structural only. No outcomes or predictive claims.
Eight spirits use the rotating chief-star display palace as origin,
yang clockwise and yin counterclockwise on the outer eight.
"""
from __future__ import annotations
from .calendar import SIXTY_DAYS,BRANCHES
from .qimen_rotation import OUTER_RING

SPIRITS=("值符","腾蛇","太阴","六合","白虎","玄武","九地","九天")
XUN_VOID={"甲子":("戌","亥"),"甲戌":("申","酉"),"甲申":("午","未"),
          "甲午":("辰","巳"),"甲辰":("寅","卯"),"甲寅":("子","丑")}
BRANCH_PALACE=dict(zip(BRANCHES,(1,8,8,3,4,4,9,2,2,7,6,6)))
HORSE={**dict.fromkeys(("申","子","辰"),"寅"),
       **dict.fromkeys(("寅","午","戌"),"申"),
       **dict.fromkeys(("巳","酉","丑"),"亥"),
       **dict.fromkeys(("亥","卯","未"),"巳")}
OPPOSITE={1:9,9:1,2:8,8:2,3:7,7:3,4:6,6:4}
PALACE_ELEM={1:"水",2:"土",3:"木",4:"木",5:"土",6:"金",7:"金",8:"土",9:"火"}
GATE_ELEM={"休门":"水","生门":"土","伤门":"木","杜门":"木",
           "景门":"火","死门":"土","惊门":"金","开门":"金"}
CONTROLS={"木":"土","土":"水","水":"火","火":"金","金":"木"}
GENERATES={"木":"火","火":"土","土":"金","金":"水","水":"木"}
STRIKE={"戊":3,"己":2,"庚":8,"辛":9,"壬":4,"癸":4}


def gate_palace_relation(gate:str,position:int)->str:
    a,b=GATE_ELEM[gate],PALACE_ELEM[position]
    if a==b:return "比和"
    if CONTROLS[a]==b:return "门克宫（门迫条件）"
    if CONTROLS[b]==a:return "宫克门"
    if GENERATES[a]==b:return "门生宫"
    return "宫生门"


def decorate_qimen_v52(chart:dict)->dict:
    if chart.get("version")!="V51" or not chart.get("has_rotated_stars_and_gates"):
        raise ValueError("V52 只能在 V51 真实星门转盘之后核对八神")
    rows={r["number"]:r for r in chart["palaces"]}
    if len(chart["palaces"])!=9 or set(rows)!=set(range(1,10)):
        raise ValueError("V52 九宫位置缺失或重复")
    hour=chart["hour_ganzhi"]
    if hour not in SIXTY_DAYS:raise ValueError("V52 时柱无效")
    xun=SIXTY_DAYS[SIXTY_DAYS.index(hour)//10*10]
    duty=chart["duty_origin"]
    if duty["time_xun"]!=xun:raise ValueError("V52 时旬首不匹配")
    chief=duty["rotated_star_display_palace"]
    if chief not in OUTER_RING:raise ValueError("V52 值符须位于外八宫")
    expected_star="天芮" if duty["origin_star"]=="天禽" else duty["origin_star"]
    if rows[chief]["actual_star"]!=expected_star:
        raise ValueError("V52 值符星和神盘起点不一致")
    if chart["yin_yang_dun"] not in ("阳遁","阴遁"):
        raise ValueError("V52 阴阳遁无效")
    direction=1 if chart["yin_yang_dun"]=="阳遁" else -1
    start=OUTER_RING.index(chief)
    spirits={OUTER_RING[(start+direction*i)%8]:s for i,s in enumerate(SPIRITS)}
    void_branches=XUN_VOID[xun]
    horse_branch=HORSE[hour[1]]
    horse_palace=BRANCH_PALACE[horse_branch]
    void_palaces=sorted({BRANCH_PALACE[b] for b in void_branches})
    tags={}
    for n in OUTER_RING:
        row=rows[n]
        if row["actual_gate"] not in GATE_ELEM or row.get("star_from_palace") not in OUTER_RING or row.get("gate_from_palace") not in OUTER_RING:
            raise ValueError("V52 需要实际星门及其可追溯原宫")
        branches=[b for b in BRANCHES if BRANCH_PALACE[b]==n]
        void_here=[b for b in void_branches if b in branches]
        relation=gate_palace_relation(row["actual_gate"],n)
        status={
            "star_fuyin":row["star_from_palace"]==n,
            "star_fanyin":OPPOSITE[row["star_from_palace"]]==n,
            "gate_fuyin":row["gate_from_palace"]==n,
            "gate_fanyin":OPPOSITE[row["gate_from_palace"]]==n,
            "door_pressure":relation=="门克宫（门迫条件）",
            "instrument_strike":STRIKE.get(row["sky_stem"])==n,
            "attached_center_instrument_strike":STRIKE.get(row.get("attached_center_stem"))==n,
        }
        labels={"star_fuyin":"九星伏吟位","star_fanyin":"九星反吟位",
                "gate_fuyin":"八门伏吟位","gate_fanyin":"八门反吟位",
                "door_pressure":"门迫条件","instrument_strike":"天盘六仪击刑条件",
                "attached_center_instrument_strike":"天禽寄干击刑条件"}
        row.update({
            "actual_spirit":spirits[n],"palace_branches":branches,
            "hour_xunkong_branches_here":void_here,"has_hour_void":bool(void_here),
            "hour_horse":n==horse_palace,
            "horse_branch_here":horse_branch if n==horse_palace else None,
            "door_palace_relation":relation,"structural_status":status,
            "structural_tags":[labels[k] for k,flag in status.items() if flag],
        })
        tags[str(n)]=row["structural_tags"]
    rows[5].update({"actual_spirit":None,"palace_branches":[],
        "hour_xunkong_branches_here":[],"has_hour_void":False,
        "hour_horse":False,"horse_branch_here":None,"door_palace_relation":None,
        "structural_status":{},"structural_tags":[]})
    if ({rows[n]["actual_spirit"] for n in OUTER_RING}!=set(SPIRITS)
        or sum(rows[n]["hour_horse"] for n in OUTER_RING)!=1
        or {n for n in OUTER_RING if rows[n]["has_hour_void"]}!=set(void_palaces)):
        raise ValueError("V52 神盘或时空马星标记不完整")
    chart["spirit_plate"]={"version":"V52","order":list(SPIRITS),
        "direction":"阳顺" if direction==1 else "阴逆",
        "chief_star_display_palace":chief,
        "placements":{str(p):s for p,s in sorted(spirits.items())},
        "center_spirit":None}
    chart["hour_markers"]={"version":"V52","time_xun":xun,
        "void_branches":list(void_branches),"void_palaces":void_palaces,
        "void_kind":"时旬空（不是日旬空）","horse_source":"时支",
        "horse_time_branch":hour[1],"horse_branch":horse_branch,
        "horse_palace":horse_palace,"branch_exact":True}
    chart["structure_review"]={"version":"V52",
        "whole_plate":{k:all(rows[n]["structural_status"][k] for n in OUTER_RING)
                       for k in ("star_fuyin","star_fanyin","gate_fuyin","gate_fanyin")},
        "tags_by_palace":tags,"conditions_are_outcomes":False,
        "fortune_verdict":None,"timing_verdict":None,
        "note":"门迫、击刑和伏吟反吟是传统结构标记，不能单项断吉凶。"}
    chart["version"]="V52"
    chart["state"]="stars_gates_spirits_hour_void_horse_structures"
    chart["has_eight_spirits"]=True
    chart["has_hourly_void_and_horse"]=True
    chart["has_core_four_layers"]=True
    chart["rotation"]["actual_spirits_computed"]=True
    chart["has_complete_rotating_plate"]=False
    chart["has_final_divination"]=False
    chart["fortune_conclusion"]=None
    chart["limitations"]=[
        "已排地盘、天盘、八门与八神，时旬空及时支马星附记宫位和具体支。",
        "基础伏吟反吟、门迫、六仪击刑仅为结构条件，不能自动断吉凶或应期。",
        "完整奇仪格局、暗干、用神断课及流派细节仍须独立例盘校勘。",
    ]
    return chart
