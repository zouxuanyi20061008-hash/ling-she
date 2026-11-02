"""V88 reproducible registry acceptance; no manuscript text is fabricated."""
from pathlib import Path
import argparse
import json
import os
from datetime import date, time
from app.core.taiyi_hour_v77 import hour_basic_board


def audit():
    cases = []
    for d, clock in ((date(2026, 10, 28), time(17, 30)),
                     (date(2026, 6, 22), time(9, 30)),
                     (date(2026, 12, 23), time(10, 30))):
        chart = hour_basic_board(d, clock)
        item = chart["hour_v88_manuscript_witness_registry"]
        assert item["status"] == "catalog_and_scan_identified_text_not_collated"
        assert item["witness"]["scan_page_count"] == 124
        assert item["collation"]["transcribed_reading"] is None
        assert item["lineage"]["textual_independence_established"] is False
        assert item["can_resolve_v87_conflict"] is False and item["preferred_correction"] is None
        assert chart["hour_v87_modular_source_audit"]["triple_intersection"] == []
        assert chart["hour_v86_classical_examples"]["yin_source_conflict"]["preferred_interpretation"] is None
        assert chart["has_full_hour_chart"] is False
        cases.append({"beijing_date": d.isoformat(), "clock": clock.strftime("%H:%M"),
                      "candidate_status": item["status"], "scan_pages": item["witness"]["scan_page_count"],
                      "target_page": item["collation"]["target_leaf_or_page"],
                      "compared_characters": item["collation"]["compared_character_count"],
                      "preferred_correction": item["preferred_correction"]})
    return {"version": "V88", "status": "passed", "git_sha": os.getenv("GITHUB_SHA"),
            "catalogued_ming_manuscript": "NCL-06604", "scan_page_count": 124,
            "case_count": len(cases), "cases": cases, "textual_collation_completed": False,
            "independent_textual_lineage_established": False, "historical_conflict_resolved": False,
            "may_emend_source_text": False, "modern_qiying_epoch_identified": False,
            "full_hour_chart_completed": False}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    report = audit()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("V88：国图明钞本目录与124页扫描线索登记通过；卷九目标文字仍未校勘")
