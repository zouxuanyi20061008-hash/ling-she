"""V80 independent Gengxu 887 harmony/Dingji arithmetic contradiction and 720-door census."""
import argparse,json
from pathlib import Path
from app.core.taiyi_hour_v78 import classical_hour_ju
from app.core.taiyi_hour_v79 import calculate_hour_main_guest
from app.core.taiyi_hour_v80 import (
    hour_harmony_dingji,hour_door_chief,WITNESS_887
)

def audit():
    ancient=classical_hour_ju(887,"阳遁")
    mg=calculate_hour_main_guest(ancient)
    d=hour_harmony_dingji(ancient,mg)
    door=hour_door_chief(887,"阳遁")
    shortcut=hour_door_chief(47,"阳遁")
    assert (d["harmony"]["god"],d["dingji_eye"]["god"])==("高丛","大神")
    assert [x["added"] for x in d["computed_trace"] if x["added"]>0]==[
        1,2,7,6,1,8,3,4]
    assert d["computed_trace_sum"]==32
    assert d["source_disagreement"]["printed_total"]==33
    assert d["count"] is None and d["status"]=="source_conflict"
    assert (door["chief_door"],door["hour_in_door"])==("生",17)
    assert (shortcut["chief_door"],shortcut["hour_in_door"])==("生",17)
    cases={}
    examples=[]
    for dun in ("阳遁","阴遁"):
        counts={}
        for i in range(1,361):
            raw=classical_hour_ju(i,dun)
            mg=calculate_hour_main_guest(raw)
            s=hour_harmony_dingji(raw,mg)
            g=hour_door_chief(i,dun)
            counts[s["status"]]=counts.get(s["status"],0)+1
            assert g["chief_door"] in ("开","生","惊","休","杜","死","伤","景")
            if s["status"]=="computed":
                assert s["count"]==sum(x["added"] for x in s["computed_trace"])
            else:
                assert s["count"] is None and s["main_general"] is None
                if len(examples)<8:
                    examples.append({"dun":dun,"hour_count":i,
                                     "status":s["status"],"reason":s["reason"]})
            assert s["fortune_verdict"] is None
        cases[dun]=counts
        assert sum(counts.values())==360
    assert cases["阳遁"]["source_conflict"]==1
    return {
       "version":"V80","status":"passed",
       "source":WITNESS_887["source"],
       "ancient_887":{
          "hour_branch":d["hour_branch"],
          "harmony":d["harmony"],"dingji_eye":d["dingji_eye"],
          "full_rotation":d["rotation"]["rotated_sixteen"],
          "independent_listed_contributions":WITNESS_887["listed_contributions"],
          "derived_trace":[{"god":x["god"],"direction":x["direction"],
                            "added":x["added"]} for x in d["computed_trace"]],
          "derived_sum":d["computed_trace_sum"],
          "printed_count":d["source_disagreement"]["printed_total"],
          "printed_general":WITNESS_887["printed_main_general"],
          "printed_assistant":WITNESS_887["printed_assistant_general"],
          "unresolved":True,"do_not_invent_extra_one":True,
          "gate_from_887":door,"gate_from_47":shortcut,
       },
       "checked_both_360_hour_cycles":True,
       "classification_counts":cases,
       "example_noncomputed_cases":examples,
       "no_abs_historical_epoch_claim":True,
       "no_full_eight_gate_palace_layout":True,
       "no_fortune_predictions":True,
    }

if __name__=="__main__":
    a=argparse.ArgumentParser();a.add_argument("--output",required=True)
    v=a.parse_args();result=audit()
    path=Path(v.output);path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("V80 原典庚戌时合神高丛、定目大神、生门17时均复现；逐项定算32与原书33冲突如实待判。阴阳共720时局分型复核。")
