"""V66 independent five annal 55-59 cases + Wubeizhi 55 and 58 disagreement."""
import argparse,json,os
from pathlib import Path
from app.core.taiyi import year_board

CASES=[
 (2026,55,"武德","和德",16,3,6,8,3,9),
 (2027,56,"太簇","太阳",15,34,5,5,4,2),
 (2028,57,"阴主","大神",10,25,1,3,5,5),
 (2029,58,"阴德","天道",12,26,2,6,6,8),
 (2030,59,"阴德","武德",12,19,2,6,9,7),
]
def verify():
    examples=[]
    for year,ju,wen,shi,m,g,mg,ma,gg,ga in CASES:
        d=year_board(year)
        v=d["main_guest"]
        assert d["year"]["ju"]==ju
        assert (v["heaven_eye_wenchang"]["god"],v["earth_eye_shiji"]["god"])==(wen,shi)
        assert (v["main_calculated"],v["guest_calculated"])==(m,g)
        assert (v["main_general"]["main_general"],v["main_general"]["assistant_general"])==(mg,ma)
        assert (v["guest_general"]["main_general"],v["guest_general"]["assistant_general"])==(gg,ga)
        assert d["historical_case_audit"]["status"]=="verified_original_text"
        examples.append({"year":year,"ju":ju,"wenchang":wen,"shiji":shi,
           "main_count":m,"guest_count":g,
           "main_general":{"big":mg,"assistant":ma},
           "guest_general":{"big":gg,"assistant":ga},
           "primary_trace":v["main_general"]["trace"],
           "guest_trace":v["guest_general"]["trace"],
           "original_sources":d["historical_case_audit"]["sources"]})
    x=year_board(2026)
    y=year_board(2026,same_palace_rule="conservative")
    assert x["main_guest"]["guest_calculated"]==3
    assert y["main_guest"]["guest_calculated"] is None
    assert x["main_guest"]["guest_general"]["special_rule_applied"]
    z=year_board(2029)
    assert z["school_disagreements"][0]["other_main_count"]==13
    return {"version":"V66","status":"passed","sha":os.getenv("GITHUB_SHA"),
      "ancient_witnesses":examples,
      "five_consecutive_ju_verified":True,
      "same_palace_wubeizhi_from":"https://www.shidianguji.com/book/CADAL02092259/chapter/1lb3wzm7f2qzs",
      "independent_55":"https://www.shidianguji.com/mid-page/7430936373068120073",
      "58_conflict":{"principal_main":12,"alternate_main":13,
        "principal":"https://zh.wikisource.org/zh-hans/%E6%AC%BD%E5%AE%9A%E5%8F%A4%E4%BB%8A%E5%9C%96%E6%9B%B8%E9%9B%86%E6%88%90/%E5%8D%9A%E7%89%A9%E5%BD%99%E7%B7%A8/%E8%97%9D%E8%A1%93%E5%85%B8/%E7%AC%AC696%E5%8D%B7",
        "alternate":"https://libokang.com/classics/taiyi/%E5%A4%AA%E4%B9%99%E7%A7%98%E4%B9%A6/"},
      "conservative_mode_remains_available":True,
      "all_annual_subsystems_done":False,
      "fortune_verdict":None}
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--output",required=True,type=Path)
    a=p.parse_args();data=verify()
    a.output.parent.mkdir(parents=True,exist_ok=True)
    a.output.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("V66 55至59局五份独立古籍逐宫主客、大参将与同宫分歧全部验收")
