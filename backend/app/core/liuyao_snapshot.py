"""六爻核心盘 V1：稳定的数据契约和可核对的三钱来源。

只整理已经计算的本变卦、八宫、纳甲与日月；不从传统象义推演吉凶。
六爻均按初爻至上爻（bottom_to_top）编号。
"""
from __future__ import annotations


def normalize_coin_tosses(numbers: list[int], coin_tosses: list | None) -> dict:
    """数字爻态与三钱原始记录分别保存，拒绝来源不一致的数据。"""
    if coin_tosses is not None and (
        not isinstance(coin_tosses, (list, tuple)) or len(coin_tosses) != 6
    ):
        raise ValueError("三钱记录必须包含初爻至上爻六组，手动输入可用 null。")
    throws = []
    for i, number in enumerate(numbers):
        faces = coin_tosses[i] if coin_tosses is not None else None
        if faces is not None:
            if (not isinstance(faces, (list, tuple)) or len(faces) != 3
                    or any(type(face) is not int or face not in (2, 3) for face in faces)):
                raise ValueError(f"第 {i+1} 爻的三钱记录必须是三个 2（字）或 3（背）。")
            if sum(faces) != number:
                raise ValueError(f"第 {i+1} 爻的三钱合计与爻数不符。")
        throws.append({
            "position": i+1,
            "number": number,
            "faces": list(faces) if faces is not None else None,
            "source": ("three_coins" if faces is not None else
                       "manual_number" if coin_tosses is not None else "unspecified"),
        })
    return {
        "method": "three_coin_six_throws",
        "order": "bottom_to_top",
        "face_values": {"字": 2, "背": 3},
        "throws": throws,
        "recorded_coins": sum(x["faces"] is not None for x in throws),
        "manual_entries": sum(x["source"] == "manual_number" for x in throws),
        "unknown_sources": sum(x["source"] == "unspecified" for x in throws),
    }


def build_core_chart(chart: dict, record: dict) -> dict:
    """从已核算大盘导出最小、可重放、与研判层分离的盘面快照。"""
    lines = chart["lines"]
    ben = chart["ben_gua"]
    bian = chart["bian_gua"]
    ben_rows = chart["najia_lines"]
    bian_rows = chart["bian_najia_lines"]
    palace = chart["eight_palaces"]["ben"]
    if any(len(v) != 6 for v in (lines, ben_rows, bian_rows, record["throws"])):
        raise ValueError("核心盘必须恰好有六条爻记录。")
    ben_bits = ben["lines_bottom_to_top"]
    bian_bits = bian["lines_bottom_to_top"]
    changed = chart["dong_yao"]
    if (len(ben_bits) != 6 or len(bian_bits) != 6 or
            sorted(set(changed)) != changed):
        raise ValueError("本变卦位序或动爻顺序无效。")
    rows = []
    for i, (line, row, other, throw) in enumerate(zip(lines, ben_rows, bian_rows, record["throws"])):
        position = i+1
        moving = line["number"] in (6, 9)
        yin_yang = line["number"] % 2
        if (any(item["position"] != position for item in (line, row, other, throw))
                or bool(moving) != (position in changed)
                or ben_bits[i] != yin_yang
                or bian_bits[i] != (1-yin_yang if moving else yin_yang)):
            raise ValueError(f"第 {position} 爻与本变卦、纳甲表不一致。")
        rows.append({
            "position": position,
            "number": line["number"],
            "yin_yang": line["yin_yang"],
            "moving": moving,
            "ben_bit": ben_bits[i],
            "bian_bit": bian_bits[i],
            "liuqin": row["liuqin"],
            "liushen": row.get("liushen"),
            "role": row["role"],
            "najia": row["ganzhi"],
            "element": row["element"],
            "changed_najia": other["ganzhi"],
            "changed_liuqin": other["liuqin"],
            "xunkong": row.get("is_xunkong"),
            "yuechong": row.get("is_yuechong"),
            "yuejian": row.get("is_yuejian"),
            "coin_source": throw["source"],
        })
    day = chart.get("calendar", {}).get("day")
    month = chart.get("calendar", {}).get("month")
    provenance = chart.get("calendar_provenance")
    return {
        "schema_version": "liuyao-core/1.0",
        "order": "bottom_to_top",
        "ben_gua": {"name": ben["full_name"], "bits": list(ben_bits)},
        "bian_gua": {"name": bian["full_name"], "bits": list(bian_bits)},
        "moving_positions": list(changed),
        "palace": {
            "name": palace["palace"],
            "stage": palace["stage"],
            "element": palace["palace_element"],
            "shi_position": palace["shi_position"],
            "ying_position": palace["ying_position"],
        },
        "calendar": {
            "day_ganzhi": day["ganzhi"] if day else None,
            "month_branch": month["branch"] if month else None,
            "source": ("server_recomputed_calendar" if provenance else
                       "manual" if day or month else "not_provided"),
        },
        "casting_record": record,
        "rows": rows,
        "limits": {
            "final_yongshen_selected": False,
            "final_strength_determined": False,
            "fortune_conclusion": None,
            "timing_conclusion": None,
        },
    }
