"""V82 由古籍固定八卦环序推四种时计八门候选，分派依据/间位绝不可造假。"""
from datetime import date,time
from copy import deepcopy
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.taiyi_hour_v77 import hour_basic_board
from app.core.taiyi_hour_v78 import classical_hour_ju
from app.core.taiyi_hour_v79 import calculate_hour_main_guest
from app.core.taiyi_hour_v80 import hour_harmony_dingji,hour_door_chief
from app.core.taiyi_hour_v81 import door_location_candidate_v81
from app.core.taiyi_hour_v82 import (
  rotate_eight_door_candidate,source_scoped_eight_door_candidates,
  EIGHT_DOORS,DIRECTIONS8,PALACES8
)

def _chain(hour=887,dun="阳遁"):
    classic=classical_hour_ju(hour,dun)
    mg=calculate_hour_main_guest(classic)
    d=hour_harmony_dingji(classic,mg)
    gate=hour_door_chief(hour,dun)
    old=door_location_candidate_v81(gate,d,mg)
    chart={"version":"V77","historical_ju_version":"V78",
        "main_guest_version":"V79","classical_hour_extension_version":"V80",
        "historical_review_version":"V81","classical_jiazi_hour_v78":{
            **classic,"is_absolute_upper_jiazi_epoch":False},
        "hour_main_guest_v79":mg,"hour_dingji_v80":d,
        "hour_eight_doors_v80":gate,
        "hour_v81_door_location_candidate":old}
    return chart

def test_eight_door_ancient_fixed_bagua_compass_is_explicit():
    result=rotate_eight_door_candidate(1,"开","jinjing_taiyi")
    assert DIRECTIONS8==("乾","坎","艮","震","巽","离","坤","兑")
    assert PALACES8==(1,8,3,4,9,2,7,6)
    assert EIGHT_DOORS==("开","休","生","伤","杜","景","死","惊")
    assert result["by_palace"]=={
       "1":"开","8":"休","3":"生","4":"伤","9":"杜","2":"景","7":"死","6":"惊"}
    assert result["by_door"]["开"]==1
    assert result["anchor_palace"]==1
    assert result["verified_as_single_complete_hour_chart"] is False
    assert result["status"]=="source_anchored_rotation_candidate"

def test_887_gengxu_conflicting_schools_not_reduced_to_one_hour_chart():
    chart=_chain()
    assert chart["hour_main_guest_v79"]["main_general"]==6
    assert chart["hour_main_guest_v79"]["guest_general"]==3
    assert chart["hour_main_guest_v79"]["taiyi_palace"]==9
    assert chart["hour_dingji_v80"]["status"]=="source_conflict"
    assert chart["hour_v81_door_location_candidate"]["candidate_direction"]=="巳"
    r=source_scoped_eight_door_candidates(chart)
    assert r["version"]=="V82" and r["chief"]=="生"
    assert r["candidate_count"]==3
    assert {x["school"] for x in r["candidates"]}=={
       "jinjing_taiyi","jinjing_main","jinjing_guest"}
    assert r["unplaceable"]==[{
       "school":"jinyao_dingji_eye",
       "reason":"定计目在十六神间位，古法允许记录方位，不能强制映射到八正宫",
       "eye_direction":"巳","empty_palace":None
    }]
    by={x["school"]:x for x in r["candidates"]}
    assert by["jinjing_taiyi"]["anchor_palace"]==9
    assert by["jinjing_main"]["anchor_palace"]==6
    assert by["jinjing_guest"]["anchor_palace"]==3
    assert by["jinjing_taiyi"]["by_palace"]=={
       "9":"生","2":"伤","7":"杜","6":"景","1":"死","8":"惊","3":"开","4":"休"}
    assert by["jinjing_taiyi"]["by_door"]["生"]==9
    assert len({str(x["by_palace"]) for x in r["candidates"]})==3
    assert r["no_verified_unified_school"] is True
    assert r["which_school_is_default"] is None
    assert not r["complete_eight_door_chart_verified"]
    assert r["disputed_dingji_general_never_used_to_place_doors"] is True

