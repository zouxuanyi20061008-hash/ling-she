"""六爻用神定位教学辅助：求测者明示关注对象，系统只匹配已装六亲/世应。

绝不自动代选用神；本卦无此六亲时只记"本卦不现"，不推定伏神。
同一六亲多现时全列出，不擅自取旺相者为唯一用神。
"""
from __future__ import annotations

from .najia import BRANCH_ELEMENT

FOCUS_CHOICES = {
    "父母": {
        "themes":"父母、师长、文书契约、房屋车船等",
        "why":"古籍通常以父母爻取庇护、文书和尊长类象；问事情进展时不能一律套用。",
        "examples":["问父母近况","问合同文书","问房屋手续"],
    },
    "官鬼": {
        "themes":"功名、职责、官府、忧患与约束等",
        "why":"传统官鬼有功名与压力两面；问职务与问忧患时，侧重未必相同。",
        "examples":["问职位录用","问官司进展","问风险压力"],
    },
    "兄弟": {
        "themes":"兄弟姐妹、同辈亲友、结盟者等",
        "why":"同辈与朋友为常见取象，具体应先分清谁是问事主体。",
        "examples":["问兄弟近况","问朋友的实际处境","问合伙关系"],
    },
    "妻财": {
        "themes":"财物、收入、经营成果、财产等",
        "why":"古籍多以妻财爻取财物与经营所得，也有传统婚配角色用法；不等于男女关系只能固定取财。",
        "examples":["问货款回收","问财物去向","问经营收益"],
    },
    "子孙": {
        "themes":"子女后辈、医药、动物、解忧等",
        "why":"子孙爻亦有制鬼解忧的传统取象，但与现代医疗效果不可直接等同。",
        "examples":["问子女的学习","问宠物走失","问解忧缓解"],
    },
    "世爻": {
        "themes":"求测者自身与自方立场",
        "why":"世应属于卦中角色位置，不是第六种六亲；问个人处境时可先观察世爻。",
        "examples":["问自身现状","问自己的取舍","问双方互动中的我方"],
    },
    "应爻": {
        "themes":"对方、他方或明确指向的外部对象",
        "why":"应爻是与世爻相对的角色位置，不等于所有陌生人的真实心理。",
        "examples":["问具体合作方","问交易另一方","问双方往来"],
    },
}


def focus_six_yao(chart: dict, focus: str | None = None) -> dict:
    if focus is None:
        chart["focus"] = None
        return chart
    if focus not in FOCUS_CHOICES:
        raise ValueError("请选择父母、官鬼、兄弟、妻财、子孙、世爻或应爻中的一种学习对象")

    info=FOCUS_CHOICES[focus]
    ben_lines=chart["najia_lines"]
    bian_lines=chart["bian_najia_lines"]
    if focus in ("世爻","应爻"):
        key="shi_position" if focus=="世爻" else "ying_position"
        positions=[chart["eight_palaces"]["ben"][key]]
        transform_positions=positions[:]
    else:
        positions=[p["position"] for p in ben_lines if p["liuqin"]==focus]
        transform_positions=[p["position"] for p in bian_lines if p["liuqin"]==focus]
    rows=[p for p in ben_lines if p["position"] in positions]

    chart["focus"]={
        "category":focus,
        "origin":"user_selected",
        "is_position":focus in ("世爻","应爻"),
        "themes":info["themes"],
        "why":info["why"],
        "examples":info["examples"],
        "primary_positions":positions,
        "transformed_positions":transform_positions,
        "found_in_ben":bool(positions),
        "multiple_in_ben":len(positions)>1,
        "moving_positions":[p["position"] for p in rows if p["moving"]],
        "lines":[{
            "position":p["position"],"ganzhi":p["ganzhi"],"liuqin":p["liuqin"],
            "moving":p["moving"],"branch":p["branch"],"element":BRANCH_ELEMENT[p["branch"]]
        } for p in rows],
        "note":(
            "本卦未见所选六亲。只可记录‘本卦不现’，后续如需研究伏神须另行按本宫卦及规则装伏神，不可凭空补出。"
            if not positions and focus not in ("世爻","应爻") else
            "本卦同类六亲多现，暂列出全部候选；需继续结合动静、日月与事情本身研究，不能擅自挑一爻当唯一用神。"
            if len(positions)>1 and focus not in ("世爻","应爻") else
            "此为角色位置参考，并非自动确定吉凶。" if focus in ("世爻","应爻") else
            "标出本卦对应六亲，不代表已完成用神旺衰、原神忌神或应期判断。"
        ),
    }
    return chart
