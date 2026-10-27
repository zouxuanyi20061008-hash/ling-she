"""V61 independent SheHai classic deep-count and variant comparison."""
from pathlib import Path
import argparse,json,os
from app.core.liuren import build_liuren

CASES=[
 ("丁卯","亥","丑",["亥","酉","未"],{"丑":2,"亥":6}),
 ("己卯","申","戌",["亥","酉","未"],{"丑":2,"亥":6}),
 ("庚子","申","戌",["午","辰","寅"],{"午":4,"戌":2}),
 ("戊辰","卯","申",["子","未","寅"],{"子":4,"午":4}),
 ("甲申","亥","丑",["午","辰","寅"],{"午":4,"戌":2}),
]
def verify():
    items=[]
    for day,general,hour,expected,depths in CASES:
        c=build_liuren(day,general,hour)
        t=c["three_transmissions"]
        triple=[v["branch"] for v in t["transmissions"]]
        assert triple==expected,(day,triple,expected)
        got={v["upper"]:v["inclusive_depth"]
             for v in c["shehai_v61"]["candidate_depths"]}
        assert got==depths,(day,got,depths)
        items.append({"day":day,"month_general":general,"hour":hour,
           "initial_mid_final":expected,
           "candidate_depths":c["shehai_v61"]["candidate_depths"],
           "variants":c["shehai_v61"]["variance"],
           "classical_first":c["shehai_v61"]["selected_by_inclusive"]})
    assert items[0]["variants"]["depth_vs_shortcut_disagree"] is True
    ding=build_liuren("丁卯","亥","丑")
    hai=next(v for v in ding["three_transmissions"]["rule_audit"]["candidate_details"]
             if v["upper"]=="亥")
    assert hai["shehai_trace"]["depth"]==6
    assert hai["shehai_excluding_start"]["depth"]==5
    return {"version":"V61","status":"passed","sha":os.getenv("GITHUB_SHA"),
      "classical_primary":"https://www.shidianguji.com/book/SK1599/chapter/1m1g2evjvmoez",
      "full_count_examples":"https://www.zhaosir.online/Books/BookChapterDetail.aspx?did=885",
      "classical_tie":"https://luckclub.cn/daliuren/003/002/",
      "golden_cases":items,"classic_count":len(items),
      "shehai_depths_calculated_and_paths_preserved":True,
      "alternative_methods_kept_separate":True,
      "all_nine_methods_fully_verified":False,
      "real_world_fortune_prediction":None}
if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",type=Path,required=True)
    a=parser.parse_args();result=verify()
    a.output.parent.mkdir(parents=True,exist_ok=True)
    a.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("V61 五份涉害古籍实例、逐宫计害与孟仲季分歧对照验收通过")
