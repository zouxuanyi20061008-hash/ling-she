"""V69 《全书》独立口诀与生年四化：不以被测实现生成真值。"""
from datetime import date,time
from fastapi.testclient import TestClient
import pytest
from app.main import app
from app.core.ziwei import cast_ziwei, BRANCHES

def chart(year=1980,month=1,day=4,hour=9,school="quanshu"):
    return cast_ziwei("lunar",None,year,month,day,False,time(hour),
                      "male","same_month",school)

def test_gengshen_1980_exact_auxiliary_and_four_labels_from_original_rhymes():
    a=chart()
    # 正月：辰左戌右；巳时：戌起逆五在巳、辰起顺五在酉；
    # 庚禄申、羊酉陀未、庚魁丑钺未、申年天马寅、亥起劫空五时卯未。
    assert a["calendar"]["solar_date"]=="1980-02-19"
    assert a["year_ganzhi"]=="庚申"
    assert a["auxiliary_star_positions"]=={
      "左辅":"辰","右弼":"戌","文昌":"巳","文曲":"酉",
      "禄存":"申","天魁":"丑","天钺":"未","天马":"寅",
      "擎羊":"酉","陀罗":"未","地劫":"辰","地空":"午",
    }
    assert a["auxiliary_star_count"]==12
    assert [(x["name"],x["star"],x["branch"]) for x in a["four_transformations"]]==[
      ("化禄","太阳","子"),("化权","武曲","亥"),
      ("化科","太阴","寅"),("化忌","天同","戌")]
    assert a["four_transform_disagreement"] is None
    assert [p["branch"] for p in a["palaces"]]==list(BRANCHES)
    assert sorted(p["name"] for p in a["palaces"])==sorted({
     "命宫","兄弟","夫妻","子女","财帛","疾厄","迁移","交友",
     "官禄","田宅","福德","父母"})
    assert sum(len(p["main_stars"]) for p in a["palaces"])==14
    assert sum(len(p["auxiliary_stars"]) for p in a["palaces"])==12
    assert sum(len(p["four_transformations"]) for p in a["palaces"])==4
    assert next(p for p in a["palaces"] if p["branch"]=="戌")["four_transformations"]==[
       {"name":"化忌","star":"天同"}]

# 与卷二四化口诀独立抄录。与现代通行表唯一不同：壬年化科是天府。
ORIGINAL_FOUR={
 "甲":("廉贞","破军","武曲","太阳"),"乙":("天机","天梁","紫微","太阴"),
 "丙":("天同","天机","文昌","廉贞"),"丁":("太阴","天同","天机","巨门"),
 "戊":("贪狼","太阴","右弼","天机"),"己":("武曲","贪狼","天梁","文曲"),
 "庚":("太阳","武曲","太阴","天同"),"辛":("巨门","太阳","文曲","文昌"),
 "壬":("天梁","紫微","天府","武曲"),"癸":("破军","巨门","太阴","贪狼"),
}

@pytest.mark.parametrize("offset",range(10))
def test_all_ten_year_stems_against_independent_four_transform_text(offset):
    # 1984甲子至1993癸酉，均为合法农历正月初四。
    a=chart(year=1984+offset)
    stem=a["year_ganzhi"][0]
    assert stem=="甲乙丙丁戊己庚辛壬癸"[offset]
    assert tuple(x["star"] for x in a["four_transformations"])==ORIGINAL_FOUR[stem]
    assert [x["name"] for x in a["four_transformations"]]==["化禄","化权","化科","化忌"]
    assert all(x["branch"]==a["all_star_positions"][x["star"]] for x in a["four_transformations"])
    assert len(a["all_star_positions"])==26
    assert len(a["palaces"])==12
    assert not any(x["star"] not in a["all_star_positions"] for x in a["four_transformations"])

