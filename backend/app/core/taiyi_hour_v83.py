"""V83 太乙时计八门直使：二至交节相对时与前甲子简捷积时双口径并行。

《太乙金镜式经·推八门用法》记录旧法甲子起与王希明新法二至
气应起算，明确新法“门则随数起，时尽则移，不拘其甲丙己辛日”。
《太乙金钥匙一卷·时计求冬夏二至八门》也记二至积时以120、30取门。
V80的古例庚戌47/887同为生门第17时，只证明相差840=7*120时
在这个例子中门名相同，不证明所有现代日期两历元相同。

本版双时计并列，不把王希明气应法的直使填入V78甲子起算的V82
主客将旋宫候选。要使用气应法主客门盘，必须另得完整气应基数的
主客大将，而不是混合两套起宫起门时刻。
"""
from __future__ import annotations

from .taiyi_hour_v80 import hour_door_chief
from .taiyi_hour_v82 import EIGHT_DOORS,PALACES8

JINJING="https://www.shidianguji.com/zh/book/SK1615/chapter/1l9lir739jmyy"
JINYAO="https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkvlnkx7u"
JINYAO_GENGXU="https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkylq3yn8"
JINJING_OLD_NEW={
    "historical_old":"张良甲子日起门，甲子、甲午干支节点三十时换门",
    "historical_new":"王希明冬夏至气应起门，时尽移门，不拘甲丙己辛日",
    "original_source":JINJING,
    "historical_absolute_upper_epoch_unproven":True,
}

def contrast_two_hour_chief_clocks(*,solstice_count:int,jiazi_count:int,dun:str,
                                   solstice_name:str)->dict:
    """两个合法正整数时计起点分别求直使，拒绝混合成无源的第三值。"""
    if dun not in ("阳遁","阴遁"):
        raise ValueError("V83 只可比较阳遁或阴遁")
    if solstice_name not in ("冬至","夏至") or (dun=="阳遁")!=(solstice_name=="冬至"):
        raise ValueError("V83 冬夏至与阴阳遁必须一致")
    actual=hour_door_chief(solstice_count,dun)
    shortcut=hour_door_chief(jiazi_count,dun)
    offset=jiazi_count-solstice_count
    # 二者在相同时间每时前进一位，若不是常数差则早期跨时口径有误。
    if offset<0:
        raise ValueError("V83 甲子日前捷法累计时数不应小于二至后时数")
    cycle_offset=offset%120
    same=(actual["chief_door"]==shortcut["chief_door"])
    boundary_identical=(
        actual["hour_in_door"]==shortcut["hour_in_door"] and
        actual["index_in_four"]==shortcut["index_in_four"])
    return {
       "version":"V83","status":"two_attested_epoch_clocks_computed",
       "dun":dun,"solstice_name":solstice_name,
       "jinjing_solstice_relative":{
          **actual,"school_id":"wangximing_solstice_qi",
          "epoch_kind":"最近冬夏至交节所在双时辰起算（V77，相对时实）",
          "source":JINJING,"second_source":JINYAO,
          "is_canonical_upper_epoch":False,
          "is_verified_complete_eight_gate_chart":False,
       },
       "jinyao_jiazi_shortcut":{
          **shortcut,"school_id":"jiazi_before_solstice_shortcut",
          "epoch_kind":"二至前最近甲子日子时起算（V78简捷法）",
          "source":JINYAO,
          "is_canonical_upper_epoch":False,
          "is_verified_complete_eight_gate_chart":False,
       },
       "relative_count":solstice_count,"previous_jiazi_count":jiazi_count,
       "offset_between_epoch_hours":offset,
       "offset_modulo_120":cycle_offset,
       "same_chief_door":same,
       "same_chief_and_hour_in_door":boundary_identical,
       "solstice_chief":actual["chief_door"],
       "jiazi_chief":shortcut["chief_door"],
       "solstice_hour_in_door":actual["hour_in_door"],
       "jiazi_hour_in_door":shortcut["hour_in_door"],
       "different_epoch_may_produce_same_door":same,
       "old_and_new_sources":JINJING_OLD_NEW,
       "example_887_47":{
          "original_hour_887":887,"short_hour_from_jiaxu":47,
          "offset_hours":840,"is_seven_120_hour_cycles":840%120==0,
          "same_chief":hour_door_chief(887,"阳遁")["chief_door"]==
                       hour_door_chief(47,"阳遁")["chief_door"]=="生",
          "same_hour_in_door":hour_door_chief(887,"阳遁")["hour_in_door"]==
                              hour_door_chief(47,"阳遁")["hour_in_door"]==17,
          "witness":JINYAO_GENGXU,
          "not_proof_all_current_dates_agree":True,
       },
       "can_promote_jiazi_rotations_to_solstice":False,
       "alternative_eight_door_palaces_recomputed":False,
       "all_eight_doors_placed":False,
       "no_unique_gate_epoch_selected":True,
       "fortune_verdict":None,
    }

def decorate_taiyi_v83(chart:dict)->dict:
    if chart.get("version")!="V77" or chart.get("hour_door_school_version")!="V82":
        raise ValueError("V83 只能从V82完整时计来源分支进一步校验")
    a=chart["time_cycle"]
    b=chart["classical_jiazi_hour_v78"]
    if (b["compared_to_v77"]["v77_relative_since_solstice"]!=
            a["relative_time_count"] or
        b["compared_to_v77"]["v78_from_prior_jiazi"]!=b["accumulated_hours"] or
        b["compared_to_v77"]["offset_in_double_hours"]!=
            b["accumulated_hours"]-a["relative_time_count"] or
        b["is_absolute_upper_jiazi_epoch"] is not False):
        raise ValueError("V83 二至及甲子起点原始数据不一致")
    result=contrast_two_hour_chief_clocks(
        solstice_count=a["relative_time_count"],
        jiazi_count=b["accumulated_hours"],dun=a["dun"],
        solstice_name=chart["solstice"]["name"])
    gate=chart["hour_eight_doors_v80"]
    if (gate["hour_count"]!=result["previous_jiazi_count"] or
        gate["chief_door"]!=result["jiazi_chief"] or
        gate["hour_in_door"]!=result["jiazi_hour_in_door"]):
        raise ValueError("V83 不得把V80甲子派直使伪称王希明二至派")
    old=chart["hour_v82_eight_door_schools"]
    if (old["chief"]!=result["jiazi_chief"] or
        old["no_verified_unified_school"] is not True or
        old["which_school_is_default"] is not None):
        raise ValueError("V83 V82不同起宫候选须保持来源与无默认判定")
    for variant in old["candidates"]:
        if (variant["chief"]!=result["jiazi_chief"] or
            variant["by_door"].get(variant["chief"])!=variant["anchor_palace"] or
            variant["verified_as_single_complete_hour_chart"] is not False):
            raise ValueError("V83 不能将被篡改的八门候选映射到另一历元")
    chart["hour_v83_chief_epoch_comparison"]=result
    chart["hour_door_epoch_version"]="V83"
    chart["has_verified_hour_door_location"]=False
    chart["has_all_hour_eight_door_positions"]=False
    chart["has_full_hour_chart"]=False
    chart["warnings"].append(
        "V83《金镜式经》二至气应法与《金钥匙》甲子捷法并列核算120时四门；"
        "不同起点可能得到不同值使，V82甲子派八门候选不得混入二至派直使。"
        "完整时计八门古例及绝对上元历元仍待核实。")
    from .taiyi_hour_v84 import decorate_taiyi_v84
    return decorate_taiyi_v84(chart)
