"""V70 罗盘独立度数锚点 + 坐向对称 + 山界校验 + API 拒错。"""
import math
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.fengshui import cast_fengshui, MOUNTAINS, TRIGRAMS

# 独立公开24山对照表： https://fengshui.tools/ja/free-luopan-calculator
# 不通过被测公式生成预期：手工逐项固定朝向中心、坐山及八卦。
ANCHORS=[
    (0,"子","午","坎",1),
    (15,"癸","丁","坎",1),
    (30,"丑","未","艮",8),
    (45,"艮","坤","艮",8),
    (60,"寅","申","艮",8),
    (75,"甲","庚","震",3),
    (90,"卯","酉","震",3),
    (105,"乙","辛","震",3),
    (120,"辰","戌","巽",4),
    (135,"巽","乾","巽",4),
    (150,"巳","亥","巽",4),
    (165,"丙","壬","离",9),
    (180,"午","子","离",9),
    (195,"丁","癸","离",9),
    (210,"未","丑","坤",2),
    (225,"坤","艮","坤",2),
    (240,"申","寅","坤",2),
    (255,"庚","甲","兑",7),
    (270,"酉","卯","兑",7),
    (285,"辛","乙","兑",7),
    (300,"戌","辰","乾",6),
    (315,"乾","巽","乾",6),
    (330,"亥","巳","乾",6),
    (345,"壬","丙","坎",1),
]

@pytest.mark.parametrize("azimuth,facing,sitting,trigram,palace",ANCHORS)
def test_all_24_independent_center_azimuths(azimuth,facing,sitting,trigram,palace):
    a=cast_fengshui(azimuth)
    assert a["version"]=="V70"
    assert a["facing"]["mountain"]==facing
    assert a["sitting"]["mountain"]==sitting
    assert a["axis_label"]==f"坐{sitting}向{facing}"
    assert (a["facing"]["trigram"],a["facing"]["palace_number"])==(trigram,palace)
    assert not a["near_boundary"]
    assert a["facing"]["distance_to_mountain_boundary_degrees"]==7.5
    assert a["sitting"]["degrees"]==(azimuth+180)%360
    assert len(a["twenty_four_mountains"])==24
    assert len(a["nine_palaces"])==9

def test_24_rings_cover_all_mountains_and_opposites_uniquely():
    ring=cast_fengshui(0)["twenty_four_mountains"]
    assert [x["mountain"] for x in ring]==list(MOUNTAINS)
    assert len(set(x["mountain"] for x in ring))==24
    for i, m in enumerate(ring):
        assert m["center_degrees"]==i*15
        assert m["opposite_mountain"]==MOUNTAINS[(i+12)%24]
        assert m["palace_number"] in (1,2,3,4,6,7,8,9)
        assert m["end_degrees"]==(m["center_degrees"]+7.5)%360
        assert m["start_degrees"]==(m["center_degrees"]-7.5)%360

def test_right_open_boundary_wrap_and_near_caution_not_fake_certainty():
    assert cast_fengshui(360)["facing"]["mountain"]=="子"
    assert cast_fengshui(359.9999)["facing"]["mountain"]=="子"
    before=cast_fengshui(7.499)
    exactly=cast_fengshui(7.5)
    after=cast_fengshui(7.501)
    assert [x["facing"]["mountain"] for x in (before,exactly,after)]==["子","癸","癸"]
    assert exactly["near_boundary"] and exactly["facing"]["distance_to_mountain_boundary_degrees"]==0
    assert all(x["near_boundary"] for x in (before,exactly,after))
    assert any("复测" in w for w in exactly["warnings"])
    assert not cast_fengshui(7.8)["near_boundary"]
    assert cast_fengshui(352.5)["facing"]["mountain"]=="子"
    assert cast_fengshui(337.5)["facing"]["mountain"]=="壬"
    assert cast_fengshui(22.5)["facing"]["mountain"]=="丑"
    assert cast_fengshui(0)["facing"]["start_degrees"]==352.5
    assert cast_fengshui(0)["facing"]["end_degrees"]==7.5

