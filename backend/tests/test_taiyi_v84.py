"""V84 王希明二至气应独立太乙/计神/直使，不偷借甲子派主客将位。"""
from datetime import date,time,timedelta
from copy import deepcopy
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.taiyi_hour_v77 import hour_basic_board,_jieqi,hour_cycle_from_count
from app.core.taiyi_hour_v80 import hour_door_chief
from app.core.taiyi_hour_v84 import qiying_hour_core,compare_qiying_and_jiazi,decorate_taiyi_v84
from app.core.taiyi_hour_v82 import PALACES8,EIGHT_DOORS

@pytest.mark.parametrize("dun,term,initial,first",[
  ("阳遁","冬至",1,"开"),("阴遁","夏至",9,"杜")
])
def test_qiying_first_true_term_hour_is_an_independent_basic_plate(dun,term,initial,first):
    r=qiying_hour_core(1,dun,term)
    assert r["version"]=="V84"
    assert r["taiyi_palace"]["number"]==initial
    assert r["jishen"]==("寅" if dun=="阳遁" else "申")
    assert r["taiyi_hour_in_palace"]==1
    assert r["hour_chief"]["chief_door"]==first
    assert r["taiyi_eight_door_conditional_rotation"]["by_door"][first]==initial
    assert r["qiying_main_general"]["palace"] is None
    assert r["qiying_guest_general"]["palace"] is None
    assert r["qiying_wenchang"] is None and r["qiying_shiji"] is None
    assert r["does_not_use_jiazi_wenchang_or_generals"] is True
    assert r["taiyi_anchor_attested_but_all_eight_unverified"] is True
    assert r["has_verified_full_eight_door_palaces"] is False

@pytest.mark.parametrize("dun,term",[
  ("阳遁","冬至"),("阴遁","夏至")
])
def test_independent_qiying_360_hours_with_3_hour_taiyi_1_hour_jishen_and_30_hour_gate(dun,term):
    for n in range(1,361):
        r=qiying_hour_core(n,dun,term)
        reference=hour_cycle_from_count(n,dun)
        assert r["taiyi_palace"]==reference["taiyi_palace"]
        assert r["taiyi_hour_in_palace"]==(n-1)%3+1
        assert r["jishen"]==reference["jishen"]
        assert r["taiyi_ring_order"]==reference["ring_order"]
        assert r["hour_chief"]==hour_door_chief(n,dun)
        assert r["taiyi_eight_door_conditional_rotation"]["by_door"][
            r["hour_chief"]["chief_door"]]==r["taiyi_palace"]["number"]
        assert len(r["taiyi_eight_door_conditional_rotation"]["slots"])==8
        assert set(r["taiyi_eight_door_conditional_rotation"]["by_door"])==set(EIGHT_DOORS)
        assert set(r["taiyi_eight_door_conditional_rotation"]["by_palace"])=={
            str(p) for p in PALACES8}
        for kind in ("qiying_main_general","qiying_guest_general"):
            x=r[kind]
            assert x["status"]=="pending_unverified_qiying_initial_general"
            assert x["palace"] is None and x["general_count"] is None
            assert x["has_attested_initial_qiying_palace"] is False
            assert x["may_reuse_jiazi_generals"] is False
            assert x["can_place_eight_doors"] is False

def test_2026_both_exact_solstices_and_diff_independent_plate():
    for term,month in (("冬至",12),("夏至",6)):
        point=_jieqi(2026,term,month)
        for seconds in (-1,1):
            instant=point+timedelta(seconds=seconds)
            chart=hour_basic_board(instant.date(),instant.time())
            check=chart["hour_v84_qiying_plate"]
            q=check["qiying"]
            assert q["relative_hours"]==chart["time_cycle"]["relative_time_count"]
            assert q["solstice_name"]==chart["solstice"]["name"]
            assert q["taiyi_palace"]==chart["time_cycle"]["taiyi_palace"]
            assert q["jishen"]==chart["time_cycle"]["jishen"]
            assert q["hour_chief"]["chief_door"]==chart[
              "hour_v83_chief_epoch_comparison"]["solstice_chief"]
            assert check["jiazi"]["hour_chief"]["chief_door"]==chart[
              "hour_v83_chief_epoch_comparison"]["jiazi_chief"]
            assert check["jiazi"]["taiyi_palace"]==chart[
              "classical_jiazi_hour_v78"]["taiyi_palace"]
            assert check["same_taiyi_palace"]==(
                q["taiyi_palace"]["number"]==check["jiazi"]["taiyi_palace"]["number"])
            assert not check["qiying_main_guest_from_original_epoch_verified"]
            assert not check["all_eight_gates_attested_independently"]
            assert not chart["has_full_hour_chart"]
            assert not chart["has_all_hour_eight_door_positions"]
            if seconds==1:
                assert q["relative_hours"]==1
                assert q["taiyi_hour_in_palace"]==1

