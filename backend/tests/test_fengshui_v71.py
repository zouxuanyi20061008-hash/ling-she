"""V71 true Lichun-boundary period and XuanKong lower three-plate regression."""
from datetime import date,time
from fastapi.testclient import TestClient
from app.main import app
from app.core.fengshui import cast_fengshui
from app.core.fengshui_v71 import determine_period, _fly, FLIGHT

# Verbatim published fixture: 8th period 子山午向 from independent chart.
EIGHT_PERIOD_ZI_WU={
    4:(7,3,4),9:(3,8,8),2:(5,1,6),
    3:(6,2,5),5:(8,4,3),7:(1,6,1),
    8:(2,7,9),1:(4,9,7),6:(9,5,2)
}

def test_v71_public_independent_8_period_zi_wu_three_layers():
    c=cast_fengshui(180,foundation_date=date(2019,6,1))
    assert c["version"]=="V71"
    assert c["axis_label"]=="坐子向午"
    assert (c["period"]["period"],c["period"]["yuan"],c["period"]["start_year"])==(8,"下元",2004)
    assert c["flying_status"]=="computed_regular_lower_chart"
    f=c["flying_stars"]
    assert f["period_trace"]["seed"]==8
    assert f["mountain_trace"]["seed"]==4
    assert (f["mountain_trace"]["home_trigram"],
            f["mountain_trace"]["home_same_yuan_mountain"],
            f["mountain_trace"]["direction"])==("巽","巽","顺飞")
    assert f["facing_trace"]["seed"]==3
    assert (f["facing_trace"]["home_trigram"],
            f["facing_trace"]["home_same_yuan_mountain"],
            f["facing_trace"]["direction"])==("震","卯","逆飞")
    assert len(f["palaces"])==9
    for p in f["palaces"]:
        assert (p["period_star"],p["mountain_star"],p["facing_star"])==EIGHT_PERIOD_ZI_WU[p["number"]]
    assert next(p for p in f["palaces"] if p["number"]==9)["facing_star"]==8
    assert next(p for p in f["palaces"] if p["number"]==1)["mountain_star"]==9
    assert c["nine_palaces"][0]["flying_stars"]=={
        "period_star":7,"mountain_star":3,"facing_star":4}

def test_period_change_uses_real_2024_lichun_clock_not_fixed_feb_four_midnight():
    before=determine_period(date(2024,2,4),time(16,0))
    after=determine_period(date(2024,2,4),time(17,0))
    assert (before["period"],after["period"])==(8,9)
    assert (before["start_year"],after["start_year"])==(2004,2024)
    assert after["yuan"]=="下元"
    assert after["star_name"]=="九紫右弼"
    assert after["effective_lichun_for_input_year"].startswith("2024-02-04T16:27:")
    assert before["effective_lichun_for_input_year"]==after["effective_lichun_for_input_year"]
    assert determine_period(date(2024,1,1),time(12))["period"]==8
    assert determine_period(date(2024,2,5),time(12))["period"]==9
    assert determine_period(date(2044,2,1),time(12))["period"]==9
    assert determine_period(date(2044,2,5),time(12))["period"]==1
    assert determine_period(date(2019,6,1),time(12))["period"]==8

def test_period5_and_seed5_borrowing_under_nine():
    c=cast_fengshui(0,foundation_date=date(2026,6,1))
    assert c["period"]["period"]==9
    assert c["flying_stars"]["mountain_trace"]["seed"]==5
    assert c["flying_stars"]["mountain_trace"]["borrowed_five"] is True
    assert c["flying_stars"]["mountain_trace"]["five_borrowed_home_star"]==9
    assert c["flying_stars"]["mountain_trace"]["home_trigram"]=="离"
    assert c["flying_stars"]["mountain_trace"]["home_same_yuan_mountain"]=="午"
    assert c["flying_stars"]["mountain_trace"]["direction"]=="逆飞"
    assert c["flying_stars"]["facing_trace"]["seed"]==4
    assert c["flying_stars"]["facing_trace"]["direction"]=="顺飞"

def test_9_palaces_every_flying_layer_is_permutation_1_to_9():
    for date_value in [date(1950,6,1),date(1988,7,1),
                       date(2019,6,1),date(2026,7,1)]:
        for bearing in range(0,360,15):
            c=cast_fengshui(bearing,foundation_date=date_value)
            f=c["flying_stars"]
            assert f is not None,(date_value,bearing)
            assert len(f["palaces"])==9
            for key in ("period_star","mountain_star","facing_star"):
                assert sorted(x[key] for x in f["palaces"])==list(range(1,10))
            assert [p["number"] for p in f["palaces"]]==[4,9,2,3,5,7,8,1,6]
            assert c["sitting"]["mountain_index"]==(c["facing"]["mountain_index"]+12)%24

def test_yearly_flying_board_consistent_with_same_period_and_azimuth():
    x=cast_fengshui(180,foundation_date=date(2019,6,1))
    y=cast_fengshui(180,foundation_date=date(2023,10,1))
    assert x["period"]["period"]==y["period"]["period"]==8
    assert x["flying_stars"]==y["flying_stars"]
    z=cast_fengshui(180,foundation_date=date(2026,6,1))
    assert x["flying_stars"]!=z["flying_stars"]
    assert z["period"]["period"]==9

def test_outside_regular_lower_angles_block_without_inventing_replacement_plate():
    near=cast_fengshui(187.5,foundation_date=date(2026,6,1))
    assert near["version"]=="V71"
    assert near["near_boundary"]
    assert near["flying_stars"] is None
    assert near["flying_status"]=="blocked_mountain_boundary"
    shifted=cast_fengshui(185,foundation_date=date(2026,6,1))
    assert not shifted["near_boundary"]
    assert shifted["flying_stars"] is None
    assert shifted["flying_status"]=="blocked_replacement_chart_uncertain"
    assert any("替卦" in w for w in shifted["warnings"])
    within=cast_fengshui(184.5,foundation_date=date(2026,6,1))
    assert within["flying_status"]=="computed_regular_lower_chart"
    static=cast_fengshui(180)
    assert static["version"]=="V70" and "flying_stars" not in static

def test_v71_api_calendar_validation_and_old_v70_compatibility():
    client=TestClient(app)
    body={"bearing_degrees":180,"foundation_date":"2019-06-01","foundation_clock":"12:00"}
    good=client.post("/api/fengshui/cast",json=body)
    assert good.status_code==200,good.text
    assert good.json()["version"]=="V71"
    assert good.json()["flying_stars"]["palaces"][1]["mountain_star"]==8
    assert client.post("/api/fengshui/cast",json={"bearing_degrees":180}).json()["version"]=="V70"
    invalid=[
     {"foundation_date":"1900-01-01"},
     {"foundation_date":"2100-01-01"},
     {"foundation_date":"2026-02-30"},
     {"foundation_clock":"25:00"},
     {"foundation_clock":"12:00+09:00"},
    ]
    for patch in invalid:
        res=client.post("/api/fengshui/cast",json={**body,**patch})
        assert res.status_code==422,(patch,res.text)
    assert client.post("/api/fengshui/cast",json={
      **body,"north_reference":"magnetic_north"}).status_code==422
