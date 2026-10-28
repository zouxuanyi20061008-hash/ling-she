"""V81 时计定算史料勘误证据链、同宫类别和直使候选落点。

仅《太乙金钥匙》同书的两种数字呈现：庚戌时原文列八项合32，
正文反复写33；没有发现足以另行证明加一的独立古籍通则。
同书丁未日定计列七项合32，说明「按实加数」另有文本例课，
但非庚戌时的独立异本。保留二者证据等级，绝不选择伪造修正。

书内岁计段有「直事门加定计目所治之宫」，一卷有「古法以直使门
加于定计目」；这是可计算的【古法候选定位】，时计的完整八门
飞布/本例落宫仍无独立课图校验，默认不可标为认证的时计门盘。
"""
from __future__ import annotations
from .taiyi_v65 import DIRECTIONS,GODS,GONG,INDEX
from .taiyi_hour_v80 import WITNESS_887

SOURCE_CONTINUATION="https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkylq3yn8"
SOURCE_VOLUME="https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkvlnkx7u"
SOURCE_GENERAL="https://ctext.org/wiki.pl?chapter=275091&if=gb"
DAY_DINGJI={"kind":"different_day_example_in_same_volume","name":"丁未日定计",
    "positive_addends":[3,4,9,2,7,6,1],"sum":32,
    "printed_sum":32,"source":SOURCE_CONTINUATION,
    "not_an_independent_gengxu_manuscript":True}
DOOR_METHODS=[
  {"scope":"old_dingji_eye_method","text_context":"岁计及古法说明，时计完整八门尚未独立证实",
   "location_basis":"定计目十六神位","source":SOURCE_CONTINUATION},
  {"scope":"old_dingji_eye_method","text_context":"一卷古法说明，非庚戌时完整八门飞宫图",
   "location_basis":"定计目十六神位","source":SOURCE_VOLUME},
]

def source_review_v81(dingji:dict)->dict:
    if dingji.get("version")!="V80":
        raise ValueError("V81 必须使用V80逐宫定算真实轨迹")
    status=dingji.get("status")
    if status not in ("computed","pending","source_conflict"):
        raise ValueError("V81 不能把未审核算数当成已定案")
    trace=dingji.get("computed_trace")
    if not isinstance(trace,list):
        raise ValueError("V81 缺少时计定算原始轨迹")
    nonzero=[{"god":s["god"],"direction":s["direction"],"added":s["added"]}
             for s in trace if s["added"]>0]
    total=sum(s["added"] for s in trace)
    if status=="pending":
        if trace or dingji.get("count") is not None or not dingji.get("same_palace_conservative"):
            raise ValueError("V81 同宫待判不应凭空产出轨迹或算数")
        forensic="same_palace_requires_primary_time_rule"
    elif status=="computed":
        if total!=dingji["computed_trace_sum"] or dingji["count"]!=total:
            raise ValueError("V81 已算定算必须等于逐宫实数")
        forensic="algorithmic_count_verified_no_recorded_discrepancy"
    else:
        if total!=32 or dingji.get("computed_trace_sum")!=32:
            raise ValueError("V81 庚戌同构原例须保留32的实际逐项和")
        if [x["added"] for x in nonzero]!=WITNESS_887["listed_contributions"]:
            raise ValueError("V81 八项算式须逐项对照古籍，而不是只比较总数")
        mismatch=dingji.get("source_disagreement")
        if (not isinstance(mismatch,dict) or mismatch.get("printed_total")!=33
            or mismatch.get("difference")!=1 or dingji["count"] is not None
            or dingji.get("main_general") is not None
            or dingji.get("assistant_general") is not None):
            raise ValueError("V81 不准把古籍33算、主大参将无证据写入已定值")
        forensic="historical_text_arithmetic_disagreement_open"
    return {
       "version":"V81","status":forensic,"calculation_status":status,
       "trace_length_including_zero_intermediate_positions":len(trace),
       "nonzero_addends":nonzero,"nonzero_sum":sum(s["added"] for s in nonzero),
       "zero_positions_kept_for_audit":len(trace)-len(nonzero),
       "reported_total":(dingji["source_disagreement"]["printed_total"]
                         if status=="source_conflict" else None),
       "candidate_arithmetic_general":dingji.get("unadopted_arithmetic_candidate"),
       "source_witnesses":[{
            "name":"庚戌时定计逐项八算及正文33",
            "source":SOURCE_CONTINUATION,"independent_from_other_witnesses":False,
            "role":"single_primary_text_with_internal_conflict",
            "addends":WITNESS_887["listed_contributions"],
            "arithmetic_sum":32,"written_count":33,
            "written_generals":[3,9],
            "applies_to":"庚戌时原例及相同课式算式的争议",
        },DAY_DINGJI],
       "does_not_claim_two_independent_editions":True,
       "no_automatic_plus_one":True,
       "can_finalize_disputed_generals":False,
       "awaits":"庚戌时独立异本或注明特殊加算的原典法条",
    }

