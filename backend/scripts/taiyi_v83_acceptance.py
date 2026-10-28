"""V83 compare Wang Ximing solstice qi and pre-solstice Jiazi shortcut gate chiefs."""
import argparse,json
from datetime import date,time,timedelta
from pathlib import Path
from app.core.taiyi_hour_v77 import hour_basic_board,_jieqi
from app.core.taiyi_hour_v83 import contrast_two_hour_chief_clocks

def audit():
    gengxu=contrast_two_hour_chief_clocks(solstice_count=47,jiazi_count=887,
                                     dun="阳遁",solstice_name="冬至")
    assert gengxu["same_chief_and_hour_in_door"] and gengxu["solstice_chief"]=="生"
    solstices={}
    examples=[]
    for name,month,dun in [("夏至",6,"阴遁"),("冬至",12,"阳遁")]:
        boundary=_jieqi(2026,name,month)
        switch=hour_basic_board((boundary+timedelta(seconds=1)).date(),
                     (boundary+timedelta(seconds=1)).time())
        r=switch["hour_v83_chief_epoch_comparison"]
        assert r["relative_count"]==1 and r["dun"]==dun
        assert r["solstice_chief"]==("杜" if dun=="阴遁" else "开")
        solstices[name]={"starts_beijing":boundary.isoformat(),
             "solstice_relative_chief":r["solstice_chief"],
             "jiazi_shortcut_chief":r["jiazi_chief"],
             "offset_hours":r["offset_between_epoch_hours"],
             "same_chief":r["same_chief_door"]}
    for d,t in ((date(2026,6,22),time(9,30)),
                (date(2026,10,28),time(14,30)),
                (date(2026,12,23),time(23,30)),
                (date(2026,12,24),time(0,30))):
        data=hour_basic_board(d,t)
        r=data["hour_v83_chief_epoch_comparison"]
        assert r["relative_count"]==data["time_cycle"]["relative_time_count"]
        assert r["previous_jiazi_count"]==data["classical_jiazi_hour_v78"]["accumulated_hours"]
        assert not data["has_full_hour_chart"]
        examples.append({"time":d.isoformat()+"T"+t.isoformat(),
          "solstice":r["solstice_name"],"relative_count":r["relative_count"],
          "jiazi_count":r["previous_jiazi_count"],
          "wangximing_chief":r["solstice_chief"],
          "jiazi_chief":r["jiazi_chief"],"agreement":r["same_chief_door"],
          "all_eight_door_positions_verified":False})
    stats={}
    for dun,name in (("阳遁","冬至"),("阴遁","夏至")):
        equal=0;different=0
        for i in range(1,361):
            for days in (0,1,5,10,20,59):
                v=contrast_two_hour_chief_clocks(solstice_count=i,
                    jiazi_count=i+days*12,dun=dun,solstice_name=name)
                equal+=v["same_chief_door"]
                different+=not v["same_chief_door"]
                assert v["offset_modulo_120"]==days*12%120
        assert equal>0 and different>0
        stats[dun]={"cases":equal+different,"same_chief":equal,
                    "different_chief":different}
    return {"version":"V83","status":"passed",
       "source_old_vs_new":gengxu["old_and_new_sources"],
       "gengxu_47_and_887":{"same_chief":"生","same_hour_in_door":17,
                   "offset_840_multiple_of_120":True,
                   "does_not_prove_modern_agreement":True},
       "solstices_2026":solstices,"dated_examples":examples,
       "2160_offsets_each_dun":stats,
       "verified_full_hourly_eight_door_layout":False,
       "mixing_v77_door_with_v78_general_palace_forbidden":True,
       "absolute_upper_epoch_complete":False,
       "fortune_verdict":None}
if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--output",required=True)
    args=p.parse_args();x=audit();path=Path(args.output)
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(x,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("V83: 二至王希明气应起门与甲子前简捷起门双历元核验，2026二至边界、阴阳各2160时数情形已核对。")
