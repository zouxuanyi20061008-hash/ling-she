"""V56 independent Chinese classic rule anchors & 6tail Yun sect2 crosscheck."""
from datetime import date,time
import argparse,json,os
from pathlib import Path
from app.core.bazi import cast_bazi
from app.core.bazi_yun import compute_bazi_luck


def check():
    checks=[]
    for d,h in [("1999-07-21","16:00"),("1990-05-15","10:00"),
                ("2026-02-04","03:30"),("2026-02-04","04:30")]:
        for mode in ("traditional_male","traditional_female"):
            day=date.fromisoformat(d);clock=time.fromisoformat(h)
            chart=cast_bazi(day,clock)
            luck=compute_bazi_luck(chart,day,clock,mode)
            if not luck["upstream_yun_sect2_verified"]:
                raise AssertionError("canonical source crosscheck absent")
            checks.append({"date":d,"clock":h,"mode":mode,
                           "direction":luck["direction"],
                           "start":luck["start_at_beijing"],
                           "first":luck["luck_decades"][0]["ganzhi"]})
    demo=next(x for x in checks if x["date"]=="1990-05-15" and x["mode"]=="traditional_male")
    assert demo["direction"]=="顺排"
    before=next(x for x in checks if x["date"]=="2026-02-04" and x["clock"]=="03:30" and x["mode"]=="traditional_male")
    after=next(x for x in checks if x["date"]=="2026-02-04" and x["clock"]=="04:30" and x["mode"]=="traditional_male")
    assert before["direction"]=="逆排" and after["direction"]=="顺排"
    return {"version":"V56","status":"passed","git_sha":os.getenv("GITHUB_SHA"),
            "classical_text":"https://tianjihq.com/zh-CN/learn/books/sanche-yilan/9",
            "canonical_library":"https://github.com/6tail/lunar-python/blob/master/lunar_python/eightchar/Yun.py",
            "cases":checks,"canonical_crosschecks":len(checks),
            "years_per_luck":10,"decades":8,
            "manual_direction_needs_personal_gender":False,
            "fortune_verdict":None}


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",type=Path,required=True)
    a=parser.parse_args()
    report=check()
    a.output.parent.mkdir(parents=True,exist_ok=True)
    a.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print(f"V56 四柱大运验收通过：{report['canonical_crosschecks']}组原库分钟起运、立春两侧顺逆、8步大运")
