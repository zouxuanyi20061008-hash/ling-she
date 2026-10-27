"""V57 八字流年流月：精确十二节令窗口 + 与 V56 大运区间的时间比对。

每个流月从立春或下一节实际北京交节的秒时刻开始，
止于下一个“节”（不含终点）；不按农历正月或公历月初。
流年同样以立春为边界。所有干支取独立时点历法，再以
连续六十甲子和寅卯…丑十二节令校验，防止错一月。
"""
from __future__ import annotations
from datetime import date,datetime,time,timedelta
from zoneinfo import ZoneInfo
from lunar_python import Solar

from .calendar import MONTH_STARTS,SIXTY_DAYS
from .bazi import _format_pillar
from .solar_calendar import preview_solar_calendar

CHINA=ZoneInfo("Asia/Shanghai")
JIE_NAMES=("立春","惊蛰","清明","立夏","芒种","小暑","立秋","白露","寒露","立冬","大雪","小寒","立春")
REF="https://github.com/6tail/lunar-python/blob/master/lunar_python/Lunar.py"


def _to_solar(moment:datetime):
    return Solar.fromYmdHms(moment.year,moment.month,moment.day,
                            moment.hour,moment.minute,moment.second)


def _from_solar(solar)->datetime:
    return datetime.strptime(solar.toYmdHms(),"%Y-%m-%d %H:%M:%S").replace(tzinfo=CHINA)


def _jie_schedule(solar_year:int)->list[dict]:
    """Return exact Beijing start times of 12 month-setting Jie + next LiChun."""
    # Request before LiChun to avoid relying on Gregorian Jan/new lunar year.
    start=Solar.fromYmdHms(solar_year,2,1,0,0,0)
    jie=start.getLunar().getNextJie(False)
    schedule=[]
    for position,expect in enumerate(JIE_NAMES):
        if jie.getName()!=expect:
            raise ValueError(f"V57 交节序列错误：第{position+1}节应是{expect}")
        when=_from_solar(jie.getSolar())
        if schedule and when<=schedule[-1]["moment"]:
            raise ValueError("V57 交节必须严格按时间递增")
        schedule.append({"name":expect,"moment":when})
        if position<12:
            # Moving 1 minute ahead ensures current Jie is excluded from getNextJie.
            following=when+timedelta(minutes=1)
            jie=_to_solar(following).getLunar().getNextJie(False)
    return schedule


def _luck_correspondence(chart:dict,at:datetime)->dict:
    birth=datetime.fromisoformat(chart["beijing_time"])
    if at<birth:
        return {"status":"before_birth","label":"所选时间早于出生时间","phase":None}
    if "luck" not in chart:
        return {"status":"not_requested","label":"未选择大运排法，仅列真实流年流月","phase":None}
    phases=chart["luck"]["luck_decades"]
    for p in phases:
        if datetime.fromisoformat(p["begins_at_beijing"])<=at<datetime.fromisoformat(p["ends_before_beijing"]):
            return {"status":"within_decade","label":f"第{p['order']}步大运 · {p['ganzhi']}",
                    "phase":{"order":p["order"],"ganzhi":p["ganzhi"],
                             "begins_at_beijing":p["begins_at_beijing"],
                             "ends_before_beijing":p["ends_before_beijing"]}}
    if at<datetime.fromisoformat(phases[0]["begins_at_beijing"]):
        return {"status":"pre_start","label":"尚未到达推算起运时间","phase":None}
    return {"status":"beyond_eight_decades","label":"超出当前展示的八步大运","phase":None}


