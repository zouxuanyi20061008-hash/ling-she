"""V50 Qimen foundation CI artifact, recording reproducible classical anchor plates."""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path

from app.core.qimen import _plate, TERM_JU

FIXED={
    "mangzhong_guihai_bingchen":{
        "input":["芒种","癸亥","丙辰"],
        "expected_ju":"阳遁9局",
        "earth":{"1":"己","2":"庚","3":"辛","4":"壬","5":"癸",
                 "6":"丁","7":"丙","8":"乙","9":"戊"},
        "duty":[5,"天禽","死门"],
    },
    "shuangjiang_jiayin_xinwei":{
        "input":["霜降","甲寅","辛未"],
        "expected_ju":"阴遁8局",
        "earth":{"1":"丙","2":"丁","3":"癸","4":"壬","5":"辛",
                 "6":"庚","7":"己","8":"戊","9":"乙"},
        "duty":[8,"天任","生门"],
    },
}


def inspect()->dict:
    cases=[]
    for case_id,fixture in FIXED.items():
        c=_plate(*fixture["input"])
        assert c["ju_label"]==fixture["expected_ju"],case_id
        assert c["earth_plate"]==fixture["earth"],case_id
        assert [c["duty_origin"][key] for key in
                ("earth_origin_palace","origin_star","origin_door")]==fixture["duty"],case_id
        assert c["has_complete_rotating_plate"] is False
        cases.append({"id":case_id,"result":"passed","ju":c["ju_label"],
                      "time_xun":c["duty_origin"]["time_xun"]})
    for term,(yin_yang,ju_set) in TERM_JU.items():
        assert len(ju_set)==3 and all(1<=x<=9 for x in ju_set),term
        assert yin_yang in ("阴","阳"),term
    return {
        "version":"V50","status":"passed","git_sha":os.environ.get("GITHUB_SHA"),
        "source":"《奇门遁甲元灵经》卷一 · 奇门起例",
        "source_url":"https://daizhige.org/易藏/术数/奇门遁甲元灵经.html",
        "fixed_cases":cases,"term_count":len(TERM_JU),"yuan_per_term":3,
        "has_dynamic_earth_plate":True,"has_complete_rotating_sky_gates":False,
        "not_implemented":["天盘值符随时干转布","八门值使随时辰转布",
                           "八神、实际星门落位","全套奇门断课"],
    }


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",type=Path,required=True)
    args=parser.parse_args()
    report=inspect()
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",
                           encoding="utf-8")
    print("V50 奇门原典地盘校验通过：2个原典起局，24节气×3元")
    print("验收 JSON："+str(args.output))


if __name__=="__main__":
    main()
