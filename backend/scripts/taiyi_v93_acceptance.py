"""V93 CText scan-linked OCR anchor acceptance."""
from pathlib import Path
import argparse
import json
import os
from datetime import date, time

from app.core.taiyi_hour_v77 import hour_basic_board
from app.core.taiyi_hour_v93 import audit_volume_nine_scan_anchor


def audit():
    anchor = audit_volume_nine_scan_anchor()
    ctext = anchor["ctext"]
    assert ctext["library_resource"]["resource_id"] == 5784
    assert ctext["ocr_chapter"]["chapter_id"] == 367760
    assert ctext["ocr_chapter"]["target_block_index"] == 7
    assert ctext["ocr_chapter"]["image_anchor_visible"] is True
    assert ctext["wyg_text_chapter"]["chapter_id"] == 435698
    assert ctext["wyg_text_chapter"]["target_block_index"] == 5
    assert anchor["physical_mapping"]["cadal_physical_page"] is None
    assert anchor["physical_mapping"]["ncl_ming_physical_page"] is None
    assert anchor["collation"]["can_resolve_v87_conflict"] is False

    cases = []
    for d, clock in (
        (date(2026, 10, 28), time(17, 30)),
        (date(2026, 6, 22), time(9, 30)),
        (date(2026, 12, 23), time(10, 30)),
    ):
        chart = hour_basic_board(d, clock)
        result = chart["hour_v93_scan_anchor"]
        assert result["ctext"]["ocr_chapter"]["target_block_index"] == 7
        assert result["physical_mapping"]["cadal_physical_page"] is None
        assert chart["has_full_hour_chart"] is False
        cases.append({
            "date": d.isoformat(),
            "clock": clock.strftime("%H:%M"),
            "ctext_ocr_block": 7,
            "cadal_physical_page_located": False,
            "ncl_ming_page_located": False,
        })

    return {
        "version": "V93",
        "status": "passed",
        "git_sha": os.getenv("GITHUB_SHA"),
        "case_count": len(cases),
        "cases": cases,
        "ctext_library_resource_id": 5784,
        "ctext_ocr_chapter": 367760,
        "ctext_ocr_target_block": 7,
        "ctext_wyg_chapter": 435698,
        "ctext_wyg_target_block": 5,
        "cadal_physical_page": None,
        "ncl_ming_physical_page": None,
        "target_scan_image_visually_reviewed": False,
        "independent_ming_witness": False,
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
    print("V93：CText卷九影像关联入口定位通过；实体扫描页仍待影像核验")
