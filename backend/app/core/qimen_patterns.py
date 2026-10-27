"""V53: independent 9-by-9 ten-stem response names, conditional Qimen patterns,
and a documented/replaceable 值使飞宫暗干 convention.

Titles transcribed from 《奇门遁甲秘笈大全·十干克应诀》.
The source contains two pairs without a discrete title: do not invent one.
This identifies formal pattern conditions, NOT real effects or outcomes.
"""
from __future__ import annotations
from .calendar import SIXTY_DAYS
from .qimen import INSTRUMENTS
from .qimen_rotation import OUTER_RING

# Earth columns: 戊乙丙丁己庚辛壬癸
# Original historical source sometimes uses 巳 for 己 in its transcription.
COLUMNS=("戊","乙","丙","丁","己","庚","辛","壬","癸")
NAME_ROWS={
"戊":("伏吟","青龙合灵","青龙返首","青龙耀明","贵人入狱","值符飞宫","青龙折足","龙入天牢","青龙华盖"),
"乙":("利阴害阳","日奇伏吟","奇仪顺遂","奇仪相佐","日奇入雾","日奇被刑","青龙逃走","日人入地","华盖蓬星害"),
"丙":("飞鸟跌穴","日月并行","月奇孛师","星奇朱雀","火孛入刑","荧入太白",None,"火入天罗","华盖孛师"),
"丁":("青龙转光","人遁吉格","星随月转","奇入太阴","火入勾陈","年月日时格","朱雀入狱","五神互合","朱雀投江"),
"己":("犬遇青龙","墓神不明","火孛地户","朱雀入墓","地户逢鬼","刑格","游魂入墓","地纲高张","地刑元武"),
"庚":("太白天乙伏宫","太白蓬星","太白入荧","亭亭之格","刑格","太白同宫","白虎干格",None,"大格"),
"辛":("困龙被伤","白虎猖狂","干合孛师","狱神得奇","入狱目刑","白虎出力","伏吟天庭","凶蛇入狱","天牢盖"),
"壬":("蛇化龙","格名小蛇","水蛇入火","干合蛇刑","凶蛇入狱","太白擒蛇","螣蛇相缠","蛇入地罗","幼女奸淫"),
"癸":("天乙会合","华盖蓬星","华盖孛师","螣蛇天矫","华盖地户","太白入网","网盖天牢","复见螣蛇","天网四张"),
}
CLASSIC="https://www.shidianguji.com/book/SDZJ0630/chapter/1lx9g1urkiyp2"
THREE_ESCAPE="https://book.taiyi.me/%E5%8D%9C/%E5%A5%87%E9%97%A8%E9%81%81%E7%94%B2%E7%A7%98%E7%AC%88%E5%A4%A7%E5%85%A8/%E5%A5%87%E9%97%A8%E9%81%81%E7%94%B2%E7%A7%98%E7%AC%88%E5%A4%A7%E5%85%A8%28%E5%8D%B7%E5%8D%81%E4%BA%94%29"
DARK_REFERENCE="https://a.d02.cn/article/m_article.php?id=3941"


def lookup_ten_stem(sky:str,earth:str)->dict:
    if sky not in NAME_ROWS or earth not in COLUMNS:
        raise ValueError("V53 十干克应查表只接受九种三奇六仪（显甲须先遁仪）")
    title=NAME_ROWS[sky][COLUMNS.index(earth)]
    return {
        "sky_stem":sky,"earth_stem":earth,
        "title":title,"title_recorded":title is not None,
        "original_source":CLASSIC,"source_kind":"historical_text_lookup",
        "actual_effect":None,"fortune_verdict":None,
    }


def _patterns(sky:str,earth:str,gate:str,spirit:str)->list[dict]:
    """Direct classical four-layer conditions, no predicted outcomes."""
    comparisons=(
        ("green_dragon_returns","青龙返首",sky=="戊" and earth=="丙","戊加丙"),
        ("bird_falls_cave","飞鸟跌穴",sky=="丙" and earth=="戊","丙加戊"),
        ("heaven_escape","天遁",sky=="丙" and earth=="丁" and gate=="生门",
         "天盘丙、地盘丁、生门同宫"),
        ("earth_escape","地遁",sky=="乙" and earth=="己" and gate=="开门",
         "天盘乙、地盘己、开门同宫"),
        ("human_escape","人遁",sky=="丁" and gate=="休门" and spirit=="太阴",
         "天盘丁、休门、太阴同宫"),
        ("red_bird_river","朱雀投江",sky=="丁" and earth=="癸","丁加癸"),
        ("white_tiger_rampage","白虎猖狂",sky=="辛" and earth=="乙","辛加乙"),
        ("serpent_coils","螣蛇夭矫",sky=="癸" and earth=="丁","癸加丁"),
        ("fire_enters_white","荧入太白",sky=="丙" and earth=="庚","丙加庚"),
        ("white_enters_fire","太白入荧",sky=="庚" and earth=="丙","庚加丙"),
        ("great_structure","大格",sky=="庚" and earth=="癸","庚加癸"),
    )
    return [{"id":code,"title":title,"evidence":rule,"observed":True,
             "effective":None,"forecast":None,"source":THREE_ESCAPE}
            for code,title,yes,rule in comparisons if yes]


