"""V61 大六壬涉害：逐地盘宫返本家计克 + 古典简式分歧复核。

Primary calculation: starting under the candidate upper god, advance in
traditional branch order through its home ground palace, counting branch
and the stem(s) lodging at each visited palace separately whenever the
earth position 克候选上神 (下贼上) or the upper 克 earth position (上克下).
This is the *inclusive* witness used in classical annotated examples.
A second historical counting convention excludes starting ground; both
are shown. Direct 孟仲季 shortcut is separately compared, never merged.

Sources: 《大六壬大全·涉害课》, 《大六壬详解·九宗门》,
《大六壬探原·推演篇》.
"""
from __future__ import annotations
from .calendar import BRANCHES,STEMS
from .bazi import BRANCH_ELEMENT,STEM_ELEMENT,CONTROLS
from .liuren import LODGES
from .liuren_v59 import _triple,THREE_PART,BRANCH_INDEX

SOURCE="https://www.shidianguji.com/book/SK1599/chapter/1m1g2evjvmoez"
FULL_EXAMPLES="https://www.zhaosir.online/Books/BookChapterDetail.aspx?did=885"
TIE_RULES="https://luckclub.cn/daliuren/003/002/"
ALT_SOURCE="https://www.shidianguji.com/book/NA09040/chapter/1m5wvr5ay3py3"
STEMS_AT={b:[s for s in STEMS if LODGES[s]==b] for b in BRANCHES}
CLASS_PRIORITY={"孟":0,"仲":1,"季":2}


def crossing_trace(upper:str,ground:str,relation:str,include_first:bool=True)->dict:
    """Document each actual encounter, not just a numerical final answer."""
    if upper not in BRANCHES or ground not in BRANCHES or relation not in ("下贼上","上克下"):
        raise ValueError("涉害需真实上神、下临地盘和原课贼克方向")
    current=BRANCH_INDEX[ground]
    home=BRANCH_INDEX[upper]
    visits=[];hit_details=[]
    for steps in range(12):
        earth=BRANCHES[(current+steps)%12]
        tokens=[("地支",earth,BRANCH_ELEMENT[earth])]
        tokens += [("寄干",s,STEM_ELEMENT[s]) for s in STEMS_AT[earth]]
        included=bool(include_first or steps>0)
        hits=[]
        for origin,name,element in tokens:
            harm=(CONTROLS[element]==BRANCH_ELEMENT[upper]
                  if relation=="下贼上"
                  else CONTROLS[BRANCH_ELEMENT[upper]]==element)
            if included and harm:
                hit={"earth":earth,"kind":origin,"symbol":name,"element":element,
                     "relation":relation}
                hits.append(hit);hit_details.append(hit)
        visits.append({"earth":earth,"step":steps,"counted":included,
                       "checked_branches_and_lodged_stems":len(tokens),
                       "hits":hits,"hit_count":len(hits)})
        if (current+steps)%12==home:break
    else:raise ValueError("涉害循地盘归本家不能超过十二宫")
    if visits[-1]["earth"]!=upper or len(visits)>12:
        raise ValueError("未从下临地盘抵达上神本家")
    return {"upper":upper,"starting_ground":ground,
            "ending_ground":upper,"relation":relation,
            "includes_start_ground":include_first,
            "path":[x["earth"] for x in visits],
            "visited_palaces":visits,
            "hits":hit_details,"depth":len(hit_details),
            "different_lodged_stems_count_separately":True}


def _rank_ties(candidates:list[dict],day:str)->dict:
    """Classical fallback is ground-position 孟→仲→季, then 日课/支课."""
    if not candidates:return {"status":"none","winner":None}
    min_rank=min(CLASS_PRIORITY[c["actual_ground_class"]] for c in candidates)
    group=[c for c in candidates if CLASS_PRIORITY[c["actual_ground_class"]]==min_rank]
    if len(group)==1:return {"status":"unique_class","winner":group[0]["upper"],
                              "class":group[0]["actual_ground_class"]}
    yang=STEMS.index(day[0])%2==0
    first_side=[c for c in group if any(
        x in (1,2) if yang else x in (3,4) for x in c["lesson_numbers"])]
    if len(first_side)==1:
        return {"status":"day_side_first","winner":first_side[0]["upper"],
                "class":first_side[0]["actual_ground_class"],
                "prefer":"干课" if yang else "支课"}
    return {"status":"unresolved_tie","winner":None,
            "class":group[0]["actual_ground_class"],
            "candidates":[c["upper"] for c in group]}


def _pick_depth(rows:list[dict],key:str,day:str)->dict:
    max_depth=max(x[key]["depth"] for x in rows)
    deepest=[x for x in rows if x[key]["depth"]==max_depth]
    if len(deepest)==1:
        return {"status":"unique_depth","winner":deepest[0]["upper"],
                "depth":max_depth,"tied_candidates":[deepest[0]["upper"]]}
    rank=_rank_ties(deepest,day)
    return {"status":rank["status"],"winner":rank["winner"],
            "depth":max_depth,"tied_candidates":[x["upper"] for x in deepest],
            "tie_break":rank}


