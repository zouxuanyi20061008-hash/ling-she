"""V76 primary-source evidence scope: documented time and four-lessons, not just same rotated shape."""
from copy import deepcopy
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.calendar import BRANCHES
from app.core.liuren import build_liuren
from app.core.liuren_v76 import EXACT_WITNESS, matches_cunyan_witness, decorate_liuren_v76


def test_cunyan_classical_witness_requires_day_general_hour_and_four_lessons():
    c=build_liuren("戊辰","戌","辰",fanyin_tie_school="cunyan")
    evidence=c["historical_witness_v76"]
    assert c["witness_version"]=="V76"
    assert c["version"]=="V63" and c["audit_version"]=="V74"
    assert matches_cunyan_witness(c)
    assert tuple((p["upper"],p["lower"]) for p in c["four_lessons"])==EXACT_WITNESS
    assert c["three_transmissions"]["status"]=="computed"
    assert [p["branch"] for p in c["three_transmissions"]["transmissions"]]==[
        "巳","亥","巳"]
    assert evidence["source_evidence_level"]=="single_documented_observation"
    assert evidence["witness_matches_this_exact_plate"] is True
    assert evidence["cunyan_witness"]["hour_ganzhi"]=="丙辰"
    assert evidence["cunyan_witness"]["evidence_scope"]=="one_documented_time_and_four_lessons"
    assert all(p.get("heavenly_general") and "is_xun_void" in p
               for p in c["three_transmissions"]["transmissions"])
    assert c["fortune_verdict"] is None


def test_same_reverse_geometry_is_not_same_historical_occurrence():
    # 戊辰反吟下同形天地盘在任何时将偏移六宫均成立，
    # 但《存验》只有戌将辰时证据，不准自动扩展到子将午时。
    same_shape=build_liuren("戊辰","子","午",fanyin_tie_school="cunyan")
    verified=build_liuren("戊辰","戌","辰",fanyin_tie_school="cunyan")
    assert same_shape["heaven_plate"]==verified["heaven_plate"]
    assert same_shape["four_lessons"]==verified["four_lessons"]
    assert matches_cunyan_witness(same_shape) is False
    assert same_shape["three_transmissions"]["status"]=="pending"
    assert same_shape["three_transmissions"]["transmissions"] is None
    assert same_shape["fanyin_shehai_v75"]["selected_initial"] is None
    assert "cunyan" not in same_shape["fanyin_shehai_v75"]["historical_alternatives"]
    assert same_shape["historical_witness_v76"]["source_evidence_level"]=="not_selected_or_outside_source_scope"
    assert "时将不吻合" in same_shape["fanyin_shehai_v75"]["reason_pending"]
    assert same_shape["has_three_transmissions"] is False


def test_cunyan_source_may_be_present_as_alternative_without_auto_selecting():
    c=build_liuren("戊辰","戌","辰")
    assert c["three_transmissions"]["status"]=="pending"
    assert c["historical_witness_v76"]["witness_matches_this_exact_plate"]
    assert set(c["fanyin_shehai_v75"]["historical_alternatives"])=={
        "tanyuan","cunyan"}
    assert c["historical_witness_v76"]["requested_school"]=="pending"


@pytest.mark.parametrize("day",["戊辰","戊戌"])
def test_tanyuan_is_expressly_two_day_rule_not_single_observation(day):
    for general in BRANCHES:
        hour=BRANCHES[(BRANCHES.index(general)+6)%12]
        c=build_liuren(day,general,hour,fanyin_tie_school="tanyuan")
        assert [p["branch"] for p in c["three_transmissions"]["transmissions"]]==[
            "亥","巳","亥"]
        assert c["historical_witness_v76"]["source_evidence_level"]=="explicit_general_rule_for_two_days"
        assert c["historical_witness_v76"]["tanyuan_general_rule"]["days"]==["戊辰","戊戌"]
        assert c["fortune_verdict"] is None


def test_24_equidistant_plates_only_one_specific_observation_allowed_cunyan():
    counts={"default_pending":0,"cunyan_computed":0,"cunyan_pending":0,
            "tanyuan_computed":0}
    distinct={}
    for day in ("戊辰","戊戌"):
        for general in BRANCHES:
            hour=BRANCHES[(BRANCHES.index(general)+6)%12]
            base=build_liuren(day,general,hour)
            assert base["three_transmissions"]["status"]=="pending"
            counts["default_pending"]+=1
            report=base["fanyin_shehai_v75"]
            key=(day,tuple((p["upper"],p["lower"]) for p in base["four_lessons"]))
            distinct.setdefault(day,set()).add(key[1])
            assert report["selected_by_inclusive"]["winner"] is None
            tiny=build_liuren(day,general,hour,fanyin_tie_school="cunyan")
            if (day,general,hour)==("戊辰","戌","辰"):
                assert tiny["three_transmissions"]["status"]=="computed"
                counts["cunyan_computed"]+=1
            else:
                assert tiny["three_transmissions"]["status"]=="pending"
                assert tiny["three_transmissions"]["transmissions"] is None
                counts["cunyan_pending"]+=1
            tanyuan=build_liuren(day,general,hour,fanyin_tie_school="tanyuan")
            assert tanyuan["three_transmissions"]["status"]=="computed"
            counts["tanyuan_computed"]+=1
    assert counts=={"default_pending":24,"cunyan_computed":1,"cunyan_pending":23,
                    "tanyuan_computed":24}
    assert {day:len(pairs) for day,pairs in distinct.items()}=={"戊辰":1,"戊戌":1}


def test_v76_guards_prevent_mislabeled_witness_even_if_chart_was_tampered():
    matched=build_liuren("戊辰","戌","辰",fanyin_tie_school="cunyan")
    corrupt=deepcopy(matched)
    corrupt["hour_branch"]="午"
    with pytest.raises(ValueError,match="不能用于非"):
        decorate_liuren_v76(corrupt)
    corrupt=deepcopy(matched)
    corrupt["four_lessons"][0]["upper"]="寅"
    with pytest.raises(ValueError,match="不能用于非"):
        decorate_liuren_v76(corrupt)
    corrupt=deepcopy(matched)
    corrupt["three_transmissions"]["transmissions"][0]["branch"]="亥"
    with pytest.raises(ValueError,match="条件或三传错位"):
        decorate_liuren_v76(corrupt)


def test_v76_non_reverse_compatibility_and_api_field():
    chart=build_liuren("甲申","亥","丑")
    assert chart["historical_witness_v76"]=={
        "version":"V76","applied":False,"status":"not_a_tied_reversed_chant",
        "requested_school":"pending","real_world_verdict":None}
    resp=TestClient(app).post("/api/liuren/cast",json={
        "solar_date":"2026-03-20","clock":"12:00"})
    assert resp.status_code==200,resp.text
    data=resp.json()
    assert data["version"]=="V63" and data["audit_version"]=="V74"
    assert data["historical_witness_v76"]["version"]=="V76"
    assert data["has_full_nine_methods"] is False
