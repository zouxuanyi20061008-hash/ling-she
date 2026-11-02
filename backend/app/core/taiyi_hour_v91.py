"""V91：登记卷五至卷十的四库系统分卷扫描入口；不猜测未查看的卷九页码。"""
from __future__ import annotations

CADAL_VOLUME_5_TO_10 = {
    "id": "cadal_06056495",
    "title": "太乙金鏡式經·卷五~卷十",
    "provider": "大学数字图书馆国际合作计划（CADAL）",
    "institution": "浙江大学",
    "edition_family": "四库全书系统",
    "volumes_included": [5, 6, 7, 8, 9, 10],
    "scan_page_count": 120,
    "format": "DjVu",
    "file_size_bytes": 4369742,
    "sha1": "2493cd56f238d74f28b12853958ba69384b504cb",
    "catalog_url": "https://commons.wikimedia.org/wiki/File:CADAL06056495_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93%C2%B7%E5%8D%B7%E4%BA%94~%E5%8D%B7%E5%8D%81.djvu",
    "source_record_url": "https://commons.wikimedia.org/wiki/Category:%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93",
    "volume_nine_included": True,
    "volume_nine_scan_page": None,
    "volume_nine_page_range": None,
    "target_passage_page": None,
    "target_leaf_located": False,
    "visually_reviewed_pages": [],
    "ocr_verified": False,
    "independent_ming_witness": False,
    "same_edition_family_as_siku_baseline": True,
    "can_resolve_v87_conflict": False,
    "may_emend_ming_text": False,
    "status": "volume_nine_search_file_identified_page_not_yet_located",
}


def audit_cadal_volume_five_to_ten() -> dict:
    return {
        "version": "V91",
        "status": CADAL_VOLUME_5_TO_10["status"],
        "target_volume": 9,
        "candidate_scan": dict(CADAL_VOLUME_5_TO_10),
        "search_scope_narrowed": True,
        "exact_page_located": False,
        "target_passage_transcribed": False,
        "independent_ming_witness_found": False,
        "historical_conflict_resolved": False,
        "may_emend_source_text": False,
        "next_action": "逐页检查CADAL06056495，先找卷九题名页，再定位推敌国动静",
    }


def decorate_taiyi_v91(chart: dict) -> dict:
    if chart.get("hour_scan_locator_version") != "V90":
        raise ValueError("V91 必须接在 V90 扫描页序定位之后")
    v90 = chart.get("hour_v90_scan_locator")
    if not isinstance(v90, dict) or v90.get("can_resolve_v87_conflict") is not False:
        raise ValueError("V91 不得将四库扫描提升为明钞本异文")
    chart["hour_v91_cadal_volume_locator"] = audit_cadal_volume_five_to_ten()
    chart["hour_cadal_locator_version"] = "V91"
    chart["has_verified_independent_yin_variant"] = False
    chart["has_full_hour_chart"] = False
    chart["warnings"].append(
        "V91 找到CADAL四库系统卷五至卷十扫描入口，卷九具体页码尚未逐页核定；"
        "该扫描不是独立明钞本，不能据此改定V87原文冲突。"
    )
    from .taiyi_hour_v92 import decorate_taiyi_v92
    return decorate_taiyi_v92(chart)