def test_sitting_facing_are_inverse_for_fixed_24_centers_and_boundaries():
    for degrees in [0,7.499,7.5,15,22.5,45,90,135,180,225,270,315,337.5,352.5,359.9]:
        face=cast_fengshui(degrees,"facing")
        sit=cast_fengshui((degrees+180)%360,"sitting")
        assert face["sitting"]==sit["sitting"]
        assert face["facing"]==sit["facing"]
        assert face["axis_label"]==sit["axis_label"]
        assert face["sitting"]["mountain_index"]==(face["facing"]["mountain_index"]+12)%24

def test_magnetic_declination_requires_user_supplied_and_sign_is_correct():
    # 东偏+5°：磁北方位350°相当于真北355°，坐175°（午山），向子。
    a=cast_fengshui(350,"facing","magnetic_north",5)
    assert a["true_bearing_degrees"]==355
    assert a["axis_label"]=="坐午向子"
    assert a["reference_status"]=="manual_declination_unverified"
    assert a["input"]["declination_convention"]=="east_positive_west_negative"
    assert any("手动" in w for w in a["warnings"])
    # 西偏-6°：磁北10°转真北4°，仍为子山。
    west=cast_fengshui(10,"facing","magnetic_north",-6)
    assert west["facing"]["degrees"]==4
    assert west["facing"]["mountain"]=="子"
    assert "自动地磁偏角查询" in west["not_implemented"]
    with pytest.raises(ValueError,match="必须提供"):
        cast_fengshui(350,"facing","magnetic_north")
    with pytest.raises(ValueError,match="不可额外"):
        cast_fengshui(350,"facing","true_north",5)

def test_nine_palace_layout_is_traditional_south_up_and_no_center_mountain():
    a=cast_fengshui(90)
    p=a["nine_palaces"]
    assert [(x["number"],x["trigram"]) for x in p]==[
        (4,"巽"),(9,"离"),(2,"坤"),(3,"震"),(5,"中"),
        (7,"兑"),(8,"艮"),(1,"坎"),(6,"乾")]
    assert p[4]["is_center"] and p[4]["mountains"]==[]
    assert [x["trigram"] for x in p if x["is_facing"]]==["震"]
    assert [x["trigram"] for x in p if x["is_sitting"]]==["兑"]
    assert next(x["mountains"] for x in p if x["trigram"]=="坎")==["壬","子","癸"]

@pytest.mark.parametrize("value",[-0.0001,360.0001,math.nan,math.inf,-math.inf])
def test_illegal_angle_values_are_rejected_not_wrapped(value):
    with pytest.raises(ValueError):
        cast_fengshui(value)

def test_api_rejects_bad_scope_and_converts_verified_structure():
    client=TestClient(app)
    ok=client.post("/api/fengshui/cast",json={"bearing_degrees":90})
    assert ok.status_code==200,ok.text
    chart=ok.json()
    assert chart["version"]=="V70"
    assert (chart["axis_label"],chart["nine_palaces"][3]["is_facing"])==("坐酉向卯",True)
    assert chart["input"]["verification"]=="user_supplied_bearing_not_field_verified"
    magnetic=client.post("/api/fengshui/cast",json={
        "bearing_degrees":350,"north_reference":"magnetic_north",
        "magnetic_declination_degrees":5})
    assert magnetic.status_code==200,magnetic.text
    assert magnetic.json()["axis_label"]=="坐午向子"
    invalid=[
        {},{"bearing_degrees":-1},{"bearing_degrees":361},
        {"bearing_degrees":0,"bearing_role":"wrong"},
        {"bearing_degrees":0,"north_reference":"unknown"},
        {"bearing_degrees":0,"north_reference":"magnetic_north"},
        {"bearing_degrees":0,"magnetic_declination_degrees":1},
        {"bearing_degrees":0,"magnetic_declination_degrees":181,
         "north_reference":"magnetic_north"},
        {"bearing_degrees":"nan"},{"bearing_degrees":90,"timezone":"Asia/Tokyo"}
    ]
    for body in invalid:
        response=client.post("/api/fengshui/cast",json=body)
        assert response.status_code==422,(body,response.text)
