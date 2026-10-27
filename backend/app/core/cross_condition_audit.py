"""V44 · 六爻逐爻旺衰/旬空/动变来源交叉核验（不作效力裁断）。

只读取 V15/V16/V23、现有日月动变和用神位置，不重复排盘。
每个命中的项目仅是两个或多个已算术数条件同时出现；
「来源受限」只表示来源爻存在空、月冲或化空标记，绝不证明作用失效。
"""
from __future__ import annotations


def _calendar_fact(line:dict, key:str)->dict:
    action=line[key+"_action"]
    if action is None:
        return {"status":"missing","relation":None,"clash":None,
                "same_branch":None,"combine":None}
    return {"status":"computed","relation":action["element_relation"],
            "clash":action["clash"],"same_branch":action["same_branch"],
            "combine":action["combine"]}


def _restriction_flags(original:dict, changed:dict|None)->list[str]:
    flags=[]
    if original["is_xunkong"] is True:flags.append("original_void")
    if original["month_break_marker"] is True:flags.append("original_month_clash")
    if changed is not None and changed["is_xunkong"] is True:
        flags.append("actual_transformed_void")
    if changed is not None and changed["month_break_marker"] is True:
        flags.append("actual_transformed_month_clash")
    return flags


def _check(code:str, label:str, details:list[str])->dict:
    return {"id":code,"title":label,"facts":details,
            "status":"computed_cooccurrence","actual_effectiveness":None,
            "requires_human_review":True}


def _incoming(chart:dict,position:int)->list[dict]:
    incoming=[]
    originals=chart["najia_lines"]
    changed=chart["bian_najia_lines"]
    for edge in chart["moving_influences"]["edges"]:
        if edge["target_position"]!=position:
            continue
        source_position=edge["source_position"]
        source=originals[source_position-1]
        if source_position==position or not source["moving"]:
            raise ValueError("V44 不允许静爻或自身产生跨爻明动作用边")
        transformed=changed[source_position-1]
        flags=_restriction_flags(source,transformed)
        incoming.append({
            "source_position":source_position,
            "source_ganzhi":source["ganzhi"],
            "target_position":position,
            "relation":edge["element_relation"],
            "clash":edge["clash"],"combine":edge["combine"],
            "source_original_void":source["is_xunkong"],
            "source_month_clash":source["month_break_marker"],
            "source_changed_void":transformed["is_xunkong"],
            "source_changed_month_clash":transformed["month_break_marker"],
            "source_return_term":source["turnback"]["term"],
            "restriction_flags":flags,
            "effectiveness":None,
        })
    return sorted(incoming,key=lambda x:x["source_position"])


