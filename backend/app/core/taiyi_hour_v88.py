"""V88：太乙金镜式经卷九阴遁冲突的明钞本候选见证登记。

只登记国图目录与数字扫描的可核元数据。尚未定位卷九目标叶、
逐字转录或与四库本校勘，因此不能把该馆藏实体提升为已验证异文。
"""
from __future__ import annotations

CATALOG_URL = "https://rbook.ncl.edu.tw/NCLSearch/Search/SearchDetail?HasImage=&SourceID=1&item=13b06fa9483b4e5c94ff0d8120e7dafafDcyODI50.Bfft4JFnqn4EbB0D_K05Qt4TOObWV_cCRKArHV41ULs_&page="
SCAN_URL = "https://commons.wikimedia.org/wiki/File:NCL-06604_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93.pdf"
DIGITAL_ARCHIVE_URL = "https://catalog.digitalarchives.tw/item/00/07/ed/67.html"


def audit_ming_manuscript_candidate() -> dict:
    """Return only catalogued metadata; never infer the unread Volume 9 text."""
    return {
        "version": "V88",
        "status": "catalog_and_scan_identified_text_not_collated",
        "witness": {
            "id": "ncl_06604_ming_manuscript",
            "title": "太乙金鏡式經",
            "institution": "國家圖書館（臺灣）",
            "edition": "明鈔本",
            "catalogued_period": "明代（1368—1644）",
            "precise_copy_date": None,
            "volume_count": 10,
            "bound_volume_count": 4,
            "binding": "線裝",
            "shelfmark": "306.6 06604",
            "accession_number": "06604",
            "layout": "九行、每行二十字、雙欄、版心白口、單魚尾",
            "catalog_url": CATALOG_URL,
            "scan_url": SCAN_URL,
            "digital_archive_url": DIGITAL_ARCHIVE_URL,
            "scan_page_count": 124,
            "scan_width_px": 2350,
            "scan_height_px": 1700,
            "scan_file_size_bytes": 23669039,
            "scan_sha1": "46b2774f6d66fb61db3617673672ec721bdc0904",
            "catalog_metadata_confirmed": True,
            "digital_scan_metadata_confirmed": True,
        },
        "collation": {
            "target_passage": "卷九·推敌国动静",
            "target_leaf_or_page": None,
            "target_page_range_status": "not_located",
            "transcribed_reading": None,
            "compared_fields": [],
            "compared_character_count": 0,
            "status": "not_started",
        },
        "lineage": {
            "separate_catalogued_physical_artifact_from_siku_transcription": True,
            "textual_independence_established": False,
            "relationship_to_siku_text": "unknown_until_collated",
            "is_verified_independent_variant": False,
        },
        "can_resolve_v87_conflict": False,
        "may_emend_text": False,
        "preferred_correction": None,
        "scope_note": (
            "本记录只确认一件明代馆藏抄本及其124页数字扫描的元数据；"
            "尚未读出卷九目标文字，不证明该句与四库本相同或不同。"
            "必须先定位目标叶并逐字转录，才能作为文本异文证据。"
        ),
    }


def decorate_taiyi_v88(chart: dict) -> dict:
    if (chart.get("version") != "V77"
            or chart.get("hour_source_review_version") != "V87"):
        raise ValueError("V88 必须接在 V87 太乙时计历史来源审计之后")
    audit = chart.get("hour_v87_modular_source_audit")
    if not isinstance(audit, dict):
        raise ValueError("V88 缺少 V87 原典同余审计")
    if (audit.get("triple_intersection") != []
            or audit.get("preferred_correction") is not None
            or audit.get("may_emend_text_from_modular_math") is not False):
        raise ValueError("V88 不得擅自改写尚未校勘的 V87 原典冲突")
    qi = chart.get("hour_v84_qiying_plate", {}).get("qiying", {})
    if (qi.get("qiying_wenchang") is not None
            or qi.get("qiying_shiji") is not None
            or qi.get("qiying_main_general", {}).get("palace") is not None
            or qi.get("qiying_guest_general", {}).get("palace") is not None):
        raise ValueError("V88 不得从历史抄本目录信息推造现代气应文昌或主客将")
    if chart.get("has_full_hour_chart") is not False:
        raise ValueError("V88 馆藏目录线索不能把未完成的时计盘标成完整")
    chart["hour_v88_manuscript_witness_registry"] = audit_ming_manuscript_candidate()
    chart["hour_witness_registry_version"] = "V88"
    chart["has_verified_independent_yin_variant"] = False
    chart["has_full_hour_chart"] = False
    chart["warnings"].append(
        "V88 新登记国图明钞本及124页扫描线索；卷九目标叶尚未定位、"
        "未逐字校勘，不能据馆藏元数据解决V87阴遁原文冲突。"
    )
    return chart