def apply_shehai(chart:dict)->dict:
    if chart.get("version")!="V60" or not chart.get("has_real_plates_and_four_lessons"):
        raise ValueError("V61 必须在真实 V60 十二宫四课上计害")
    t=chart["three_transmissions"]
    if t["status"]!="pending" or not t.get("rule_audit",{}).get("candidate_details"):
        return {"applied":False,"reason":"非普通涉害未决课"}
    if chart["transmission_review"]["offset_palaces"] in (0,6):
        return {"applied":False,"reason":"伏吟反吟须先核对专法"}
    rows=t["rule_audit"]["candidate_details"]
    lessons=chart["four_lessons"]
    plate=chart["heaven_plate"]
    day=chart["day_ganzhi"]
    # Only the priority relationship determined in V58 is considered:
    # 下贼上 takes precedence over 上克下, even when both exist.
    preferred="下贼上" if any(p["relation"]=="下贼上" for p in lessons) else "上克下"
    eligible=[p["upper"] for p in lessons if p["relation"]==preferred]
    both_polarities=[x for x in rows if x["upper"] in eligible]
    comparable=[x for x in both_polarities if x["same_yin_yang_as_day"]]
    pool=comparable if len(comparable)>=2 else both_polarities
    if len(pool)<2:
        raise ValueError("V61 涉害候选数量与 V58 贼克比用审查不符")
    checked=[]
    for item in pool:
        upper=item["upper"]
        ground=item["actual_ground_palace"]
        if plate[ground]!=upper:
            raise ValueError("涉害候选上神与下临地盘不一致")
        main=crossing_trace(upper,ground,preferred,include_first=True)
        no_start=crossing_trace(upper,ground,preferred,include_first=False)
        item["shehai_trace"]=main
        item["shehai_excluding_start"]=no_start
        item["depth_verified"]=True
        item["shehai_depth_computed"]=True
        checked.append(item)
    main_pick=_pick_depth(checked,"shehai_trace",day)
    exclude_pick=_pick_depth(checked,"shehai_excluding_start",day)
    shortcut=_rank_ties(checked,day)
    winner=main_pick["winner"]
    variance={
        "classical_inclusive_ground":winner,
        "alternate_excludes_first_ground":exclude_pick["winner"],
        "simple_meng_zhong_ji_first":shortcut["winner"],
        "depth_vs_shortcut_disagree":(
            shortcut["winner"] is not None and shortcut["winner"]!=winner),
        "inclusive_vs_exclusive_disagree":(
            exclude_pick["winner"] is not None and exclude_pick["winner"]!=winner),
    }
    report={
        "version":"V61","status":"selected" if winner is not None else "pending",
        "source":SOURCE,
        "independent_examples":FULL_EXAMPLES,
        "tie_reference":TIE_RULES,
        "principal_rule":"沿地盘上神所临宫走到上神本家；每宫地支和寄干逐项查同向克害，首宫计入",
        "alternate_rule":"另一古籍记述首宫不计，另外比较孟仲季先取的简式",
        "relationship":preferred,
        "candidate_count":len(checked),
        "candidate_depths":[{"upper":x["upper"],"ground":x["actual_ground_palace"],
              "inclusive_depth":x["shehai_trace"]["depth"],
              "exclude_start_depth":x["shehai_excluding_start"]["depth"],
              "ground_class":x["actual_ground_class"]} for x in checked],
        "selected_by_inclusive":main_pick,
        "selected_by_exclusive":exclude_pick,
        "selected_by_direct_class":shortcut,
        "variance":variance,
        "full_path_witnesses":True,"fortune_verdict":None,
    }
    audit=t["rule_audit"]
    audit["depths_computed"]=True
    audit["automatically_selected"]=winner is not None
    audit["candidate_details"]=rows
    audit["shehai_comparison"]=report
    if winner is not None:
        plate=chart["heaven_plate"]
        chosen=_triple(winner,plate[winner],plate[plate[winner]],
            "涉害·逐宫归本家"+(
                "（同深择孟仲季）" if len(main_pick["tied_candidates"])>1
                else "（受克深者发用）"),
            [x["upper"] for x in checked],SOURCE,{
                **audit,"selected_ground":next(x["actual_ground_palace"]
                                          for x in checked if x["upper"]==winner),
                "chosen_by":"inclusive_depth_then_ground_class_and_day_side",
                "fortune_verdict":None,
            })
        chart["three_transmissions"]=chosen
    return report


def decorate_liuren_v61(chart:dict)->dict:
    report=apply_shehai(chart)
    review=chart["transmission_review"]
    t=chart["three_transmissions"]
    chart["version"]="V61"
    chart["has_three_transmissions"]=t["status"]=="computed"
    chart["has_full_nine_methods"]=False
    chart["shehai_v61"]=report
    chart["transmission_review"]={
      **review,"version":"V61","status":t["status"],
      "method_family":("涉害·循宫计害" if report.get("applied") is not False
                       else review["method_family"]),
      "shehai_depths_verified":report.get("full_path_witnesses",False),
      "shehai_historical_variants_compared":report.get("full_path_witnesses",False),
      "all_nine_methods_fully_verified":False,
      "pending_methods":["特殊伏吟反吟细则与通盘交叉验收"],
      "source_references":{**review["source_references"],
           "shehai_inclusive":SOURCE,
           "shehai_examples":FULL_EXAMPLES,
           "shehai_older_tie_rules":TIE_RULES},
    }
    chart["limits"]=[
      "V61 按逐宫地支与寄干计算涉害深浅；同深按实际落临地盘的孟仲季及日干阴阳所在课判断。",
      "《六壬大全》逐宫计害、首宫是否计入、孟仲季简式分开记录；有分歧会明确标注。",
      "涉害的常见古籍例课已核验，伏吟反吟流派细节及全部九宗门仍须独立整盘查错，不宣称完全完成。",
      "未完成十二天将、贵人起法、综合断课或现实命运预测。",
    ]
    if t["status"]=="pending" and t["transmissions"] is not None:
        raise ValueError("V61 未确认课式不能假造三传")
    return chart
