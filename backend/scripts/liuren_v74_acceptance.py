"""V74 actual 3 Fuyin reciprocal-Mao independent anchors and pending taxonomy."""
from __future__ import annotations
import argparse,json
from pathlib import Path
from app.core.liuren import build_liuren
from app.core.calendar import BRANCHES,SIXTY_DAYS

ANCIENT="https://www.zhaosir.online/Books/BookChapterDetail.aspx?did=1650"
SECONDARY="https://orasage.com/zh-CN/daozang/docs/zh-cn/5_5_3"
SPECIAL_DAYS=("丁卯","己卯","辛卯")
SPECIAL_TRIPLE=("卯","子","午")

def audit():
    verified=[]
    for day in SPECIAL_DAYS:
        chart=build_liuren(day,"未","未")
        t=chart["three_transmissions"]
        actual=tuple(row["branch"] for row in t["transmissions"])
        assert actual==SPECIAL_TRIPLE,(day,actual)
        assert t["rule_audit"]["reciprocal_punishment_broken_by_clash"]
        assert chart["pending_branch_review"]["classical_exception_applied"]
        assert chart["audit_version"]=="V74"
        verified.append({"day":day,"month_general":"未","hour_branch":"未",
                         "fixed_three_transmissions":list(actual),
                         "method":t["method"],"result":"passed"})
    counts={}
    examples={}
    pending=0
    for day in SIXTY_DAYS:
        for general in BRANCHES:
            for hour in BRANCHES:
                chart=build_liuren(day,general,hour)
                review=chart["pending_branch_review"]
                if review["status"]=="pending":
                    pending+=1
                    k=review["category"]
                    counts[k]=counts.get(k,0)+1
                    examples.setdefault(k,{"day":day,"general":general,
                        "hour_branch":hour,"reason":review["reason"],
                        "initial_candidates":review["candidate_branches"]})
                    assert chart["three_transmissions"]["transmissions"] is None
                    assert not chart["has_three_transmissions"]
                else:
                    assert len(chart["three_transmissions"]["transmissions"])==3
                assert chart["fortune_verdict"] is None
    assert pending>0
    return {
        "version":"V74","status":"passed",
        "classical_three_day_fixture_source":ANCIENT,"cross_check":SECONDARY,
        "independent_special_cases":verified,
        "all_60x12x12_plates_reviewed":8640,
        "unresolved_count":pending,"unresolved_categories":counts,
        "representative_unresolved_cases":examples,
        "still_not_fully_implemented":True,"no_outcomes_generated":True,
    }

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--output",required=True)
    args=p.parse_args()
    data=audit()
    dest=Path(args.output);dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"V74 伏吟丁己辛三卯例卯子午已核；8640课未决{data['unresolved_count']}课维持待判")
