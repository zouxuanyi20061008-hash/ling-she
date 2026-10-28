"""V87 documentary and mathematical impossibility audit as JSON evidence."""
from pathlib import Path
import argparse,json
from datetime import date,time
from app.core.taiyi_hour_v87 import exhaustive_yin_source_congruence
from app.core.taiyi_hour_v77 import hour_basic_board

def audit():
    x=exhaustive_yin_source_congruence()
    assert x["triple_intersection"]==[]
    assert [p["candidate_hour"] for p in x["pairwise_intersections"]]==[124,172,52]
    assert not x["independent_printed_variant_verified"]
    current=hour_basic_board(date(2026,10,28),time(17,30))
    assert current["hour_source_review_version"]=="V87"
    assert current["hour_v85_phase_hypotheses"]["preferred_phase"] is None
    assert current["has_full_hour_chart"] is False
    return {"version":"V87","status":"passed",
            "full_360_hour_modular_exhaustive_proof":x,
            "unchanged_modern_hour_ref":{
                "beijing_date":"2026-10-28",
                "taiyi":current["hour_v84_qiying_plate"]["qiying"]["taiyi_palace"]["number"],
                "jishen":current["hour_v84_qiying_plate"]["qiying"]["jishen"],
                "modern_qiying_wenchang":None,"modern_qiying_main_guest":None},
            "historical_reading_not_emended":True,"no_invented_epoch":True}

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--output",required=True)
    args=p.parse_args()
    data=audit()
    output=Path(args.output);output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("V87: 三条件全周360时交集为空；原籍未擅改；现代气应盘仍待独立校核")
