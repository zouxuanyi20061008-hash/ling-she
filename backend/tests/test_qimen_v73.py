"""V73 九宫完整Q1外部真值＋全层独立审计故障注入。"""
from copy import deepcopy
from datetime import date,time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.qimen import _plate, cast_qimen, TERM_JU
from app.core.qimen_rotation import rotate_qimen, OUTER_RING
from app.core.qimen_markers import decorate_qimen_v52
from app.core.qimen_patterns import decorate_qimen_v53
from app.core.qimen_wonders import decorate_qimen_v54
from app.core.qimen_integrity import audit_qimen_v73

# https://www.guyujian.cn/learn/qimen/07  Q1 表：逐项独立人工抄录
# (地盘,天盘,九星,八门,八神)，本测试不调用被测计算构造真值。
Q1={
    1:("丁","壬","天任","伤门","六合"),
    2:("丙","辛","天柱","开门","值符"),
    3:("乙","戊","天辅","景门","玄武"),
    4:("戊","癸","天英","死门","九地"),
    6:("庚","丁","天蓬","生门","太阴"),
    7:("辛","庚","天心","休门","腾蛇"),
    8:("壬","乙","天冲","杜门","白虎"),
    9:("癸","丙","天芮","惊门","九天"),
}

def _pre_audit(term="惊蛰",day="辛卯",hour="丙申"):
    return decorate_qimen_v54(decorate_qimen_v53(decorate_qimen_v52(
        rotate_qimen(_plate(term,day,hour)))))

def test_independent_q1_all_eight_palaces_earth_sky_star_gate_spirit():
    c=cast_qimen(date(2026,3,18),time(15,20))
    assert c["audit_version"]=="V73"
    assert c["core_plate_audit"]["status"]=="core_four_layers_consistent"
    assert c["ju_label"]=="阳遁4局" and c["yuan"]=="下元"
    assert c["hour_ganzhi"]=="丙申"
    assert c["duty_origin"]["rotated_star_display_palace"]==2
    assert c["duty_origin"]["rotated_door_display_palace"]==9
    assert c["hour_markers"]["void_branches"]==["辰","巳"]
    assert c["hour_markers"]["horse_palace"]==8
    for p in c["palaces"]:
        if p["number"]==5:
            assert p["earth_stem"]==p["sky_stem"]=="己"
            assert p["actual_gate"] is None and p["actual_spirit"] is None
            continue
        assert (p["earth_stem"],p["sky_stem"],p["actual_star"],
                p["actual_gate"],p["actual_spirit"])==Q1[p["number"]],p["number"]
    assert next(p for p in c["palaces"] if p["number"]==9)["attached_center_star"]=="天禽"
    assert c["core_four_layer_consistency_verified"] is True
    assert c["core_plate_audit"]["verification_count"]==33
    assert sum(a["verified_positions"] for a in c["core_plate_audit"]["core_layers"])==33
    assert c["has_complete_rotating_plate"] is False
    assert c["has_final_divination"] is False
    assert not c["core_plate_audit"]["has_full_multi_school_coverage"]


@pytest.mark.parametrize("field,number,value",[
    ("sky_stem",1,"戊"),("actual_gate",9,"生门"),
    ("actual_spirit",2,"六合"),("star_from_palace",4,1),
    ("attached_center_star",9,None),
    ("attached_center_stem",9,"丁"),
    ("hour_xunkong_branches_here",4,[]),
    ("hour_horse",8,False),
    ("sky_stem_from_palace",6,2),
])
def test_pokes_in_stars_gates_spirits_and_hour_markers_fail_closed(field,number,value):
    c=_pre_audit()
    row=next(x for x in c["palaces"] if x["number"]==number)
    row[field]=value
    with pytest.raises(ValueError,match="V73.*不一致"):
        audit_qimen_v73(c)


def test_tampering_with_origin_hour_xun_and_center_uses_no_forged_success():
    cases=[]
    original=_pre_audit()
    a=deepcopy(original);a["duty_origin"]["rotated_door_palace"]=8;cases.append(a)
    a=deepcopy(original);a["duty_origin"]["time_xun"]="甲子";cases.append(a)
    a=deepcopy(original);a["spirit_plate"]["placements"]["9"]="值符";cases.append(a)
    a=deepcopy(original);a["hour_markers"]["void_palaces"]=[];cases.append(a)
    a=deepcopy(original);next(p for p in a["palaces"] if p["number"]==5)["actual_gate"]="休门";cases.append(a)
    a=deepcopy(original);a["dark_stem_plate"]["independently_verified_from_classic_example"]=True;cases.append(a)
    for c in cases:
        with pytest.raises(ValueError,match="V73.*不一致"):
            audit_qimen_v73(c)


def test_yin_yang_24_terms_three_yuan_and_center_ancient_cases_keep_verified_core():
    # V50–V54 原典例保留；新层不得引入暗干被证实的错误结论。
    for term in TERM_JU:
        for day in ("甲子","甲寅","甲辰"):
            for hour in ("甲子","甲午","丙申","辛未","癸亥"):
                c=audit_qimen_v73(_pre_audit(term,day,hour))
                assert c["core_plate_audit"]["status"]=="core_four_layers_consistent"
                assert c["core_plate_audit"]["has_complete_core_four_layers"]
                assert c["has_complete_rotating_plate"] is False
                assert c["fortune_conclusion"] is None
    for term,day,hour in (("芒种","癸亥","丙辰"),
                          ("霜降","甲寅","辛未")):
        c=audit_qimen_v73(_pre_audit(term,day,hour))
        assert c["duty_origin"]["center_star_borrowed"] or c["duty_origin"]["center_gate_borrowed"]
        assert len(c["core_plate_audit"]["core_layers"])==4


def test_v73_http_preserves_existing_V54_wire_fields_and_validates_bad_clock():
    client=TestClient(app)
    ok=client.post("/api/qimen/cast",json={
        "solar_date":"2026-03-18","clock":"15:20","day_boundary":"zi_hour"})
    assert ok.status_code==200,ok.text
    d=ok.json()
    assert d["version"]=="V54"
    assert d["audit_version"]=="V73"
    assert d["core_plate_audit"]["checked"]["center_tianqin_housed_separately"]
    for patch in ({"clock":"15:20+09:00"},{"solar_date":"2026-02-30"},
                  {"day_boundary":"bad"},{"bogus":"silent"}):
        bad=client.post("/api/qimen/cast",json={
            "solar_date":"2026-03-18","clock":"15:20",**patch})
        assert bad.status_code==422,(patch,bad.text)
