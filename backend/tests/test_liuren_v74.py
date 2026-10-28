"""V74 ancient special case Mao-Zi-Wu + pending transmission safety boundaries."""
from copy import deepcopy
from datetime import date,time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.liuren import build_liuren
from app.core.liuren_v74 import decorate_liuren_v74
from app.core.calendar import BRANCHES,SIXTY_DAYS

# 《大六壬课经集·伏吟课》 independently transcribed three separate examples:
# https://www.zhaosir.online/Books/BookChapterDetail.aspx?did=1650
@pytest.mark.parametrize("day",["丁卯","己卯","辛卯"])
def test_three_classical_reciprocal_punishment_fuyin_specials(day):
    c=build_liuren(day,"未","未")
    t=c["three_transmissions"]
    assert c["version"]=="V63" and c["audit_version"]=="V74"
    assert c["heaven_plate"]=={b:b for b in BRANCHES}
    assert c["transmission_review"]["offset_palaces"]==0
    assert t["status"]=="computed"
    assert tuple(x["branch"] for x in t["transmissions"])==("卯","子","午")
    assert t["rule_audit"]["reciprocal_punishment_broken_by_clash"] is True
    assert "卯子互刑杜传" in t["method"]
    assert c["pending_branch_review"]["category"]=="fuyin_reciprocal_punishment"
    assert c["pending_branch_review"]["three_transmissions"]==["卯","子","午"]
    assert c["pending_branch_review"]["source"].endswith("did=1650")
    assert [x["heavenly_general"] for x in t["transmissions"]]
    assert all("is_xun_void" in x and "xun_dun_stem" in x for x in t["transmissions"])
    assert c["has_three_transmissions"] and not c["has_full_nine_methods"]
    assert c["fortune_verdict"] is None and t["fortune_verdict"] is None

@pytest.mark.parametrize("day,triple",[
  ("丁丑",("丑","戌","未")),("壬辰",("亥","辰","戌")),
  ("丙辰",("巳","申","寅")),("癸丑",("丑","戌","未")),
  ("庚戌",("戌","未","丑"))
])
def test_general_fuyin_and_self_punishment_are_not_overwritten(day,triple):
    c=build_liuren(day,"未","未")
    t=c["three_transmissions"]
    assert t["status"]=="computed"
    assert tuple(p["branch"] for p in t["transmissions"])==triple
    assert c["pending_branch_review"]["classical_exception_applied"] is False
    assert not t["rule_audit"].get("reciprocal_punishment_broken_by_clash")
    assert c["fortune_verdict"] is None

def test_v74_guard_detects_historical_reciprocal_mistake_and_unsafe_success():
    chart=build_liuren("丁卯","未","未")
    broken=deepcopy(chart)
    broken["three_transmissions"]["transmissions"][2]["branch"]="卯"
    with pytest.raises(ValueError,match="卯子午"):
        decorate_liuren_v74(broken)
    other=deepcopy(chart)
    other["three_transmissions"]["rule_audit"]["reciprocal_punishment_broken_by_clash"]=False
    with pytest.raises(ValueError,match="卯子午"):
        decorate_liuren_v74(other)
    pending=deepcopy(chart)
    pending["three_transmissions"]["status"]="pending"
    pending["three_transmissions"]["reason"]="尚未判定"
    with pytest.raises(ValueError,match="状态不一致"):
        decorate_liuren_v74(pending)

def test_pending_branch_categories_and_no_autoselection_entire_8640_space():
    counts={}
    representative={}
    for day in SIXTY_DAYS:
        for general in BRANCHES:
            for hour in BRANCHES:
                c=build_liuren(day,general,hour)
                r=c["pending_branch_review"]
                t=c["three_transmissions"]
                assert r["status"]==t["status"]
                assert r["version"]=="V74"
                if t["status"]=="pending":
                    category=r["category"]
                    counts[category]=counts.get(category,0)+1
                    representative.setdefault(category,(day,general,hour))
                    assert t["transmissions"] is None
                    assert c["has_three_transmissions"] is False
                    assert r["can_auto_select"] is False
                    assert r["three_transmissions"] is None
                    assert r["candidate_branches"]==t["initial_candidates"]
                    assert r["next_check"] and r["source"]
                    assert r["real_world_verdict"] is None
                else:
                    assert len(t["transmissions"])==3
                    assert r["three_transmissions"]==[
                        p["branch"] for p in t["transmissions"]]
                assert not c["has_full_nine_methods"]
                assert c["fortune_verdict"] is None
    assert sum(counts.values())>0
    assert representative

def test_api_exposes_v74_audit_and_remains_compatible_with_v63_contract():
    client=TestClient(app)
    req={"solar_date":"2026-03-20","clock":"12:00","day_boundary":"zi_hour"}
    res=client.post("/api/liuren/cast",json=req)
    assert res.status_code==200,res.text
    c=res.json()
    assert c["version"]=="V63"
    assert c["audit_version"]=="V74"
    assert c["pending_branch_review"]["status"]==c["three_transmissions"]["status"]
    assert c["has_twelve_heavenly_generals"]
    assert c["has_xun_void_and_dun"]
    assert "four_lessons" in c and "heaven_plate" in c
    for patch in ({"clock":"12:00+09:00"},{"fake_field":"no"},
                  {"noble_mode":"unsupported"}):
        invalid=client.post("/api/liuren/cast",json={**req,**patch})
        assert invalid.status_code==422,(patch,invalid.text)
