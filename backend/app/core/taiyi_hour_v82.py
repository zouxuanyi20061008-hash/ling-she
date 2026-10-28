"""V82 太乙时计八门环序及不同古法的完整旋宫【候选盘】，不是单一验真时盘。

《太白兵备统宗宝鉴·释八门直事》八方：开乾休坎生艮伤震杜巽景离死坤惊兑。
《太乙金镜式经》卷一：“常以直门加太乙及主客大将随数而行”；
《太乙金钥匙》：“古法以直使门加于定计目”，可在十六神间位。
三种锚点差异不可合并。本模块据八卦方位有序环、古籍直使门
和已算时计太乙宫、主客大将及定计目生成明确**旋转候选**。
未找到同时核对八门全部落宫的独立时计例课，不得标为认证的
完整时计式；间神定目不伪装八正宫，不从岁计积年起盘。
"""
from __future__ import annotations

from .taiyi_v65 import DIRECTIONS,GODS,GONG,INDEX
from .taiyi_hour_v80 import hour_door_chief
from .taiyi_hour_v81 import door_location_candidate_v81

DIRECTIONS8=("乾","坎","艮","震","巽","离","坤","兑")
EIGHT_DOORS=("开","休","生","伤","杜","景","死","惊")
PALACES8=(1,8,3,4,9,2,7,6)
FROM_EIGHT=dict(zip(EIGHT_DOORS,DIRECTIONS8))
SOURCE_EIGHT="https://www.shidianguji.com/book/SDZJ0646/chapter/1kg32q85u563p"
SOURCE_JINJING="https://www.shidianguji.com/zh/book/SK1615/chapter/1l9lir739jmyy"
SOURCE_JINYAO="https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkvlnkx7u"
SOURCE_JINYAO_HOUR="https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkylq3yn8"

def rotate_eight_door_candidate(anchor_palace:int,chief:str,school:str)->dict:
    """已知八门环序与一门临某八正宫，旋转其余七门的数学候选。
    这只说明【若采此古法起点】的模型结果，不代表古籍时盘验证。
    """
    if isinstance(anchor_palace,bool) or anchor_palace not in PALACES8:
        raise ValueError("V82 八门起点必须是八正宫，不能从中五或十六神间位强行借宫")
    if chief not in EIGHT_DOORS:
        raise ValueError("V82 值使门必须取自古籍八门")
    if school not in ("jinjing_taiyi","jinjing_main","jinjing_guest","jinyao_dingji_eye"):
        raise ValueError("V82 只支持有明确原典出处的候选锚点")
    palace_i=PALACES8.index(anchor_palace)
    door_i=EIGHT_DOORS.index(chief)
    items=[]
    for step in range(8):
        direction=DIRECTIONS8[(palace_i+step)%8]
        palace=PALACES8[(palace_i+step)%8]
        door=EIGHT_DOORS[(door_i+step)%8]
        items.append({
            "step":step,"direction":direction,"palace":palace,"door":door,
            "is_chief_anchor":step==0,
            "anchor_from_primary_text":True if step==0 else False,
            "calculated_by_canonical_eight_direction_rotation":True,
            "verified_full_hourly_door_position":False,
        })
    if len({x["palace"] for x in items})!=8 or len({x["door"] for x in items})!=8:
        raise ValueError("V82 八门每门必须出现且只出现一次，无中五")
    if items[0]["door"]!=chief or items[0]["palace"]!=anchor_palace:
        raise ValueError("V82 候选旋宫起始门宫未对齐")
    return {
        "school":school,"status":"source_anchored_rotation_candidate",
        "chief":chief,"anchor_palace":anchor_palace,
        "anchor_direction":DIRECTIONS8[palace_i],
        "compass_order":list(DIRECTIONS8),
        "canonical_door_order":list(EIGHT_DOORS),
        "slots":items,
        "by_palace":{str(z["palace"]):z["door"] for z in items},
        "by_door":{z["door"]:z["palace"] for z in items},
        "anchor_source":SOURCE_JINYAO if school=="jinyao_dingji_eye" else SOURCE_JINJING,
        "rotation_order_source":SOURCE_EIGHT,
        "can_display_all_eight_conditional_positions":True,
        "verified_as_single_complete_hour_chart":False,
    }

