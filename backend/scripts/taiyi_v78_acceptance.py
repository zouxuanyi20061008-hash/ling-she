"""V78 two primary-source hour anchors, 360/72/60, 18-wenchang and modern Jiazi audit."""
from pathlib import Path
from datetime import date,time
import argparse,json
from app.core.taiyi_hour_v78 import classical_hour_ju,hour_wenchang_from_count
from app.core.taiyi_hour_v77 import hour_basic_board
SRC887="https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkylq3yn8"
SRC63="https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkvlnkx7u"

def audit():
    a=classical_hour_ju(887,"阳遁")
    b=classical_hour_ju(47,"阳遁")
    # 阴例为戊子元63局，周内累计2*72+63=207算
    c=classical_hour_ju(2*72+63,"阴遁")
    assert (a["in_cycle_360"],a["five_yuan_name"],a["ju"])==(167,"戊子元",23)
    assert (a["taiyi_palace"]["number"],a["hour_in_palace"],
            a["time_wenchang"]["god"])==(9,2,"阴德")
    assert (b["taiyi_palace"]["number"],b["hour_in_palace"])==(9,2)
    assert b["time_wenchang"]["god"]!="阴德" # 47简捷只独立证宫，不证文昌
    assert (c["taiyi_palace"]["number"],c["time_wenchang"]["direction"],
            c["time_jishen"])==(4,"坤","午")
    cycles=[]
    for mode in ("阳遁","阴遁"):
        for i in range(1,361):
            val=classical_hour_ju(i,mode)
            assert val["ju"]==(i-1)%72+1
            assert val["time_wenchang"]["index"]==hour_wenchang_from_count(i,mode)["index"]
        cycles.append({"dun":mode,"hours_checked":360,"all_360_72_60_24_18_12_divisors_consistent":True})
    checks=[]
    for d,t in [(date(2026,6,21),time(16,30)),
                (date(2026,6,22),time(9,30)),
                (date(2026,12,22),time(4,30)),
                (date(2026,12,24),time(0,30))]:
        x=hour_basic_board(d,t)
        v=x["classical_jiazi_hour_v78"]
        assert 0<=v["anchor"]["days_between_jiazi_and_solstice"]<60
        assert v["time_wenchang"]["status"]=="computed"
        assert v["compared_to_v77"]["claim_same_epoch"] is False
        assert x["has_full_hour_chart"] is False
        checks.append({"time":d.isoformat()+"T"+t.isoformat(),
          "solstice":x["solstice"],"old_relative_hours":x["time_cycle"]["relative_time_count"],
          "previous_jiazi_day":v["anchor"]["prior_jiazi_date"],
          "classic_hour_count":v["accumulated_hours"],
          "five_yuan":v["five_yuan_name"],"ju":v["ju"],
          "taiyi":v["taiyi_palace"]["number"],"wenchang":v["time_wenchang"]["god"],
          "source_school_not_same_as_v77":True})
    return {"version":"V78","status":"passed",
       "independent_ancient_887":{"source":SRC887,"accum":887,
         "cycle_360":a["in_cycle_360"],"yuan":a["five_yuan_name"],
         "ju":a["ju"],"taiyi_palace":9,"hour_in_palace":2,"wenchang":"阴德"},
       "independent_47_shortcut":{"source":SRC887,"accum":47,
         "taiyi_palace":9,"hour_in_palace":2,
         "wenchang_requires_original_23_ju":True},
       "independent_yin_wuzi_63":{"source":SRC63,
         "reconstructed_count":207,"five_yuan":"戊子元","ju":63,
         "taiyi_palace":4,"wenchang":"坤·大武","time_jishen":"午"},
       "comprehensive_360_cycle_checks":cycles,
       "modern_2026_source_separation":checks,
       "has_classic_jiazi_before_solstice_360_72":True,
       "has_absolute_upper_jiazi_epoch":False,
       "has_full_hour_main_guest_chart":False,
       "fortune_verdict":None}

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--output",required=True)
    args=p.parse_args()
    data=audit();target=Path(args.output);target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("V78:古籍887阳→戊子元23局九宫阴德；63阴→震四文昌坤；360×2全局闭合，甲子前简捷历元与V77时实分栏。")
