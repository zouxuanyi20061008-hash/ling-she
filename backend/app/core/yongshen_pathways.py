"""六爻 V18 用神原忌仇同案追溯：五行方向 != 已判作用。

据《增删卜易》用神元神忌神仇神章第九及元神忌神衰旺章第十：
原神可以生用神、忌神可以克用神、仇神可以克原生忌。
这些是角色与潜在五行路径，不能脱离日月、动静、空破、
回头合墓绝来断实际生克；同一六亲多现不得由程序自动择优。
"""
from __future__ import annotations

SOURCES={
    "roles":"https://zh.wikisource.org/zh-hans/增删卜易/9",
    "strength":"https://zh.wikisource.org/zh-hans/增删卜易/10",
}
ROLE_PATHS={
    "原神":{"direction":"生用神","note":"原神五行生用神；是否真正生扶仍需核对其自身状况"},
    "忌神":{"direction":"克用神","note":"忌神五行克用神；是否真的成克不能凭五行静态关系判定"},
    "仇神":{"direction":"克原神、生忌神（间接链）","note":"仇神不是直接作用于所问用神的路径；要先审原神与忌神"},
}


def _source_path(source:dict,focus:dict,role:str,chart:dict)->dict:
    pos=source["position"]
    line=chart["najia_lines"][pos-1]
    strength=chart["strength_evidence"]["rows"][pos-1]
    special=chart["special_conditions"]["rows"][pos-1]
    review=chart["moving_effect_review"]["movements"]
    moving_detail=next((x for x in review if x["position"]==pos),None)
    edges=[
        x for x in chart["moving_influences"]["edges"]
        if x["source_position"]==pos and x["target_position"]==focus["position"]
    ]
    # 动爻=>本卦其他爻的直接关系，应当恰有一条；安静爻应为零。
    if role in ("原神","忌神") and line["moving"] and len(edges)!=1:
        raise ValueError("实际动爻与本卦主爻作用边不唯一，应核对基础计算")
    if not line["moving"] and edges:
        raise ValueError("静爻被错误算成主动生克来源")

    flags=[]
    if line["is_xunkong"] is True:flags.append("原爻旬空")
    if line["month_break_marker"] is True:flags.append("月破条件")
    if line["day_clash"] is True:flags.append("日冲条件（不可直接判暗动）")
    if line["seasonal_status"] and line["seasonal_status"]["grade"]=="余气":
        flags.append("月令余气待辨")
    if line["void_review"]["moving_into_void"]:
        flags.append("动而化空条件")
    if line["turnback"]:flags.append("本位动变："+line["turnback"]["term"])
    if special["has_any_condition"]:
        types=list(dict.fromkeys(item["kind"] for key in ("combinations","tombs","extinctions")
                                  for item in special[key]))
        flags.extend(types)
    if not chart["calendar"]["day"]:flags.append("日辰未提供")
    if not chart["calendar"]["month"]:flags.append("节令月建未提供")
    if strength["has_opposing_indicators"]:flags.append("日月动变等支持与制约并存")

    status="moving_path_pending_effect" if line["moving"] else "static_relation_only"
    if role=="仇神":
        status="indirect_role_not_direct_action"
    return {
        "source_position":pos,"source_ganzhi":line["ganzhi"],
        "source_element":line["element"],"source_liuqin":line["liuqin"],
        "target_position":focus["position"],"target_ganzhi":focus["ganzhi"],
        "role":role,"direction":ROLE_PATHS[role]["direction"],
        "moving":line["moving"],
        "relation_to_target":edges[0]["element_relation"] if edges and role!="仇神" else None,
        "relation_scope":("active_original_line_edge" if edges and role!="仇神"
                          else "indirect_elemental_chain" if role=="仇神"
                          else "elemental_only"),
        "source_season":line["seasonal_status"]["grade"] if line["seasonal_status"] else None,
        "source_supporting_count":len(strength["supporting"]),
        "source_restraining_count":len(strength["restraining"]),
        "source_has_opposing_indicators":strength["has_opposing_indicators"],
        "source_flags":list(dict.fromkeys(flags)),
        "moving_effect_status":moving_detail["status"] if moving_detail else None,
        "effective":None,
        "status":status,
        "note":ROLE_PATHS[role]["note"]+"；不可按证据条数评定力量。",
    }


def decorate_yongshen_pathways(chart:dict)->dict:
    spirit=chart.get("spirit_relations")
    decision=chart["focus_decision"]
    base={
        "version":"V18",
        "status":"focus_not_selected",
        "category":chart["focus"]["category"] if chart.get("focus") else None,
        "selected_position":decision.get("selected_position"),
        "focus_candidates":[],
        "roles":{},
        "moving_yuan_ji_together":False,
        "comparison":"静态角色、真实明动与日月空破条件都要分别审查，不作自动强弱排名。",
        "references":SOURCES,
        "effectiveness_determined":False,
        "fortune_conclusion":None,
        "boundary":"传统术数教学用的路径对照，不是吉凶、健康、财务或其他现实事项的确定判断。",
    }
    if not chart.get("focus"):
        base["message"]="先按具体所问选择六亲或世应。"
        chart["yongshen_pathways"]=base
        return chart
    if decision["status"]=="not_visible":
        base.update({
            "status":"focus_not_visible",
            "message":"用神本卦不现，必须先研究日月取用及飞伏。暂不把伏神当成明爻与原忌仇神发生已知作用。",
            "hidden_candidates":decision.get("hidden_candidates",[]),
        })
        chart["yongshen_pathways"]=base
        return chart
    if spirit is None or spirit["status"]!="ready":
        raise ValueError("可见用神缺少原忌仇五行资料")

    roles=spirit["roles"]
    base["roles"]={
        r:{"element":roles[r]["element"],"positions":roles[r]["positions"],
           "moving_positions":roles[r]["moving_positions"]}
        for r in ("原神","忌神","仇神")
    }
    base["moving_yuan_ji_together"]=bool(roles["原神"]["moving_positions"] and
                                         roles["忌神"]["moving_positions"])
    base["status"]="visible_candidates"
    base["message"]=("原神与忌神都出现明动；《增删卜易》讨论二者同动的情况，"
                     "但不得自动认定相生抵消相克或两生必有效。"
                     if base["moving_yuan_ji_together"] else
                     "逐一核对原神、忌神、仇神，不把静爻基本五行关系说成真实作用。")
    for candidate in decision["candidates"]:
        pos=candidate["position"]
        focus_row=chart["strength_evidence"]["rows"][pos-1]
        paths={r:[_source_path(src,candidate,r,chart) for src in roles[r]["lines"]]
               for r in ("原神","忌神","仇神")}
        base["focus_candidates"].append({
            "position":pos,"ganzhi":candidate["ganzhi"],
            "element":candidate["element"],
            "selected_by_user":pos==decision.get("selected_position"),
            "focus_has_opposing_indicators":focus_row["has_opposing_indicators"],
            "focus_supporting":list(focus_row["supporting"]),
            "focus_restraining":list(focus_row["restraining"]),
            "pathways":paths,
            "active_direct_sources":{
                r:[x["source_position"] for x in paths[r] if
                   x["relation_scope"]=="active_original_line_edge"]
                for r in ("原神","忌神")
            },
            "joint_review_needed":True,
            "resolved_outcome":None,
        })
    chart["yongshen_pathways"]=base
    return chart
