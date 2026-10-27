"""V41: checkable gates for 三合 candidates, including 世、应, day/month and 空破.

Do not decide 合化, 合绊, 暗动, 旺衰 or 应期 from geometry alone.
Records role relationships independently of a user selecting 六亲.
"""
from __future__ import annotations

from .sanhe_focus_review import _relation
from .hexagrams import GENERATES, CONTROLS

SOURCE="https://zh.wikisource.org/zh-hans/增刪卜易"


def _status_for_source(row:dict)->dict:
    source=row["source_type"]
    if source=="original_triad_candidates":
        count=len(row["moving_positions"])
        state="three_branches_static" if count==0 else (
            "one_real_mover" if count==1 else "two_or_more_real_movers"
        )
        return {"structural_state":"three_original_branches",
                "movement_state":state,"moving_count":count,"transformed_branch_used":False}
    if source=="moving_transformed_candidates":
        return {"structural_state":"original_and_changed_branches",
                "movement_state":"two_original_movers_plus_local_change",
                "moving_count":len(row["moving_positions"]),
                "transformed_branch_used":True}
    return {"structural_state":"one_branch_missing",
            "movement_state":"two_original_movers_missing_one_branch",
            "moving_count":len(row["moving_positions"]),"transformed_branch_used":False}


def _role(chart,element,role,position,positions,transformed_position):
    original=chart["najia_lines"][position-1]
    return {
        "name":role,"position":position,
        "ganzhi":original["ganzhi"],
        "liuqin":original["liuqin"],
        "element":original["element"],
        "originally_in_positions":position in positions,
        "same_position_has_changed_branch":position==transformed_position,
        "relation_to_pattern":_relation(element,original["element"]),
        "fate_or_outcome":None,
        "note":"世应位置和局五行关系可计算；是否有效以及是否利于谁尚未判定。",
    }


