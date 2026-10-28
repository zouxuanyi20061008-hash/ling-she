"""V75 反吟多克涉害：外部整课真值、不同古籍复等与 8640 安全遍历。"""
from copy import deepcopy
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.liuren import build_liuren
from app.core.liuren_v75 import decorate_liuren_v75
from app.core.calendar import SIXTY_DAYS, BRANCHES

# Manual independent ancient fixtures:
# 《太白兵备统宗宝鉴》甲子第七局/庚午第七局，均 寅申寅
# 《大六壬探原》戊辰戊戌 亥巳亥;
# 《六壬存验》戊辰实占 巳亥巳 (same calendar offset, alternative school).
@pytest.mark.parametrize("day,first,depths",[
    ("甲子","寅",{"寅":4,"午":2}),
    ("庚子","寅",{"寅":4,"午":2}),
    ("甲午","寅",{"寅":4,"午":2}),
    ("庚午","寅",{"寅":4,"午":2}),
])
def test_classic_reversed_chant_inclusive_depth_selects_unique(day,first,depths):
    c=build_liuren(day,"子","午")
    t=c["three_transmissions"]
    assert c["version"]=="V63" and c["audit_version"]=="V74"
    assert c["fanyin_shehai_v75"]["version"]=="V75"
    assert c["fanyin_shehai_v75"]["decision_rule"]=="unique_inclusive_depth"
    assert t["status"]=="computed" and t["selected_initial"]==first
    assert tuple(p["branch"] for p in t["transmissions"])==("寅","申","寅")
    assert {p["upper"]:p["shehai_trace"]["depth"]
            for p in c["fanyin_shehai_v75"]["candidate_details"]}==depths
    assert c["fanyin_shehai_v75"]["selected_pool"]==["寅","午"]
    assert all("heavenly_general" in p and "xun_dun_stem" in p
               for p in t["transmissions"])
    assert c["has_three_transmissions"] is True
    assert c["has_full_nine_methods"] is False
    assert c["fortune_verdict"] is None and t["fortune_verdict"] is None


@pytest.mark.parametrize("day",["戊辰","戊戌"])
def test_equidistant_reversed_chant_needs_explicit_source_school(day):
    c=build_liuren(day,"子","午")
    t=c["three_transmissions"]
    a=c["fanyin_shehai_v75"]
    assert t["status"]=="pending" and t["transmissions"] is None
    assert c["has_three_transmissions"] is False
    assert a["decision_rule"]=="unresolved_equal_depth"
    assert isinstance(a["disagreement"]["inclusive_vs_exclusive"],bool)
    assert a["selected_by_exclusive"]["status"] in (
        "unresolved_tie","unique_depth","unique_class","day_side_first")
    assert a["selected_by_inclusive"]["winner"] is None
    assert {x["upper"]:x["shehai_trace"]["depth"] for x in a["candidate_details"]}=={
        "亥":4,"巳":4}
    assert a["historical_alternatives"]["tanyuan"]["transmissions"]==["亥","巳","亥"]
    assert a["school_selection"]=="pending"
    assert c["pending_branch_review"]["status"]=="pending"
    assert c["has_full_nine_methods"] is False


@pytest.mark.parametrize("day",["戊辰","戊戌"])
def test_tanyuan_explicit_ancient_both_reverse_chant_equal_depth(day):
    c=build_liuren(day,"子","午",fanyin_tie_school="tanyuan")
    a=c["fanyin_shehai_v75"]
    assert a["decision_rule"]=="explicit_classical_school"
    assert a["selected_initial"]=="亥"
    assert tuple(x["branch"] for x in c["three_transmissions"]["transmissions"])==(
        "亥","巳","亥")
    assert a["historical_alternatives"]["tanyuan"]["source"].endswith("001%E5%8D%B7%E4%B8%8A%20%E6%8E%A8%E6%BC%94%E7%AF%87.html")
    assert c["pending_branch_review"]["status"]=="computed"
    assert c["fanyin_shehai_v75"]["ground_is_actual_lower_palace"]


