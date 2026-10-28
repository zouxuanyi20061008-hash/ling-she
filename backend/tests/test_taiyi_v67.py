"""V67 original 庚辰/辛未定计眼 + 199 annual boards and 中五不出 evidence."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.taiyi import year_board
from app.core.taiyi_v65 import INDEX
from app.core.taiyi_v67 import (
 SIX_HARMONY,locate_dingji_eye,calculate_dingji)

def test_wubeizhi_gengchen_year_dingji_original_16_lushen():
    # 庚辰年, 太乙七宫, 文昌坤·大武；酉合加辰 -> 下临寅吕申.
    v=calculate_dingji("辰",INDEX["坤"],7)
    assert v["harmony_branch"]=="酉"
    assert (v["dingji_ground_direction"],v["dingji_ground_god"])==("寅","吕申")
    assert v["status"]=="computed"
    assert (v["count"],v["main_general"],v["assistant_general"])==(16,6,8)
    assert [(p["direction"],p["added"]) for p in v["trace"] if p["added"]]==[
       ("寅",1),("卯",4),("巽",9),("午",2)]


def test_taiyi_zhijin_xinwei_year_dingji_24_dawwei():
    # 辛未年, 太乙三宫, 文昌巳·大神；午合加未 -> 午大威.
    v=calculate_dingji("未",INDEX["巳"],3)
    assert (v["harmony_branch"],v["dingji_ground_direction"])==("午","午")
    assert v["dingji_ground_god"]=="大威"
    assert (v["count"],v["main_general"],v["assistant_general"])==(24,4,2)
    assert [(p["direction"],p["added"]) for p in v["trace"] if p["added"]]==[
       ("午",2),("坤",7),("酉",6),("乾",1),("子",8)]


def test_six_harmonies_are_two_way_pairs_without_mapping_collisions():
    assert len(SIX_HARMONY)==12
    assert all(SIX_HARMONY[SIX_HARMONY[k]]==k for k in SIX_HARMONY)
    for b in SIX_HARMONY:
        x=locate_dingji_eye(b,INDEX["坤"])
        assert len(x["rotated_sixteen"])==16
        assert len(set(p["heaven"] for p in x["rotated_sixteen"]))==16
        assert next(p["heaven"] for p in x["rotated_sixteen"] if p["ground"]==b)==SIX_HARMONY[b]
        assert next(p["ground"] for p in x["rotated_sixteen"] if p["heaven"]=="坤")==x["dingji_ground_direction"]


def test_center_five_kept_as_a_general_without_moving_taiyi():
    a=year_board(2027)
    b=year_board(2028)
    assert a["version"]==b["version"]=="V67"
    assert a["main_guest"]["main_general"]["middle_palace_states"]["big"]["is_middle_five"]
    assert a["main_guest"]["main_general"]["middle_palace_states"]["assistant"]["is_middle_five"]
    assert b["main_guest"]["guest_general"]["middle_palace_states"]["big"]["is_middle_five"]
    assert b["main_guest"]["guest_general"]["middle_palace_states"]["assistant"]["is_middle_five"]
    for x in (a,b):
        assert not x["middle_five_states"]["taiyi_can_enter_center"]
        assert x["middle_five_states"]["case_count"]>=2
        center=next(p for p in x["nine_palaces"] if p["number"]==5)
        assert center["is_center_unoccupied"]
        assert center["any_general_five"]
        assert not center["is_taiyi"]


def test_conservative_dingji_special_stays_pending_if_starts_same_palace():
    a=calculate_dingji("子",INDEX["子"],8,"conservative")
    assert a["dingji_ground_direction"]=="丑"
    # choose explicit direct example with start equal to a Taiyi palace
    b=calculate_dingji("辰",INDEX["酉"],4,"conservative")
    assert b["status"] in ("pending","computed")
    with pytest.raises(ValueError):calculate_dingji("辰",INDEX["坤"],7,"fictional")


def test_all_199_years_have_valid_dingji_and_no_fake_five_palace_taiyi():
    computed=0;pending=0;fives=0
    for year in range(1901,2100):
        for mode in ("wubeizhi","conservative"):
            c=year_board(year,same_palace_rule=mode)
            assert c["version"]=="V67"
            d=c["dingji_v67"]
            assert len(d["rotated_sixteen"])==16
            assert d["harmony_branch"]==SIX_HARMONY[c["year"]["sexagenary_year"][1]]
            assert d["status"] in ("computed","pending")
            if d["status"]=="computed":
                computed+=1
                assert d["count"]==sum(x["added"] for x in d["trace"])
                assert 1<=d["main_general"]<=9
                assert 1<=d["assistant_general"]<=9
            else:
                pending+=1
                assert mode=="conservative"
                assert d["count"] is None
            assert not any(p["is_taiyi"] for p in c["nine_palaces"] if p["number"]==5)
            fives+=c["middle_five_states"]["case_count"]
    assert computed>0 and pending>0 and fives>0


def test_original_1561_1624_previous_host_guest_unchanged():
    for y,host,guest in ((1561,16,30),(1624,18,19)):
        c=year_board(y,historical=True)
        assert c["main_guest"]["main_calculated"]==host
        assert c["main_guest"]["guest_calculated"]==guest
        assert c["dingji_v67"]["status"]=="computed"
        assert c["fortune_verdict"] is None


def test_api_2026_version_and_dingji_with_option():
    cli=TestClient(app)
    default=cli.post("/api/taiyi/cast",json={"gregorian_year":2026})
    assert default.status_code==200,default.text
    d=default.json()
    assert d["version"]=="V67"
    assert d["has_annual_dingji"]
    assert d["dingji_v67"]["harmony_branch"]=="未"
    assert d["dingji_v67"]["count"]==22
    assert d["dingji_v67"]["main_general"]==2
    assert len(d["sixteen_spirits"])==16
    assert d["has_full_annual_chart"] is False
    conservative=cli.post("/api/taiyi/cast",json={
        "gregorian_year":2026,"same_palace_rule":"conservative"})
    assert conservative.status_code==200
    assert conservative.json()["version"]=="V67"


def test_bad_inputs_not_coerced():
    for bad in ("xyz",None):
        with pytest.raises(ValueError):locate_dingji_eye(bad,0)
    for bad in (True,-1,16,None):
        with pytest.raises(ValueError):locate_dingji_eye("辰",bad)
