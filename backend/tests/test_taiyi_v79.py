"""V79 时计独立887时整盘、主客逐宫、真实午时段与同宫不伪造。"""
from copy import deepcopy
from datetime import date,time
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.taiyi import cast_taiyi
from app.core.taiyi_hour_v77 import hour_basic_board
from app.core.taiyi_hour_v78 import classical_hour_ju
from app.core.taiyi_hour_v79 import (
    ANCIENT_887,calculate_hour_main_guest,decorate_taiyi_v79
)
from app.core.taiyi_v65 import DIRECTIONS,GONG

def test_original_complete_887_gengxu_hour_16_23_and_four_generals():
    original=classical_hour_ju(887,"阳遁")
    v=calculate_hour_main_guest(original)
    assert v["version"]=="V79" and v["status"]=="computed"
    assert v["historical_case_audit"]["status"]=="verified_independent_classical_math_case"
    assert v["historical_case_audit"]["expected"]==v["historical_case_audit"]["actual"]
    assert v["jishen"]=="辰"
    assert v["heaven_eye_wenchang"]["god"]=="阴德"
    assert v["heaven_eye_wenchang"]["direction"]=="乾"
    assert v["earth_eye_shiji"]["god"]=="武德"
    assert v["earth_eye_shiji"]["direction"]=="申"
    assert (v["main_calculated"],v["guest_calculated"])==(16,23)
    assert (v["main_general"],v["main_assistant"])==(6,8)
    assert (v["guest_general"],v["guest_assistant"])==(3,9)
    assert sum(x["added"] for x in v["main"]["trace"])==16
    assert sum(x["added"] for x in v["guest"]["trace"])==23
    assert v["main"]["trace"][0]["god"]=="阴德"
    assert v["main"]["trace"][0]["added"]==1
    assert v["guest"]["trace"][0]["god"]=="武德"
    assert v["guest"]["trace"][0]["added"]==1
    assert v["main"]["trace"][-1]["god"]=="太阳"
    assert v["guest"]["trace"][-1]["god"]=="太阳"
    assert v["main"]["stop_direction"]==v["guest"]["stop_direction"]=="巽"
    assert all(x["direction"]!="巽" for x in v["main"]["trace"])
    assert all(x["direction"]!="巽" for x in v["guest"]["trace"])
    assert len(v["sixteen_spirits"])==16
    assert len(v["nine_palace_positions"])==9
    assert sum(x["has_wenchang"] for x in v["sixteen_spirits"])==1
    assert sum(x["has_shiji"] for x in v["sixteen_spirits"])==1
    assert sum(x["has_jishen"] for x in v["sixteen_spirits"])==1
    assert v["fortune_verdict"] is None
    assert v["is_complete_all_hours"] is False

def test_887_full_original_proof_is_from_real_computations_not_fixture():
    c=classical_hour_ju(887,"阳遁")
    v=calculate_hour_main_guest(c)
    reference=ANCIENT_887
    assert v["historical_case_audit"]["actual"]=={
        "five_yuan_name":reference["five_yuan_name"],"ju":reference["ju"],
        "taiyi_palace":reference["taiyi_palace"],
        "wenchang_god":reference["wenchang_god"],
        "wenchang_direction":reference["wenchang_direction"],
        "jishen":reference["jishen"],
        "shiji_god":reference["shiji_god"],
        "shiji_direction":reference["shiji_direction"],
        "main_count":reference["main_count"],"guest_count":reference["guest_count"],
        "main_general":reference["main_general"],
        "main_assistant":reference["main_assistant"],
        "guest_general":reference["guest_general"],
        "guest_assistant":reference["guest_assistant"]}
    assert v["historical_case_audit"]["modern_same_count_is_not_same_historical_date"]

@pytest.mark.parametrize("mode",["阳遁","阴遁"])
def test_all_360_cycle_slots_counted_or_safely_pending(mode):
    outcomes={"computed":0,"partially_computed":0,"pending":0}
    for count in range(1,361):
        x=calculate_hour_main_guest(classical_hour_ju(count,mode))
        outcomes[x["status"]]+=1
        assert x["accumulated_hours"]==count
        assert x["dun"]==mode
        assert x["earth_eye_shiji"]["index"] in range(16)
        assert x["earth_eye_shiji"]["jishen_direction"]==x["jishen"]
        assert len(x["sixteen_spirits"])==16
        assert all(x0["palace"] in (1,2,3,4,6,7,8,9,None) for x0 in x["sixteen_spirits"])
        for key in ("main","guest"):
            side=x[key]
            if side["status"]=="computed":
                assert side["count"]==sum(row["added"] for row in side["trace"])
                assert all(row["direction"]!=x["main"]["stop_direction"] for row in side["trace"])
                assert 1<=side["main_general"]<=9
                assert 1<=side["assistant_general"]<=9
            else:
                assert side["status"]=="pending"
                assert side["count"] is None
                assert side["main_general"] is None
                assert side["assistant_general"] is None
                assert side["same_palace_as_taiyi"] is True
        assert x["has_complete_hour_main_guest"]==(x["status"]=="computed")
        assert x["historical_case_audit"] is None
    assert outcomes["computed"]>0
    assert outcomes["partially_computed"]+outcomes["pending"]>0

