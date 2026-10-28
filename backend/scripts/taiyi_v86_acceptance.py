"""V86 source-bound independent cases and unresolved six-Ji/72-Ju/hour conflict."""
import argparse,json
from pathlib import Path
from app.core.taiyi_hour_v86 import audit_vol9_yang_examples,audit_vol9_yin_conflict
from app.core.taiyi_hour_v77 import hour_basic_board
from datetime import date,time

def audit():
    yang=audit_vol9_yang_examples()
    yin=audit_vol9_yin_conflict()
    assert [e["attested_expected"]["guest_count"] for e in yang["cases"]]==[1,22,40]
    assert [r["mismatched_source_fields"] for r in yin["hypotheses"]][:2]==[
        ["six_ji_number"],["hour_ganzhi_from_jiazi_start"]]
    assert not yin["can_promote_full_yin_plate"]
    modern=hour_basic_board(date(2026,10,28),time(17,30))
    assert modern["hour_source_review_version"]=="V86"
    assert modern["hour_v85_phase_hypotheses"]["preferred_phase"] is None
    assert not modern["has_full_hour_chart"]
    return {"version":"V86","status":"passed",
            "yang_independently_attested":yang,
            "yin_source_internal_conflict":yin,
            "modern_2026_qiying_reference":{
                "relative_hours":modern["time_cycle"]["relative_time_count"],
                "taiyi_palace":modern["hour_v84_qiying_plate"]["qiying"]["taiyi_palace"]["number"],
                "jishen":modern["hour_v84_qiying_plate"]["qiying"]["jishen"],
                "verified_wenchang":False,"verified_main_guest":False,
                "historical_case_as_modern_epoch":False},
            "no_fabricated_yin_ji_ju_or_ganzhi":True,
            "no_modern_hour_fortune_verdict":True}

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--output",required=True)
    args=p.parse_args();out=audit();target=Path(args.output)
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("V86 卷九阳遁2/8/25局独立例课通过；阴遁第三纪52局乙卯存在原文互斥；气应派不混用。")
