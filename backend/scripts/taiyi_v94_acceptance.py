"""V94 CText OCR row semantics and WYG cross-reference acceptance."""
from pathlib import Path
import argparse
import json
import os
from datetime import date, time

from app.core.taiyi_hour_v77 import hour_basic_board
from app.core.taiyi_hour_v94 import audit_volume_nine_ocr_rows


def audit():
    source = audit_volume_nine_ocr_rows()
    assert source["ctext_ocr"]["target_row_number"] == 7
    assert source["ctext_wyg_transcription"]["target_row_number"] == 5
    assert source["numbering_semantics"]["is_physical_scan_page"] is False
    assert source["ctext_ocr"]["physical_scan_page"] is None
    assert source["ctext_wyg_transcription"]["physical_scan_page"] is None
    assert len(source["observed_ocr_divergences"]) >= 4
    assert source["physical_mapping"]["cadal_physical_page"] is None
    assert source["physical_mapping"]["ncl_ming_physical_page"] is None
    assert source["collation"]["may_emend_ming_text"] is False

    cases = []
    for d, clock in (
        (date(2026, 10, 28), time(17, 30)),
        (date(2026, 6, 22), time(9, 30)),
        (date(2026, 12, 23), time(10, 30)),
    ):
        chart = hour_basic_board(d, clock)
        result = chart["hour_v94_ocr_row_audit"]
        assert result["ctext_ocr"]["target_row_number"] == 7
        assert result["ctext_wyg_transcription"]["target_row_number"] == 5
        assert result["physical_mapping"]["cadal_physical_page"] is None
        assert chart["has_full_hour_chart"] is False
        cases.append({
            "date": d.isoformat(),
            "clock": clock.strftime("%H:%M"),
            "ocr_row_number": 7,
            "wyg_row_number": 5,
            "physical_scan_page_located": False,
        })

    return {
        "version": "V94",
        "status": "passed",
        "git_sha": os.getenv("GITHUB_SHA"),
        "case_count": len(cases),
        "cases": cases,
        "ctext_ocr_chapter": 367760,
        "ctext_ocr_target_row": 7,
        "ctext_wyg_chapter": 435698,
        "ctext_wyg_target_row": 5,
        "row_numbers_are_scan_pages": False,
        "cadal_physical_page": None,
        "ncl_ming_physical_page": None,
        "observed_ocr_divergences": len(source["observed_ocr_divergences"]),
        "target_scan_image_visually_reviewed": False,
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
    print("V94：OCR行号语义与四库卷九正文交叉核对通过；实体扫描页仍未知")
