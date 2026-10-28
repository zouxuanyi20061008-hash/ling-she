"""V77 independent source-limited solstice 24-hour ring and time-JiShen evidence."""
import argparse,json
from pathlib import Path
from datetime import date,time,datetime,timedelta
from app.core.taiyi_hour_v77 import hour_cycle_from_count,hour_basic_board,_jieqi

def audit():
    source="https://zh.wikisource.org/zh-hans/太乙金鏡式經_(四庫全書本)/卷01"
    source47="https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkylq3yn8"
    results=[]
    for dun,palaces,start,second in [
      ("阳遁",[1,2,3,4,6,7,8,9],"寅","丑"),
      ("阴遁",[9,8,7,6,4,3,2,1],"申","未")
    ]:
        for i,p in enumerate(palaces):
            for h in range(1,4):
                step=i*3+h
                c=hour_cycle_from_count(step,dun)
                assert (c["taiyi_palace"]["number"],c["hours_in_current_palace"])==(p,h)
                assert c["jishen"]==hour_cycle_from_count(step+24,dun)["jishen"]
                results.append({"dun":dun,"relative_count":step,
                                "palace":p,"hour_in_palace":h,
                                "hourly_reverse_jishen":c["jishen"]})
        assert hour_cycle_from_count(1,dun)["jishen"]==start
        assert hour_cycle_from_count(2,dun)["jishen"]==second
        assert hour_cycle_from_count(25,dun)["taiyi_palace"]["number"]==palaces[0]
    ancient=hour_cycle_from_count(47,"阳遁")
    assert ancient["taiyi_palace"]["number"]==9 and ancient["hours_in_current_palace"]==2
    summer=_jieqi(2026,"夏至",6)
    winter=_jieqi(2026,"冬至",12)
    transitions=[]
    for moment,dun,palace in (
      (summer-timedelta(seconds=1),"阳遁",None),
      (summer,"阴遁",9),
      (winter-timedelta(seconds=1),"阴遁",None),
      (winter,"阳遁",1)):
        board=hour_basic_board(moment.date(),moment.time())
        assert board["time_cycle"]["dun"]==dun
        if palace:assert board["taiyi_palace"]["number"]==palace
        assert board["has_full_hour_chart"] is False
        transitions.append({"moment":moment.isoformat(),
                            "dun":dun,"palace":board["taiyi_palace"]["number"],
                            "solstice":board["solstice"]["name"]})
    return {"version":"V77","status":"passed","source":source,
       "independent_old_47_hour_source":source47,
       "witness_47":{"palace":9,"hour_in_palace":2},
       "all_48_hourly_palace_slots":results,
       "2026_transition_cases":transitions,
       "scope":"冬夏至以来相对时实；不包括古典上元积时五元七十二局和主客算",
       "full_hour_chart":False,"has_real_year_hour_separation":True}

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--output",required=True)
    a=p.parse_args();doc=audit()
    out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("V77 时计：二至前后精确换遁，阴阳各24时八宫逐格独立校验，计神十二时逆行；古典历元和断课明确待校。")
