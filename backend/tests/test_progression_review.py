"""V38: actual moving-line progression, edition variant and no invented strength."""
import pytest

from app.core.liuyao import cast_six_yao
from app.core.progression_review import (
    PRIMARY_ADVANCE,VARIANT_ADVANCE,progress_branch
)

@pytest.mark.parametrize("left,right", list(PRIMARY_ADVANCE.items()))
def test_primary_advances_and_reverse_retreats(left,right):
    advance=progress_branch(left,right,True)
    assert advance["kind"]=="advance"
    assert advance["label"]=="化进神"
    assert advance["source_status"]=="primary_edition"
    assert advance["effectiveness"] is None
    retreat=progress_branch(right,left,True)
    assert retreat["kind"]=="retreat"
    assert retreat["label"]=="化退神"


@pytest.mark.parametrize("left,right", list(VARIANT_ADVANCE.items()))
def test_variant_earth_round_trip_explicitly_identifies_edition_dispute(left,right):
    forward=progress_branch(left,right,True)
    backward=progress_branch(right,left,True)
    assert forward["kind"]=="advance_variant"
    assert backward["kind"]=="retreat_variant"
    assert forward["source_status"]=="variant_edition"
    assert backward["source_status"]=="variant_edition"
    assert not forward["is_primary_rule"]


def test_static_line_is_never_a_moving_progression_and_invalid_branches_fail():
    assert progress_branch("申","酉",False)["kind"]=="not_moving"
    assert progress_branch("寅","酉",True)["kind"]=="neither"
    with pytest.raises(ValueError):
        progress_branch("甲","申",True)


def test_real_hexagram_heng_changes_at_fifth_line_from_shen_to_you():
    # 雷风恒 -> 泽风大过, fifth line is 官鬼申金 -> 官鬼酉金.
    c=cast_six_yao([8,7,7,7,6,8],"癸卯","申","官鬼")
    progress=c["progression_review"]
    fifth=progress["rows"][4]
    assert c["ben_gua"]["name"]=="恒"
    assert c["bian_gua"]["name"]=="大过"
    assert fifth["original_branch"]=="申"
    assert fifth["transformed_branch"]=="酉"
    assert fifth["label"]=="化进神"
    assert progress["primary_advances"]==[5]
    assert len(progress["primary_retreats"])==0
    assert fifth["day_known"] and fifth["month_known"]
    assert c["joint_overview"]["rows"][4]["self_change"]["progression_kind"]=="advance"
    assert any("5爻" in s and "化进神" in s for s in
               c["review_flow"]["report"]["progression_digest"])
    assert progress["fortune_conclusion"] is None


def test_reverse_change_is_retreat_and_only_fifth_is_evaluated():
    # 泽风大过 -> 雷风恒
    c=cast_six_yao([8,7,7,7,9,8],focus_liuqin="官鬼")
    fifth=c["progression_review"]["rows"][4]
    assert fifth["original_branch"]=="酉"
    assert fifth["transformed_branch"]=="申"
    assert fifth["kind"]=="retreat"
    assert c["progression_review"]["primary_retreats"]==[5]
    assert fifth["day_known"] is False and fifth["month_known"] is False
    assert fifth["original_void"] is None
    assert len(fifth["cautions"])>=2
    for i,row in enumerate(c["progression_review"]["rows"]):
        if i!=4:
            assert row["kind"]=="not_moving"
            assert not row["is_actual_change"]
            assert row["transformed_void"] is None
    assert c["joint_overview"]["effective_strength_computed"] is False


def test_all_64_hexagrams_each_single_mover_never_count_static_comparisons():
    from app.core.hexagrams import TRIGRAMS
    for low in TRIGRAMS.values():
        for high in TRIGRAMS.values():
            bits=low["lines"]+high["lines"]
            for i in range(6):
                seq=[7 if b else 8 for b in bits]
                seq[i]=9 if bits[i] else 6
                c=cast_six_yao(seq)
                r=c["progression_review"]["rows"]
                assert len(r)==6
                assert sum(x["is_actual_change"] for x in r)==1
                assert all(x["kind"]=="not_moving" for j,x in enumerate(r) if j!=i)
                assert c["progression_review"]["fortune_conclusion"] is None
