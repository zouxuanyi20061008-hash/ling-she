"""V54 independent 《遁甲演义》 and 《奇门遁甲统宗》 fixtures."""
from copy import deepcopy
from datetime import date,time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.qimen import _plate,cast_qimen,TERM_JU
from app.core.qimen_rotation import rotate_qimen,OUTER_RING
from app.core.qimen_markers import decorate_qimen_v52
from app.core.qimen_patterns import decorate_qimen_v53
from app.core.qimen_wonders import classify_wonder,decorate_qimen_v54


def chart(term="惊蛰",day="辛卯",hour="丙申"):
    return decorate_qimen_v54(decorate_qimen_v53(
        decorate_qimen_v52(rotate_qimen(_plate(term,day,hour)))))


@pytest.mark.parametrize("sky,pos,name,branch",[
    ("乙",2,"日奇","未"),("丙",6,"月奇","戌"),("丁",8,"星奇","丑")])
def test_dunjia_yanyi_three_wonders_graves_exact_independent_source(sky,pos,name,branch):
    c=classify_wonder(sky,"癸",pos,"生门","开门",6)
    assert c["burial"] is True
    assert c["burial_grave_branch"]==branch
    assert any(name in p["evidence"] for p in c["candidates"] if p["id"]=="three_wonders_burial")
    for other in OUTER_RING:
        if other!=pos:
            assert classify_wonder(sky,"癸",other,"生门","开门",6)["burial"] is False


@pytest.mark.parametrize("sky,earth,xun",[
    ("乙","己","甲戌"),("乙","辛","甲午"),
    ("丙","戊","甲子"),("丙","庚","甲申"),
    ("丁","壬","甲辰"),("丁","癸","甲寅")])
def test_qimen_tongzong_six_classic_de_shi_pairs(sky,earth,xun):
    c=classify_wonder(sky,earth,3,"杜门","开门",6)
    assert c["classical_six_jia_de_shi"] is True
    assert c["classical_six_jia_instrument"]==xun
    assert c["alternative_chief_door_overlap"] is False
    assert c["classical_and_alternative_disagree"] is True
    assert len([p for p in c["candidates"] if p["id"]=="three_wonders_de_shi_six_jia"])==1


def test_variant_not_forged_into_classic_and_strict_door_qualification():
    # Public Q1: 丙奇在离9遇值使惊门；古典六甲遁仪未配。 Two readings differ.
    c=classify_wonder("丙","癸",9,"惊门","惊门",9)
    assert c["alternative_chief_door_overlap"] is True
    assert c["strict_good_chief_door_overlap"] is False
    assert c["classical_six_jia_de_shi"] is False
    assert c["classical_and_alternative_disagree"] is True
    assert [p["id"] for p in c["candidates"]]==["three_wonders_meets_chief_door"]
    good=classify_wonder("丁","丙",3,"休门","休门",3)
    assert good["strict_good_chief_door_overlap"]
    assert len(good["candidates"])==2
    neither=classify_wonder("戊","庚",3,"休门","休门",3)
    assert not neither["alternative_chief_door_overlap"]


def test_q1_independent_full_disc_gives_no_burial_no_classic_but_one_alternative():
    c=chart()
    assert c["wonder_rule_review"]["burial_positions"]==[]
    assert c["wonder_rule_review"]["classical_six_jia_positions"]==[]
    assert c["wonder_rule_review"]["chief_door_overlap_positions"]==[9]
    assert c["wonder_rule_review"]["strict_good_chief_door_positions"]==[]
    assert c["wonder_rule_review"]["interpretation_disagreements"]==[9]
    p={v["number"]:v for v in c["palaces"]}
    assert p[9]["sky_stem"]=="丙" and p[9]["earth_stem"]=="癸"
    assert p[9]["actual_gate"]=="惊门"
    assert p[9]["wonder_rule_review"]["classical_and_alternative_disagree"] is True
    assert p[5]["wonder_rule_review"] is None
    assert c["dark_stem_plate"]["independently_verified_from_classic_example"] is False
    assert c["wonder_rule_review"]["dark_stem_used_in_patterns"] is False
    assert c["fortune_conclusion"] is None


def test_synthetic_composite_independent_pair_and_grave_can_both_be_present():
    x=classify_wonder("乙","己",2,"杜门","开门",6)
    assert x["burial"] is True and x["classical_six_jia_de_shi"] is True
    assert x["alternative_chief_door_overlap"] is False
    assert {a["id"] for a in x["candidates"]}=={
       "three_wonders_burial","three_wonders_de_shi_six_jia"}


def test_24_solar_terms_3_yuan_and_6_xuns_never_auto_predict():
    for term in TERM_JU:
        for day in ("甲子","甲寅","甲辰"):
            for hour in ("甲子","甲戌","甲申","甲午","甲辰","甲寅","丙申","癸亥"):
                c=chart(term,day,hour)
                assert c["version"]=="V54"
                assert c["wonder_rule_review"]["real_effectiveness_computed"] is False
                for p in c["palaces"]:
                    if p["number"]==5:
                        assert p["wonder_rule_review"] is None
                    else:
                        x=p["wonder_rule_review"]
                        assert x["fortune_verdict"] is None
                        assert all(q["effective"] is None for q in x["candidates"])
                assert c["has_final_divination"] is False


def test_fails_closed_on_corrupted_gate_name_or_sky_vs_ten_stem_provenance():
    original=decorate_qimen_v53(decorate_qimen_v52(
        rotate_qimen(_plate("惊蛰","辛卯","丙申"))))
    altered=deepcopy(original)
    p=next(p for p in altered["palaces"] if p["number"]==9)
    p["actual_gate"]="休门"
    with pytest.raises(ValueError,match="值使"):
        decorate_qimen_v54(altered)
    bad=deepcopy(original)
    q=next(p for p in bad["palaces"] if p["number"]==3)
    q["ten_stem_response"]["sky_stem"]="丁"
    with pytest.raises(ValueError,match="不一致"):
        decorate_qimen_v54(bad)
    with pytest.raises(ValueError,match="V53"):
        decorate_qimen_v54(_plate("惊蛰","辛卯","丙申"))


def test_beijing_cast_and_http_api():
    c=cast_qimen(date(2026,3,18),time(15,20))
    assert c["version"]=="V54"
    assert c["has_three_wonders_grave_check"]
    r=TestClient(app).post("/api/qimen/cast",json={
        "solar_date":"2026-03-18","clock":"15:20","day_boundary":"zi_hour"})
    assert r.status_code==200,r.text
    assert r.json()["wonder_rule_review"]["interpretation_disagreements"]==[9]
