"""V77 太乙真正二至阴阳遁、三时一宫、计神基础与时计未实现边界。"""
from datetime import date,datetime,time,timedelta
from zoneinfo import ZoneInfo
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.taiyi_hour_v77 import (
  hour_cycle_from_count,hour_basic_board,hour_step_after_solstice,
  latest_solstice,_jieqi,YANG_RING,YIN_RING,BEIJING
)
from app.core.calendar import BRANCHES

def test_ancient_witness_separate_hour_47_has_ninth_palace_second_hour():
    # 《太乙金钥匙》十二月丁丑庚戌时简捷法积47算：
    # 二十四一周余23、巽九宫第二时。此处只校宫位，不伪造
    # 甲子元天目/始击、上元积时与主客算。
    c=hour_cycle_from_count(47,"阳遁")
    assert c["taiyi_palace"]["number"]==9
    assert c["hours_in_current_palace"]==2
    assert c["relative_count_in_24"]==23
    assert c["completed_24_hour_circuits"]==1

@pytest.mark.parametrize("dun,first,second,last,step",[
 ("阳遁",1,2,9,1),("阴遁",9,8,1,-1)
])
def test_classic_eight_palaces_three_hours_and_24_period(dun,first,second,last,step):
    order=YANG_RING if dun=="阳遁" else YIN_RING
    assert len(order)==8 and len(set(order))==8 and 5 not in order
    assert hour_cycle_from_count(1,dun)["taiyi_palace"]["number"]==first
    assert hour_cycle_from_count(3,dun)["taiyi_palace"]["number"]==first
    assert hour_cycle_from_count(4,dun)["taiyi_palace"]["number"]==second
    assert hour_cycle_from_count(22,dun)["taiyi_palace"]["number"]==last
    assert hour_cycle_from_count(24,dun)["taiyi_palace"]["number"]==last
    assert hour_cycle_from_count(25,dun)["taiyi_palace"]["number"]==first
    assert [hour_cycle_from_count(i*3+1,dun)["taiyi_palace"]["number"]
            for i in range(8)]==list(order)
    assert all(hour_cycle_from_count(x,dun)["taiyi_palace"]["number"]!=5
               for x in range(1,361))

@pytest.mark.parametrize("dun,start,second",[
 ("阳遁","寅","丑"),("阴遁","申","未")
])
def test_classic_hourly_jishen_reverse_twelve_branches(dun,start,second):
    assert hour_cycle_from_count(1,dun)["jishen"]==start
    assert hour_cycle_from_count(2,dun)["jishen"]==second
    assert hour_cycle_from_count(13,dun)["jishen"]==start
    assert [hour_cycle_from_count(i,dun)["jishen"] for i in range(1,13)]==[
        BRANCHES[(BRANCHES.index(start)-(i-1))%12] for i in range(1,13)]

def test_solstice_true_instant_boundary_not_gregorian_calendar_day():
    summer=_jieqi(2026,"夏至",6)
    winter=_jieqi(2026,"冬至",12)
    # 交节精确时刻与天文历书比较到分钟，不将网站估算干支作为权威。
    assert (summer.year,summer.month,summer.day,summer.hour)==(2026,6,21,16)
    assert (winter.year,winter.month,winter.day,winter.hour)==(2026,12,22,4)
    earlier=summer-timedelta(seconds=1)
    later=summer+timedelta(seconds=1)
    assert latest_solstice(earlier)[0]=="冬至"
    assert latest_solstice(later)[0]=="夏至"
    a=hour_basic_board(earlier.date(),earlier.time())
    b=hour_basic_board(later.date(),later.time())
    assert a["time_cycle"]["dun"]=="阳遁"
    assert b["time_cycle"]["dun"]=="阴遁"
    assert b["time_cycle"]["relative_time_count"]==1
    assert b["taiyi_palace"]["number"]==9
    assert b["solstice"]["near_15_minutes"] is True

