"""V56 子平法大运（可选）: 年干阴阳顺逆、月柱推运、分钟折起运。

默认不请求传统男命/女命，更不从个人信息推断性别。
可选传统男/女算法口径，或直接手工指定顺/逆。
采用 lunar-python Yun sect=2（分钟换算）并独立复算实际前后节差，
不得以24节气的“中气”冒充定月的十二“节”。
不作现实吉凶、应期、性格、身份推测。
"""
from __future__ import annotations

from datetime import date,datetime,time
from zoneinfo import ZoneInfo
from lunar_python import Solar

from .calendar import STEMS,SIXTY_DAYS
from .bazi import _format_pillar

CHINA=ZoneInfo("Asia/Shanghai")
SUPPORTED=("none","traditional_male","traditional_female","forward","reverse")
REF_YUN="https://github.com/6tail/lunar-python/blob/master/lunar_python/eightchar/Yun.py"
REF_DAYUN="https://github.com/6tail/lunar-python/blob/master/lunar_python/eightchar/DaYun.py"
REF_CLASSIC="https://tianjihq.com/zh-CN/learn/books/sanche-yilan/9"


def _moment(solar)->datetime:
    return datetime.strptime(solar.toYmdHms(),"%Y-%m-%d %H:%M:%S").replace(tzinfo=CHINA)


def _iso(solar)->str:
    return _moment(solar).isoformat(timespec="seconds")


def _direction(mode:str,year_stem:str)->bool:
    if mode not in SUPPORTED or mode=="none":
        raise ValueError("V56 请明确选择排运口径，或仅看四柱")
    if year_stem not in STEMS:raise ValueError("V56 年干无效")
    if mode in ("forward","reverse"):
        return mode=="forward"
    yang=STEMS.index(year_stem)%2==0
    # 阳年男或阴年女为顺；其他为逆。不将此标签当作当代性别身份判断。
    return yang==(mode=="traditional_male")


