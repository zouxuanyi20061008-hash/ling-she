"""V73 奇门实盘四层一致性审计。

仅逐宫复算/交叉检查已经计算的定局、天盘、星、门、神、时标。
按公开完整Q1整盘人工抄录的固定例课另行验收。
与未取得独立原典整盘校验的暗干/不同中五流派、吉凶断课严格区分。
"""
from __future__ import annotations

from .calendar import SIXTY_DAYS
from .qimen import PALACES, INSTRUMENTS
from .qimen_rotation import OUTER_RING, EXTERNAL_DOORS, EXTERNAL_STARS, _turn_ring
from .qimen_markers import SPIRITS, XUN_VOID, HORSE, BRANCH_PALACE

Q1_SOURCE="https://www.guyujian.cn/learn/qimen/07"
ANCIENT_SOURCE="https://zh.wikisource.org/zh/奇門遁甲元靈經"

def _expect(ok:bool,detail:str)->None:
    if not ok:
        raise ValueError("V73 奇门核心盘一致性不成立："+detail)

def audit_qimen_v73(chart:dict)->dict:
    """验证完整八外宫转盘四层；不将变体暗干当作已独立校勘。"""
    _expect(chart.get("version")=="V54","只能在V54三奇校验之后核对")
    raw=chart.get("palaces",[])
    rows={p.get("number"):p for p in raw}
    _expect(len(raw)==len(rows)==9 and set(rows)==set(range(1,10)),
            "九宫位置有缺失或重复")
    earth={int(k):v for k,v in chart["earth_plate"].items()}
    _expect(set(earth)==set(range(1,10)) and set(earth.values())==set(INSTRUMENTS),
            "地盘三奇六仪未完整或有重号")
    for pos,row in rows.items():
        _expect(row.get("earth_stem")==earth[pos],"地盘干与逐宫位置冲突")
    duty=chart["duty_origin"]
    src=duty["earth_origin_palace"]
    _expect(src in range(1,10) and earth[src]==duty["concealed_stem"],
            "时旬首的六仪来源与地盘不一致")
    hour=chart["hour_ganzhi"]
    _expect(hour in SIXTY_DAYS,"时柱不在六十甲子")
    idx=SIXTY_DAYS.index(hour)
    _expect(SIXTY_DAYS[(idx//10)*10]==duty["time_xun"],"时旬首与时柱不同旬")
    time_stem=duty["concealed_stem"] if hour[0]=="甲" else hour[0]
    time_palace=next((pos for pos,s in earth.items() if s==time_stem),None)
    star_target=time_palace
    star_display=2 if time_palace==5 else time_palace
    star_source=2 if src==5 else src
    _expect(duty["rotated_star_palace"]==star_target
            and duty["rotated_star_display_palace"]==star_display
            and duty["origin_star"]==PALACES[src][2],
            "值符星的地盘时干落点或原星不一致")
    direction=1 if chart["yin_yang_dun"]=="阳遁" else -1
    _expect(chart["yin_yang_dun"] in ("阳遁","阴遁"),"阴阳遁无效")
    hour_step=idx%10
    door_target=((src-1+direction*hour_step)%9)+1
    door_display=2 if door_target==5 else door_target
    door_source=2 if src==5 else src
    _expect(duty["rotated_door_palace"]==door_target
            and duty["rotated_door_display_palace"]==door_display
            and duty["xun_hour_step"]==hour_step
            and duty["origin_door"]==(PALACES[src][3] or "死门"),
            "值使门九宫时序或显示寄宫不一致")
    expected_star=_turn_ring(EXTERNAL_STARS,star_source,star_display)
    expected_gate=_turn_ring(EXTERNAL_DOORS,door_source,door_display)
    expected_stem=_turn_ring({pos:earth[pos] for pos in OUTER_RING},
                             star_source,star_display)
    for pos in OUTER_RING:
        p=rows[pos]
        for key,expect in (
            ("actual_star",expected_star[pos]["value"]),
            ("actual_gate",expected_gate[pos]["value"]),
            ("sky_stem",expected_stem[pos]["value"]),
            ("star_from_palace",expected_star[pos]["source_palace"]),
            ("gate_from_palace",expected_gate[pos]["source_palace"]),
            ("sky_stem_from_palace",expected_stem[pos]["source_palace"]),
        ):
            _expect(p.get(key)==expect,f"{pos}宫{key}不合旋转来源")
        attached=expected_star[pos]["source_palace"]==2
        _expect((p.get("attached_center_star")=="天禽")==attached,
                f"{pos}宫天禽寄星位置不一致")
        _expect(p.get("attached_center_stem")==(earth[5] if attached else None),
                f"{pos}宫天禽寄干不一致")
    _expect(rows[5]["sky_stem"]==earth[5]
            and all(rows[5].get(s) is None for s in
                ("actual_star","actual_gate","actual_spirit")),
            "中五不可臆造一套独立八门、九星及八神")
    origin=OUTER_RING.index(star_display)
    spirit={OUTER_RING[(origin+direction*i)%8]:sp for i,sp in enumerate(SPIRITS)}
    for pos in OUTER_RING:
        _expect(rows[pos]["actual_spirit"]==spirit[pos],
                f"{pos}宫八神不合值符外宫起点")
    _expect(chart["spirit_plate"]["placements"]=={str(p):v for p,v in sorted(spirit.items())},
            "神盘总表与逐宫不一致")
    void=XUN_VOID[duty["time_xun"]]
    horse_branch=HORSE[hour[1]]
    horse_palace=BRANCH_PALACE[horse_branch]
    markers=chart["hour_markers"]
    _expect(markers["void_branches"]==list(void)
            and markers["void_palaces"]==sorted({BRANCH_PALACE[v] for v in void})
            and markers["horse_branch"]==horse_branch
            and markers["horse_palace"]==horse_palace,
            "时旬空和时驿马总表不合实时时支")
    for pos in OUTER_RING:
        expect_void=[a for a in void if BRANCH_PALACE[a]==pos]
        _expect(rows[pos]["hour_xunkong_branches_here"]==expect_void
                and rows[pos]["has_hour_void"]==bool(expect_void)
                and rows[pos]["hour_horse"]==(pos==horse_palace),
                f"{pos}宫时空亡或马星与总表冲突")
    _expect(chart.get("has_core_four_layers") is True
            and chart.get("has_rotated_stars_and_gates") is True
            and chart.get("has_eight_spirits") is True,
            "核心四层元数据未表明完成")
    _expect(chart.get("fortune_conclusion") is None
            and chart.get("has_final_divination") is False,
            "事实排盘不得输出未证实的最终断语")
    _expect(chart["dark_stem_plate"]["independently_verified_from_classic_example"] is False,
            "尚未拥有原典整盘的暗干口径不得宣称已校验")
    check={
        "version":"V73","status":"core_four_layers_consistent",
        "core_layers":[
            {"name":"地盘三奇六仪","expected_positions":9,"verified_positions":9},
            {"name":"天盘干及九星","expected_positions":8,"verified_positions":8},
            {"name":"八门值使落宫","expected_positions":8,"verified_positions":8},
            {"name":"八神值符旋转","expected_positions":8,"verified_positions":8},
        ],
        "verification_count":33,
        "checked": {
            "hour_xun_and_instruments":True,
            "chief_star_stem_trace":True,
            "chief_gate_hourly_jiugong_steps":True,
            "outer_eight_stars_gates_and_spirits":True,
            "center_tianqin_housed_separately":True,
            "hour_void_and_horse_consistent":True,
            "no_predicted_fortune":True,
        },
        "duty":{"chief_star_original":src,"chief_star_logical":star_target,
                "chief_star_display":star_display,
                "chief_gate_original":src,"chief_gate_logical":door_target,
                "chief_gate_display":door_display,"hourly_steps":hour_step},
        "source":{
            "full_external_worked_chart":Q1_SOURCE,
            "ancient_two_reference_cases":ANCIENT_SOURCE,
        },
        "independent_witness_scope":"2026-03-18 15:20 阳遁四局独立逐宫例盘，其他盘只按已证实同一规则检验结构",
        "unverified_modules":["值使飞宫暗干完整独立古籍整盘",
                              "置闰定局与替代寄宫流派","最终取用断课、吉凶应期"],
        "has_complete_core_four_layers":True,
        "has_full_multi_school_coverage":False,
        "has_final_divination":False,
    }
    chart["core_plate_audit"]=check
    chart["audit_version"]="V73"
    chart["core_four_layer_consistency_verified"]=True
    chart["has_complete_rotating_plate"]=False
    return chart
