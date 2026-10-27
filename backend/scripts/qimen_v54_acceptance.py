"""V54 independent historical three-wonder truth set & actual Q1 demonstration."""
from __future__ import annotations
import argparse,json,os
from pathlib import Path
from datetime import date,time
from app.core.qimen import cast_qimen
from app.core.qimen_wonders import classify_wonder

# Manually transcribed, not computed by the Qimen app.
BURIAL=(("乙",2,"未"),("丙",6,"戌"),("丁",8,"丑"))
CLASSIC=(("乙","己","甲戌"),("乙","辛","甲午"),
         ("丙","戊","甲子"),("丙","庚","甲申"),
         ("丁","壬","甲辰"),("丁","癸","甲寅"))

def verify():
    for sky,palace,branch in BURIAL:
        result=classify_wonder(sky,"癸",palace,"伤门","开门",1)
        assert result["burial"] and result["burial_grave_branch"]==branch
    for sky,earth,xun in CLASSIC:
        result=classify_wonder(sky,earth,4,"杜门","开门",6)
        assert result["classical_six_jia_instrument"]==xun
        assert result["alternative_chief_door_overlap"] is False
    q=cast_qimen(date(2026,3,18),time(15,20))
    v=q["wonder_rule_review"]
    assert q["version"]=="V54" and q["ju_label"]=="阳遁4局"
    assert v["burial_positions"]==[] and v["classical_six_jia_positions"]==[]
    assert v["chief_door_overlap_positions"]==[9]
    assert v["strict_good_chief_door_positions"]==[]
    assert v["interpretation_disagreements"]==[9]
    assert not q["has_final_divination"]
    assert not q["dark_stem_plate"]["independently_verified_from_classic_example"]
    return {
        "version":"V54","result":"passed","git_sha":os.getenv("GITHUB_SHA"),
        "burial_source":"https://www.shidianguji.com/book/SK1616/chapter/1l9lopdno0utc",
        "six_jia_source":"https://zh.wikisource.org/zh/奇門遁甲統宗",
        "ancient_burial_cases":[{"sky":s,"palace":p,"branch":b} for s,p,b in BURIAL],
        "ancient_six_armor_cases":[{"sky":s,"earth":e,"xun":x} for s,e,x in CLASSIC],
        "q1_20260318":{"date":"2026-03-18","beijing_time":"15:20","ju":"阳遁4局",
                      "burial":[],"classical":[],"different_variant":[9],
                      "strict_good_duty":[]},
        "distinguishes_classic_and_alternative":True,
        "variant_dark_stem_primary_full_case_confirmed":False,
        "outcome_computed":False,
    }

if __name__=="__main__":
    parser=argparse.ArgumentParser();parser.add_argument("--output",type=Path,required=True)
    args=parser.parse_args();result=verify()
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("V54 古籍三奇入墓3锚点、六甲三奇得使6锚点、Q1整盘两口径分歧核对通过")
