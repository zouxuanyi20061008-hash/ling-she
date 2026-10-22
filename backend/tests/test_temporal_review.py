"""V22 六爻时间条件：只按真实已知的六十甲子与用户关注爻进行历法对照。"""
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.core.liuyao import cast_six_yao
from app.core.calendar import SIXTY_DAYS, OPPOSITES


def test_no_focus_keeps_time_research_unavailable():
    chart=cast_six_yao([7]*6,"甲子","辰")
    assert chart["temporal_review"]["status"]=="focus_not_selected"
    assert chart["temporal_review"]["candidates"]==[]
    assert chart["temporal_review"]["has_timing_prediction"] is False
    assert chart["temporal_review"]["final_event_date"] is None


def test_no_day_does_not_invent_calendar_or_ganzhi():
    chart=cast_six_yao([7]*6,focus_liuqin="世爻")
    research=chart["temporal_review"]
    assert research["status"]=="day_missing"
    assert research["candidates"]==[]
    assert research["base_day_ganzhi"] is None


def test_manual_day_only_gives_relative_offsets_and_branch_rules():
    chart=cast_six_yao([7]*6,"甲子","辰","世爻",6)
    research=chart["temporal_review"]
    assert research["status"]=="relative_ganzhi_only"
    assert research["anchor_date"] is None
    assert research["selected_position"]==6
    candidate=research["candidates"][0]
    assert candidate["position"]==6
    assert candidate["events"]
    for event in candidate["events"]:
        assert event["solar_date"] is None
        assert event["day_ganzhi"]==SIXTY_DAYS[event["offset_days"]%60]
        ids={c["id"] for c in event["conditions"]}
        if "same_branch" in ids:
            assert event["day_ganzhi"][1]==candidate["branch"]
        if "clash_branch" in ids:
            assert event["day_ganzhi"][1]==OPPOSITES[candidate["branch"]]
    assert research["final_event_date"] is None


def test_provenance_anchors_days_and_preserves_23h_boundary():
    client=TestClient(app)
    request={"calendar_type":"lunar","lunar_year":2026,"lunar_month":1,"lunar_day":1,
             "is_leap_month":False,"clock":"23:30","day_boundary":"zi_hour"}
    preview=client.post("/api/liuyao/calendar-preview",json=request).json()
    response=client.post("/api/liuyao/cast",json={
        "numbers":[7]*6,"day_ganzhi":preview["day_ganzhi"],
        "month_branch":preview["month_branch"],"focus_liuqin":"世爻",
        "calendar_input":request,
    })
    assert response.status_code==200,response.text
    chart=response.json()
    data=chart["temporal_review"]
    assert data["status"]=="dated_calendar_relations"
    assert data["anchor_date"]==preview["solar_date"]
    assert data["day_boundary"]=="zi_hour"
    assert data["beijing_clock"]=="23:30"
    for item in data["candidates"]:
        for event in item["events"]:
            assert event["solar_date"]==(date.fromisoformat(preview["solar_date"])+
                                         timedelta(days=event["offset_days"])).isoformat()
            expected=SIXTY_DAYS[(SIXTY_DAYS.index(preview["day_ganzhi"])+event["offset_days"])%60]
            assert event["day_ganzhi"]==expected
    assert data["has_timing_prediction"] is False
    assert chart["review_flow"]["report"]["temporal_digest"]


def test_early_void_candidate_has_next_xun_reference_only():
    chart=cast_six_yao([7]*6,"甲子","辰","父母")
    data=chart["temporal_review"]
    assert len(data["candidates"])==2
    void_candidates=[x for x in data["candidates"] if x["originally_void"]]
    assert void_candidates
    for candidate in void_candidates:
        next_xun=[e for e in candidate["events"] if
                  any(x["id"]=="next_xun" for x in e["conditions"])]
        assert len(next_xun)==1
        assert next_xun[0]["offset_days"]==10
        assert next_xun[0]["solar_date"] is None
        assert candidate["outcome"] is None


def test_absent_focus_relative_not_substituted_with_hidden_spirit_date():
    chart=cast_six_yao([8,7,7,7,7,7],"甲子","卯","妻财")
    assert chart["temporal_review"]["status"]=="focus_not_visible"
    assert chart["temporal_review"]["candidates"]==[]


def test_boundaries_are_still_unresolved_in_report():
    chart=cast_six_yao([7]*6,"甲子","辰","世爻")
    assert chart["review_flow"]["report"]["temporal_digest"]
    assert "应期" in " ".join(chart["review_flow"]["report"]["outstanding_questions"])
    assert chart["review_flow"]["report"]["conclusion"] is None
