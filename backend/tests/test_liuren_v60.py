"""V60 fixed source 2/3/4 lesson special-case truth plus exhaustive safety."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.liuren import build_liuren
from app.core.calendar import BRANCHES,SIXTY_DAYS

@pytest.mark.parametrize("day,gen,hour,count,method,triple",[
 ("戊申","辰","卯",4,"昴星",("戌","酉","午")),
 ("丁丑","丑","辰",4,"昴星",("子","辰","戌")),
 ("丙辰","辰","卯",3,"别责",("亥","午","午")),
 ("辛酉","亥","子",3,"别责",("丑","酉","酉")),
 ("甲寅","丑","辰",2,"八专",("丑","亥","亥")),
 ("丁未","辰","丑",2,"八专",("亥","戌","戌")),
 ("己未","酉","未",2,"八专",("酉","酉","酉")),
 ("庚申","亥","申",2,"八专",("丑","亥","亥")),
])
def test_classic_ancient_transmissions_exact(day,gen,hour,count,method,triple):
    c=build_liuren(day,gen,hour)
    t=c["three_transmissions"]
    assert c["version"]=="V61"
    assert t["status"]=="computed",(day,gen,hour,t)
    assert t["method"].startswith(method)
    assert c["transmission_review"]["distinct_lesson_audit"]["distinct_lesson_count"]==count
    assert tuple(p["branch"] for p in t["transmissions"])==triple
    assert t["fortune_verdict"] is None


def test_three_lesson_yin_bieze_direct_trine_and_two_lesson_bazhuan_priority():
    v=build_liuren("辛酉","亥","子")
    t=v["three_transmissions"]
    assert t["rule_audit"]["selection"]["three_harmony_next_branch"]=="丑"
    assert t["rule_audit"]["selection"]["take_direct_branch_not_upper_of_branch"]
    eight=build_liuren("甲寅","丑","辰")["three_transmissions"]
    assert eight["method"].startswith("八专")
    assert eight["rule_audit"]["count_including_origin"]==3
    assert eight["rule_audit"]["counting_start"]=="亥"


def test_shehai_candidates_ground_palace_actual_not_candidate_itself():
    c=build_liuren("甲申","亥","丑")
    t=c["three_transmissions"]
    assert t["status"]=="computed"
    assert [v["branch"] for v in t["transmissions"]]==["午","辰","寅"]
    details=t["rule_audit"]["candidate_details"]
    assert {p["upper"] for p in details}=={"戌","午"}
    for item in details:
        assert c["heaven_plate"][item["actual_ground_palace"]]==item["upper"]
        assert item["candidate_branch_class"]==item["actual_ground_class"]
        assert item["depth_verified"] is True
    assert t["rule_audit"]["automatically_selected"] is True
    assert c["transmission_review"]["shehai_depths_verified"] is True


def test_older_three_transmission_anchors_remain_unchanged():
    c=build_liuren("丙戌","申","巳")
    assert [x["branch"] for x in c["three_transmissions"]["transmissions"]]==["申","亥","寅"]
    c=build_liuren("甲子","亥","子")
    assert [x["branch"] for x in c["three_transmissions"]["transmissions"]]==["子","亥","戌"]


def test_all_8640_disc_combinations_and_unknown_transmission_safety():
    methods={"昴星":0,"别责":0,"八专":0,"pending":0}
    for day in SIXTY_DAYS:
        for hour in BRANCHES:
            for general in BRANCHES:
                c=build_liuren(day,general,hour)
                v=c["three_transmissions"]
                n=c["transmission_review"]["distinct_lesson_audit"]["distinct_lesson_count"]
                assert 1<=n<=4
                assert len(c["four_lessons"])==4
                if v["status"]=="pending":
                    assert v["transmissions"] is None
                    methods["pending"]+=1
                else:
                    assert len(v["transmissions"])==3
                    assert all(p["branch"] in BRANCHES for p in v["transmissions"])
                    for k in ("昴星","别责","八专"):
                        if v["method"].startswith(k):methods[k]+=1
                assert c["has_full_nine_methods"] is False
                assert c["fortune_verdict"] is None
    assert all(x>0 for x in methods.values()),methods


def test_v60_http_endpoint():
    r=TestClient(app).post("/api/liuren/cast",json={
        "solar_date":"2026-03-20","clock":"12:00","day_boundary":"zi_hour"})
    assert r.status_code==200,r.text
    assert r.json()["version"]=="V61"
    assert r.json()["transmission_review"]["version"]=="V61"
