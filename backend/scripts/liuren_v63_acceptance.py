"""V63 classical 丙寅日 亥将申时 full transmission Xun Dun witness."""
from pathlib import Path
import argparse,json,os
from app.core.liuren import build_liuren
from app.core.liuren_v63 import calculate_xun_dun
from app.core.calendar import SIXTY_DAYS,XUNKONG

def verify():
    cases=[]
    for group in range(6):
        d=calculate_xun_dun(SIXTY_DAYS[group*10+2])
        assert tuple(d["empty_branches"])==XUNKONG[group]
        assert len(d["xun_days"])==10
        cases.append({"xun":d["xun_head"],"void":d["empty_branches"],
                      "xun_days":d["xun_days"]})
    chart=build_liuren("丙寅","亥","申")
    triple=chart["three_transmissions"]["transmissions"]
    assert [(p["branch"],p["xun_dun_stem"]) for p in triple]==[
        ("申","壬"),("亥",None),("寅","丙")]
    assert chart["xun_void_and_dun"]["empty_branches"]==["戌","亥"]
    assert chart["xun_void_and_dun"]["void_transmission_names"]==["中传"]
    assert len(chart["xun_void_and_dun"]["heaven_void_earth_palaces"])==2
    assert chart["has_twelve_heavenly_generals"]
    return {"version":"V63","status":"passed","sha":os.getenv("GITHUB_SHA"),
            "six_xun_fixed_tables":cases,
            "classic":"https://shuyuan.zhiming.life/read/%E5%A4%A7%E5%85%AD%E5%A3%AC%E6%8E%A2%E5%8E%9F%28%E6%8E%A8%E6%BC%94%E7%AF%87%29-%E4%B8%8A/7",
            "classic_cast":{"day":"丙寅","month_general":"亥","hour":"申",
                            "triple":[{"branch":p["branch"],"dun":p["xun_dun_stem"],
                                       "is_void":p["is_xun_void"]} for p in triple]},
            "basis":"day_xun_only","heaven_and_earth_void_separate":True,
            "general_tiankong_not_旬空":True,"transmission_pending_never_faked":True,
            "fortune_verdict":None}
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--output",type=Path,required=True)
    a=p.parse_args();data=verify()
    a.output.parent.mkdir(parents=True,exist_ok=True)
    a.output.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("V63 六甲旬旬空与遁干六组固定表、丙寅日亥将申时三传申亥寅及中传空亡通过")
