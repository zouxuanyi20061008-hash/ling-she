"""V83 二至即时起门与甲子前捷法起门双历元，拒绝同一时计混置八门。"""
from datetime import date,time,timedelta
from copy import deepcopy
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.taiyi_hour_v77 import hour_basic_board,_jieqi
from app.core.taiyi_hour_v80 import hour_door_chief
from app.core.taiyi_hour_v83 import contrast_two_hour_chief_clocks,decorate_taiyi_v83

def test_historical_887_and_jiaxu_shortcut_47_120_cycle_identical():
    r=contrast_two_hour_chief_clocks(solstice_count=47,jiazi_count=887,
             dun="阳遁",solstice_name="冬至")
    assert r["offset_between_epoch_hours"]==840
    assert r["offset_modulo_120"]==0
    assert r["same_chief_door"] is True
    assert r["same_chief_and_hour_in_door"] is True
    assert r["solstice_chief"]==r["jiazi_chief"]=="生"
    assert r["solstice_hour_in_door"]==r["jiazi_hour_in_door"]==17
    assert r["example_887_47"]["is_seven_120_hour_cycles"] is True
    assert r["example_887_47"]["not_proof_all_current_dates_agree"] is True
    assert r["can_promote_jiazi_rotations_to_solstice"] is False

@pytest.mark.parametrize("dun,term,sequence",[
   ("阳遁","冬至",("开","生","惊","休")),
   ("阴遁","夏至",("杜","死","伤","景")),
])
def test_120_time_hour_door_boundaries_and_source_independence(dun,term,sequence):
    for offset in (0,1,29,30,59,60,89,90,119,120,239,240,359,360,839):
        a=offset+1
        b=a+((offset//30)%7)*12
        r=contrast_two_hour_chief_clocks(
            solstice_count=a,jiazi_count=b,dun=dun,solstice_name=term)
        assert r["solstice_chief"]==sequence[((a-1)%120)//30]
        assert r["jiazi_chief"]==sequence[((b-1)%120)//30]
        assert r["same_chief_door"]==(r["solstice_chief"]==r["jiazi_chief"])
        assert r["same_chief_and_hour_in_door"]==(
            r["solstice_chief"]==r["jiazi_chief"] and
            r["solstice_hour_in_door"]==r["jiazi_hour_in_door"])
        assert r["offset_modulo_120"]==(b-a)%120
        assert r["jinjing_solstice_relative"]["school_id"]=="wangximing_solstice_qi"
        assert r["jinyao_jiazi_shortcut"]["school_id"]=="jiazi_before_solstice_shortcut"
        assert r["no_unique_gate_epoch_selected"] and not r["all_eight_doors_placed"]
        assert r["fortune_verdict"] is None

@pytest.mark.parametrize("dun,term",[
  ("阳遁","冬至"),("阴遁","夏至")
])
def test_360_hour_offsets_can_change_name_or_hour_within_the_door(dun,term):
    same=0;different=0
    for left in range(1,361):
        for days in (0,1,2,3,5,10,20,59):
            r=contrast_two_hour_chief_clocks(solstice_count=left,
                 jiazi_count=left+days*12,dun=dun,solstice_name=term)
            same+=r["same_chief_door"]
            different+=not r["same_chief_door"]
            if days==0:
                assert r["same_chief_and_hour_in_door"]
            assert r["jinjing_solstice_relative"]["hour_count"]==left
            assert r["jinyao_jiazi_shortcut"]["hour_count"]==left+days*12
    assert same>0 and different>0

def test_2026_summer_and_winter_solstice_true_time_switch_and_offset():
    summer=_jieqi(2026,"夏至",6)
    winter=_jieqi(2026,"冬至",12)
    for boundary in (summer,winter):
        for seconds in (-1,1):
            when=boundary+timedelta(seconds=seconds)
            c=hour_basic_board(when.date(),when.time())
            r=c["hour_v83_chief_epoch_comparison"]
            assert r["version"]=="V83"
            assert r["jinjing_solstice_relative"]["hour_count"]==c["time_cycle"]["relative_time_count"]
            assert r["jinyao_jiazi_shortcut"]["hour_count"]==c["classical_jiazi_hour_v78"]["accumulated_hours"]
            assert r["jiazi_chief"]==c["hour_eight_doors_v80"]["chief_door"]
            assert r["jiazi_chief"]==c["hour_v82_eight_door_schools"]["chief"]
            assert r["solstice_name"]==c["solstice"]["name"]
            assert c["has_verified_hour_door_location"] is False
            assert c["has_all_hour_eight_door_positions"] is False
            assert c["has_full_hour_chart"] is False
            assert c["canonical_historical_hour_count"] is None
            assert c["fortune_verdict"] is None
            if seconds==1:
                assert r["relative_count"]==1
                assert r["solstice_chief"]==("开" if boundary==winter else "杜")

def test_explicit_differs_never_overwrites_v80_v82():
    c=hour_basic_board(date(2026,6,22),time(9,30))
    r=c["hour_v83_chief_epoch_comparison"]
    assert c["hour_door_epoch_version"]=="V83"
    assert r["offset_between_epoch_hours"]==(
      c["classical_jiazi_hour_v78"]["accumulated_hours"]-
      c["time_cycle"]["relative_time_count"])
    assert c["hour_v82_eight_door_schools"]["chief"]==r["jiazi_chief"]
    assert r["no_unique_gate_epoch_selected"] is True
    assert r["alternative_eight_door_palaces_recomputed"] is False
    assert r["can_promote_jiazi_rotations_to_solstice"] is False

def test_real_zi_midnight_stays_one_double_hour_in_each_epoch():
    a=hour_basic_board(date(2026,12,23),time(23,30))
    b=hour_basic_board(date(2026,12,24),time(0,30))
    x=a["hour_v83_chief_epoch_comparison"]
    y=b["hour_v83_chief_epoch_comparison"]
    assert x["relative_count"]==y["relative_count"]
    assert x["previous_jiazi_count"]==y["previous_jiazi_count"]
    assert x["solstice_chief"]==y["solstice_chief"]
    assert x["jiazi_chief"]==y["jiazi_chief"]

@pytest.mark.parametrize("kw",[
    {"solstice_count":0,"jiazi_count":10,"dun":"阳遁","solstice_name":"冬至"},
    {"solstice_count":10,"jiazi_count":9,"dun":"阳遁","solstice_name":"冬至"},
    {"solstice_count":2,"jiazi_count":13,"dun":"阳遁","solstice_name":"夏至"},
    {"solstice_count":2,"jiazi_count":13,"dun":"阴遁","solstice_name":"冬至"},
    {"solstice_count":2,"jiazi_count":13,"dun":"虚遁","solstice_name":"冬至"},
    {"solstice_count":True,"jiazi_count":13,"dun":"阳遁","solstice_name":"冬至"},
])
def test_reject_invalid_or_cross_school_hour_origins(kw):
    with pytest.raises(ValueError):
        contrast_two_hour_chief_clocks(**kw)

def test_tampered_v80_or_v82_not_promoted_into_wangximing_school():
    c=hour_basic_board(date(2026,12,23),time(12,30))
    a=deepcopy(c)
    a["hour_eight_doors_v80"]["chief_door"]="死"
    with pytest.raises(ValueError,match="V83"):
        decorate_taiyi_v83(a)
    b=deepcopy(c)
    b["hour_v82_eight_door_schools"]["chief"]=(
        "生" if c["hour_v82_eight_door_schools"]["chief"]!="生" else "休")
    with pytest.raises(ValueError,match="V83"):
        decorate_taiyi_v83(b)
    e=deepcopy(c)
    e["hour_v82_eight_door_schools"]["candidates"][0]["by_door"][
        e["hour_v82_eight_door_schools"]["candidates"][0]["chief"]]=5
    with pytest.raises(ValueError,match="V83"):
        decorate_taiyi_v83(e)
    d=deepcopy(c)
    d["classical_jiazi_hour_v78"]["compared_to_v77"]["offset_in_double_hours"]+=1
    with pytest.raises(ValueError,match="V83"):
        decorate_taiyi_v83(d)

def test_api_is_backwards_compatible_and_separate_from_year():
    cli=TestClient(app)
    response=cli.post("/api/taiyi/hour/cast",json={
         "solar_date":"2026-10-28","clock":"14:30"})
    assert response.status_code==200,response.text
    c=response.json()
    assert c["version"]=="V77"
    assert c["historical_ju_version"]=="V78"
    assert c["main_guest_version"]=="V79"
    assert c["classical_hour_extension_version"]=="V80"
    assert c["historical_review_version"]=="V81"
    assert c["hour_door_school_version"]=="V82"
    assert c["hour_door_epoch_version"]=="V83"
    assert "hour_v83_chief_epoch_comparison" in c
    assert c["has_full_hour_chart"] is False
    annual=cli.post("/api/taiyi/cast",json={"gregorian_year":2026})
    assert annual.status_code==200
    assert annual.json()["version"]=="V67"
    assert "hour_v83_chief_epoch_comparison" not in annual.json()
