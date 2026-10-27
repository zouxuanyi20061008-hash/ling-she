"""V48 audit runner contract: matrix, golden cases and strict no-outcome boundaries."""
import pytest
from app.core.liuyao import cast_six_yao
from scripts.liuyao_v48_acceptance import _cast_check, _golden_cases, run_acceptance


def test_acceptance_runner_checks_64_hexagrams_seven_mover_counts_and_all_masks():
    result=run_acceptance()
    assert result["version"]=="V48"
    assert result["result"]=="passed"
    assert result["matrix"]["hexagrams"]==64
    assert result["matrix"]["moving_counts"]==list(range(7))
    assert result["matrix"]["per_moving_count"]=={str(k):64 for k in range(7)}
    assert result["matrix"]["total_matrix_casts"]==512
    assert len(result["golden_cases"])>=6
    assert result["not_implemented"]


def test_static_and_true_mover_transformed_scope_are_distinct():
    chart=_cast_check((1,1,1,1,1,1),{1,4},"explicit-1-4")
    assert chart["dong_yao"]==[1,4]
    assert [x["position"] for x in chart["cross_condition_audit"]["rows"]
            if x["actual_change"] is not None]==[1,4]
    assert all(chart["cross_condition_audit"]["rows"][i]["actual_change"] is None
               for i in (1,2,4,5))
    assert chart["evidence_priority_audit"]["auto_selects_yongshen"] is False


def test_classical_golden_anchors_include_zi_hour_and_fushen():
    names=_golden_cases()
    assert any("立春" in x and "子时" in x for x in names)
    assert any("姤" in x and "飞伏神" in x for x in names)
    assert any("原忌同动" in x for x in names)


@pytest.mark.parametrize("invalid",[
    [7]*5,[7]*7,[7,7,7,7,7,5],[7,7,7,7,7,True],
    [7,7,7,7,7,1.0],
])
def test_invalid_six_throw_input_rejected_not_autocompleted(invalid):
    with pytest.raises(ValueError):
        cast_six_yao(invalid)


def test_acceptance_never_confuses_verified_source_and_manual_ganzhi():
    chart=cast_six_yao([7]*6,"甲子","辰","世爻")
    assert "calendar_provenance" not in chart
    assert chart["evidence_priority_audit"]["calendar_provenance_verified"] is False
    assert chart["temporal_review"]["future_month_status"]=="unanchored_manual"
    assert chart["review_flow"]["report"]["has_final_decision"] is False
