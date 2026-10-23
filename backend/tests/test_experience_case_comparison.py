"""V33 checks that grouped observations are descriptive and preserve contradictions."""
import pytest
from app.experience_case_comparison import condition_value, research_contrast

def record(ben,lines,kind):
    return {
        "ben_gua":ben,"bian_gua":"火天大有","original_numbers":lines,
        "month_branch":"辰","day_ganzhi":"甲子",
        "selected_position":3,"created_at":"2026-10-23T08:00:00Z",
        "before":"事前研究仅供复核",
        "feedback":[{"result_type":kind,"observations":"实际情况尚待独立复核",
                     "recorded_at":"2026-10-24T08:00:00Z"}]}

def test_moving_lines_count_only_six_and_nine():
    a=record("水天需",[7,8,9,6,7,8],"未吻合")
    assert condition_value(a,"moving_count")=="2爻"
    assert condition_value(a,"moving_lines")=="第3爻、第4爻"
    assert condition_value(record("乾为天",[7,8,7,7,7,8],"尚无结果"),"moving_count")=="0爻"
    assert condition_value({"original_numbers":[7,8]},"moving_count")=="未记录"
    with pytest.raises(ValueError):
        condition_value(a,"unknown")

def test_conditions_preserve_disagreement_and_unresolved_reports():
    rows=[
        ("pending",record("水天需",[7,8,9,6,7,8],"基本吻合")),
        ("approved",record("水天需",[7,8,9,6,7,8],"未吻合")),
        ("rejected",record("乾为天",[7,8,7,7,7,8],"尚无结果")),
    ]
    result=research_contrast(rows,"ben_gua","水天需")
    assert result["matching"]["total_cases"]==2
    assert result["other"]["total_cases"]==1
    assert result["matching"]["self_report_tags"]["未吻合"]==1
    assert result["other"]["unresolved_self_reports"]==1
    assert result["matching"]["prediction_accuracy"] is None
    assert result["other"]["independently_verified"] is False
    assert "不足5份" in result["small_sample_warning"]
    with pytest.raises(ValueError):
        research_contrast(rows,"not_a_supported_dimension","unused")
