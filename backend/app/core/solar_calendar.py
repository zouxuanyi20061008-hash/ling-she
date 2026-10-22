"""公历时刻转六爻日辰和节令月建：显式时区、换日规则、交节临界提醒。

lunar_python 1.4.8 的节气表以北京时间（UTC+08:00）标示；
日干支按选择的民用时区日期计算，允许零点或子初(23:00)换日。
不处理地方真太阳时，临近交节不自动认定为已经无争议的历法值。
API 只生成预览；用户必须明确点击「采纳」才能用于正式排盘。
"""
from __future__ import annotations

from datetime import date, datetime, time
from zoneinfo import ZoneInfo

from lunar_python import Solar

from .calendar import MONTH_SOLAR_TERMS, SIXTY_DAYS, MONTH_STARTS

TZ_INFO={
    "Asia/Shanghai":"北京时间 UTC+08:00",
    "Asia/Tokyo":"日本时间 UTC+09:00",
}
DAY_BOUNDARIES={
    "midnight":"零点换日（23:00–23:59 仍按当天）",
    "zi_hour":"子初换日（23:00 起算次日）",
}
CHINA=ZoneInfo("Asia/Shanghai")
WARNING_WINDOW_MINUTES=15


def _make_solar(moment:datetime):
    return Solar.fromYmdHms(moment.year,moment.month,moment.day,
                            moment.hour,moment.minute,moment.second)


def _local_jie(jie,timezone:ZoneInfo)->dict:
    china_moment=datetime.strptime(jie.getSolar().toYmdHms(),"%Y-%m-%d %H:%M:%S").replace(tzinfo=CHINA)
    return {"name":jie.getName(),
            "beijing_time":china_moment.isoformat(timespec="seconds"),
            "local_time":china_moment.astimezone(timezone).isoformat(timespec="seconds")}


def preview_solar_calendar(gregorian_date:date,clock:time,
                           timezone:str="Asia/Shanghai",
                           day_boundary:str="midnight")->dict:
    if timezone not in TZ_INFO:
        raise ValueError("仅支持北京时间或日本时间；请选择明确的时区。")
    if day_boundary not in DAY_BOUNDARIES:
        raise ValueError("换日规则仅支持零点换日和23点子初换日。")
    if not 1901<=gregorian_date.year<=2099:
        raise ValueError("当前历法校验支持1901至2099年。")
    if clock.tzinfo is not None:
        raise ValueError("请用无时区时刻输入，并单独选择时区。")

    user_tz=ZoneInfo(timezone)
    local=datetime.combine(gregorian_date,clock).replace(tzinfo=user_tz)
    beijing=local.astimezone(CHINA)

    # 日辰按使用者所选择时区的当地日历日期/23点规则走。
    local_lunar=_make_solar(local).getLunar()
    day_ganzhi=(local_lunar.getDayInGanZhiExact() if day_boundary=="zi_hour"
                 else local_lunar.getDayInGanZhiExact2())

    # 月令节气以绝对交节瞬间为准，lunar_python 的计算钟面采用北京时间。
    beijing_lunar=_make_solar(beijing).getLunar()
    month_branch=beijing_lunar.getMonthZhiExact()
    month_ganzhi=beijing_lunar.getMonthInGanZhiExact()
    prev_term=_local_jie(beijing_lunar.getPrevJie(False),user_tz)
    next_term=_local_jie(beijing_lunar.getNextJie(False),user_tz)

    instant=local
    prev_instant=datetime.fromisoformat(prev_term["local_time"])
    next_instant=datetime.fromisoformat(next_term["local_time"])
    gap_prev=abs((instant-prev_instant).total_seconds())/60
    gap_next=abs((next_instant-instant).total_seconds())/60
    closest=min(gap_prev,gap_next)
    near_term=closest<=WARNING_WINDOW_MINUTES
    near_day_boundary=(
        (local.hour==23 and day_boundary=="zi_hour") or
        (local.hour==23 and day_boundary=="midnight")
    )
    if day_ganzhi not in SIXTY_DAYS or month_branch not in MONTH_STARTS:
        raise ValueError("历法库返回了未通过六十甲子/十二月建校验的结果。")
    warnings=[]
    if near_term:
        warnings.append("距离交节时刻15分钟以内：请对照权威历书再核验，勿机械采纳。")
    if near_day_boundary:
        warnings.append("已进入23点晚子时：不同换日规则可能得到不同日柱，请核对所学流派。")
    return {
        "input":{"date":gregorian_date.isoformat(),"clock":clock.strftime("%H:%M"),
                 "timezone":timezone,"timezone_label":TZ_INFO[timezone],
                 "day_boundary":day_boundary,"day_boundary_label":DAY_BOUNDARIES[day_boundary]},
        "local_time":local.isoformat(timespec="seconds"),
        "beijing_time":beijing.isoformat(timespec="seconds"),
        "day_ganzhi":day_ganzhi,
        "month_branch":month_branch,
        "month_ganzhi":month_ganzhi,
        "month_window":MONTH_SOLAR_TERMS[month_branch],
        "previous_jie":prev_term,
        "next_jie":next_term,
        "minutes_to_closest_jie":round(closest,1),
        "near_solar_term":near_term,
        "near_day_boundary":near_day_boundary,
        "warnings":warnings,
        "library":"lunar_python==1.4.8",
        "verification":"calendar_library_preview",
        "notice":"历法库预览，非中国官方历书证明；交节附近或子时请人工复核。未计算地方真太阳时，也不会自动改写现有排盘参数。",
    }
