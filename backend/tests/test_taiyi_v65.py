"""V65 independent 1561/1624 文昌始击位置、主客逐算证据."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.taiyi import year_board
from app.core.taiyi_v65 import (
 DIRECTIONS,GODS,WENCHANG_SEQUENCE,GONG,INDEX,
 wenchang_from_accumulated,shiji_from_wenchang,trace_count)
@pytest.mark.parametrize("year,wen,shiji,main,guest,mgen,mcan,ggen,gcan",[
 (1561,"阴德","天道",16,30,6,8,3,9),
 (1624,"大炅","太阳",18,19,8,4,9,7),
])
def test_two_independent_ancient_year_host_guest_walks(
        year,wen,shiji,main,guest,mgen,mcan,ggen,gcan):
    c=year_board(year,historical=True)
    v=c["main_guest"]
    assert c["version"]=="V65"
    assert v["status"]=="computed"
    assert v["heaven_eye_wenchang"]["god"]==wen
    assert v["earth_eye_shiji"]["god"]==shiji
    assert (v["main_calculated"],v["guest_calculated"])==(main,guest)
    assert (v["main_general"]["main_general"],v["main_general"]["assistant_general"])==(mgen,mcan)
    assert (v["guest_general"]["main_general"],v["guest_general"]["assistant_general"])==(ggen,gcan)
    assert v["verified_by_independent_ancient_case"] is True
    assert c["has_complete_main_guest"] is True
    assert c["fortune_verdict"] is None


def test_1561_full_palace_count_witness_contributions():
    v=year_board(1561,historical=True)["main_guest"]
    assert [(x["direction"],x["added"]) for x in v["main_general"]["trace"] if x["added"]]==[
      ("乾",1),("子",8),("艮",3),("卯",4)]
    assert [(x["direction"],x["added"]) for x in v["guest_general"]["trace"] if x["added"]]==[
      ("未",1),("坤",7),("酉",6),("乾",1),("子",8),("艮",3),("卯",4)]


def test_1624_original_host_guest_witness_18_and_19():
    v=year_board(1624,historical=True)["main_guest"]
    assert [(x["direction"],x["added"]) for x in v["main_general"]["trace"] if x["added"]]==[
      ("巽",9),("午",2),("坤",7)]
    assert [(x["direction"],x["added"]) for x in v["guest_general"]["trace"] if x["added"]]==[
      ("辰",1),("巽",9),("午",2),("坤",7)]


def test_eighteen_round_double_stay_kan_kun_and_sixteen_unique_directions():
    assert len(DIRECTIONS)==len(GODS)==16
    assert len(set(DIRECTIONS))==16
    assert len(WENCHANG_SEQUENCE)==18
    assert len(set(WENCHANG_SEQUENCE))==16
    assert [DIRECTIONS[i] for i in WENCHANG_SEQUENCE if DIRECTIONS[i]=="乾"]==["乾","乾"]
    assert [DIRECTIONS[i] for i in WENCHANG_SEQUENCE if DIRECTIONS[i]=="坤"]==["坤","坤"]
    x=wenchang_from_accumulated(10155478)
    assert x["god"]=="阴德"
    assert x["count_in_18"]==4
    assert [r["direction"] for r in x["trace"]]==["申","酉","戌","乾"]
    assert wenchang_from_accumulated(10155478+18)["god"]=="阴德"


def test_reverse_shiji_formula_not_confused_with_reversed_rotation():
    v=year_board(1561,historical=True)["main_guest"]
    x=shiji_from_wenchang(v["heaven_eye_wenchang"]["index"],"巳")
    assert (x["direction"],x["god"])==("未","天道")
    assert x["index"]==(INDEX["乾"]+INDEX["艮"]-INDEX["巳"])%16
    assert shiji_from_wenchang(INDEX["巽"],"寅")["god"]=="太阳"


def test_2026_wenchang_16_but_shiji_equals_taiyi_special_unresolved():
    v=year_board(2026)["main_guest"]
    assert v["heaven_eye_wenchang"]["god"]=="武德"
    assert v["earth_eye_shiji"]["god"]=="和德"
    assert v["main_calculated"]==16
    assert v["guest_calculated"] is None
    assert v["status"]=="partially_computed"
    assert v["guest_general"]["same_palace_as_taiyi"]
    assert v["guest_general"]["trace"]==[]
    assert not v["main_guest_generals_computed"]
    assert not year_board(2026)["has_complete_main_guest"]


def test_all_199_years_safe_trace_or_declared_special_branch():
    counts={"computed":0,"partially_computed":0,"pending":0}
    for year in range(1901,2100):
        c=year_board(year)
        v=c["main_guest"]
        counts[v["status"]]+=1
        assert len(c["sixteen_spirits"])==16
        assert sum(x["has_wenchang"] for x in c["sixteen_spirits"])==1
        assert sum(x["has_shiji"] for x in c["sixteen_spirits"])==1
        for key in ("main_general","guest_general"):
            x=v[key]
            if x["status"]=="computed":
                assert x["count"]==sum(p["added"] for p in x["trace"])
                assert x["trace"][-1]["direction"]!=x["stop_direction"]
                assert 1<=x["main_general"]<=9
                assert 1<=x["assistant_general"]<=9
            else:
                assert x["count"] is None
                assert x["same_palace_as_taiyi"]
        assert c["has_complete_main_guest"]==(v["status"]=="computed")
        assert c["fortune_verdict"] is None
    assert counts["computed"]>0 and counts["partially_computed"]>0


def test_same_palace_never_fake_zero_or_whole_round_and_bad_args_rejected():
    d=trace_count(INDEX["艮"],3)
    assert d["status"]=="pending" and d["count"] is None and not d["trace"]
    with pytest.raises(ValueError):trace_count(16,3)
    with pytest.raises(ValueError):trace_count(0,5)
    with pytest.raises(ValueError):wenchang_from_accumulated(0)
    with pytest.raises(ValueError):shiji_from_wenchang(0,"xyz")


def test_api_2026_returns_partial_without_fabricated_guest():
    c=TestClient(app).post("/api/taiyi/cast",json={"gregorian_year":2026})
    assert c.status_code==200,c.text
    d=c.json()
    assert d["version"]=="V65"
    assert d["main_guest"]["main_calculated"]==16
    assert d["main_guest"]["guest_calculated"] is None
