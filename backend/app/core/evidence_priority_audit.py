"""V47 evidence registry: dedupe factual markers and queue coexisting constraints.

This is *review ordering*, not a classical strength or outcome priority. Missing
calendar inputs are not false predicates; transformed side is only a real moving
line; V44/V46 duplicate observations point to one canonical fact.
"""
from __future__ import annotations


def _code(pos:int,side:str,kind:str)->str:
    return f"line:{pos}:{side}:{kind}"


def decorate_evidence_priority_audit(chart:dict)->dict:
    sources={}
    duplicate_count=0
    def put(key:str, label:str, value, source:str, scope:str, title:str):
        nonlocal duplicate_count
        if key in sources:
            old=sources[key]
            if old["value"]!=value or old["scope"]!=scope:
                raise ValueError("V47 相同证据键出现不一致的原始规则事实："+key)
            duplicate_count+=1
            if source not in old["sources"]:old["sources"].append(source)
            return key
        sources[key]={
            "id":key,"label":label,"value":value,
            "sources":[source],"scope":scope,"title":title,
            "computed":True,"effective":None,
        }
        return key

    def linefact(pos:int,side:str,name:str,val,origin:str,title:str):
        if val is None:return None
        return put(_code(pos,side,name),name,val,origin,
                   f"{side}_line",title)

    cross=chart["cross_condition_audit"]
    multi=chart["multi_mover_audit"]
    if len(cross["rows"])!=6:
        raise ValueError("V47 逐爻基准必须覆盖六个本卦位置")
    lines=[]
    reviews=[]
    pending=[]
    for index,r in enumerate(cross["rows"],1):
        if r["position"]!=index:
            raise ValueError("V47 本卦证据索引与爻位不符")
        computed=r["computed"]
        original={
            "void":computed["original_void"],
            "month_clash":computed["original_month_clash"],
            "day_clash":computed["original_day_clash"],
            "season":computed["season"],
        }
        ids=[]
        for name,value in original.items():
            x=linefact(index,"original",name,value,"V44","本卦爻")
            if x:ids.append(x)
        for key in ("day","month"):
            action=computed[key]
            if action["status"]=="computed":
                x=linefact(index,"original",key+"_relation",action["relation"],"V44","本卦"+key)
                if x:ids.append(x)
        x=linefact(index,"original","moving",bool(r["moving"]),"V44","本卦动静")
        if x:ids.append(x)
        changed=r["actual_change"]
        if changed:
            if not r["moving"]:
                raise ValueError("V47 静爻不能具有真实本位化爻")
            for name,value in (
                ("void",changed["original_void"]),
                ("month_clash",changed["month_clash"]),
                ("returning",changed["returning_term"]),
            ):
                x=linefact(index,"changed",name,value,"V44","本位真实化爻")
                if x:ids.append(x)
        elif r["moving"]:
            raise ValueError("V47 明动爻缺失本位化爻")
        for kind in ("combinations","tombs","extinctions"):
            special=chart["special_conditions"]["rows"][index-1]
            if special["position"]!=index:raise ValueError("V47 特殊条件爻位错位")
            for item in special[kind]:
                # 'detail' may differ across editions. Keep the fact keyed to
                # the original condition, its actual source and other position.
                skey=(f"special:{index}:{kind}:{item['kind']}:"
                      f"{item['source']}:{item['other_position']}")
                ids.append(put(skey,item["kind"],item["kind"],"V17",
                               "original_line",item["source"]))
        unique=list(dict.fromkeys(ids))
        checks=[]
        for check in r["checks"]:
            checkid=f"line:{index}:cross:{check['id']}"
            checks.append(checkid)
            put(checkid,check["id"],True,"V44","cross_review",check["title"])
        for text in r["missing_inputs"]:
            if "未提供" in text or "待确认" in text or "手动" in text:
                key=f"missing:{index}:{'day' if '日辰' in text else 'month' if '月建' in text else 'provenance'}"
                pending.append({"id":key,"position":index,"title":text,
                                "priority":0 if "未提供" in text else 1,
                                "reason":"数据可验证性优先于任何术数作用效力研判"})
        tension=[]
        def tension_check(code,title,evidence):
            if all(k in sources for k in evidence):
                tension.append({"id":f"line:{index}:tension:{code}",
                                "position":index,"title":title,
                                "evidence_ids":evidence,"priority":2,
                                "actual_effectiveness":None})
        if original["void"] is True and original["month_clash"] is True:
            tension_check("void_month","旬空与月冲同时成立",
                          [_code(index,"original","void"),_code(index,"original","month_clash")])
        if original["void"] is True and original["day_clash"] is True:
            tension_check("void_day","旬空与日冲同时成立，不能自动认定冲实",
                          [_code(index,"original","void"),_code(index,"original","day_clash")])
        if changed and changed["original_void"] is True:
            tension_check("true_change_void","真实化爻旬空，回头效力仍未知",
                          [_code(index,"original","moving"),_code(index,"changed","void")])
        day=computed["day"]["relation"]
        month=computed["month"]["relation"]
        day_pos=day in ("日辰生爻","日辰爻同五行")
        month_pos=month in ("月建生爻","月建爻同五行")
        if ((day_pos and month=="月建克爻") or
            (month_pos and day=="日辰克爻")):
            tension_check("day_month","日月五行支持与克制并见",
                          [_code(index,"original","day_relation"),_code(index,"original","month_relation")])
        reviews.extend(tension)
        lines.append({
            "position":index,"moving":r["moving"],
            "selected_by_user":r["selected_by_user"],
            "focus_candidate":r["focus_candidate"],
            "evidence_ids":unique,
            "cross_check_ids":checks,
            "tensions":[x["id"] for x in tension],
            "missing_inputs":list(r["missing_inputs"]),
            "effective_strength":None,"true_void":None,"false_void":None,
        })
    pairs=[]
    for p in multi["pairs"]:
        a,b=p["positions"]
        if not 1<=a<b<=6 or not lines[a-1]["moving"] or not lines[b-1]["moving"]:
            raise ValueError("V47 不能给静爻或不存在的动爻配对")
        evid=[]
        for pos,st in ((a,p["a_state"]),(b,p["b_state"])):
            r=cross["rows"][pos-1]
            expected={
                "void":r["computed"]["original_void"],
                "month_clash":r["computed"]["original_month_clash"],
                "day_clash":r["computed"]["original_day_clash"],
                "season":r["computed"]["season"],
                "moving":True,
            }
            observed={
                "void":st["original_void"],"month_clash":st["month_clash"],
                "day_clash":st["day_clash"],"season":st["season"],"moving":True,
            }
            if expected!=observed:
                raise ValueError("V47 V44 与 V46 来源动爻条件不一致")
            for key,v in observed.items():
                x=linefact(pos,"original",key,v,"V46","本卦真实明动来源")
                if x:evid.append(x)
            real=r["actual_change"]
            if (real is None or
                real["original_void"]!=st["actual_changed_void"] or
                real["month_clash"]!=st["actual_changed_month_clash"] or
                real["returning_term"]!=st["returning_term"]):
                raise ValueError("V47 V44 与 V46 本位真实化爻条件不一致")
            for name,v in (("void",st["actual_changed_void"]),
                           ("month_clash",st["actual_changed_month_clash"]),
                           ("returning",st["returning_term"])):
                x=linefact(pos,"changed",name,v,"V46","本位真实化爻")
                if x:evid.append(x)
        for side in ("a_to_b","b_to_a"):
            direction=p[side]
            u,v=direction["source_position"],direction["target_position"]
            if (u,v) not in ((a,b),(b,a)) or not direction["actual_original_mover"]:
                raise ValueError("V47 方向边不能从静爻或化爻跨位产生")
            evid.append(put(f"edge:{u}:{v}:relation","direction",direction["relation"],
                            "V46","original_mover_to_original","双向五行关系"))
        if p["mutual_combine"]:
            evid.append(put(f"pair:{a}:{b}:combine","both_moving_combine",True,
                            "V46","unordered_mover_pair","两动爻六合候选（不判合绊）"))
        if p["mutual_clash"]:
            evid.append(put(f"pair:{a}:{b}:clash","both_moving_clash",True,
                            "V46","unordered_mover_pair","两动爻相冲"))
        if p["special"]["has_moving_tomb_candidate"]:
            evid.append(put(f"pair:{a}:{b}:tomb","moving_tomb",True,
                            "V46","unordered_mover_pair","本卦明动墓条件候选"))
        linked=[]
        for i,role in enumerate(p["focus_links"]):
            focus_pos=role["focus_position"]
            if role["yuan_ji_pair"]:
                key=f"pair:{a}:{b}:focus:{focus_pos}:yuan_ji"
                linked.append(put(key,"yuan_ji_both_moving",True,"V45/V46",
                                  "role_source_pair","原神、忌神同动来源并见；不能相减"))
                reviews.append({
                    "id":f"pair:{a}:{b}:focus:{focus_pos}:tension",
                    "positions":[a,b],"focus_position":focus_pos,
                    "title":"原忌同动，生扶与克制路径并见",
                    "evidence_ids":[key],
                    "priority":2,"actual_effectiveness":None,
                })
        pairs.append({"positions":[a,b],"evidence_ids":list(dict.fromkeys(evid+linked)),
                      "role_tension_count":len(linked),
                      "joint_effectiveness":None})
    # A single original observation can be read by both V44 and V46, but
    # appears exactly once in the canonical fact list.
    queue_by_id={}
    for item in pending+reviews:
        if item["id"] not in queue_by_id:queue_by_id[item["id"]]=item
    queue=sorted(queue_by_id.values(),key=lambda x:(x["priority"],x["id"]))
    chart["evidence_priority_audit"]={
        "version":"V47","status":"review_queue_ready",
        "facts":list(sources.values()),"fact_count":len(sources),
        "deduplicated_reference_count":duplicate_count,
        "rows":lines,"pairs":pairs,
        "review_queue":queue,
        "priority_semantics":{
            "0":"缺失输入待补齐",
            "1":"手动历法日期来源仍须核实",
            "2":"多条件并见，需要人工合参；不是强弱规则优先级",
        },
        "has_calendar_input":bool(chart["calendar"]["day"] and chart["calendar"]["month"]),
        "calendar_provenance_verified":(
            chart.get("calendar_provenance",{}).get("source")=="server_recomputed_calendar"),
        "auto_selects_yongshen":False,"has_final_void_decision":False,
        "effective_movement_computed":False,"fortune_conclusion":None,
        "timing_conclusion":None,"strength_conclusion":None,
        "boundary":"只按资料可验证性安排检查顺序；日月、动变、旬空与墓绝可同时成立，规则关系不自动互相覆盖。合绊、真空假空、用神强弱、应期和现实结果均未裁断。",
    }
    return chart