@pytest.mark.parametrize("chief",EIGHT_DOORS)
@pytest.mark.parametrize("palace",PALACES8)
def test_all_64_eight_door_anchor_permutations_have_no_fifth_or_dup(chief,palace):
    x=rotate_eight_door_candidate(palace,chief,"jinjing_taiyi")
    assert len(x["slots"])==8
    assert {z["palace"] for z in x["slots"]}==set(PALACES8)
    assert {z["door"] for z in x["slots"]}==set(EIGHT_DOORS)
    assert all(z["palace"]!=5 for z in x["slots"])
    assert x["slots"][0]["door"]==chief and x["slots"][0]["palace"]==palace
    assert sum(z["is_chief_anchor"] for z in x["slots"])==1
    for z in x["slots"]:
        assert x["by_palace"][str(z["palace"])]==z["door"]
        assert x["by_door"][z["door"]]==z["palace"]
        assert z["verified_full_hourly_door_position"] is False

def test_real_720_hours_never_misplace_pending_or_middle_main_guest():
    counts={"阳遁":{"variants":0,"unplaceable":0},
            "阴遁":{"variants":0,"unplaceable":0}}
    missing_middle=0;missing_pending=0;intermediate=0;palace_dingji=0
    for mode in ("阳遁","阴遁"):
        for n in range(1,361):
            board=_chain(n,mode)
            x=source_scoped_eight_door_candidates(board)
            assert len(x["candidates"])+len(x["unplaceable"])==4
            assert all(z["verified_as_single_complete_hour_chart"] is False for z in x["candidates"])
            assert x["chief"]==board["hour_eight_doors_v80"]["chief_door"]
            assert x["no_verified_unified_school"] and x["which_school_is_default"] is None
            counts[mode]["variants"]+=len(x["candidates"])
            counts[mode]["unplaceable"]+=len(x["unplaceable"])
            for missing in x["unplaceable"]:
                if "中五" in missing["reason"]:missing_middle+=1
                if "同宫" in missing["reason"]:missing_pending+=1
                if missing["school"]=="jinyao_dingji_eye":intermediate+=1
            if any(z["school"]=="jinyao_dingji_eye" for z in x["candidates"]):
                palace_dingji+=1
                assert board["hour_dingji_v80"]["dingji_eye"]["palace"] in PALACES8
            for variant in x["candidates"]:
                assert variant["by_door"][x["chief"]]==variant["anchor_palace"]
                assert len(variant["slots"])==8
    assert missing_middle>0 and missing_pending>0 and intermediate>0 and palace_dingji>0
    assert all(stats["variants"]+stats["unplaceable"]==360*4 for stats in counts.values())

def test_no_annual_charts_or_tampered_hour_anchors_accepted():
    from app.core.taiyi import cast_taiyi
    with pytest.raises(ValueError,match="V82"):
        source_scoped_eight_door_candidates(cast_taiyi(2026))
    chart=_chain()
    for field,value in (("hour_count",1),("chief_door","死"),("hour_in_door",1)):
        corrupt=deepcopy(chart);corrupt["hour_eight_doors_v80"][field]=value
        with pytest.raises(ValueError,match="V82"):
            source_scoped_eight_door_candidates(corrupt)
    corrupt=deepcopy(chart)
    corrupt["hour_main_guest_v79"]["taiyi_palace"]=1
    with pytest.raises(ValueError,match="V82"):
        source_scoped_eight_door_candidates(corrupt)
    corrupt=deepcopy(chart)
    corrupt["hour_v81_door_location_candidate"]["candidate_eye"]["god"]="高丛"
    with pytest.raises(ValueError,match="V82"):
        source_scoped_eight_door_candidates(corrupt)
    for pal in (5,0,None,10,True,"1"):
        with pytest.raises(ValueError):
            rotate_eight_door_candidate(pal,"开","jinjing_taiyi")
    for name in ("",None,"巳","开门"):
        with pytest.raises(ValueError):
            rotate_eight_door_candidate(1,name,"jinjing_taiyi")

def test_public_hour_api_and_old_year_remain_separate_and_unverified():
    cli=TestClient(app)
    response=cli.post("/api/taiyi/hour/cast",json={
        "solar_date":"2026-12-23","clock":"10:30"})
    assert response.status_code==200,response.text
    c=response.json()
    assert c["hour_door_school_version"]=="V82"
    assert c["hour_v82_eight_door_schools"]["version"]=="V82"
    assert c["hour_v82_eight_door_schools"]["four_anchor_schools_checked"]
    assert c["has_verified_hour_door_location"] is False
    assert c["has_all_hour_eight_door_positions"] is False
    assert c["has_full_hour_chart"] is False
    assert c["canonical_historical_hour_count"] is None
    assert c["fortune_verdict"] is None
    annual=cli.post("/api/taiyi/cast",json={"gregorian_year":2026})
    assert annual.status_code==200
    assert annual.json()["version"]=="V67"
    assert "hour_v82_eight_door_schools" not in annual.json()
