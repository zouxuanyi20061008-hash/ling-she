"""V59 六壬发三传：遥克、伏吟刑冲、反吟有克/无亲；涉害候选审计。

《六壬指南》《六壬粹言》《六壬金铰剪》校验具体例课。
"涉害"有循途计害、孟仲季优先等互有出入的排法；此版
保留完整候选与日干阴阳/孟仲季定位，但不伪称所有涉害可裁决。
原 V58 贼克和比用仍为默认内核，不破坏原课上神来源。
"""
from __future__ import annotations
from .calendar import BRANCHES,STEMS
from .bazi import STEM_ELEMENT,BRANCH_ELEMENT,CONTROLS
from .liuren import LODGES

BRANCH_INDEX={b:i for i,b in enumerate(BRANCHES)}
PUNISH={
 "子":"卯","丑":"戌","寅":"巳","卯":"子",
 "辰":"辰","巳":"申","午":"午","未":"丑",
 "申":"寅","酉":"酉","戌":"未","亥":"亥",
}
HORSE={**dict.fromkeys(("申","子","辰"),"寅"),
       **dict.fromkeys(("寅","午","戌"),"申"),
       **dict.fromkeys(("巳","酉","丑"),"亥"),
       **dict.fromkeys(("亥","卯","未"),"巳")}
MENG=set("寅申巳亥")
ZHONG=set("子午卯酉")
THREE_PART={**{b:"孟" for b in MENG},**{b:"仲" for b in ZHONG},
            **{b:"季" for b in "辰戌丑未"}}
SOURCES={
 "remote":"https://www.shidianguji.com/book/SK1599/chapter/1k1lqkrmpx06d",
 "fuyin":"https://libokang.com/classics/liuren/%E5%A4%A7%E5%85%AD%E5%A3%AC%E6%8C%87%E5%8D%97/",
 "fanyin":"https://libokang.com/classics/liuren/%E5%85%AD%E5%A3%AC%E7%B2%B9%E8%A8%80/",
 "shehai":"https://www.zhaosir.online/Books/BookChapterDetail.aspx?did=926",
}


def _triple(initial:str,middle:str,last:str,method:str,
            candidates:list[str]|None=None,source:str|None=None,
            audit:dict|None=None)->dict:
    assert all(x in BRANCH_INDEX for x in (initial,middle,last))
    return {
      "status":"computed","method":method,
      "initial_candidates":list(candidates or [initial]),
      "selected_initial":initial,
      "transmissions":[{"order":i,"name":n,"branch":b}
          for i,(n,b) in enumerate(zip(("初传","中传","末传"),
                                      (initial,middle,last)),1)],
      "certainty":"unique_after_supported_rules",
      "source":source,"rule_audit":audit or {},
      "fortune_verdict":None,
    }


def _pending(method:str,reason:str,candidates:list[str]|None=None,
             audit:dict|None=None)->dict:
    return {"status":"pending","method":method,"reason":reason,
            "initial_candidates":list(candidates or []),
            "transmissions":None,"certainty":"unsupported_not_guessed",
            "rule_audit":audit or {}, "fortune_verdict":None}


def _unique_from_lessons(day:str,lessons:list[dict]):
    lower=[p for p in lessons if p["relation"]=="下贼上"]
    upper=[p for p in lessons if p["relation"]=="上克下"]
    used=lower if lower else upper
    options=list(dict.fromkeys(p["upper"] for p in used))
    if len(options)==1:return options[0],options
    if options:
        same=[p for p in options if BRANCH_INDEX[p]%2==STEMS.index(day[0])%2]
        if len(same)==1:return same[0],options
    return None,options


