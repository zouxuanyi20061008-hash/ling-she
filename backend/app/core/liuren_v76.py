"""V76 大六壬复等证据范围核验。

《大六壬探原》在规则段明述戊辰、戊戌反吟复等皆取亥巳亥；
《六壬存验》仅记戊辰日、戌将、丙辰时(辰支)的一例取巳亥巳。
两种属于“普遍规则文本”与“单张实占记录”，不可自动拓展后一例
到同偏移的其他时将组合，或将两种初传默认为一致。
"""
from __future__ import annotations

TANYUAN="https://shuyuan.zhiming.life/read/%E5%A4%A7%E5%85%AD%E5%A3%AC%E6%8E%A2%E5%8E%9F(%E6%8E%A8%E6%BC%94%E7%AF%87)-%E4%B8%8A/1"
CUNYAN="https://libokang.com/classics/liuren/%E5%85%AD%E5%A3%AC%E5%AD%98%E9%AA%8C/"
EXACT_WITNESS=(("亥","戊"),("巳","亥"),("戌","辰"),("辰","戌"))

def matches_cunyan_witness(chart:dict)->bool:
    return (chart.get("day_ganzhi")=="戊辰"
            and chart.get("month_general")=="戌"
            and chart.get("hour_branch")=="辰"
            and tuple((p["upper"],p["lower"]) for p in chart.get("four_lessons",[]))
                 == EXACT_WITNESS)

def decorate_liuren_v76(chart:dict)->dict:
    if chart.get("version")!="V63" or chart.get("audit_version")!="V74":
        raise ValueError("V76 必须在V74真实完整六壬课与三传审查之后执行")
    audit=chart.get("fanyin_shehai_v75")
    if not isinstance(audit,dict) or audit.get("version")!="V75":
        raise ValueError("V76 缺少V75真实反吟逐宫涉害依据")
    source_choice=audit.get("school_selection")
    if source_choice not in ("pending","tanyuan","cunyan"):
        raise ValueError("V76 古籍取法代码无法核验")
    witness=matches_cunyan_witness(chart)
    if not audit.get("applied"):
        chart["historical_witness_v76"]={
            "version":"V76","applied":False,"status":"not_a_tied_reversed_chant",
            "requested_school":source_choice,"real_world_verdict":None,
        }
        return chart
    if chart["transmission_review"]["offset_palaces"]!=6:
        raise ValueError("V76 反吟不应脱离六冲实际偏移")
    day=chart["day_ganzhi"]
    tie=day in ("戊辰","戊戌") and audit.get("decision_rule") in (
        "unresolved_equal_depth","explicit_classical_school")
    alternatives=audit["historical_alternatives"]
    triple=chart["three_transmissions"]
    first=audit["selected_initial"]
    if first is None:
        if triple["status"]!="pending" or triple["transmissions"] is not None:
            raise ValueError("V76 无古籍依据的反吟初传必须保留待判")
    else:
        if triple["status"]!="computed" or not chart["has_three_transmissions"]:
            raise ValueError("V76 反吟已选初传必须有完整三传")
        if triple["selected_initial"]!=first:
            raise ValueError("V76 取用和三传初传不一致")
    if "cunyan" in alternatives and not witness:
        raise ValueError("V76 《六壬存验》不能用于非戊辰戌将辰时的盘")
    if witness:
        if [(p["upper"],p["lower"]) for p in chart["four_lessons"]]!=list(EXACT_WITNESS):
            raise ValueError("V76 古籍四课真值不匹配")
        if "cunyan" not in alternatives:
            raise ValueError("V76 匹配原典的戊辰戌将辰时缺失《存验》来源")
    if source_choice=="cunyan" and audit["decision_rule"]=="explicit_classical_school":
        if not witness or first!="巳" or [p["branch"] for p in triple["transmissions"]]!=[
            "巳","亥","巳"]:
            raise ValueError("V76 《六壬存验》实占取用条件或三传错位")
    if source_choice=="cunyan" and tie and not witness:
        if triple["status"]!="pending" or first is not None:
            raise ValueError("V76 非原例同形盘不能自动采用《六壬存验》初传")
    if source_choice=="tanyuan" and tie:
        if first!="亥" or [p["branch"] for p in triple["transmissions"]]!=[
            "亥","巳","亥"]:
            raise ValueError("V76 《大六壬探原》明载的两日复等三传不一致")
    if tie:
        if not set(alternatives).issubset({"tanyuan","cunyan"}):
            raise ValueError("V76 不能编造第三种古籍复等取法")
        if "tanyuan" not in alternatives:
            raise ValueError("V76 戊辰戊戌复等不可缺失《探原》原文")
    selected_source=(
        "single_documented_observation" if
            source_choice=="cunyan" and audit["decision_rule"]=="explicit_classical_school"
        else "explicit_general_rule_for_two_days" if
            source_choice=="tanyuan" and audit["decision_rule"]=="explicit_classical_school"
        else "algorithmically_unique_shehai_depth" if
            audit["decision_rule"]=="unique_inclusive_depth"
        else "not_selected_or_outside_source_scope")
    evidence={
       "version":"V76","applied":True,"category":"fanyin_tied_classical_witness"
          if tie else "fanyin_unique_inclusive_depth",
       "status":triple["status"],"requested_school":source_choice,
       "selected_initial":first,"source_evidence_level":selected_source,
       "witness_matches_this_exact_plate":witness,
       "cunyan_witness":{"day_ganzhi":"戊辰","month_general":"戌",
           "hour_ganzhi":"丙辰","hour_branch":"辰",
           "four_lessons":[{"upper":u,"lower":l} for u,l in EXACT_WITNESS],
           "three_transmissions":["巳","亥","巳"],"source":CUNYAN,
           "evidence_scope":"one_documented_time_and_four_lessons"},
       "tanyuan_general_rule":{"days":["戊辰","戊戌"],
           "three_transmissions":["亥","巳","亥"],"source":TANYUAN,
           "evidence_scope":"explicit_general_reverse_chant_equal-depth_rule"},
       "only_two_day_patterns_in_remaining_24":True if tie else False,
       "unchosen_variants_never_auto_applied":True,
       "limits":[
           "《大六壬探原》是戊辰、戊戌反吟复等的明载通则；选定才使用。",
           "《六壬存验》所引巳亥巳是戊辰日戌将丙辰时单张实占，不能凭相同天地盘扩大适用范围。",
           "未经选定的复等仍保留待判，不推算实际断课吉凶与应期。",
       ],
       "real_world_verdict":None,
    }
    chart["historical_witness_v76"]=evidence
    chart["witness_version"]="V76"
    return chart
