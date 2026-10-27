"""V40 锚点：起卦来源、六爻位序、核心盘契约、异常输入。"""
import pytest
from fastapi.testclient import TestClient

from app.core.liuyao import cast_six_yao
from app.main import app

COINS = [[3,3,3], [2,2,3], [2,3,3], [2,2,2], [3,2,2], [3,3,2]]
NUMBERS = [9,7,8,6,7,8]


def test_core_chart_and_throw_receipt_are_replayable():
    result = cast_six_yao(NUMBERS, day_ganzhi="甲子", month_branch="午",
                          coin_tosses=COINS)
    core = result["core_chart"]
    assert core["schema_version"] == "liuyao-core/1.0"
    assert core["order"] == "bottom_to_top"
    assert core["moving_positions"] == [1,4]
    assert core["casting_record"]["recorded_coins"] == 6
    assert core["casting_record"]["manual_entries"] == 0
    assert [x["faces"] for x in core["casting_record"]["throws"]] == COINS
    assert [x["number"] for x in core["rows"]] == NUMBERS
    assert [x["position"] for x in core["rows"]] == [1,2,3,4,5,6]
    assert core["calendar"] == {
        "day_ganzhi": "甲子", "month_branch": "午", "source": "manual"
    }
    assert core["ben_gua"]["name"] == result["ben_gua"]["full_name"]
    assert core["bian_gua"]["name"] == result["bian_gua"]["full_name"]
    assert [x["ben_bit"] for x in core["rows"]] == result["ben_gua"]["lines_bottom_to_top"]
    assert [x["bian_bit"] for x in core["rows"]] == result["bian_gua"]["lines_bottom_to_top"]
    assert core["palace"]["shi_position"] == result["eight_palaces"]["ben"]["shi_position"]
    assert core["palace"]["ying_position"] == result["eight_palaces"]["ben"]["ying_position"]
    for i,row in enumerate(core["rows"]):
        assert row["najia"] == result["najia_lines"][i]["ganzhi"]
        assert row["changed_najia"] == result["bian_najia_lines"][i]["ganzhi"]
        assert row["liuqin"] == result["najia_lines"][i]["liuqin"]
        assert row["role"] == result["najia_lines"][i]["role"]
        assert row["moving"] == (i in (0,3))
    assert core["limits"]["fortune_conclusion"] is None
    assert core["limits"]["timing_conclusion"] is None


def test_manual_and_legacy_inputs_are_not_falsely_described_as_coin_tosses():
    mixed = cast_six_yao([7]*6, coin_tosses=[[2,2,3],None,None,None,None,None])
    record = mixed["core_chart"]["casting_record"]
    assert record["recorded_coins"] == 1
    assert record["manual_entries"] == 5
    assert record["unknown_sources"] == 0
    assert record["throws"][1]["source"] == "manual_number"

    legacy = cast_six_yao([7]*6)
    assert legacy["core_chart"]["casting_record"]["unknown_sources"] == 6
    assert all(x["coin_source"] == "unspecified" for x in legacy["core_chart"]["rows"])
    assert legacy["core_chart"]["calendar"]["source"] == "not_provided"
    assert legacy["core_chart"]["rows"][0]["liushen"] is None
    assert legacy["core_chart"]["rows"][0]["xunkong"] is None


@pytest.mark.parametrize("faces", [
    [[3,3,3]]*5,
    [[3,3,3]]*7,
    [[3,3,2]]+COINS[1:],   # 8 与给定老阳 9 不符
    [[2,2,2,2]]+COINS[1:],
    [[2,2,4]]+COINS[1:],
    [[2,2,True]]+COINS[1:],
    [[2.0,3,3]]+COINS[1:],
])
def test_invalid_coin_histories_are_rejected(faces):
    with pytest.raises(ValueError):
        cast_six_yao(NUMBERS, coin_tosses=faces)


def test_api_rejects_inconsistent_provenance_without_500():
    c = TestClient(app)
    wrong = c.post("/api/liuyao/cast",json={
        "numbers":NUMBERS, "coin_tosses":[[3,3,2]]+COINS[1:]
    })
    assert wrong.status_code == 422
    assert "合计" in str(wrong.json()["detail"])
    good = c.post("/api/liuyao/cast",json={
        "numbers":NUMBERS, "coin_tosses":COINS
    })
    assert good.status_code == 200
    assert good.json()["core_chart"]["casting_record"]["recorded_coins"] == 6
    assert good.json()["core_chart"]["calendar"]["source"] == "not_provided"


def test_all_64_hexagrams_keep_six_rows_and_palace_roles():
    from app.core.najia import PALACE_BY_LINES
    for bits in PALACE_BY_LINES:
        # 7=阳静，8=阴静，正反卦相同
        numbers = [7 if bit else 8 for bit in bits]
        core = cast_six_yao(numbers)["core_chart"]
        assert core["ben_gua"]["bits"] == list(bits)
        assert core["bian_gua"]["bits"] == list(bits)
        assert core["moving_positions"] == []
        assert len(core["rows"]) == 6
        assert sum(x["role"] == "世" for x in core["rows"]) == 1
        assert sum(x["role"] == "应" for x in core["rows"]) == 1