def _fuyin(day:str,lessons:list[dict])->dict:
    chosen,candidates=_unique_from_lessons(day,lessons)
    yang=STEMS.index(day[0])%2==0
    if not candidates:
        chosen=lessons[0]["upper"] if yang else lessons[2]["upper"]
        method="伏吟·自任" if yang else "伏吟·自信"
    else:
        method="伏吟·不虞（有贼克）"
        if chosen is None:
            return _pending("伏吟需校验多贼克发用",
                "伏吟四课有多个贼克候选且比用未能确定唯一者",candidates)
    first=chosen
    # Self punishment breaks the chain: choose branch-upper for yang,
    # stem-upper for yin. If the second is self-punishing, use its opposite.
    self_first=PUNISH[first]==first
    second=(lessons[2]["upper"] if yang else lessons[0]["upper"]) if self_first else PUNISH[first]
    self_second=PUNISH[second]==second
    third=BRANCHES[(BRANCH_INDEX[second]+6)%12] if self_second else PUNISH[second]
    if self_first:method+=" · 初传自刑改取"+("支上神" if yang else "干上神")
    if self_second:method+=" · 中传自刑改冲"
    return _triple(first,second,third,method,candidates,
        SOURCES["fuyin"],{"initial_self_punishment":self_first,
         "middle_self_punishment":self_second,"punishment_path":[first,second,third]})


def _fanyin(day:str,plate:dict,lessons:list[dict],original:dict)->dict:
    # V58 deliberately short-circuited *all* fanyin before evaluating conflicts,
    # so recompute 贼克/比用 from the four real lessons here.
    chosen,candidates=_unique_from_lessons(day,lessons)
    if candidates and chosen is not None:
        mid=plate[chosen];last=plate[mid]
        if last!=chosen or mid==chosen:
            raise ValueError("V59 反吟有克不能违反六冲相承")
        method=("反吟·有克·唯一贼克/比用"
                if len(candidates)>1 else "反吟·有克·单一贼克")
        return _triple(chosen,mid,last,method,candidates,
                       SOURCES["fanyin"],{
                         "source_priority":"下贼上优先；无下贼才上克下",
                         "used_four_lessons":True})
    if candidates:
        return _pending("反吟多贼克仍需涉害",
                "反吟四课含多处贼克，阴阳比用后仍非唯一，须涉害核验",
                candidates,{"source":"实际四课（非旧 V58 反吟占位标记）"})
    if day[0] not in "丁己辛" or day[1] not in "丑未":
        return _pending("反吟特殊课式仍待原典校验",
                "无直接贼克但不属于已校验的丁己辛丑未六日")
    first=HORSE[day[1]]
    second=lessons[2]["upper"]
    last=lessons[0]["upper"]
    return _triple(first,second,last,"反吟·无亲（支驿马发用，支上中、干上末）",
            [first],SOURCES["fanyin"],{"horse_basis":"日支",
              "earth_branch":day[1],"duty_branch":first})


def _remote(day:str,plate:dict,lessons:list[dict])->dict|None:
    """Requires absolutely no direct four-lesson conflict."""
    if any(p["relation"]!="无直接克" for p in lessons):
        return None
    stem_element=STEM_ELEMENT[day[0]]
    # Primary sources explicitly say second/third/fourth upper gods, not first.
    tops=list(dict.fromkeys(p["upper"] for p in lessons[1:]))
    invaders=[b for b in tops if CONTROLS[BRANCH_ELEMENT[b]]==stem_element]
    targets=[b for b in tops if CONTROLS[stem_element]==BRANCH_ELEMENT[b]]
    picks=invaders if invaders else targets
    if not picks:return None
    kind="蒿矢（上神遥克日干）" if invaders else "弹射（日干遥克上神）"
    if len(picks)==1:
        chosen=picks[0]
    else:
        same=[p for p in picks if BRANCH_INDEX[p]%2==STEMS.index(day[0])%2]
        if len(same)==1:
            chosen=same[0];kind+=" · 比用择一"
        else:
            return _pending("遥克需复核多个上神",
                "遥克有多个候选，阴阳比用后仍不能唯一选择",
                picks,{"remote_candidates":picks,"same_polarity_candidates":same})
    return _triple(chosen,plate[chosen],plate[plate[chosen]],
        "遥克·"+kind,picks,SOURCES["remote"],{"remote_candidates":picks,
         "first_priority":"神遥克日","source_lesson_numbers":[2,3,4]})


