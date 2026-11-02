"""V90 reproducible NCL-06604 opening scan-page locator acceptance."""
from pathlib import Path
import argparse
import json
import os
from datetime import date, time

from app.core.taiyi_hour_v77 import hour_basic_board


def audit():
    cases = []
    for d, clock in (
        (date(2026, 10, 28), time(17, 30)),
        (date(2026, 6, 22), time(9, 30)),
        (date(2026, 12, 23), time(10, 30)),
    ):
        chart = hour_basic_board(d, clock)
        locator = chart["hour_v90_scan_locator"]
        structure = locator["scan_structure"]
        assert structure["visually_reviewed_page_numbers"] == list(range(1, 13))
        assert structure["volume_one_body_start_page"] == 9
        assert structure["volume_nine_start_page"] is None
        assert structure["page_sequence_extrapolated_beyond_reviewed_pages"] is False
        assert locator["target_passage"]["target_leaf_or_scan_page"] is None
        assert locator["target_passage"]["transcribed_ming_reading"] is None
        assert locator["siku_transcription_baseline"]["is_ncl_ming_manuscript_transcription"] is False
        assert locator["can_resolve_v87_conflict"] is False
        assert locator["may_emend_text"] is False
        assert chart["has_full_hour_chart"] is False
        cases.append({
            "beijing_date": d.isoformat(),
            "clock": clock.strftime("%H:%M"),
            "scan_pages_reviewed": structure["visually_reviewed_page_count"],
            "volume_one_body_start_page": structure["volume_one_body_start_page"],
            "volume_nine_start_page": structure["volume_nine_start_page"],
            "target_leaf_located": locator["target_passage"]["target_leaf_or_scan_page"] is not None,
            "full_text_collation_completed": locator["target_passage"]["full_text_collation_status"] == "completed",
        })
    return {
        "version": "V90",
        "status": "passed",
        "git_sha": os.getenv("GITHUB_SHA"),
        "case_count": len(cases),
        "cases": cases,
        "visually_reviewed_scan_pages": 12,
        "volume_one_body_start_page": 9,
        "volume_nine_start_page": None,
        "target_leaf_located": False,
        "full_text_collation_completed": False,
        "verified_independent_yin_variant": False,
        "historical_conflict_resolved": False,
        "may_emend_source_text": False,
        "full_hour_chart_completed": False,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    report = audit()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("V90：NCL-06604扫描前12页页序定位通过；卷九目标叶仍未定位，未冒充完成逐字校勘")
