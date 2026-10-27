"""V53 original historical ten-stem response matrix, combined patterns and dark variants."""
from copy import deepcopy
from datetime import date,time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.qimen import _plate,cast_qimen,TERM_JU,INSTRUMENTS
from app.core.qimen_rotation import rotate_qimen,OUTER_RING
from app.core.qimen_markers import decorate_qimen_v52
from app.core.qimen_patterns import decorate_qimen_v53,lookup_ten_stem,_patterns,NAME_ROWS,COLUMNS


def case(term="惊蛰",day="辛卯",hour="丙申"):
    return decorate_qimen_v53(decorate_qimen_v52(rotate_qimen(_plate(term,day,hour))))


def test_nine_by_nine_historical_original_table_not_laundered_as_forecast():
    assert len(NAME_ROWS)==9 and len(COLUMNS)==9
    assert set(NAME_ROWS)==set(INSTRUMENTS)==set(COLUMNS)
    for sky in NAME_ROWS:
        assert len(NAME_ROWS[sky])==9
        for earth in COLUMNS:
            d=lookup_ten_stem(sky,earth)
            assert d["sky_stem"]==sky and d["earth_stem"]==earth
            assert d["title"] is None or isinstance(d["title"],str)
            assert d["actual_effect"] is None and d["fortune_verdict"] is None
    assert lookup_ten_stem("戊","丙")["title"]=="青龙返首"
    assert lookup_ten_stem("丙","戊")["title"]=="飞鸟跌穴"
    assert lookup_ten_stem("庚","丙")["title"]=="太白入荧"
    assert lookup_ten_stem("丙","庚")["title"]=="荧入太白"
    assert lookup_ten_stem("辛","乙")["title"]=="白虎猖狂"
    assert lookup_ten_stem("丁","癸")["title"]=="朱雀投江"
    assert lookup_ten_stem("庚","壬")["title"] is None
    assert lookup_ten_stem("丙","辛")["title"] is None
    with pytest.raises(ValueError):
        lookup_ten_stem("甲","乙")


def test_three_escapes_require_all_original_fields_not_just_one_stem():
    assert [x["title"] for x in _patterns("丙","丁","生门","六合")]==["天遁"]
    assert [x["title"] for x in _patterns("乙","己","开门","玄武")]==["地遁"]
    assert [x["title"] for x in _patterns("丁","壬","休门","太阴")]==["人遁"]
    assert "天遁" not in [x["title"] for x in _patterns("丙","丁","死门","六合")]
    assert "地遁" not in [x["title"] for x in _patterns("乙","己","休门","六合")]
    assert "人遁" not in [x["title"] for x in _patterns("丁","壬","休门","六合")]
    assert [x["title"] for x in _patterns("戊","丙","休门","值符")]==["青龙返首"]


def test_actual_q1_palaces_ten_stem_matches_original_fixture_independent_8_pairs():
    c=case()
    # Independent Q1 sky/earth composition from prior V51 full-disc fixture:
    source={1:("壬","丁"),2:("辛","丙"),3:("戊","乙"),
            4:("癸","戊"),6:("丁","庚"),7:("庚","辛"),
            8:("乙","壬"),9:("丙","癸")}
    rows={p["number"]:p for p in c["palaces"]}
    for pos,(sky,earth) in source.items():
        actual=rows[pos]["ten_stem_response"]
        assert (actual["sky_stem"],actual["earth_stem"])==(sky,earth)
        assert actual["title"]==lookup_ten_stem(sky,earth)["title"]
    assert rows[5]["ten_stem_response"] is None
    assert c["ten_stem_review"]["lookup_pairs"]==81
    assert c["has_complete_rotating_plate"] is False


def test_yang_hour_bing_shen_dark_fly_from_real_gate_nine():
    c=case()
    dark=c["dark_stem_plate"]
    assert dark["original_value_gate_palace"]==9
    assert dark["origin_logical_palace"]==9
    assert dark["starting_stem"]=="丙"
    # Start 丙 in 离9; +1 洛书数字飞布顺序到坎1, 坤2...
    assert dark["placements"]=={
        "1":"乙","2":"戊","3":"己","4":"庚","5":"辛",
        "6":"壬","7":"癸","8":"丁","9":"丙"}
    assert c["palaces"][4]["number"]==5
    assert c["palaces"][4]["dark_stem"]=="辛"
    assert dark["independently_verified_from_classic_example"] is False


def test_six_jia_hours_use_concealed_instrument_center_not_visible_jia():
    for hour in ("甲子","甲戌","甲申","甲午","甲辰","甲寅"):
        c=case("冬至","甲子",hour)
        d=c["dark_stem_plate"]
        assert d["origin_logical_palace"]==5
        assert d["starting_stem"]==c["duty_origin"]["concealed_stem"]
        assert set(d["placements"].values())==set(INSTRUMENTS)
        assert "甲" not in d["placements"].values()
        assert c["fortune_conclusion"] is None


def test_24_terms_three_yuan_six_xun_conditions_never_become_outcomes():
    for term in TERM_JU:
        for day in ("甲子","甲寅","甲辰"):
            for hour in ("甲子","甲戌","甲申","甲午","甲辰","甲寅","丙申","癸亥"):
                c=case(term,day,hour)
                rows={r["number"]:r for r in c["palaces"]}
                assert set(c["dark_stem_plate"]["placements"].values())==set(INSTRUMENTS)
                assert all(rows[n]["ten_stem_response"]["actual_effect"] is None for n in OUTER_RING)
                assert all(item["forecast"] is None for n in OUTER_RING for item in rows[n]["classical_patterns"])
                assert rows[5]["ten_stem_response"] is None
                assert c["has_final_divination"] is False


def test_corrupted_inputs_fail_closed_and_legacy_api_present():
    raw=decorate_qimen_v52(rotate_qimen(_plate("惊蛰","辛卯","丙申")))
    bad=deepcopy(raw);bad["palaces"][0]["sky_stem"]="甲"
    with pytest.raises(ValueError,match="缺失"):
        decorate_qimen_v53(bad)
    with pytest.raises(ValueError,match="V52"):
        decorate_qimen_v53(_plate("惊蛰","辛卯","丙申"))
    c=cast_qimen(date(2026,3,18),time(15,20))
    assert c["version"]=="V53"
    assert c["has_dark_stem_variant"] is True
    r=TestClient(app).post("/api/qimen/cast",json={
        "solar_date":"2026-03-18","clock":"15:20","day_boundary":"zi_hour"})
    assert r.status_code==200,r.text
    assert r.json()["ten_stem_review"]["lookup_pairs"]==81