def _candidate(chart:dict,pattern:dict)->dict:
    positions=pattern["positions"]
    source=pattern["source_type"]
    structural=_status_for_source(pattern)
    day=chart["calendar"]["day"]
    month=chart["calendar"]["month"]
    changed_pos=pattern["transformed_position"]
    originals=chart["najia_lines"]
    transformed=chart["bian_najia_lines"]

    role_positions={
        "世":chart["eight_palaces"]["ben"]["shi_position"],
        "应":chart["eight_palaces"]["ben"]["ying_position"],
    }
    roles={name:_role(chart,pattern["element"],name,pos,positions,changed_pos)
           for name,pos in role_positions.items()}

    affected_void=[pos for pos in positions if originals[pos-1]["is_xunkong"] is True] if day else None
    affected_month=[pos for pos in positions if originals[pos-1]["month_break_marker"] is True] if month else None
    affected_day=[pos for pos in positions if originals[pos-1]["day_clash"] is True] if day else None
    original_clash_branches=[
        originals[pos-1]["branch"] for pos in positions if originals[pos-1].get("month_break_marker") is True
    ] if month else None

    changed_context=None
    if changed_pos is not None:
        if changed_pos not in chart["dong_yao"]:
            raise ValueError("三合动变候选必须来自本卦真实明动爻")
        change=transformed[changed_pos-1]
        if pattern["transformed_branch"]!=change["branch"]:
            raise ValueError("三合动变候选必须是本位真实化支")
        changed_context={
            "position":changed_pos,"ganzhi":change["ganzhi"],
            "branch":change["branch"],
            "is_void":change["is_xunkong"] if day else None,
            "month_clash":change["month_break_marker"] if month else None,
            "day_clash":change["day_clash"] if day else None,
            "effective":None,
            "note":"本位变支空破只属动化条件，不可当作另一条本卦明动。",
        }

    lacking=pattern["missing_branch"]
    checks=[
        {"key":"structure","state":structural["structural_state"],
         "fact":"原卦三支俱见" if source=="original_triad_candidates" else
         "初三或四上双动与本位变支组成候选" if changed_pos else "两处原卦明动，缺少第三局支"},
        {"key":"movement","state":structural["movement_state"],
         "fact":"确认本卦明动"+str(structural["moving_count"])+"爻；静爻不会自动发动"},
        {"key":"calendar","state":"both_provided" if day and month else
         "day_only" if day else "month_only" if month else "not_provided",
         "fact":"日辰、节令月建均已有输入；若是手动输入仍需核对日期" if day and month else
         "日辰与节令月建未全部输入"},
        {"key":"void_break","state":"not_checkable" if not day or not month else
         "flags_present" if affected_void or affected_month or (changed_context and
             (changed_context["is_void"] or changed_context["month_clash"])) else "no_flags_found",
         "fact":"旬空/月冲标记需分别看原卦支与真实本位化支；是否可用不能由单项直接裁定"},
        {"key":"shi_ying","state":"positions_calculated",
         "fact":"世应原卦位置及局五行生克已经计算，但不自动定吉凶"},
        {"key":"formation","state":"requires_traditional_judgment",
         "fact":"三支存在、动静、日月与空破不构成自动成局结论"},
    ]
    pending=[]
    if structural["structural_state"]=="one_branch_missing":
        pending.append("三支尚缺："+str(lacking)+"；即便日辰或月建见此支，也不自动认定三合完成")
    if structural["movement_state"]=="three_branches_static":
        pending.append("原卦三支俱见却全静，不能把静爻凑局直接视为有效三合")
    if not day:pending.append("日辰未核：旬空、日冲及暗动候选不能完整检验")
    if not month:pending.append("月建未核：月破与季令尚不能完整检验")
    if affected_void:pending.append("原卦局内旬空："+ "、".join(str(p)+"爻" for p in affected_void))
    if affected_month:pending.append("原卦局内月冲："+ "、".join(str(p)+"爻" for p in affected_month))
    if changed_context and changed_context["is_void"]:
        pending.append("本位变支化空："+str(changed_pos)+"爻；需要核查真空假空条件")
    if changed_context and changed_context["month_clash"]:
        pending.append("本位变支月冲："+str(changed_pos)+"爻；需审查实际效力")

    return {
        "candidate_key":pattern["candidate_key"],
        **structural,
        "element":pattern["element"],
        "branches":pattern["branches"],
        "positions":list(positions),
        "roles":roles,
        "selected_focus_position":chart["focus_decision"].get("selected_position"),
        "selected_focus_position_in_pattern":pattern["selected_position_is_member"],
        "calendar":{
            "day_known":bool(day),"month_known":bool(month),
            "day_branch_matches_missing":day["day_branch"]==lacking if day and lacking else None,
            "month_branch_matches_missing":month["branch"]==lacking if month and lacking else None,
            "manual_not_independently_checked":chart.get("calendar_provenance",{}).get("source")!="server_recomputed_calendar",
        },
        "affected_original":{
            "void_positions":affected_void,
            "month_clash_positions":affected_month,
            "day_clash_positions":affected_day,
            "month_clash_branches":original_clash_branches,
        },
        "changed_position_check":changed_context,
        "gates":checks,
        "pending":pending,
        "formation_verdict":None,
        "strength_verdict":None,
        "favorable_to_shi":None,
        "favorable_to_ying":None,
        "timing_verdict":None,
    }


def decorate_sanhe_condition_audit(chart:dict)->dict:
    raw=chart["sanhe_focus_review"]
    rows=[_candidate(chart,pattern) for pattern in raw["rows"]]
    counts={
        "static_three_branches":sum(x["movement_state"]=="three_branches_static" for x in rows),
        "with_actual_movers":sum(x["movement_state"] in ("one_real_mover","two_or_more_real_movers","two_original_movers_plus_local_change") for x in rows),
        "missing_one_branch":sum(x["structural_state"]=="one_branch_missing" for x in rows),
        "requires_human_review":len(rows),
    }
    chart["sanhe_condition_audit"]={
        "version":"V41",
        "candidate_count":len(rows),"rows":rows,"counts":counts,
        "focus_category":raw["focus_category"],
        "selected_position":raw["selected_position"],
        "formation_verdict":None,"strength_verdict":None,
        "favorable_result":None,"prediction_or_timing":None,
        "reference":SOURCE,
        "notes":[
            "局五行与世、应、生克及在局位置逐项列明，即使尚未选择六亲也不缺失世应。",
            "两动尚缺一支时，日月见缺支只是可核对条件，并非凭空生成第三明动爻。",
            "只有真实本卦动爻才核查本位变支空破；其它变卦静态对照不可算合局。",
            "传统三合成立的流派条件、真假空与效力仍须人工审议，不从证据数量推出结论。",
        ],
    }
    return chart
