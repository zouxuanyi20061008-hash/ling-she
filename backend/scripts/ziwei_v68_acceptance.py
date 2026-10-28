"""V68 独立锚点与闰月双口径验收证据（不依赖网络）。"""
import argparse
import json
from pathlib import Path
from datetime import date, time
from app.core.ziwei import cast_ziwei

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",required=True)
    args=parser.parse_args()
    classic=cast_ziwei("lunar",None,1980,1,4,False,time(9),"male")
    leap=cast_ziwei("solar",date(2020,5,23),None,None,None,False,time(12),
                    "unspecified","same_month")
    variant=cast_ziwei("solar",date(2020,5,23),None,None,None,False,time(12),
                       "unspecified","next_month")
    assert (classic["year_ganzhi"],classic["ming_branch"],
            classic["five_element_bureau"]["label"],classic["ziwei_branch"])==(
            "庚申","酉","水二局","卯")
    assert classic["calendar"]["solar_date"]=="1980-02-19"
    assert (leap["calendar"]["lunar"]["is_leap_month"] and
            leap["ming_branch"]!=variant["ming_branch"])
    evidence={
      "version":"V68",
      "independent_fixture":"https://www.doushu.ai/star-rules",
      "fixture_1980":{
        "solar_date":classic["calendar"]["solar_date"],
        "lunar":classic["calendar"]["lunar"],
        "year_ganzhi":classic["year_ganzhi"],
        "ming_ganzhi":classic["ming_ganzhi"],
        "bureau":classic["five_element_bureau"],
        "ziwei":classic["ziwei_branch"],"tianfu":classic["tianfu_branch"],
        "fourteen_stars":classic["star_positions"]},
      "leap_2020":{
        "date":"2020-05-23",
        "lunar":leap["calendar"]["lunar"],
        "same_month_ming":leap["ming_branch"],
        "next_month_ming":variant["ming_branch"]},
      "outstanding":classic["not_implemented"]
    }
    path=Path(args.output)
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(evidence,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps({"status":"passed","version":"V68","fixture_count":2},ensure_ascii=False))

if __name__=="__main__":
    main()
