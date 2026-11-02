"""V89 reproducible digital witness source-family census acceptance."""
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
        census = chart["hour_v89_digitized_witness_census"]
        assert census["catalogue_category_resource_count"] == 7
        assert census["source_family_counts"] == {
            "catalogued_ming_manuscript_candidate": 1,
            "siku_transmission": 4,
            "unattributed_scan": 2,
        }
        assert census["lineage_conclusion"]["verified_independent_textual_witnesses"] == 0
        assert census["ncl_ming_manuscript"]["target_leaf_or_scan_page"] is None
        assert census["ncl_ming_manuscript"]["full_text_collation_status"] == "not_started"
        assert census["can_resolve_v87_conflict"] is False
        assert census["preferred_correction"] is None
        assert chart["has_full_hour_chart"] is False
        cases.append({
            "beijing_date": d.isoformat(),
            "clock": clock.strftime("%H:%M"),
            "resource_count": census["catalogue_category_resource_count"],
            "siku_files": census["source_family_counts"]["siku_transmission"],
            "unattributed_files": census["source_family_counts"]["unattributed_scan"],
            "verified_independent_textual_witnesses": census["lineage_conclusion"]["verified_independent_textual_witnesses"],
            "target_scan_page": census["ncl_ming_manuscript"]["target_leaf_or_scan_page"],
        })
    return {
        "version": "V89",
        "status": "passed",
        "git_sha": os.getenv("GITHUB_SHA"),
        "case_count": len(cases),
        "cases": cases,
        "source_family_census_complete": True,
        "target_leaf_located": False,
        "full_text_collation_completed": False,
        "verified_independent_textual_witnesses": 0,
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
    print("V89：7个数字化文件来源谱系清点通过；未把四库扫描或来源不明扫描算作独立异本")
