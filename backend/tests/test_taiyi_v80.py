"""V80 时计合神、定目和四门直使；庚戌原典32/33矛盾不能伪造。"""
from copy import deepcopy
from datetime import date,time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.taiyi_hour_v77 import hour_basic_board
from app.core.taiyi_hour_v78 import classical_hour_ju
from app.core.taiyi_hour_v79 import calculate_hour_main_guest
from app.core.taiyi_hour_v80 import (
    hour_door_chief,hour_harmony_dingji,decorate_taiyi_v80,WITNESS_887
)
from app.core.taiyi_v65 import DIRECTIONS,GONG,GODS,INDEX
from app.core.taiyi_v67 import SIX_HARMONY

def _ancient():
    classic=classical_hour_ju(887,"阳遁")
    main=calculate_hour_main_guest(classic)
    ding=hour_harmony_dingji(classic,main)
    return classic,main,ding

def test_original_887_harmony_and_dingji_are_derived_not_copied():
    c,m,d=_ancient()
    assert m["status"]=="computed"
    assert c["hour_ganzhi_from_jiazi_start"]=="庚戌"
    assert d["hour_branch"]=="戌"
    assert d["harmony"]=={
        "branch":"卯","direction":"卯","god":"高丛","index":INDEX["卯"],
        "palace":4,"hour_branch":"戌","source":WITNESS_887["source"]}
    assert d["dingji_eye"]["direction"]=="巳"
    assert d["dingji_eye"]["god"]=="大神"
    assert d["dingji_eye"]["is_intermediate"]
    assert d["rotation"]["wenchang_sky_index"]==INDEX["乾"]
    assert d["rotation"]["harmony_sky_index"]==INDEX["卯"]
    assert d["rotation"]["hour_ground_index"]==INDEX["戌"]
    assert d["rotation"]["ground_index"]==INDEX["巳"]
    assert len(d["rotation"]["rotated_sixteen"])==16
    assert d["rotation"]["rotated_sixteen"][INDEX["戌"]]["heaven"]=="卯"
    assert d["rotation"]["rotated_sixteen"][INDEX["巳"]]["heaven"]=="乾"
    assert d["source_calc_status"]=="computed"
    assert [p["added"] for p in d["computed_trace"]]==[1,2,7,6,1,8,3,4]
    assert d["computed_trace_sum"]==32
    assert sum(p["added"] for p in d["computed_trace"])==32
    assert "巽" not in [p["direction"] for p in d["computed_trace"]]
    assert d["status"]=="source_conflict" and d["count"] is None
    assert d["main_general"] is None and d["assistant_general"] is None
    assert d["unadopted_arithmetic_candidate"]=={
        "count":32,"main_general":2,"assistant_general":6}
    assert d["source_disagreement"]["printed_total"]==33
    assert d["source_disagreement"]["printed_big_general"]==3
    assert d["source_disagreement"]["printed_assistant_general"]==9
    assert d["source_disagreement"]["difference"]==1
    assert d["source_disagreement"]["do_not_auto_pick_a_general"]
    assert d["has_verified_unique_dingji"] is False
    assert d["fortune_verdict"] is None

