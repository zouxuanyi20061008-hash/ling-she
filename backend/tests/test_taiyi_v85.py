"""V85 《金镜式经》独立阴遁第315时例、六纪三相假设及不移植将位的护栏。"""
from copy import deepcopy
from datetime import date, time, timedelta
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.taiyi_hour_v77 import hour_basic_board, _jieqi
from app.core.taiyi_hour_v78 import classical_hour_ju, hour_wenchang_from_count
from app.core.taiyi_hour_v79 import calculate_hour_main_guest
from app.core.taiyi_hour_v85 import (
    independent_yin_315_witness,three_historical_ji_phase_hypotheses,
    decorate_taiyi_v85,YIN_315,JI_SEEDS,independent_historical_six_ji_starts
)

def test_genuine_independent_yin_315_full_taiyi_hour_case_not_ju_27():
    w=independent_yin_315_witness()
    assert w["version"]=="V85"
    assert w["status"]=="verified_independent_yin_315_witness"
    assert w["expected"]==w["actual"]
    assert w["actual"]=={key:YIN_315[key] for key in w["actual"]}
    assert w["actual"]["in_cycle_360"]==315
    assert w["actual"]["six_ji_number"]==6
    assert w["actual"]["five_yuan_name"]=="壬子元"
    assert w["actual"]["ju"]==27
    assert w["actual"]["taiyi_palace"]==9
    assert w["actual"]["wenchang_god"]=="大武"
    assert w["actual"]["wenchang_direction"]=="坤"
    assert w["actual"]["jishen"]=="午"
    assert w["actual"]["shiji_god"]=="高丛"
    assert w["actual"]["shiji_direction"]=="卯"
    assert (w["actual"]["main_count"],w["actual"]["guest_count"])==(29,4)
    assert (w["actual"]["main_general"],w["actual"]["main_assistant"])==(9,7)
    assert (w["actual"]["guest_general"],w["actual"]["guest_assistant"])==(4,2)
    assert sum(s["added"] for s in w["main_trace"])==29
    assert sum(s["added"] for s in w["guest_trace"])==4
    assert w["not_a_modern_solstice_clock_anchor"]
    assert w["local_ju_27_must_not_be_used_as_total_315"]

def test_local_27_must_not_be_mistaken_for_sixth_ji_315():
    right=classical_hour_ju(315,"阴遁")
    false=classical_hour_ju(27,"阴遁")
    assert right["ju"]==false["ju"]==27
    assert right["six_ji_number"]==6
    assert false["six_ji_number"]==1
    assert right["five_yuan_name"]=="壬子元"
    assert false["five_yuan_name"]=="甲子元"
    # 315-27=288，恰为24、18、12位环的公倍数：
    # 局部太乙/文昌/计神/主客算可以全同，却绝不代表元纪相同。
    assert right["time_wenchang"]["god"]==false["time_wenchang"]["god"]
    assert right["taiyi_palace"]==false["taiyi_palace"]
    assert right["time_jishen"]==false["time_jishen"]
    assert right["hour_ganzhi_from_jiazi_start"]!=false["hour_ganzhi_from_jiazi_start"]
    assert calculate_hour_main_guest(right)["main_calculated"]==29
    assert calculate_hour_main_guest(false)["main_calculated"]==29

@pytest.mark.parametrize("dun,palaces,eyes,jishen",[
    ("阳遁",(1,6,1,6,1,6),("武德","地主","大炅","武德","地主","大炅"),"寅"),
    ("阴遁",(9,4,9,4,9,4),("吕申","大威","阴德","吕申","大威","阴德"),"申"),
])
def test_six_historical_ji_start_palace_eye_and_jishen_from_original(dun,palaces,eyes,jishen):
    w=independent_historical_six_ji_starts(dun)
    assert w["status"]=="verified_historical_zhangliang_six_ji_starts"
    assert not w["modern_solstice_ji_phase_verified"]
    assert not w["may_be_used_as_modern_qiying_anchor"]
    rows=w["rows"]
    assert [r["first_hour_in_360"] for r in rows]==[1,61,121,181,241,301]
    assert tuple(r["taiyi_palace"] for r in rows)==palaces
    assert tuple(r["wenchang_god"] for r in rows)==eyes
    assert {r["jishen"] for r in rows}=={jishen}
    for r in rows:
        assert not r["is_modern_qiying_initial_hour"]
        c=classical_hour_ju(r["first_hour_in_360"],dun)
        assert r["ji_number"]==c["six_ji_number"]
        assert r["taiyi_palace"]==c["taiyi_palace"]["number"]
        assert r["wenchang_god"]==c["time_wenchang"]["god"]
    with pytest.raises(ValueError,match="V85"):
        independent_historical_six_ji_starts("无效遁")

