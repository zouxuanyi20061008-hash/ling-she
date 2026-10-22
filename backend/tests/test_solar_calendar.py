"""中国北京时间的公历/农历互转及节令交界回归测试。"""
from datetime import date,time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.solar_calendar import preview_solar_calendar,preview_lunar_calendar
from app.core.calendar import SIXTY_DAYS


def preview(d="2026-02-04",clock="12:00",boundary="midnight"):
    return preview_solar_calendar(date.fromisoformat(d),time.fromisoformat(clock),
                                  day_boundary=boundary)


def lunar(y=2026,m=1,d=1,leap=False,clock="12:00",boundary="midnight"):
    return preview_lunar_calendar(y,m,d,leap,time.fromisoformat(clock),boundary)


def test_all_results_use_beijing_time_and_include_both_calendars():
    p=preview("2026-10-22")
    assert p["input"]["timezone"]=="Asia/Shanghai"
    assert p["beijing_time"].endswith("+08:00")
    assert p["calendar_type"]=="solar"
    assert p["solar_date"]=="2026-10-22"
    assert p["lunar"]["month"] in range(1,13)
    assert p["month_branch"]=="戌"
    assert p["month_ganzhi"].endswith("戌")
    assert p["previous_jie"]["name"]=="寒露"
    assert p["next_jie"]["name"]=="立冬"
    assert "六爻月建按节气" in p["notice"]


def test_lunar_new_year_2026_converts_to_february_17_and_back():
    p=lunar(2026,1,1)
    assert p["solar_date"]=="2026-02-17"
    assert p["lunar"]=={
      "year":2026,"month":1,"day":1,"is_leap_month":False,"display":"2026年1月1日"}
    assert p["month_branch"]=="寅"
    back=preview("2026-02-17")
    assert back["lunar"]==p["lunar"]
    assert back["day_ganzhi"]==p["day_ganzhi"]


def test_leap_fourth_month_2020_conversion_and_ordinary_month_are_distinct():
    leap=lunar(2020,4,1,True)
    ordinary=lunar(2020,4,1,False)
    assert leap["solar_date"]=="2020-05-23"
    assert leap["lunar"]["is_leap_month"] is True
    assert leap["lunar"]["display"]=="2020年闰4月1日"
    assert ordinary["lunar"]["is_leap_month"] is False
    assert ordinary["solar_date"]!="2020-05-23"
    back=preview("2020-05-23")
    assert back["lunar"]==leap["lunar"]


def test_invalid_lunar_leap_month_or_day_is_rejected():
    with pytest.raises(ValueError,match="闰月"):
        lunar(2026,1,1,True)
    with pytest.raises(ValueError):
        lunar(2020,4,31,True)
    with pytest.raises(ValueError):
        lunar(2026,13,1)
    with pytest.raises(ValueError):
        lunar(2026,1,0)


def test_2026_lichun_month_changes_at_jie_not_lunar_new_year():
    before=preview(clock="03:30")
    after=preview(clock="04:30")
    assert before["month_branch"]=="丑"
    assert after["month_branch"]=="寅"
    assert before["lunar"]==after["lunar"]
    assert before["next_jie"]["name"]=="立春"
    assert after["previous_jie"]["name"]=="立春"
    assert before["day_ganzhi"]==after["day_ganzhi"]
    # 春节在2月17日，立春2月4日：两种「月」不能简单互换
    assert after["lunar"]["year"]==2025


def test_boundary_warning_near_2026_lichun():
    p=preview(clock="04:02")
    assert p["near_solar_term"] is True
    assert p["minutes_to_closest_jie"]<=15
    assert any("交节" in t for t in p["warnings"])


def test_zi_hour_two_day_boundaries_with_chinese_clock():
    prior=preview(clock="22:30",boundary="zi_hour")
    next_day=preview(clock="23:30",boundary="zi_hour")
    midnight=preview(clock="23:30",boundary="midnight")
    assert prior["day_ganzhi"]==midnight["day_ganzhi"]
    index=SIXTY_DAYS.index(prior["day_ganzhi"])
    assert next_day["day_ganzhi"]==SIXTY_DAYS[(index+1)%60]
    assert next_day["near_day_boundary"]
    assert any("子时" in w for w in next_day["warnings"])


def test_non_china_timezones_rejected_even_internal_compat_api():
    with pytest.raises(ValueError):
        preview_solar_calendar(date(2026,2,4),time(8),"Asia/Tokyo")
    with pytest.raises(ValueError):
        preview_solar_calendar(date(2026,2,4),time(8),"Europe/Paris")
    with pytest.raises(ValueError):
        preview_solar_calendar(date(2026,2,4),time(8),"Asia/Shanghai","not_a_rule")


def test_api_lunar_preview_does_not_change_manual_cast_until_confirmed():
    client=TestClient(app)
    r=client.post("/api/liuyao/calendar-preview",json={
        "calendar_type":"lunar","lunar_year":2026,"lunar_month":1,
        "lunar_day":1,"is_leap_month":False,"clock":"12:00","day_boundary":"midnight"})
    assert r.status_code==200
    result=r.json()
    assert result["solar_date"]=="2026-02-17"
    assert result["lunar"]["month"]==1
    raw=client.post("/api/liuyao/cast",json={"numbers":[7]*6})
    assert raw.status_code==200
    assert raw.json()["calendar"]["day"] is None
    applied=client.post("/api/liuyao/cast",json={
        "numbers":[7]*6,"day_ganzhi":result["day_ganzhi"],"month_branch":result["month_branch"]})
    assert applied.status_code==200
    assert applied.json()["calendar"]["day"]["ganzhi"]==result["day_ganzhi"]
    assert applied.json()["calendar"]["month"]["branch"]==result["month_branch"]


def test_api_bad_lunar_fields_rejected_without_guessing():
    client=TestClient(app)
    payload={"calendar_type":"lunar","lunar_year":2026,"lunar_month":1,
             "lunar_day":1,"clock":"12:00"}
    for changes in ({"is_leap_month":True},{"lunar_day":0},{"lunar_month":13},
                    {"lunar_year":2200},{"date":"2026-02-17"}):
        res=client.post("/api/liuyao/calendar-preview",json={**payload,**changes})
        assert res.status_code==422
    missing=client.post("/api/liuyao/calendar-preview",json={
        "calendar_type":"lunar","clock":"12:00"})
    assert missing.status_code==422


def test_api_solar_type_timezone_and_ambiguous_fields_rejected():
    client=TestClient(app)
    payload={"calendar_type":"solar","date":"2026-02-17","clock":"12:00"}
    ok=client.post("/api/liuyao/calendar-preview",json=payload)
    assert ok.status_code==200
    assert ok.json()["lunar"]["year"]==2026
    for changes in ({"timezone":"Asia/Tokyo"},{"lunar_month":1},
                    {"date":"2026-02-30"},{"clock":"25:00"},
                    {"day_boundary":"wrong"}):
        res=client.post("/api/liuyao/calendar-preview",json={**payload,**changes})
        assert res.status_code==422
