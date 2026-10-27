"""V57 真实流年流月十二节交界、节令年度及大运对应测试。"""
from datetime import date,time,datetime,timedelta
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.bazi import cast_bazi
from app.core.bazi_flow import compute_bazi_flow,JIE_NAMES
from app.core.calendar import MONTH_STARTS,SIXTY_DAYS


def flow(target="2026-02-04",clock="04:30",luck="none"):
    b=cast_bazi(date(1999,7,21),time(16),luck_direction=luck)
    return compute_bazi_flow(b,date.fromisoformat(target),time.fromisoformat(clock))


def test_lichun_before_and_after_exact_change_year_and_month():
    before=flow(clock="03:30")
    after=flow(clock="04:30")
    assert (before["year"]["ganzhi"],before["month"]["ganzhi"])==("乙巳","己丑")
    assert (after["year"]["ganzhi"],after["month"]["ganzhi"])==("丙午","庚寅")
    assert before["solar_year_start"]==2025
    assert after["solar_year_start"]==2026
    assert before["month"]["jie_name"]=="小寒"
    assert after["month"]["jie_name"]=="立春"
    assert before["month"]["ends_before_beijing"]==after["year"]["begins_at_beijing"]


def test_january_is_not_new_solar_year_and_december_has_previous_calendar_month_logic():
    jan=flow("2026-01-15","12:00")
    assert jan["solar_year_start"]==2025
    assert jan["year"]["ganzhi"]=="乙巳"
    assert jan["month"]["ganzhi"]=="己丑"
    assert jan["month"]["jie_name"]=="小寒"
    dec=flow("2026-12-15","12:00")
    assert dec["solar_year_start"]==2026
    assert dec["month"]["jie_name"]=="大雪"
    assert dec["month"]["branch"]=="子"


def test_every_annual_month_has_precise_12_jie_and_60_step_progression():
    c=flow()
    rows=c["months"]
    assert len(rows)==12
    assert [m["jie_name"] for m in rows]==list(JIE_NAMES[:12])
    assert [m["branch"] for m in rows]==list(MONTH_STARTS)
    assert [m["ganzhi"] for m in rows]==[SIXTY_DAYS[(SIXTY_DAYS.index("庚寅")+i)%60] for i in range(12)]
    assert sum(m["selected"] for m in rows)==1
    for a,b in zip(rows,rows[1:]):
        assert a["ends_before_beijing"]==b["begins_at_beijing"]
    assert rows[-1]["ends_before_beijing"]==c["year"]["ends_before_beijing"]
    assert c["fortune_verdict"] is None


def test_flow_belongs_to_exact_endpoints_with_next_inclusive_previous_exclusive():
    x=flow()
    jie=datetime.fromisoformat(x["months"][1]["begins_at_beijing"])
    d=jie.date()
    tm=jie.timetz().replace(tzinfo=None)
    birth=cast_bazi(date(1999,7,21),time(16))
    at=compute_bazi_flow(birth,d,tm)
    assert at["month"]["jie_name"]=="惊蛰"
    prev=jie-timedelta(seconds=1)
    earlier=compute_bazi_flow(birth,prev.date(),prev.timetz().replace(tzinfo=None))
    assert earlier["month"]["jie_name"]=="立春"


@pytest.mark.parametrize("target",["2022-11-20","2023-02-24","2026-02-04","2032-08-21"])
def test_upstream_exact_year_and_month_agree_with_independent_calendar(target):
    # Compare flow selected month to the independent birth-chart exact lunar implementation.
    chosen=date.fromisoformat(target)
    chart=cast_bazi(chosen,time(12))
    x=flow(target,"12:00")
    assert (x["year"]["ganzhi"],x["month"]["ganzhi"])==(
        chart["year_ganzhi"],chart["month_ganzhi"])


def test_luck_correspondence_between_before_and_after_start_is_time_exact():
    birth=cast_bazi(date(1999,7,21),time(16),luck_direction="forward")
    start=datetime.fromisoformat(birth["luck"]["start_at_beijing"])
    before=start-timedelta(seconds=1)
    one=compute_bazi_flow(birth,before.date(),before.timetz().replace(tzinfo=None))
    assert one["luck_at_target"]["status"]=="pre_start"
    at=compute_bazi_flow(birth,start.date(),start.timetz().replace(tzinfo=None))
    assert at["luck_at_target"]["status"]=="within_decade"
    assert at["luck_at_target"]["phase"]["order"]==1
    end=datetime.fromisoformat(birth["luck"]["luck_decades"][0]["ends_before_beijing"])
    next_period=compute_bazi_flow(birth,end.date(),end.timetz().replace(tzinfo=None))
    assert next_period["luck_at_target"]["phase"]["order"]==2


def test_no_luck_requested_and_before_birth_have_distinct_explanations():
    ordinary=flow()
    assert ordinary["luck_at_target"]["status"]=="not_requested"
    birth=cast_bazi(date(2000,3,12),time(12),luck_direction="reverse")
    old=compute_bazi_flow(birth,date(1999,3,12),time(12))
    assert old["luck_at_target"]["status"]=="before_birth"
    assert old["luck_at_target"]["phase"] is None


def test_api_opt_in_preserves_existing_v55_v56_and_adds_v57_only_when_requested():
    client=TestClient(app)
    b={"solar_date":"1999-07-21","clock":"16:00","day_boundary":"midnight"}
    old=client.post("/api/bazi/cast",json=b)
    assert old.status_code==200 and old.json()["version"]=="V55"
    v56=client.post("/api/bazi/cast",json={**b,"luck_direction":"forward"})
    assert v56.status_code==200 and v56.json()["version"]=="V56"
    req={**b,"luck_direction":"forward","flow_solar_date":"2026-02-04","flow_clock":"04:30"}
    now=client.post("/api/bazi/cast",json=req)
    assert now.status_code==200,now.text
    data=now.json()
    assert data["version"]=="V57"
    assert data["flow"]["month_count"]==12
    assert data["flow"]["month"]["ganzhi"]=="庚寅"
    assert data["flow"]["luck_at_target"]["status"]=="within_decade"
    assert not data["has_final_fortune_judgement"]
    assert client.post("/api/bazi/cast",json={**req,"flow_solar_date":"2100-01-01"}).status_code==422
    assert client.post("/api/bazi/cast",json={**req,"flow_clock":"04:30+09:00"}).status_code==422


def test_no_fabricated_fortune_from_month_or_luck_association():
    v=flow(luck="traditional_female")
    assert v["real_world_event_predicted"] is False
    assert v["fortune_verdict"] is None
    assert not any("吉凶" in x["label"] for x in [v["luck_at_target"]])
    assert all(p["stem_ten_god"] for p in v["months"])