def test_solstice_december_switch_uses_exact_china_clock():
    term=_jieqi(2026,"冬至",12)
    before=term-timedelta(seconds=1)
    at=term
    a=hour_basic_board(before.date(),before.time())
    b=hour_basic_board(at.date(),at.time())
    assert a["time_cycle"]["dun"]=="阴遁"
    assert b["time_cycle"]["dun"]=="阳遁"
    assert b["taiyi_palace"]["number"]==1
    assert b["jishen"]["branch"]=="寅"

def test_civil_zi_hour_23_to_next_midnight_same_slot():
    term=datetime(2026,12,22,16,0,tzinfo=BEIJING)
    t1=datetime(2026,12,23,23,30,tzinfo=BEIJING)
    t2=datetime(2026,12,24,0,30,tzinfo=BEIJING)
    t3=datetime(2026,12,24,1,0,tzinfo=BEIJING)
    assert hour_step_after_solstice(t1,term)==hour_step_after_solstice(t2,term)
    assert hour_step_after_solstice(t3,term)==hour_step_after_solstice(t2,term)+1
    d1=hour_basic_board(t1.date(),t1.time())
    d2=hour_basic_board(t2.date(),t2.time())
    assert d1["input"]["hour_branch"]==d2["input"]["hour_branch"]=="子"
    assert d1["time_cycle"]["relative_time_count"]==d2["time_cycle"]["relative_time_count"]
    assert d1["jishen"]["branch"]==d2["jishen"]["branch"]

def test_annual_taiyi_and_hour_taiyi_not_mixed():
    from app.core.taiyi import cast_taiyi
    annual=cast_taiyi(2026)
    hour=hour_basic_board(date(2026,6,22),time(9))
    assert annual["calculation"]=="岁计"
    assert hour["calculation"].startswith("时计")
    assert "year" not in hour and "dingji_v67" not in hour
    assert "solstice" not in annual and "time_cycle" not in annual
    assert hour["canonical_five_yuan_72_ju"] is None
    assert hour["canonical_historical_hour_count"] is None
    assert hour["hour_wenchang"] is None
    assert hour["has_full_hour_chart"] is False
    # V79 已在可唯一取算的时局实算始击/主客，旧 V77 一律 false
    # 的前置验收不再适用。仍必须阻止冒称全部时计完成。
    assert hour["has_hour_shiji"] is True
    assert hour["hour_main_guest_v79"]["version"]=="V79"
    assert hour["has_complete_shiji_and_hour_main_guest"]==(
        hour["hour_main_guest_v79"]["status"]=="computed")
    assert hour["fortune_verdict"] is None
    assert sum(x["is_taiyi"] for x in hour["nine_palaces"])==1
    assert next(x for x in hour["nine_palaces"] if x["number"]==5)["is_middle_unvisited"]

def test_public_hour_cast_api_and_input_guards():
    cli=TestClient(app)
    data={"solar_date":"2026-06-21","clock":"17:30"}
    res=cli.post("/api/taiyi/hour/cast",json=data)
    assert res.status_code==200,res.text
    chart=res.json()
    assert chart["version"]=="V77"
    assert chart["time_cycle"]["dun"]=="阴遁"
    assert chart["solstice"]["name"]=="夏至"
    assert chart["input"]["timezone"]=="Asia/Shanghai"
    assert chart["input"]["hour_branch"]=="酉"
    assert chart["has_full_hour_chart"] is False
    for extra in ({"timezone":"Asia/Tokyo"},{"hour_ganzhi":"甲子"},
                  {"bogus_v77":True}):
        bad=cli.post("/api/taiyi/hour/cast",json={**data,**extra})
        assert bad.status_code==422,(extra,bad.text)
    for bad in ({"solar_date":"2026-02-30"},
                {"solar_date":"1899-12-22"},{"solar_date":"2100-01-01"},
                {"clock":"25:00"},{"clock":"17:30+09:00"}):
        q=cli.post("/api/taiyi/hour/cast",json={**data,**bad})
        assert q.status_code==422,(bad,q.text)

@pytest.mark.parametrize("count",[-1,0,1.2,True,"4"])
def test_fake_relative_hours_fail_closed(count):
    with pytest.raises(ValueError):
        hour_cycle_from_count(count,"阳遁")
