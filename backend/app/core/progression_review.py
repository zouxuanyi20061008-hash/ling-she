"""Six-yao V38: 进神/退神 as a checked branch transition of a TRUE moving line.

Source: 《增删卜易》进神退神章第二十九. Some editions omit
戌化丑/丑化戌; that final earth-cycle pair is labelled variant explicitly.
Only recognize the *same position* original moving branch -> transformed branch.
Never treat a static changed-hexagram comparison as a transformation.
"""
from __future__ import annotations

from .najia import BRANCH_ELEMENT

SOURCE="https://www.shidianguji.com/book/XYXZSBY/chapter/1lzxsny7da4uh"
VARIANT_SOURCE="https://www.yanyilundao.com/b7/481"

# Seven explicit transitions in the edition reproduced at SOURCE.
PRIMARY_ADVANCE={
    "亥":"子","寅":"卯","巳":"午","申":"酉",
    "丑":"辰","辰":"未","未":"戌",
}
# The cyclical earth link is found in other editions but omitted at SOURCE.
VARIANT_ADVANCE={"戌":"丑"}
REVERSE_PRIMARY={to:fr for fr,to in PRIMARY_ADVANCE.items()}
REVERSE_VARIANT={to:fr for fr,to in VARIANT_ADVANCE.items()}


def progress_branch(original:str,transformed:str,moving:bool)->dict:
    """Return an edition-aware static classification, never a strength verdict."""
    if original not in BRANCH_ELEMENT or transformed not in BRANCH_ELEMENT:
        raise ValueError("进退神校验失败：地支不在十二支中")
    if type(moving) is not bool:
        raise ValueError("动静状态无效")
    result={
        "original_branch":original,"transformed_branch":transformed,
        "is_actual_change":moving,"kind":"not_moving","label":"静爻不论化进退",
        "source_status":"not_applicable","is_primary_rule":False,
        "effectiveness":None,"strength":None,"fortune":None,
    }
    if not moving:return result
    if PRIMARY_ADVANCE.get(original)==transformed:
        kind,label,status="advance","化进神","primary_edition"
    elif REVERSE_PRIMARY.get(original)==transformed:
        kind,label,status="retreat","化退神","primary_edition"
    elif VARIANT_ADVANCE.get(original)==transformed:
        kind,label,status="advance_variant","化进神（版本差异）","variant_edition"
    elif REVERSE_VARIANT.get(original)==transformed:
        kind,label,status="retreat_variant","化退神（版本差异）","variant_edition"
    else:
        kind,label,status="neither","不属于已列进退神","checked_no_match"
    result.update(kind=kind,label=label,source_status=status,
                  is_primary_rule=status=="primary_edition")
    return result


def decorate_progression(chart:dict)->dict:
    rows=[]
    day=chart["calendar"]["day"]
    month=chart["calendar"]["month"]
    for original,changed in zip(chart["najia_lines"],chart["bian_najia_lines"]):
        pos=original["position"]
        if pos!=changed["position"]:
            raise ValueError("进退神只能比较本位同爻，不可跨位")
        progress=progress_branch(original["branch"],changed["branch"],bool(original["moving"]))
        caution=[]
        if original["moving"]:
            if not day:caution.append("未核日辰，旬空与日冲影响不能复核")
            if not month:caution.append("未核节令月建，月冲与旺相不能复核")
            if original.get("is_xunkong") is True:caution.append("原爻旬空，实效待合参")
            if changed.get("is_xunkong") is True:caution.append("本位变爻逢旬空，化空条件待合参")
            if original.get("month_break_marker") is True:caution.append("原爻月冲，进退实际作用待核")
            if changed.get("month_break_marker") is True:caution.append("本位变爻月冲，进退实际作用待核")
            if progress["source_status"]=="variant_edition":
                caution.append("此土支进退组合有古籍异本文字差异，已按版本候选标记")
        rows.append({
            "position":pos,"original_ganzhi":original["ganzhi"],
            "transformed_ganzhi":changed["ganzhi"],
            "original_liuqin":original["liuqin"],
            "transformed_liuqin":changed["liuqin"],
            **progress,
            "day_known":bool(day),"month_known":bool(month),
            "original_void":original.get("is_xunkong") if day else None,
            "transformed_void":changed.get("is_xunkong") if day and original["moving"] else None,
            "original_month_clash":original.get("month_break_marker") if month else None,
            "transformed_month_clash":changed.get("month_break_marker") if month and original["moving"] else None,
            "cautions":caution,
        })
    assert len(rows)==6
    chart["progression_review"]={
        "version":"V38","rows":rows,
        "moving_count":len(chart["dong_yao"]),
        "primary_advances":[r["position"] for r in rows if r["kind"]=="advance"],
        "primary_retreats":[r["position"] for r in rows if r["kind"]=="retreat"],
        "edition_variants":[r["position"] for r in rows if r["source_status"]=="variant_edition"],
        "has_final_effectiveness":False,"timing_conclusion":None,"fortune_conclusion":None,
        "source":SOURCE,"variant_source":VARIANT_SOURCE,
        "rule":"只有本卦真实明动、变爻在同一爻位的地支变化才可判为化进或化退；静爻不算。",
        "edition_note":"主校本列七组进退；部分流通版本还列戌化丑、丑化戌，本站专门标注版本差异。",
        "boundary":"进退是传统地支转化关系，不直接证明用神旺衰、作用已发生、吉凶或应期。",
    }
    return chart
