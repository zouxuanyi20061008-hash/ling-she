"""V92 卷九 WYG 文字叶定位专项验收。"""
from pathlib import Path
import argparse
import json
import os
from datetime import date, time

from app.core.taiyi_hour_v77 import hour_basic_board
from app.core.taiyi_hour_v92 import audit_volume_nine_text_locator


def audit():
    locator = audit_volume_nine_text_locator()
    target = locator["target_passage"]
    assert locator["volume"] == 9
    assert locator["volume_title_leaf_marker"] == "KR3g0047_WYG_009-1a"
    assert target["leaf_marker"] == "KR3g0047_WYG_009-1b"
    assert "隂遁第三紀第五十二局乙夘時" in target["excerpt"]
    assert target["physical_scan_page"] is None
    assert target["ming_manuscript_page"] is None
    assert locator["collation"]["can_resolve_v87_conflict"] is False

    cases = []
    for d, clock in (
        (date(2026, 10, 28), time(17, 30)),
        (date(2026, 6, 22), time(9, 30)),
        (date(2026, 12, 23), time(10, 30)),
    ):
        chart = hour_basic_board(d, clock)
        result = chart["hour_v92_textual_locator"]
        assert result["target_passage"]["leaf_marker"] == target["leaf_marker"]
        assert result["target_passage"]["physical_scan_page"] is None
        assert chart["has_full_hour_chart"] is False
        cases.append({"date": d.isoformat(), "clock": clock.strftime("%H:%M"),
                      "text_leaf": target["leaf_marker"], "physical_scan_page_located": False})

    return {
        "version": "V92",
        "status": "passed",
        "git_sha": os.getenv("GITHUB_SHA"),
        "case_count": len(cases),
        "cases": cases,
        "target_text_leaf": target["leaf_marker"],
        "cadal_ocr_chapter": locator["sources"]["cadal_ocr"]["chapter_id"],
        "cadal_volume_nine_text_chapter": locator["sources"]["cadal_volume_nine_text"]["chapter_id"],
        "cadal_scan_page": None,
        "ncl_ming_scan_page": None,
        "independent_ming_witness": False,
        "character_level_collation_completed": False,
        "historical_conflict_resolved": False,
        "may_emend_ming_text": False,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    report = audit()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("V92：卷九WYG文字叶1b定位通过；CADAL及明钞本物理扫描页仍未映射")
