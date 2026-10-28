"""V85 independent Yin 315 source case and hypothetical six-Ji phases across 720 clocks."""
from datetime import date,time,timedelta
from pathlib import Path
import argparse,json
from app.core.taiyi_hour_v77 import hour_basic_board,_jieqi
from app.core.taiyi_hour_v85 import (
    independent_yin_315_witness,three_historical_ji_phase_hypotheses,JI_SEEDS,
    independent_historical_six_ji_starts
)

def audit():
    independent=independent_yin_315_witness()
    assert independent["expected"]==independent["actual"]
    assert (independent["actual"]["main_count"],independent["actual"]["guest_count"])==(29,4)
    assert (independent["actual"]["main_general"],independent["actual"]["main_assistant"],
        independent["actual"]["guest_general"],independent["actual"]["guest_assistant"])==(9,7,4,2)
    historical_origins={mode:independent_historical_six_ji_starts(mode)
                        for mode in ("阳遁","阴遁")}
    assert all(len(x["rows"])==6 and not x["may_be_used_as_modern_qiying_anchor"]
               for x in historical_origins.values())
    census={}
    examples=[]
    for mode,term in (("阳遁","冬至"),("阴遁","夏至")):
        statuses={"computed":0,"partially_computed":0,"pending":0}
        unresolved=0
        for n in range(1,361):
            x=three_historical_ji_phase_hypotheses(n,mode,term)
            assert x["preferred_phase"] is None
            assert x["confirmed_qiying_main_general"] is None
            assert len(x["hypotheses"])==3
            for p in x["hypotheses"]:
                statuses[p["status"]]+=1
                unresolved+=int(p["status"]!="computed")
                assert not p["has_verified_qiying_phase_anchor"]
                for label in ("main","guest"):
                    side=p[label]
                    if side["status"]=="computed":
                        assert side["count"]==sum(z["added"] for z in side["trace"])
                    else:
                        assert side["count"] is None
            if n in (1,60,61,120,121,180,181,360):
                examples.append({"dun":mode,"relative_hours":n,
                 "taiyi":x["qiying_taiyi_palace"],
                 "jishen":x["qiying_jishen"],
                 "three_wenchang_gods":[p["wenchang"]["god"] for p in x["hypotheses"]],
                 "three_shiji_gods":[p["shiji"]["god"] for p in x["hypotheses"]],
                 "three_statuses":[p["status"] for p in x["hypotheses"]],
                 "preferred_historical_phase":None})
        assert sum(statuses.values())==1080 and unresolved>0
        census[mode]={"hour_slots":360,"hypotheses":1080,
                      "historical_ji_seeds":list(JI_SEEDS[mode]),
                      "model_statuses":statuses,"no_selected_phase":True}
    boundary={}
    for name,month in (("冬至",12),("夏至",6)):
        at=_jieqi(2026,name,month)+timedelta(seconds=1)
        chart=hour_basic_board(at.date(),at.time())
        qi=chart["hour_v84_qiying_plate"]["qiying"]
        r=chart["hour_v85_phase_hypotheses"]
        assert r["relative_hours"]==1
        assert qi["qiying_wenchang"] is None
        assert qi["qiying_main_general"]["palace"] is None
        boundary[name]={"beijing_first_hour":at.isoformat(),
              "qiying_taiyi":qi["taiyi_palace"]["number"],
              "qiying_jishen":qi["jishen"],
              "historical_ji_start_gods":[p["first_eye_in_historical_ji"]
                                           for p in r["hypotheses"]],
              "modern_historical_phase":None}
    return {"version":"V85","status":"passed",
      "independent_jinjing_yin_315":{
         "source":independent["source"],
         "actual":independent["actual"],"expected":independent["expected"],
         "main_trace":independent["main_trace"],
         "guest_trace":independent["guest_trace"],
         "not_equivalent_to_jiazi_shortcut_ju_27":True,
         "not_a_modern_solstice_epoch_anchor":True},
      "six_historical_ji_starts":JI_SEEDS,
      "historical_six_ji_palace_eye_jishen_witnesses":historical_origins,
      "720_hour_slots_three_phases_each":census,
      "representative_phase_traces":examples,
      "2026_solstice_first_hour":boundary,
      "no_unverified_general_placement":True,
      "ancient_absolute_upper_epoch_verified":False,
      "no_hourly_fortune_predictions":True}

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",required=True)
    args=parser.parse_args();data=audit();dest=Path(args.output)
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("V85: 阴遁第六纪壬子元27局=周内第315时独立原典主29客4大参9/7与4/2；阴阳720时×3纪相候选校核，现代气应相位不臆定。")
