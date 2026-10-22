"""六爻 V15：月令、日辰、动变、空破对照的非评分综合证据表。

重用既有纳甲/日月/动变/空破装卦字段，不重复实现计算。
《增删卜易》月将章、日辰章提醒月日具有不同作用，可并存；
本模块只梳理已知条件，不对作用效力、旺衰、吉凶或应期做最终裁断。
"""
from __future__ import annotations

SOURCES={
    "month":"https://zh.wikisource.org/zh-hans/增删卜易/16",
    "day":"https://zh.wikisource.org/zh-hans/增删卜易/17",
    "season":"https://www.shidianguji.com/book/XYXZSBY/chapter/1lzxsn553lws2",
    "void":"https://zh.wikisource.org/zh-hans/增删卜易/26",
}


def _evidence(title:str,detail:str,origin:str)->dict:
    return {"title":title,"detail":detail,"origin":origin}


def _review_row(row:dict,chart:dict)->dict:
    supports=[]
    restraints=[]
    context=[]
    pending=[]
    day=row["day_action"]
    month=row["month_action"]
    season=row["seasonal_status"]
    void=row["void_review"]
    clashes=row["conflict_review"]
    position=row["position"]

    if month is None:
        pending.append("尚未提供节令月建，月令等级、月冲合与五行关系暂缺")
    else:
        grade=season["grade"] if season else "未能确认"
        context.append(_evidence("月令五行概要",grade+" · 不是整卦旺衰定论","四时旺相"))
        action=month["element_relation"]
        if action in ("月建生爻","月建爻同五行"):
            supports.append(_evidence("月建生扶/同类",action,"月将章"))
        elif action=="月建克爻":
            restraints.append(_evidence("月建克爻",action,"月将章"))
        else:
            context.append(_evidence("月建五行相对关系",action,"月将章"))
        if month["same_branch"]:
            supports.append(_evidence("爻临月建","该爻支与月建同支","月将章"))
        if month["combine"]:
            context.append(_evidence("月建合爻","地支六合已成立；合的真实效力另辨","月将章"))
        if clashes["month_break"]["clashed"]:
            restraints.append(_evidence("月破条件","月建冲本卦爻；是否有用须合参日辰、动静、出月等","月将章"))

    if day is None:
        pending.append("尚未提供六十甲子日，日辰生克冲合与旬空暂缺")
    else:
        action=day["element_relation"]
        if action in ("日辰生爻","日辰爻同五行"):
            supports.append(_evidence("日辰生扶/同类",action,"日辰章"))
        elif action=="日辰克爻":
            restraints.append(_evidence("日辰克爻",action,"日辰章"))
        else:
            context.append(_evidence("日辰五行相对关系",action,"日辰章"))
        if day["same_branch"]:
            supports.append(_evidence("爻临日辰","该爻支与日辰同支","日辰章"))
        if day["combine"]:
            context.append(_evidence("日辰合爻","地支六合成立；合住、冲开是否作用另辨","日辰章"))
        dayclash=clashes["day_clash"]
        if dayclash["clashed"]:
            context.append(_evidence("日辰冲爻",dayclash["label"],"日辰章"))
        if void["is_void"]:
            restraints.append(_evidence("本卦旬空","该爻支属于已确认日旬的空支，真假空与冲空须复核","旬空章"))
        if void["possible_chongkong"]:
            context.append(_evidence("日冲空支","已有冲空条件，不自动判断冲空即实","旬空章"))

    if row["moving"]:
        context.append(_evidence("本爻明动","动静已确认，但发动本身不等于旺","动变生克"))
    else:
        context.append(_evidence("本爻安静","未因摇卦而发动，暗动须另核日辰","动静"))

    for edge in chart["moving_influences"]["edges"]:
        if edge["target_position"]!=position:
            continue
        sender=edge["source_position"]
        action=edge["element_relation"]
        if action in ("动爻生本卦爻","动爻本卦爻同五行"):
            supports.append(_evidence("他爻动而生扶",str(sender)+"爻："+action,"动爻关系"))
        elif action=="动爻克本卦爻":
            restraints.append(_evidence("他爻动而克制",str(sender)+"爻："+action,"动爻关系"))
        else:
            context.append(_evidence("他爻动而相关",str(sender)+"爻："+action,"动爻关系"))
        if edge["clash"]:
            context.append(_evidence("动爻冲本爻",str(sender)+"爻与本爻支相冲","动爻关系"))
        if edge["combine"]:
            context.append(_evidence("动爻合本爻",str(sender)+"爻与本爻支六合","动爻关系"))

    turnback=row["turnback"]
    if turnback:
        term=turnback["term"]
        if term=="回头生":
            supports.append(_evidence("本位回头生",turnback["five_element_relation"],"动变关系"))
        elif term=="回头克":
            restraints.append(_evidence("本位回头克",turnback["five_element_relation"],"动变关系"))
        else:
            context.append(_evidence("本位回头关系",term+" · 不据此直接定强弱","动变关系"))
        if turnback["returning_clash"]:
            context.append(_evidence("回头冲","本位变爻与动爻相冲","动变关系"))
        if turnback["returning_combine"]:
            context.append(_evidence("回头合","本位变爻与动爻六合","动变关系"))

    if void.get("moving_into_void"):
        restraints.append(_evidence("动而化空","本位变爻支逢旬空，实效待复核","旬空章"))

    tension=bool(supports and restraints)
    if tension:
        summary="此爻同时具有生扶线索和制约条件，必须并列合参，不能净额相减。"
    elif supports:
        summary="已有生扶线索；未发现相互制约的已计算标记，不等于确定旺相。"
    elif restraints:
        summary="已有制约条件；不能因单个空破或受克标记认定最终衰弱。"
    else:
        summary="目前只发现背景或待核实条件；不足以判定旺衰。"
    return {
        "position":position,
        "ganzhi":row["ganzhi"],
        "liuqin":row["liuqin"],
        "element":row["element"],
        "moving":row["moving"],
        "supporting":supports,
        "restraining":restraints,
        "context":context,
        "pending":pending,
        "has_opposing_indicators":tension,
        "summary":summary,
        "decision":"not_determined",
    }


