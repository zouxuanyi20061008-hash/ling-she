"""V81 时计古籍数字内部矛盾、丁未日交叉校验、直使候选落位安全边界。"""
from copy import deepcopy
from datetime import date,time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.taiyi import cast_taiyi
from app.core.taiyi_hour_v77 import hour_basic_board
from app.core.taiyi_hour_v78 import classical_hour_ju
from app.core.taiyi_hour_v79 import calculate_hour_main_guest
from app.core.taiyi_hour_v80 import hour_harmony_dingji,hour_door_chief
from app.core.taiyi_hour_v81 import (
    source_review_v81,classify_same_palace_v81,door_location_candidate_v81,
    DAY_DINGJI
)
from app.core.taiyi_v65 import DIRECTIONS,GONG

def _orig(n=887,mode="阳遁"):
    classic=classical_hour_ju(n,mode)
    mg=calculate_hour_main_guest(classic)
    d=hour_harmony_dingji(classic,mg)
    gate=hour_door_chief(n,mode)
    return classic,mg,d,gate

def test_gengxu_887_is_one_primary_text_with_internal_32_33_disagreement():
    c,mg,d,g=_orig()
    z=source_review_v81(d)
    assert z["version"]=="V81"
    assert z["status"]=="historical_text_arithmetic_disagreement_open"
    assert z["calculation_status"]=="source_conflict"
    assert [x["added"] for x in z["nonzero_addends"]]==[1,2,7,6,1,8,3,4]
    assert z["nonzero_sum"]==32
    assert z["reported_total"]==33
    assert z["trace_length_including_zero_intermediate_positions"]>8
    assert z["zero_positions_kept_for_audit"]>0
    assert z["no_automatic_plus_one"] is True
    assert z["can_finalize_disputed_generals"] is False
    assert z["does_not_claim_two_independent_editions"] is True
    assert z["source_witnesses"][0]["independent_from_other_witnesses"] is False
    assert z["source_witnesses"][0]["arithmetic_sum"]==32
    assert z["source_witnesses"][0]["written_count"]==33
    assert z["candidate_arithmetic_general"]=={
       "count":32,"main_general":2,"assistant_general":6}
    assert d["count"] is None and d["main_general"] is None

def test_day_44_is_different_example_not_a_fake_gengxu_second_manuscript():
    other=DAY_DINGJI
    assert other["name"]=="丁未日定计"
    assert sum(other["positive_addends"])==other["sum"]==other["printed_sum"]==32
    assert other["not_an_independent_gengxu_manuscript"] is True
    _,_,d,_=_orig()
    z=source_review_v81(d)
    assert z["source_witnesses"][1]==other
    assert z["source_witnesses"][0]["source"]==z["source_witnesses"][1]["source"]

def test_chief_candidate_ancient_887_is_exact_original_eye_not_9_palace():
    _,mg,d,door=_orig()
    result=door_location_candidate_v81(door,d,mg)
    assert result["chief_door"]=="生"
    assert result["door_hour_in_thirty"]==17
    assert result["candidate_direction"]=="巳"
    assert result["candidate_god"]=="大神"
    assert result["candidate_eye"]==d["dingji_eye"]
    assert result["candidate_palace"] is None
    assert result["is_intermediate_direction"] is True
    assert result["never_force_intermediate_into_palace"] is True
    assert result["actual_hour_palace_if_unverified"] is None
    assert result["hourly_candidate_inferred_not_confirmed"] is True
    assert result["chief_door_placed_by_user_verified_hour_case"] is False
    assert result["all_eight_doors_placed"] is False
    assert len(result["candidate_position_marks"])==16
    assert sum(p["candidate_chief_door_here"] for p in result["candidate_position_marks"])==1
    assert next(p for p in result["candidate_position_marks"]
                if p["candidate_chief_door_here"])["direction"]=="巳"
    assert len(result["primary_text_rules"])==2

