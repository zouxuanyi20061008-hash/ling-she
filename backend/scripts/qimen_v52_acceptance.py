"""Independent V52 Q1 full disc eight spirits, void and time-horse fixture."""
import argparse,json,os
from datetime import date,time
from pathlib import Path
from app.core.qimen import cast_qimen

EXPECTED={"1":"六合","2":"值符","3":"玄武","4":"九地",
          "6":"太阴","7":"腾蛇","8":"白虎","9":"九天"}
def inspect():
    c=cast_qimen(date(2026,3,18),time(15,20))
    assert c["ju_label"]=="阳遁4局"
    assert c["spirit_plate"]["placements"]==EXPECTED
    assert c["hour_markers"]["void_branches"]==["辰","巳"]
    assert c["hour_markers"]["void_palaces"]==[4]
    assert c["hour_markers"]["horse_branch"]=="寅"
    assert c["hour_markers"]["horse_palace"]==8
    by={p["number"]:p for p in c["palaces"]}
    assert by[3]["structural_status"]["instrument_strike"]
    assert by[4]["structural_status"]["instrument_strike"]
    assert not c["has_final_divination"]
    return {"version":"V52","status":"passed","git_sha":os.getenv("GITHUB_SHA"),
        "source_spirits":"https://www.guyujian.cn/learn/qimen/07",
        "source_void_horse":"https://qimenjie.com/zh-Hant-TW/learn/chart-markers",
        "q1":{"spirits":EXPECTED,"hour_void":["辰","巳"],"void_palaces":[4],
              "horse_branch":"寅","horse_palace":8,"instrument_strike":[3,4]},
        "has_core_four_layers":True,"fortune_verdict":None}
if __name__=="__main__":
    parser=argparse.ArgumentParser();parser.add_argument("--output",required=True,type=Path)
    a=parser.parse_args();result=inspect()
    a.output.parent.mkdir(parents=True,exist_ok=True)
    a.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("V52 奇门八神、时旬空、时马星、基础结构验收通过")
