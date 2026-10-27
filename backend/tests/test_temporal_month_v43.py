"""V43：真实日期才允许逐日重算跨节气月建；静态之卦不算化支。"""
from datetime import date, time
from fastapi.testclient import TestClient
from app.main import app
from app.core.calendar import OPPOSITES
from app.core.liuyao import cast_six_yao
from app.core.moving_season import season_for_element
from app.core.solar_calendar import preview_solar_calendar


def _cast_with_date(solar="2026-02-03", clock="12:00", boundary="midnight",
                    numbers=None, focus="世爻"):
    client=TestClient(app)
    raw={"calendar_type":"solar", "date":solar, "clock":clock, "day_boundary":boundary}
    calendar=client.post("/api/liuyao/calendar-preview",json=raw)
    assert calendar.status_code==200,calendar.text
    preview=calendar.json()
    result=client.post("/api/liuyao/cast",json={
        "numbers":numbers or [7]*6, "day_ganzhi":preview["day_ganzhi"],
        "month_branch":preview["month_branch"],"focus_liuqin":focus,
        "calendar_input":raw})
    assert result.status_code==200,result.text
    return result.json()


def test_lichun_changes_month_on_real_date_and_preserves_line_context():
    chart=_cast_with_date(numbers=[7,7,7,7,7,9])
    future=chart["temporal_review"]
    assert future["monthly_context_version"]=="V43"
    assert future["condition_audit_version"]=="V42"
    assert chart["calendar"]["month"]["branch"]=="丑"
    assert future["future_month_status"]=="server_recomputed"
    assert future["future_month_transition_offsets"]==[1]
    assert future["anchor_date"]=="2026-02-03"
    assert future["has_timing_prediction"] is False
    assert future["final_event_date"] is None
    focus=future["candidates"][0]
    assert focus["has_actual_change"] is True
    assert focus["future_month_transitions"]==[1]
    event=next(x for x in focus["events"] if x["offset_days"]==1)
    assert event["solar_date"]=="2026-02-04"
    assert event["future_month"]["month_changed"] is True
    assert event["future_month"]["month_branch"]=="寅"
    assert any(x["id"]=="future_jie_month_transition" for x in event["conditions"])
    for item in focus["events"]:
        info=item["future_month"]
        if info["status"]!="server_recomputed":
            continue
        expected=preview_solar_calendar(date.fromisoformat(item["solar_date"]),time(12))
        assert info["month_branch"]==expected["month_branch"]
        original=chart["najia_lines"][focus["position"]-1]
        changed=chart["bian_najia_lines"][focus["position"]-1]
        assert info["original_season"]==season_for_element(info["month_branch"],original["element"])["grade"]
        assert info["original_month_break"]==(OPPOSITES[info["month_branch"]]==original["branch"])
        assert info["changed_season"]==season_for_element(info["month_branch"],changed["element"])["grade"]
        assert info["changed_month_break"]==(OPPOSITES[info["month_branch"]]==changed["branch"])
    assert chart["review_flow"]["report"]["temporal_month_digest"]
    assert "V43" in chart["review_flow"]["report"]["temporal_month_digest"][0]


def test_static_focus_never_inherits_transformed_month_status():
    chart=_cast_with_date()
    item=chart["temporal_review"]["candidates"][0]
    assert item["has_actual_change"] is False
    for event in item["events"]:
        monthly=event["future_month"]
        assert monthly["changed_month_break"] is None
        assert monthly["changed_same_month"] is None
        assert monthly["changed_season"] is None
    assert chart["review_flow"]["report"]["strength_conclusion"] is None


def test_manually_entered_ganzhi_has_no_future_month_even_with_month_branch():
    chart=cast_six_yao([7,7,7,7,7,9],"甲子","辰","世爻")
    result=chart["temporal_review"]
    assert result["status"]=="relative_ganzhi_only"
    assert result["future_month_status"]=="unanchored_manual"
    assert result["future_month_transition_offsets"]==[]
    assert result["candidates"][0]["future_month_status"]=="unanchored_manual"
    for event in result["candidates"][0]["events"]:
        assert event["solar_date"] is None
        assert event["future_month"]["status"]=="unanchored_manual"
        assert event["future_month"]["month_branch"] is None
        assert event["future_month"]["original_month_break"] is None
    assert "保持未知" in result["notice"]
    assert "保持未知" in chart["review_flow"]["report"]["temporal_month_digest"][0]


def test_no_focus_or_no_day_creates_no_candidate_and_no_forecast():
    unfocused=_cast_with_date(focus="世爻")
    assert unfocused["temporal_review"]["candidates"]
    no_day=cast_six_yao([7]*6,month_branch="辰",focus_liuqin="世爻")
    assert no_day["temporal_review"]["candidates"]==[]
    assert no_day["review_flow"]["report"]["temporal_month_digest"]==[]
    absent=cast_six_yao([8,7,7,7,7,7],"甲子","卯","妻财")
    assert absent["temporal_review"]["candidates"]==[]
    assert absent["temporal_review"]["final_event_date"] is None
