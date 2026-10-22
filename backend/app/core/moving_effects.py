"""六爻 V16：动爻与本位变爻的日月条件、空破和回头关系审议。

按《增删卜易》动变生克冲合章：
- 变爻可回头作用本位动爻；不能跨位作用其他本卦爻。
- 只有日辰和月建可以生克冲合变爻；本卦其他动爻不能跨位作用变爻。
- 只列已计算的有条件事实，不裁定回头生克实际力量、吉凶或应期。
"""
from __future__ import annotations

SOURCE="https://www.shidianguji.com/book/XYXZSBY/chapter/1lzxsn553lk4y"


def _source_condition(row:dict,day_or_month:str,display:str)->dict:
    action=row.get(day_or_month+"_action")
    if action is None:
        return {"source":display,"status":"missing","relation":None,
                "support":None,"restrain":None,"clash":None,"combine":None,
                "same_branch":None,
                "note":"尚未确认相应日辰或节令月建；不能臆断作用。"}
    el=action["element_relation"]
    support=el in (display+"生爻",display+"爻同五行")
    restrain=el==display+"克爻"
    return {"source":display,"status":"computed",
            "relation":el,"support":support,"restrain":restrain,
            "clash":action["clash"],"combine":action["combine"],
            "same_branch":action["same_branch"],
            "note":"仅列相对五行与地支事实，生扶/受克/冲/合的实际效力还需合参。"}


def _side(row:dict,role:str)->dict:
    return {
        "role":role,
        "position":row["position"],"ganzhi":row["ganzhi"],
        "branch":row["branch"],"element":row["element"],
        "day":_source_condition(row,"day","日辰"),
        "month":_source_condition(row,"month","月建"),
        "season":row["seasonal_status"]["grade"] if row["seasonal_status"] else None,
        "void":row["void_review"]["is_void"],
        "month_clash":row["month_break_marker"],
        "day_clash":row["day_clash"],
        "scope":("本卦明动爻，可与本卦其他爻比较生克冲合。"
                 if role=="moving" else
                 "只作为本位动爻的变爻比较；不跨位作用其他本卦爻。"),
    }


def _disputed_signals(side:dict)->list[str]:
    checks=[]
    day=side["day"]
    month=side["month"]
    if (day["status"]=="computed" and month["status"]=="computed"
            and ((day["support"] and (month["restrain"] or month["clash"]))
                 or (month["support"] and (day["restrain"] or day["clash"])))):
        checks.append("日月出现支持与克冲并见，不能按条目多少评定力量。")
    if side["void"] is True:
        checks.append("此支逢日旬空，真假空、冲空与能否发挥作用尚待核对。")
    if side["month_clash"] is True:
        checks.append("此支遭月建冲，月破条件成立，实际效力未决。")
    if side["day_clash"] is True:
        checks.append("此支逢日辰冲，需与月令、空亡、动静合参。")
    if side["season"]=="余气":
        checks.append("月令只见余气，不能直接归为旺或休囚。")
    if day["status"]=="missing":
        checks.append("日辰未确认，日冲与旬空条件未完整。")
    if month["status"]=="missing":
        checks.append("节令月建未确认，月令与月破条件未完整。")
    return checks


def decorate_moving_effects(chart:dict)->dict:
    findings=[]
    for original,transformed in zip(chart["najia_lines"],chart["bian_najia_lines"]):
        if not original["moving"]:
            continue
        if not original["turnback"]:
            raise ValueError("真实动爻缺少本位动变资料，不应继续审议。")
        moving=_side(original,"moving")
        changed=_side(transformed,"transformed")
        motion=original["turnback"]
        conditions=_disputed_signals(moving)+[
            "本位变爻："+x for x in _disputed_signals(changed)
        ]
        if motion["returning_clash"] or motion["returning_combine"]:
            conditions.append("回头冲或回头合可与五行生克同时存在，不可简单二选一。")
        if changed["void"] is True:
            conditions.append("变爻逢旬空，形成化空条件；不得仅凭此判回头作用无效。")
        if (motion["term"] in ("回头生","回头克")
                and (changed["day"]["restrain"] or changed["month"]["restrain"]
                     or changed["day"]["clash"] or changed["month"]["clash"])):
            conditions.append("本位回头关系已形成，但变爻同时受到日月克冲；实际生克能否成立仍需人工分析。")
        findings.append({
            "position":original["position"],
            "moving":moving,
            "transformed":changed,
            "returning_term":motion["term"],
            "returning_tags":motion["tags"],
            "returning_element_relation":motion["five_element_relation"],
            "returning_clash":motion["returning_clash"],
            "returning_combine":motion["returning_combine"],
            "conditions_to_review":list(dict.fromkeys(conditions)),
            "relationship_confirmed":True,
            "effective_returning_action":None,
            "final_strength":None,
            "status":"requires_joint_review",
            "conclusion":"仅确定动爻与本位变爻的静态回头关系；效力尚未判定。",
        })
    focus=chart["focus_decision"]
    selected=focus.get("selected_position")
    chart["moving_effect_review"]={
        "version":"V16",
        "movements":findings,
        "moving_positions":[x["position"] for x in findings],
        "selected_focus_position":selected,
        "selected_focus_movement":next((x for x in findings if x["position"]==selected),None),
        "requires_human_review":True,
        "effective_strength_computed":False,
        "fortune_conclusion":None,
        "sources":{"moving":SOURCE},
        "rules":[
            "日辰与月建可直接生克冲合本卦动爻、静爻及本位变爻。",
            "本卦明动爻可作用其他本卦爻；变爻只回头作用本位动爻。",
            "本卦其他爻不可跨位生克变爻，之卦静态同位支不等于真实动变。",
        ],
        "boundary":(
            "所有支持/克冲、月令、旬空、月破及回头关系均是规则条件，不能相加打分，也不自动断作用成败、吉凶与应期。"+
            ("日月已由服务器历法库复算，边界时刻仍须核对。" if chart.get("calendar_provenance")
             else "日月如有填写，仍是用户手动参数。")
        ),
    }
    return chart
