"""V68 独立定盘锚点 + 正逆安星 + 公农历/闰月输入校验。"""
import pytest
from datetime import date, time
from fastapi.testclient import TestClient
from app.main import app
from app.core.ziwei import compute_basic_ziwei, cast_ziwei, BRANCHES

def lunar_case(**updates):
    payload = dict(calendar_type="lunar", solar_date=None, lunar_year=1980,
                   lunar_month=1, lunar_day=4, is_leap_month=False,
                   clock=time(9), gender="male", leap_month_rule="same_month")
    payload.update(updates)
    return cast_ziwei(**payload)

def test_independent_1980_lunar_first_month_fourth_day_si_hour():
    # doushu.ai/star-rules: 1980 庚申, 正月初四巳时, 命宫酉, 水二局, 紫微卯。
    a = lunar_case()
    assert a["calendar"]["solar_date"] == "1980-02-19"
    assert a["year_ganzhi"] == "庚申"
    assert (a["ming_branch"], a["shen_branch"], a["ming_ganzhi"]) == ("酉","未","乙酉")
    assert a["five_element_bureau"] == {"element":"水","number":2,"label":"水二局"}
    assert (a["ziwei_branch"], a["tianfu_branch"]) == ("卯","丑")
    assert a["ziwei_trace"] == {"day":4,"bureau":2,"borrowed":0,
      "quotient":2,"borrow_direction":"不借数","result":"卯"}
    positions = a["star_positions"]
    assert positions == {
      "紫微":"卯","天机":"寅","太阳":"子","武曲":"亥","天同":"戌","廉贞":"未",
      "天府":"丑","太阴":"寅","贪狼":"卯","巨门":"辰","天相":"巳",
      "天梁":"午","七杀":"未","破军":"亥"}
    assert a["great_limit_direction"] == "顺行"
    assert next(p for p in a["palaces"] if p["branch"] == "酉")["great_limit"] == {
        "start_age":2,"end_age":11}

def test_pure_star_rule_first_day_five_bureaus_independent_rhyme():
    expected={2:"丑",3:"辰",4:"亥",5:"午",6:"酉"}
    for n, branch in expected.items():
        # Verify the initial Ziwei calculation via published 初一口诀 independently.
        from app.core.ziwei import FIVE_ELEMENT_BUREAUS
        possible = [compute_basic_ziwei(y,m,1,h)
                    for y in (1980,1984,1986) for m in range(1,13)
                    for h in range(0,24,2)]
        matches = [r for r in possible if r["five_element_bureau"]["number"]==n]
        assert matches and all(x["ziwei_branch"]==branch for x in matches)

def test_twelve_palaces_and_fourteen_stars_have_no_fabricated_filler():
    for y,m,d,h in [(2026,1,1,0),(1990,7,23,23),(1980,1,4,9)]:
        a=compute_basic_ziwei(y,m,d,h)
        assert len(a["palaces"]) == 12
        assert [p["branch"] for p in a["palaces"]] == list(BRANCHES)
        assert {p["name"] for p in a["palaces"]} == {
          "命宫","兄弟","夫妻","子女","财帛","疾厄","迁移","交友",
          "官禄","田宅","福德","父母"}
        assert sum(len(p["main_stars"]) for p in a["palaces"]) == 14
        assert len(a["star_positions"]) == 14
        for p in a["palaces"]:
            assert len(p["main_stars"]) == len(set(p["main_stars"]))
            assert p["has_main_stars"] == bool(p["main_stars"])

def test_solar_lunar_roundtrip_and_daxian_gender_only_affects_direction():
    lunar = lunar_case(gender="male")
    solar = cast_ziwei("solar",date(1980,2,19),None,None,None,False,time(9),"female")
    assert solar["star_positions"] == lunar["star_positions"]
    assert solar["calendar"]["lunar"] == lunar["calendar"]["lunar"]
    assert solar["great_limit_direction"]=="逆行"
    assert solar["palaces"][9]["great_limit"]["start_age"]==2
    unknown = lunar_case(gender="unspecified")
    assert unknown["great_limit_direction"] is None
    assert all(p["great_limit"] is None for p in unknown["palaces"])

def test_true_lunar_leap_month_variant_is_explicit_not_date_guessing():
    same=cast_ziwei("solar",date(2020,5,23),None,None,None,False,time(12),
                    "unspecified","same_month")
    next_=cast_ziwei("solar",date(2020,5,23),None,None,None,False,time(12),
                     "unspecified","next_month")
    assert same["calendar"]["lunar"] == {
      "year":2020,"month":4,"day":1,"is_leap_month":True,
      "display":"2020年闰4月1日"}
    assert same["calendar"]["birth_lunar_month_used"]==4
    assert next_["calendar"]["birth_lunar_month_used"]==5
    assert same["ming_branch"]!=next_["ming_branch"]
    assert same["calendar"]["solar_date"]==next_["calendar"]["solar_date"]
    assert any("闰月" in w for w in same["warnings"])
    rejected=TestClient(app).post("/api/ziwei/cast",json={
        "calendar_type":"lunar","lunar_year":2026,"lunar_month":1,
        "lunar_day":1,"is_leap_month":True,"clock":"12:00"})
    assert rejected.status_code==422

def test_api_ziwei_validates_and_rejects_ambiguous_inputs():
    client=TestClient(app)
    payload={"calendar_type":"solar","solar_date":"1980-02-19",
             "clock":"09:00","gender":"male"}
    ok=client.post("/api/ziwei/cast",json=payload)
    assert ok.status_code==200,ok.text
    assert ok.json()["version"]=="V68"
    assert len(ok.json()["palaces"])==12
    invalid=[
       {"lunar_month":1},{"timezone":"Asia/Tokyo"},{"is_leap_month":True},
       {"solar_date":"1900-12-31"},{"clock":"25:30"},
       {"gender":"other"},{"leap_month_rule":"guess"},
       {"solar_date":"2026-02-30"},
    ]
    for patch in invalid:
        result=client.post("/api/ziwei/cast",json={**payload,**patch})
        assert result.status_code==422,(patch,result.text)
    valid_lunar=client.post("/api/ziwei/cast",json={
      "calendar_type":"lunar","lunar_year":1980,"lunar_month":1,
      "lunar_day":4,"is_leap_month":False,"clock":"09:00"})
    assert valid_lunar.status_code==200,valid_lunar.text
    assert valid_lunar.json()["ming_branch"]=="酉"
