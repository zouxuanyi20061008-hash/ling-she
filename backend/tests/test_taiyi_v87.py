"""V87 360时完整同余证伪、V86逐宫一致性、API与现代气应隔离。"""
from copy import deepcopy
from datetime import date,time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.calendar import SIXTY_DAYS
from app.core.taiyi_hour_v77 import hour_basic_board
from app.core.taiyi_hour_v87 import (
    _plain_hour_labels,exhaustive_yin_source_congruence,decorate_taiyi_v87
)

def test_v87_all_360_prove_no_simultaneous_ji_ju_yimao():
    a=exhaustive_yin_source_congruence()
    assert a["version"]=="V87"
    assert a["period_hours"]==360
    assert a["constraint_match_counts"]=={
        "six_ji_number":60,"ju":5,"hour_ganzhi_from_jiazi_start":6}
    assert a["triple_intersection"]==[]
    assert [x["candidate_hour"] for x in a["pairwise_intersections"]]==[124,172,52]
    assert [x["conflicting_field"] for x in a["pairwise_intersections"]]==[
        "hour_ganzhi_from_jiazi_start","ju","six_ji_number"]
    assert a["preferred_correction"] is None
    assert not a["independent_printed_variant_verified"]
    assert not a["may_emend_text_from_modular_math"]
    for n in range(1,361):
        actual=_plain_hour_labels(n)
        assert actual["six_ji_number"]==(n-1)//60+1
        assert actual["ju"]==(n-1)%72+1
        assert actual["hour_ganzhi_from_jiazi_start"]==SIXTY_DAYS[(n-1)%60]
        assert _plain_hour_labels(n+360)==actual
        assert sum(actual[k]==a["source_reading"][k] for k in a["source_reading"])<=2

def test_v87_pair_specific_values_and_same_source_not_a_new_edition():
    a=exhaustive_yin_source_congruence()
    p,q,r=a["pairwise_intersections"]
    assert (p["candidate_hour"],p["source_value"],p["calculated_value"])==(124,"乙卯","丁卯")
    assert (q["candidate_hour"],q["source_value"],q["calculated_value"])==(172,52,28)
    assert (r["candidate_hour"],r["source_value"],r["calculated_value"])==(52,3,1)
    assert all(x["not_a_preferred_emendation"] for x in (p,q,r))
    assert a["transcriptions_agree_on_literal_reading"]
    assert len(a["same_edition_transcriptions"])==3
    assert all(x["edition_family"]=="四库全书本" and
               not x["has_independent_manuscript_proof"]
               for x in a["same_edition_transcriptions"])

@pytest.mark.parametrize("n",[0,-1,True,1.5,"52"])
def test_v87_invalid_hour_counts_rejected(n):
    with pytest.raises(ValueError,match="V87"):
        _plain_hour_labels(n)

@pytest.mark.parametrize("d,clock",[
    (date(2026,10,28),time(17,30)),
    (date(2026,6,22),time(9,30)),
    (date(2026,12,23),time(10,30)),
])
def test_v87_keeps_hour_chart_pending_and_preserves_earlier_source_audits(d,clock):
    chart=hour_basic_board(d,clock)
    assert chart["hour_source_review_version"]=="V87"
    assert chart["hour_v87_modular_source_audit"]["triple_intersection"]==[]
    assert chart["hour_v86_classical_examples"]["yin_source_conflict"]["preferred_interpretation"] is None
    assert chart["hour_v85_phase_hypotheses"]["preferred_phase"] is None
    assert not chart["has_verified_qiying_wenchang"]
    assert not chart["has_verified_qiying_main_guest"]
    assert not chart["has_full_hour_chart"]
    assert chart["hour_v84_qiying_plate"]["qiying"]["qiying_wenchang"] is None

def test_v87_refuse_tampered_historical_resolution_or_modern_qiying():
    c=hour_basic_board(date(2026,12,23),time(10,30))
    t=deepcopy(c)
    t["hour_v86_classical_examples"]["yin_source_conflict"]["preferred_interpretation"]="first"
    with pytest.raises(ValueError,match="V87"):decorate_taiyi_v87(t)
    for key in ("qiying_wenchang","qiying_shiji"):
        t=deepcopy(c)
        t["hour_v84_qiying_plate"]["qiying"][key]={"index":1}
        with pytest.raises(ValueError,match="V87"):decorate_taiyi_v87(t)

def test_v87_api_and_annual_not_mixed():
    client=TestClient(app)
    response=client.post("/api/taiyi/hour/cast",json={"solar_date":"2026-10-28","clock":"17:30"})
    assert response.status_code==200,response.text
    obj=response.json()
    assert obj["hour_source_review_version"]=="V87"
    assert obj["hour_v87_modular_source_audit"]["preferred_correction"] is None
    assert obj["hour_v87_modular_source_audit"]["triple_intersection"]==[]
    assert obj["hour_v86_classical_examples"]["yin_source_conflict"]["can_promote_full_yin_plate"] is False
    annual=client.post("/api/taiyi/cast",json={"gregorian_year":2026})
    assert annual.status_code==200
    assert "hour_v87_modular_source_audit" not in annual.json()
