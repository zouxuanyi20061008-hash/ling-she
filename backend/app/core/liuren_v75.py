"""V75 反吟多克涉害：主法循宫深度可唯一裁决；同深留待选定原典口径。

反吟多贼克比用后仍有同阴阳候选，依《六壬指南》也按涉害。
复用 V61 已核实的穿行逐宫计害、包含/不包含首宫与孟仲季证据。
复等戊辰、戊戌须区分《大六壬探原》亥巳亥与《六壬存验》
戊辰实占巳亥巳，默认保留 pending，不伪装古籍一致。
"""
from __future__ import annotations

from .calendar import BRANCHES, STEMS
from .liuren import LODGES
from .liuren_v59 import _triple
from .liuren_v61 import crossing_trace, _pick_depth, _rank_ties, THREE_PART

SOURCE_RULE="https://libokang.com/classics/liuren/%E5%A4%A7%E5%85%AD%E5%A3%AC%E6%8C%87%E5%8D%97/"
SOURCE_DEPTH="https://www.shidianguji.com/zh-hans/%E5%85%AD%E5%A3%AC%E5%A4%A7%E5%85%A8/7"
SOURCE_Q1="https://www.shidianguji.com/zh/book/SDZJ0646/chapter/1kg32r7axpul7"
SOURCE_TANYUAN="https://dclef.com/xuanxuedocs/%E5%A4%A7%E5%85%AD%E5%A3%AC%E6%8E%A2%E5%8E%9F/001%E5%8D%B7%E4%B8%8A%20%E6%8E%A8%E6%BC%94%E7%AF%87.html"
SOURCE_CUNYAN="https://libokang.com/classics/liuren/%E5%85%AD%E5%A3%AC%E5%AD%98%E9%AA%8C/"
SCHOOLS=("pending","tanyuan","cunyan")

def _audited_candidates(chart:dict):
    t=chart["three_transmissions"]
    day=chart["day_ganzhi"]
    plate=chart["heaven_plate"]
    lessons=chart["four_lessons"]
    relation="下贼上" if any(l["relation"]=="下贼上" for l in lessons) else "上克下"
    eligible=list(dict.fromkeys(l["upper"] for l in lessons if l["relation"]==relation))
    if eligible!=t["initial_candidates"] or len(eligible)<2:
        raise ValueError("V75 反吟多克初传候选与原始四课不一致")
    parity=STEMS.index(day[0])%2
    comparable=[b for b in eligible if BRANCHES.index(b)%2==parity]
    pool=comparable if len(comparable)>=2 else eligible
    if len(pool)<2:
        raise ValueError("V75 比用后应已唯一，不能进入反吟涉害")
    rows=[]
    for upper in pool:
        ground=next((g for g in BRANCHES if plate[g]==upper),None)
        if ground is None:
            raise ValueError("V75 上神不能定位到唯一实际地盘")
        lessons_no=[p["number"] for p in lessons if p["upper"]==upper and p["relation"]==relation]
        if not lessons_no:
            raise ValueError("V75 涉害上神缺少原始候选课")
        full=crossing_trace(upper,ground,relation,include_first=True)
        without=crossing_trace(upper,ground,relation,include_first=False)
        rows.append({
            "upper":upper,"actual_ground_palace":ground,
            "actual_ground_class":THREE_PART[ground],
            "lesson_numbers":lessons_no,"shehai_trace":full,
            "shehai_excluding_start":without,
            "same_yin_yang_as_day":BRANCHES.index(upper)%2==parity,
        })
    return relation,eligible,comparable,rows

