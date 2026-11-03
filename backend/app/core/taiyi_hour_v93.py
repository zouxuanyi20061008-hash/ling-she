"""V93：校正CText卷九OCR文本行定位；不将文本行号冒充扫描页码。"""
from __future__ import annotations

V93_SCAN_ANCHOR = {
    "id": "taiyi_volume_nine_ctext_scan_anchor",
    "version": "V93",
    "status": "ctext_ocr_text_rows_located_image_href_unverified_physical_scan_page_unresolved",
    "target": {
        "volume": 9,
        "section": "推敵國動靜",
        "target_text_leaf_marker": "KR3g0047_WYG_009-1b",
        "target_excerpt": (
            "假令隂遁第三紀第五十二局乙夘時太乙在八宮陽徳為天目巳為計神"
            "始擊将臨太蔟客計得七大將七參将一此為五將發隂陽和主客俱㑹"
            "北方又敵轉而北方如此則敵来不為盗"
        ),
    },
    "ctext": {
        "library_resource": {
            "resource_id": 5784,
            "url": "https://ctext.org/library.pl?if=gb&res=5784",
            "title": "《欽定四庫全書》本《太乙金鏡式經》圖書館影印資源",
            "description": "十卷拆分為卷一至卷四、卷五至卷十兩個掃描文件",
            "item_source": "浙江大學圖書館",
            "scanned_by": "CADAL",
            "volume_five_to_ten_included": True,
        },
        "ocr_chapter": {
            "chapter_id": 367760,
            "url": "https://ctext.org/wiki.pl?chapter=367760&if=gb",
            "description": "卷五至卷十掃描影像自動OCR章節",
            "target_row_number": 7,
            "row_number_semantics": "CText OCR文本呈现中的行序号，不是扫描页号",
            "image_href_verified": False,
            "ocr_text_is_error_prone": True,
        },
        "wyg_text_chapter": {
            "chapter_id": 435698,
            "url": "https://ctext.org/wiki.pl?chapter=435698&if=gb",
            "description": "四庫本卷九文字轉錄",
            "target_row_number": 5,
            "row_number_semantics": "CText四库卷九文字呈现中的行序号，不是扫描页号",
            "leaf_marker": "KR3g0047_WYG_009-1b",
        },
        "interaction_note": (
            "CText搜尋索引可定位卷九OCR文本第7行及四庫文字第5行；但目前未取得Image入口的實際href/"
            "圖像URL，因此影像連結尚未獨立核實，不能據此推定實體掃描頁碼。"
        ),
    },
    "scan_candidates": {
        "cadal_06056495": {
            "title": "CADAL06056495 太乙金鏡式經·卷五~卷十.djvu",
            "url": (
                "https://commons.wikimedia.org/wiki/File:"
                "CADAL06056495_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93"
                "%C2%B7%E5%8D%B7%E4%BA%94~%E5%8D%B7%E5%8D%81.djvu"
            ),
            "page_count": 120,
            "sha1": "2493cd56f238d74f28b12853958ba69384b504cb",
            "edition_family": "四庫全書系統",
            "independent_ming_witness": False,
        },
        "ncl_06604": {
            "title": "NCL-06604 太乙金鏡式經.pdf",
            "url": (
                "https://commons.wikimedia.org/wiki/File:"
                "NCL-06604_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93.pdf"
            ),
            "page_count": 124,
            "edition_family": "明鈔本",
            "independent_ming_witness": True,
        },
        "ssid_13003380": {
            "title": "SSID-13003380 太乙金鏡式經 欽定四庫全書.pdf",
            "url": (
                "https://commons.wikimedia.org/wiki/File:"
                "SSID-13003380_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93_"
                "%E6%AC%BD%E5%AE%9A%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8.pdf"
            ),
            "page_count": 121,
            "edition_family": "四庫全書系統",
            "independent_ming_witness": False,
            "use": "候補影印文件；未逐頁核驗，不可代替CADAL或明鈔本",
        },
    },
    "physical_mapping": {
        "ctext_file_id": None,
        "ctext_library_page_number": None,
        "cadal_physical_page": None,
        "cadal_page_located": False,
        "ncl_ming_physical_page": None,
        "ncl_ming_page_located": False,
        "target_scan_image_visually_reviewed": False,
    },
    "collation": {
        "ming_manuscript_transcribed": False,
        "character_level_collation_completed": False,
        "verified_independent_yin_variant": False,
        "can_resolve_v87_conflict": False,
        "may_emend_ming_text": False,
    },
    "next_action": (
        "取得CText圖書館卷五至卷十掃描文件的實際影像URL，或直接逐頁檢查CADAL原始120頁文件；"
        "以卷九題名、作者、目錄及目標正文的連續版面定位實體頁，再用1a/1b葉碼作輔助核對，"
        "最後獨立定位NCL-06604明鈔本。"
    ),
}


def audit_volume_nine_scan_anchor() -> dict:
    """Return a defensive copy of the V93 OCR text-row locator registry."""
    from copy import deepcopy
    return deepcopy(V93_SCAN_ANCHOR)


def decorate_taiyi_v93(chart: dict) -> dict:
    if chart.get("hour_textual_locator_version") != "V92":
        raise ValueError("V93 必須接在 V92 卷九文字葉定位之後")
    v92 = chart.get("hour_v92_textual_locator")
    if not isinstance(v92, dict):
        raise ValueError("V93 缺少 V92 四庫文字葉定位")
    target = v92.get("target_passage", {})
    if target.get("leaf_marker") != "KR3g0047_WYG_009-1b":
        raise ValueError("V93 目標必須沿用V92已定位的WYG卷九1b")
    if target.get("physical_scan_page") is not None:
        raise ValueError("V93 不得將未核實的實體掃描頁號當成既定事實")
    chart["hour_v93_scan_anchor"] = audit_volume_nine_scan_anchor()
    chart["hour_scan_anchor_version"] = "V93"
    chart["has_verified_independent_yin_variant"] = False
    chart["has_full_hour_chart"] = False
    chart["warnings"].append(
        "V93 已定位CText卷九OCR文本第7行及图书馆资源5784；Image实际href、CADAL实体页和明钞本页码均未核实，V87冲突继续待判。"
    )
    from .taiyi_hour_v94 import decorate_taiyi_v94
    return decorate_taiyi_v94(chart)
