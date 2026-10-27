"""V57 independent fixed Jie anchors, 12 month windows and luck interval witness."""
from datetime import date,time,datetime,timedelta
import json,os,argparse
from pathlib import Path
from app.core.bazi import cast_bazi
from app.core.bazi_flow import compute_bazi_flow,JIE_NAMES

def run_acceptance():
    birth=cast_bazi(date(1999,7,21),time(16),luck_direction="forward")
    facts=[
        ("2026-02-04","03:30","乙巳","己丑","小寒",2025),
        ("2026-02-04","04:30","丙午","庚寅","立春",2026),
        ("2026-01-15","12:00","乙巳","己丑","小寒",2025),
    ]
    cases=[]
    for d,clock,year,month,jie,solar_y in facts:
        x=compute_bazi_flow(birth,date.fromisoformat(d),time.fromisoformat(clock))
        assert (x["year"]["ganzhi"],x["month"]["ganzhi"],
                x["month"]["jie_name"],x["solar_year_start"])==(year,month,jie,solar_y)
        assert [m["jie_name"] for m in x["months"]]==list(JIE_NAMES[:12])
        assert len(x["months"])==12 and sum(m["selected"] for m in x["months"])==1
        assert x["fortune_verdict"] is None
        cases.append({"date":d,"clock":clock,"year":year,"month":month,
                      "jie":jie,"solar_year":solar_y})
    boundary=datetime.fromisoformat(birth["luck"]["luck_decades"][0]["ends_before_beijing"])
    exact=compute_bazi_flow(birth,boundary.date(),boundary.timetz().replace(tzinfo=None))
    assert exact["luck_at_target"]["phase"]["order"]==2
    prior=boundary-timedelta(seconds=1)
    before=compute_bazi_flow(birth,prior.date(),prior.timetz().replace(tzinfo=None))
    assert before["luck_at_target"]["phase"]["order"]==1
    return {
        "version":"V57","status":"passed","git_sha":os.getenv("GITHUB_SHA"),
        "primary_calendar_reference":"https://github.com/6tail/lunar-python/blob/master/lunar_python/Lunar.py",
        "external_anchors":cases,"twelve_jie_windows":True,
        "luck_decade_end_exclusive":True,"time_zone":"Asia/Shanghai",
        "has_event_or_fortune_prediction":False,
    }

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--output",type=Path,required=True)
    a=p.parse_args();report=run_acceptance()
    a.output.parent.mkdir(parents=True,exist_ok=True)
    a.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("V57 流年流月：立春前后 + 全12节令窗口 + 十年大运精确换界核验通过")
