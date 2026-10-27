"""V55 independently fixed ba-zi date/time examples from upstream EightCharTest."""
from __future__ import annotations
import argparse,json,os
from datetime import date,time
from pathlib import Path
from app.core.bazi import cast_bazi

# Source facts transcribed from 6tail/lunar-python test/EightCharTest.py,
# fromBaZi inverse examples; never generated from our own app.
KNOWN={
 "1999-07-21T16:00":("己卯","辛未","甲戌","壬申"),
 "1960-12-17T12:00":("庚子","戊子","己卯","庚午"),
 "1987-08-03T02:00":("丁卯","丁未","甲申","乙丑"),
 "2023-02-24T23:00":("癸卯","甲寅","癸丑","壬子"),
}
def verify():
    results=[]
    for dt,wanted in KNOWN.items():
        ymd,hm=dt.split("T")
        cast=cast_bazi(date.fromisoformat(ymd),time.fromisoformat(hm),"midnight")
        actual=tuple(p["ganzhi"] for p in cast["pillars"])
        if actual!=wanted:raise AssertionError(f"{dt} expected {wanted}, actual {actual}")
        results.append({"datetime_beijing":dt,"pillars":list(wanted),"status":"passed"})
    prior=cast_bazi(date(2026,2,4),time(3,30))
    after=cast_bazi(date(2026,2,4),time(4,30))
    if (prior["year_ganzhi"],prior["month_ganzhi"],
        after["year_ganzhi"],after["month_ganzhi"])!=(
        "乙巳","己丑","丙午","庚寅"):
        raise AssertionError("立春换年月界线错误")
    late=cast_bazi(date(2023,2,24),time(23),"zi_hour")
    if (late["day_ganzhi"],late["hour_ganzhi"])!=("甲寅","甲子"):
        raise AssertionError("子初换日须联动五鼠遁时柱")
    return {
      "version":"V55","status":"passed","git_sha":os.getenv("GITHUB_SHA"),
      "independent_source":"https://github.com/6tail/lunar-python/blob/master/test/EightCharTest.py",
      "fixed_count":len(results),"fixtures":results,
      "lichun_2026":{"before":"乙巳 己丑","after":"丙午 庚寅"},
      "late_zi_20230224":{"midnight":"癸丑 壬子","zi_hour":"甲寅 甲子"},
      "timezone":"Asia/Shanghai","sun_true_time_computed":False,
      "decade_luck_computed":False,"actual_prediction":None,
    }
if __name__=="__main__":
    parser=argparse.ArgumentParser();parser.add_argument("--output",required=True,type=Path)
    args=parser.parse_args();r=verify()
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(r,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("V55 四柱独立固定真值核验通过：4案例、2026立春、2023晚子时双规则")
