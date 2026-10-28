"""V66 55-59 independent ancient cases, including same-palace & variant conflicts."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.taiyi import year_board,cast_taiyi
from app.core.taiyi_v66 import CASE_REFERENCES,MODES,PRIMARY

@pytest.mark.parametrize("year,ju,wen,shiji,main,guest,mg,ma,gg,ga",[
 (2026,55,"武德","和德",16,3,6,8,3,9),
 (2027,56,"太簇","太阳",15,34,5,5,4,2),
 (2028,57,"阴主","大神",10,25,1,3,5,5),
 (2029,58,"阴德","天道",12,26,2,6,6,8),
 (2030,59,"阴德","武德",12,19,2,6,9,7),
])
def test_five_consecutive_original_ancient_full_plates(
   year,ju,wen,shiji,main,guest,mg,ma,gg,ga):
    c=year_board(year)
    v=c["main_guest"]
    assert c["version"]=="V67"
    assert c["year"]["ju"]==ju
    assert c["historical_case_audit"]["status"]=="verified_original_text"
    assert c["historical_case_audit"]["ju"]==ju
    assert v["status"]=="computed"
    assert v["heaven_eye_wenchang"]["god"]==wen
    assert v["earth_eye_shiji"]["god"]==shiji
    assert (v["main_calculated"],v["guest_calculated"])==(main,guest)
    assert (v["main_general"]["main_general"],v["main_general"]["assistant_general"])==(mg,ma)
    assert (v["guest_general"]["main_general"],v["guest_general"]["assistant_general"])==(gg,ga)
    for k in ("main_general","guest_general"):
        t=v[k]
        assert sum(x["added"] for x in t["trace"])==t["count"]
    assert c["has_complete_main_guest"] and not c["has_full_annual_chart"]


def test_55_direct_original_two_sources_and_same_palace_single_step():
    v=year_board(2026)
    assert v["historical_case_audit"]["sources"]==CASE_REFERENCES[55]["sources"]
    assert len(v["historical_case_audit"]["sources"])==2
    x=v["main_guest"]["guest_general"]
    assert x["special_rule_applied"]
    assert x["count"]==x["stop_palace"]==3
    assert x["trace"]==[{
        "order":1,"index":None,"direction":"艮","god":"起算目临太乙",
        "palace":3,"added":3,
        "why":"《武备志》同宫只依所在太乙宫宫数得算，止于本宫",
        "special_case":True,
    }]
    assert x["original_v65_pending"]["count"] is None
    assert x["historical_alternative"]["is_default"]
    assert "guest_general" in v["main_guest"]["special_cases_applied"]


def test_conservative_mode_preserves_v65_without_faked_counts():
    a=year_board(2026)
    b=year_board(2026,same_palace_rule="conservative")
    assert b["version"]=="V67"
    assert b["same_palace_rule"]=="conservative"
    assert b["main_guest"]["guest_calculated"] is None
    assert b["main_guest"]["status"]=="partially_computed"
    assert b["main_guest"]["guest_general"]["historical_alternative"]["calculated_count"]==3
    assert not b["main_guest"]["guest_general"]["historical_alternative"]["is_default"]
    assert b["year"]==a["year"]
    assert b["nine_palaces"][0]["number"]==a["nine_palaces"][0]["number"]
    assert b["sixteen_spirits"]==a["sixteen_spirits"]
    assert not b["has_complete_main_guest"]
    assert b["historical_case_audit"] is None


def test_58_scribes_disagree_12_vs_13_and_no_silent_override():
    c=year_board(2029)
    v=c["school_disagreements"]
    assert len(v)==1
    assert (v[0]["chosen_main_count"],v[0]["other_main_count"])==(12,13)
    assert v[0]["no_silent_override"]
    assert c["main_guest"]["main_calculated"]==12
    assert not c["main_guest"]["main_general"]["special_rule_applied"] if "special_rule_applied" in c["main_guest"]["main_general"] else True


def test_ancient_1561_1624_unmodified_after_special():
    for year,main,guest in ((1561,16,30),(1624,18,19)):
        c=year_board(year,historical=True)
        assert (c["main_guest"]["main_calculated"],c["main_guest"]["guest_calculated"])==(main,guest)
        assert c["main_guest"]["special_cases_applied"]==[]
        assert c["main_guest"]["verified_by_independent_ancient_case"]
        assert c["fortune_verdict"] is None


def test_360_year_period_and_199_years_always_have_verified_two_calcs():
    n=0
    for year in range(1901,2100):
        d=cast_taiyi(year)
        v=d["main_guest"]
        assert d["version"]=="V67"
        assert v["status"]=="computed"
        assert v["main_calculated"]>0 and v["guest_calculated"]>0
        assert len(d["sixteen_spirits"])==16
        assert d["has_complete_main_guest"] is True
        assert d["has_full_annual_chart"] is False
        assert d["fortune_verdict"] is None
        n+=len(v["special_cases_applied"])
    assert n>0


def test_api_defaults_wubeizhi_manual_conservative_and_reject_bad_option():
    c=TestClient(app)
    default=c.post("/api/taiyi/cast",json={"gregorian_year":2026})
    assert default.status_code==200,default.text
    j=default.json()
    assert j["same_palace_rule"]=="wubeizhi"
    assert j["main_guest"]["guest_calculated"]==3
    assert j["main_guest"]["guest_general"]["source"]==PRIMARY
    conservative=c.post("/api/taiyi/cast",json={
      "gregorian_year":2026,"same_palace_rule":"conservative"})
    assert conservative.status_code==200,conservative.text
    assert conservative.json()["main_guest"]["guest_calculated"] is None
    invalid=c.post("/api/taiyi/cast",json={
      "gregorian_year":2026,"same_palace_rule":"fictional"})
    assert invalid.status_code==422
