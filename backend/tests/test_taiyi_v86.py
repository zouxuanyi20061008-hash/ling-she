"""V86 卷九阳遁三独立例课与阴遁纪/局/时柱互斥审查。"""
from copy import deepcopy
from datetime import date,time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.taiyi_hour_v77 import hour_basic_board
from app.core.taiyi_hour_v78 import classical_hour_ju
from app.core.taiyi_hour_v86 import (
    YANG_CASES,YIN_SOURCE,CORE_KEYS,
    audit_vol9_yang_examples,audit_vol9_yin_conflict,decorate_taiyi_v86
)

def test_three_separate_yang_ancient_cases_attested_counts_and_guest_trace():
    r=audit_vol9_yang_examples()
    assert r["version"]=="V86"
    assert r["status"]=="three_yang_source_cases_verified"
    assert len(r["cases"])==3
    assert [x["in_cycle_360"] for x in r["cases"]]==[2,8,25]
    assert [x["attested_expected"]["guest_count"] for x in r["cases"]]==[1,22,40]
    for item,source in zip(r["cases"],YANG_CASES):
        assert item["status"]=="verified_independent_hour_example"
        assert item["attested_expected"]==item["actual_on_attested_fields"]
        assert item["attested_expected"]["ju"]==source["ju"]
        assert sum(s["added"] for s in item["guest_count_trace"])==source["guest_count"]
        assert item["unattested_computed_fields_not_promoted"]
        assert not item["is_verified_modern_qiying_epoch"]
    assert r["confirmed_qiying_epoch"] is None

def test_yin_third_ji_52_ju_yimao_conflict_must_not_be_silently_repaired():
    audit=audit_vol9_yin_conflict()
    assert audit["status"]=="historical_ji_ju_hour_conflict_pending"
    assert audit["source_attested_fields"]=={k:YIN_SOURCE[k] for k in CORE_KEYS}
    assert [r["in_cycle_360"] for r in audit["hypotheses"]]==[52,124,172]
    a,b,c=audit["hypotheses"]
    assert a["mismatched_source_fields"]==["six_ji_number"]
    assert b["mismatched_source_fields"]==["hour_ganzhi_from_jiazi_start"]
    assert "ju" in c["mismatched_source_fields"]
    assert a["actual"]["six_ji_number"]==1
    assert b["actual"]["six_ji_number"]==3
    assert b["actual"]["ju"]==52
    assert b["actual"]["hour_ganzhi_from_jiazi_start"]=="丁卯"
    assert c["actual"]["six_ji_number"]==3
    assert c["actual"]["hour_ganzhi_from_jiazi_start"]=="乙卯"
    assert c["actual"]["ju"]==28
    assert [r["matches_every_attested_field"] for r in (a,b,c)]==[False]*3
    assert audit["preferred_interpretation"] is None
    assert not audit["can_promote_full_yin_plate"]
    assert not audit["can_anchor_modern_qiying_wenchang"]
    assert audit["source_not_repaired"]

@pytest.mark.parametrize("date_value,clock",[
    (date(2026,10,28),time(17,30)),
    (date(2026,6,22),time(9,30)),
    (date(2026,12,23),time(10,30)),
])
def test_v86_real_api_keeps_v84_qiying_fields_unfilled(date_value,clock):
    c=hour_basic_board(date_value,clock)
    proof=c["hour_v86_classical_examples"]
    assert c["hour_source_review_version"]=="V86"
    assert proof["has_ancient_example_crosschecks"]
    assert not proof["has_verified_unique_modern_qiying_epoch"]
    assert proof["cannot_import_historical_guest_general_to_qiying"]
    assert c["hour_v85_phase_hypotheses"]["preferred_phase"] is None
    assert not c["has_verified_qiying_wenchang"]
    assert not c["has_verified_qiying_main_guest"]
    assert not c["has_full_hour_chart"]
    qi=c["hour_v84_qiying_plate"]["qiying"]
    assert qi["qiying_wenchang"] is None and qi["qiying_shiji"] is None
    assert qi["qiying_main_general"]["palace"] is None
    assert qi["qiying_guest_general"]["palace"] is None

def test_v86_prevents_modern_general_and_epoch_upgrade():
    c=hour_basic_board(date(2026,12,23),time(10,30))
    for field in ("qiying_wenchang","qiying_shiji"):
        changed=deepcopy(c)
        changed["hour_v84_qiying_plate"]["qiying"][field]={"god":"地主"}
        with pytest.raises(ValueError,match="V86"):
            decorate_taiyi_v86(changed)
    t=deepcopy(c);t["hour_v85_phase_hypotheses"]["preferred_phase"]=1
    with pytest.raises(ValueError,match="V86"):
        decorate_taiyi_v86(t)

def test_v86_cast_endpoint_and_annual_still_separated():
    client=TestClient(app)
    response=client.post("/api/taiyi/hour/cast",json={"solar_date":"2026-10-28","clock":"17:30"})
    assert response.status_code==200,response.text
    obj=response.json()
    assert obj["hour_v86_classical_examples"]["yin_source_conflict"]["preferred_interpretation"] is None
    assert len(obj["hour_v86_classical_examples"]["yang_examples"]["cases"])==3
    assert obj["has_full_hour_chart"] is False
    annual=client.post("/api/taiyi/cast",json={"gregorian_year":2026})
    assert annual.status_code==200
    assert "hour_v86_classical_examples" not in annual.json()
