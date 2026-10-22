"""旬空、冲空、化空与空破同现的可追溯教学层。

六十甲子与本卦纳甲、六爻动变均来自已存在的确定性计算。
按《增删卜易》旬空章(26)及日辰章(17)，仅列可直接复算的条件；
不把“旺不为空、冲空即实”等古籍断法简化为单一确定的实际吉凶。
"""
from __future__ import annotations

from .dynamics import branch_relation
from .najia import BRANCH_ELEMENT

REFERENCES = {
    "xunkong":"https://zh.wikisource.org/zh-hans/增删卜易/26",
    "day":"https://zh.wikisource.org/zh-hans/增删卜易/17",
}

def _supporting_movers(chart:dict,position:int)->list[int]:
    return sorted({
        edge["source_position"]
        for edge in chart["moving_influences"]["edges"]
        if edge["target_position"]==position
        and edge["element_relation"] in ("动爻生本卦爻","动爻本卦爻同五行")
    })


def _main_void_condition(row:dict, changed:dict, chart:dict, empty:set[str]|None)->dict:
    day=row.get("day_action")
    month=row.get("month_action")
    if empty is None:
        return {
            "status":"day_unconfirmed","is_void":None,"conditions":[],
            "possible_chongkong":None,"moving_into_void":None,
            "needs_joint_review":False,
            "note":"未填写有效六十甲子日，不作旬空、冲空、化空推定。",
        }
    if row["branch"] not in empty:
        is_change_to_void=bool(row["moving"] and changed["branch"] in empty)
        return {
            "status":"not_void","is_void":False,"conditions":[],
            "possible_chongkong":False,"moving_into_void":is_change_to_void,
            "needs_joint_review":is_change_to_void,
            "note":"本位本卦爻不旬空。"+(
                "但动爻所变地支逢旬空，需另查化空；这不等于本卦爻本身旬空。"
                if is_change_to_void else ""),
        }

    conditions=["本卦爻支属于当日旬空"]
    clashes_day=bool(day and day["clash"])
    clashes_month=bool(month and month["clash"])
    month_same=bool(month and month["same_branch"])
    if row["moving"]:conditions.append("此爻明动而逢旬空")
    else:conditions.append("此爻静爻而逢旬空")
    if clashes_day:conditions.append("日辰冲空爻：冲空条件")
    if clashes_month:conditions.append("月建冲空爻：旬空与月破条件并见")
    if month_same:conditions.append("空支临月建")
    if day and day["element_relation"] in ("日辰生爻","日辰爻同五行"):
        conditions.append("日辰与空爻同类或生扶的五行关系")
    if month and month["element_relation"] in ("月建生爻","月建爻同五行"):
        conditions.append("月建与空爻同类或生扶的五行关系")
    movers=_supporting_movers(chart,row["position"])
    if movers:
        conditions.append("其他本卦动爻生扶或同类："+ "、".join(str(x) for x in movers)+"爻")
    season=row.get("seasonal_status")
    if season:conditions.append("月令概要："+season["grade"])
    if changed["branch"] in empty and row["moving"]:
        conditions.append("此动爻变出的地支亦逢旬空")
    if row.get("turnback"):
        conditions.append("本位动变："+row["turnback"]["term"]+"（作用强弱另辨）")
    return {
        "status":"void_needs_review",
        "is_void":True,
        "conditions":conditions,
        "possible_chongkong":clashes_day,
        "day_clash":clashes_day,
        "month_break_condition":clashes_month,
        "monthly_same_branch":month_same,
        "moving_into_void":bool(row["moving"] and changed["branch"] in empty),
        "supporting_movers":movers,
        "needs_joint_review":True,
        "note":"仅确定旬空、冲空、动空、月破、生扶等条件；古籍明确还有真假空、填实等辨法。不能直接判实际为空/不空、凶吉或应期。",
    }


def _changed_void_condition(row:dict, original:dict,empty:set[str]|None)->dict:
    if empty is None:
        return {"status":"day_unconfirmed","is_void":None,"is_huakong":None,
                "note":"未确认日辰，不计算变爻旬空。"}
    void=row["branch"] in empty
    is_huakong=bool(original["moving"] and void)
    return {
        "status":"moving_transformed_void" if is_huakong else
                 "reference_void_only" if void else "not_void",
        "is_void":void,
        "is_huakong":is_huakong,
        "note":(
            "本位动爻变出的支逢旬空，可记化空条件；按《增删卜易》仍须合参动静、生克、旺衰，不可一见化空就断无用。"
            if is_huakong else
            "之卦同位支旬空，但本卦该爻未动，不能误称动而化空。"
            if void else "变卦同位支不逢旬空。"),
    }


