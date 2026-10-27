"""V42：逐日重算旬空，仅为真实明动本位化支提供时间条件。"""
from app.core.calendar import SIXTY_DAYS, XUNKONG, OPPOSITES
from app.core.liuyao import cast_six_yao


def test_daily_xunkong_is_recomputed_instead_of_copying_cast_day():
    chart = cast_six_yao([7] * 6, "甲子", "辰", "父母", 6)
    data = chart["temporal_review"]
    assert data["condition_audit_version"] == "V42"
    candidate = next(c for c in data["candidates"] if c["position"] == 6)
    assert candidate["originally_void"] is True
    assert candidate["has_actual_change"] is False
    assert candidate["changed_branch"] is None
    assert candidate["daily_xunkong_recomputed"] is True
    assert any(any(c["id"] == "original_xun_void_transition" for c in e["conditions"])
               for e in candidate["events"])
    for event in candidate["events"]:
        idx = (SIXTY_DAYS.index("甲子") + event["offset_days"]) % 60
        assert event["future_xunkong"] == list(XUNKONG[idx // 10])
        assert event["original_void_on_day"] == (
            candidate["branch"] in XUNKONG[idx // 10])
        assert event["changed_void_on_day"] is None
        assert event["changed_branch"] is None
        assert event["timing_verdict"] is None
        assert all(c["id"] not in ("changed_same_branch", "changed_clash_branch",
                                    "changed_xun_void_transition")
                   for c in event["conditions"])
    assert chart["review_flow"]["report"]["temporal_crosscheck_digest"]
    assert chart["review_flow"]["report"]["conclusion"] is None


def test_real_mover_changed_branch_has_own_day_clash_and_xun_void_checks():
    chart = cast_six_yao([7, 7, 7, 7, 7, 9], "戊辰", "辰", "父母")
    data = chart["temporal_review"]
    rows = {c["position"]: c for c in data["candidates"]}
    assert set(rows) == {3, 6}
    static, moving = rows[3], rows[6]
    assert static["has_actual_change"] is False
    assert static["changed_branch"] is None
    assert moving["has_actual_change"] is True
    assert moving["changed_branch"] == chart["bian_najia_lines"][5]["branch"]
    assert moving["original_changed_void"] == chart["bian_najia_lines"][5]["void_review"]["is_void"]
    assert any(any(x["id"] == "changed_same_branch" for x in event["conditions"])
               for event in moving["events"])
    assert any(any(x["id"] == "changed_clash_branch" for x in event["conditions"])
               for event in moving["events"])
    for event in moving["events"]:
        idx = (SIXTY_DAYS.index("戊辰") + event["offset_days"]) % 60
        assert event["future_xunkong"] == list(XUNKONG[idx // 10])
        assert event["changed_void_on_day"] == (moving["changed_branch"] in XUNKONG[idx // 10])
        for check in event["conditions"]:
            if check["id"] == "changed_same_branch":
                assert event["day_ganzhi"][1] == moving["changed_branch"]
            if check["id"] == "changed_clash_branch":
                assert event["day_ganzhi"][1] == OPPOSITES[moving["changed_branch"]]
    for event in static["events"]:
        assert event["changed_branch"] is None
        assert event["changed_void_on_day"] is None
    assert len(chart["review_flow"]["report"]["temporal_crosscheck_digest"]) == 2


def test_missing_day_or_hidden_focus_does_not_create_future_candidates():
    missing = cast_six_yao([7] * 6, focus_liuqin="父母")
    assert missing["temporal_review"]["candidates"] == []
    assert missing["review_flow"]["report"]["temporal_crosscheck_digest"] == []
    hidden = cast_six_yao([8, 7, 7, 7, 7, 7], "甲子", "卯", "妻财")
    assert hidden["temporal_review"]["candidates"] == []
    assert hidden["review_flow"]["report"]["temporal_crosscheck_digest"] == []
    assert hidden["temporal_review"]["has_timing_prediction"] is False
