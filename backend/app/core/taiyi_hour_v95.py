"""V95：扩展太乙卷九扫描候选谱系，并建立实体页定位指纹。

本版只登记可核的馆藏/数字文件元数据。除NCL-06604扫描第1—12页
已在V90逐页核看外，其余候选均未作页面视觉核验；不推算卷九页码。
"""
from __future__ import annotations

from copy import deepcopy

V95_SCAN_CANDIDATES = {
    "ncl_06604_ming": {
        "id": "ncl_06604_ming_manuscript",
        "title": "NCL-06604《太乙金鏡式經》明鈔本",
        "institution": "國家圖書館（臺灣）",
        "edition": "明鈔本",
        "publisher": None,
        "publication_year": "明代（1368—1644）",
        "accession_number": "06604",
        "page_count": 124,
        "classification": "catalogued_ming_manuscript",
        "catalog_url": (
            "https://rbook.ncl.edu.tw/NCLSearch/Search/SearchDetail?"
            "HasImage=&SourceID=1&item=13b06fa9483b4e5c94ff0d8120e7dafaf"
            "DcyODI50.Bfft4JFnqn4EbB0D_K05Qt4TOObWV_cCRKArHV41ULs_&page="
        ),
        "scan_url": (
            "https://commons.wikimedia.org/wiki/File:"
            "NCL-06604_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93.pdf"
        ),
        "visually_reviewed_pages": list(range(1, 13)),
        "target_page_located": False,
        "textual_independence_verified": False,
    },
    "cadal_06056495": {
        "id": "cadal_06056495",
        "title": "CADAL06056495《太乙金鏡式經》卷五至卷十",
        "institution": "浙江大學",
        "provider": "大学数字图书馆国际合作计划（CADAL）",
        "edition_family": "四庫全書系統",
        "page_count": 120,
        "sha1": "2493cd56f238d74f28b12853958ba69384b504cb",
        "classification": "siku_transmission",
        "url": (
            "https://commons.wikimedia.org/wiki/File:"
            "CADAL06056495_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93"
            "%C2%B7%E5%8D%B7%E4%BA%94~%E5%8D%B7%E5%8D%81.djvu"
        ),
        "visually_reviewed_pages": [],
        "target_page_located": False,
        "textual_independence_verified": False,
    },
    "cadal_06066055": {
        "id": "cadal_06066055",
        "title": "CADAL06066055《太乙鏡式經》卷五至卷十",
        "institution": "浙江大學",
        "provider": "大学数字图书馆国际合作计划（CADAL）",
        "edition_family": "四庫全書系統",
        "page_count": 120,
        "classification": "siku_transmission_candidate",
        "url": (
            "https://commons.wikimedia.org/wiki/File:"
            "CADAL06066055_%E5%A4%AA%E4%B9%99%E9%8F%A1%E5%BC%8F%E7%B6%93"
            "%C2%B7%E5%8D%B7%E4%BA%94~%E5%8D%B7%E5%8D%81.djvu"
        ),
        "visually_reviewed_pages": [],
        "relationship_to_cadal_06056495": "same broad Siku family; duplicate or distinct physical scan not established",
        "target_page_located": False,
        "textual_independence_verified": False,
    },
    "ssid_13003380": {
        "id": "ssid_13003380_siku",
        "title": "SSID-13003380《太乙金鏡式經》欽定四庫全書",
        "edition_family": "四庫全書系統",
        "page_count": 121,
        "classification": "siku_transmission",
        "url": (
            "https://commons.wikimedia.org/wiki/File:"
            "SSID-13003380_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93_"
            "%E6%AC%BD%E5%AE%9A%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8.pdf"
        ),
        "visually_reviewed_pages": [],
        "target_page_located": False,
        "textual_independence_verified": False,
    },
    "wenyuan_0810": {
        "id": "wenyuan_0810_siku",
        "title": "文淵閣四庫全書第0810冊",
        "edition_family": "四庫全書系統",
        "page_count": 1031,
        "classification": "siku_compilation_volume",
        "url": (
            "https://commons.wikimedia.org/wiki/File:"
            "%E6%96%87%E6%B7%B5%E9%96%A3%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8_0810%E5%86%8A.djvu"
        ),
        "visually_reviewed_pages": [],
        "target_page_located": False,
        "textual_independence_verified": False,
    },
    "xiaocui_810": {
        "id": "xiaocui_siku_810_66p",
        "title": "《太乙金鏡式經十卷》四庫全書子部第810冊 DJVU",
        "edition_family": "title_claims_siku_810",
        "page_count": 66,
        "classification": "siku_scan_candidate_metadata_unverified",
        "url": (
            "https://xiaocuihuating.cn/index.php?title=File:"
            "%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93_%E5%8D%81%E5%8D%B7"
            "_%28%E5%94%90%29%E7%8E%8B%E5%B8%8C%E6%98%8E%E6%92%B0_-_%E5%9B%9B%E5%BA%AB"
            "%E5%85%A8%E6%9B%B8%E5%AD%90%E9%83%A8%E7%AC%AC810%E5%86%8A_.djvu&variant=zh-hans"
        ),
        "visually_reviewed_pages": [],
        "target_page_located": False,
        "textual_independence_verified": False,
    },
    "ntut_9910018317": {
        "id": "ntut_3100478",
        "title": "臺灣華文電子書庫《太乙金鏡式經》",
        "institution": "國立臺北科技大學圖書資訊處",
        "image_source": "國立臺北科技大學",
        "publisher": "商務印書館",
        "publication_year": None,
        "accession_number": "3100478",
        "page_count": 148,
        "classification": "commercial_press_digitization_edition_unverified",
        "book_url": "https://taiwanebook.ncl.edu.tw/zh-tw/book/NTUT-9910018317",
        "reader_url": "https://taiwanebook.ncl.edu.tw/zh-tw/book/NTUT-9910018317/reader",
        "visually_reviewed_pages": [],
        "target_page_located": False,
        "textual_independence_verified": False,
    },
    "ntut_9910018318": {
        "id": "ntut_3100479",
        "title": "臺灣華文電子書庫《太乙金鏡式經》",
        "institution": "國立臺北科技大學圖書資訊處",
        "image_source": "國立臺北科技大學",
        "publisher": "商務印書館",
        "publication_year": None,
        "accession_number": "3100479",
        "page_count": 122,
        "classification": "commercial_press_digitization_edition_unverified",
        "book_url": "https://taiwanebook.ncl.edu.tw/zh-tw/book/NTUT-9910018318",
        "reader_url": "https://taiwanebook.ncl.edu.tw/zh-tw/book/NTUT-9910018318/reader",
        "visually_reviewed_pages": [],
        "target_page_located": False,
        "textual_independence_verified": False,
    },
}

