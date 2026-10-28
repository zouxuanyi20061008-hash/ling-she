"""V84 evidence for solstice-based Taiyi palace, Jishen, chief and conditional 8-door chart."""
import argparse,json
from pathlib import Path
from datetime import date,time,timedelta
from app.core.taiyi_hour_v77 import hour_basic_board,_jieqi
from app.core.taiyi_hour_v84 import qiying_hour_core

def audit():
    result={"version":"V84","status":"passed","solstice_first_hour":{},
      "source_branches_disjoint":True,"full_hourly_chart_verified":False,
      "verified_qiying_main_guest_generals":False,
      "gate_chart_is_conditional_not_independent_original":True}
    for term,month in (("冬至",12),("夏至",6)):
        instant=_jieqi(2026,term,month)
        now=instant+timedelta(seconds=1)
        c=hour_basic_board(now.date(),now.time())
        q=c["hour_v84_qiying_plate"]["qiying"]
        assert q["relative_hours"]==1
        assert q["taiyi_palace"]["number"]==(1 if term=="冬至" else 9)
        assert q["hour_chief"]["chief_door"]==("开" if term=="冬至" else "杜")
        result["solstice_first_hour"][term]={
           "starts_at_beijing":instant.isoformat(),
           "qiying_taiyi_palace":q["taiyi_palace"]["number"],
           "qiying_jishen":q["jishen"],
           "qiying_chief":q["hour_chief"]["chief_door"],
           "jiazi_count":c["hour_v84_qiying_plate"]["jiazi"]["accumulated_hours"],
           "taiyi_conditional_eight_doors":q["taiyi_eight_door_conditional_rotation"]["by_palace"],
           "qiying_general_historical_initial_position":None,
           "cross_epoch_main_guest_mixed":False,
        }
    samples=[]
    for day,when in ((date(2026,6,22),time(9,30)),
                     (date(2026,10,28),time(14,30)),
                     (date(2026,12,23),time(10,30)),
                     (date(2026,12,24),time(0,30))):
        c=hour_basic_board(day,when)
        a=c["hour_v84_qiying_plate"]
        samples.append({
           "date":day.isoformat(),"clock":when.isoformat(),
           "qiying_taiyi":a["qiying"]["taiyi_palace"]["number"],
           "jiazi_taiyi":a["jiazi"]["taiyi_palace"]["number"],
           "qiying_chief":a["qiying"]["hour_chief"]["chief_door"],
           "jiazi_chief":a["jiazi"]["hour_chief"]["chief_door"],
           "same_chief":a["same_chief"],"same_taiyi":a["same_taiyi_palace"],
           "same_conditional_rotation":a["same_conditional_taiyi_door_rotation"],
           "qiying_main_guest_pending":True,
        })
    result["dated_2026_examples"]=samples
    checks={}
    for dun,term in (("阳遁","冬至"),("阴遁","夏至")):
        stats={"hours":0,"distinct_chief_doors":[],"distinct_taiyi_palaces":[],
               "all_missing_qiying_generals":True,"all_eight_conditional_positions":True}
        doors=set();palaces=set()
        for n in range(1,361):
            c=qiying_hour_core(n,dun,term)
            assert c["qiying_main_general"]["palace"] is None
            assert c["qiying_guest_general"]["palace"] is None
            assert c["taiyi_eight_door_conditional_rotation"]["by_door"][
                c["hour_chief"]["chief_door"]]==c["taiyi_palace"]["number"]
            assert not c["has_verified_full_eight_door_palaces"]
            stats["hours"]+=1
            doors.add(c["hour_chief"]["chief_door"])
            palaces.add(c["taiyi_palace"]["number"])
        stats["distinct_chief_doors"]=sorted(doors)
        stats["distinct_taiyi_palaces"]=sorted(palaces)
        assert len(doors)==4 and len(palaces)==8
        checks[dun]=stats
    result["360_each_qiying_yin_yang"]=checks
    return result

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--output",required=True)
    a=p.parse_args();x=audit();out=Path(a.output)
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(x,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("V84：冬夏至气应第一时太乙/计神/值使独立复算，八卦旋宫仅作太乙候选，主客大将无起点仍空；阴阳720时核验。")
