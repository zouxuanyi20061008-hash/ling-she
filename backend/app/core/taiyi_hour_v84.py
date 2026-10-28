"""V84 王希明二至气应时计独立盘：太乙、计神、直使与太乙八门候选。

据《太乙金镜式经》卷一：二至气应即时起太乙三时一移，
计神一时一移逆十二支；“常以直门加太乙及主客大将随数而行，
太乙三时一移，大将一时一移”。原典虽明确大将移动频率，
但尚无同一气应历元下主客将初始方位的独立课例，不可把
V78甲子起元局、文昌、始击、主客大将移植为气应派。

只求气应派真实相对时数、太乙宫、计神、四门直使及
【有来源锚点、八卦数学旋宫】太乙八门候选；主客将两分支待判。
与甲子派完整分支严格分开，哪怕两派门名偶然相同也不混宫位。
"""
from __future__ import annotations

from .taiyi_hour_v77 import hour_cycle_from_count
from .taiyi_hour_v80 import hour_door_chief
from .taiyi_hour_v82 import (rotate_eight_door_candidate,
                             EIGHT_DOORS,PALACES8, SOURCE_JINJING)
from .taiyi_hour_v83 import contrast_two_hour_chief_clocks

SOURCE_QI="https://zh.wikisource.org/zh-hans/太乙金鏡式經_(四庫全書本)/卷01"
SOURCE_DOORS="https://www.shidianguji.com/zh/book/SK1615/chapter/1l9lir739jmyy"

def qiying_hour_core(relative_hours:int,dun:str,solstice_name:str)->dict:
    """只依V77真实二至后时实，独立算宫/计神/四门；不从甲子派借将。"""
    if solstice_name not in ("冬至","夏至") or (
       (dun=="阳遁")!=(solstice_name=="冬至")):
        raise ValueError("V84 二至交节与阴阳遁的对应关系错误")
    hour=hour_cycle_from_count(relative_hours,dun)
    door=hour_door_chief(relative_hours,dun)
    castle=hour["taiyi_palace"]["number"]
    if castle not in PALACES8:
        raise ValueError("V84 二至气应派太乙不得入中五")
    candidate=rotate_eight_door_candidate(castle,door["chief_door"],"jinjing_taiyi")
    if candidate["by_door"][door["chief_door"]]!=castle:
        raise ValueError("V84 气应派直使候选的起宫和太乙不一致")
    if len(candidate["slots"])!=8 or len(candidate["by_door"])!=8:
        raise ValueError("V84 八门候选必须八正宫各门一次")
    empty=lambda which:{
        "side":which,"status":"pending_unverified_qiying_initial_general",
        "palace":None,"general_count":None,
        "known_motion":"主客大将每时一移（古籍文字）；尚需气应历元的初始将位",
        "has_attested_initial_qiying_palace":False,
        "may_reuse_jiazi_generals":False,
        "can_place_eight_doors":False,
        "source":SOURCE_DOORS,
    }
    return {
        "version":"V84","status":"qiying_taiyi_and_jishen_computed_general_pending",
        "calculation":"王希明二至气应法·独立时计基本式",
        "epoch":"真实二至交节所在双时辰从第一时计起",
        "relative_hours":relative_hours,"dun":dun,"solstice_name":solstice_name,
        "taiyi_palace":hour["taiyi_palace"],
        "taiyi_ring_order":hour["ring_order"],
        "taiyi_hour_in_palace":hour["hours_in_current_palace"],
        "jishen":hour["jishen"],"jishen_start":hour["jishen_start"],
        "hour_chief":door,
        "taiyi_eight_door_conditional_rotation":candidate,
        "qiying_main_general":empty("主"),"qiying_guest_general":empty("客"),
        "qiying_wenchang":None,"qiying_shiji":None,
        "has_verified_qiying_wenchang":False,
        "has_verified_qiying_main_guest":False,
        "has_verified_full_eight_door_palaces":False,
        "taiyi_anchor_attested_but_all_eight_unverified":True,
        "does_not_use_jiazi_wenchang_or_generals":True,
        "source":{"hour_palace_jishen":SOURCE_QI,"chief_and_general_motion":SOURCE_DOORS},
        "fortune_verdict":None,
    }

