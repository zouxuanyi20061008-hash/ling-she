"""V76 8640-case default audit and strict classical alternative witness census."""
import argparse,json
from pathlib import Path
from app.core.calendar import SIXTY_DAYS,BRANCHES
from app.core.liuren import build_liuren
from app.core.liuren_v76 import EXACT_WITNESS, matches_cunyan_witness

SOURCE_TANYUAN="https://shuyuan.zhiming.life/read/%E5%A4%A7%E5%85%AD%E5%A3%AC%E6%8E%A2%E5%8E%9F(%E6%8E%A8%E6%BC%94%E7%AF%87)-%E4%B8%8A/1"
SOURCE_CUNYAN="https://libokang.com/classics/liuren/%E5%85%AD%E5%A3%AC%E5%AD%98%E9%AA%8C/"

def audit():
    verified=0;pending=0;matched=0
    pending_by_day={};evidence={}
    for day in SIXTY_DAYS:
        for general in BRANCHES:
            for hour in BRANCHES:
                c=build_liuren(day,general,hour)
                w=c["historical_witness_v76"]
                assert w["version"]=="V76"
                if c["three_transmissions"]["status"]=="pending":
                    pending+=1
                    pending_by_day[day]=pending_by_day.get(day,0)+1
                    assert c["three_transmissions"]["transmissions"] is None
                    assert c["has_three_transmissions"] is False
                    assert w["status"]=="pending"
                else:
                    verified+=1
                    assert len(c["three_transmissions"]["transmissions"])==3
                if matches_cunyan_witness(c):
                    matched+=1
                    assert (day,general,hour)==("戊辰","戌","辰")
                    assert tuple((p["upper"],p["lower"]) for p in c["four_lessons"])==EXACT_WITNESS
                assert c["fortune_verdict"] is None
    assert (verified,pending,matched)==(8616,24,1),(verified,pending,matched)
    assert pending_by_day=={"戊辰":12,"戊戌":12},pending_by_day
    explicit_count={"tanyuan_computed":0,"cunyan_computed":0,"cunyan_pending":0}
    source_examples=[]
    for day in ("戊辰","戊戌"):
        diagrams=set()
        for general in BRANCHES:
            hour=BRANCHES[(BRANCHES.index(general)+6)%12]
            base=build_liuren(day,general,hour)
            diagrams.add(tuple((r["upper"],r["lower"]) for r in base["four_lessons"]))
            t=build_liuren(day,general,hour,fanyin_tie_school="tanyuan")
            assert [p["branch"] for p in t["three_transmissions"]["transmissions"]]==[
                "亥","巳","亥"]
            explicit_count["tanyuan_computed"]+=1
            c=build_liuren(day,general,hour,fanyin_tie_school="cunyan")
            if matches_cunyan_witness(c):
                assert [p["branch"] for p in c["three_transmissions"]["transmissions"]]==[
                    "巳","亥","巳"]
                explicit_count["cunyan_computed"]+=1
                source_examples.append({"day":day,"general":general,"hour":hour,
                    "four_lessons":[{"upper":u,"lower":l} for u,l in EXACT_WITNESS],
                    "source":SOURCE_CUNYAN,"transmissions":["巳","亥","巳"],
                    "source_type":"single_documented_observation"})
            else:
                assert c["three_transmissions"]["status"]=="pending"
                explicit_count["cunyan_pending"]+=1
        evidence[day]={"rotations":12,"distinct_four_lesson_diagrams":len(diagrams)}
        assert len(diagrams)==1
    assert explicit_count=={"tanyuan_computed":24,"cunyan_computed":1,
                           "cunyan_pending":23},explicit_count
    return {"version":"V76","status":"passed","audited_total":8640,
        "default_computed":verified,"default_pending":pending,
        "remaining_patterns":2,"rotation_count_per_pattern":12,
        "pending_by_day":pending_by_day,"source_scoped_alternatives":explicit_count,
        "documented_cunyan_exact_witness":source_examples,
        "tanyuan_two_day_written_rule_source":SOURCE_TANYUAN,
        "source_level":"theory_rule_vs_one_case_never_merged",
        "rotation_evidence":evidence,"not_a_final_fortune_verdict":True}

if __name__=="__main__":
    arg=argparse.ArgumentParser();arg.add_argument("--output",required=True)
    args=arg.parse_args()
    out=Path(args.output);out.parent.mkdir(parents=True,exist_ok=True)
    result=audit()
    out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("V76 8640盘核准：8616默认已算、24默认未决、两日各12个旋转；《六壬存验》仅1张精确古籍实例可选")
