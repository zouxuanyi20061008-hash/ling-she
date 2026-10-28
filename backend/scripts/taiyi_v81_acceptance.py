"""V81 critical edition arithmetic with unverified chief-door location and 720 review cases."""
import argparse,json
from pathlib import Path
from app.core.taiyi_hour_v78 import classical_hour_ju
from app.core.taiyi_hour_v79 import calculate_hour_main_guest
from app.core.taiyi_hour_v80 import hour_harmony_dingji,hour_door_chief
from app.core.taiyi_hour_v81 import (
   source_review_v81,classify_same_palace_v81,
   door_location_candidate_v81,DAY_DINGJI,
)

def audit():
    c=classical_hour_ju(887,"阳遁")
    m=calculate_hour_main_guest(c)
    d=hour_harmony_dingji(c,m)
    g=hour_door_chief(887,"阳遁")
    rev=source_review_v81(d)
    pos=door_location_candidate_v81(g,d,m)
    assert rev["nonzero_sum"]==32 and rev["reported_total"]==33
    assert pos["candidate_direction"]=="巳"
    assert pos["candidate_palace"] is None and pos["chief_door"]=="生"
    stats={};pending_cases=[]
    for mode in ("阳遁","阴遁"):
        nstatus={}
        placement={"intermediate":0,"main_palace":0}
        same_count=0
        for n in range(1,361):
            raw=classical_hour_ju(n,mode)
            mg=calculate_hour_main_guest(raw)
            ding=hour_harmony_dingji(raw,mg)
            door=hour_door_chief(n,mode)
            review=source_review_v81(ding)
            candidate=door_location_candidate_v81(door,ding,mg)
            pending=classify_same_palace_v81(ding,mg)
            nstatus[ding["status"]]=nstatus.get(ding["status"],0)+1
            placement["intermediate" if candidate["is_intermediate_direction"]
                      else "main_palace"]+=1
            same_count+=pending["pending_sides"]
            assert candidate["actual_hour_palace_if_unverified"] is None
            assert not candidate["all_eight_doors_placed"]
            if pending["cases"] and len(pending_cases)<8:
                pending_cases.append({"dun":mode,"hour":n,
                  "pending":pending["cases"]})
            assert review["does_not_claim_two_independent_editions"]
        assert sum(nstatus.values())==360
        assert placement["intermediate"]>0 and placement["main_palace"]>0
        stats[mode]={"classification":nstatus,
                     "potential_door_locations":placement,
                     "same_palace_sides":same_count}
    assert stats["阳遁"]["classification"]["source_conflict"]==1
    return {"version":"V81","status":"passed",
       "ancient_887_internal_conflict":{
          "source":rev["source_witnesses"][0]["source"],
          "positive_addends":rev["nonzero_addends"],
          "arithmetic_sum":rev["nonzero_sum"],
          "text_written_sum":rev["reported_total"],
          "no_plus_one_inserted":rev["no_automatic_plus_one"],
          "no_verified_dingji_generals":True,
          "not_two_independent_editions":True,
          "other_day_in_same_book":DAY_DINGJI,
       },
       "door_chief_source_limited_candidate":{
          "source_methods":pos["primary_text_rules"],
          "chief":pos["chief_door"],
          "direction":pos["candidate_direction"],
          "location_is_intermediate":pos["is_intermediate_direction"],
          "validated_hourly_door_palace":False,
          "eight_door_layout_fabricated":False,
       },
       "both_360_hour_cycles":stats,
       "representative_same_palace_pending":pending_cases,
       "absolute_upper_jiazi_epoch_complete":False,
       "fortune_verdict":None}
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--output",required=True)
    args=p.parse_args();d=audit()
    path=Path(args.output);path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(d,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("V81：庚戌32/33是同一文本内部矛盾；丁未日另例32非异本。直使加定计目仅标古法候选，阴阳720时局三层校验完成。")