def test_cunyan_only_verifies_real_wuchen_independent_example_not_wuxu():
    c=build_liuren("戊辰","戌","辰",fanyin_tie_school="cunyan")
    a=c["fanyin_shehai_v75"]
    assert a["decision_rule"]=="explicit_classical_school"
    assert a["selected_initial"]=="巳"
    assert tuple(x["branch"] for x in c["three_transmissions"]["transmissions"])==(
        "巳","亥","巳")
    assert c["three_transmissions"]["rule_audit"]["chosen_school"]=="cunyan"
    assert all("heavenly_general" in x and "xun_dun_stem" in x
               for x in c["three_transmissions"]["transmissions"])
    other=build_liuren("戊戌","戌","辰",fanyin_tie_school="cunyan")
    assert other["three_transmissions"]["status"]=="pending"
    assert other["fanyin_shehai_v75"]["reason_pending"].startswith("本日未核到")


def test_six_unresolved_day_types_have_no_hidden_first_candidate_default():
    for day in ("甲子","戊辰","庚午","甲午","戊戌","庚子"):
        c=build_liuren(day,"戌","辰")
        assert c["fanyin_shehai_v75"]["applied"]
        assert c["fanyin_shehai_v75"]["relation"] in ("上克下","下贼上")
        assert c["transmission_review"]["fanyin_shehai_depths_verified"]
        assert c["pending_branch_review"]["status"]==c["three_transmissions"]["status"]


def test_non_reverse_ancient_fuyin_and_shehai_unchanged():
    assert tuple(x["branch"] for x in build_liuren("丁卯","未","未")[
        "three_transmissions"]["transmissions"])==("卯","子","午")
    assert tuple(x["branch"] for x in build_liuren("丁卯","亥","丑")[
        "three_transmissions"]["transmissions"])==("亥","酉","未")
    assert build_liuren("丁卯","亥","丑")["fanyin_shehai_v75"]["applied"] is False
    assert tuple(x["branch"] for x in build_liuren("辛丑","亥","巳")[
        "three_transmissions"]["transmissions"])==("亥","未","辰")


def test_8640_default_only_twenty_four_pending_all_solely_real_equidistant():
    counts={}
    computed=0
    for day in SIXTY_DAYS:
        for general in BRANCHES:
            for hour in BRANCHES:
                c=build_liuren(day,general,hour)
                t=c["three_transmissions"]
                a=c["fanyin_shehai_v75"]
                assert a["version"]=="V75"
                if t["status"]=="pending":
                    counts[day]=counts.get(day,0)+1
                    assert general in BRANCHES and hour in BRANCHES
                    assert c["transmission_review"]["offset_palaces"]==6
                    assert t["transmissions"] is None and not c["has_three_transmissions"]
                    assert a["selected_by_inclusive"]["status"]=="unresolved_tie"
                    assert c["pending_branch_review"]["can_auto_select"] is False
                else:
                    computed+=1
                    assert len(t["transmissions"])==3
                    assert all(p["branch"] in BRANCHES for p in t["transmissions"])
                    assert t["fortune_verdict"] is None
                assert not c["has_full_nine_methods"]
                assert c["fortune_verdict"] is None
    assert counts=={"戊辰":12,"戊戌":12}
    assert computed==8616


def test_forged_source_or_invalid_api_school_fails_closed():
    c=build_liuren("甲子","子","午")
    original=c["fanyin_shehai_v75"]
    assert original["candidate_details"][0]["shehai_trace"]["path"]
    for mode in ("unsupported",None):
        with pytest.raises(ValueError,match="V75"):
            decorate_liuren_v75(c,mode)
    client=TestClient(app)
    payload={"solar_date":"2026-03-20","clock":"12:00"}
    for v in ("guessed","",None,7):
        bad=client.post("/api/liuren/cast",json={**payload,"fanyin_tie_school":v})
        assert bad.status_code==422,(v,bad.status_code,bad.text)
    good=client.post("/api/liuren/cast",json=payload)
    assert good.status_code==200
    assert good.json()["version"]=="V63"
    assert good.json()["fanyin_shehai_v75"]["version"]=="V75"
    for v in ("tanyuan","cunyan"):
        ok=client.post("/api/liuren/cast",json={**payload,"fanyin_tie_school":v})
        assert ok.status_code==200
        assert ok.json()["fanyin_shehai_v75"]["school_selection"]==v
