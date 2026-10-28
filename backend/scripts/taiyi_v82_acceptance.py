"""V82 ancient eight directional gates, four anchor-school alternatives, 720 hourly audit."""
import argparse,json
from pathlib import Path
from app.core.taiyi_hour_v78 import classical_hour_ju
from app.core.taiyi_hour_v79 import calculate_hour_main_guest
from app.core.taiyi_hour_v80 import hour_harmony_dingji,hour_door_chief
from app.core.taiyi_hour_v81 import door_location_candidate_v81
from app.core.taiyi_hour_v82 import source_scoped_eight_door_candidates,rotate_eight_door_candidate,EIGHT_DOORS,PALACES8

def build(n,mode):
    c=classical_hour_ju(n,mode)
    m=calculate_hour_main_guest(c)
    d=hour_harmony_dingji(c,m)
    g=hour_door_chief(n,mode)
    q=door_location_candidate_v81(g,d,m)
    return {"version":"V77","historical_ju_version":"V78",
      "main_guest_version":"V79","classical_hour_extension_version":"V80",
      "historical_review_version":"V81",
      "classical_jiazi_hour_v78":{**c,"is_absolute_upper_jiazi_epoch":False},
      "hour_main_guest_v79":m,"hour_dingji_v80":d,
      "hour_eight_doors_v80":g,"hour_v81_door_location_candidate":q}

def audit():
    original=source_scoped_eight_door_candidates(build(887,"阳遁"))
    assert original["chief"]=="生" and original["candidate_count"]==3
    assert {z["school"] for z in original["candidates"]}=={
      "jinjing_taiyi","jinjing_main","jinjing_guest"}
    assert original["unplaceable"][0]["eye_direction"]=="巳"
    anchors={}
    for v in original["candidates"]:
        anchors[v["school"]]={"palace":v["anchor_palace"],"by_palace":v["by_palace"]}
    assert [anchors[x]["palace"] for x in ("jinjing_taiyi","jinjing_main","jinjing_guest")]==[9,6,3]
    standard=rotate_eight_door_candidate(1,"开","jinjing_taiyi")
    assert list(standard["by_door"].values())==list(PALACES8)
    census={}
    for mode in ("阳遁","阴遁"):
        hist={"variants":0,"no_valid_anchor":0,"intermediate_dingji":0,
             "pending_or_middle_generals":0,
             "computed_unique_not_claimed":0}
        for n in range(1,361):
            q=source_scoped_eight_door_candidates(build(n,mode))
            assert len(q["candidates"])+len(q["unplaceable"])==4
            assert q["which_school_is_default"] is None
            assert not q["complete_eight_door_chart_verified"]
            for v in q["candidates"]:
                assert len(v["slots"])==8
                assert set(v["by_door"])==set(EIGHT_DOORS)
                assert v["by_door"][q["chief"]]==v["anchor_palace"]
                hist["variants"]+=1
                hist["computed_unique_not_claimed"]+=int(not v["verified_as_single_complete_hour_chart"])
            for missing in q["unplaceable"]:
                hist["no_valid_anchor"]+=1
                hist["intermediate_dingji"]+=int(missing["school"]=="jinyao_dingji_eye")
                hist["pending_or_middle_generals"]+=int(missing["school"]!="jinyao_dingji_eye")
        assert hist["variants"]+hist["no_valid_anchor"]==1440
        census[mode]=hist
    return {"version":"V82","status":"passed",
      "ancient_standard_compass":standard["by_door"],
      "ancient_887_chief":"生","ancient_887_source_scoped_anchors":anchors,
      "ancient_887_intermediate_dingji_unplaceable":original["unplaceable"],
      "four_historical_schools":True,"720_slot_census":census,
      "no_confirmed_unique_complete_hourly_eight_door_chart":True,
      "does_not_treat_annual_chief_as_hour_chief":True,
      "verified_witness_is_only_chief_not_entire_eight_doors":True}
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--output",required=True)
    a=p.parse_args();result=audit()
    out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("V82: 八门古籍八卦环序、太乙/主客大将/定计目四候选锚点，庚戌时三候选+间神不可置，阴阳720课通过。")