def _shehai_audit(day:str,lessons:list[dict],old:dict)->dict:
    options=old.get("initial_candidates",[])
    yang=STEMS.index(day[0])%2==0
    same=old.get("comparable_candidates",[])
    details=[{
        "upper":b,
        "lesson_numbers":[p["number"] for p in lessons if p["upper"]==b
                          and p["relation"]!="无直接克"],
        "lowers":[p["lower"] for p in lessons if p["upper"]==b
                 and p["relation"]!="无直接克"],
        "lowers_lodges":[LODGES[p["lower"]] if p["lower"] in STEMS else p["lower"]
                        for p in lessons if p["upper"]==b
                        and p["relation"]!="无直接克"],
        "candidate_branch_class":THREE_PART[b],
        "same_yin_yang_as_day":BRANCH_INDEX[b]%2==(0 if yang else 1),
    } for b in options]
    return _pending("涉害·候选分析已完成，计害流派待验",
        "仍有多贼克候选；已逐项列原课、阴阳及孟仲季，但循途受克深浅与优先法尚需独立案例，暂不自动择一",
        options,{"source":SOURCES["shehai"],"candidate_details":details,
                 "same_yin_yang_candidates":same,
                 "disputed_methods":["循本家涉害计数","孟仲季优先简法"],
                 "depths_computed":False,"automatically_selected":False})


def decorate_liuren_v59(chart:dict)->dict:
    if chart.get("version")!="V58" or not chart.get("has_real_plates_and_four_lessons"):
        raise ValueError("V59 只能在已验的十二宫四课基础上取传")
    day=chart["day_ganzhi"];lessons=chart["four_lessons"]
    plate=chart["heaven_plate"]
    if len(lessons)!=4 or set(plate)!=set(BRANCHES):
        raise ValueError("V59 十二宫或四课数据不完整")
    if (any(p["upper"]!=plate[LODGES[day[0]]] for p in lessons[:1])
        or lessons[2]["upper"]!=plate[day[1]]):
        raise ValueError("V59 四课来源与实际天盘不一致")
    old=chart["three_transmissions"]
    hour=chart["hour_branch"];general=chart["month_general"]
    offset=(BRANCH_INDEX[general]-BRANCH_INDEX[hour])%12
    if offset==0:
        new=_fuyin(day,lessons)
        klass="伏吟"
    elif offset==6:
        new=_fanyin(day,plate,lessons,old)
        klass="反吟"
    elif old["status"]=="computed":
        new=dict(old)
        new.setdefault("rule_audit",{"preserved_v58":True})
        klass="贼克/比用（V58 兼容）"
    elif any(p["relation"]!="无直接克" for p in lessons):
        new=_shehai_audit(day,lessons,old)
        klass="涉害审计（未自动发用）"
    else:
        remote=_remote(day,plate,lessons)
        new=remote if remote is not None else _pending(
            "昴星/别责/八专尚待校验",
            "四课无直接贼克且不构成可唯一决定的遥克；待别责、八专和昴星课式",
            [],{"method_family":"unimplemented_special_methods"})
        klass="遥克" if remote is not None else "无克无遥·待算"
    if new["status"]=="computed":
        if (len(new["transmissions"])!=3 or
            any(p["branch"] not in BRANCH_INDEX for p in new["transmissions"])):
            raise ValueError("V59 三传非法")
    elif new["transmissions"] is not None:
        raise ValueError("V59 未决课式不得包含虚构三传")
    chart["three_transmissions"]=new
    chart["has_three_transmissions"]=new["status"]=="computed"
    chart["transmission_review"]={
        "version":"V59","method_family":klass,"offset_palaces":offset,
        "status":new["status"],"ruleset":"明示遥克/刑冲/支马，涉害仍保留分歧",
        "expanded_methods":["遥克蒿矢","遥克弹射","伏吟不虞/自任/自信",
                            "反吟有克","反吟无亲"],
        "pending_methods":["涉害深浅","昴星","别责","八专"],
        "never_guess_transmissions":True,
        "real_world_fortune":None,"source_references":SOURCES,
    }
    chart["version"]="V59"
    chart["has_full_nine_methods"]=False
    chart["limits"]=[
       "V59 已加入遥克蒿矢/弹射、伏吟刑冲以及反吟有克/无亲六日，贼克比用沿用已验 V58。",
       "涉害只标候选原课、阴阳与孟仲季，未擅自选择计害流派；昴星/别责/八专仍待校验。",
       "十二天将、贵人昼夜规则、占断、应期尚未完成；三传仅为传统术数结构。",
    ]
    return chart