@pytest.mark.parametrize("mode,term,seeds",[
    ("阳遁","冬至",("武德","地主","大炅")),
    ("阴遁","夏至",("吕申","大威","阴德")),
])
def test_three_sources_are_historical_ji_seeds_not_known_qiying_phase(mode,term,seeds):
    assert JI_SEEDS[mode]==seeds
    for phase,seed in enumerate(seeds):
        assert hour_wenchang_from_count(1+60*phase,mode)["god"]==seed
    result=three_historical_ji_phase_hypotheses(1,mode,term)
    assert result["historical_three_seeds"]==list(seeds)
    assert not result["historical_ji_origin_witness"]["may_be_used_as_modern_qiying_anchor"]
    assert result["six_ji_seed_cycle"]=={
       "ji_1":seeds[0],"ji_2":seeds[1],"ji_3":seeds[2],
       "ji_4":seeds[0],"ji_5":seeds[1],"ji_6":seeds[2]}
    assert [s["first_eye_in_historical_ji"] for s in result["hypotheses"]]==list(seeds)
    assert [s["conditional_60_hour_phase_offset"] for s in result["hypotheses"]]==[0,60,120]
    assert [s["hypothetical_ji_numbers"] for s in result["hypotheses"]]==[
       [1,4],[2,5],[3,6]]
    assert result["number_of_conditional_phases"]==3
    assert result["hypotheses_not_exhaustive_for_arbitrary_unknown_epoch_offset"]
    assert result["cannot_assign_modern_solstice_to_ji_1_2_or_3"]
    assert result["preferred_phase"] is None
    assert result["confirmed_qiying_wenchang"] is None
    assert result["confirmed_qiying_shiji"] is None
    assert result["confirmed_qiying_main_general"] is None
    assert result["confirmed_qiying_guest_general"] is None
    assert result["fortune_verdict"] is None

@pytest.mark.parametrize("mode,term",[
    ("阳遁","冬至"),("阴遁","夏至")
])
def test_all_360_each_dun_three_hypotheses_no_faked_initial_general(mode,term):
    pending=0;computed=0
    for count in range(1,361):
        x=three_historical_ji_phase_hypotheses(count,mode,term)
        assert x["relative_hours"]==count
        assert x["number_of_conditional_phases"]==3
        assert len({q["wenchang"]["index"] for q in x["hypotheses"]})==3
        assert x["confirmed_qiying_main_general"] is None
        assert x["confirmed_qiying_guest_general"] is None
        assert x["preferred_phase"] is None
        assert x["all_conditions_keep_original_qiying_taiyi_jishen"]
        for i,q in enumerate(x["hypotheses"]):
            assert q["taiyi_palace"]==x["qiying_taiyi_palace"]
            assert q["jishen"]==x["qiying_jishen"]
            assert q["conditional_hour_count"]==count+60*i
            assert q["wenchang"]["god"]==hour_wenchang_from_count(count+60*i,mode)["god"]
            assert q["has_verified_qiying_phase_anchor"] is False
            assert q["is_only_a_conditional_model"]
            for which in ("main","guest"):
                side=q[which]
                if side["status"]=="computed":
                    computed+=1
                    assert side["count"]==sum(e["added"] for e in side["trace"])
                    assert 1<=side["big_general"]<=9
                    assert 1<=side["assistant_general"]<=9
                else:
                    pending+=1
                    assert side["status"]=="pending"
                    assert side["count"] is None
                    assert side["big_general"] is None
                    assert side["assistant_general"] is None
    assert computed>0 and pending>0

