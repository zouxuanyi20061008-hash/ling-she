"""V66 太乙岁计同宫特殊取算：《武备志》起算目临太乙，仅取该宫数。

V65 常规逐宫公式仍原样保留。明确增加两套可选择算法：
  wubeizhi: 遇文昌或始击与太乙同宫，按所在宫宫数单独取算。
  conservative: 保留 V65 同宫待判，附带异派参考，不自动补结果。

逐年历元沿 V64；另有三份独立古籍 55-59 局锚点。
58 局《武备志》《古今图书集成》主算12，而《太乙秘书》主算13，
不能拿一份直接覆盖另一份历史数。只陈列流派原始差异。
"""
from __future__ import annotations

from .taiyi_v65 import _general_from_count

PRIMARY="https://www.shidianguji.com/book/CADAL02092259/chapter/1lb3wzm7f2qzs"
FIFTY_FIVE="https://www.shidianguji.com/zh/book/CADAL02092259/chapter/1lb3x03wqwyeg"
INDEPENDENT_55="https://www.shidianguji.com/mid-page/7430936373068120073"
COMPETING_58="https://libokang.com/classics/taiyi/%E5%A4%AA%E4%B9%99%E7%A7%98%E4%B9%A6/"
INDEPENDENT_58="https://zh.wikisource.org/zh-hans/%E6%AC%BD%E5%AE%9A%E5%8F%A4%E4%BB%8A%E5%9C%96%E6%9B%B8%E9%9B%86%E6%88%90/%E5%8D%9A%E7%89%A9%E5%BD%99%E7%B7%A8/%E8%97%9D%E8%A1%93%E5%85%B8/%E7%AC%AC696%E5%8D%B7"
MODES=("wubeizhi","conservative")
# Ancient fixed examples; NEVER used to compute arbitrary years.
CASE_REFERENCES={
 55:{"main":16,"guest":3,"wenchang":"武德","shiji":"和德",
     "sources":[FIFTY_FIVE,INDEPENDENT_55]},
 56:{"main":15,"guest":34,"wenchang":"太簇","shiji":"太阳",
     "sources":[FIFTY_FIVE]},
 57:{"main":10,"guest":25,"wenchang":"阴主","shiji":"大神",
     "sources":[FIFTY_FIVE]},
 58:{"main":12,"guest":26,"wenchang":"阴德","shiji":"天道",
     "sources":[FIFTY_FIVE,INDEPENDENT_58]},
 59:{"main":12,"guest":19,"wenchang":"阴德","shiji":"武德",
     "sources":[FIFTY_FIVE]},
}


def _count_same_palace(source:dict,taiyi_palace:int)->dict:
    if source.get("status")!="pending" or source.get("same_palace_as_taiyi") is not True:
        raise ValueError("同宫特例只能从 V65 明确报告同宫的分支接续")
    if taiyi_palace not in (1,2,3,4,6,7,8,9):
        raise ValueError("太乙同宫法不允许中五宫")
    alt=source.get("historical_alternative")
    if not alt or alt.get("calculated_count")!=taiyi_palace:
        raise ValueError("V66 历史异法须有与实际宫数相符的明示参考")
    direction=source["stop_direction"]
    general=_general_from_count(taiyi_palace)
    assistant=_general_from_count(3*general)
    return {
        **source,
        "status":"computed",
        "count":taiyi_palace,
        "trace":[{
            "order":1,"index":None,"direction":direction,
            "god":"起算目临太乙", "palace":taiyi_palace,
            "added":taiyi_palace,
            "why":"《武备志》同宫只依所在太乙宫宫数得算，止于本宫",
            "special_case":True,
        }],
        "stop_excluded":False,
        "trace_complete":True,
        "special_rule_applied":True,
        "same_palace_rule":"wubeizhi",
        "source":PRIMARY,
        "main_general":general,"assistant_general":assistant,
        "general_status":"computed",
        "general_rule":"同宫所得宫数迁大将；大将三因得参将",
        "original_v65_pending":{
            "status":source["status"],"count":source["count"],
            "reason":source["reason"],
        },
        "historical_alternative":{**alt,"is_default":True},
    }