def _hidden_void(chart:dict,empty:set[str]|None,day_branch:str|None,month_branch:str|None)->None:
    for relative,candidates in chart["fushen"]["by_relative"].items():
        for c in candidates:
            branch=c["hidden"]["branch"]
            fly=c["flying"]["branch"]
            if empty is None:
                c["void_review"]={
                    "is_void":None,"flying_is_void":None,"status":"day_unconfirmed",
                    "day_clashes_hidden":None,"month_clashes_hidden":None,
                    "note":"伏神尚无已确认日辰，暂不判断旬空。"}
            else:
                is_void=branch in empty
                is_flying_void=fly in empty
                c["void_review"]={
                    "is_void":is_void,"flying_is_void":is_flying_void,
                    "status":"hidden_void" if is_void else "hidden_not_void",
                    "day_clashes_hidden":(
                        branch_relation(day_branch,branch,"日辰","伏神")["clash"] if day_branch else None),
                    "month_clashes_hidden":(
                        branch_relation(month_branch,branch,"月建","伏神")["clash"] if month_branch else None),
                    "note":"伏神与飞神各依自己的地支查旬空；不能把飞神的旬空当伏神旬空，伏神可用与否仍须另查。",
                }


def decorate_void_interactions(chart:dict)->dict:
    calendar=chart["calendar"]
    day=calendar["day"]
    month=calendar["month"]
    empty=set(day["xunkong"]) if day else None
    day_branch=day["day_branch"] if day else None
    month_branch=month["branch"] if month else None
    ben=chart["najia_lines"]
    bian=chart["bian_najia_lines"]

    for line,changed in zip(ben,bian):
        line["void_review"]=_main_void_condition(line,changed,chart,empty)
        changed["void_review"]=_changed_void_condition(changed,line,empty)

    _hidden_void(chart,empty,day_branch,month_branch)
    # The selected hidden-spirit entries intentionally share references with by_relative.
    focus=chart.get("focus")
    stage="focus_not_selected" if not focus else (
        "focus_not_visible" if not focus["primary_positions"] else "visible_candidates")
    candidates=[]
    if focus and focus["primary_positions"]:
        for pos in focus["primary_positions"]:
            current=ben[pos-1]
            review=current["void_review"]
            candidates.append({"position":pos,"ganzhi":current["ganzhi"],
                "is_void":review["is_void"],"void_status":review["status"],
                "conditions":review["conditions"],
                "moving_into_void":review["moving_into_void"]})
            # Preserve the original summary; add separate cautions instead of silently overriding it.
            item=next((row for row in chart["day_month_review"]["candidates"]
                        if row["position"]==pos),None)
            if item is not None and review["is_void"]:
                if review["possible_chongkong"]:
                    item["cautionary_observations"].append("旬空兼日冲：冲空条件需单独核对，勿混同普通日破")
                if review["month_break_condition"]:
                    item["cautionary_observations"].append("旬空兼月破条件：不得断永远无用")
                if current["moving"]:
                    item["cautionary_observations"].append("旬空兼明动：动空需合参")
                if review["moving_into_void"]:
                    item["cautionary_observations"].append("本位动爻同时化空：两项条件并见")
            elif item is not None and review["moving_into_void"]:
                item["cautionary_observations"].append("本位动爻变支逢旬空：化空条件，非原爻旬空")

    chart["void_interactions"]={
        "day_ganzhi":day["ganzhi"] if day else None,
        "empty_branches":day["xunkong"] if day else None,
        "status":"review_ready" if day else "day_unconfirmed",
        "focus_status":stage,
        "focus_candidates":candidates,
        "original_void_positions":[row["position"] for row in ben if row["void_review"]["is_void"]],
        "moving_into_void_positions":[row["position"] for row in ben
                                       if row["void_review"]["moving_into_void"]],
        "hidden_candidates_reviewed":sum(len(entries) for entries in chart["fushen"]["by_relative"].values()),
        "principle":"旬空依六十甲子日旬定二空支；本卦爻支、明动所变支与本宫伏神分别核对，日冲空支记冲空条件。",
        "boundary":(
            "日辰已由服务端按北京时间复算，但交节与换日临界仍需人工核对。"
            if chart.get("calendar_provenance") else
            "日辰来自手动输入，未经实际日期复核。"
        )+"冲空、动空、化空、月破、旺相均是待合参条件；不自动判出空、填实、真假空、用神强弱、实际吉凶或应期。",
        "sources":REFERENCES,
    }
    return chart
