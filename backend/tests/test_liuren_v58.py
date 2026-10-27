"""V58 古籍实例验证天地盘四课及可确证的三传，不臆造其余九宗门。"""
from datetime import date,time,datetime,timedelta
import pytest
from fastapi.testclient import TestClient
from lunar_python import Solar
from app.main import app
from app.core.liuren import (
    GENERALS,LODGES,sky_plate,four_lessons,build_liuren,cast_liuren,hour_branch)
from app.core.calendar import BRANCHES,SIXTY_DAYS


def test_twelve_month_general_matches_classic_middle_qi_order():
    assert [(x,a) for x,(a,_) in GENERALS.items()]==[
      ("雨水","亥"),("春分","戌"),("谷雨","酉"),("小满","申"),
      ("夏至","未"),("大暑","午"),("处暑","巳"),("秋分","辰"),
      ("霜降","卯"),("小雪","寅"),("冬至","丑"),("大寒","子")]
    assert LODGES=={"甲":"寅","乙":"辰","丙":"巳","戊":"巳","丁":"未",
       "己":"未","庚":"申","辛":"戌","壬":"亥","癸":"丑"}


def test_source_liuren_guide_jiashen_hai_general_chou_hour_all_four_lessons():
    # 《御定六壬直指·取四课法》甲申日，亥将丑时。
    c=build_liuren("甲申","亥","丑")
    assert [(x["upper"],x["lower"]) for x in c["four_lessons"]]==[
       ("子","甲"),("戌","子"),("午","申"),("辰","午")]
    assert c["heaven_plate"]["丑"]=="亥"
    assert c["heaven_plate"]["寅"]=="子"
    assert c["three_transmissions"]["status"]=="pending"
    assert c["three_transmissions"]["method"]=="需涉害判深浅"


def test_source_liuren_daquan_bingxu_reexamination_three_transmissions():
    # 《袖里乾坤·九宗门》原典案：丙戌日巳时申将，三传申亥寅。
    c=build_liuren("丙戌","申","巳")
    assert [(x["upper"],x["lower"]) for x in c["four_lessons"]]==[
       ("申","丙"),("亥","申"),("丑","戌"),("辰","丑")]
    assert [x["relation"] for x in c["four_lessons"]]==[
       "下贼上","无直接克","无直接克","无直接克"]
    assert c["three_transmissions"]["status"]=="computed"
    assert c["three_transmissions"]["method"].startswith("下贼上")
    assert [x["branch"] for x in c["three_transmissions"]["transmissions"]]==[
        "申","亥","寅"]


def test_source_liuren_shuoyue_jiazi_hai_general_zi_hour_biyong():
    # 《大六壬说约》甲子日子时亥将：四课丑甲、子丑、亥子、戌亥。
    c=build_liuren("甲子","亥","子")
    assert [(x["upper"],x["lower"]) for x in c["four_lessons"]]==[
       ("丑","甲"),("子","丑"),("亥","子"),("戌","亥")]
    assert c["three_transmissions"]["status"]=="computed"
    assert c["three_transmissions"]["method"].startswith("比用")
    assert [x["branch"] for x in c["three_transmissions"]["transmissions"]]==[
       "子","亥","戌"]


def test_fuyin_fanyin_special_methods_now_compute_only_verified_cases():
    for hour,general in [("子","子"),("子","午")]:
        c=build_liuren("甲子",general,hour)
        assert c["three_transmissions"]["status"]=="computed"
        assert len(c["three_transmissions"]["transmissions"])==3


def test_all_60days_12hour_generals_never_use_invalid_branch_or_unverified_choice():
    for d in SIXTY_DAYS:
        for hr in BRANCHES:
            for general in BRANCHES:
                c=build_liuren(d,general,hr)
                assert len(c["palaces"])==12 and len(c["four_lessons"])==4
                assert c["heaven_plate"][hr]==general
                assert set(c["heaven_plate"].values())==set(BRANCHES)
                t=c["three_transmissions"]
                if t["status"]=="computed":
                    assert len(t["transmissions"])==3
                    assert t["selected_initial"] in t["initial_candidates"]
                else:assert t["transmissions"] is None
                assert c["fortune_verdict"] is None


def test_hour_branch_and_midnight_zi_boundary():
    assert hour_branch(time(23))=="子"
    assert hour_branch(time(0))=="子"
    assert hour_branch(time(1))=="丑"
    assert hour_branch(time(22))=="亥"
    assert cast_liuren(date(2023,2,24),time(23),"midnight")["day_ganzhi"]=="癸丑"
    assert cast_liuren(date(2023,2,24),time(23),"zi_hour")["day_ganzhi"]=="甲寅"


def test_exact_qi_boundary_writes_month_general_not_12_jie_month():
    """Calculate actual 雨水 instant from independent lunar-python JieQi library."""
    qi=Solar.fromYmdHms(2026,2,10,12,0,0).getLunar().getNextQi(False)
    assert qi.getName()=="雨水"
    moment=datetime.strptime(qi.getSolar().toYmdHms(),"%Y-%m-%d %H:%M:%S")
    before=moment-timedelta(seconds=1)
    after=moment+timedelta(seconds=1)
    a=cast_liuren(before.date(),before.time())
    b=cast_liuren(after.date(),after.time())
    assert a["month_general"]=="子" and b["month_general"]=="亥"
    assert a["calendar_provenance"]["previous_middle_term"]["name"]=="大寒"
    assert b["calendar_provenance"]["previous_middle_term"]["name"]=="雨水"


def test_end_to_end_api_and_invalid_date_clock():
    client=TestClient(app)
    r=client.post("/api/liuren/cast",json={
       "solar_date":"2026-03-20","clock":"12:00","day_boundary":"midnight"})
    assert r.status_code==200,r.text
    j=r.json()
    assert j["version"]=="V59" and len(j["four_lessons"])==4
    assert len(j["heaven_plate"])==12
    assert j["heaven_plate"][j["hour_branch"]]==j["month_general"]
    for bad in [
        {"solar_date":"2026-02-30"},{"clock":"27:00"},
        {"clock":"12:00+09:00"},{"day_boundary":"unknown"}
    ]:
        res=client.post("/api/liuren/cast",json={
           "solar_date":"2026-03-20","clock":"12:00","day_boundary":"midnight",**bad})
        assert res.status_code==422,res.text
