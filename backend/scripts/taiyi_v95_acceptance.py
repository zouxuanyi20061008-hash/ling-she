"""V95 scan-candidate inventory and page-location fingerprint acceptance."""
from pathlib import Path
import argparse
import json
import os

from app.core.taiyi_hour_v95 import audit_volume_nine_scan_candidates


def audit():
    data = audit_volume_nine_scan_candidates()
    assert data["candidate_count"] == 8
    assert data["candidate_counts"]["catalogued_ming_manuscript"] == 1
    assert data["candidate_counts"]["siku_transmission_or_candidate"] == 5
    assert data["candidate_counts"]["commercial_press_edition_unverified"] == 2
    assert data["ncl_ming_scan_review"]["previously_visually_reviewed_pages"] == list(range(1, 13))
    assert data["ncl_ming_scan_review"]["target_page_located"] is False
    assert data["physical_mapping"]["ncl_ming_physical_page"] is None
    assert data["physical_mapping"]["cadal_06056495_physical_page"] is None
    assert data["target_fingerprint"]["wyg_leaf_is_physical_scan_page"] is False
    assert data["lineage"]["textually_independent_additional_witnesses_verified"] == 0
    assert data["collation"]["can_resolve_v87_conflict"] is False
    assert data["collation"]["may_emend_ming_text"] is False

    return {
        "version": "V95",
        "status": "passed",
        "git_sha": os.getenv("GITHUB_SHA"),
        "candidate_count": data["candidate_count"],
        "candidate_counts": data["candidate_counts"],
        "ncl_ming_pages_previously_reviewed": data["ncl_ming_scan_review"]["previously_visually_reviewed_pages"],
        "ncl_ming_target_page": None,
        "cadal_06056495_target_page": None,
        "cadal_06066055_target_page": None,
        "ntut_3100478_pages": 148,
        "ntut_3100479_pages": 122,
        "target_fingerprint_anchor_count": len(data["target_fingerprint"]["anchors"]),
        "additional_independent_witnesses_verified": 0,
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
    print("V95：8条扫描/电子书目候选与卷九五段指纹登记通过；实体目标页仍待影像核验")