def source_scoped_eight_door_candidates(chart:dict)->dict:
    if (chart.get("version")!="V77" or
        chart.get("historical_ju_version")!="V78" or
        chart.get("main_guest_version")!="V79" or
        chart.get("classical_hour_extension_version")!="V80" or
        chart.get("historical_review_version")!="V81"):
        raise ValueError("V82 必须在V77到V81真实时计校核链之后执行")
    m=chart["hour_main_guest_v79"]
    d=chart["hour_dingji_v80"]
    gate=chart["hour_eight_doors_v80"]
    old=chart["hour_v81_door_location_candidate"]
    classic=chart["classical_jiazi_hour_v78"]
    if (classic.get("is_absolute_upper_jiazi_epoch") is not False or
        m["accumulated_hours"]!=classic["accumulated_hours"] or
        gate["hour_count"]!=classic["accumulated_hours"]):
        raise ValueError("V82 必须使用相同的甲子日时计历元")
    checked=hour_door_chief(gate["hour_count"],m["dun"])
    if gate["chief_door"]!=checked["chief_door"] or gate["hour_in_door"]!=checked["hour_in_door"]:
        raise ValueError("V82 时计直使与120时循环不一致")
    if m["taiyi_palace"]!=classic["taiyi_palace"]["number"] or (
        d["dingji_eye"]!=old["candidate_eye"]):
        raise ValueError("V82 太乙和定计目锚点不一致")
    eye=d["dingji_eye"]
    i=eye.get("index")
    if (isinstance(i,bool) or not isinstance(i,int) or i not in range(16)
        or (eye.get("direction"),eye.get("god"),eye.get("palace"),
            eye.get("is_intermediate")) !=
           (DIRECTIONS[i],GODS[i],GONG.get(DIRECTIONS[i]),
            DIRECTIONS[i] not in GONG)):
        raise ValueError("V82 真实十六神定计目索引/神名/间位/宫位不吻合")
    if (old.get("candidate_index")!=i or
        old.get("candidate_direction")!=DIRECTIONS[i] or
        old.get("candidate_god")!=GODS[i] or
        old.get("candidate_palace")!=GONG.get(DIRECTIONS[i])):
        raise ValueError("V82 V81候选定计目与十六神真实位置不一致")
    alternatives=[]
    missing=[]
    def append(key,palace,why):
        if palace is None:
            missing.append({"school":key,"reason":why,"empty_palace":None})
            return
        if palace not in PALACES8:
            raise ValueError("V82 非法主客将宫，拒绝安放八门")
        alternatives.append(rotate_eight_door_candidate(palace,gate["chief_door"],key))
    append("jinjing_taiyi",m["taiyi_palace"],"太乙八宫本应已实算")
    for side,key in (("main","jinjing_main"),("guest","jinjing_guest")):
        s=m[side]
        if s["status"]=="computed" and s["main_general"] in PALACES8:
            append(key,s["main_general"],"")
        elif s["status"]=="computed" and s["main_general"]==5:
            missing.append({"school":key,"reason":"主客大将落中五，八门环不入中宫；该分支不得直接安门",
                            "empty_palace":None})
        elif s["status"]=="pending" and s["main_general"] is None:
            missing.append({"school":key,"reason":"时计同宫大将仍待判，不能从未知将位旋八门",
                            "empty_palace":None})
        else:
            raise ValueError("V82 主客将状态与数字不自洽")
    if old["candidate_palace"] is None:
        missing.append({"school":"jinyao_dingji_eye",
            "reason":"定计目在十六神间位，古法允许记录方位，不能强制映射到八正宫",
            "eye_direction":old["candidate_direction"],"empty_palace":None})
    else:
        append("jinyao_dingji_eye",old["candidate_palace"],"")
    idkeys=[z["school"] for z in alternatives]+[z["school"] for z in missing]
    if len(idkeys)!=4 or len(set(idkeys))!=4:
        raise ValueError("V82 四条来源分支不能重复或者遗失")
    # 中央5宫需要保留 empty，八方的步进是乾坎艮震巽离坤兑，不可
    # 误用V77那条专属太乙八宫序列(1,2,3,4,6,7,8,9)。
    return {
       "version":"V82","status":"multiple_historical_anchor_candidates_unresolved",
       "epoch":"V78 二至前甲子日简捷时计",
       "chief":gate["chief_door"],
       "chief_hour_in_30":gate["hour_in_door"],
       "source_support":{
          "canonical_eight_door_compass":SOURCE_EIGHT,
          "time_chief_taiyi_main_guest":SOURCE_JINJING,
          "ancient_dingji_eye_variant":SOURCE_JINYAO,
          "independent_gengxu_hour_only_attests_chief":SOURCE_JINYAO_HOUR,
       },
       "base_compass":[{"door":z,"direction":FROM_EIGHT[z],
             "palace":PALACES8[i]} for i,z in enumerate(EIGHT_DOORS)],
       "candidates":alternatives,"unplaceable":missing,
       "candidate_count":len(alternatives),
       "four_anchor_schools_checked":True,
       "no_verified_unified_school":True,
       "which_school_is_default":None,
       "complete_eight_door_chart_verified":False,
       "does_not_claim_annual_door_240_cycle":True,
       "does_not_use_v77_solstice_relative_hours":True,
       "disputed_dingji_general_never_used_to_place_doors":d["status"]!="computed" or
          d["main_general"] is None,
       "fortune_verdict":None,
    }

def decorate_taiyi_v82(chart:dict)->dict:
    result=source_scoped_eight_door_candidates(chart)
    chart["hour_v82_eight_door_schools"]=result
    chart["hour_door_school_version"]="V82"
    chart["has_verified_hour_door_location"]=False
    chart["has_all_hour_eight_door_positions"]=False
    chart["has_full_hour_chart"]=False
    chart["warnings"].append(
      "V82 已按八卦环序列出太乙/主客大将/定计目四种原典锚点的候选八门排布；"
      "不同古法可能落宫不一致，时计完整八门例盘未交叉证实，不标记为唯一正式盘。")
    from .taiyi_hour_v83 import decorate_taiyi_v83
    return decorate_taiyi_v83(chart)
