"""V59 ancient citation anchors for remote/fuyin/fanyin + unresolved shehai."""
from __future__ import annotations
from app.core.liuren import build_liuren
from datetime import datetime
from pathlib import Path
import argparse,json,os

GOLDEN=[
 ("甲辰","巳","申",["申","巳","寅"],"蒿矢"),
 ("庚戌","辰","丑",["寅","巳","申"],"弹射"),
 ("丙辰","未","未",["巳","申","寅"],"自任"),
 ("癸丑","未","未",["丑","戌","未"],"不虞"),
 ("壬辰","未","未",["亥","辰","戌"],"自任"),
 ("庚戌","寅","申",["寅","申","寅"],"反吟"),
 ("辛丑","亥","巳",["亥","未","辰"],"无亲"),
]
def verify():
    out=[]
    for day,gen,hour,third,method in GOLDEN:
        c=build_liuren(day,gen,hour)
        actual=[x["branch"] for x in c["three_transmissions"]["transmissions"]]
        assert actual==third,(day,actual,third)
        assert method in c["three_transmissions"]["method"]
        out.append({"day":day,"general":gen,"hour":hour,
                    "three":third,"method":method,"status":"passed"})
    unresolved=build_liuren("丁卯","亥","丑")
    assert unresolved["three_transmissions"]["transmissions"] is None
    assert {x["upper"] for x in unresolved["three_transmissions"]["rule_audit"]["candidate_details"]}=={"丑","亥"}
    return {"version":"V59","status":"passed","git_sha":os.getenv("GITHUB_SHA"),
       "independent_refs":{
         "remote":"https://www.shidianguji.com/book/SK1599/chapter/1k1lqkrmpx06d",
         "fuyin":"https://libokang.com/classics/liuren/%E5%A4%A7%E5%85%AD%E5%A3%AC%E6%8C%87%E5%8D%97/",
         "fanyin":"https://libokang.com/classics/liuren/%E5%85%AD%E5%A3%AC%E7%B2%B9%E8%A8%80/"},
       "golden_cases":out,"shehai_not_auto_guessed":True,
       "all_nine_methods_complete":False,"fortune_verdict":None}
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--output",required=True,type=Path)
    a=p.parse_args();v=verify();a.output.parent.mkdir(parents=True,exist_ok=True)
    a.output.write_text(json.dumps(v,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("V59 遥克、伏吟、反吟古籍三传锚点已验；涉害候选保留而不伪择")
