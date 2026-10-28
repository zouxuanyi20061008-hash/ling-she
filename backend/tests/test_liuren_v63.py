"""V63 six day-Xun, 60-day mapping, empty across sky/earth and four lessons/three trans."""
from datetime import date,time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.calendar import BRANCHES,STEMS,SIXTY_DAYS,XUNKONG
from app.core.liuren import build_liuren
from app.core.liuren_v63 import calculate_xun_dun

@pytest.mark.parametrize("day,xun,empty,first,last",[
 ("丙寅","甲子",("戌","亥"),("子","甲"),("酉","癸")),
 ("丙子","甲戌",("申","酉"),("戌","甲"),("未","癸")),
 ("庚寅","甲申",("午","未"),("申","甲"),("巳","癸")),
 ("庚子","甲午",("辰","巳"),("午","甲"),("卯","癸")),
 ("庚戌","甲辰",("寅","卯"),("辰","甲"),("丑","癸")),
 ("庚申","甲寅",("子","丑"),("寅","甲"),("亥","癸")),
])
def test_six_xun_independently_known_table(day,xun,empty,first,last):
    d=calculate_xun_dun(day)
    assert d["xun_head"]==xun
    assert tuple(d["empty_branches"])==empty
    assert (first[0],d["by_branch"][first[0]])==first
    assert (last[0],d["by_branch"][last[0]])==last
    assert len(d["xun_days"])==10


def test_every_sixty_day_matches_its_xun_and_daily_stem():
    for i,day in enumerate(SIXTY_DAYS):
        x=calculate_xun_dun(day)
        assert x["xun_number"]==i//10+1
        assert x["by_branch"][day[1]]==day[0]
        assert tuple(x["empty_branches"])==XUNKONG[i//10]
        assert list(x["by_branch"].values()).count(None)==2
        assert set(x["by_branch"].values())==set(STEMS)|{None}
        assert len(x["xun_days"])==10


def test_classical_bingyin_hai_general_shen_hour_san_chuan_void():
    # 《大六壬探原·推演篇》 explicitly prints 丙寅日亥将申时:
    # 初申遁壬、中亥旬空、末寅遁丙.
    c=build_liuren("丙寅","亥","申")
    assert c["version"]=="V63"
    assert c["xun_void_and_dun"]["xun_head"]=="甲子"
    assert c["xun_void_and_dun"]["empty_branches"]==["戌","亥"]
    triple=c["three_transmissions"]
    assert triple["status"]=="computed"
    assert [(p["branch"],p["xun_dun_stem"],p["is_xun_void"])
            for p in triple["transmissions"]]==[
        ("申","壬",False),("亥",None,True),("寅","丙",False)]
    assert c["xun_void_and_dun"]["void_transmission_names"]==["中传"]
    assert c["has_twelve_heavenly_generals"]


def test_heaven_and_earth_void_distinct_and_attached_to_actual_sky():
    c=build_liuren("丙寅","亥","申")
    a=c["xun_void_and_dun"]
    assert len(a["heaven_void_earth_palaces"])==2
    assert set(a["earth_branch_void_palaces"])=={"戌","亥"}
    assert {x["heaven"] for x in a["heaven_void_earth_palaces"]}=={"戌","亥"}
    assert all(p["heaven_xun_dun"]==a["by_branch"][p["heaven"]] for p in c["palaces"])
    assert all(p["earth_xun_dun"]==a["by_branch"][p["earth"]] for p in c["palaces"])
    assert set(x["heavenly_general"] for x in c["palaces"])=={
        "贵人","螣蛇","朱雀","六合","勾陈","青龙","天空","白虎","太常","玄武","太阴","天后"}
    assert next(p for p in c["palaces"] if p["heavenly_general"]=="天空")["general_is_distinct_from_xun_void"]


def test_four_lesson_void_matches_upper_branch_but_lower_stem_is_not_ground_palace():
    c=build_liuren("丙寅","亥","申")
    x=c["xun_void_and_dun"]
    assert x["void_four_lesson_numbers"]==[
      lesson["number"] for lesson in c["four_lessons"] if lesson["upper"] in ("戌","亥")]
    for p in c["four_lessons"]:
        assert p["upper_xun_dun"]==x["by_branch"][p["upper"]]
        assert p["upper_is_void"]==(p["upper"] in ("戌","亥"))
    assert c["four_lessons"][0]["lower"]=="丙"
    assert c["four_lessons"][0]["lower_symbol_is_void"] is None
    assert "日干" in c["four_lessons"][0]["lower_void_basis"]


def test_unresolved_three_transmission_stays_none_no_fake_dun():
    # V75 甲子已得唯一涉害深度；改用戊辰复等流派未决。
    c=build_liuren("戊辰","午","子")
    assert c["three_transmissions"]["status"]=="pending"
    assert c["three_transmissions"]["transmissions"] is None
    assert c["xun_void_and_dun"]["void_transmission_names"] is None


def test_8640_all_days_hour_month_general_bijection_and_no_fabricated_transmission():
    for day in SIXTY_DAYS:
        for hour in BRANCHES:
            for general in BRANCHES:
                c=build_liuren(day,general,hour)
                assert c["version"]=="V63"
                a=c["xun_void_and_dun"]
                assert len(a["heaven_void_earth_palaces"])==2
                assert len(a["earth_branch_void_palaces"])==2
                assert a["by_branch"][day[1]]==day[0]
                assert all(p["upper_xun_dun"]==a["by_branch"][p["upper"]] for p in c["four_lessons"])
                assert all(p["heaven_xun_dun"]==a["by_branch"][p["heaven"]] for p in c["palaces"])
                t=c["three_transmissions"]
                if t["status"]=="pending":
                    assert t["transmissions"] is None
                else:
                    assert len(t["transmissions"])==3
                    assert all(p["xun_dun_stem"]==a["by_branch"][p["branch"]] for p in t["transmissions"])


def test_api_valid_and_all_previous_fields_remain():
    client=TestClient(app)
    a=client.post("/api/liuren/cast",json={
        "solar_date":"2026-03-20","clock":"12:00","day_boundary":"zi_hour"})
    assert a.status_code==200,a.text
    result=a.json()
    assert result["version"]=="V63"
    assert result["xun_void_and_dun"]["day_ganzhi"]==result["day_ganzhi"]
    assert result["has_twelve_heavenly_generals"] is True
    assert result["has_xun_void_and_dun"] is True
    assert result["has_full_nine_methods"] is False


def test_bad_ganzhi_is_rejected():
    for bad in ("甲丑","癸子","",None):
        with pytest.raises(ValueError):calculate_xun_dun(bad)
