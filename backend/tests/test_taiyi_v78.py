"""V78 genuine classical accumulated-hour cycles, ancient 887/47 and yin63 witnesses."""
from datetime import date,datetime,time,timedelta
from zoneinfo import ZoneInfo
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.calendar import BRANCHES,SIXTY_DAYS
from app.core.taiyi_hour_v77 import (
    hour_basic_board,_jieqi,hour_cycle_from_count,BEIJING
)
from app.core.taiyi_hour_v78 import (
    _wenchang_order,hour_wenchang_from_count,classical_hour_ju,
    latest_jiazi_before_solstice
)

def test_independent_ancient_887_hour_jiazi_epoch_full_results():
    # 《太乙金钥匙》十二月丁丑日庚戌时；74天:(74-1)*12+11 = 887.
    c=classical_hour_ju((74-1)*12+11,"阳遁")
    assert c["accumulated_hours"]==887
    assert c["completed_360_circuits"]==2
    assert c["in_cycle_360"]==167
    assert c["six_ji_number"]==3
    assert c["five_yuan_number"]==3
    assert c["five_yuan_name"]=="戊子元"
    assert c["ju"]==23 and c["ju_label"]=="阳遁23局"
    assert c["hour_ganzhi_from_jiazi_start"]=="庚戌"
    assert c["taiyi_palace"]["number"]==9 and c["hour_in_palace"]==2
    assert c["time_wenchang"]["god"]=="阴德"
    assert c["time_wenchang"]["direction"]=="乾"
    assert c["time_wenchang"]["count_in_18"]==5
    assert c["has_main_guest"] is False
    assert c["fortune_verdict"] is None

def test_independent_47_hour_shortcut_same_palace_and_wenchang_as_887():
    a=classical_hour_ju(47,"阳遁")
    b=classical_hour_ju(887,"阳遁")
    assert a["ju"]==47 and b["ju"]==23  # different era/origin
    assert a["taiyi_palace"]["number"]==b["taiyi_palace"]["number"]==9
    assert a["hour_in_palace"]==b["hour_in_palace"]==2
    assert a["time_wenchang"]["god"]==b["time_wenchang"]["god"]=="阴德"
    # 47和887的甲子元局名不同，不能因24周循环一样就认为同一历元。
    assert a["five_yuan_name"]!=b["five_yuan_name"]

def test_independent_yin_63_gold_from_taiyi_jinyaoshi():
    c=classical_hour_ju(63,"阴遁")
    assert c["five_yuan_name"]=="甲子元"
    assert c["ju"]==63 and c["ju_label"]=="阴遁63局"
    assert c["taiyi_palace"]["number"]==4 and c["hour_in_palace"]==3
    assert c["time_wenchang"]["direction"]=="坤"
    assert c["time_wenchang"]["god"]=="大武"
    assert c["time_wenchang"]["count_in_18"]==9
    assert c["time_jishen"]=="午"

@pytest.mark.parametrize("dun,first,doubles",[
    ("阳遁","申",("乾","坤")),("阴遁","寅",("巽","艮"))
])
def test_full_18_wenchang_sequence_has_exactly_two_double_stays(dun,first,doubles):
    values=[hour_wenchang_from_count(i,dun) for i in range(1,19)]
    assert len(set(z["index"] for z in values))==16
    assert values[0]["direction"]==first
    assert [values[i]["direction"] for i in range(1,18)
            if values[i]["index"]==values[i-1]["index"]]==list(doubles) if dun=="阳遁" else ["巽","艮"]
    assert len(_wenchang_order(dun))==18
    assert sum(z["trace"][-1]["double_stay"] for z in values)==2
    assert hour_wenchang_from_count(19,dun)["index"]==values[0]["index"]
    assert hour_wenchang_from_count(361,dun)["index"]==values[0]["index"]


def test_all_360_hours_use_independent_360_72_60_24_18_12_divisors():
    for dun in ("阳遁","阴遁"):
        for count in range(1,721):
            q=classical_hour_ju(count,dun)
            assert q["ju"]==(count-1)%72+1
            assert q["five_yuan_number"]==((count-1)%360)//72+1
            assert q["six_ji_number"]==((count-1)%360)//60+1
            assert q["hour_ganzhi_from_jiazi_start"]==SIXTY_DAYS[(count-1)%60]
            assert q["time_wenchang"]["index"]==hour_wenchang_from_count(count,dun)["index"]
            assert q["taiyi_palace"]["number"]==hour_cycle_from_count(count,dun)["taiyi_palace"]["number"]
            assert q["time_jishen"]==hour_cycle_from_count(count,dun)["jishen"]
        assert classical_hour_ju(360,dun)["five_yuan_name"]=="壬子元"
        assert classical_hour_ju(360,dun)["ju"]==72
        assert classical_hour_ju(361,dun)["five_yuan_name"]=="甲子元"
        assert classical_hour_ju(361,dun)["ju"]==1