def compute_bazi_flow(chart:dict,target_date:date,target_clock:time)->dict:
    if chart.get("version") not in ("V55","V56") or not chart.get("has_real_four_pillars"):
        raise ValueError("V57 必须以真实出生四柱起流年流月")
    if not isinstance(target_date,date) or isinstance(target_date,datetime) or not 1901<=target_date.year<=2099:
        raise ValueError("V57 流年查看日期仅支持1901至2099年公历")
    if not isinstance(target_clock,time) or target_clock.tzinfo is not None:
        raise ValueError("V57 目标钟面时刻必须是北京时间（无时区后缀）")
    at=datetime.combine(target_date,target_clock).replace(tzinfo=CHINA)
    target= _to_solar(at).getLunar()
    year_gz=target.getYearInGanZhiExact()
    month_gz=target.getMonthInGanZhiExact()
    # Use actual LiChun instant, never blindly choose current Gregorian year.
    candidate=_jie_schedule(target_date.year)
    annual=target_date.year if at>=candidate[0]["moment"] else target_date.year-1
    schedule=candidate if annual==target_date.year else _jie_schedule(annual)
    if not schedule[0]["moment"]<=at<schedule[-1]["moment"]:
        raise ValueError("V57 当前时刻未落在推算的节令年度内")
    annual_gz=_to_solar(schedule[0]["moment"]+timedelta(minutes=1)).getLunar().getYearInGanZhiExact()
    if annual_gz!=year_gz:
        raise ValueError("V57 实际年柱与立春年度起点不一致")
    months=[]
    for i in range(12):
        start=schedule[i]["moment"]
        end=schedule[i+1]["moment"]
        lunar=_to_solar(start+timedelta(minutes=1)).getLunar()
        gz=lunar.getMonthInGanZhiExact()
        if gz[1]!=MONTH_STARTS[i]:
            raise ValueError(f"V57 第{i+1}个交节月支顺序与十二建月不符")
        if lunar.getYearInGanZhiExact()!=year_gz:
            raise ValueError("V57 交节月属于错误干支年")
        if months and SIXTY_DAYS[(SIXTY_DAYS.index(months[-1]["ganzhi"])+1)%60]!=gz:
            raise ValueError("V57 流月不是连续六十甲子")
        selected=start<=at<end
        months.append({
            **_format_pillar("flow_month",f"节令流月{i+1}",gz,chart["day_master"]),
            "order":i+1,"jie_name":schedule[i]["name"],
            "begins_at_beijing":start.isoformat(timespec="seconds"),
            "ends_before_beijing":end.isoformat(timespec="seconds"),
            "selected":selected,
            "calendar_month_is_not_lunar_month":True,
        })
    selected=[m for m in months if m["selected"]]
    if len(selected)!=1 or selected[0]["ganzhi"]!=month_gz:
        raise ValueError("V57 当前月柱与十二节令月窗口不一致")
    annual_pillar=_format_pillar("flow_year","流年",year_gz,chart["day_master"])
    preview=preview_solar_calendar(target_date,target_clock,day_boundary="midnight")
    if preview["month_ganzhi"]!=month_gz:
        raise ValueError("V57 六爻公历节令预览与流月不一致")
    return {
        "version":"V57","state":"accurate_jie_year_month_flow",
        "target_beijing_time":at.isoformat(timespec="seconds"),
        "solar_year_start":annual,
        "year":{**annual_pillar,
                "begins_at_beijing":schedule[0]["moment"].isoformat(timespec="seconds"),
                "ends_before_beijing":schedule[-1]["moment"].isoformat(timespec="seconds")},
        "month":selected[0],
        "months":months,
        "month_count":12,
        "annual_boundary":"立春当刻，终点不包含下一年立春",
        "monthly_boundary":"十二节交接当刻，终点不包含下一个节；不按农历月初或公历月初",
        "nearest_jie_minutes":preview["minutes_to_closest_jie"],
        "near_jie":preview["near_solar_term"],
        "luck_at_target":_luck_correspondence(chart,at),
        "reference":REF,
        "day_master":chart["day_master"],
        "fortune_verdict":None,"real_world_event_predicted":False,
        "limits":[
            "流年与流月是干支历法展示，不表示个人实际运势或事件。",
            "大运状态仅是所选北京时间与 V56 推算交运边界的时间包含关系。",
            "交节前后15分钟应复核权威节气时间；未使用出生地真太阳时。",
            "当前仅显示所选节令年度的12个流月；日级流日、流时与完整命理断课尚未实现。",
        ],
    }
