"""V79 complete source-verifiable Gengxu 887 example and both 360-slot main/guest census."""
from pathlib import Path
import argparse,json
from app.core.taiyi_hour_v78 import classical_hour_ju
from app.core.taiyi_hour_v79 import calculate_hour_main_guest,ANCIENT_887

def audit():
    fixed=calculate_hour_main_guest(classical_hour_ju(887,"阳遁"))
    assert fixed["historical_case_audit"]["expected"]==fixed["historical_case_audit"]["actual"]
    assert (fixed["jishen"],fixed["heaven_eye_wenchang"]["god"],
            fixed["earth_eye_shiji"]["god"])==("辰","阴德","武德")
    assert (fixed["main_calculated"],fixed["guest_calculated"])==(16,23)
    assert (fixed["main_general"],fixed["main_assistant"],
            fixed["guest_general"],fixed["guest_assistant"])==(6,8,3,9)
    stats={}; special=[]
    for dun in ("阳遁","阴遁"):
        counts={"computed":0,"partially_computed":0,"pending":0}
        for n in range(1,361):
            z=calculate_hour_main_guest(classical_hour_ju(n,dun))
            counts[z["status"]]+=1
            assert z["has_complete_hour_main_guest"]==(z["status"]=="computed")
            for key in ("main","guest"):
                p=z[key]
                if p["status"]=="computed":
                    assert p["count"]==sum(x["added"] for x in p["trace"])
                else:
                    assert p["count"] is None and p["same_palace_as_taiyi"]
                    if len(special)<8:
                        special.append({"dun":dun,"count":n,"side":key,
                                        "reason":p["reason"]})
            assert z["fortune_verdict"] is None
            assert z["is_complete_all_hours"] is False
        assert counts["computed"]>0
        assert counts["partially_computed"]+counts["pending"]>0
        stats[dun]=counts
    return {"version":"V79","status":"passed",
       "verified_887":{"source":ANCIENT_887["source"],
            "original_reference":ANCIENT_887,
            "computed":fixed["historical_case_audit"]["actual"],
            "main_trace":fixed["main"]["trace"],
            "guest_trace":fixed["guest"]["trace"]},
       "all_720_double_hour_dun_pairs_checked":True,
       "360_each_mode":stats,
       "representative_same_palace_pending":special,
       "origin":"V78 prior-Jiazi shortcut; no annual accumulated-year inputs",
       "has_complete_absolute_upper_epoch":False,
       "has_all_hourly_dingji_and_eight_doors":False,
       "no_real_world_predications":True}

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--output",required=True)
    a=p.parse_args();x=audit();out=Path(a.output)
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(x,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("V79 原典庚戌887时全盘校准：始击武德，主16客23，大参6/8与3/9；阴阳各360盘，同宫不伪算。")