V95_TARGET_FINGERPRINT = {
    "volume": 9,
    "section": "推敵國動靜",
    "wyg_text_leaf_marker": "KR3g0047_WYG_009-1b",
    "wyg_leaf_is_physical_scan_page": False,
    "anchors": [
        {
            "role": "section_heading",
            "text": "推敵國動靜",
            "search_priority": 1,
        },
        {
            "role": "paragraph_opening",
            "text": "經曰欲知敵國動靜者當用日時決之",
            "search_priority": 2,
        },
        {
            "role": "target_case_opening",
            "text": "假令隂遁第三紀第五十二局乙夘時",
            "search_priority": 3,
        },
        {
            "role": "key_configuration",
            "text": "太乙在八宮陽徳為天目巳為計神始擊将臨太蔟",
            "search_priority": 4,
        },
        {
            "role": "case_ending",
            "text": "如此則敵来不為盗",
            "search_priority": 5,
        },
    ],
    "page_layout_expectation": {
        "ncl_ming_catalogued_layout": "九行、每行二十字、雙欄、版心白口、單魚尾",
        "use_layout_as_locator": True,
        "use_layout_as_proof_of_textual_identity": False,
    },
}


def audit_volume_nine_scan_candidates() -> dict:
    candidates = deepcopy(V95_SCAN_CANDIDATES)
    ncl = candidates["ncl_06604_ming"]
    reviewed_pages = list(ncl["visually_reviewed_pages"])
    return {
        "version": "V95",
        "status": "candidate_inventory_expanded_physical_target_page_unlocated",
        "candidate_count": len(candidates),
        "candidate_sources": list(candidates.values()),
        "candidate_counts": {
            "catalogued_ming_manuscript": 1,
            "siku_transmission_or_candidate": 5,
            "commercial_press_edition_unverified": 2,
            "total": len(candidates),
        },
        "ncl_ming_scan_review": {
            "file_id": "NCL-06604",
            "total_pages": 124,
            "previously_visually_reviewed_pages": reviewed_pages,
            "previously_visually_reviewed_page_count": len(reviewed_pages),
            "new_pages_visually_reviewed_this_version": [],
            "volume_nine_start_page": None,
            "target_passage_page": None,
            "target_page_located": False,
        },
        "target_fingerprint": deepcopy(V95_TARGET_FINGERPRINT),
        "physical_mapping": {
            "ncl_ming_physical_page": None,
            "cadal_06056495_physical_page": None,
            "cadal_06066055_physical_page": None,
            "ssid_13003380_physical_page": None,
            "ntut_3100478_physical_page": None,
            "ntut_3100479_physical_page": None,
            "target_scan_image_visually_reviewed": False,
            "page_numbers_inferred_from_volume_order": False,
        },
        "lineage": {
            "catalogued_ming_manuscript_candidates": 1,
            "siku_scan_files_are_not_independent_witnesses": True,
            "ntut_commercial_press_edition_relationship_unverified": True,
            "textually_independent_additional_witnesses_verified": 0,
            "duplicate_scan_relationships_resolved": False,
        },
        "collation": {
            "ming_manuscript_transcribed": False,
            "character_level_collation_completed": False,
            "verified_independent_yin_variant": False,
            "can_resolve_v87_conflict": False,
            "may_emend_ming_text": False,
        },
        "next_action": (
            "先取得NCL-06604及候选四库/商务印书馆文件的逐页影像或可下载PDF；"
            "按V95五段文字指纹和明钞本九行双栏版式检索卷九题名及推敌国动静正文；"
            "记录PDF/DjVu物理页号与书内叶码的双重对应，再逐字转录明钞本。"
        ),
    }


def decorate_taiyi_v95(chart: dict) -> dict:
    if chart.get("hour_ocr_audit_version") != "V94":
        raise ValueError("V95 必須接在 V94 CText OCR行号校核之后")
    v94 = chart.get("hour_v94_ocr_row_audit")
    if not isinstance(v94, dict):
        raise ValueError("V95 缺少 V94 卷九OCR行号审计")
    if (v94.get("physical_mapping", {}).get("cadal_physical_page") is not None
            or v94.get("collation", {}).get("may_emend_ming_text") is not False):
        raise ValueError("V95 不得把尚未视觉核验的四库行号升级为扫描页或校改依据")
    chart["hour_v95_scan_candidate_audit"] = audit_volume_nine_scan_candidates()
    chart["hour_scan_candidate_audit_version"] = "V95"
    chart["has_verified_independent_yin_variant"] = False
    chart["has_full_hour_chart"] = False
    chart["warnings"].append(
        "V95 扩展登记CADAL第二扫描、四库合订册及两条商务印书馆电子书目；"
        "NCL-06604仍只核看第1—12页，卷九实体页尚未定位，未新增独立异文。"
    )
    return chart
