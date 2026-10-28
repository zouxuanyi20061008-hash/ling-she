"""V77 太乙时计基础：北京定气冬夏至，相对时实、三时一宫、计神。

原典《太乙金镜式经》卷一“推冬夏二至以后太乙所在法”“推阴阳二遁
时计计神法”；《太乙金钥匙》时计捷法与直使。严格区分：
  - 节令起算时实（从最近一次准确冬/夏至起）
  - 古籍完整上元/甲子元“积时”“六纪五元七十二局”仍待校历元
  - 不把岁计积年、三年一宫、投算结果偷换为时计。
当节气落在一个双时辰的中段，选即时交节为改遁时刻，
且本宫计数从该时辰起算。时柱以北京时间两小时为一支，
23:00至次日00:59同一子时，不重复累计。
"""
from __future__ import annotations

from datetime import date,datetime,time
from zoneinfo import ZoneInfo
from lunar_python import Solar

from .calendar import BRANCHES
from .taiyi import YEARLY_RING, PALACES
from .taiyi_v65 import DIRECTIONS,GODS,INDEX,GONG

BEIJING=ZoneInfo("Asia/Shanghai")
YANG_RING=tuple(p[0] for p in YEARLY_RING)
YIN_RING=tuple(reversed(YANG_RING))
TERM_SOURCES={
    "zhou":"https://zh.wikisource.org/zh-hans/太乙金鏡式經_(四庫全書本)/卷01",
    "hour_example":"https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkylq3yn8",
    "jishen":"https://zh.wikisource.org/zh/太乙秘書",
}
TERMS=(("冬至",12),("夏至",6))

def _clock_slot(moment:datetime)->int:
    """当地民用日双时辰顺序：00-01 子0，21-22 亥11，23 子12。"""
    return (moment.hour+1)//2

def _time_branch(moment:datetime)->str:
    return BRANCHES[_clock_slot(moment)%12]

def _jieqi(year:int,name:str,month:int)->datetime:
    lunar=Solar.fromYmdHms(year,month,22,12,0,0).getLunar()
    table=lunar.getJieQiTable()
    matching=[z for key,z in table.items() if key in (
         name, "DONG_ZHI" if name=="冬至" else "XIA_ZHI")
         and z.getYear()==year]
    if len(matching)!=1:
        raise ValueError(f"V77 公历{year}年{name}历算没有唯一北京时间交节。")
    return datetime.strptime(matching[0].toYmdHms(),"%Y-%m-%d %H:%M:%S").replace(
        tzinfo=BEIJING)

def latest_solstice(moment:datetime)->tuple[str,datetime]:
    if moment.tzinfo is None or moment.utcoffset()!=BEIJING.utcoffset(moment):
        raise ValueError("V77 节令时间必须为北京时间的有时区瞬间")
    candidates=[]
    for year in (moment.year-1,moment.year):
        for name,month in TERMS:
            t=_jieqi(year,name,month)
            if t<=moment:candidates.append((t,name))
    if not candidates:raise ValueError("V77 未找到有效冬夏至原始交接点")
    point,name=max(candidates)
    return name,point

def hour_step_after_solstice(moment:datetime,solstice:datetime)->int:
    """1-base 节令相对时实，不等于完整古法上元积时。

    对跨午夜子时，日差*12 + 当日 slot - 交节日 slot +1。
    """
    if moment<solstice:raise ValueError("尚未到所选二至交节点")
    count=(moment.date()-solstice.date()).days*12+(
        _clock_slot(moment)-_clock_slot(solstice))+1
    if count<=0:raise ValueError("冬夏至之后的相对时数不可为零")
    return count

