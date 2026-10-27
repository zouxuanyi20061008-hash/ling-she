"""V49 classical examples and hidden/flying factual conditions."""
from copy import deepcopy
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.liuyao import cast_six_yao
from app.core.hidden_condition_review import decorate_hidden_condition_review
from scripts.liuyao_v49_classic_cases import run_classical_examples


def test_independent_book_fixtures_match_both_original_example_charts():
    r=run_classical_examples()
    assert r["status"]=="passed"
    assert r["case_count"]==2
    assert [c["id"] for c in r["cases"]]==[
        "zengshan_tianfeng_gou_hidden_wealth","zengshan_tianshan_dun_hidden_child"]


def test_gou_hidden_wealth_from_book_has_flying_support_without_calendar_claim():
    c=cast_six_yao([8,7,7,7,7,7],focus_liuqin="妻财")
    d=c["hidden_condition_review"]
    assert d["status"]=="hidden_candidates"
    row=d["rows"][0]
    assert row["position"]==2
    assert row["flying_hidden_relation"]=="飞生伏"
    flags={x["id"]:x["observed"] for x in row["conditions"]}
    assert flags["flying_generates_hidden"] is True
    assert flags["hidden_calendar_generation"] is None
    assert flags["hidden_month_grade"] is None
    assert row["hidden_void"] is None
    assert row["flying_void"] is None
    assert row["actual_hidden_available"] is None
    assert c["review_flow"]["report"]["hidden_condition_digest"]


def test_dun_hidden_child_book_has_flying_restriction_not_fake_no_yong():
    c=cast_six_yao([8,8,7,7,7,7],focus_liuqin="子孙")
    row=c["hidden_condition_review"]["rows"][0]
    assert row["position"]==1
    assert row["flying_hidden_relation"]=="飞克伏"
    assert next(x for x in row["conditions"] if x["id"]=="flying_generates_hidden")["observed"] is False
    assert row["actual_hidden_available"] is None
    assert row["hidden_chosen_as_yongshen"] is False


def test_chosen_date_separates_hidden_void_from_flying_void():
    c=cast_six_yao([8,7,7,7,7,7],"甲子","辰","妻财")
    row=c["hidden_condition_review"]["rows"][0]
    assert row["hidden_void"] is False  # 寅
    assert row["flying_void"] is True  # 亥
    assert row["hidden_month_break"] is False
    assert row["flying_month_break"] is False
    assert row["hidden_month_grade"]=="余气"  # 辰月木余气
    assert next(x for x in row["conditions"] if x["id"]=="flying_void_break_context")["observed"] is True
    assert row["actual_hidden_available"] is None


def test_moving_original_sources_are_only_element_references_not_hidden_direct_edges():
    c=cast_six_yao([8,9,7,9,7,7],"甲子","辰","妻财")
    row=c["hidden_condition_review"]["rows"][0]
    assert len(row["other_actual_movers"])==1
    assert row["other_actual_movers"][0]["source_position"]==4
    assert row["other_actual_movers"][0]["acts_on_hidden_proven"] is False
    assert c["multi_mover_audit"]["pair_count"]==1


def test_hidden_source_corruption_rejected():
    c=cast_six_yao([8,7,7,7,7,7],"甲子","辰","妻财")
    bad=deepcopy(c)
    bad["fushen"]["selected"]["entries"][0]["flying"]["ganzhi"]="甲子"
    with pytest.raises(ValueError,match="不一致"):
        decorate_hidden_condition_review(bad)


def test_visible_or_empty_focus_do_not_generate_hidden_selected():
    for focus in (None,"父母","世爻"):
        c=cast_six_yao([8,7,7,7,7,7],"甲子","辰",focus)
        assert c["hidden_condition_review"]["rows"]==[]
        assert c["hidden_condition_review"]["status"]!="hidden_candidates"


def test_fushen_api_returns_v49_with_null_decision():
    r=TestClient(app).post("/api/liuyao/cast",json={
        "numbers":[8,7,7,7,7,7],"focus_liuqin":"妻财"})
    assert r.status_code==200,r.text
    d=r.json()
    assert d["hidden_condition_review"]["version"]=="V49"
    assert d["hidden_condition_review"]["has_final_decision"] is False
    assert d["review_flow"]["report"]["hidden_condition_digest"]
