"""V26 两现候选比较：逐轴标记同异与缺失，不排序、不伪造暗伏主爻。"""
from app.core.liuyao import cast_six_yao

def test_qian_parent_pair_explicit_difference_without_winner():
    c=cast_six_yao([7]*6,"甲子","辰","父母")
    d=c["focus_comparison"]
    assert d["status"]=="comparison_ready"
    assert [x["position"] for x in d["candidates"]]==[3,6]
    assert d["selected_position"] is None
    assert len(d["pairs"])==1
    pair=d["pairs"][0]
    assert pair["winner"] is None and pair["score"] is None
    assert pair["first_position"]==3 and pair["second_position"]==6
    assert "void" in pair["different_keys"]
    assert d["has_auto_ranking"] is False and d["final_yongshen"] is None

def test_missing_calendar_is_unconfirmed_not_negative():
    c=cast_six_yao([7]*6,focus_liuqin="父母")
    p=c["focus_comparison"]["pairs"][0]
    for key in ("day_relation","month_relation","season","void","day_clash","month_break"):
        axis=next(x for x in p["axes"] if x["id"]==key)
        assert axis["state"]=="missing"
        assert axis["first_value"] is None and axis["second_value"] is None
    assert c["focus_comparison"]["status"]=="calendar_incomplete"

def test_selected_position_changes_only_manual_focus_label():
    c=cast_six_yao([7]*6,"甲子","辰","父母",6)
    data=c["focus_comparison"]
    assert data["selected_position"]==6
    assert [x["position"] for x in data["candidates"] if x["selected_by_user"]]==[6]
    assert data["pairs"][0]["winner"] is None
    assert c["review_flow"]["report"]["focus_comparison_digest"]
    assert c["review_flow"]["report"]["conclusion"] is None

def test_hidden_focus_has_no_fabricated_visible_comparison():
    c=cast_six_yao([8,7,7,7,7,7],"甲子","卯","妻财")
    data=c["focus_comparison"]
    assert data["status"]=="focus_not_visible"
    assert data["candidates"]==[] and data["pairs"]==[]
    assert data["hidden_candidates"]

def test_no_focus_does_not_invent_selection():
    c=cast_six_yao([7]*6)
    data=c["focus_comparison"]
    assert data["status"]=="focus_not_selected"
    assert data["selected_position"] is None
    assert not data["candidates"]
