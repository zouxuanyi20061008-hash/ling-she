"""六爻日冲、月破与用神证据汇总（教学审查层）。

依据《增删卜易》日辰、暗动、月破章，只输出可复核的条件：
- 静爻旺相受日冲：暗动候选；静爻休囚受日冲：日破候选。
- 土月余气、不曾核定月支或已经发动的爻：不擅自判定暗动/日破。
- 月建冲爻：月破条件成立；若兼有日辰扶助、动爻、回头作用等，
  并列提醒，不因单个「月破」标记判定永远无用。
- 用神汇总只罗列证据，绝不打分，不宣称完整断吉凶。
时间干支与节气仍须用户手工核对。
"""
from __future__ import annotations

from .hexagrams import GENERATES
from .najia import BRANCH_ELEMENT

REFERENCES={
    "day":"https://zh.wikisource.org/zh-hans/增删卜易/17",
    "dark":"https://zh.wikisource.org/zh-hans/增删卜易/22",
    "month":"https://zh.wikisource.org/zh-hans/增删卜易",
    "seasons":"https://www.shidianguji.com/book/XYXZSBY/chapter/1lzxsn553lws2",
}

def _is_day_support(action:dict|None)->bool|None:
    if action is None:return None
    return action["same_branch"] or action["element_relation"] in ("日辰生爻","日辰爻同五行")

def _moving_support(moving_edges:list[dict],position:int)->tuple[list[int],list[int]]:
    help_positions=[]
    restrain_positions=[]
    for e in moving_edges:
        if e["target_position"]!=position:
            continue
        if e["element_relation"] in ("动爻生本卦爻","动爻本卦爻同五行"):
            help_positions.append(e["source_position"])
        if e["element_relation"]=="动爻克本卦爻":
            restrain_positions.append(e["source_position"])
    return sorted(help_positions),sorted(restrain_positions)

def _day_clash_state(row:dict,month:dict|None)->dict:
    action=row.get("day_action")
    season=row.get("seasonal_status")
    status="not_provided"
    label="日辰未填写，暂不判断"
    if action:
        if not action["clash"]:
            status,label="not_clashed","日辰未冲此爻"
        elif row["moving"]:
            status,label="already_moving","此爻本已明动，不按静爻暗动或日破分类"
        elif month is None or season is None:
            status,label="season_unverified","静爻逢日冲，尚缺节令月支，无法分辨暗动与日破"
        elif season["grade"] in ("旺","相"):
            status,label="dark_moving_candidate","旺相静爻遇日冲：符合暗动候选条件"
        elif season["grade"]=="休囚（未细分）":
            status,label="day_broken_candidate","休囚静爻遇日冲：符合日破候选条件"
        else:
            status,label="residual_qi_review","静爻余气遇日冲：月令状态存在余气，需再辨"
    cautions=[]
    if action and action["clash"]:
        if row.get("is_xunkong"):cautions.append("同时旬空：日冲空爻另需辨冲空，不可单看日冲")
        if row.get("month_break_marker"):cautions.append("同时月冲：日月交互需合参")
        if row.get("day_combine"):cautions.append("需检查合住与冲开条件")
        if status in ("dark_moving_candidate","day_broken_candidate"):
            cautions.append("仅据静动与月令概要划分候选，尚非完整旺衰定论")
    return {"status":status,"label":label,"day_branch":action["source_branch"] if action else None,
            "clashed":action["clash"] if action else None,
            "month_grade":season["grade"] if season else None,"cautions":cautions}

def _month_break_state(row:dict,day:dict|None,moving_edges:list[dict])->dict:
    action=row.get("month_action")
    if not action:
        return {"status":"not_provided","label":"节令月支未提供，暂不判断月破","clashed":None,"review":[]}
    if not action["clash"]:
        return {"status":"not_clashed","label":"月建不冲此爻","clashed":False,"review":[]}
    helpers,restrainers=_moving_support(moving_edges,row["position"])
    review=[]
    if row["moving"]:review.append("本爻发动：不可将月破解释成永远不能发挥作用")
    day_action=row.get("day_action")
    if day_action is None:review.append("未确认日辰，无法核实日辰生扶或冲合")
    else:
        if _is_day_support(day_action):review.append("日辰存在同支或五行生扶条件，应复核")
        if day_action["combine"]:review.append("日辰与此爻六合，应复核")
        if day_action["clash"]:review.append("日辰亦冲此爻，需合参")
    if helpers:review.append("本卦有动爻生扶或同类关系："+ "、".join(str(x) for x in helpers)+"爻")
    if restrainers:review.append("本卦有动爻克制关系："+ "、".join(str(x) for x in restrainers)+"爻")
    if row.get("is_xunkong"):review.append("此爻同时旬空，需辨空破交互")
    if row.get("turnback"):review.append("此动爻另有本位回头关系，需合参")
    if not review:review.append("当前未发现已计算的显著生扶条件，不等于恒久无用")
    return {
        "status":"month_clash_condition",
        "label":"月建冲爻：月破条件成立（实际作用待合参）",
        "clashed":True,"review":review,"moving_support_positions":helpers,
        "moving_restrain_positions":restrainers,
        "day_support":_is_day_support(day_action),
        "moving":row["moving"],
        "note":"《增删卜易》月破章讨论出月、填实与逢合等特殊条件；本模块不预测应期。"
    }