def classify_same_palace_v81(dingji:dict,main_guest:dict)->dict:
    if dingji.get("version")!="V80" or main_guest.get("version")!="V79":
        raise ValueError("V81 同宫审查必须继V79、V80真实时计盘")
    cases=[]
    for side,p in (("主",main_guest["main"]),("客",main_guest["guest"]),
                   ("定",dingji)):
        status=p.get("status")
        if status!="pending":
            continue
        if side=="定":
            index=dingji["dingji_eye"]["index"]
            same=dingji["same_palace_conservative"]
            src=SOURCE_VOLUME
        elif side=="主":
            index=main_guest["heaven_eye_wenchang"]["index"]
            same=p.get("same_palace_as_taiyi")
            src=main_guest["sources"]["method"]
        else:
            index=main_guest["earth_eye_shiji"]["index"]
            same=p.get("same_palace_as_taiyi")
            src=main_guest["sources"]["method"]
        index_palace=GONG.get(DIRECTIONS[index])
        if not same or index_palace!=main_guest["taiyi_palace"]:
            raise ValueError("V81 同宫未决的实际神位不能与太乙不符")
        cases.append({
           "side":side,"kind":"same_exact_cardinal_spirit",
           "eye_index":index,"eye_direction":DIRECTIONS[index],
           "eye_god":GODS[index],"taiyi_palace":index_palace,
           "candidate_from_annual_source_not_selected":p.get("historical_alternative"),
           "source":src,
           "verified_hourly_exception":False,
           "computed_count":None,"computed_big_general":None,
           "reason":"古籍可知同宫一类，仍无时计独立整盘支持改用岁计同宫特例。",
        })
    return {
        "version":"V81","status":"pending" if cases else "no_same_palace_pending",
        "cases":cases,"pending_sides":len(cases),
        "never_auto_adopt_annual_exception":True,
    }

def door_location_candidate_v81(door:dict,dingji:dict,main_guest:dict)->dict:
    if door.get("version")!="V80" or dingji.get("version")!="V80":
        raise ValueError("V81 候选门位需要V80已算值使和定计目")
    eye=dingji["dingji_eye"]
    index=eye["index"]
    if not isinstance(index,int) or index not in range(16):
        raise ValueError("V81 定计目不在十六神合法方位")
    if (DIRECTIONS[index],GODS[index],GONG.get(DIRECTIONS[index]))!=(
        eye["direction"],eye["god"],eye["palace"]):
        raise ValueError("V81 候选落位必须是定计目真实方位")
    if door["chief_door"] not in door["sequence"] or main_guest["ju"] not in range(1,73):
        raise ValueError("V81 时计门值与元局本体未确认")
    marker=[{"index":i,"direction":direction,"god":GODS[i],
             "palace":GONG.get(direction),
             "candidate_chief_door_here":i==index,
             "candidate_door":door["chief_door"] if i==index else None,
             "is_dingji_eye":i==index,
             "is_taiyi_spirit":GONG.get(direction)==main_guest["taiyi_palace"]}
            for i,direction in enumerate(DIRECTIONS)]
    if sum(x["candidate_chief_door_here"] for x in marker)!=1:
        raise ValueError("V81 古法门位只能拥有唯一候选定位")
    if (eye["palace"] is None) != eye["is_intermediate"]:
        raise ValueError("V81 间神不可强行安放到九宫正宫")
    return {
       "version":"V81","status":"historical_placement_candidate",
       "chief_door":door["chief_door"],"chief_door_is_computed":True,
       "door_hour_in_thirty":door["hour_in_door"],
       "candidate_eye":eye,"candidate_direction":eye["direction"],
       "candidate_god":eye["god"],"candidate_index":index,
       "candidate_palace":eye["palace"],
       "is_intermediate_direction":eye["is_intermediate"],
       "candidate_position_marks":marker,
       "source_rule_scope":"岁计及通用古法有直使门加定计目的记载，时计具体庚戌盘未见独立八门落宫实例",
       "primary_text_rules":DOOR_METHODS,
       "hourly_candidate_inferred_not_confirmed":True,
       "chief_door_placed_by_user_verified_hour_case":False,
       "all_eight_doors_placed":False,
       "actual_hour_palace_if_unverified":None,
       "never_force_intermediate_into_palace":True,
       "fortune_verdict":None,
    }

def decorate_taiyi_v81(chart:dict)->dict:
    if (chart.get("version")!="V77" or
        chart.get("historical_ju_version")!="V78" or
        chart.get("main_guest_version")!="V79" or
        chart.get("classical_hour_extension_version")!="V80"):
        raise ValueError("V81 必须在V77至V80真实时计后执行")
    d=chart["hour_dingji_v80"]
    m=chart["hour_main_guest_v79"]
    g=chart["hour_eight_doors_v80"]
    audit=source_review_v81(d)
    collision=classify_same_palace_v81(d,m)
    gate=door_location_candidate_v81(g,d,m)
    if d["status"]=="source_conflict":
        if (chart.get("has_hour_dingji") or
            chart.get("hour_v80_historical_audit") is None or
            audit["status"]!="historical_text_arithmetic_disagreement_open"):
            raise ValueError("V81 古籍冲突不能被提升成已核验定算")
    chart["hour_v81_source_review"]=audit
    chart["hour_v81_same_palace_review"]=collision
    chart["hour_v81_door_location_candidate"]=gate
    chart["has_verified_hour_door_location"]=False
    chart["has_all_hour_eight_door_positions"]=False
    chart["has_full_hour_chart"]=False
    chart["historical_review_version"]="V81"
    chart["warnings"].append(
       "V81 将古法直使加定计目做十六神候选定位，并未获得时计完整实例验证；"
       "庚戌时逐项32与正文33仍属同一文本内部矛盾，同宫取算与全八门飞布待校。")
    from .taiyi_hour_v82 import decorate_taiyi_v82
    return decorate_taiyi_v82(chart)
