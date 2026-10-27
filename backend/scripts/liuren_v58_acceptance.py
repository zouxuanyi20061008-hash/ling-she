"""V58 manual classic exemplar anchors and real middle-Qi calendar check."""
import argparse,json,os
from datetime import date,datetime,time,timedelta
from pathlib import Path
from lunar_python import Solar
from app.core.liuren import build_liuren,cast_liuren


def verify():
    fixtures=[
        ("甲申","亥","丑",[("子","甲"),("戌","子"),("午","申"),("辰","午")],None),
        ("丙戌","申","巳",[("申","丙"),("亥","申"),("丑","戌"),("辰","丑")],
         ["申","亥","寅"]),
        ("甲子","亥","子",[("丑","甲"),("子","丑"),("亥","子"),("戌","亥")],
         ["子","亥","戌"]),
    ]
    facts=[]
    for day,gen,hour,lessons,three in fixtures:
        c=build_liuren(day,gen,hour)
        assert [(x["upper"],x["lower"]) for x in c["four_lessons"]]==lessons
        actual=c["three_transmissions"]["transmissions"]
        if three is None:assert actual is None and c["three_transmissions"]["status"]=="pending"
        else:assert [x["branch"] for x in actual]==three
        facts.append({"day":day,"general":gen,"hour":hour,"four_lessons":lessons,
                      "transmissions":three,"state":c["three_transmissions"]["status"]})
    solar=Solar.fromYmdHms(2026,2,10,12,0,0).getLunar().getNextQi(False).getSolar()
    when=datetime.strptime(solar.toYmdHms(),"%Y-%m-%d %H:%M:%S")
    before=when-timedelta(seconds=1);after=when+timedelta(seconds=1)
    a=cast_liuren(before.date(),before.time())
    b=cast_liuren(after.date(),after.time())
    assert a["month_general"]=="子" and b["month_general"]=="亥"
    return {"version":"V58","status":"passed","sha":os.getenv("GITHUB_SHA"),
        "source_guide":"https://zh.wikisource.org/zh-hans/%E5%85%AD%E5%A3%AC%E6%8C%87%E5%8D%97/1",
        "source_daquan":"https://libokang.com/classics/liuren/%E5%85%AD%E5%A3%AC%E5%A4%A7%E5%85%A8/",
        "classic_fixtures":facts,"real_yushui_boundary":{"before":"子","after":"亥"},
        "nine_methods_complete":False,"fortune_verdict":None}

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--output",type=Path,required=True)
    args=p.parse_args();v=verify()
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(v,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("V58 大六壬：三古籍固定四课/三传案例与雨水交节月将边界通过")