def _focus_entry(row:dict,edges:list[dict],month:dict|None,day:dict|None)->dict:
    helpers,restrainers=_moving_support(edges,row["position"])
    positives=[]
    reservations=[]
    day_action=row["day_action"]
    month_action=row["month_action"]
    if day_action:
        if day_action["same_branch"]:positives.append("日辰临此爻")
        elif day_action["element_relation"]=="日辰生爻":positives.append("日辰生爻")
        elif day_action["element_relation"]=="日辰克爻":reservations.append("日辰克爻")
    if month_action:
        if month_action["same_branch"]:positives.append("临月建")
        elif month_action["element_relation"]=="月建生爻":positives.append("月建生爻")
        elif month_action["element_relation"]=="月建克爻":reservations.append("月建克爻")
    if row["moving"]:positives.append("本爻明动（仅表动静，不等于旺）")
    if helpers:positives.append("动爻生扶或同类："+ "、".join(str(i) for i in helpers)+"爻")
    if restrainers:reservations.append("动爻克制："+ "、".join(str(i) for i in restrainers)+"爻")
    if row.get("is_xunkong"):reservations.append("旬空条件")
    if row["conflict_review"]["month_break"]["clashed"]:reservations.append("月破条件")
    clash=row["conflict_review"]["day_clash"]
    if clash["status"] not in ("not_clashed","not_provided"):
        reservations.append(clash["label"])
    if row["turnback"]:
        term=row["turnback"]["term"]
        (positives if term=="回头生" else reservations).append("本位动变："+term)
    if month is None:reservations.append("尚未确认节令月支")
    if day is None:reservations.append("尚未确认日辰")
    return {
        "position":row["position"],"ganzhi":row["ganzhi"],
        "liuqin":row["liuqin"],"element":row["element"],
        "season":row["seasonal_status"]["grade"] if row["seasonal_status"] else None,
        "moving":row["moving"],"xunkong":row.get("is_xunkong"),
        "day_clash_status":clash["status"],
        "month_break":row["conflict_review"]["month_break"]["clashed"],
        "supportive_observations":positives,
        "cautionary_observations":reservations,
        "note":"两栏均是条件清单，未对生克效力、合绊或最终旺衰作判断。",
    }

def decorate_conflicts_and_focus_review(chart:dict)->dict:
    month=chart["calendar"]["month"]
    day=chart["calendar"]["day"]
    edges=chart["moving_influences"]["edges"]

    for line in chart["najia_lines"]:
        line["conflict_review"]={
            "day_clash":_day_clash_state(line,month),
            "month_break":_month_break_state(line,day,edges),
        }
    # 之卦只提供静态月冲与日冲事实，不混同本卦真实静动条件。
    for line in chart["bian_najia_lines"]:
        line["conflict_review"]={
            "day_clash":{"status":"transformed_reference_only",
                         "label":"变卦支仅供比对；不独立判本卦暗动/日破",
                         "clashed":line["day_clash"]},
            "month_break":{"status":"transformed_reference_only",
                           "label":"变卦支仅供对照，实际作用须看动变关系",
                           "clashed":line["month_break_marker"]},
        }
    focus=chart.get("focus")
    overview={
        "rule":"日冲先看本卦是否静爻，再辨月令旺相或休囚；月冲只确定月破条件。余气、旬空、日月并见、生扶与动变均需人工复核。",
        "source":REFERENCES,
        "calendar_verification":chart["calendar"]["verification"],
        "manual_calendar_notice":"日辰及节令月支仅为用户选择，未核对真实换日、节气交界。",
        "complete_strength_computed":False,
        "fortune_conclusion":None,
        "candidates":[],
    }
    if not focus:
        overview.update({"status":"focus_not_selected",
                         "message":"请先由求测者确定关注六亲或世应，不自动指定用神。"})
    elif not focus["primary_positions"]:
        selected=chart["fushen"]["selected"]
        overview.update({
            "status":"focus_not_visible",
            "message":"所选六亲本卦不现，须先研究日月取用与伏神可用性；不把伏神伪装成明现用神。",
            "hidden_candidates":selected["entries"] if selected and selected["status"]=="hidden_in_palace" else [],
        })
    else:
        overview.update({
            "status":"evidence_only",
            "message":"仅供逐爻核对支持与制约条件；候选多现时全部列出，不决定唯一用神或吉凶。",
            "candidates":[_focus_entry(chart["najia_lines"][pos-1],edges,month,day)
                           for pos in focus["primary_positions"]]
        })
    chart["day_month_review"]=overview
    return chart
