"""V23：本卦旬空、冲空、月破、动空和化空分流；不自动裁定真假空。"""
from app.core.liuyao import cast_six_yao
from app.core.hexagrams import TRIGRAMS


def test_no_day_leaves_all_void_decisions_unknown():
    chart=cast_six_yao([7]*6,month_branch="辰",focus_liuqin="父母")
    block=chart["void_context_review"]
    assert block["status"]=="day_unconfirmed"
    assert len(block["rows"])==6
    for row in block["rows"]:
        assert row["category"]=="day_missing"
        assert row["original_void"] is None
        assert row["transformed_void"] is None
        assert row["true_void"] is None and row["false_void"] is None
        assert row["steps"][0]["status"]=="missing"


def test_jiazi_void_top_qian_remains_unresolved_with_month_break():
    chart=cast_six_yao([7]*6,"甲子","辰","父母",6)
    block=chart["void_context_review"]
    top=block["rows"][5]
    assert top["category"]=="original_void"
    assert top["original_void"] is True
    assert top["transformed_void"] is None
    assert top["selected_by_user"]
    assert top["transformed_is_actual_change"] is False
    assert any("旬空兼月破" in x for x in top["cross_checks"])
    assert top["true_void"] is None and top["false_void"] is None
    assert block["selected_position"]==6
    assert any("真假空" in x for x in chart["review_flow"]["report"]["void_context_digest"])


def test_void_with_day_clash_not_misclassified_as_dark_or_filled():
    chart=cast_six_yao([7]*6,"戊辰","辰","父母")
    top=chart["void_context_review"]["rows"][5]
    assert top["category"]=="original_void"
    assert any("旬空兼日冲" in x for x in top["cross_checks"])
    daystep=next(x for x in top["steps"] if x["id"]=="day")
    assert any("冲空条件" in x for x in daystep["observations"])
    assert top["void_resolved"] is False


def test_moving_original_void_and_changed_line_stay_distinct():
    chart=cast_six_yao([7,7,7,7,7,9],"戊辰","辰","世爻")
    top=chart["void_context_review"]["rows"][5]
    assert top["moving"]
    assert top["original_void"] is True
    assert top["transformed_is_actual_change"] is True
    x=next(s for s in top["steps"] if s["id"]=="transformation")
    assert any("本位变爻" in s for s in x["observations"])
    assert any("明动爻旬空" in s for s in top["cross_checks"])
    assert top["false_void"] is None


def test_actual_huakong_exists_without_original_void_and_not_fabricated_for_static():
    example=None
    for lo in TRIGRAMS.values():
        for up in TRIGRAMS.values():
            bits=lo["lines"]+up["lines"]
            for pos in range(6):
                arr=[7 if b else 8 for b in bits]
                arr[pos]=9 if bits[pos] else 6
                chart=cast_six_yao(arr,"甲子","辰")
                row=chart["void_context_review"]["rows"][pos]
                if row["category"]=="transformed_void_only":
                    example=(chart,row)
                    break
            if example:break
        if example:break
    assert example is not None
    chart,row=example
    assert row["original_void"] is False
    assert row["transformed_void"] is True
    assert row["transformed_is_actual_change"] is True
    assert chart["bian_najia_lines"][row["position"]-1]["void_review"]["is_huakong"] is True
    assert row["true_void"] is None and row["false_void"] is None

    static=cast_six_yao([7]*6,"甲子","辰")["void_context_review"]["rows"][5]
    assert static["original_void"] is True
    assert static["transformed_void"] is None
    assert static["transformed_is_actual_change"] is False


def test_two_visible_focus_candidates_are_preserved_without_priority_scoring():
    chart=cast_six_yao([7]*6,"甲子","辰","父母")
    block=chart["void_context_review"]
    assert block["focus_candidate_positions"]==[3,6]
    assert block["selected_position"] is None
    assert [x["position"] for x in block["rows"] if x["focus_candidate"]]==[3,6]
    assert block["has_final_void_decision"] is False
    assert chart["review_flow"]["report"]["conclusion"] is None
