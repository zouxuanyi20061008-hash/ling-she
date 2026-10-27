"""V60 independent ancient golden examples: 昴星/别责/八专, plus SheHai non-fabrication."""
from pathlib import Path
import argparse,json,os
from app.core.liuren import build_liuren

FIXTURES=[
 ("戊申","辰","卯",["戌","酉","午"],"昴星"),
 ("丁丑","丑","辰",["子","辰","戌"],"昴星"),
 ("丙辰","辰","卯",["亥","午","午"],"别责"),
 ("辛酉","亥","子",["丑","酉","酉"],"别责"),
 ("甲寅","丑","辰",["丑","亥","亥"],"八专"),
 ("丁未","辰","丑",["亥","戌","戌"],"八专"),
 ("己未","酉","未",["酉","酉","酉"],"八专"),
 ("庚申","亥","申",["丑","亥","亥"],"八专"),
]
def verify():
    cases=[]
    for d,g,h,expected,method in FIXTURES:
        c=build_liuren(d,g,h)
        t=c["three_transmissions"]
        assert t["status"]=="computed"
        assert [x["branch"] for x in t["transmissions"]]==expected
        assert t["method"].startswith(method)
        cases.append({"day":d,"general":g,"hour":h,"source_method":method,
                      "transmissions":expected,"unique_real_lessons":
                       c["transmission_review"]["distinct_lesson_audit"]["distinct_lesson_count"]})
    pending=build_liuren("甲申","亥","丑")["three_transmissions"]
    assert pending["transmissions"] is None and pending["status"]=="pending"
    assert pending["rule_audit"]["uses_true_ground_palace"] is True
    assert pending["rule_audit"]["depths_computed"] is False
    return {"version":"V60","status":"passed","sha":os.getenv("GITHUB_SHA"),
       "classical_source":"https://zh.wikisource.org/wiki/%E5%85%AD%E5%A3%AC%E5%A4%A7%E5%85%A8/7",
       "independent_source":"https://libokang.com/classics/liuren/%E5%A4%A7%E5%85%AD%E5%A3%AC%E9%87%91%E9%93%B0%E5%89%AA/",
       "classic_cases":cases,"fixed_case_count":len(cases),
       "shehai_ground_class_fixed":True,"shehai_depths_verified":False,
       "all_nine_methods_complete":False,"actual_fortune_prediction":None}
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--output",required=True,type=Path)
    a=p.parse_args();out=verify();a.output.parent.mkdir(parents=True,exist_ok=True)
    a.output.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("V60 8古籍整盘固定例、昴星别责八专、涉害地盘审计核验通过")
