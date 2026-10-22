"""中国农历/公历互转与六爻节令月建预览（统一北京时间 UTC+8）。

农历月为阴阳合历的月份，六爻月建依节气（节）划分，绝不互换。
所有预览必须由用户点击「采纳」后才能修改实际排盘。
临近交节、23点换日等可能存在流派或历算精度差异，提醒人工核对。
"""
from __future__ import annotations

from datetime import date, datetime, time
from zoneinfo import ZoneInfo

from lunar_python import Lunar, LunarYear, Solar

from .calendar import MONTH_SOLAR_TERMS, SIXTY_DAYS, MONTH_STARTS

CHINA=ZoneInfo("Asia/Shanghai")
DAY_BOUNDARIES={
    "midnight":"零点换日（23:00–23:59仍按当天）",
    "zi_hour":"子初换日（23:00起算次日）",
}
WARNING_WINDOW_MINUTES=15


def _make_solar(moment:datetime):
    return Solar.fromYmdHms(moment.year,moment.month,moment.day,
                            moment.hour,moment.minute,moment.second)


def _jie_info(jie)->dict:
    moment=datetime.strptime(jie.getSolar().toYmdHms(),"%Y-%m-%d %H:%M:%S").replace(tzinfo=CHINA)
    return {"name":jie.getName(),"beijing_time":moment.isoformat(timespec="seconds")}


def _lunar_info(lunar)->dict:
    month=lunar.getMonth()
    return {
        "year":lunar.getYear(),
        "month":abs(month),
        "day":lunar.getDay(),
        "is_leap_month":month<0,
        "display":("%d年%s%d月%d日" % (
            lunar.getYear(),"闰" if month<0 else "",abs(month),lunar.getDay()
        )),
    }


def _preview(gregorian_date:date,clock:time,day_boundary:str,input_info:dict)->dict:
    if day_boundary not in DAY_BOUNDARIES:
        raise ValueError("请选择零点换日或子初23点换日。")
    if not 1901<=gregorian_date.year<=2099:
        raise ValueError("当前换算支持公历1901年至2099年。")
    if clock.tzinfo is not None:
        raise ValueError("请填写北京时间钟面时刻，而不是带有时区偏移的时间。")
    beijing=datetime.combine(gregorian_date,clock).replace(tzinfo=CHINA)
    lunar=_make_solar(beijing).getLunar()
    day_ganzhi=lunar.getDayInGanZhiExact() if day_boundary=="zi_hour" else lunar.getDayInGanZhiExact2()
    month_branch=lunar.getMonthZhiExact()
    month_ganzhi=lunar.getMonthInGanZhiExact()
    prev=_jie_info(lunar.getPrevJie(False))
    next_=_jie_info(lunar.getNextJie(False))
    gap=min(abs((beijing-datetime.fromisoformat(prev["beijing_time"])).total_seconds()),
            abs((datetime.fromisoformat(next_["beijing_time"])-beijing).total_seconds()))/60
    near_term=gap<=WARNING_WINDOW_MINUTES
    near_zi=beijing.hour==23
    if day_ganzhi not in SIXTY_DAYS or month_branch not in MONTH_STARTS:
        raise ValueError("历法结果未通过日干支或节令月建校验。")
    warnings=[]
    if near_term:
        warnings.append("距离交节时刻15分钟以内，请再核对可靠的中国万年历。")
    if near_zi:
        warnings.append("当前为北京时间23点的晚子时：零点与子初换日规则可能给出不同日柱。")
    return {
        "input":{**input_info,"clock":clock.strftime("%H:%M"),
                 "timezone":"Asia/Shanghai","timezone_label":"中国北京时间 UTC+08:00",
                 "day_boundary":day_boundary,"day_boundary_label":DAY_BOUNDARIES[day_boundary]},
        "calendar_type":input_info["calendar_type"],
        "solar_date":gregorian_date.isoformat(),
        "lunar":_lunar_info(lunar),
        "beijing_time":beijing.isoformat(timespec="seconds"),
        "day_ganzhi":day_ganzhi,
        "month_branch":month_branch,
        "month_ganzhi":month_ganzhi,
        "month_window":MONTH_SOLAR_TERMS[month_branch],
        "previous_jie":prev,
        "next_jie":next_,
        "minutes_to_closest_jie":round(gap,1),
        "near_solar_term":near_term,
        "near_day_boundary":near_zi,
        "warnings":warnings,
        "library":"lunar_python==1.4.8",
        "verification":"calendar_library_preview",
        "notice":"农历月是阴阳合历月份；六爻月建按节气交节而非农历初一。统一北京时间，非官方历书证明；交节及子时请核验，不算地方真太阳时。此处只预览、不自动更改卦盘。",
    }


def preview_solar_calendar(gregorian_date:date,clock:time,
                           timezone:str="Asia/Shanghai",
                           day_boundary:str="midnight")->dict:
    # timezone stays an internal compatibility argument, but all public input is China-only.
    if timezone!="Asia/Shanghai":
        raise ValueError("本功能统一使用中国北京时间。")
    return _preview(gregorian_date,clock,day_boundary,{
        "calendar_type":"solar","date":gregorian_date.isoformat()
    })


def preview_lunar_calendar(lunar_year:int,lunar_month:int,lunar_day:int,
                           is_leap_month:bool,clock:time,
                           day_boundary:str="midnight")->dict:
    if not 1901<=lunar_year<=2099:
        raise ValueError("当前农历换算支持1901年至2099年。")
    if not 1<=lunar_month<=12 or not isinstance(is_leap_month,bool):
        raise ValueError("农历月份必须为1至12月，并明确是否闰月。")
    if not 1<=lunar_day<=30:
        raise ValueError("农历日期须在初一至三十之间。")
    month=-lunar_month if is_leap_month else lunar_month
    try:
        month_obj=LunarYear.fromYear(lunar_year).getMonth(month)
        if month_obj is None:
            raise ValueError("这一年没有所选的农历月份或闰月。")
        if lunar_day>month_obj.getDayCount():
            raise ValueError("该农历月只有%d天，不能填写%d日。" % (month_obj.getDayCount(),lunar_day))
        lunar=Lunar.fromYmdHms(lunar_year,month,lunar_day,clock.hour,clock.minute,clock.second)
        solar=lunar.getSolar()
        gregorian_date=date(solar.getYear(),solar.getMonth(),solar.getDay())
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError("农历日期无效，请检查年份、闰月和日期。") from exc
    return _preview(gregorian_date,clock,day_boundary,{
        "calendar_type":"lunar",
        "lunar_year":lunar_year,"lunar_month":lunar_month,
        "lunar_day":lunar_day,"is_leap_month":is_leap_month
    })
