"""V51 九星/天盘干/八门真实转布：原典与独立外部全盘参考核验。"""
from copy import deepcopy
from datetime import date,time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.calendar import SIXTY_DAYS
from app.core.qimen import _plate,cast_qimen,TERM_JU
from app.core.qimen_rotation import rotate_qimen,OUTER_RING,EXTERNAL_STARS,EXTERNAL_DOORS


def plate(term,day,hour):
    return rotate_qimen(_plate(term,day,hour))


def test_external_q1_20260318_sky_stems_stars_and_gates_are_independent_fixtures():
    # 古语鉴：2026-03-18 15:20; 惊蛰下元阳4, 辛卯日丙申时，天柱临坤、惊门临离。
    # 参考来源：https://www.guyujian.cn/learn/qimen/07
    p=plate("惊蛰","辛卯","丙申")
    assert p["ju_label"]=="阳遁4局"
    assert p["duty_origin"]["rotated_star_palace"]==2
    assert p["duty_origin"]["rotated_door_palace"]==9
    # 每一宫三个值由外部例盘逐宫人工录入，不从此程序倒推。
    expected={
        1:("壬","天任","伤门"),
        2:("辛","天柱","开门"),
        3:("戊","天辅","景门"),
        4:("癸","天英","死门"),
        6:("丁","天蓬","生门"),
        7:("庚","天心","休门"),
        8:("乙","天冲","杜门"),
        9:("丙","天芮","惊门"),
    }
    for item in p["palaces"]:
        if item["number"] in expected:
            sky,star,gate=expected[item["number"]]
            assert (item["sky_stem"],item["actual_star"],item["actual_gate"])==(
                sky,star,gate),item["number"]
    assert next(x for x in p["palaces"] if x["number"]==9)["attached_center_star"]=="天禽"
    assert next(x for x in p["palaces"] if x["number"]==5)["sky_stem"]=="己"
    assert p["has_rotated_stars_and_gates"] is True
    assert p["has_complete_rotating_plate"] is False


def test_yuanlingjing_mangzhong_ancient_center_origin_follow_bing_in_seven():
    # 《元灵经》：阳九芒种癸亥丙辰，旬首天禽和癸加在兑宫丙上，死门到兑。
    c=plate("芒种","癸亥","丙辰")
    assert c["duty_origin"]["earth_origin_palace"]==5
    assert c["duty_origin"]["rotated_star_palace"]==7
    assert c["duty_origin"]["rotated_door_palace"]==7
    row=next(x for x in c["palaces"] if x["number"]==7)
    assert row["attached_center_star"]=="天禽"
    assert row["attached_center_stem"]=="癸"
    assert row["actual_gate"]=="死门"
    assert c["duty_origin"]["xun_hour_step"]==2


def test_yuanlingjing_shuangjiang_ancient_xin_in_center_and_sheng_at_kan():
    # 《元灵经》：阴八霜降甲寅辛未，天任原艮八加中五辛；值使生门到坎一。
    c=plate("霜降","甲寅","辛未")
    d=c["duty_origin"]
    assert d["rotated_star_palace"]==5
    assert d["rotated_star_display_palace"]==2
    assert d["rotated_door_palace"]==1
    assert d["xun_hour_step"]==7
    assert next(x for x in c["palaces"] if x["number"]==2)["actual_star"]=="天任"
    assert next(x for x in c["palaces"] if x["number"]==1)["actual_gate"]=="生门"
    assert d["sky_plate_computed"] and d["gates_rotated"]


def test_all_jia_six_xun_stem_substitution_is_explicit_and_no_errors():
    for xun in ("甲子","甲戌","甲申","甲午","甲辰","甲寅"):
        c=plate("冬至","甲子",xun)
        d=c["duty_origin"]
        assert d["hourly_jia_concealed"] is True
        assert d["time_stem_for_earth_lookup"]==d["concealed_stem"]
        assert d["rotated_star_palace"]==d["earth_origin_palace"]


def test_non_center_nine_palace_mappings_preserve_one_of_each():
    for term in TERM_JU:
        for day in ("甲子","甲寅","甲辰"):
            for hour in ("甲子","丙寅","辛未","癸亥"):
                p=plate(term,day,hour)
                rows={x["number"]:x for x in p["palaces"]}
                assert {rows[i]["actual_star"] for i in OUTER_RING}==set(EXTERNAL_STARS.values())
                assert {rows[i]["actual_gate"] for i in OUTER_RING}==set(EXTERNAL_DOORS.values())
                assert {rows[i]["sky_stem"] for i in OUTER_RING}=={
                    p["earth_plate"][str(i)] for i in OUTER_RING}
                assert sum(rows[i]["attached_center_star"]=="天禽" for i in OUTER_RING)==1
                assert rows[5]["actual_gate"] is None and rows[5]["actual_star"] is None
                assert all(rows[i]["actual_spirit"] is None for i in range(1,10))
                assert p["fortune_conclusion"] is None


def test_corrupted_earth_or_stem_source_fails_closed():
    c=_plate("惊蛰","辛卯","丙申")
    bad=deepcopy(c)
    bad["palaces"][0]["earth_stem"]="甲"
    with pytest.raises(ValueError,match="不一致"):
        rotate_qimen(bad)
    other=deepcopy(c)
    other["duty_origin"]["time_xun"]="甲子"
    with pytest.raises(ValueError,match="不一致"):
        rotate_qimen(other)
    with pytest.raises(ValueError):
        rotate_qimen({"version":"V50","palaces":[]})


def test_cast_api_has_rotated_stars_and_gates_not_spirits():
    c=cast_qimen(date(2026,3,18),time(15,20))
    assert c["version"]=="V53"
    assert c["hour_ganzhi"]=="丙申"
    assert c["ju_label"]=="阳遁4局"
    assert c["has_rotated_stars_and_gates"] is True
    assert c["has_complete_rotating_plate"] is False
    assert c["duty_origin"]["rotated_star_palace"]==2
    assert c["duty_origin"]["rotated_door_palace"]==9
    r=TestClient(app).post("/api/qimen/cast",json={
        "solar_date":"2026-03-18","clock":"15:20","day_boundary":"zi_hour"})
    assert r.status_code==200,r.text
    assert r.json()["rotation"]["stars_and_gates_verified_by_structure"] is True
    assert r.json()["palaces"][0]["actual_gate"]