def test_recent_true_solstices_remain_independent_of_historical_ji_phases():
    for name,month in (("冬至",12),("夏至",6)):
        mark=_jieqi(2026,name,month)
        for seconds in (-1,1):
            at=mark+timedelta(seconds=seconds)
            chart=hour_basic_board(at.date(),at.time())
            x=chart["hour_v85_phase_hypotheses"]
            qi=chart["hour_v84_qiying_plate"]["qiying"]
            assert x["relative_hours"]==qi["relative_hours"]
            assert x["qiying_taiyi_palace"]==qi["taiyi_palace"]["number"]
            assert x["qiying_jishen"]==qi["jishen"]
            assert chart["has_verified_qiying_main_guest"] is False
            assert chart["has_verified_qiying_wenchang"] is False
            assert qi["qiying_wenchang"] is None
            assert qi["qiying_main_general"]["palace"] is None
            assert qi["qiying_guest_general"]["palace"] is None
            assert chart["has_full_hour_chart"] is False
            if seconds==1:
                assert x["relative_hours"]==1

def test_tampered_claimed_qiying_wenchang_or_generals_cannot_be_accepted():
    base=hour_basic_board(date(2026,12,23),time(10,30))
    mutations=[
      ("qiying_wenchang",{"index":11,"god":"武德"}),
      ("qiying_shiji",{"index":4,"god":"高丛"}),
      ("qiying_main_general",{"palace":9}),
      ("qiying_guest_general",{"palace":3}),
    ]
    for field,value in mutations:
        tampered=deepcopy(base)
        if field in ("qiying_main_general","qiying_guest_general"):
            tampered["hour_v84_qiying_plate"]["qiying"][field].update(value)
        else:
            tampered["hour_v84_qiying_plate"]["qiying"][field]=value
        with pytest.raises(ValueError,match="V85"):
            decorate_taiyi_v85(tampered)
    tampered=deepcopy(base)
    tampered["qiying_plate_version"]="V83"
    with pytest.raises(ValueError,match="V85"):
        decorate_taiyi_v85(tampered)
    for value in (0,-1,True,"1"):
        with pytest.raises(ValueError):
            three_historical_ji_phase_hypotheses(value,"阳遁","冬至")
    for dun,term in (("阳遁","夏至"),("阴遁","冬至"),("虚遁","冬至")):
        with pytest.raises(ValueError):
            three_historical_ji_phase_hypotheses(1,dun,term)

def test_api_v85_preserves_v84_previous_jiazi_and_annual_year():
    client=TestClient(app)
    for d,clock in (("2026-10-28","17:30"),("2026-12-23","10:30"),
                    ("2026-06-22","09:30")):
        response=client.post("/api/taiyi/hour/cast",json={"solar_date":d,"clock":clock})
        assert response.status_code==200,response.text
        c=response.json()
        assert c["qiying_phase_review_version"]=="V85"
        assert c["hour_v85_independent_yin_witness"]["status"]=="verified_independent_yin_315_witness"
        assert c["hour_v85_phase_hypotheses"]["version"]=="V85"
        assert c["hour_v85_phase_hypotheses"]["preferred_phase"] is None
        assert len(c["hour_v85_phase_hypotheses"]["historical_ji_origin_witness"]["rows"])==6
        assert not c["hour_v85_phase_hypotheses"]["historical_ji_origin_witness"]["modern_solstice_ji_phase_verified"]
        assert c["has_verified_qiying_wenchang"] is False
        assert c["has_verified_qiying_main_guest"] is False
        assert c["has_full_hour_chart"] is False
        assert c["fortune_verdict"] is None
        assert c["hour_v84_qiying_plate"]["qiying"]["qiying_main_general"]["palace"] is None
    annual=client.post("/api/taiyi/cast",json={"gregorian_year":2026})
    assert annual.status_code==200
    assert annual.json()["version"]=="V67"
    assert "hour_v85_phase_hypotheses" not in annual.json()