@pytest.mark.parametrize("dun,order",[
   ("阳遁",("开","生","惊","休")),
   ("阴遁",("杜","死","伤","景"))
])
def test_four_door_120_hour_cycle_exact_one_based_boundaries(dun,order):
    for count in range(1,361):
        p=hour_door_chief(count,dun)
        ref=order[((count-1)%120)//30]
        assert p["chief_door"]==ref
        assert p["hour_in_door"]==(count-1)%30+1
        assert p["index_in_four"]==(count-1)%120//30+1
        assert p["remaining_hours_until_change"]==30-p["hour_in_door"]
        assert p["does_not_assign_all_eight_palaces"] is True
    for i,door in enumerate(order):
        assert hour_door_chief(i*30+1,dun)["chief_door"]==door
        assert hour_door_chief((i+1)*30,dun)["chief_door"]==door
    assert hour_door_chief(121,dun)["chief_door"]==order[0]
    assert hour_door_chief(240,dun)["chief_door"]==order[3]

def test_independent_47_and_887_both_confirm_sheng_seventeenth_hour():
    p=hour_door_chief(47,"阳遁")
    q=hour_door_chief(887,"阳遁")
    assert p["chief_door"]==q["chief_door"]=="生"
    assert p["hour_in_door"]==q["hour_in_door"]==17
    assert p["hour_in_120"]==q["hour_in_120"]==47
    assert p["completed_120_circuits"]==0
    assert q["completed_120_circuits"]==7
    assert q["hour_count"]==887

def test_two_schools_times_are_never_mixed_in_v80_public_chart():
    hour=hour_basic_board(date(2026,12,23),time(10,30))
    assert hour["version"]=="V77" and hour["main_guest_version"]=="V79"
    assert hour["classical_hour_extension_version"]=="V80"
    assert hour["has_hour_harmony"] and hour["has_hour_dingji_eye"]
    assert hour["has_hour_door_chief"]
    assert hour["has_hour_dingji"]==(
        hour["hour_dingji_v80"]["status"]=="computed")
    assert not hour["has_full_hour_chart"]
    assert not hour["has_all_hour_eight_door_positions"]
    assert hour["canonical_historical_hour_count"] is None
    assert hour["hour_eight_doors_v80"]["does_not_assign_all_eight_palaces"]
    assert hour["hour_eight_doors_v80"]["hour_count"]==(
        hour["classical_jiazi_hour_v78"]["accumulated_hours"])
    assert hour["hour_eight_doors_v80"]["chief_door_anchored_at_dingji_eye"]==(
        hour["hour_dingji_v80"]["dingji_eye"])
    assert hour["fortune_verdict"] is None
    assert hour["classical_jiazi_hour_v78"]["is_absolute_upper_jiazi_epoch"] is False

def test_hour_dingji_and_door_720_all_slotted_computed_or_explicit_pending():
    status={"阳遁":{},"阴遁":{}}
    for dun in ("阳遁","阴遁"):
        for count in range(1,361):
            c=classical_hour_ju(count,dun)
            m=calculate_hour_main_guest(c)
            d=hour_harmony_dingji(c,m)
            gate=hour_door_chief(count,dun)
            status[dun][d["status"]]=status[dun].get(d["status"],0)+1
            assert d["harmony"]["branch"]==SIX_HARMONY[d["hour_branch"]]
            assert d["dingji_eye"]["direction"]==DIRECTIONS[
                (c["time_wenchang"]["index"]-INDEX[d["harmony"]["branch"]]
                +INDEX[d["hour_branch"]])%16]
            assert len(d["rotation"]["rotated_sixteen"])==16
            assert d["computed_trace_sum"]==(
                sum(x["added"] for x in d["computed_trace"]) if
                d["computed_trace"] else None)
            assert gate["hour_in_door"] in range(1,31)
            if d["status"]=="computed":
                assert d["count"]==d["computed_trace_sum"]
                assert d["main_general"] in range(1,10)
                assert d["assistant_general"] in range(1,10)
            else:
                assert d["status"] in ("source_conflict","pending")
                assert d["count"] is None
                assert d["main_general"] is None
                assert d["assistant_general"] is None
            if d["status"]=="source_conflict":
                assert (count-1)%360==(887-1)%360 and dun=="阳遁"
                assert d["source_disagreement"]["listed_sum"]==32
                assert d["source_disagreement"]["printed_total"]==33
            assert d["fortune_verdict"] is None
    assert status["阳遁"]["source_conflict"]==1
    assert status["阳遁"].get("computed",0)>0
    assert status["阴遁"].get("computed",0)>0
    assert sum(status["阳遁"].values())==sum(status["阴遁"].values())==360

def test_ancient_887_source_conflict_is_different_from_same_palace_pending():
    orig,main,conflict=_ancient()
    assert conflict["status"]=="source_conflict"
    found=False
    for dun in ("阳遁","阴遁"):
        for count in range(1,73):
            base=classical_hour_ju(count,dun)
            trial=hour_harmony_dingji(base,calculate_hour_main_guest(base))
            if trial["status"]=="pending":
                found=True
                assert trial["same_palace_conservative"] is True
                assert trial["computed_trace_sum"] is None
                assert trial["source_disagreement"] is None
                assert trial["count"] is None
                assert trial["main_general"] is None
                break
        if found:break
    assert found

def test_v80_rejects_forged_annual_and_modified_inputs():
    c=classical_hour_ju(887,"阳遁")
    m=calculate_hour_main_guest(c)
    for field,value in (("ju",33),("time_jishen","午"),
                        ("five_yuan_name","甲子元"),
                        ("hour_ganzhi_from_jiazi_start","辛亥")):
        f=deepcopy(c);f[field]=value
        with pytest.raises(ValueError,match="V80"):
            hour_harmony_dingji(f,m)
    f=deepcopy(m);f["jishen"]="亥"
    with pytest.raises(ValueError,match="V80"):
        hour_harmony_dingji(c,f)
    from app.core.taiyi import cast_taiyi
    with pytest.raises(ValueError,match="V80"):
        hour_harmony_dingji(cast_taiyi(2026),m)
    with pytest.raises(ValueError,match="V80"):
        decorate_taiyi_v80({"version":"V79"})

def test_api_2026_old_annual_still_real_and_new_hour_flags():
    cli=TestClient(app)
    x=cli.post("/api/taiyi/hour/cast",json={
        "solar_date":"2026-12-23","clock":"10:30"})
    assert x.status_code==200,x.text
    data=x.json()
    assert data["classical_hour_extension_version"]=="V80"
    assert data["hour_dingji_v80"]["version"]=="V80"
    assert data["hour_eight_doors_v80"]["version"]=="V80"
    assert data["has_full_hour_chart"] is False
    assert "hour_dingji_v80" not in (
        cli.post("/api/taiyi/cast",json={"gregorian_year":2026}).json())
    assert cli.post("/api/taiyi/hour/cast",json={
        "solar_date":"2026-12-23","clock":"10:30",
        "oracle_override":33}).status_code==422

@pytest.mark.parametrize("bad",[-1,0,True,1.5,"47",None])
def test_hour_door_rejects_illegal_hour_count(bad):
    with pytest.raises(ValueError):
        hour_door_chief(bad,"阳遁")
    with pytest.raises(ValueError):
        hour_door_chief(bad,"阴遁")

@pytest.mark.parametrize("wrong",["",None,"阴","阳","混遁"])
def test_hour_door_rejects_invalid_dun(wrong):
    with pytest.raises(ValueError):
        hour_door_chief(47,wrong)