def _dark_flying(chart:dict,rows:dict)->dict:
    """Explicit 值使起暗干 fly-palace convention; separate from 4 main layers."""
    hour=chart["hour_ganzhi"]
    if hour not in SIXTY_DAYS:raise ValueError("V53 暗干需合法时柱")
    duty=chart["duty_origin"]
    if duty["rotated_door_palace"] not in range(1,10):
        raise ValueError("V53 值使门必须真实落宫")
    stem=duty["concealed_stem"] if hour[0]=="甲" else hour[0]
    if stem not in INSTRUMENTS:raise ValueError("V53 时干遁仪缺失")
    door_palace=duty["rotated_door_palace"]
    # This is an explicitly chosen convention, not a universal classical rule.
    # 甲时从中五起；时干同值使落宫的地盘或天盘干亦改从中五起。
    reason="值使门宫起"
    start=door_palace
    if hour[0]=="甲":
        start=5;reason="显甲遁六仪，改从中五起"
    elif (stem==rows[door_palace]["earth_stem"] or
          stem==rows[door_palace]["sky_stem"]):
        start=5;reason="时干同值使门宫天地盘干，改从中五起（本口径约定）"
    step=1 if chart["yin_yang_dun"]=="阳遁" else -1
    initial=INSTRUMENTS.index(stem)
    spread={
        ((start-1+step*i)%9)+1:INSTRUMENTS[(initial+i)%9]
        for i in range(9)
    }
    if set(spread)!=set(range(1,10)) or set(spread.values())!=set(INSTRUMENTS):
        raise ValueError("V53 暗干飞宫不得缺少九干或重复占宫")
    return {
        "version":"V53","method":"值使门起飞宫暗干（阳顺阴逆，特殊时干改中五）",
        "method_is_variant":True,"source":DARK_REFERENCE,
        "starting_stem":stem,"origin_logical_palace":start,
        "original_value_gate_palace":door_palace,"origin_reason":reason,
        "direction":"阳顺" if step==1 else "阴逆",
        "placements":{str(k):v for k,v in sorted(spread.items())},
        "center_display_note":"中五暗干单列；不因寄坤二而覆盖坤宫暗干。",
        "alternatives_not_computed":["按天盘干嫁接法","阴盘飞干法"],
        "independently_verified_from_classic_example":False,
    }


def decorate_qimen_v53(chart:dict)->dict:
    if chart.get("version")!="V52" or not chart.get("has_eight_spirits"):
        raise ValueError("V53 需 V52 已经校验的真实四层时家转盘")
    rows={row["number"]:row for row in chart["palaces"]}
    if set(rows)!=set(range(1,10)) or len(chart["palaces"])!=9:
        raise ValueError("V53 九宫不得缺失或重号")
    for pos in OUTER_RING:
        r=rows[pos]
        if (r.get("sky_stem") not in INSTRUMENTS or
            r.get("earth_stem") not in INSTRUMENTS or
            r.get("actual_gate") is None or
            r.get("actual_spirit") is None):
            raise ValueError("V53 天盘/地盘/八门/八神任一缺失均不能算克应")
        response=lookup_ten_stem(r["sky_stem"],r["earth_stem"])
        r["ten_stem_response"]=response
        r["classical_patterns"]=_patterns(r["sky_stem"],r["earth_stem"],
                                          r["actual_gate"],r["actual_spirit"])
    rows[5]["ten_stem_response"]=None
    rows[5]["classical_patterns"]=[]
    dark=_dark_flying(chart,rows)
    for pos in rows:
        rows[pos]["dark_stem"]=dark["placements"][str(pos)]
        rows[pos]["dark_stem_variant"]=True
    chart["dark_stem_plate"]=dark
    chart["ten_stem_review"]={
        "version":"V53","historical_source":CLASSIC,
        "lookup_pairs":len(NAME_ROWS)*len(COLUMNS),
        "all_nine_by_nine_pairs_mapped":True,
        "unnamed_source_pairs":["丙加辛","庚加壬"],
        "actual_palace_count":8,
        "center_pair_computed":False,
        "palaces_with_conditions":[r["number"] for r in chart["palaces"]
                                    if r["classical_patterns"]],
        "conditions_are_predictions":False,
        "fortune_verdict":None,"timing_verdict":None,
        "remarks":"十干克应只查天盘与地盘干叠加的传统格名；三遁须星奇门神复合条件；未校暗干流派独立例盘不作为其他格局成立前提。",
    }
    chart["version"]="V53"
    chart["state"]="four_layers_patterns_and_variant_dark_stems"
    chart["has_ten_stem_lookup"]=True
    chart["has_structural_classic_patterns"]=True
    chart["has_dark_stem_variant"]=True
    chart["has_complete_rotating_plate"]=False
    chart["has_final_divination"]=False
    chart["fortune_conclusion"]=None
    chart["limitations"]=[
        "V53 81种天盘/地盘三奇六仪对照与经典格名，实际每盘8外宫；中五不是转宫干，不伪造克应。",
        "天遁、地遁、人遁等需多条件同宫才标候选，真实效力、吉凶和应期并未裁断。",
        "暗干使用单独明确的值使飞宫口径及中五例外，不是唯一流派，尚缺独立完整古籍暗干例盘核验。",
        "完整奇门断课、取用与不同流派系统未全部实现。",
    ]
    return chart
