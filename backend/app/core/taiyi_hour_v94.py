"""V94：校正CText OCR条目编号语义，并与卷九四库转录交叉核对。"""
from __future__ import annotations

V94_OCR_ROW_AUDIT = {
    "id": "taiyi_volume_nine_ctext_ocr_row_audit",
    "version": "V94",
    "status": "text_rows_cross_referenced_scan_page_unresolved",
    "numbering_semantics": {
        "meaning": "CText搜索结果中OCR文本行前的显示序号",
        "is_physical_scan_page": False,
        "is_image_id": False,
        "is_stable_cadal_page_number": False,
        "warning": (
            "367760中的7和435698中的5是各自文本呈现中的行序号，"
            "不能解释为CADAL实体页、PDF页或明钞本叶码。"
        ),
    },
    "ctext_ocr": {
        "chapter_id": 367760,
        "url": "https://ctext.org/wiki.pl?chapter=367760&if=gb",
        "description": "卷五至卷十扫描件的自动OCR文字呈现",
        "volume_nine_context": [
            {"row_number": 4, "role": "volume_heading", "text": "太乙金鏡式經卷九"},
            {"row_number": 5, "role": "author_line", "text": "唐王希明撰"},
            {"row_number": 6, "role": "table_of_contents"},
            {"row_number": 7, "role": "target_passage"},
        ],
        "target_row_number": 7,
        "image_href": None,
        "image_href_verified": False,
        "physical_scan_page": None,
    },
    "ctext_wyg_transcription": {
        "chapter_id": 435698,
        "url": "https://ctext.org/wiki.pl?chapter=435698&if=gb",
        "description": "四庫本卷九文字轉錄",
        "context": [
            {"row_number": 1, "role": "edition_heading", "text": "欽定四庫全書"},
            {"row_number": 2, "role": "volume_heading", "text": "太乙金鏡式經卷九唐王希明撰"},
            {"row_number": 3, "role": "table_of_contents"},
            {"row_number": 4, "role": "section_heading", "text": "推敵國動靜"},
            {"row_number": 5, "role": "target_passage"},
        ],
        "target_row_number": 5,
        "leaf_marker": "KR3g0047_WYG_009-1b",
        "physical_scan_page": None,
    },
    "transcriptions": {
        "ocr_excerpt": (
            "假令陰遁第三紀第五十二局乙叩時太乙石訥歎宮陽德為天日已"
            "為計神始擊摶臨器振容計得毛大特七參將瓦為五將發陰陽和主容"
            "俱會汎方人敵轉而北方如斗樊則敵朱不為泊"
        ),
        "wyg_reference_excerpt": (
            "假令隂遁第三紀第五十二局乙夘時太乙在八宮陽徳為天目巳為計神"
            "始擊将臨太蔟客計得七大將七參将一此為五將發隂陽和主客俱㑹"
            "北方又敵轉而北方如此則敵来不為盗"
        ),
    },
    "observed_ocr_divergences": [
        {"ocr": "乙叩時", "wyg": "乙夘時", "type": "character_recognition"},
        {"ocr": "太乙石訥歎宮", "wyg": "太乙在八宮", "type": "character_recognition"},
        {"ocr": "陽德為天日已", "wyg": "陽徳為天目巳", "type": "character_recognition"},
        {"ocr": "始擊摶臨器振容", "wyg": "始擊将臨太蔟", "type": "character_recognition"},
    ],
    "physical_mapping": {
        "cadal_file": "CADAL06056495",
        "cadal_file_page_count": 120,
        "cadal_physical_page": None,
        "ncl_ming_file": "NCL-06604",
        "ncl_ming_file_page_count": 124,
        "ncl_ming_physical_page": None,
        "target_scan_image_visually_reviewed": False,
    },
    "collation": {
        "ming_manuscript_transcribed": False,
        "character_level_ming_vs_siku_collation_completed": False,
        "verified_independent_yin_variant": False,
        "can_resolve_v87_conflict": False,
        "may_emend_ming_text": False,
    },
    "next_action": (
        "取得CText图书馆卷五至卷十扫描文件的实际影像链接，或直接逐页检查CADAL06056495的120页扫描；"
        "以卷九题名、作者、目录及目标正文的连续版面特征确定实体页；"
        "再独立定位NCL-06604明钞本对应页。"
    ),
}


def audit_volume_nine_ocr_rows() -> dict:
    """Return a defensive copy of the V94 OCR row and transcription audit."""
    from copy import deepcopy
    return deepcopy(V94_OCR_ROW_AUDIT)


def decorate_taiyi_v94(chart: dict) -> dict:
    if chart.get("hour_scan_anchor_version") != "V93":
        raise ValueError("V94 必須接在 V93 CText OCR文本定位之後")
    v93 = chart.get("hour_v93_scan_anchor")
    if not isinstance(v93, dict):
        raise ValueError("V94 缺少 V93 卷九CText文本定位")
    if v93.get("ctext", {}).get("ocr_chapter", {}).get("target_row_number") != 7:
        raise ValueError("V94 OCR目标必须是卷九上下文中的第7条文本行")
    if v93.get("ctext", {}).get("wyg_text_chapter", {}).get("target_row_number") != 5:
        raise ValueError("V94 四库卷九目标必须是第5条文本行")
    chart["hour_v94_ocr_row_audit"] = audit_volume_nine_ocr_rows()
    chart["hour_ocr_audit_version"] = "V94"
    chart["has_verified_independent_yin_variant"] = False
    chart["has_full_hour_chart"] = False
    chart["warnings"].append(
        "V94 已将CText OCR第7条与四库卷九转录第5条交叉对应；"
        "两者序号均为文本行号而非扫描页号，OCR存在明显识字错误，"
        "实际Image链接、CADAL页码和明钞本页码均未核实。"
    )
    from .taiyi_hour_v95 import decorate_taiyi_v95
    return decorate_taiyi_v95(chart)