def test_720_all_dun_hours_review_and_precisely_one_chief_marker():
    kinds={"阳遁":{},"阴遁":{}}
    near_palace=0;intermediate=0;pending_same=0
    for mode in ("阳遁","阴遁"):
        for n in range(1,361):
            _,mg,d,gate=_orig(n,mode)
            review=source_review_v81(d)
            q=door_location_candidate_v81(gate,d,mg)
            same=classify_same_palace_v81(d,mg)
            kinds[mode][d["status"]]=kinds[mode].get(d["status"],0)+1
            assert review["calculation_status"]==d["status"]
            assert review["nonzero_sum"]==sum(s["added"] for s in d["computed_trace"])
            assert len(q["candidate_position_marks"])==16
            assert q["candidate_eye"]==d["dingji_eye"]
            assert q["chief_door"]==gate["chief_door"]
            assert q["actual_hour_palace_if_unverified"] is None
            assert q["all_eight_doors_placed"] is False
            assert not q["chief_door_placed_by_user_verified_hour_case"]
            assert sum(p["candidate_chief_door_here"] for p in
                       q["candidate_position_marks"])==1
            if q["candidate_palace"] is None:
                intermediate+=1
            else:
                near_palace+=1
                assert GONG[q["candidate_direction"]]==q["candidate_palace"]
            pending_same+=same["pending_sides"]
            for item in same["cases"]:
                assert item["kind"]=="same_exact_cardinal_spirit"
                assert item["eye_direction"] in GONG
                assert item["taiyi_palace"]==mg["taiyi_palace"]
                assert item["computed_count"] is None
                assert item["verified_hourly_exception"] is False
            if d["status"]=="source_conflict":
                assert (mode,n)==("阳遁",167)
                assert review["reported_total"]==33 and review["nonzero_sum"]==32
                assert q["candidate_palace"] is None
    assert kinds["阳遁"]["source_conflict"]==1
    assert sum(kinds["阳遁"].values())==sum(kinds["阴遁"].values())==360
    assert intermediate>0 and near_palace>0 and pending_same>0

def test_source_review_rejects_fake_33_and_tampered_positive_addends():
    _,mg,d,gate=_orig()
    fake=deepcopy(d)
    fake["count"]=33
    fake["main_general"]=3
    fake["assistant_general"]=9
    with pytest.raises(ValueError,match="V81"):
        source_review_v81(fake)
    fake=deepcopy(d);fake["computed_trace"][0]["added"]=2
    with pytest.raises(ValueError,match="V81"):
        source_review_v81(fake)
    fake=deepcopy(d);fake["source_disagreement"]["difference"]=0
    with pytest.raises(ValueError,match="V81"):
        source_review_v81(fake)
    fake=deepcopy(d);fake["version"]="V67"
    with pytest.raises(ValueError,match="V81"):
        source_review_v81(fake)

def test_gate_candidate_rejects_forged_eye_and_wrong_school():
    _,mg,d,gate=_orig()
    for key,value in (("index",0),("god","阴德"),("direction","艮"),("palace",9)):
        fake=deepcopy(d);fake["dingji_eye"][key]=value
        with pytest.raises(ValueError,match="V81"):
            door_location_candidate_v81(gate,fake,mg)
    fake=deepcopy(gate);fake["chief_door"]="飞鸟"
    with pytest.raises(ValueError,match="V81"):
        door_location_candidate_v81(fake,d,mg)
    with pytest.raises(ValueError,match="V81"):
        door_location_candidate_v81(gate,cast_taiyi(2026),mg)

def test_same_palace_pending_never_adopts_annual_alternate():
    found=None
    for mode in ("阳遁","阴遁"):
        for n in range(1,73):
            _,mg,d,_=_orig(n,mode)
            result=classify_same_palace_v81(d,mg)
            if result["pending_sides"]:
                found=result;break
        if found:break
    assert found
    assert found["status"]=="pending"
    assert found["never_auto_adopt_annual_exception"]
    assert all(z["verified_hourly_exception"] is False for z in found["cases"])
    assert all(z["computed_count"] is None for z in found["cases"])

def test_v81_public_api_keeps_separate_epochs_and_annual_untouched():
    cli=TestClient(app)
    response=cli.post("/api/taiyi/hour/cast",json={
       "solar_date":"2026-12-23","clock":"10:30"})
    assert response.status_code==200,response.text
    c=response.json()
    assert c["version"]=="V77"
    assert c["historical_ju_version"]=="V78"
    assert c["main_guest_version"]=="V79"
    assert c["classical_hour_extension_version"]=="V80"
    assert c["historical_review_version"]=="V81"
    assert c["hour_v81_door_location_candidate"]["version"]=="V81"
    assert c["hour_v81_source_review"]["version"]=="V81"
    assert c["hour_v81_same_palace_review"]["version"]=="V81"
    assert c["has_verified_hour_door_location"] is False
    assert c["has_full_hour_chart"] is False
    assert c["has_all_hour_eight_door_positions"] is False
    assert c["canonical_historical_hour_count"] is None
    assert c["fortune_verdict"] is None
    annual=cli.post("/api/taiyi/cast",json={"gregorian_year":2026})
    assert annual.status_code==200
    assert annual.json()["version"]=="V67"
    assert "hour_v81_source_review" not in annual.json()
