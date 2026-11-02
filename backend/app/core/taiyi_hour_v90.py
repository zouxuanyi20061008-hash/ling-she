"""V90：NCL-06604 明钞本扫描前段页序定位与卷九目标叶追踪。

仅记录实际逐页预览过的扫描页。前九页只能证明卷一的题名、目录和正文起点，
不能推断卷九页码。四库网页转录只作待校底文，不得冒充明钞本读文。
"""
from __future__ import annotations

from .taiyi_hour_v86 import YIN_SOURCE
from .taiyi_hour_v87 import SAME_TEXT_TRANSCRIPTIONS

CATALOG_URL = (
    "https://rbook.ncl.edu.tw/NCLSearch/Search/SearchDetail?"
    "HasImage=&SourceID=1&item=13b06fa9483b4e5c94ff0d8120e7dafaf"
    "DcyODI50.Bfft4JFnqn4EbB0D_K05Qt4TOObWV_cCRKArHV41ULs_&page="
)
SCAN_FILE_URL = (
    "https://commons.wikimedia.org/wiki/File:"
    "NCL-06604_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93.pdf"
)
FILE_TITLE = "File%3ANCL-06604_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93.pdf"

_PAGE_OBSERVATIONS = (
    (1, "序文开篇", "扫描页可见《太乙金镜序》题名及序文正文"),
    (2, "序文续页", "序文续页，尚非卷九正文"),
    (3, "序文续页", "序文续页，尚非卷九正文"),
    (4, "空白页", "所见版框内无正文"),
    (5, "卷一题名与目录起页", "可辨《太乙金镜卷第一》及卷一目录"),
    (6, "卷一目录续页", "目录列出日计、太乙所在等条目"),
    (7, "卷一目录续页", "卷一目录继续"),
    (8, "卷一目录末页", "卷一目录继续，尚未进入卷九"),
    (9, "卷一正文起页", "可辨“推月计法”等卷一正文篇目"),
)


def _viewer_url(page: int) -> str:
    if page == 1:
        return SCAN_FILE_URL
    return f"https://commons.wikimedia.org/w/index.php?page={page}&title={FILE_TITLE}"


def audit_ming_scan_page_locator() -> dict:
    """Return a conservative visual page map, never extrapolating unseen pages."""
    pages = [
        {
            "scan_page": number,
            "classification": label,
            "visual_observation": observation,
            "viewer_url": _viewer_url(number),
            "visually_reviewed": True,
        }
        for number, label, observation in _PAGE_OBSERVATIONS
    ]
    baseline_text = (
        "假令阴遁第三纪第五十二局乙卯时太乙在八宫阳德为天目巳为计神"
        "始击将临太蔟客计得七大将七参将一此为五将发阴阳和主客俱会"
        "北方又敌转而北方如此则敌来不为盗"
    )
    return {
        "version": "V90",
        "status": "opening_scan_pages_mapped_volume_nine_leaf_not_located",
        "witness": {
            "id": "ncl_06604_ming_manuscript",
            "edition": "明钞本",
            "institution": "國家圖書館（臺灣）",
            "accession_number": "06604",
            "shelfmark": "306.6 06604",
            "volume_count": 10,
            "bound_volume_count": 4,
            "scan_page_count": 124,
            "scan_width_px": 2350,
            "scan_height_px": 1700,
            "scan_file_size_bytes": 23669039,
            "scan_sha1": "46b2774f6d66fb61db3617673672ec721bdc0904",
            "catalog_url": CATALOG_URL,
            "scan_file_url": SCAN_FILE_URL,
            "catalog_metadata_confirmed": True,
            "scan_metadata_confirmed": True,
        },
        "scan_page_map": pages,
        "scan_structure": {
            "visually_reviewed_page_numbers": [p["scan_page"] for p in pages],
            "visually_reviewed_page_count": len(pages),
            "opening_preface_pages": [1, 2, 3],
            "blank_page_numbers": [4],
            "volume_one_title_and_contents_start_page": 5,
            "volume_one_contents_pages": [6, 7, 8],
            "volume_one_body_start_page": 9,
            "volume_nine_start_page": None,
            "volume_nine_page_range": None,
            "page_sequence_extrapolated_beyond_reviewed_pages": False,
        },
        "target_passage": {
            "section": "卷九·推敌国动静",
            "source_key_fields": {key: YIN_SOURCE[key] for key in (
                "dun", "six_ji_number", "ju", "hour_ganzhi_from_jiazi_start",
                "taiyi_palace", "wenchang_god", "jishen", "shiji_god",
                "guest_count", "guest_general", "guest_assistant"
            )},
            "target_leaf_or_scan_page": None,
            "target_leaf_location_status": "not_located",
            "full_text_collation_status": "not_started",
            "transcribed_ming_reading": None,
            "compared_character_count": 0,
        },
        "siku_transcription_baseline": {
            "text": baseline_text,
            "edition_family": "四库全书本转录",
            "transcription_sources": list(SAME_TEXT_TRANSCRIPTIONS),
            "key_field_reading": "第三纪／第五十二局／乙卯时；太乙八宫；阳德天目；巳计神；太簇始击；客计七；大将七；参将一",
            "is_ncl_ming_manuscript_transcription": False,
            "is_independent_manuscript_witness": False,
            "use": "仅作待校底文与目标段落检索词，不代表NCL-06604明钞本读文",
        },
        "lineage": {
            "ncl_physical_manuscript_is_separately_catalogued": True,
            "ncl_ming_reading_transcribed": False,
            "independent_textual_witness_verified": False,
            "same_edition_web_transcriptions_are_independent_witnesses": False,
        },
        "can_resolve_v87_conflict": False,
        "may_emend_text": False,
        "preferred_correction": None,
        "has_verified_independent_yin_variant": False,
        "has_full_hour_chart": False,
        "scope_note": (
            "本轮只视觉核验NCL扫描第1—9页：第1—3页为序文，第4页为空白，"
            "第5页为卷一题名与目录起页，第6—8页为卷一目录，第9页进入卷一正文。"
            "没有查看第10页以后，因此卷九所在册、所在页和具体叶码仍全部未知。"
            "四库全书网页转录只用于建立检索底文，不得当作明钞本异文。"
        ),
    }


def decorate_taiyi_v90(chart: dict) -> dict:
    if (chart.get("version") != "V77"
            or chart.get("hour_witness_census_version") != "V89"):
        raise ValueError("V90 必须接在 V89 数字化见证来源谱系清点之后")
    v89 = chart.get("hour_v89_digitized_witness_census")
    if not isinstance(v89, dict):
        raise ValueError("V90 缺少 V89 数字化见证来源谱系清点")
    ncl = v89.get("ncl_ming_manuscript", {})
    if (v89.get("can_resolve_v87_conflict") is not False
            or v89.get("may_emend_text") is not False
            or v89.get("preferred_correction") is not None
            or ncl.get("target_leaf_or_scan_page") is not None):
        raise ValueError("V90 不得把V89未校勘线索提升为原典异文")
    if chart.get("has_full_hour_chart") is not False:
        raise ValueError("V90 文献页序定位不得把未完成的时计盘标成完整")
    chart["hour_v90_scan_locator"] = audit_ming_scan_page_locator()
    chart["hour_scan_locator_version"] = "V90"
    chart["has_verified_independent_yin_variant"] = False
    chart["has_full_hour_chart"] = False
    chart["warnings"].append(
        "V90 已视觉核验NCL-06604扫描第1—9页：卷一目录见第5—8页、"
        "卷一正文起于第9页；卷九目标叶仍未定位，四库转录不是明钞本读文。"
    )
    return chart