def decorate_liuren_v75(chart:dict, tie_school:str="pending")->dict:
    if chart.get("version")!="V61" or not chart.get("has_real_plates_and_four_lessons"):
        raise ValueError("V75 只能在已有V61真实天地盘、四课及涉害例课后运行")
    if tie_school not in SCHOOLS:
        raise ValueError("V75 反吟复等取法只允许 pending/tanyuan/cunyan")
    review=chart["transmission_review"]
    t=chart["three_transmissions"]
    if review["offset_palaces"]!=6 or t["status"]!="pending" or "反吟多贼克" not in t["method"]:
        chart["fanyin_shehai_v75"]={"version":"V75","applied":False,
            "reason":"非反吟多贼克待判课","selected_school":tie_school,
            "school_selection":tie_school}
        return chart
    relation,candidates,comparable,rows=_audited_candidates(chart)
    main=_pick_depth(rows,"shehai_trace",chart["day_ganzhi"])
    alt=_pick_depth(rows,"shehai_excluding_start",chart["day_ganzhi"])
    direct=_rank_ties(rows,chart["day_ganzhi"])
    winner=main["winner"]
    choice="unique_inclusive_depth" if winner else "unresolved_equal_depth"
    note=None
    ancient_alternatives={}
    day=chart["day_ganzhi"]
    # 《探原》明确戊辰、戊戌复等两课亥巳亥；
    # 《存验》另有戊辰独立实占取巳亥巳，不能套给戊戌。
    if day in ("戊辰","戊戌") and set(x["upper"] for x in rows)=={"亥","巳"}:
        ancient_alternatives["tanyuan"]={
            "first":"亥","transmissions":["亥","巳","亥"],"source":SOURCE_TANYUAN}
        # 《六壬存验》只给出一张具体戊辰日戌将辰时实占；
        # 同一反吟偏移的十二时刻可排同形盘，但没有古籍证据表示
        # 其特殊发用可以扩散到其余十一个时将组合。
        cunyan_witness=(
            day=="戊辰"
            and chart["month_general"]=="戌"
            and chart["hour_branch"]=="辰"
            and tuple((p["upper"],p["lower"]) for p in chart["four_lessons"])==(
                ("亥","戊"),("巳","亥"),("戌","辰"),("辰","戌"))
        )
        if cunyan_witness:
            ancient_alternatives["cunyan"]={
                "first":"巳","transmissions":["巳","亥","巳"],
                "source":SOURCE_CUNYAN,
                "evidence_scope":"single_exact_four_lessons_and_time",
                "witness":{"day":"戊辰","month_general":"戌","hour_branch":"辰",
                           "hour_ganzhi":"丙辰"}}
    if winner is None and ancient_alternatives:
        if tie_school in ancient_alternatives:
            winner=ancient_alternatives[tie_school]["first"]
            choice="explicit_classical_school"
        else:
            note=("同深复等存在独立古籍取法差异，默认维持待判。" if tie_school=="pending"
                  else ("《六壬存验》仅有戊辰日戌将辰时此一完整实占；本课时将不吻合，不能把同形盘推断为同一古籍结论。"
                        if day=="戊辰" else
                        "本日未核到所选《六壬存验》独立整盘，不推导另一日的同法。"))
    elif winner is None:
        note="涉害同深且孟仲季/干支先见仍无唯一解，保留待判"
    report={
      "version":"V75","applied":True,"status":"computed" if winner else "pending",
      "category":"fanyin_multi_conflict_shehai",
      "relation":relation,"original_candidates":candidates,
      "same_polarity_candidates":comparable,
      "selected_pool":[x["upper"] for x in rows],
      "candidate_details":rows,
      "selected_by_inclusive":main,
      "selected_by_exclusive":alt,
      "selected_by_simple_class":direct,
      "disagreement":{
          "inclusive_vs_exclusive":main["winner"]!=alt["winner"],
          "inclusive_vs_class":main["winner"]!=direct["winner"],
          "historical_example_variants_disagree":len(ancient_alternatives)>=2,
      },
      "school_selection":tie_school,
      "decision_rule":choice,"selected_initial":winner,
      "historical_alternatives":ancient_alternatives,
      "cannot_assume_unselected_variant":True,
      "reason_pending":note,
      "ground_is_actual_lower_palace":True,
      "includes_first_ground":True,
      "sources":{"anti_chant":SOURCE_RULE,"depth":SOURCE_DEPTH,
                 "q1_ancient_full_chart":SOURCE_Q1,
                 "tanyuan":SOURCE_TANYUAN,"cunyan":SOURCE_CUNYAN},
      "real_world_verdict":None,
    }
    chart["fanyin_shehai_v75"]=report
    if winner:
        branch2=chart["heaven_plate"][winner]
        branch3=chart["heaven_plate"][branch2]
        if branch3!=winner or branch2==winner:
            raise ValueError("V75 反吟初末不合六冲相承")
        method=("反吟·有克·涉害受克深者发用" if choice=="unique_inclusive_depth"
                else "反吟·有克·复等显式古籍取法（"+tie_school+"）")
        triple=_triple(winner,branch2,branch3,method,candidates,
                SOURCE_DEPTH if choice=="unique_inclusive_depth"
                else ancient_alternatives[tie_school]["source"],{
                  "V75_decision_rule":choice,
                  "inclusive_depths":{x["upper"]:x["shehai_trace"]["depth"] for x in rows},
                  "original_candidates":candidates,"chosen_school":tie_school,
                  "historical_alternatives":ancient_alternatives,
                  "fortune_verdict":None,
                })
        chart["three_transmissions"]=triple
        chart["has_three_transmissions"]=True
    elif t.get("transmissions") is not None:
        raise ValueError("V75 未能确定初传不允许返回三传")
    chart["transmission_review"]={
      **review,"status":chart["three_transmissions"]["status"],
      "method_family":"反吟·多克涉害"+("·复等显式取法" if choice=="explicit_classical_school" else ""),
      "V75_checked":True,"fanyin_shehai_depths_verified":True,
      "V75_default_ambiguous_school_pending":tie_school=="pending",
    }
    chart["has_full_nine_methods"]=False
    return chart
