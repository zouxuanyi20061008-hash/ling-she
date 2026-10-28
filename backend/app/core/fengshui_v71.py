"""V71 三元九运/玄空下卦：立春定立极运，洛书运、山、向三星同宫。

非建筑实测；按沈氏玄空下卦常见法：山向宫取运星入中，依据入中
星的本宫与坐向同元龙之山阴阳决定飞行方向。五黄借本运星本宫。
不得用本山阴阳直接决定挨星，也不自动推兼向替卦或吉凶。
"""
from __future__ import annotations

from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from lunar_python import Solar

from .fengshui import MOUNTAINS, PALACE_GRID, PALACE_NUMBERS, TRIGRAMS

BEIJING=ZoneInfo("Asia/Shanghai")
FLIGHT=(5,6,7,8,9,1,2,3,4)   # 中-乾-兑-艮-离-坎-坤-震-巽
YANG=frozenset("乾坤艮巽甲庚壬丙寅申巳亥")
YIN=frozenset("子午卯酉辰戌丑未乙辛丁癸")
YUAN=("天元龙","人元龙","地元龙")  # V70 从子开始顺时针的三山位置
HOUSE_STARS=("一白贪狼","二黑巨门","三碧禄存","四绿文曲",
             "五黄廉贞","六白武曲","七赤破军","八白左辅","九紫右弼")
SOURCES={
 "period":"https://www.chanweitang.com/post/139.html",
 "regular_chart":"https://research.xishe.ai/flying-stars",
 "independent_period8_zi_wu":"https://profound.fate-craft.com/fengshui/feixing/8/zi-wu",
 "lichun":"https://chineselunarcalendar.org/solar-terms/lichun",
}

def _lichun(year:int)->datetime:
    """lunar_python 1.4.8 节气表的中国民用时；选择公历年份相符的一条。"""
    lunar=Solar.fromYmdHms(year,2,5,12,0,0).getLunar()
    table=lunar.getJieQiTable()
    found=[x for k,x in table.items() if k in ("立春","LI_CHUN") and x.getYear()==year]
    if len(found)!=1:
        raise ValueError(f"{year}年立春历算出现缺失或重号，请核验万年历。")
    return datetime.strptime(found[0].toYmdHms(),"%Y-%m-%d %H:%M:%S").replace(tzinfo=BEIJING)

