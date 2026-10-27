"""V52 eight spirits and hourly markers, independently checked worked chart."""
from copy import deepcopy
from datetime import date,time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.calendar import SIXTY_DAYS
from app.core.qimen import _plate,cast_qimen,TERM_JU
from app.core.qimen_rotation import rotate_qimen,OUTER_RING
from app.core.qimen_markers import decorate_qimen_v52,SPIRITS,XUN_VOID,HORSE,BRANCH_PALACE


def example(term,day,hour):
    return decorate_qimen_v52(rotate_qimen(_plate(term,day,hour)))


def test_independent_q1_public_eight_gods_void_horse_and_strikes():
    chart=example("惊蛰","辛卯","丙申")
    assert chart["spirit_plate"]["placements"]=={
        "1":"六合","2":"值符","3":"玄武","4":"九地",
        "6":"太阴","7":"腾蛇","8":"白虎","9":"九天"}
    assert chart["hour_markers"]["void_branches"]==["辰","巳"]
    assert chart["hour_markers"]["void_palaces"]==[4]
    assert chart["hour_markers"]["horse_palace"]==8
    rows={p["number"]:p for p in chart["palaces"]}
    assert rows[4]["hour_xunkong_branches_here"]==["辰","巳"]
    assert rows[8]["hour_horse"] is True
    assert rows[3]["structural_status"]["instrument_strike"] is True
    assert rows[4]["structural_status"]["instrument_strike"] is True
    assert rows[5]["actual_spirit"] is None
    assert chart["has_core_four_layers"] is True
    assert chart["fortune_conclusion"] is None


def test_yin_reverse_from_middle_borrowed_star():
    c=example("霜降","甲寅","辛未")
    assert c["spirit_plate"]["chief_star_display_palace"]==2
    assert c["spirit_plate"]["placements"]=={
        "1":"玄武","2":"值符","3":"六合","4":"太阴",
        "6":"九地","7":"九天","8":"白虎","9":"腾蛇"}
    assert c["hour_markers"]["void_branches"]==["戌","亥"]
    assert c["hour_markers"]["horse_branch"]=="巳"


def test_all_six_xun_void_and_horse_no_hallucinated_day_void():
    for i,hour in enumerate(SIXTY_DAYS):
        c=example("冬至","甲子",hour)
        m=c["hour_markers"]
        assert m["void_branches"]==list(XUN_VOID[SIXTY_DAYS[i//10*10]])
        assert m["horse_branch"]==HORSE[hour[1]]
        assert m["horse_palace"]==BRANCH_PALACE[HORSE[hour[1]]]
        assert m["void_kind"].startswith("时旬空")


def test_one_of_two_branches_void_in_separate_palaces():
    c=example("小寒","甲子","甲戌")
    by={p["number"]:p for p in c["palaces"]}
    assert c["hour_markers"]["void_palaces"]==[2,7]
    assert by[2]["palace_branches"]==["未","申"]
    assert by[2]["hour_xunkong_branches_here"]==["申"]
    assert by[7]["hour_xunkong_branches_here"]==["酉"]
    assert by[2]["horse_branch_here"]=="申"


def test_24_terms_three_yuan_eight_hours_all_eight_spirits():
    for term in TERM_JU:
        for day in ("甲子","甲寅","甲辰"):
            for hour in ("甲子","甲戌","甲申","甲午","甲辰","甲寅","丙申","癸亥"):
                c=example(term,day,hour)
                by={p["number"]:p for p in c["palaces"]}
                assert {by[i]["actual_spirit"] for i in OUTER_RING}==set(SPIRITS)
                assert by[5]["actual_spirit"] is None
                assert len(c["hour_markers"]["void_branches"])==2
                assert sum(by[i]["hour_horse"] for i in OUTER_RING)==1
                assert c["structure_review"]["fortune_verdict"] is None


def test_jia_hours_have_stars_and_gates_fuyin_not_omen():
    for hour in ("甲子","甲戌","甲申","甲午","甲辰","甲寅"):
        c=example("冬至","甲子",hour)
        assert c["structure_review"]["whole_plate"]["star_fuyin"] is True
        assert c["structure_review"]["whole_plate"]["gate_fuyin"] is True
        assert c["structure_review"]["conditions_are_outcomes"] is False


def test_gate_pressure_is_only_gate_controls_palace():
    c=example("惊蛰","辛卯","丙申")
    by={p["number"]:p for p in c["palaces"]}
    assert by[8]["structural_status"]["door_pressure"] is True
    assert by[8]["door_palace_relation"]=="门克宫（门迫条件）"
    assert by[4]["structural_status"]["door_pressure"] is False


def test_corrupt_duty_xun_and_missing_chief_star_fail_closed():
    c=rotate_qimen(_plate("惊蛰","辛卯","丙申"))
    x=deepcopy(c);x["duty_origin"]["time_xun"]="甲子"
    with pytest.raises(ValueError,match="旬首"):decorate_qimen_v52(x)
    y=deepcopy(c)
    n=y["duty_origin"]["rotated_star_display_palace"]
    next(p for p in y["palaces"] if p["number"]==n)["actual_star"]="错误"
    with pytest.raises(ValueError,match="不一致"):decorate_qimen_v52(y)


def test_api_real_clock_exposes_markers_without_conclusion():
    c=cast_qimen(date(2026,3,18),time(15,20))
    assert c["version"]=="V52"
    assert c["spirit_plate"]["placements"]["2"]=="值符"
    assert c["hour_markers"]["void_palaces"]==[4]
    r=TestClient(app).post("/api/qimen/cast",json={
        "solar_date":"2026-03-18","clock":"15:20","day_boundary":"zi_hour"})
    assert r.status_code==200,r.text
    assert r.json()["has_eight_spirits"] is True
    assert r.json()["has_final_divination"] is False
