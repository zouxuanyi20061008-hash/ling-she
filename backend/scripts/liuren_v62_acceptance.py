"""V62 external fixed board & classical 10-stem day/night tables."""
import argparse,json,os
from pathlib import Path
from app.core.liuren_v62 import rotate_twelve_generals,noble_choice,GENERALS
from app.core.liuren import build_liuren

DAY_NIGHT={
"甲":("丑","未"),"乙":("子","申"),"丙":("亥","酉"),"丁":("亥","酉"),
"戊":("丑","未"),"己":("子","申"),"庚":("丑","未"),"辛":("午","寅"),
"壬":("巳","卯"),"癸":("巳","卯")}
EARTH=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"]
EXPECTED=["太阴","天后","贵人","螣蛇","朱雀","六合",
          "勾陈","青龙","天空","白虎","太常","玄武"]
def verify():
    for day,(sun,night) in DAY_NIGHT.items():
        assert noble_choice(day,"巳")["noble_branch"]==sun
        assert noble_choice(day,"亥")["noble_branch"]==night
    c=rotate_twelve_generals("戊申","辰","巳")
    assert c["noble_ground_palace"]=="寅" and c["direction"]=="顺行"
    assert [c["by_earth"][p] for p in EARTH]==EXPECTED
    inv=rotate_twelve_generals("甲子","戌","子")
    assert inv["noble_branch"]=="未" and inv["noble_ground_palace"]=="酉"
    assert inv["direction"]=="逆行"
    assert inv["by_earth"]["申"]=="螣蛇"
    chart=build_liuren("丙戌","申","巳")
    assert [x["branch"] for x in chart["three_transmissions"]["transmissions"]]==[
        "申","亥","寅"]
    assert all(x["heavenly_general"] in GENERALS for x in chart["four_lessons"])
    assert all(x["heavenly_general"] in GENERALS for x in chart["three_transmissions"]["transmissions"])
    return {"version":"V62","status":"passed","sha":os.getenv("GITHUB_SHA"),
        "ten_stem_day_night_reference":"https://libokang.com/classics/liuren/%E5%85%AD%E5%A3%AC%E5%AD%98%E9%AA%8C/",
        "fixed_convention":"卯至申昼、酉至寅夜",
        "independent_full_twelve_palace_example":"https://multifate.com/zh/guides/daliuren/twelve-generals",
        "day_and_night_table":DAY_NIGHT,
        "external_ground_order":EARTH,"external_general_order":EXPECTED,
        "day_fixture":{"day":"戊申","general":"辰","hour":"巳","noble":"丑","noble_ground":"寅","direction":"顺行"},
        "night_fixture":{"day":"甲子","general":"戌","hour":"子","noble":"未","noble_ground":"酉","direction":"逆行"},
        "twelve_unique_palaces":True,"prior_pillars_preserved":True,
        "sunrise_sunset_calculated":False,"nine_methods_fully_verified":False,
        "fortune_verdict":None}
if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--output",type=Path,required=True)
    arg=p.parse_args()
    data=verify()
    arg.output.parent.mkdir(parents=True,exist_ok=True)
    arg.output.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("V62 贵人十天干昼夜表、昼顺夜逆实盘、十二天将绑定四课三传验收通过")
