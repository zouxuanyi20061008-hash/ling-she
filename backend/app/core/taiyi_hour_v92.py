"""V92：把卷九目标段落定位到四库文字转录叶；不冒充扫描页或明钞本读文。"""
from __future__ import annotations

KANRIPO_TARGET_EXCERPT = (
    "經曰欲知敵國動靜者當用日時决之若客計得諸五八門杜塞則敵不来"
    "若門具將發不掩迫闗格主客俱㑹太乙前此則所間皆吉敵来降不為冦"
    "若占北方事天目數轉而南行者為来轉而北行者不来矣"
    "假令隂遁第三紀第五十二局乙夘時太乙在八宫陽徳為天目巳為計神"
    "始擊将臨太蔟客計得七大将七參将一此為五將發隂陽和主客俱㑹"
    "北方又敵轉而北方如此則敵来不為盗"
)

V92_TEXTUAL_LOCATOR = {
    "id": "taiyi_volume_nine_text_leaf_1b",
    "version": "V92",
    "status": "target_passage_located_in_wyg_transcription_leaf_physical_scan_page_unmapped",
    "edition_family": "四库全书·文渊阁本（WYG）",
    "volume": 9,
    "section": "推敵國動靜",
    "volume_title_leaf_marker": "KR3g0047_WYG_009-1a",
    "target_passage_leaf_marker": "KR3g0047_WYG_009-1b",
    "leaf_marker_kind": "WYG文字转录页码标记，不是扫描页码",
    "target_passage": {
        "section": "卷九·推敌国动静",
        "leaf_marker": "KR3g0047_WYG_009-1b",
        "leaf_side": "1b",
        "excerpt": KANRIPO_TARGET_EXCERPT,
        "excerpt_source": "Kanripo KR3g0047_009.txt；BASEEDITION=WYG",
        "textually_located": True,
        "physical_scan_page": None,
        "physical_scan_page_located": False,
        "ming_manuscript_page": None,
        "ming_manuscript_leaf_located": False,
    },
    "sources": {
        "kanripo": {
            "title": "Kanripo KR3g0047 · WYG 卷九转录",
            "url": "https://github.com/kanripo/KR3g0047/blob/master/KR3g0047_009.txt",
            "source_type": "WYG文字转录",
            "base_edition": "WYG",
        },
        "cadal_ocr": {
            "title": "CText 卷五至卷十扫描 OCR（自动识别）",
            "url": "https://ctext.org/wiki.pl?chapter=367760&if=gb",
            "chapter_id": 367760,
            "source_type": "扫描影像自动OCR",
        },
        "cadal_volume_nine_text": {
            "title": "CText 四库本卷九文字转录",
            "url": "https://ctext.org/wiki.pl?chapter=435698&if=en",
            "chapter_id": 435698,
            "source_type": "四库本文字转录",
        },
        "cadal_scan": {
            "title": "CADAL06056495 太乙金镜式经·卷五至卷十",
            "url": "https://commons.wikimedia.org/wiki/File:CADAL06056495_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93%C2%B7%E5%8D%B7%E4%BA%94~%E5%8D%B7%E5%8D%81.djvu",
            "scan_page_count": 120,
            "physical_target_page": None,
        },
    },
    "source_lineage": {
        "is_ming_manuscript_transcription": False,
        "is_independent_ming_witness": False,
        "is_independent_variant": False,
        "belongs_to_siku_text_family": True,
        "cadal_ocr_is_independent_witness": False,
        "kanripo_wyg_is_independent_witness": False,
    },
    "collation": {
        "target_text_located": True,
        "cadal_scan_page_mapped": False,
        "ncl_ming_scan_page_mapped": False,
        "ming_manuscript_transcribed": False,
        "character_level_collation_completed": False,
        "verified_independent_yin_variant": False,
        "can_resolve_v87_conflict": False,
        "may_emend_ming_text": False,
    },
    "next_action": (
        "以卷九1a/1b题名与版面为检索锚点，逐页核对CADAL 120页扫描；"
        "随后独立定位NCL-06604明钞本卷九对应叶并逐字对校"
    ),
}


def audit_volume_nine_text_locator() -> dict:
    """Return a copy of the V92 textual locator and its conservative evidence limits."""
    from copy import deepcopy
    return deepcopy(V92_TEXTUAL_LOCATOR)


def decorate_taiyi_v92(chart: dict) -> dict:
    if chart.get("hour_cadal_locator_version") != "V91":
        raise ValueError("V92 必须接在 V91 CADAL 卷次扫描入口登记之后")
    v91 = chart.get("hour_v91_cadal_volume_locator")
    if not isinstance(v91, dict):
        raise ValueError("V92 缺少 V91 CADAL 扫描入口记录")
    scan = v91.get("candidate_scan", {})
    if scan.get("volume_nine_included") is not True or scan.get("independent_ming_witness") is not False:
        raise ValueError("V92 不得改变 V91 的版本谱系判断")
    chart["hour_v92_textual_locator"] = audit_volume_nine_text_locator()
    chart["hour_textual_locator_version"] = "V92"
    chart["has_verified_independent_yin_variant"] = False
    chart["has_full_hour_chart"] = False
    chart["warnings"].append(
        "V92 已将四库文渊阁本目标段落定位到转录叶1b；该叶码不是CADAL或明钞本扫描页，"
        "明钞本逐字校勘与V87冲突裁定仍未完成。"
    )
    return chart