def compute_bazi_luck(chart:dict,solar_date:date,clock:time,mode:str)->dict:
    if chart.get("version")!="V55" or not chart.get("has_real_four_pillars"):
        raise ValueError("V56 大运只接受已核验的 V55 四柱")
    if mode not in SUPPORTED or mode=="none":
        raise ValueError("V56 大运模式须为传统男女命或明确顺逆")
    if solar_date.isoformat()!=chart["solar_date"]:
        raise ValueError("V56 出生日期与四柱来源不符")
    if clock.tzinfo is not None:
        raise ValueError("V56 只能用北京时间钟面时刻")
    forward=_direction(mode,chart["year_ganzhi"][0])
    solar=Solar.fromYmdHms(solar_date.year,solar_date.month,solar_date.day,
                           clock.hour,clock.minute,clock.second)
    lunar=solar.getLunar()
    month=lunar.getMonthInGanZhiExact()
    if (month!=chart["month_ganzhi"] or
        lunar.getYearInGanZhiExact()!=chart["year_ganzhi"]):
        raise ValueError("V56 不能在不同的年/月节令下起大运")
    # Only the 12 month-setting Jie, not 12 mid-term Qi:
    jie=lunar.getNextJie(False) if forward else lunar.getPrevJie(False)
    jie_at=_moment(jie.getSolar())
    birth_at=_moment(solar)
    gap=jie_at-birth_at if forward else birth_at-jie_at
    seconds=gap.total_seconds()
    if seconds < 0:
        raise ValueError("V56 前后节时刻次序错误")
    # library Yun sect=2 uses whole minutes: 4320min=1 luck year,
    # 360min=1 luck month, 12min=1 luck day, 1min=2 luck hours.
    # Yun sect=2 intentionally ignores seconds when subtracting Solar minutes.
    # Python timedelta flooring would lose 1 minute on reverse-count cases
    # whenever the previous solar term occurs at xx:xx:01..59.
    floor_minute=lambda d: d.replace(second=0,microsecond=0)
    interval_start=birth_at if forward else jie_at
    interval_end=jie_at if forward else birth_at
    gap_minutes=int((floor_minute(interval_end)-floor_minute(interval_start)).total_seconds()//60)
    remaining=gap_minutes
    years,remaining=divmod(remaining,4320)
    months,remaining=divmod(remaining,360)
    days,remaining=divmod(remaining,12)
    hours=remaining*2
    start=solar.nextYear(years).nextMonth(months).next(days).nextHour(hours)
    # Do not turn date-index calendar years into an invented exact age.
    offset=SIXTY_DAYS.index(month)
    sign=1 if forward else -1
    periods=[]
    for index in range(1,9):
        gz=SIXTY_DAYS[(offset+sign*index)%60]
        origin=start.nextYear((index-1)*10)
        next_=start.nextYear(index*10)
        summary=_format_pillar("luck",f"第{index}步大运",gz,chart["day_master"])
        periods.append({
            **summary,"order":index,"begins_at_beijing":_iso(origin),
            "ends_before_beijing":_iso(next_),
            "start_calendar_year":origin.getYear(),
            "end_calendar_year_exclusive":next_.getYear(),
            "note":"交运精确边界按本分钟折算法日历累加；年数仅供年份索引",
        })
    if len({p["ganzhi"] for p in periods})!=8:
        raise ValueError("V56 八步大运出现重复干支")
    # Traditional options can be compared to the upstream canonical Yun
    # implementation. Manual direction never fabricates a gender input:
    # using only a publicly documented code convention for the check.
    upstream_verified=False
    if mode in ("traditional_male","traditional_female"):
        gender=1 if mode=="traditional_male" else 0
        yun=lunar.getEightChar().getYun(gender,2)
        if yun.isForward()!=forward:
            raise ValueError("V56 年干阴阳顺逆与源库不符")
        actual=(yun.getStartYear(),yun.getStartMonth(),
                yun.getStartDay(),yun.getStartHour())
        expected=(years,months,days,hours)
        if actual!=expected or _iso(yun.getStartSolar())!=_iso(start):
            raise ValueError("V56 分钟折起运与源库不符")
        fixed=yun.getDaYun(9)
        if [r.getGanZhi() for r in fixed[1:]]!=[p["ganzhi"] for p in periods]:
            raise ValueError("V56 八步干支与源库大运顺序不符")
        upstream_verified=True
    direction="顺排" if forward else "逆排"
    result={
        "version":"V56",
        "mode":mode,
        "mode_label":{
            "traditional_male":"传统男命排运规则",
            "traditional_female":"传统女命排运规则",
            "forward":"直接指定顺排（不输入性别）",
            "reverse":"直接指定逆排（不输入性别）",
        }[mode],
        "direction":direction,"forward":forward,
        "year_stem":chart["year_ganzhi"][0],
        "year_stem_yang":STEMS.index(chart["year_ganzhi"][0])%2==0,
        "month_ganzhi":month,
        "birth_at_beijing":birth_at.isoformat(timespec="seconds"),
        "reference_jie":{"name":jie.getName(),
                         "beijing_time":jie_at.isoformat(timespec="seconds"),
                         "position":"下一个节" if forward else "上一个节"},
        "interval_minutes":gap_minutes,
        "interval_exact_seconds":int(seconds),
        "start_offset":{"years":years,"months":months,"days":days,"hours":hours},
        "start_at_beijing":_iso(start),
        "calculation":"三日折一年；分精度4320分钟=一年、360分钟=一月、12分钟=一天、1分钟折2小时",
        "luck_decades":periods,
        "years_are_calendar_labels_not_ages":True,
        "upstream_yun_sect2_verified":upstream_verified,
        "source":{"classic":REF_CLASSIC,"engine":REF_YUN,"decade":REF_DAYUN},
        "real_world_fortune_verdict":None,
        "limits":[
            "排运传统男女命是算法参数，不推断使用者当代性别或身份。",
            "这是起运年龄折算口径，不是按地球实际公转定义的年龄；不同门派可有小时柱和节令处理差异。",
            "仅按北京时间，不涉及出生地真太阳时；临近交节请核对权威历书。",
            "大运干支是结构顺序，不构成财运、健康、婚姻或事件发生的预测。",
        ],
    }
    return result
