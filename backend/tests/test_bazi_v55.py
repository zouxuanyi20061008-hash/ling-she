"""V55 四柱真实节令计算：立春/交节/子时规则及独立八字真值集。"""
from datetime import date,time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.bazi import cast_bazi,ten_god,HIDDEN_STEMS
from app.core.calendar import SIXTY_DAYS
from app.core.qimen import hour_ganzhi


def chart(d="2026-02-04",at="04:30",boundary="midnight"):
    return cast_bazi(date.fromisoformat(d),time.fromisoformat(at),boundary)


@pytest.mark.parametrize("day,time_,expected",[
    ("1999-07-21","16:00",["己卯","辛未","甲戌","壬申"]),
    ("1960-12-17","12:00",["庚子","戊子","己卯","庚午"]),
    ("1987-08-03","02:00",["丁卯","丁未","甲申","乙丑"]),
])
def test_official_lunar_python_independent_reverse_bazi_cases(day,time_,expected):
    # 值独立转录自 lunar-python 官方 EightCharTest.py fromBaZi() 日期案例
    c=chart(day,time_)
    assert [p["ganzhi"] for p in c["pillars"]]==expected
    assert c["day_master"]==expected[2][0]
    assert c["has_final_fortune_judgement"] is False


def test_2026_lichun_switches_both_year_and_month_not_lunar_new_year():
    before=chart(at="03:30")
    after=chart(at="04:30")
    assert before["year_ganzhi"]=="乙巳"
    assert after["year_ganzhi"]=="丙午"
    assert before["month_ganzhi"]=="己丑"
    assert after["month_ganzhi"]=="庚寅"
    assert before["lunar_date"]==after["lunar_date"]
    assert after["lunar_date"]["year"]==2025
    assert before["day_ganzhi"]==after["day_ganzhi"]
    assert before["solar_term_boundary"]["next_jie"]["name"]=="立春"
    assert after["solar_term_boundary"]["previous_jie"]["name"]=="立春"


def test_2026_lichun_near_boundary_warning_is_preserved():
    c=chart(at="04:02")
    assert c["solar_term_boundary"]["near_solar_term"]
    assert any("交节" in w for w in c["warnings"])


def test_2023_zi_hour_two_day_conventions_according_to_official_2023_fixture():
    # lunar-python fromBaZi("癸卯","甲寅","癸丑","甲子",sect=2) 含 2023-02-24 23点
    midnight=chart("2023-02-24","23:00","midnight")
    zi=chart("2023-02-24","23:00","zi_hour")
    assert [p["ganzhi"] for p in midnight["pillars"]]==[
        "癸卯","甲寅","癸丑","壬子"]
    assert [p["ganzhi"] for p in zi["pillars"]]==[
        "癸卯","甲寅","甲寅","甲子"]
    assert midnight["day_master"]=="癸" and zi["day_master"]=="甲"
    assert midnight["pillars"][3]["stem_ten_god"]=="劫财"
    assert zi["pillars"][3]["stem_ten_god"]=="比肩"
    assert any("晚子时" in s for s in zi["warnings"])


def test_22_hour_has_no_boundary_difference():
    a=chart("2023-02-24","22:30","midnight")
    b=chart("2023-02-24","22:30","zi_hour")
    assert [p["ganzhi"] for p in a["pillars"]]==[p["ganzhi"] for p in b["pillars"]]


def test_ten_gods_polarity_matches_jia_standard_all_ten():
    assert [ten_god("甲",s) for s in "甲乙丙丁戊己庚辛壬癸"]==[
        "比肩","劫财","食神","伤官","偏财","正财","七杀","正官","偏印","正印"]
    assert ten_god("癸","癸")=="比肩"
    with pytest.raises(ValueError):ten_god("甲","X")


def test_hidden_stems_and_all_four_rows_are_real():
    c=chart("1999-07-21","16:00")
    assert [p["kind"] for p in c["pillars"]]==["year","month","day","hour"]
    assert c["pillars"][2]["stem_ten_god"]=="日主"
    assert len(HIDDEN_STEMS)==12
    for p in c["pillars"]:
        assert p["ganzhi"] in SIXTY_DAYS
        assert p["stem_element"] and p["branch_element"]
        assert p["na_yin"]
        assert [x["stem"] for x in p["hidden_stems"]]==list(HIDDEN_STEMS[p["branch"]])
        assert all(x["ten_god"] for x in p["hidden_stems"])


def test_complete_60day_hours_covers_both_hour_rollover_modes():
    for day in SIXTY_DAYS:
        assert hour_ganzhi(day,0)==hour_ganzhi(day,23)
        for clock in range(24):
            assert hour_ganzhi(day,clock) in SIXTY_DAYS


def test_api_returns_true_chart_and_rejects_bogus_day_and_zone():
    client=TestClient(app)
    req={"solar_date":"2026-02-04","clock":"04:30","day_boundary":"midnight"}
    res=client.post("/api/bazi/cast",json=req)
    assert res.status_code==200,res.text
    assert res.json()["year_ganzhi"]=="丙午"
    assert len(res.json()["pillars"])==4
    for bad in [
        {"solar_date":"2026-02-30"},{"clock":"25:00"},
        {"day_boundary":"invalid"},{"clock":"04:30+09:00"},
        {"solar_date":"2101-01-01"},
    ]:
        response=client.post("/api/bazi/cast",json={**req,**bad})
        assert response.status_code==422,(bad,response.text)


def test_does_not_ask_birthday_gender_location_or_predict_from_structure():
    c=chart("1987-08-03","02:00")
    assert c["source"]["birth_location_correction_used"] is False
    assert not c["has_decade_luck_cycles"]
    assert not c["has_final_fortune_judgement"]
    assert c["fortune_conclusion"] is None
    assert "gender" not in c and "birth_place" not in c
