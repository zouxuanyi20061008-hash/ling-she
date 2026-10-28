"""V75 independent classical reverse-chant goldens + 8640 census."""
import argparse,json
from pathlib import Path
from app.core.liuren import build_liuren
from app.core.calendar import SIXTY_DAYS,BRANCHES

SRC_Q1="https://www.shidianguji.com/zh/book/SDZJ0646/chapter/1kg32r7axpul7"
SRC_TANYUAN="https://dclef.com/xuanxuedocs/%E5%A4%A7%E5%85%AD%E5%A3%AC%E6%8E%A2%E5%8E%9F/001%E5%8D%B7%E4%B8%8A%20%E6%8E%A8%E6%BC%94%E7%AF%87.html"
SRC_CUNYAN="https://libokang.com/classics/liuren/%E5%85%AD%E5%A3%AC%E5%AD%98%E9%AA%8C/"

def validate():
    fixtures=[]
    for day in ("甲子","庚午","庚子","甲午"):
        chart=build_liuren(day,"子","午")
        triple=[p["branch"] for p in chart["three_transmissions"]["transmissions"]]
        assert triple==["寅","申","寅"],(day,triple)
        assert chart["fanyin_shehai_v75"]["decision_rule"]=="unique_inclusive_depth"
        fixtures.append({"day":day,"general":"子","hour":"午",
          "triple":triple,"source":SRC_Q1 if day in ("甲子","庚午")
                      else "同法循宫深度推演，未独立声称古籍逐课列出"})
    for day in ("戊辰","戊戌"):
        baseline=build_liuren(day,"子","午")
        assert baseline["three_transmissions"]["status"]=="pending"
        tanyuan=build_liuren(day,"子","午",fanyin_tie_school="tanyuan")
        branches=[x["branch"] for x in tanyuan["three_transmissions"]["transmissions"]]
        assert branches==["亥","巳","亥"],(day,branches)
        fixtures.append({"day":day,"source":SRC_TANYUAN,
                         "default_status":"pending","selected_school":"tanyuan",
                         "triple":branches})
    cunyan=build_liuren("戊辰","戌","辰",fanyin_tie_school="cunyan")
    assert [x["branch"] for x in cunyan["three_transmissions"]["transmissions"]]==[
        "巳","亥","巳"]
    fixtures.append({"day":"戊辰","general":"戌","hour":"辰",
                     "source":SRC_CUNYAN,"selected_school":"cunyan",
                     "triple":["巳","亥","巳"]})
    default_pending={}
    reverse_cases=0
    verified=0
    for day in SIXTY_DAYS:
        for general in BRANCHES:
            for hour in BRANCHES:
                c=build_liuren(day,general,hour)
                a=c["fanyin_shehai_v75"]
                if a["applied"]:
                    reverse_cases+=1
                    assert a["ground_is_actual_lower_palace"]
                    assert len(a["candidate_details"])==2
                t=c["three_transmissions"]
                if t["status"]=="pending":
                    default_pending[day]=default_pending.get(day,0)+1
                    assert t["transmissions"] is None and not c["has_three_transmissions"]
                else:
                    verified+=1
                    assert len(t["transmissions"])==3
                assert c["fortune_verdict"] is None
    assert default_pending=={"戊辰":12,"戊戌":12},default_pending
    assert verified==8616 and reverse_cases==72,(verified,reverse_cases)
    return {"version":"V75","status":"passed","all_charts_checked":8640,
      "V74_unresolved":72,"V75_newly_unique_computed":48,
      "remaining_default_pending":24,"default_computed":8616,
      "remaining_days":default_pending,"reversed_chant_cases":reverse_cases,
      "source_aware_fixtures":fixtures,
      "explicit_tanyuan_and_cunyan_are_not_merged":True,
      "tanyuan_source":SRC_TANYUAN,"cunyan_source":SRC_CUNYAN,
      "no_fortune_predictions":True,"complete_nine_methods_claim":False}

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--output",required=True)
    args=p.parse_args();result=validate()
    out=Path(args.output);out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("V75 8640组校核：反吟72中深度唯一48已实算、复等24默认保留未决，独立原典异文两套分栏")
