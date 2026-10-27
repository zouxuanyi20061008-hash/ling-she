"""V58 大六壬：中气月将、十二支天地盘、日辰四课、可确证贼克/比用三传。

以《六壬指南》卷一、《六壬大全》起例为准：月将遇十二中气变，
不是四柱起月柱的十二节。三传九宗门尚未全覆盖时返回 pending，
绝不能从第一个候选中凭空造出初传。
"""
from __future__ import annotations
from datetime import date,datetime,time
from zoneinfo import ZoneInfo
from lunar_python import Solar

from .calendar import BRANCHES,STEMS,SIXTY_DAYS
from .bazi import BRANCH_ELEMENT,STEM_ELEMENT,CONTROLS
from .solar_calendar import preview_solar_calendar

CHINA=ZoneInfo("Asia/Shanghai")
LODGES={"甲":"寅","乙":"辰","丙":"巳","戊":"巳","丁":"未",
        "己":"未","庚":"申","辛":"戌","壬":"亥","癸":"丑"}
GENERALS={
    "雨水":("亥","登明"),"春分":("戌","河魁"),"谷雨":("酉","从魁"),
    "小满":("申","传送"),"夏至":("未","小吉"),"大暑":("午","胜光"),
    "处暑":("巳","太乙"),"秋分":("辰","天罡"),"霜降":("卯","太冲"),
    "小雪":("寅","功曹"),"冬至":("丑","大吉"),"大寒":("子","神后"),
}
SOURCE="https://zh.wikisource.org/zh-hans/%E5%85%AD%E5%A3%AC%E6%8C%87%E5%8D%97/1"
TRANSMISSION_SOURCE="https://libokang.com/classics/liuren/%E5%85%AD%E5%A3%AC%E5%A4%A7%E5%85%A8/"


