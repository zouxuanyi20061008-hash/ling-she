"""V25 研究单仅聚合程序证据，保持候选未决与缺历法输入。"""
from app.core.liuyao import cast_six_yao

def test_focus_missing_and_hidden_never_create_fictitious_candidates():
    empty=cast_six_yao([7]*6)["review_sheet"]
    assert empty["status"]=="focus_not_selected" and empty["candidates"]==[]
    hidden=cast_six_yao([8,7,7,7,7,7],"甲子","卯","妻财")["review_sheet"]
    assert hidden["status"]=="focus_not_visible" and hidden["candidates"]==[]

def test_multiple_visible_candidates_not_ranked_and_evidence_grounded():
    c=cast_six_yao([7]*6,"甲子","辰","父母")
    sheet=c["review_sheet"]
    assert sheet["status"]=="candidate_comparison"
    assert [x["position"] for x in sheet["candidates"]]==[3,6]
    for candidate in sheet["candidates"]:
        row=c["strength_evidence"]["rows"][candidate["position"]-1]
        assert candidate["supporting"]==row["supporting"]
        assert candidate["restraining"]==row["restraining"]
        assert candidate["context"]==row["context"]
        assert candidate["axis_ids"]==["month","day","movement","void","special","roles"]
        assert candidate["conclusion"] is None and candidate["score"] is None
        assert not candidate["selected_by_user"]

def test_explicit_selection_reflected_in_report_without_program_conclusion():
    c=cast_six_yao([7]*6,"甲子","辰","父母",6)
    assert c["review_sheet"]["status"]=="ready_to_record"
    assert [x["position"] for x in c["review_sheet"]["candidates"] if x["selected_by_user"]]==[6]
    assert c["review_flow"]["report"]["review_sheet_digest"]
    assert c["review_flow"]["report"]["conclusion"] is None
    assert c["review_sheet"]["program_determined"] is False

def test_missing_calendar_keeps_pending_not_full_strength():
    sheet=cast_six_yao([7]*6,focus_liuqin="世爻")["review_sheet"]
    assert sheet["status"]=="date_incomplete"
    assert any("日辰" in x for x in sheet["candidates"][0]["pending"])
    assert any("月建" in x for x in sheet["candidates"][0]["pending"])
    assert sheet["final_strength"] is None