def test_jiazi_anchor_is_previous_real_civil_ganzhi_day_to_solstice():
    for year,name,month in ((1901,"冬至",12),(2026,"冬至",12),
                            (2026,"夏至",6),(2099,"夏至",6)):
        sol=_jieqi(year,name,month)
        anchor=latest_jiazi_before_solstice(sol)
        assert anchor["solstice_ganzhi_day"] in SIXTY_DAYS
        assert 0<=anchor["days_between_jiazi_and_solstice"]<60
        from lunar_python import Solar
        d=date.fromisoformat(anchor["prior_jiazi_date"])
        assert Solar.fromYmdHms(d.year,d.month,d.day,12,0,0).getLunar().getDayInGanZhi()=="甲子"
        assert (sol.date()-d).days==anchor["days_between_jiazi_and_solstice"]


def test_actual_2026_solstice_boundary_and_two_different_epoch_bases():
    summer=_jieqi(2026,"夏至",6)
    before=summer-timedelta(seconds=1)
    after=summer+timedelta(seconds=1)
    c0=hour_basic_board(before.date(),before.time())
    c1=hour_basic_board(after.date(),after.time())
    assert c0["time_cycle"]["dun"]=="阳遁"
    assert c1["time_cycle"]["dun"]=="阴遁"
    assert c1["time_cycle"]["relative_time_count"]==1
    for c in (c0,c1):
        v=c["classical_jiazi_hour_v78"]
        assert c["version"]=="V77" and c["historical_ju_version"]=="V78"
        assert v["has_cycle_360_72"] is True
        assert v["has_hour_wenchang"] is True
        assert c["has_jiazi_anchor_360_72"] and c["has_classical_hour_wenchang_v78"]
        assert c["has_full_hour_chart"] is False
        assert c["canonical_historical_hour_count"] is None
        assert c["canonical_five_yuan_72_ju"] is None
        assert v["is_absolute_upper_jiazi_epoch"] is False
        assert v["compared_to_v77"]["claim_same_epoch"] is False
        assert v["time_wenchang"]["trace"][-1]["god"]==v["time_wenchang"]["god"]
        assert c["fortune_verdict"] is None
    assert c1["classical_jiazi_hour_v78"]["school"].startswith("《太乙金钥匙》")
    assert len(c1["nine_palaces"])==9

def test_past_2026_civil_zi_hour_contiguous_across_midnight():
    a=hour_basic_board(date(2026,12,23),time(23,30))
    b=hour_basic_board(date(2026,12,24),time(0,30))
    av=a["classical_jiazi_hour_v78"]
    bv=b["classical_jiazi_hour_v78"]
    assert av["accumulated_hours"]==bv["accumulated_hours"]
    assert av["ju"]==bv["ju"]
    assert av["time_wenchang"]["index"]==bv["time_wenchang"]["index"]
    assert a["time_cycle"]["relative_time_count"]==b["time_cycle"]["relative_time_count"]
    assert a["input"]["hour_branch"]==b["input"]["hour_branch"]=="子"

def test_api_hour_v78_adds_classic_without_disrupting_v77_or_annual():
    client=TestClient(app)
    x=client.post("/api/taiyi/hour/cast",json={
        "solar_date":"2026-12-23","clock":"10:30"})
    assert x.status_code==200,x.text
    c=x.json()
    assert c["version"]=="V77"
    assert c["historical_ju_version"]=="V78"
    assert c["classical_jiazi_hour_v78"]["ju"] in range(1,73)
    assert c["classical_jiazi_hour_v78"]["five_yuan_number"] in range(1,6)
    assert c["classical_jiazi_hour_v78"]["six_ji_number"] in range(1,7)
    assert c["classical_jiazi_hour_v78"]["time_wenchang"]["status"]=="computed"
    assert c["has_full_hour_chart"] is False
    y=client.post("/api/taiyi/cast",json={"gregorian_year":2026})
    assert y.status_code==200
    assert y.json()["version"]=="V67"
    assert "classical_jiazi_hour_v78" not in y.json()

@pytest.mark.parametrize("bad",[-1,0,1.5,True,False,"23",None])
def test_classic_hour_count_rejects_non_positive_non_integer(bad):
    for mode in ("阳遁","阴遁"):
        with pytest.raises(ValueError):
            classical_hour_ju(bad,mode)
        with pytest.raises(ValueError):
            hour_wenchang_from_count(bad,mode)

def test_classic_ju_rejects_spurious_dun():
    for name in ("",None,"阳","太乙","阴阳遁"):
        with pytest.raises(ValueError):
            classical_hour_ju(887,name)
        with pytest.raises(ValueError):
            hour_wenchang_from_count(887,name)