def compare_qiying_and_jiazi(chart:dict)->dict:
    if (chart.get("version")!="V77" or
        chart.get("hour_door_epoch_version")!="V83" or
        chart.get("hour_door_school_version")!="V82"):
        raise ValueError("V84 必须使用V77至V83完整真实时计及来源分支")
    time_cycle=chart["time_cycle"]
    solstice=chart["solstice"]
    previous=chart["classical_jiazi_hour_v78"]
    compare=chart["hour_v83_chief_epoch_comparison"]
    qi=qiying_hour_core(time_cycle["relative_time_count"],time_cycle["dun"],
                        solstice["name"])
    for field in ("relative_count","previous_jiazi_count","solstice_chief",
                  "jiazi_chief","same_chief_door"):
        if field not in compare:
            raise ValueError("V84 V83 双历元直使对照缺少原始证据："+field)
    expected=contrast_two_hour_chief_clocks(
        solstice_count=time_cycle["relative_time_count"],
        jiazi_count=previous["accumulated_hours"],
        dun=time_cycle["dun"],solstice_name=solstice["name"])
    if (qi["taiyi_palace"]!=time_cycle["taiyi_palace"] or
        qi["jishen"]!=time_cycle["jishen"] or
        time_cycle["jishen"]!=chart["jishen"]["branch"] or
        time_cycle["ring_order"]!=qi["taiyi_ring_order"] or
        qi["taiyi_hour_in_palace"]!=time_cycle["hours_in_current_palace"]):
        raise ValueError("V84 二至气应的太乙宫或计神不得被甲子派覆盖")
    if any(compare[field]!=expected[field] for field in (
        "relative_count","previous_jiazi_count","solstice_chief","jiazi_chief",
        "same_chief_door","offset_between_epoch_hours","offset_modulo_120")):
        raise ValueError("V84 V83 任何一个值使历元必须通过独立重算")
    if qi["hour_chief"]["chief_door"]!=compare["solstice_chief"]:
        raise ValueError("V84 王希明气应派起门与二至时实不一致")
    old=chart["hour_v82_eight_door_schools"]
    current=chart["hour_main_guest_v79"]
    if (old["chief"]!=compare["jiazi_chief"] or
        current["taiyi_palace"]!=previous["taiyi_palace"]["number"]):
        raise ValueError("V84 甲子派时计必须保留原始的独立起元")
    jiazi_taiyi=next((s for s in old["candidates"]
         if s["school"]=="jinjing_taiyi"),None)
    if not jiazi_taiyi or (
        jiazi_taiyi["anchor_palace"]!=current["taiyi_palace"] or
        jiazi_taiyi["by_door"].get(compare["jiazi_chief"])!=current["taiyi_palace"]):
        raise ValueError("V84 甲子派太乙宫八门锚点数据不可信")
    qirot=qi["taiyi_eight_door_conditional_rotation"]
    a=qirot["by_palace"]
    b=jiazi_taiyi["by_palace"]
    identical=a==b
    if identical!=all(a[str(p)]==b[str(p)] for p in PALACES8):
        raise ValueError("V84 两历元八门候选比较不自洽")
    return {
        "version":"V84","status":"separate_epoch_hour_plate_compared",
        "qiying":qi,
        "jiazi":{
          "school_id":"jiazi_before_solstice_shortcut",
          "accumulated_hours":previous["accumulated_hours"],
          "taiyi_palace":previous["taiyi_palace"],
          "hour_chief":chart["hour_eight_doors_v80"],
          "taiyi_eight_door_conditional_rotation":jiazi_taiyi,
          "wenchang_and_main_guest_reference_only":"hour_main_guest_v79",
          "may_be_reused_as_qiying_general":False,
          "not_an_absolute_historical_upper_epoch":True,
        },
        "same_chief":compare["same_chief_door"],
        "same_taiyi_palace":qi["taiyi_palace"]["number"]==current["taiyi_palace"],
        "same_conditional_taiyi_door_rotation":identical,
        "same_rotation_does_not_prove_same_epoch":True,
        "different_schools_never_merged":True,
        "qiying_main_guest_from_original_epoch_verified":False,
        "all_eight_gates_attested_independently":False,
        "fortune_verdict":None,
    }

def decorate_taiyi_v84(chart:dict)->dict:
    result=compare_qiying_and_jiazi(chart)
    chart["hour_v84_qiying_plate"]=result
    chart["qiying_plate_version"]="V84"
    chart["has_verified_qiying_main_guest"]=False
    chart["has_all_hour_eight_door_positions"]=False
    chart["has_full_hour_chart"]=False
    chart["warnings"].append(
      "V84 王希明二至气应时计已独立排太乙、计神与直使，按太乙宫形成八门有源候选；"
      "气应主客大将的一时一移虽有原典但起宫未知，不能从甲子派借位。"
      "两历元候选即使偶同也不等同于完整时计八门已验真。")
    return chart