def _row(chart:dict,position:int,focus_positions:set[int])->dict:
    original=chart["najia_lines"][position-1]
    counterpart=chart["bian_najia_lines"][position-1]
    day_known=chart["calendar"]["day"] is not None
    month_known=chart["calendar"]["month"] is not None
    moving=bool(original["moving"])
    change=counterpart if moving else None
    strength=chart["strength_evidence"]["rows"][position-1]
    void=chart["void_context_review"]["rows"][position-1]
    if strength["position"]!=position or void["position"]!=position:
        raise ValueError("V44 已有旺衰/旬空资料与本卦爻位错位")
    review=next((item for item in chart["moving_effect_review"]["movements"]
                 if item["position"]==position),None)
    if moving!=(review is not None):
        raise ValueError("V44 本卦明动与本位动变审议不一致")
    if moving and original["turnback"] is None:
        raise ValueError("V44 明动必须有真实本位回头关系")
    if day_known and void["original_void"]!=original["is_xunkong"]:
        raise ValueError("V44 旬空字段与既有核查结果不一致")
    if moving and day_known and void["transformed_void"]!=change["is_xunkong"]:
        raise ValueError("V44 本位化空与既有核查结果不一致")
    incoming=_incoming(chart,position)
    source_limited=[e["source_position"] for e in incoming if e["restriction_flags"]]
    changed_flags=_restriction_flags(change,None) if change else []
    checks=[]
    def add(when,code,title,*details):
        if when:checks.append(_check(code,title,list(details)))

    is_void=original["is_xunkong"]
    month_break=original["month_break_marker"]
    day_clash=original["day_clash"]
    changed_void=change["is_xunkong"] if change else None
    changed_month_break=change["month_break_marker"] if change else None
    add(is_void is True and month_break is True,"void_and_month_break",
        "本爻旬空与月冲并见","两项标记均已算出，不能相互抵消或断永远无用")
    add(is_void is True and day_clash is True,"void_and_day_clash",
        "本爻旬空与日冲并见","仅为冲空候选，不等于已冲实")
    add(is_void is True and moving,"moving_original_void",
        "本爻明动而旬空","是否可发挥作用待合参")
    add(moving and changed_void is True,"moving_to_void",
        "真实动爻化空","化空是本位变支条件，并不说明本爻也是空")
    add(moving and is_void is True and changed_void is True,"both_original_and_changed_void",
        "本爻与真实化爻均逢旬空","分别记录两支，真假空与实际效力未断")
    add(moving and changed_month_break is True,"changed_month_break",
        "本位化爻与月建相冲","不等于回头生克必然失效")
    add(moving and bool(changed_flags),"changed_source_restrictions",
        "回头关系来源爻有制约标记","来源变爻存在："+ "、".join(changed_flags))
    add(bool(source_limited),"incoming_mover_restrictions",
        "来作用的明动来源也存在制约标记",
        "原卦明动来源爻位："+ "、".join(str(p) for p in source_limited))
    add(strength["has_opposing_indicators"],"opposing_strength_evidence",
        "生扶与制约证据同时存在","不允许按条数净额计算旺衰")
    original_day=_calendar_fact(original,"day")
    original_month=_calendar_fact(original,"month")
    day_action=original_day["relation"]
    month_action=original_month["relation"]
    day_support=day_action in ("日辰生爻","日辰爻同五行")
    month_support=month_action in ("月建生爻","月建爻同五行")
    add((day_support and (month_action=="月建克爻" or month_break is True))
        or (month_support and (day_action=="日辰克爻" or day_clash is True)),
        "day_month_opposition","日月生扶与克冲条件并见","已有干支关系不能化成一个旺衰分数")

    missing=[]
    if not day_known:missing.append("日辰未提供：旬空、日冲及日生克未知")
    if not month_known:missing.append("节令月建未提供：月令等级、月冲及月生克未知")
    if not chart.get("calendar_provenance") and (day_known or month_known):
        missing.append("日月为手动参数，真实日期与交节换日尚待确认")
    return {
        "position":position,"ganzhi":original["ganzhi"],
        "liuqin":original["liuqin"],"moving":moving,
        "focus_candidate":position in focus_positions,
        "selected_by_user":chart["focus_decision"]["selected_position"]==position,
        "computed":{
            "day":original_day,"month":original_month,
            "season":original["seasonal_status"]["grade"] if month_known else None,
            "original_void":is_void if day_known else None,
            "original_month_clash":month_break if month_known else None,
            "original_day_clash":day_clash if day_known else None,
            "has_opposing_indicators":strength["has_opposing_indicators"],
        },
        "actual_change":({
            "position":position,"ganzhi":change["ganzhi"],
            "returning_term":review["returning_term"],
            "original_void":change["is_xunkong"] if day_known else None,
            "month_clash":change["month_break_marker"] if month_known else None,
            "day":_calendar_fact(change,"day"),
            "month":_calendar_fact(change,"month"),
            "restriction_flags":changed_flags,
            "effective_returning_action":None,
        } if change is not None else None),
        "incoming_movers":incoming,
        "checks":checks,
        "missing_inputs":missing,
        "needs_joint_review":True,
        "strength_verdict":None,"true_void":None,"false_void":None,
        "returning_effectiveness":None,"timing_verdict":None,
    }


def decorate_cross_condition_audit(chart:dict)->dict:
    focus=chart["focus_decision"]
    positions={item["position"] for item in focus["candidates"]}
    rows=[_row(chart,p,positions) for p in range(1,7)]
    if not chart.get("focus"):status="focus_not_selected"
    elif focus["status"]=="not_visible":status="focus_not_visible"
    elif not chart["calendar"]["day"] or not chart["calendar"]["month"]:
        status="calendar_incomplete"
    elif len(positions)>1 and focus["selected_position"] is None:
        status="multiple_candidates_pending"
    else:status="condition_review_ready"
    chart["cross_condition_audit"]={
        "version":"V44","status":status,
        "rows":rows,"focus_candidate_positions":sorted(positions),
        "focus_candidates":[r for r in rows if r["focus_candidate"]],
        "selected_position":focus["selected_position"],
        "attention_positions":[r["position"] for r in rows if r["checks"]],
        "calendar_origin":("server_recomputed_calendar"
                           if chart.get("calendar_provenance",{}).get("source")=="server_recomputed_calendar"
                           else "manual_or_missing"),
        "rules":[
            "本卦六爻、真实明动及本位化爻各依自身干支对照日月、旬空、月冲。",
            "来自其他爻的作用仅认可本卦真实明动的来源；其自身空破和化空只作为作用待审限制。",
            "同一爻生扶与制约并见不按数量、旺相标签或动静自动判强弱。",
        ],
        "unimplemented":[
            "最终用神旺衰及实际取用取舍",
            "真空、假空、冲实、填实等实际效力",
            "动变回头及原忌神来作用的真实成败",
            "应期与现实事件结论",
        ],
        "has_final_strength":False,"has_final_void_decision":False,
        "effective_movement_computed":False,"has_timing_prediction":False,
        "fortune_conclusion":None,"timing_conclusion":None,
        "boundary":"V44 仅将已有规则事实与同时出现的制约条件建立可追溯关联；这不是量化强弱、自动选用神、真假空定论或现实预测。",
    }
    return chart
