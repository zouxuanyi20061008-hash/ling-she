"""V62 金贵人/夜贵人, 天将顺逆及天盘四课三传绑定验收。"""
from datetime import date,time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.calendar import BRANCHES,SIXTY_DAYS
from app.core.liuren import build_liuren
from app.core.liuren_v62 import (
   NOBLE_BY_STEM,GENERALS,DAY_HOURS,noble_choice,rotate_twelve_generals)

@pytest.mark.parametrize("stem,day,night",[
 ("甲","丑","未"),("乙","子","申"),("丙","亥","酉"),
 ("丁","亥","酉"),("戊","丑","未"),("己","子","申"),
 ("庚","丑","未"),("辛","午","寅"),("壬","巳","卯"),("癸","巳","卯"),
])
def test_common_classic_noble_stems_and_both_periods(stem,day,night):
    assert NOBLE_BY_STEM[stem]==(day,night)
    assert noble_choice(stem,"巳")["noble_branch"]==day
    assert noble_choice(stem,"子")["noble_branch"]==night


def test_six_hours_day_six_hours_night_and_manual_override():
    assert DAY_HOURS==set("卯辰巳午未申")
    assert {v for v in BRANCHES if v not in DAY_HOURS}==set("酉戌亥子丑寅")
    for hour in BRANCHES:
        v=noble_choice("庚",hour)
        assert v["noble_branch"]==("丑" if hour in DAY_HOURS else "未")
        assert v["is_day"]==(hour in DAY_HOURS)
    assert noble_choice("甲","子","day")["noble_branch"]=="丑"
    assert noble_choice("甲","巳","night")["noble_branch"]=="未"
    with pytest.raises(ValueError):noble_choice("甲","巳","sunrise")
    with pytest.raises(ValueError):noble_choice("X","子")


def test_independent_modern_oracle_wu_day_si_hour_noble_chou_at_yin():
    # External oracle: 戊日巳时, 贵人丑落地寅, 寅贵、卯蛇、辰雀.
    result=rotate_twelve_generals("戊申","辰","巳")
    assert result["period"]=="昼贵"
    assert result["noble_branch"]=="丑"
    assert result["noble_ground_palace"]=="寅"
    assert result["direction"]=="顺行"
    ground=result["by_earth"]
    assert [(p,ground[p]) for p in ("寅","卯","辰","巳","午","未")]==[
        ("寅","贵人"),("卯","螣蛇"),("辰","朱雀"),
        ("巳","六合"),("午","勾陈"),("未","青龙")]
    assert result["by_heaven"]["丑"]=="贵人"
    assert ground["丑"]=="天后"
    assert ground["子"]=="太阴"


def test_inverse_direction_ji_day_jia_night_noble_shen_at_you():
    # General 戌 placed on 子, 甲日子时夜贵未 => noble under 酉 (inverse).
    v=rotate_twelve_generals("甲子","戌","子")
    assert v["noble_branch"]=="未"
    assert v["noble_ground_palace"]=="酉"
    assert v["direction"]=="逆行"
    assert v["by_earth"]["酉"]=="贵人"
    assert v["by_earth"]["申"]=="螣蛇"
    assert v["by_earth"]["未"]=="朱雀"
    assert v["by_earth"]["戌"]=="天后"


def test_concrete_chronological_yin_yang_switch_without_looking_at_sunrise():
    b=build_liuren("戊申","辰","巳")
    c=build_liuren("戊申","辰","巳",noble_mode="night")
    assert b["version"]==c["version"]=="V62"
    assert b["heaven_plate"]==c["heaven_plate"]
    assert b["four_lessons"][0]["upper"]==c["four_lessons"][0]["upper"]
    assert b["heavenly_generals"]["noble_branch"]=="丑"
    assert c["heavenly_generals"]["noble_branch"]=="未"
    assert b["heavenly_generals"]["by_earth"]!=c["heavenly_generals"]["by_earth"]


def test_four_lessons_and_known_three_transmissions_have_corresponding_generals():
    b=build_liuren("丙戌","申","巳")
    sky=b["heavenly_generals"]["by_heaven"]
    ground=b["heaven_plate"]
    assert len(b["palaces"])==12
    assert all(p["heavenly_general"]==sky[p["heaven"]] for p in b["palaces"])
    assert all(p["heavenly_general"]==sky[p["upper"]] for p in b["four_lessons"])
    for t in b["three_transmissions"]["transmissions"]:
        assert ground[t["earth_palace"]]==t["branch"]
        assert t["heavenly_general"]==sky[t["branch"]]


def test_unresolved_chart_remains_pending_without_fabricated_generals():
    # Source classical ambiguous example still pending in special fanyin.
    c=build_liuren("甲子","午","子")
    assert c["three_transmissions"]["status"]=="pending"
    assert c["three_transmissions"]["transmissions"] is None
    assert c["has_twelve_heavenly_generals"]
    assert len(c["heavenly_generals"]["by_earth"])==12


def test_complete_8640_liuren_combinations_have_bijections_and_correct_alignment():
    for day in SIXTY_DAYS:
        for hour in BRANCHES:
            for month_general in BRANCHES:
                c=build_liuren(day,month_general,hour)
                general=c["heavenly_generals"]
                assert c["version"]=="V62"
                assert len(c["palaces"])==12
                assert len(c["four_lessons"])==4
                assert set(general["by_earth"].values())==set(GENERALS)
                assert len(set(general["by_heaven"].values()))==12
                assert general["by_earth"][general["noble_ground_palace"]]=="贵人"
                assert c["heaven_plate"][general["noble_ground_palace"]]==general["noble_branch"]
                if c["three_transmissions"]["status"]=="pending":
                    assert c["three_transmissions"]["transmissions"] is None
                else:
                    for t in c["three_transmissions"]["transmissions"]:
                        assert general["by_heaven"][t["branch"]]==t["heavenly_general"]


def test_existing_endpoint_default_and_manual_night_selection():
    client=TestClient(app)
    params={"solar_date":"2026-03-20","clock":"12:00","day_boundary":"zi_hour"}
    auto=client.post("/api/liuren/cast",json=params)
    assert auto.status_code==200,auto.text
    assert auto.json()["version"]=="V62"
    assert auto.json()["heavenly_generals"]["mode"]=="hour_branch"
    night=client.post("/api/liuren/cast",json={**params,"noble_mode":"night"})
    assert night.status_code==200,night.text
    assert night.json()["heavenly_generals"]["period"]=="夜贵"
    bad=client.post("/api/liuren/cast",json={**params,"noble_mode":"fake"})
    assert bad.status_code==422
