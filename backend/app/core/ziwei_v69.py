"""V69 依《紫微斗数全书》卷二安十二辅煞及生年四化；保留壬年化科异文。"""
from __future__ import annotations
from .calendar import BRANCHES

FOUR_NAMES = ("化禄","化权","化科","化忌")
QUANSHU = {
 "甲":("廉贞","破军","武曲","太阳"),"乙":("天机","天梁","紫微","太阴"),
 "丙":("天同","天机","文昌","廉贞"),"丁":("太阴","天同","天机","巨门"),
 "戊":("贪狼","太阴","右弼","天机"),"己":("武曲","贪狼","天梁","文曲"),
 "庚":("太阳","武曲","太阴","天同"),"辛":("巨门","太阳","文曲","文昌"),
 "壬":("天梁","紫微","天府","武曲"),"癸":("破军","巨门","太阴","贪狼"),
}
COMMON = {**QUANSHU,"壬":("天梁","紫微","左辅","武曲")}
LUCUN = dict(zip("甲乙丙丁戊己庚辛壬癸","寅卯巳午巳午申酉亥子",strict=True))
KUI_YUE = {
 "甲":("丑","未"),"乙":("子","申"),"丙":("亥","酉"),"丁":("亥","酉"),
 "戊":("丑","未"),"己":("子","申"),"庚":("丑","未"),"辛":("寅","午"),
 "壬":("卯","巳"),"癸":("卯","巳"),
}
HORSE = {**dict.fromkeys("寅午戌","申"),**dict.fromkeys("申子辰","寅"),
         **dict.fromkeys("巳酉丑","亥"),**dict.fromkeys("亥卯未","巳")}
SOURCE = "https://wk.100ke.info/zh/紫微斗數全書/卷二"
COMMON_SOURCE = "https://fortunecloud.co/zh-cn/learn/four-transformations"

def _branch(index:int)->str:
    return BRANCHES[index % 12]

def decorate_ziwei_v69(chart:dict,month:int,school:str="quanshu")->dict:
    """在已验证的 V68 命盘基础上安辅曜，不改动十四主星。"""
    if school not in ("quanshu","common"):
        raise ValueError("四化口径只能选择《全书》或现代通行表。")
    if not 1<=month<=12:
        raise ValueError("须提供合法农历月才能安辅曜。")
    year_stem,year_branch=chart["year_ganzhi"]
    hour_idx=chart["hour_index"]
    lu=LUCUN[year_stem]
    aux={
      "左辅":_branch(4+month-1),"右弼":_branch(10-(month-1)),
      "文昌":_branch(10-hour_idx),"文曲":_branch(4+hour_idx),
      "禄存":lu,"天魁":KUI_YUE[year_stem][0],"天钺":KUI_YUE[year_stem][1],
      "天马":HORSE[year_branch],
      "擎羊":_branch(BRANCHES.index(lu)+1),
      "陀罗":_branch(BRANCHES.index(lu)-1),
      "地劫":_branch(11+hour_idx),"地空":_branch(11-hour_idx),
    }
    all_positions={**chart["star_positions"],**aux}
    name_by_branch={p["branch"]:p["name"] for p in chart["palaces"]}
    row=(QUANSHU if school=="quanshu" else COMMON)[year_stem]
    transformations=[{
      "name":name,"star":star,"branch":all_positions[star],
      "palace_name":name_by_branch[all_positions[star]],
      "star_kind":"auxiliary" if star in aux else "main",
      "year_stem":year_stem,
    } for name,star in zip(FOUR_NAMES,row,strict=True)]
    for palace in chart["palaces"]:
        palace["auxiliary_stars"]=[s for s,b in aux.items() if b==palace["branch"]]
        palace["four_transformations"]=[{"name":t["name"],"star":t["star"]}
            for t in transformations if t["branch"]==palace["branch"]]
    chart.update({
      "version":"V69","status":"fourteen_main_twelve_auxiliary_four_transformations",
      "auxiliary_star_positions":aux,"auxiliary_star_count":len(aux),
      "all_star_positions":all_positions,"four_transform_school":school,
      "four_transform_school_label":"《紫微斗数全书》卷二" if school=="quanshu"
          else "现代通行表（壬年左辅化科）",
      "four_transformations":transformations,
      "four_transform_disagreement":({
        "topic":"壬年化科","chosen_star":row[2],"quanshu_star":"天府",
        "common_star":"左辅","quanshu_source":SOURCE,"common_source":COMMON_SOURCE,
      } if year_stem=="壬" else None),
      "auxiliary_rules":{
        "month":"左辅辰起正月顺数、右弼戌起正月逆数；闰月依选定的安宫月份",
        "hour":"文昌戌起子时逆数、文曲辰起子时顺数；地劫亥起子时顺数、地空逆数",
        "year_stem":"禄存按年干；擎羊在禄存后一宫、陀罗在前一宫；魁钺据年干",
        "year_branch":"天马按生年地支三合安寅申巳亥",
        "variant":"壬年化科有天府/左辅异文，辛年魁钺先后部分流派相反；本版辛魁寅钺午",
        "source":SOURCE},
      "not_implemented":["其余杂曜及火铃","大限流年四化、小限","地方真太阳时及晚子时变例","实务吉凶论断"],
    })
    chart["rules"]["four_transformations"]="只依农历生年干，固定禄权科忌四星，壬年表格选定后整体采用该口径"
    chart["rules"]["auxiliary_stars"]="十二辅煞据农历出生月、时支和生年干支安星，仍未覆盖全部杂曜"
    chart["sources"]["auxiliary_four_transformations"]=SOURCE
    chart["sources"]["common_four_transformations"]=COMMON_SOURCE
    if year_stem=="辛":
        chart["warnings"].append("辛年天魁天钺先后存在不同传本，本版按《全书》魁寅钺午。")
    return chart