def decorate_strength_evidence(chart:dict)->dict:
    rows=[_review_row(row,chart) for row in chart["najia_lines"]]
    focus=chart["focus_decision"]
    positions=[row["position"] for row in focus.get("candidates",[])]
    active=focus.get("selected_position")
    selected=next((row for row in rows if row["position"]==active),None)
    candidate_rows=[row for row in rows if row["position"] in positions]
    unresolved=[
        "传统五行证据需要分辨实际旺衰与各条件效力，不能按支持/制约条数评分。",
        ("日月已由服务器使用中国历法库复算并随盘保存来源；交节边界和换日规则仍需核对。"
         if chart.get("calendar_provenance") else
         "当前日辰与节令月支是手动输入值，尚未随本卦保存历法来源与交节核验记录。"),
        "旬空真假、空破相遇、暗动/日破、合绊、墓绝和应期尚未做确定性综合裁断。",
    ]
    if not chart["calendar"]["day"]:unresolved.insert(0,"日辰未提供，旬空与日冲证据缺失。")
    if not chart["calendar"]["month"]:unresolved.insert(0,"节令月建未提供，月令等级与月破证据缺失。")
    if focus["status"]=="not_selected":unresolved.append("尚未明确关注对象，不自动选用神。")
    if focus["status"]=="not_visible":unresolved.append("本卦用神不现；需另研究日月取用及伏神，不伪造明现主爻。")
    if focus["status"]=="multiple_visible":unresolved.append("同一六亲多现，不能因为某爻有利标记多就自动排除其他候选。")

    chart["strength_evidence"]={
        "version":"V15",
        "status":"structured_evidence_only",
        "rows":rows,
        "focus_status":focus["status"],
        "focus_candidate_positions":positions,
        "focus_candidates":candidate_rows,
        "selected_position":active,
        "selected":selected,
        "opposing_positions":[row["position"] for row in rows if row["has_opposing_indicators"]],
        "unresolved":unresolved,
        "requires_human_review":True,
        "has_final_strength":False,
        "strength_score":None,
        "fortune_conclusion":None,
        "method":"按本卦六爻逐项核对月令、日辰、其他动爻、本位动变及空破，保留并存和互相制约的证据。",
        "boundary":"此处是传统术数研习的可复核条件表，不能替代真实历法核查、用神取舍、旺衰裁断，更不作现实结果预测。",
        "references":SOURCES,
    }
    return chart