def decorate_taiyi_v66(chart:dict,same_palace_rule:str="wubeizhi")->dict:
    if chart.get("version")!="V65" or chart.get("calculation")!="岁计":
        raise ValueError("V66 必须基于真实 V65 岁计主客路径")
    if same_palace_rule not in MODES:
        raise ValueError("同宫计数口径仅允许 wubeizhi 或 conservative")
    v=chart["main_guest"]
    taiyi=chart["year"]["taiyi_palace"]["number"]
    applied=[]
    if same_palace_rule=="wubeizhi":
        for key in ("main_general","guest_general"):
            old=v[key]
            if old["status"]=="pending" and old.get("same_palace_as_taiyi"):
                new=_count_same_palace(old,taiyi)
                v[key]=new
                applied.append(key)
        v["main_calculated"]=v["main_general"]["count"]
        v["guest_calculated"]=v["guest_general"]["count"]
        state=("computed" if all(v[k]["status"]=="computed" for k in (
            "main_general","guest_general")) else
            "partially_computed" if any(v[k]["status"]=="computed" for k in (
            "main_general","guest_general")) else "pending")
        v["status"]=state
        v["main_guest_generals_computed"]=state=="computed"
        v["reason"]=(
            "常规路径照 V65 逐宫计算；同宫起算目按《武备志》本宫宫数取算，均可逐步复核。"
            if applied else v["reason"])
    v["same_palace_rule"]=same_palace_rule
    v["same_palace_rule_label"]=(
        "《武备志》同宫取本宫宫数（V66 默认）" if same_palace_rule=="wubeizhi"
        else "保守口径：与太乙同宫保留待算（V65）")
    v["special_cases_applied"]=applied
    v["has_same_palace_alternative"]=any(
        k.get("same_palace_as_taiyi",False) for k in (
            v["main_general"],v["guest_general"]))
    v["sources"]={**v["sources"],"wubeizhi_same_palace":PRIMARY,
                  "fifty_five_independent":INDEPENDENT_55}
    chart["has_complete_main_guest"]=v["status"]=="computed"
    # Nine palace, 16-spirit locations must remain identical across rule modes.
    for p in chart["nine_palaces"]:
        p["main_general_here"]=v["main_general"]["main_general"]==p["number"]
        p["guest_general_here"]=v["guest_general"]["main_general"]==p["number"]
    if v["status"]=="computed":
        for side in ("main_general","guest_general"):
            trans=v[side]
            assert trans["count"]==sum(x["added"] for x in trans["trace"])
            assert trans["main_general"] in range(1,10)
            assert trans["assistant_general"] in range(1,10)
    # Reference matches are audited as evidence, never copied to outputs.
    ju=chart["year"]["ju"]
    ref=CASE_REFERENCES.get(ju)
    evidence=None
    if ref and same_palace_rule=="wubeizhi":
        actual={"main":v["main_calculated"],"guest":v["guest_calculated"],
                "wenchang":v["heaven_eye_wenchang"]["god"],
                "shiji":v["earth_eye_shiji"]["god"]}
        expected={k:ref[k] for k in actual}
        if actual!=expected:
            raise ValueError("V66 阳遁固定局号与古籍独立文本冲突："+str(ju)+"局")
        evidence={"status":"verified_original_text","ju":ju,
                  "expected":expected,"actual":actual,
                  "sources":ref["sources"],
                  "derived_independently":True}
    chart["historical_case_audit"]=evidence
    if ju==58:
        chart["school_disagreements"]=[{
           "topic":"阳遁58局文昌阴德的主算",
           "chosen_school":"《武备志》／《古今图书集成》",
           "chosen_main_count":12,"chosen_source":FIFTY_FIVE,
           "other_school":"《太乙秘书》","other_main_count":13,
           "other_source":COMPETING_58,
           "no_silent_override":True,
           "note":"主算同文献有12/13异文。当前模式沿逐宫投算12；另一历史记载13供校勘，不混入默认结果。",
        }]
    else:
        chart["school_disagreements"]=[]
    v["verified_by_independent_ancient_case"]=(
        v["verified_by_independent_ancient_case"] or evidence is not None)
    v["next"]="V67 继续核对更多阳遁年局中的计神、文昌变例和中五将落宫。"
    chart["version"]="V66"
    chart["has_full_annual_chart"]=False
    chart["same_palace_rule"]=same_palace_rule
    chart["warnings"]=[
        "V66 同宫法采用《武备志》明文，用户也可切换 V65 保守待算口径；未改变 V64 积年、五元与太乙行宫。",
        "第五十五至五十九局用《武备志》等独立例盘验算；第五十八局主算12/13有异文，分开列示。",
        "主客数与大小将仅作太乙岁计传统算式结构；不推断现实胜负、健康、事业或具体未来事件。",
        "完整岁计的其余神煞、定计、月日时计以及古籍不同积年流派尚未全部完成。",
    ]
    return chart