def test_both_methods_may_agree_or_disagree_and_no_mixing_even_when_equal():
    same=[];different=[]
    for year in (2025,2026,2027):
        for month in (1,3,6,8,10,12):
            board=hour_basic_board(date(year,month,15),time(11,30))
            data=board["hour_v84_qiying_plate"]
            assert data["version"]=="V84"
            assert data["same_conditional_taiyi_door_rotation"]==(
                data["qiying"]["taiyi_eight_door_conditional_rotation"]["by_palace"]==
                data["jiazi"]["taiyi_eight_door_conditional_rotation"]["by_palace"])
            assert data["same_chief"]==board["hour_v83_chief_epoch_comparison"]["same_chief_door"]
            assert data["jiazi"]["may_be_reused_as_qiying_general"] is False
            assert data["different_schools_never_merged"]
            (same if data["same_conditional_taiyi_door_rotation"] else different).append(board["input"]["solar_date"])
    assert different
    # 两法可能在个别时刻同盘；无论是否找到，不能当作历元一致。
    assert len(same)+len(different)==18

def test_decoration_rejects_tampered_jishen_chief_qi_palace_and_jiazi_anchor():
    base=hour_basic_board(date(2026,12,23),time(10,30))
    cases=[
        ("time_cycle","jishen","亥"),
        ("jishen","branch","未"),
        ("time_cycle","relative_time_count",0),
        ("hour_v83_chief_epoch_comparison","jiazi_chief","伤"),
        ("hour_v82_eight_door_schools","chief","乱"),
        ("hour_main_guest_v79","taiyi_palace",5),
    ]
    for group,field,value in cases:
        tampered=deepcopy(base)
        if tampered[group][field]==value:
            value="乱" if isinstance(value,str) else 999
        tampered[group][field]=value
        with pytest.raises(ValueError):
            compare_qiying_and_jiazi(tampered)
    invalid=deepcopy(base)
    invalid["hour_door_epoch_version"]="V82"
    with pytest.raises(ValueError,match="V84"):
        decorate_taiyi_v84(invalid)

@pytest.mark.parametrize("count,dun,term",[
  (0,"阳遁","冬至"),(-1,"阴遁","夏至"),(True,"阳遁","冬至"),
  (1,"阳遁","夏至"),(1,"阴遁","冬至"),(1,"虚遁","冬至")
])
def test_refuses_invalid_epoch_or_hour_input(count,dun,term):
    with pytest.raises(ValueError):
        qiying_hour_core(count,dun,term)

def test_api_v84_qiying_core_and_old_annual_still_unmodified():
    cli=TestClient(app)
    for d,t in (("2026-06-22","09:30"),("2026-12-23","10:30")):
        response=cli.post("/api/taiyi/hour/cast",json={"solar_date":d,"clock":t})
        assert response.status_code==200,response.text
        data=response.json()
        assert data["qiying_plate_version"]=="V84"
        assert data["hour_door_epoch_version"]=="V83"
        assert data["hour_v84_qiying_plate"]["qiying"]["relative_hours"]==data[
            "time_cycle"]["relative_time_count"]
        assert data["has_verified_qiying_main_guest"] is False
        assert data["has_full_hour_chart"] is False
        assert data["fortune_verdict"] is None
        assert data["hour_v84_qiying_plate"]["qiying"]["qiying_main_general"]["palace"] is None
    old=cli.post("/api/taiyi/cast",json={"gregorian_year":2026})
    assert old.status_code==200
    assert old.json()["version"]=="V67"
    assert "hour_v84_qiying_plate" not in old.json()