def hour_cycle_from_count(count:int,dun:str)->dict:
    """仅二至以来相对时实的 24 时八宫循环及计神，无完整六纪上元。"""
    if isinstance(count,bool) or not isinstance(count,int) or count<=0:
        raise ValueError("相对时数须为正整数")
    if dun not in ("阳遁","阴遁"):
        raise ValueError("V77 只接受冬至阳遁和夏至阴遁")
    index=(count-1)%24
    ring=YANG_RING if dun=="阳遁" else YIN_RING
    palace=ring[index//3]
    start="寅" if dun=="阳遁" else "申"
    jishen=BRANCHES[(BRANCHES.index(start)-(count-1))%12]
    if palace==5 or not 1<=palace<=9:
        raise ValueError("太乙时计绝不可入中五")
    return {
        "relative_time_count":count,"relative_count_in_24":index+1,
        "completed_24_hour_circuits":(count-1)//24,
        "hours_in_current_palace":index%3+1,
        "taiyi_palace":{**PALACES[palace],"ring_index":index//3+1},
        "ring_order":list(ring),
        "dun":dun,"jishen_start":start,"jishen":jishen,
        "jishen_hourly_reverse":True,
        "hour_count_belongs_to":"冬夏至起算时段内相对时数，不可当作上元甲子积时与七十二局",
    }

def hour_basic_board(solar_date:date,clock:time)->dict:
    if not isinstance(solar_date,date) or isinstance(solar_date,datetime):
        raise ValueError("V77 必须填写公历日期")
    if not 1901<=solar_date.year<=2099:
        raise ValueError("V77 太乙时计仅支持1901至2099年公历")
    if not isinstance(clock,time) or clock.tzinfo is not None:
        raise ValueError("V77 需要不带时区偏移的北京时间钟面时刻")
    now=datetime.combine(solar_date,clock).replace(tzinfo=BEIJING)
    name,term=latest_solstice(now)
    dun="阳遁" if name=="冬至" else "阴遁"
    count=hour_step_after_solstice(now,term)
    core=hour_cycle_from_count(count,dun)
    branch=_time_branch(now)
    near=abs((now-term).total_seconds())<=15*60
    nine=[
      {"number":p,"trigram":PALACES[p]["trigram"],
       "direction":PALACES[p]["direction"],
       "is_taiyi":p==core["taiyi_palace"]["number"],
       "is_middle_unvisited":p==5}
      for p in (9,2,7,4,5,6,3,8,1)
    ]
    return {
       "version":"V77","art":"太乙神数",
       "calculation":"时计·冬夏至后相对时实（基础）",
       "input":{"solar_date":solar_date.isoformat(),
                "clock":clock.strftime("%H:%M:%S"),
                "timezone":"Asia/Shanghai","hour_branch":branch,
                "uses_civil_double_hour":True,
                "zi_hour_spans_23_to_01":True},
       "solstice":{"name":name,"started_at_beijing":term.isoformat(timespec="seconds"),
          "rule":"以真实交节时刻定阳/阴遁，交节所在双时辰从当刻起计第一时",
          "near_15_minutes":near,
          "calendar_source":"lunar_python 1.4.8 节气表（非官方天文历书）"},
       "time_cycle":core,
       "taiyi_palace":core["taiyi_palace"],
       "jishen":{"branch":core["jishen"],"start":core["jishen_start"],
                 "direction":"逆行十二支","movement":"一时一移",
                 "is_annual_jishen":False},
       "nine_palaces":nine,
       "has_hour_taiyi":True,"has_hour_jishen":True,
       "has_complete_shiji_and_hour_main_guest":False,
       "has_full_hour_chart":False,
       "canonical_historical_hour_count":None,
       "canonical_five_yuan_72_ju":None,
       "hour_wenchang":None,
       "warnings":[
          "V77 只算真实二至以来相对时实、八宫三时一移和计神；尚未校准上元甲子积时及五元六纪七十二局，不能写作完整时计。",
          "时计与岁计不是一张盘：此盘不使用1624年岁计积年或年主客投算。",
          "文昌、始击、主客定计及其十六神时计起局仍待独立整盘例课，不能转用岁计文昌公式。",
       ]+([
         "距冬/夏至精确交节不超过15分钟：建议核验权威天文历书，禁止以公历日期零点直接换遁。"
       ] if near else []),
       "sources":TERM_SOURCES,"fortune_verdict":None,
    }
