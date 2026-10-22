"""自动日辰/交节月建预览：跨时区、换日规则、节气瞬间与旧式手动接口回归。"""
from datetime import date,time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.solar_calendar import preview_solar_calendar
from app.core.calendar import SIXTY_DAYS


def preview(date_string="2026-02-04",clock="12:00",timezone="Asia/Shanghai",day_boundary="midnight"):
    return preview_solar_calendar(date.fromisoformat(date_string),time.fromisoformat(clock),
                                   timezone,day_boundary)


def test_2026_lichun_changes_branch_by_instant_not_calendar_date():
    before=preview(clock="03:30")
    after=preview(clock="04:30")
    assert before["month_branch"]=="丑"
    assert after["month_branch"]=="寅"
    assert before["previous_jie"]["name"]!="立春"
    assert before["next_jie"]["name"]=="立春"
    assert after["previous_jie"]["name"]=="立春"
    assert before["day_ganzhi"]==after["day_ganzhi"]


def test_2026_lichun_beijing_japan_same_instant_has_same_month():
    china=preview(clock="04:30",timezone="Asia/Shanghai")
    japan=preview(clock="05:30",timezone="Asia/Tokyo")
    assert china["beijing_time"]==japan["beijing_time"]
    assert china["month_branch"]==japan["month_branch"]=="寅"
    assert japan["local_time"].endswith("+09:00")
    assert japan["next_jie"]["local_time"].endswith("+09:00")


def test_boundary_warning_catches_2026_lichun():
    result=preview(clock="04:02")
    assert result["near_solar_term"] is True
    assert result["minutes_to_closest_jie"]<=15
    assert any("交节" in x for x in result["warnings"])


def test_early_and_late_same_day_have_same_day_ganzhi_midnight():
    before=preview(clock="02:00")
    after=preview(clock="21:00")
    assert before["day_ganzhi"]==after["day_ganzhi"]
    assert before["day_ganzhi"] in SIXTY_DAYS


def test_zi_hour_change_at_23_while_midnight_keeps_old_day():
    earlier=preview(clock="22:30",day_boundary="zi_hour")
    late=preview(clock="23:30",day_boundary="zi_hour")
    midnight=preview(clock="23:30",day_boundary="midnight")
    assert earlier["day_ganzhi"]==midnight["day_ganzhi"]
    idx=SIXTY_DAYS.index(earlier["day_ganzhi"])
    assert late["day_ganzhi"]==SIXTY_DAYS[(idx+1)%60]
    assert late["near_day_boundary"] is True
    assert any("子时" in x for x in late["warnings"])


def test_calendar_library_returns_source_and_explicit_boundaries():
    result=preview("2026-10-22","12:00","Asia/Tokyo")
    assert result["month_branch"]=="戌"
    assert result["library"]=="lunar_python==1.4.8"
    assert result["verification"]=="calendar_library_preview"
    assert "未计算地方真太阳时" in result["notice"]
    assert result["input"]["timezone"]=="Asia/Tokyo"
    assert result["previous_jie"]["name"]=="寒露"
    assert result["next_jie"]["name"]=="立冬"


def test_neither_invalid_date_nor_timezone_silently_coerced():
    with pytest.raises(ValueError):
        preview_solar_calendar(date(2100,1,1),time(12,0))
    with pytest.raises(ValueError):
        preview_solar_calendar(date(2026,2,4),time(12,0),"Europe/Paris")
    with pytest.raises(ValueError):
        preview_solar_calendar(date(2026,2,4),time(12,0),"Asia/Shanghai","unknown")


def test_api_preview_preserves_manual_cast_until_user_applies():
    client=TestClient(app)
    payload={"date":"2026-02-04","clock":"04:30","timezone":"Asia/Shanghai","day_boundary":"midnight"}
    response=client.post("/api/liuyao/calendar-preview",json=payload)
    assert response.status_code==200
    result=response.json()
    assert result["month_branch"]=="寅"
    before=client.post("/api/liuyao/cast",json={"numbers":[7]*6})
    assert before.status_code==200
    assert before.json()["calendar"]["day"] is None
    applied=client.post("/api/liuyao/cast",json={
        "numbers":[7]*6,"day_ganzhi":result["day_ganzhi"],"month_branch":result["month_branch"]
    })
    assert applied.status_code==200
    assert applied.json()["calendar"]["day"]["ganzhi"]==result["day_ganzhi"]
    assert applied.json()["calendar"]["month"]["branch"]=="寅"


def test_api_validation_rejects_wrong_dates_and_timezones():
    client=TestClient(app)
    base={"date":"2026-02-04","clock":"08:00","timezone":"Asia/Tokyo","day_boundary":"midnight"}
    for changes in (
        {"date":"2026-02-30"},
        {"date":"1899-04-01"},
        {"clock":"25:00"},
        {"timezone":"America/Los_Angeles"},
        {"day_boundary":"noon"}
    ):
        response=client.post("/api/liuyao/calendar-preview",json={**base,**changes})
        assert response.status_code==422
