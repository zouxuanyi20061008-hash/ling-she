"""V64 double-independent ancient annal anchors, three-year ring, 360-cycle witness."""
import json,argparse,os
from pathlib import Path
from app.core.taiyi import year_board

def verify():
    cases=[]
    for year,acc,yuan,ju,palace,tenure,main,guest in (
        (1561,10155478,4,22,9,"理天",16,30),
        (1624,10155541,5,13,6,"理天",18,19),
    ):
        d=year_board(year,historical=True)
        y=d["year"]
        assert (y["accumulated_years"],y["five_yuan_number"],y["ju"],
                y["taiyi_palace"]["number"],y["year_governing"])==(acc,yuan,ju,palace,tenure)
        witness=d["main_guest"]["source_if_attested"]
        assert witness["main_count"]==main and witness["guest_count"]==guest
        assert d["main_guest"]["main_calculated"]==main
        assert d["main_guest"]["guest_calculated"]==guest
        cases.append({"gregorian_year":year,"accumulated":acc,"yuan":yuan,
                      "ju":ju,"taiyi":palace,"tenure":tenure,
                      "host_guest_reference_only":witness})
    now=year_board(2026)
    assert now["year"]["ju"]==55
    assert now["year"]["taiyi_palace"]["trigram"]=="艮"
    assert now["main_guest"]["status"]=="partially_computed"
    assert now["main_guest"]["main_calculated"]==16
    assert now["main_guest"]["guest_calculated"] is None
    return {"version":"V64","status":"passed","sha":os.getenv("GITHUB_SHA"),
        "original_examples":cases,
        "present_day_example":{"gregorian_year":2026,
            "accumulation":now["year"]["accumulated_years"],
            "yuan":now["year"]["five_yuan_name"],
            "ju":now["year"]["ju"],
            "taiyi":now["year"]["taiyi_palace"]},
        "ancient_palace_ring":[v["number"] for v in now["palace_ring"]],
        "source_1624":"https://zh.wikisource.org/wiki/%E6%AC%BD%E5%AE%9A%E5%8F%A4%E4%BB%8A%E5%9C%96%E6%9B%B8%E9%9B%86%E6%88%90/%E5%8D%9A%E7%89%A9%E5%BD%99%E7%B7%A8/%E8%97%9D%E8%A1%93%E5%85%B8/%E7%AC%AC688%E5%8D%B7",
        "source_1561":"https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkylq3yn8",
        "main_guest_checked_against_both_original_examples":True,"no_divination_verdict":True}

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--output",type=Path,required=True)
    x=p.parse_args();data=verify();x.output.parent.mkdir(parents=True,exist_ok=True)
    x.output.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("V64 太乙岁计：1561、1624古籍独立积年元局行宫，24/72/360周期及九宫归位通过")