def determine_period(foundation_date:date,foundation_clock:time)->dict:
    if not 1901<=foundation_date.year<=2099:
        raise ValueError("三元九运立极日期只支持1901至2099年公历。")
    if foundation_clock.tzinfo is not None:
        raise ValueError("立极时刻须为北京时间钟面值，不能输入时区偏移。")
    instant=datetime.combine(foundation_date,foundation_clock).replace(tzinfo=BEIJING)
    current=_lichun(foundation_date.year)
    effective_year=foundation_date.year if instant>=current else foundation_date.year-1
    start=1864+((effective_year-1864)//20)*20
    index=((start-1864)//20)%9
    period=index+1
    yuan=("上元","中元","下元")[index//3]
    boundary_start=_lichun(start) if start>=1901 else None
    boundary_end=_lichun(start+20) if start+20<=2099 else None
    distance_minutes=abs((instant-current).total_seconds())/60
    return {
      "period":period,"label":f"{period}运", "yuan":yuan,
      "star_name":HOUSE_STARS[index], "start_year":start,"end_year_inclusive":start+19,
      "effective_lichun_year":effective_year,
      "effective_lichun_for_input_year":current.isoformat(timespec="seconds"),
      "start_at_beijing":boundary_start.isoformat(timespec="seconds") if boundary_start else None,
      "ends_before_beijing":boundary_end.isoformat(timespec="seconds") if boundary_end else None,
      "near_lichun_boundary":distance_minutes<=15,
      "foundation_beijing":instant.isoformat(timespec="seconds"),
      "foundation_rule":"以实际立极/入住/大修日期定运，交运点取当年北京时间立春精确时刻",
    }

def _fly(seed:int, step:int)->dict[int,int]:
    if not 1<=seed<=9 or step not in (-1,1):
        raise ValueError("飞星起数或顺逆无效。")
    return {palace:((seed-1+step*i)%9)+1 for i,palace in enumerate(FLIGHT)}

def _flight_trace(base:dict[int,int],mountain:dict,period:int)->dict:
    seed=base[mountain["palace_number"]]
    original_yuan=YUAN[mountain["mountain_index"]%3]
    borrowed=seed==5
    home_star=period if borrowed else seed
    if home_star==5:
        raise ValueError("五黄无法确定寄宫，请复核本运。")
    trigram_index=PALACE_NUMBERS.index(home_star)
    # 八卦三山顺时针位置：地元、天元、人元；依元龙取其阴阳。
    home_mounts=[MOUNTAINS[(3*trigram_index-1+k)%24] for k in range(3)]
    position={"地元龙":0,"天元龙":1,"人元龙":2}[original_yuan]
    decision_mountain=home_mounts[position]
    polarity="阳" if decision_mountain in YANG else "阴"
    direction=1 if polarity=="阳" else -1
    assert decision_mountain in YANG|YIN
    return {
      "seed":seed,"yuan_long":original_yuan,"source_mountain":mountain["mountain"],
      "source_palace_number":mountain["palace_number"],
      "source_period_star":seed,"borrowed_five":borrowed,
      "five_borrowed_home_star":home_star if borrowed else None,
      "home_trigram":TRIGRAMS[trigram_index],
      "home_same_yuan_mountain":decision_mountain,
      "home_yinyang":polarity,"direction":"顺飞" if direction==1 else "逆飞",
      "step":direction,"by_palace":_fly(seed,direction)
    }

def decorate_fengshui_v71(chart:dict,foundation_date:date,foundation_clock:time)->dict:
    period=determine_period(foundation_date,foundation_clock)
    chart["version"]="V71"
    chart["period"]=period
    chart["input"]["foundation_date"]=foundation_date.isoformat()
    chart["input"]["foundation_clock"]=foundation_clock.strftime("%H:%M")
    chart["input"]["foundation_timezone"]="Asia/Shanghai"
    chart["sources"]["period_and_lower_chart"]=SOURCES
    chart["not_implemented"]=[
        "实地真北测量或设备定位","自动磁偏角与宅向核定",
        "兼向替卦与分金细法","流年/月飞星及流派变例","形势与吉凶论断"
    ]
    chart["warnings"]=[
        w.replace("未实现玄空飞星、三元九运、分金和形势评估。",
                  "下卦排盘按独立立极日期计算；兼向替卦、分金及形势评估尚未实现。")
        for w in chart["warnings"]
    ]
    if period["near_lichun_boundary"]:
        chart["warnings"].append("立极时刻距离立春交节不超过15分钟，请核对权威节气时刻。")
    if chart["near_boundary"]:
        chart["flying_stars"]=None
        chart["flying_status"]="blocked_mountain_boundary"
        chart["warnings"].append("二十四山界附近无法稳妥确认坐向，本次只显示元运，不生成玄空三盘。")
        return chart
    sitting=chart["sitting"]
    facing=chart["facing"]
    deviation=max(abs(sitting["offset_from_center_degrees"]),
                  abs(facing["offset_from_center_degrees"]))
    if deviation>4.5:
        chart["flying_stars"]=None
        chart["flying_status"]="blocked_replacement_chart_uncertain"
        chart["warnings"].append("坐向偏离本山中心超过4.5°，可能涉及兼向替卦：V71拒绝强行生成下卦盘。")
        return chart
    base=_fly(period["period"],1)
    mountain=_flight_trace(base,sitting,period["period"])
    toward=_flight_trace(base,facing,period["period"])
    cells=[]
    for static in chart["nine_palaces"]:
        n=static["number"]
        cell={
          "number":n,"trigram":static["trigram"],"direction":static["direction"],
          "period_star":base[n],"mountain_star":mountain["by_palace"][n],
          "facing_star":toward["by_palace"][n],
          "is_sitting":static["is_sitting"],"is_facing":static["is_facing"],
          "is_center":static["is_center"],
        }
        static["flying_stars"]={k:cell[k] for k in ("period_star","mountain_star","facing_star")}
        cells.append(cell)
    chart["flying_stars"]={
       "type":"下卦（正向）三盘","period_star":period["period"],
       "flight_path":list(FLIGHT),
       "period_trace":{"seed":period["period"],"direction":"顺飞","by_palace":base},
       "mountain_trace":{k:v for k,v in mountain.items() if k!="by_palace"},
       "facing_trace":{k:v for k,v in toward.items() if k!="by_palace"},
       "palaces":cells,
       "rules":{
         "period":"入中运星恒顺飞，按洛书中乾兑艮离坎坤震巽顺序",
         "mountain":"取运盘坐宫数入中，按该星所属本卦与坐山同元龙的山之阴阳决定顺逆",
         "facing":"取运盘向宫数入中，同元龙的山之阴阳决定顺逆",
         "five":"五黄入中且需判顺逆时，借所处元运之星所属卦为归属卦",
         "limit":"仅中心偏移≤4.5°且不在山界提示范围内生成普通下卦；不自动作替卦或断语",
       },
    }
    chart["flying_status"]="computed_regular_lower_chart"
    return chart
