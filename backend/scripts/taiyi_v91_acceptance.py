"""V91 CADAL 卷五至卷十扫描入口专项验收。"""
from pathlib import Path
import argparse, json, os
from datetime import date, time
from app.core.taiyi_hour_v77 import hour_basic_board


def audit():
    cases = []
    for d, clock in ((date(2026,10,28),time(17,30)),(date(2026,6,22),time(9,30)),(date(2026,12,23),time(10,30))):
        chart = hour_basic_board(d, clock)
        loc = chart["hour_v91_cadal_volume_locator"]
        scan = loc["candidate_scan"]
        assert scan["volumes_included"] == [5,6,7,8,9,10]
        assert scan["volume_nine_included"] is True
        assert scan["volume_nine_scan_page"] is None and scan["target_passage_page"] is None
        assert scan["independent_ming_witness"] is False
        assert loc["historical_conflict_resolved"] is False
        assert chart["has_full_hour_chart"] is False
        cases.append({"date":d.isoformat(),"clock":clock.strftime("%H:%M"),"target_volume":9,"page_located":False})
    return {"version":"V91","status":"passed","git_sha":os.getenv("GITHUB_SHA"),"case_count":len(cases),
            "cases":cases,"cadal_file":"CADAL06056495","volumes":[5,6,7,8,9,10],
            "volume_nine_page_located":False,"independent_ming_witness":False,
            "historical_conflict_resolved":False,"may_emend_source_text":False}


if __name__ == "__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",required=True,type=Path)
    args=parser.parse_args()
    report=audit()
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("V91：CADAL卷五至卷十入口登记通过；卷九页码待逐页核定，未冒充明钞本异文")
