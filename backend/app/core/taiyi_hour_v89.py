"""V89：太乙金镜式经数字化见证的来源谱系清点。

本版只按公开馆藏/数字文件元数据分类；不把同一四库文本的多份扫描
误算成多个独立底本，也不把来源不明的扫描自动提升为明钞本异文。
"""
from __future__ import annotations

def audit_digitized_witness_families() -> dict:
    resources = [
        {
            "id": "ncl_06604_ming_manuscript",
            "title": "NCL-06604《太乙金镜式经》明钞本",
            "file": "NCL-06604 太乙金鏡式經.pdf",
            "classification": "catalogued_ming_manuscript_candidate",
            "classification_label": "国图著录明钞本",
            "source_evidence": "台湾国家图书馆书目明确著录版本为明钞本，登录号06604",
            "page_count": 124,
            "url": "https://commons.wikimedia.org/wiki/File:NCL-06604_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93.pdf",
            "independent_textual_witness_verified": False,
        },
        {
            "id": "cadal_06056494",
            "title": "CADAL《太乙金镜式经》卷一至卷四",
            "file": "CADAL06056494 太乙金鏡式經·卷一~卷四.djvu",
            "classification": "siku_transmission",
            "classification_label": "四库全书系统",
            "source_evidence": "Commons 文件说明明确标注四库全书、子部、术数类",
            "page_count": 144,
            "url": "https://commons.wikimedia.org/wiki/File:CADAL06056494_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93%C2%B7%E5%8D%B7%E4%B8%80~%E5%8D%B7%E5%9B%9B.djvu",
            "independent_textual_witness_verified": False,
        },
        {
            "id": "cadal_06056495",
            "title": "CADAL《太乙金镜式经》卷五至卷十",
            "file": "CADAL06056495 太乙金鏡式經·卷五~卷十.djvu",
            "classification": "siku_transmission",
            "classification_label": "四库全书系统",
            "source_evidence": "Commons 文件说明明确标注四库全书、子部、术数类",
            "page_count": 120,
            "url": "https://commons.wikimedia.org/wiki/File:CADAL06056495_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93%C2%B7%E5%8D%B7%E4%BA%94~%E5%8D%B7%E5%8D%81.djvu",
            "independent_textual_witness_verified": False,
        },
        {
            "id": "ssid_12326977",
            "title": "SSID-12326977《太乙金镜式经》第一册扫描",
            "file": "SSID-12326977 太乙金鏡式經 1.pdf",
            "classification": "unattributed_scan",
            "classification_label": "来源待考扫描",
            "source_evidence": "Commons 页面标注无机器可读来源，未找到可核馆藏机构与版本说明",
            "page_count": 144,
            "url": "https://commons.wikimedia.org/wiki/File:SSID-12326977_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93_1.pdf",
            "independent_textual_witness_verified": False,
        },
        {
            "id": "ssid_12326978",
            "title": "SSID-12326978《太乙金镜式经》第二册扫描",
            "file": "SSID-12326978 太乙金鏡式經 2.pdf",
            "classification": "unattributed_scan",
            "classification_label": "来源待考扫描",
            "source_evidence": "Commons 页面标注无机器可读来源，未找到可核馆藏机构与版本说明",
            "page_count": 120,
            "url": "https://commons.wikimedia.org/wiki/File:SSID-12326978_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93_2.pdf",
            "independent_textual_witness_verified": False,
        },
        {
            "id": "ssid_13003380_siku",
            "title": "SSID-13003380《太乙金镜式经》钦定四库全书",
            "file": "SSID-13003380 太乙金鏡式經 欽定四庫全書.pdf",
            "classification": "siku_transmission",
            "classification_label": "四库全书系统",
            "source_evidence": "文件题名明确标注钦定四库全书",
            "page_count": 121,
            "url": "https://commons.wikimedia.org/wiki/File:SSID-13003380_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93_%E6%AC%BD%E5%AE%9A%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8.pdf",
            "independent_textual_witness_verified": False,
        },
        {
            "id": "wenyuan_0810_siku",
            "title": "文渊阁四库全书第0810册",
            "file": "文淵閣四庫全書 0810冊.djvu",
            "classification": "siku_transmission",
            "classification_label": "四库全书系统",
            "source_evidence": "文件题名明确标注文渊阁四库全书",
            "page_count": 1031,
            "url": "https://commons.wikimedia.org/wiki/Category:%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93",
            "independent_textual_witness_verified": False,
        },
    ]
    return {
        "version": "V89",
        "status": "source_family_census_complete_target_leaf_not_located",
        "catalogue_category_resource_count": len(resources),
        "source_family_counts": {
            "catalogued_ming_manuscript_candidate": 1,
            "siku_transmission": 4,
            "unattributed_scan": 2,
        },
        "resources": resources,
        "ncl_ming_manuscript": {
            "accession_number": "06604",
            "scan_page_count": 124,
            "scan_preview_pages_inspected": [2, 3],
            "inspected_pages_contain_target_passage": False,
            "target_passage": "卷九·推敌国动静",
            "target_leaf_or_scan_page": None,
            "page_location_status": "not_located",
            "full_text_collation_status": "not_started",
            "textual_independence_established": False,
        },
        "lineage_conclusion": {
            "catalogued_ming_physical_witness_candidates": 1,
            "identified_siku_digitization_files": 4,
            "unattributed_digitization_files": 2,
            "verified_independent_textual_witnesses": 0,
            "unattributed_files_count_as_independent": False,
            "siku_files_count_as_independent": False,
        },
        "can_resolve_v87_conflict": False,
        "may_emend_text": False,
        "preferred_correction": None,
        "has_verified_independent_yin_variant": False,
        "has_full_hour_chart": False,
        "scope_note": (
            "七个数字文件不等于七个独立版本。当前只有NCL-06604被馆藏目录明确"
            "著录为明钞本；四个文件明确属于四库系统，另两个SSID文件来源待考。"
            "卷九目标叶尚未定位，尚无可逐字校勘的明钞本读文。"
        ),
    }


def decorate_taiyi_v89(chart: dict) -> dict:
    if (chart.get("version") != "V77"
            or chart.get("hour_source_review_version") != "V87"
            or chart.get("hour_witness_registry_version") != "V88"):
        raise ValueError("V89 必须接在 V88 明钞本候选见证登记之后")
    v88 = chart.get("hour_v88_manuscript_witness_registry")
    if not isinstance(v88, dict):
        raise ValueError("V89 缺少 V88 明钞本馆藏记录")
    if (v88.get("can_resolve_v87_conflict") is not False
            or v88.get("may_emend_text") is not False
            or v88.get("preferred_correction") is not None
            or v88.get("collation", {}).get("target_leaf_or_page") is not None):
        raise ValueError("V89 不得将未校勘的馆藏线索升级为原典异文")
    if chart.get("has_full_hour_chart") is not False:
        raise ValueError("V89 来源清点不得把未完成的时计盘标成完整")
    chart["hour_v89_digitized_witness_census"] = audit_digitized_witness_families()
    chart["hour_witness_census_version"] = "V89"
    chart["has_verified_independent_yin_variant"] = False
    chart["has_full_hour_chart"] = False
    chart["warnings"].append(
        "V89 已清点7个数字化文件：4个明确属四库系统、2个来源待考、"
        "1件国图明钞本候选；卷九目标叶仍未定位，未完成逐字校勘。"
    )
    return chart
