"""V56 起大运：源库分钟起运、传统顺逆与显式手动方向。"""
from datetime import date,time,datetime
from itertools import product
import pytest
from fastapi.testclient import TestClient
from lunar_python import Solar,Lunar

from app.main import app
from app.core.bazi import cast_bazi
from app.core.bazi_yun import compute_bazi_luck,_direction,SUPPORTED
from app.core.calendar import SIXTY_DAYS,STEMS


def chart(d="1999-07-21",at="16:00",mode="traditional_female"):
    dt=date.fromisoformat(d);clock=time.fromisoformat(at)
    base=cast_bazi(dt,clock)
    return compute_bazi_luck(base,dt,clock,mode)


def test_explicit_traditional_rules_both_stem_polarities():
    assert _direction("traditional_male","甲")
    assert not _direction("traditional_female","甲")
    assert _direction("traditional_female","乙")
    assert not _direction("traditional_male","乙")
    assert _direction("forward","乙")
    assert not _direction("reverse","甲")
    for stem in STEMS:
        assert _direction("traditional_male",stem)!=_direction("traditional_female",stem)
    with pytest.raises(ValueError):_direction("none","甲")


def test_1999_yin_year_traditional_female_forward_uses_next_jie_not_qi():
    luck=chart()
    assert luck["year_stem"]=="己"
    assert luck["forward"] is True
    assert luck["direction"]=="顺排"
    assert luck["reference_jie"]["name"]=="立秋"
    assert luck["upstream_yun_sect2_verified"] is True
    assert [p["ganzhi"] for p in luck["luck_decades"][:4]]==[
        SIXTY_DAYS[(SIXTY_DAYS.index("辛未")+i)%60] for i in range(1,5)]
    assert all(p["stem_ten_god"] and p["hidden_stems"] for p in luck["luck_decades"])


def test_1999_yin_year_traditional_male_reverse_uses_prior_jie():
    luck=chart(mode="traditional_male")
    assert luck["forward"] is False
    assert luck["reference_jie"]["name"]=="小暑"
    assert luck["upstream_yun_sect2_verified"]
    assert [p["ganzhi"] for p in luck["luck_decades"][:3]]==[
        SIXTY_DAYS[(SIXTY_DAYS.index("辛未")-i)%60] for i in range(1,4)]


def test_manual_direction_does_not_need_gender_and_matches_two_traditional_sides():
    forward=chart(mode="forward")
    female=chart(mode="traditional_female")
    reverse=chart(mode="reverse")
    male=chart(mode="traditional_male")
    assert forward["start_at_beijing"]==female["start_at_beijing"]
    assert reverse["start_at_beijing"]==male["start_at_beijing"]
    assert [p["ganzhi"] for p in forward["luck_decades"]]==[
        p["ganzhi"] for p in female["luck_decades"]]
    assert forward["upstream_yun_sect2_verified"] is False
    assert reverse["upstream_yun_sect2_verified"] is False
    assert "gender" not in forward and "gender" not in reverse


@pytest.mark.parametrize("birth,clock",[
    ("1985-12-01","11:20"),("1990-05-15","10:00"),
    ("2023-02-24","23:00"),("2026-02-04","03:30"),
    ("2026-02-04","04:30"),
])
@pytest.mark.parametrize("traditional",["traditional_male","traditional_female"])
def test_source_yun_sect2_minute_start_and_decade_stems_match_all(birth,clock,traditional):
    c=chart(birth,clock,traditional)
    assert c["upstream_yun_sect2_verified"]
    assert 0<=c["start_offset"]["months"]<12
    assert 0<=c["start_offset"]["days"]<30
    assert 0<=c["start_offset"]["hours"]<24
    assert all(p["begins_at_beijing"]<p["ends_before_beijing"] for p in c["luck_decades"])
    assert c["interval_minutes"]>=0
    assert [p["order"] for p in c["luck_decades"]]==list(range(1,9))


def test_1990_yang_year_forward_next_jie_and_reverse_prev_jie():
    forward=chart("1990-05-15","10:00","traditional_male")
    reverse=chart("1990-05-15","10:00","traditional_female")
    assert forward["forward"] is True and reverse["forward"] is False
    assert forward["reference_jie"]["name"]=="芒种"
    assert reverse["reference_jie"]["name"]=="立夏"
    assert 6<=forward["start_offset"]["years"]<=8
    assert 2<=reverse["start_offset"]["years"]<=4


def test_lichun_boundary_changes_year_polarity_traditional_direction():
    before=chart("2026-02-04","03:30","traditional_male")
    after=chart("2026-02-04","04:30","traditional_male")
    assert before["year_stem"]=="乙"
    assert after["year_stem"]=="丙"
    assert not before["forward"]
    assert after["forward"]
    assert before["month_ganzhi"]=="己丑"
    assert after["month_ganzhi"]=="庚寅"


def test_count_steps_are_ten_years_and_no_real_world_forecast():
    c=chart()
    steps=c["luck_decades"]
    assert len(steps)==8
    for a,b in zip(steps,steps[1:]):
        assert a["ends_before_beijing"]==b["begins_at_beijing"]
        assert datetime.fromisoformat(a["begins_at_beijing"]).year+10==datetime.fromisoformat(b["begins_at_beijing"]).year
    assert c["real_world_fortune_verdict"] is None
    assert c["years_are_calendar_labels_not_ages"]


def test_api_does_not_infer_gender_and_can_omit_luck_mode():
    client=TestClient(app)
    base={"solar_date":"1999-07-21","clock":"16:00","day_boundary":"midnight"}
    v55=client.post("/api/bazi/cast",json=base)
    assert v55.status_code==200
    assert v55.json()["has_decade_luck_cycles"] is False
    assert "gender" not in v55.json()
    for mode in ("traditional_male","traditional_female","forward","reverse"):
        res=client.post("/api/bazi/cast",json={**base,"luck_direction":mode})
        assert res.status_code==200,res.text
        body=res.json()
        assert body["version"]=="V56"
        assert body["luck"]["mode"]==mode
        assert body["has_decade_luck_cycles"] is True
        assert len(body["luck"]["luck_decades"])==8
        assert body["has_final_fortune_judgement"] is False
    for mode in ("bad","male","auto",None):
        response=client.post("/api/bazi/cast",json={**base,"luck_direction":mode})
        assert response.status_code==422


def test_legacy_base_bazi_hour_and_pillar_unchanged_by_luck():
    source=cast_bazi(date(2023,2,24),time(23),"zi_hour")
    c=cast_bazi(date(2023,2,24),time(23),"zi_hour","forward")
    assert c["pillars"]==source["pillars"]
    assert c["day_ganzhi"]=="甲寅" and c["hour_ganzhi"]=="甲子"
    assert c["luck"]["reference_jie"]["position"]=="下一个节"
    assert c["fortune_conclusion"] is None
