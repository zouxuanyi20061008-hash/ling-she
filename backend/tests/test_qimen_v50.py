"""V50 奇门地盘真实起局与原典校验：不允许天盘/实际八门冒充已排。"""
from datetime import date,time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.qimen import _plate,cast_qimen,fu_tou,hour_ganzhi,LO_SHU,TERM_JU
from app.core.calendar import SIXTY_DAYS


def test_ancient_yuanlingjing_mangzhong_guihai_bingchen_example():
    # 《奇门遁甲元灵经》卷一：芒种后癸亥日丙辰时，下元阳遁九局。
    r=_plate("芒种","癸亥","丙辰")
    assert (r["yuan"],r["ju_label"],r["day_fu_tou"])==("下元","阳遁9局","己未")
    assert r["earth_plate"]=={
        "1":"己","2":"庚","3":"辛","4":"壬","5":"癸",
        "6":"丁","7":"丙","8":"乙","9":"戊"}
    assert r["duty_origin"]=={
        "time_xun":"甲寅","concealed_stem":"癸",
        "earth_origin_palace":5,"origin_star":"天禽",
        "origin_door":"死门","door_borrow_palace":2,
        "rotated_star_palace":None,"rotated_door_palace":None,
        "sky_plate_computed":False,"gates_rotated":False}
    assert r["has_complete_rotating_plate"] is False


def test_ancient_yuanlingjing_shuangjiang_jiayin_xinwei_example():
    # 《元灵经》：霜降后甲寅日辛未时，阴遁八局；
    # 戊艮己兑庚乾辛中壬巽癸震；三奇乙离丙坎丁坤。
    r=_plate("霜降","甲寅","辛未")
    assert (r["yuan"],r["ju_label"])==("中元","阴遁8局")
    assert r["earth_plate"]=={
        "1":"丙","2":"丁","3":"癸","4":"壬","5":"辛",
        "6":"庚","7":"己","8":"戊","9":"乙"}
    assert r["duty_origin"]["time_xun"]=="甲子"
    assert r["duty_origin"]["earth_origin_palace"]==8
    assert r["duty_origin"]["origin_star"]=="天任"
    assert r["duty_origin"]["origin_door"]=="生门"


def test_all_24_terms_three_yuan_earthplates_18_jus_consistent():
    assert len(TERM_JU)==24
    seen=set()
    for term,(direction,nums) in TERM_JU.items():
        for yuan,day in (("上元","甲子"),("中元","甲寅"),("下元","甲辰")):
            r=_plate(term,day,"甲子")
            assert r["yuan"]==yuan
            assert r["ju_number"]==nums[("上元","中元","下元").index(yuan)]
            assert r["yin_yang_dun"]==direction+"遁"
            assert set(r["earth_plate"].values())==set("戊己庚辛壬癸丁丙乙")
            assert [x["number"] for x in r["palaces"]]==list(LO_SHU)
            assert all(p["actual_gate"] is None and p["actual_star"] is None
                       and p["sky_stem"] is None for p in r["palaces"])
            assert r["fortune_conclusion"] is None
            seen.add(r["ju_label"])
    assert len(seen)==18


def test_futou_follows_5day_ganzhi_not_5days_after_solar_term():
    assert fu_tou("癸亥")=={"ganzhi":"己未","yuan":"下元","day_offset":4}
    assert fu_tou("乙丑")["ganzhi"]=="甲子"
    assert fu_tou("己巳")["yuan"]=="中元"
    with pytest.raises(ValueError):
        fu_tou("甲丑")


def test_five_rat_hour_ganzhi_all_days_and_hours_are_60valid():
    for day in SIXTY_DAYS:
        for hour in range(24):
            assert hour_ganzhi(day,hour) in SIXTY_DAYS
    assert hour_ganzhi("癸亥",7)=="丙辰"
    assert hour_ganzhi("甲寅",13)=="辛未"
    assert hour_ganzhi("甲子",23)=="甲子"


def test_actual_beijing_timestamp_changes_term_at_lichun_but_not_automatically_day():
    before=cast_qimen(date(2026,2,4),time(3,30))
    after=cast_qimen(date(2026,2,4),time(4,30))
    assert before["solar_term"]=="大寒"
    assert after["solar_term"]=="立春"
    assert before["day_ganzhi"]==after["day_ganzhi"]
    assert before["input_provenance"]["beijing_time"].endswith("+08:00")
    assert after["state"]=="earth_plate_computed_sky_gate_pending"
    assert all(r["actual_gate"] is None for r in after["palaces"])


def test_23_hour_day_boundary_is_explicit_and_changes_derived_hour():
    midnight=cast_qimen(date(2026,2,4),time(23,30),"midnight")
    zi_hour=cast_qimen(date(2026,2,4),time(23,30),"zi_hour")
    assert midnight["day_ganzhi"]!=zi_hour["day_ganzhi"]
    assert midnight["hour_ganzhi"]!=zi_hour["hour_ganzhi"]
    assert midnight["input_provenance"]["warnings"]


def test_qimen_api_rejects_unknown_boundary_and_bad_date():
    client=TestClient(app)
    payload={"solar_date":"2026-02-04","clock":"04:30","day_boundary":"zi_hour"}
    r=client.post("/api/qimen/cast",json=payload)
    assert r.status_code==200,r.text
    result=r.json()
    assert result["solar_term"]=="立春"
    assert result["earth_plate"]["1"]
    assert result["has_complete_rotating_plate"] is False
    for override in ({"solar_date":"2026-02-30"},{"day_boundary":"wrong"},
                     {"clock":"25:00"},{"solar_date":"2101-01-01"}):
        bad=client.post("/api/qimen/cast",json={**payload,**override})
        assert bad.status_code==422