def test_sixteen_spirit_rotation_not_transposed_and_not_year_origin():
    for dun in ("阳遁","阴遁"):
        for h in (1,5,23,63,167,207,887):
            c=classical_hour_ju(h,dun)
            x=calculate_hour_main_guest(c)
            w=x["heaven_eye_wenchang"]["index"]
            j=x["jishen"]
            assert x["earth_eye_shiji"]["index"]==(
                w+2-DIRECTIONS.index(j))%16
            assert x["taiyi_palace"]==c["taiyi_palace"]["number"]
            assert x["five_yuan_name"]==c["five_yuan_name"]
            assert x["ju"]==c["ju"]

def test_untrusted_tampered_input_rejected_before_generating_count():
    base=classical_hour_ju(887,"阳遁")
    for path,value in [
       ("ju",22),("five_yuan_name","甲子元"),("time_jishen","酉"),
       ("hour_ganzhi_from_jiazi_start","甲子")]:
        copy=deepcopy(base);copy[path]=value
        with pytest.raises(ValueError,match="V79"):
            calculate_hour_main_guest(copy)
    for field,value in (("index",9),("god","武德"),("direction","坤"),
                        ("count_in_18",6)):
        copy=deepcopy(base);copy["time_wenchang"][field]=value
        with pytest.raises(ValueError,match="V79"):
            calculate_hour_main_guest(copy)
    invalid=deepcopy(base);invalid["has_cycle_360_72"]=False
    with pytest.raises(ValueError,match="V79"):
        calculate_hour_main_guest(invalid)
    with pytest.raises(ValueError,match="V79"):
        calculate_hour_main_guest(cast_taiyi(2026))

def test_real_2026_api_contains_both_v77_v78_v79_and_annual_is_unmodified():
    cli=TestClient(app)
    response=cli.post("/api/taiyi/hour/cast",json={
        "solar_date":"2026-12-22","clock":"10:30"})
    assert response.status_code==200,response.text
    c=response.json()
    assert c["version"]=="V77"
    assert c["historical_ju_version"]=="V78"
    assert c["main_guest_version"]=="V79"
    v=c["hour_main_guest_v79"]
    assert v["version"]=="V79"
    assert v["accumulated_hours"]==c["classical_jiazi_hour_v78"]["accumulated_hours"]
    assert v["jishen"]==c["classical_jiazi_hour_v78"]["time_jishen"]
    assert v["status"] in ("computed","partially_computed","pending")
    assert c["has_hour_shiji"] is True
    assert c["has_complete_shiji_and_hour_main_guest"]==(v["status"]=="computed")
    assert c["has_full_hour_chart"] is False
    assert c["canonical_historical_hour_count"] is None
    assert c["fortune_verdict"] is None
    annual=cli.post("/api/taiyi/cast",json={"gregorian_year":2026})
    assert annual.status_code==200
    assert annual.json()["version"]=="V67"
    assert "hour_main_guest_v79" not in annual.json()

def test_not_ready_to_forge_unknown_hour_four_counts_when_same_palace():
    cases=[]
    for dun in ("阳遁","阴遁"):
        for i in range(1,73):
            x=calculate_hour_main_guest(classical_hour_ju(i,dun))
            if x["status"]!="computed":
                cases.append((dun,i,x))
    assert cases
    for dun,i,x in cases:
        assert x["has_complete_hour_main_guest"] is False
        assert (x["main"]["count"] is None or x["guest"]["count"] is None)
        assert x["fortune_verdict"] is None

def test_historical_887_witness_does_not_make_abs_absolute_epoch():
    year=hour_basic_board(date(2026,12,23),time(10,20))
    assert year["version"]=="V77"
    assert year["main_guest_version"]=="V79"
    assert year["classical_jiazi_hour_v78"]["is_absolute_upper_jiazi_epoch"] is False
    assert year["hour_main_guest_v79"]["epoch"].startswith("V78")
    assert year["has_full_hour_chart"] is False
