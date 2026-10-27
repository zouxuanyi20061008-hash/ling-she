"""V65 unmodified primary-source 1561/1624 positions & stepwise sums."""
from pathlib import Path
import argparse,json,os
from app.core.taiyi import year_board
from app.core.taiyi_v65 import DIRECTIONS,GODS

HISTORICAL={
 1561:{"wenchang":"阴德","shiji":"天道","main":16,"guest":30,
       "main_general":6,"main_assistant":8,"guest_general":3,"guest_assistant":9,
       "main_nonzero":[["乾",1],["子",8],["艮",3],["卯",4]],
       "guest_nonzero":[["未",1],["坤",7],["酉",6],["乾",1],["子",8],["艮",3],["卯",4]]},
 1624:{"wenchang":"大炅","shiji":"太阳","main":18,"guest":19,
       "main_general":8,"main_assistant":4,"guest_general":9,"guest_assistant":7,
       "main_nonzero":[["巽",9],["午",2],["坤",7]],
       "guest_nonzero":[["辰",1],["巽",9],["午",2],["坤",7]]}
}
def verify():
    witnesses=[]
    for year,ref in HISTORICAL.items():
        v=year_board(year,historical=True)["main_guest"]
        assert v["status"]=="computed"
        assert (v["heaven_eye_wenchang"]["god"],v["earth_eye_shiji"]["god"])==(
           ref["wenchang"],ref["shiji"])
        assert (v["main_calculated"],v["guest_calculated"])==(ref["main"],ref["guest"])
        for k,prefix in (("main_general","main"),("guest_general","guest")):
            d=v[k]
            assert (d["main_general"],d["assistant_general"])==(
              ref[prefix+"_general"],ref[prefix+"_assistant"])
            assert [[p["direction"],p["added"]] for p in d["trace"] if p["added"]]>0==ref[prefix+"_nonzero"]
        witnesses.append({"year":year,"reference":ref,
            "calculated":{"wenchang":v["heaven_eye_wenchang"],
                          "shiji":v["earth_eye_shiji"],
                          "main":v["main_general"],"guest":v["guest_general"]}})
    current=year_board(2026)["main_guest"]
    assert current["main_calculated"]==16
    assert current["guest_calculated"] is None
    assert current["earth_eye_shiji"]["god"]=="和德"
    assert current["guest_general"]["same_palace_as_taiyi"]
    return {"version":"V65","status":"passed","sha":os.getenv("GITHUB_SHA"),
       "historical_primary":"https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkylq3yn8",
       "historical_other":"https://zh.wikisource.org/wiki/%E6%AC%BD%E5%AE%9A%E5%8F%A4%E4%BB%8A%E5%9C%96%E6%9B%B8%E9%9B%86%E6%88%90/%E5%8D%9A%E7%89%A9%E5%BD%99%E7%B7%A8/%E8%97%9D%E8%A1%93%E5%85%B8/%E7%AC%AC688%E5%8D%B7",
       "source_algorithm":"https://www.shidianguji.com/zh/book/SK1615/chapter/1l9lir7w2mwii",
       "ancient_cases":witnesses,"sixteen_directions":list(DIRECTIONS),
       "sixteen_gods":list(GODS),
       "modern_unresolved":"2026始击与太乙同宫，客算保留pending",
       "fortune_verdict":None}
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--output",type=Path,required=True)
    a=p.parse_args();data=verify();a.output.parent.mkdir(parents=True,exist_ok=True)
    a.output.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("V65 太乙十六神文昌始击、1561/1624主客逐宫投算与大参将独立验收通过")