def test_ren_disagreement_switch_does_not_move_main_or_auxiliary_stars():
    classic=chart(year=1992,school="quanshu")
    modern=chart(year=1992,school="common")
    assert classic["year_ganzhi"]=="壬申"
    assert classic["four_transformations"][2]["star"]=="天府"
    assert modern["four_transformations"][2]["star"]=="左辅"
    assert classic["four_transform_disagreement"]["quanshu_star"]=="天府"
    assert modern["four_transform_disagreement"]["common_star"]=="左辅"
    assert classic["four_transform_disagreement"]["chosen_star"]=="天府"
    assert modern["four_transform_disagreement"]["chosen_star"]=="左辅"
    assert classic["star_positions"]==modern["star_positions"]
    assert classic["auxiliary_star_positions"]==modern["auxiliary_star_positions"]
    assert [x["star"] for x in classic["four_transformations"] if x["name"]!="化科"]==[
       x["star"] for x in modern["four_transformations"] if x["name"]!="化科"]
    assert classic["four_transformations"][2]["branch"]==classic["star_positions"]["天府"]
    assert modern["four_transformations"][2]["branch"]==modern["auxiliary_star_positions"]["左辅"]

def test_hours_months_and_lunar_leap_school_change_only_relevant_stars():
    a=chart(hour=0)
    b=chart(hour=2)
    assert (a["auxiliary_star_positions"]["文昌"],a["auxiliary_star_positions"]["文曲"])==("戌","辰")
    assert (b["auxiliary_star_positions"]["文昌"],b["auxiliary_star_positions"]["文曲"])==("酉","巳")
    assert a["auxiliary_star_positions"]["禄存"]==b["auxiliary_star_positions"]["禄存"]
    feb=chart(month=2)
    assert (feb["auxiliary_star_positions"]["左辅"],feb["auxiliary_star_positions"]["右弼"])==("巳","酉")
    leap_a=cast_ziwei("solar",date(2020,5,23),None,None,None,False,time(12),
                      "unspecified","same_month")
    leap_b=cast_ziwei("solar",date(2020,5,23),None,None,None,False,time(12),
                      "unspecified","next_month")
    assert leap_a["calendar"]["lunar"]==leap_b["calendar"]["lunar"]
    assert leap_a["auxiliary_star_positions"]["左辅"]=="未"  # 闰四月沿四月
    assert leap_b["auxiliary_star_positions"]["左辅"]=="申"  # 闰四月按五月
    assert leap_a["auxiliary_star_positions"]["文昌"]==leap_b["auxiliary_star_positions"]["文昌"]
    assert leap_a["star_positions"]!=leap_b["star_positions"]

def test_api_explicit_school_option_and_rejects_unrecognized_school():
    client=TestClient(app)
    request={"calendar_type":"lunar","lunar_year":1992,
             "lunar_month":1,"lunar_day":4,"clock":"09:00"}
    default=client.post("/api/ziwei/cast",json=request)
    assert default.status_code==200,default.text
    assert default.json()["version"]=="V69"
    assert default.json()["four_transformations"][2]["star"]=="天府"
    common=client.post("/api/ziwei/cast",json={**request,"four_transform_school":"common"})
    assert common.status_code==200,common.text
    assert common.json()["four_transformations"][2]["star"]=="左辅"
    for bad in ["random","",None,42]:
        invalid=client.post("/api/ziwei/cast",json={**request,"four_transform_school":bad})
        assert invalid.status_code==422

def test_chinese_book_lucun_yangtuo_and_xin_year_variant_marking():
    gui=chart(year=1993)
    assert gui["year_ganzhi"][0]=="癸"
    assert (gui["auxiliary_star_positions"]["禄存"],
            gui["auxiliary_star_positions"]["擎羊"],
            gui["auxiliary_star_positions"]["陀罗"])==("子","丑","亥")
    xin=chart(year=1991)
    assert xin["year_ganzhi"][0]=="辛"
    assert (xin["auxiliary_star_positions"]["天魁"],
            xin["auxiliary_star_positions"]["天钺"])==("寅","午")
    assert any("辛年" in w for w in xin["warnings"])
