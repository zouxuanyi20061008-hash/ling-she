"""V61 independent route-by-route SheHai golden cases from 《六壬大全》."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.liuren import build_liuren
from app.core.liuren_v61 import crossing_trace
from app.core.calendar import BRANCHES,SIXTY_DAYS

# These expectations transcribed from classical text, not derived from code.
@pytest.mark.parametrize("day,general,hour,three,depths",[
 ("丁卯","亥","丑",("亥","酉","未"),{"亥":6,"丑":2}),
 ("己卯","申","戌",("亥","酉","未"),{"亥":6,"丑":2}),
 ("庚子","申","戌",("午","辰","寅"),{"午":4,"戌":2}),
 ("戊辰","卯","申",("子","未","寅"),{"子":4,"午":4}),
 ("甲申","亥","丑",("午","辰","寅"),{"午":4,"戌":2}),
])
def test_classic_shehai_exact_source_cases(day,general,hour,three,depths):
    c=build_liuren(day,general,hour)
    t=c["three_transmissions"]
    assert c["version"]=="V61"
    assert t["status"]=="computed",(day,general,hour,t)
    assert tuple(x["branch"] for x in t["transmissions"])==three
    got={x["upper"]:x["inclusive_depth"] for x in c["shehai_v61"]["candidate_depths"]}
    assert got==depths,(day,got,depths)
    assert c["shehai_v61"]["full_path_witnesses"] is True
    assert c["fortune_verdict"] is None


def test_dingmao_classical_route_differs_from_direct_zhong_before_ji():
    c=build_liuren("丁卯","亥","丑")
    v=c["shehai_v61"]
    assert v["selected_by_inclusive"]["winner"]=="亥"
    assert v["selected_by_direct_class"]["winner"]=="丑"
    assert v["variance"]["depth_vs_shortcut_disagree"]
    details=c["three_transmissions"]["rule_audit"]["candidate_details"]
    hai=next(x for x in details if x["upper"]=="亥")
    assert hai["actual_ground_palace"]=="丑"
    assert hai["shehai_trace"]["depth"]==6
    assert hai["shehai_excluding_start"]["depth"]==5
    assert hai["shehai_trace"]["path"][0]=="丑"
    assert hai["shehai_trace"]["path"][-1]=="亥"
    assert sum(p["hit_count"] for p in hai["shehai_trace"]["visited_palaces"])==6
    assert [x["symbol"] for x in hai["shehai_trace"]["hits"]]==[
        "丑","辰","戊","未","己","戌"]


def test_gengzi_classic_no_fabrication_and_stem_lodges_counted():
    c=build_liuren("庚子","申","戌")
    t=c["three_transmissions"]
    wu=next(x for x in t["rule_audit"]["candidate_details"] if x["upper"]=="午")
    assert wu["actual_ground_palace"]=="申"
    assert [v["symbol"] for v in wu["shehai_trace"]["hits"]]==[
        "申","庚","酉","辛"]
    assert wu["shehai_trace"]["depth"]==4


def test_wuchen_tie_resolved_by_class_then_day_side():
    c=build_liuren("戊辰","卯","申")
    t=c["three_transmissions"]
    assert [p["branch"] for p in t["transmissions"]]==["子","未","寅"]
    selection=c["shehai_v61"]["selected_by_inclusive"]
    assert selection["status"]=="day_side_first"
    assert selection["tie_break"]["prefer"]=="干课"


def test_compare_two_real_counting_conventions():
    full=crossing_trace("亥","丑","下贼上",include_first=True)
    skip=crossing_trace("亥","丑","下贼上",include_first=False)
    assert full["depth"]==6
    assert skip["depth"]==5
    assert full["hits"][0]["symbol"]=="丑"
    assert skip["hits"][0]["symbol"]=="辰"
    assert full["ending_ground"]==skip["ending_ground"]=="亥"
    with pytest.raises(ValueError):
        crossing_trace("亥","丑","相生")


def test_old_methods_do_not_gain_fake_shehai():
    for d,g,h in [
        ("丙戌","申","巳"),("甲子","亥","子"),("甲寅","丑","辰"),
        ("辛丑","亥","巳")]:
        c=build_liuren(d,g,h)
        assert c["shehai_v61"]["applied"] is False
        assert c["three_transmissions"]["status"]=="computed"
    assert build_liuren("甲申","亥","丑")["shehai_v61"]["candidate_count"]==2


def test_exhaustive_8640_are_safe_and_all_legal():
    status={}
    for day in SIXTY_DAYS:
        for hour in BRANCHES:
            for month_general in BRANCHES:
                c=build_liuren(day,month_general,hour)
                t=c["three_transmissions"]
                status[t["status"]]=status.get(t["status"],0)+1
                if t["status"]=="pending":
                    assert t["transmissions"] is None
                else:
                    assert len(t["transmissions"])==3
                    assert all(x["branch"] in BRANCHES for x in t["transmissions"])
                assert c["has_full_nine_methods"] is False
    assert status.get("computed",0)>0


def test_v61_api_still_serves_valid_dated_calendar():
    c=TestClient(app).post("/api/liuren/cast",json={
        "solar_date":"2026-03-20","clock":"12:00","day_boundary":"zi_hour"})
    assert c.status_code==200,c.text
    assert c.json()["version"]=="V61"