def hour_branch(clock:time)->str:
    return BRANCHES[((clock.hour+1)//2)%12]


def sky_plate(month_general:str,占时:str)->dict:
    if month_general not in BRANCHES or 占时 not in BRANCHES:
        raise ValueError("月将与占时必须是地支")
    offset=(BRANCHES.index(month_general)-BRANCHES.index(占时))%12
    plate={ground:BRANCHES[(i+offset)%12] for i,ground in enumerate(BRANCHES)}
    if set(plate.values())!=set(BRANCHES) or plate[占时]!=month_general:
        raise ValueError("天地盘未达到月将加占时的双射条件")
    return plate


def four_lessons(day:str,plate:dict)->list[dict]:
    if day not in SIXTY_DAYS or set(plate)!=set(BRANCHES) or set(plate.values())!=set(BRANCHES):
        raise ValueError("须使用合法干支日和完整十二宫天盘")
    stem,branch=day[0],day[1]
    lower1=stem; upper1=plate[LODGES[stem]]
    lower2=upper1;upper2=plate[lower2]
    lower3=branch;upper3=plate[lower3]
    lower4=upper3;upper4=plate[lower4]
    result=[]
    for i,(lower,upper) in enumerate(((lower1,upper1),(lower2,upper2),
                                      (lower3,upper3),(lower4,upper4)),1):
        low_el=STEM_ELEMENT[lower] if lower in STEMS else BRANCH_ELEMENT[lower]
        high_el=BRANCH_ELEMENT[upper]
        relation="下贼上" if CONTROLS[low_el]==high_el else (
            "上克下" if CONTROLS[high_el]==low_el else "无直接克")
        result.append({"number":i,"lower":lower,"upper":upper,
                       "lower_element":low_el,"upper_element":high_el,
                       "relation":relation,
                       "from":"日干寄宫" if i==1 else ("干上神" if i==2 else
                               ("日支" if i==3 else "支上神"))})
    return result


def three_transmissions(day:str,plate:dict,lessons:list[dict],month_general:str,占时:str)->dict:
    """Implement only defensible deterministic 贼克 and single survivor 比用."""
    if len(lessons)!=4:raise ValueError("必须有四课才可核发用")
    if month_general==占时 or (BRANCHES.index(month_general)-BRANCHES.index(占时))%12==6:
        return {"status":"pending","method":"伏吟/反吟须按特殊九宗门取传",
                "reason":"月将与占时同宫或相冲，尚未实现完整伏吟反吟专法",
                "initial_candidates":[],"transmissions":None,
                "certainty":"unsupported_not_guessed"}
    used=[x for x in lessons if x["relation"]=="下贼上"]
    origin="下贼上（重审）"
    if not used:
        used=[x for x in lessons if x["relation"]=="上克下"]
        origin="上克下（元首）"
    if not used:
        return {"status":"pending","method":"需遥克/昴星/别责/八专等后续九宗门",
                "reason":"四课无直接贼克，不可套用贼克初传",
                "initial_candidates":[],"transmissions":None,
                "certainty":"unsupported_not_guessed"}
    # Same upper god appearing more than once denotes same candidate, not
    # multiple independent possible transmissions.
    candidates=list(dict.fromkeys(x["upper"] for x in used))
    chosen=None;method=origin
    if len(candidates)==1:
        chosen=candidates[0]
    else:
        yang_day=STEMS.index(day[0])%2==0
        comparable=[b for b in candidates if (BRANCHES.index(b)%2==0)==yang_day]
        if len(comparable)==1:
            chosen=comparable[0]
            method="比用（阳日取阳神、阴日取阴神）"
        else:
            return {"status":"pending","method":"需涉害判深浅",
                    "reason":"多贼克候选在比用后仍非唯一；涉害未实现，不按列表顺序随意发用",
                    "source_priority":origin,
                    "initial_candidates":candidates,
                    "comparable_candidates":comparable,
                    "transmissions":None,"certainty":"unsupported_not_guessed"}
    mid=plate[chosen];last=plate[mid]
    return {"status":"computed","method":method,"source_priority":origin,
            "initial_candidates":candidates,
            "selected_initial":chosen,
            "transmissions":[
                {"order":1,"name":"初传","branch":chosen},
                {"order":2,"name":"中传","branch":mid},
                {"order":3,"name":"末传","branch":last}],
            "source":TRANSMISSION_SOURCE,
            "certainty":"unique_after_supported_rules",
            "fortune_verdict":None}


def build_liuren(day:str,month_general:str,占时:str,reference:dict|None=None,
                 noble_mode:str="hour_branch")->dict:
    """Pure rule kernel also allows manually transcribed ancient exemplar cases."""
    if day not in SIXTY_DAYS or month_general not in BRANCHES or 占时 not in BRANCHES:
        raise ValueError("日、月将与时必须合法")
    plate=sky_plate(month_general,占时)
    lessons=four_lessons(day,plate)
    third=three_transmissions(day,plate,lessons,month_general,占时)
    result={
        "version":"V58","school":"大六壬",
        "day_ganzhi":day,"day_stem_lodge":LODGES[day[0]],
        "hour_branch":占时,"month_general":month_general,
        "month_general_name":next(name for branch,name in GENERALS.values()
                                  if branch==month_general),
        "earth_plate":list(BRANCHES),
        "heaven_plate":plate,
        "palaces":[{"earth":b,"heaven":plate[b]} for b in BRANCHES],
        "four_lessons":lessons,"three_transmissions":third,
        "has_real_plates_and_four_lessons":True,
        "has_full_nine_methods":False,
        "has_three_transmissions":third["status"]=="computed",
        "fortune_verdict":None,
        "source":{"earth_heaven_four_lessons":SOURCE,
                  "three_transmissions":TRANSMISSION_SOURCE},
        "limits":[
            "月将按中气变更、天盘月将加正时；不可与八字按节划分的月柱混淆。",
            "三传只在单一贼克或唯一比用可明确选择发用时计算；涉害、遥克、昴星、别责、八专、伏吟、反吟尚未全实现。",
            "未完成十二天将、贵人昼夜起法及全部课体；不得宣称大六壬整套断课已完成。",
            "四课和三传是传统结构，不是现实吉凶应期结论。",
        ],
    }
    if reference:result["calendar_provenance"]=reference
    from .liuren_v59 import decorate_liuren_v59
    from .liuren_v60 import decorate_liuren_v60
    from .liuren_v61 import decorate_liuren_v61
    from .liuren_v62 import decorate_liuren_v62
    return decorate_liuren_v62(
        decorate_liuren_v61(decorate_liuren_v60(decorate_liuren_v59(result))),
        noble_mode=noble_mode)


def cast_liuren(d:date,clock:time,day_boundary:str="zi_hour",
                noble_mode:str="hour_branch")->dict:
    if not isinstance(d,date) or isinstance(d,datetime) or not isinstance(clock,time) or clock.tzinfo is not None:
        raise ValueError("大六壬需正确北京时间公历日期与钟面时间")
    preview=preview_solar_calendar(d,clock,day_boundary=day_boundary)
    lunar=Solar.fromYmdHms(d.year,d.month,d.day,clock.hour,clock.minute,clock.second).getLunar()
    previous=lunar.getPrevQi(False)
    next_=lunar.getNextQi(False)
    name=previous.getName()
    if name not in GENERALS:
        raise ValueError("中气并非十二月将起始中气")
    when=datetime.strptime(previous.getSolar().toYmdHms(),"%Y-%m-%d %H:%M:%S").replace(tzinfo=CHINA)
    to=datetime.strptime(next_.getSolar().toYmdHms(),"%Y-%m-%d %H:%M:%S").replace(tzinfo=CHINA)
    at=datetime.combine(d,clock).replace(tzinfo=CHINA)
    if not when<=at<to:
        raise ValueError("当前时间未落在计算的月将中气窗口内")
    branch,general_name=GENERALS[name]
    result=build_liuren(preview["day_ganzhi"],branch,hour_branch(clock),{
        "solar_date":d.isoformat(),"beijing_time":at.isoformat(timespec="seconds"),
        "timezone":"Asia/Shanghai","day_boundary":day_boundary,
        "day_boundary_label":preview["input"]["day_boundary_label"],
        "previous_middle_term":{"name":name,"beijing_time":when.isoformat(timespec="seconds")},
        "next_middle_term":{"name":next_.getName(),"beijing_time":to.isoformat(timespec="seconds")},
        "month_general_changed_at_middle_term":True,
        "not_based_on_lunar_first_or_jie":True,
        "warnings":preview["warnings"]+
            (["距离中气交界15分钟内，请核对月将实际交接时刻。"] if min(
                (at-when).total_seconds(),(to-at).total_seconds())<=900 else []),
    },noble_mode=noble_mode)
    if result["month_general_name"]!=general_name or result["heaven_plate"][result["hour_branch"]]!=branch:
        raise ValueError("月将、占时天地盘发生来源不一致")
    return result
