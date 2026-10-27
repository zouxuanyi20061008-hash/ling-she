"""V59 three-transmission golden cases from classic texts, no unresolved guess."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.liuren import build_liuren
from app.core.calendar import BRANCHES,SIXTY_DAYS
from app.core.liuren_v59 import PUNISH,HORSE,THREE_PART


def case(day,general,hour):
    return build_liuren(day,general,hour)

@pytest.mark.parametrize("day,general,hour,method,wanted",[
 ("甲辰","巳","申","遥克·蒿矢",("申","巳","寅")),
 ("庚戌","辰","丑","遥克·弹射",("寅","巳","申")),
 ("壬辰","申","巳","遥克·蒿矢",("戌","丑","辰")),
 ("丙辰","未","未","伏吟·自任",("巳","申","寅")),
 ("丁丑","未","未","伏吟·自信",("丑","戌","未")),
 ("癸丑","未","未","伏吟·不虞",("丑","戌","未")),
 ("壬辰","未","未","伏吟·自任",("亥","辰","戌")),
 ("庚戌","寅","申","反吟·有克",("寅","申","寅")),
 ("辛丑","亥","巳","反吟·无亲",("亥","未","辰")),
 ("丁未","亥","巳","反吟·无亲",("巳","丑","丑")),
])
def test_independent_historical_nine_method_examples(day,general,hour,method,wanted):
    c=case(day,general,hour)
    actual=c["three_transmissions"]
    assert c["version"]=="V61"
    assert actual["status"]=="computed",(day,general,hour,actual)
    assert method in actual["method"]
    assert tuple(x["branch"] for x in actual["transmissions"])==wanted
    assert c["has_full_nine_methods"] is False
    assert actual["fortune_verdict"] is None


def test_shehai_q1_retains_classic_four_lessons_and_candidate_evidence():
    c=case("甲申","亥","丑")
    assert [(x["upper"],x["lower"]) for x in c["four_lessons"]]==[
       ("子","甲"),("戌","子"),("午","申"),("辰","午")]
    x=c["three_transmissions"]
    assert x["status"]=="computed"
    assert "涉害" in x["method"]
    assert [p["branch"] for p in x["transmissions"]]==["午","辰","寅"]
    details=x["rule_audit"]["candidate_details"]
    assert {p["upper"] for p in details}=={"戌","午"}
    assert x["rule_audit"]["automatically_selected"] is True
    assert x["rule_audit"]["depths_computed"] is True


def test_real_shehai_classic_dingmao_would_require_depth_not_shortcut():
    c=case("丁卯","亥","丑")
    v=c["three_transmissions"]
    assert v["status"]=="computed"
    assert [p["branch"] for p in v["transmissions"]]==["亥","酉","未"]
    assert {p["upper"] for p in v["rule_audit"]["candidate_details"]}=={"丑","亥"}


def test_critical_fuyin_self_punishment_middle_self_then_clash():
    c=case("壬辰","未","未")
    info=c["three_transmissions"]["rule_audit"]
    assert info["initial_self_punishment"] is True
    assert info["middle_self_punishment"] is True
    assert info["punishment_path"]==["亥","辰","戌"]
    assert PUNISH["亥"]=="亥" and PUNISH["辰"]=="辰"
    assert HORSE["丑"]=="亥"
    assert len(THREE_PART)==12


def test_was_v58_approved_examples_still_exact():
    for d,g,h,arr in [
        ("丙戌","申","巳",("申","亥","寅")),
        ("甲子","亥","子",("子","亥","戌")),
    ]:
        c=case(d,g,h)
        assert tuple(x["branch"] for x in c["three_transmissions"]["transmissions"])==arr
        assert c["transmission_review"]["method_family"]=="贼克/比用（V58 兼容）"


def test_8640_discs_dont_fabricate_or_return_illegal_triple():
    outcomes={}
    for day in SIXTY_DAYS:
        for h in BRANCHES:
            for general in BRANCHES:
                c=case(day,general,h)
                t=c["three_transmissions"]
                outcomes[t["method"].split("·")[0]]=outcomes.get(t["method"].split("·")[0],0)+1
                assert len(c["four_lessons"])==4
                assert len(c["palaces"])==12
                assert t["status"] in ("pending","computed")
                if t["status"]=="pending":
                    assert t["transmissions"] is None and not c["has_three_transmissions"]
                else:
                    assert len(t["transmissions"])==3 and c["has_three_transmissions"]
                    assert all(x["branch"] in BRANCHES for x in t["transmissions"])
                assert c["fortune_verdict"] is None
    assert any("遥克" in x for x in outcomes)
    assert any("伏吟" in x for x in outcomes)
    assert any("反吟" in x for x in outcomes)


def test_endpoint_v59_same_api_and_contains_evidence():
    r=TestClient(app).post("/api/liuren/cast",json={
        "solar_date":"2026-03-20","clock":"12:00","day_boundary":"midnight"})
    assert r.status_code==200,r.text
    c=r.json()
    assert c["version"]=="V61"
    assert c["transmission_review"]["version"]=="V61"
    assert c["has_full_nine_methods"] is False
