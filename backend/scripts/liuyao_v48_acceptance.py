"""V48 六爻端到端确定性验收；生成可供 GitHub Actions 下载的 JSON 清单。

校验 64 种原卦 × 7 种动爻数量，并在一组原卦上遍历全部 64 个动爻掩码。
此验收不代表古籍争议已解决，也不意味着真空假空、最终旺衰、应期已实现。
"""
from __future__ import annotations

import argparse
from datetime import date, time
from itertools import product
import json
import os
from pathlib import Path

from app.core.calendar import OPPOSITES
from app.core.hexagrams import TRIGRAMS, HEXAGRAM_NAMES
from app.core.liuyao import cast_six_yao
from app.core.najia import NAJIA, PALACE_BY_LINES, relation_to_palace
from app.core.solar_calendar import preview_solar_calendar


def _ensure(value:bool,case:str,message:str)->None:
    if not value:
        raise AssertionError(f"V48 {case}: {message}")


def _cast_check(bits:tuple[int,...],moving_positions:set[int],case:str)->dict:
    numbers=[(9 if bit else 6) if i in moving_positions else (7 if bit else 8)
             for i,bit in enumerate(bits,1)]
    chart=cast_six_yao(numbers,"甲子","辰","世爻")
    positions=sorted(moving_positions)
    changed=tuple(1-bit if i in moving_positions else bit for i,bit in enumerate(bits,1))
    moving_count=len(positions)
    _ensure(chart["school"]=="六爻纳甲",case,"术数标识错误")
    _ensure(chart["ben_gua"]["lines_bottom_to_top"]==list(bits),case,"本卦阴阳爻错位")
    _ensure(chart["bian_gua"]["lines_bottom_to_top"]==list(changed),case,"变卦动变不符")
    _ensure(chart["dong_yao"]==positions,case,"动爻索引不从初爻往上")
    _ensure(len(chart["lines"])==6,case,"必须六次掷钱记录")
    lo=next(k for k,v in TRIGRAMS.items() if v["lines"]==bits[:3])
    hi=next(k for k,v in TRIGRAMS.items() if v["lines"]==bits[3:])
    _ensure(chart["ben_gua"]["name"]==HEXAGRAM_NAMES[hi-1][lo-1],
            case,"六十四卦本卦名称与上下卦表不一致")
    palace=PALACE_BY_LINES[bits]
    installed=chart["eight_palaces"]["ben"]
    _ensure(all(installed[k]==palace[k] for k in
                ("palace","order","stage","shi_position","ying_position","palace_element")),
            case,"八宫世应本卦归属不正确")
    lines=chart["najia_lines"]
    changed_lines=chart["bian_najia_lines"]
    _ensure(len(lines)==len(changed_lines)==6,case,"纳甲未覆盖六个爻位")
    expected_najia=NAJIA[lo]["inner"]+NAJIA[hi]["outer"]
    for pos,(orig,bian) in enumerate(zip(lines,changed_lines),1):
        _ensure(orig["position"]==bian["position"]==pos,case,"纳甲爻位未按初上排列")
        _ensure(orig["ganzhi"]==expected_najia[pos-1],case,"纳甲干支与内外卦查表不同")
        _ensure(orig["liuqin"]==relation_to_palace(installed["palace_element"],orig["element"]),
                case,"六亲未采用本卦八宫五行")
        _ensure(orig["role"]==(
            "世" if pos==palace["shi_position"] else
            "应" if pos==palace["ying_position"] else ""),case,"世应标记错位")
        moving=pos in moving_positions
        _ensure(orig["moving"]==bian["moving"]==moving,case,"真实动爻标识不一致")
        _ensure(orig["is_xunkong"]==(orig["branch"] in ("戌","亥")),
                case,"甲子日旬空应为戌亥")
        _ensure(orig["month_break_marker"]==(orig["branch"]==OPPOSITES["辰"]),
                case,"辰月月冲应为戌")
        cross=chart["cross_condition_audit"]["rows"][pos-1]
        _ensure((cross["actual_change"] is not None)==moving,case,"静爻被当成本位化爻")
        if moving:
            _ensure(cross["actual_change"]["ganzhi"]==bian["ganzhi"],case,"本位化爻干支不一致")
            _ensure(orig["turnback"] is not None,case,"真实明动缺失回头关系")
        else:
            _ensure(orig["turnback"] is None,case,"静爻不应生出回头作用")
    _ensure(len(chart["moving_influences"]["edges"])==5*moving_count,
            case,"明动跨位作用边数量不对")
    _ensure(chart["multi_mover_audit"]["pair_count"]==moving_count*(moving_count-1)//2,
            case,"两两动爻组合数量不对")
    _ensure(chart["multi_mover_audit"]["moving_positions"]==positions,
            case,"多动爻基础位置不符")
    audit=chart["evidence_priority_audit"]
    _ensure(audit["fact_count"]==len({f["id"] for f in audit["facts"]}),
            case,"同一证据重复计算")
    _ensure(all(f["effective"] is None for f in audit["facts"]),
            case,"将条件事实误当实际生克效力")
    _ensure([s["id"] for s in chart["review_flow"]["stages"]]==[
        "calendar","focus","relations","conflicts","report"
    ],case,"六爻研究五步流程不完整")
    _ensure(chart["focus_decision"]["selected_position"] is None and
            len(chart["focus_decision"]["candidates"])==1,
            case,"程序擅自选择世爻以外的用神")
    _ensure(chart["review_flow"]["report"]["conclusion"] is None and
            chart["evidence_priority_audit"]["strength_conclusion"] is None and
            not chart["temporal_review"]["has_timing_prediction"],
            case,"尚未实现的结论被自动生成")
    return chart


def _golden_cases()->list[str]:
    anchors=[]
    qian=cast_six_yao([7]*6,"甲子","辰","父母",6)
    _ensure(qian["ben_gua"]["full_name"]=="乾为天","golden:qian","纯乾卦名")
    _ensure([x["position"] for x in qian["focus_decision"]["candidates"]]==[3,6],
            "golden:double","父母两现必须都保留")
    _ensure(qian["focus_decision"]["selected_position"]==6 and
            qian["focus_decision"]["selection_origin"]=="user_explicit",
            "golden:double","只能采纳用户自己选定的主爻")
    sixth=qian["cross_condition_audit"]["rows"][5]["computed"]
    _ensure(sixth["original_void"] is True and sixth["original_month_clash"] is True,
            "golden:void_break","旬空月冲交叉证据缺失")
    anchors.append("乾为天父母两现、指定六爻、甲子旬空和辰月冲")
    kun=cast_six_yao([6]*6)
    _ensure(kun["ben_gua"]["full_name"]=="坤为地" and
            kun["bian_gua"]["full_name"]=="乾为天" and len(kun["dong_yao"])==6,
            "golden:kun","六老阴全部变化")
    anchors.append("六老阴由坤变乾")
    gou=cast_six_yao([8,7,7,7,7,7],"甲子","辰","妻财")
    item=gou["fushen"]["selected"]["entries"][0]
    _ensure(gou["focus_decision"]["status"]=="not_visible" and
            item["position"]==2 and item["hidden"]["ganzhi"]=="甲寅" and
            item["flying"]["ganzhi"]=="辛亥",
            "golden:missing","天风姤飞伏案例不符")
    _ensure(gou["spirit_action_audit"]["candidates"]==[],
            "golden:missing","不能伪造伏神明动来源")
    anchors.append("天风姤妻财不现，飞伏神为二爻甲寅伏辛亥")
    all_moving=cast_six_yao([9]*6,"甲子","辰","父母",3)
    active=all_moving["spirit_action_audit"]["candidates"][0]
    _ensure(active["active_direct_positions"]=={"原神":[4],"忌神":[2]},
            "golden:roles","真实原忌同动来源错误")
    _ensure(len(active["two_hop_paths"])==2 and
            all_moving["multi_mover_audit"]["pair_count"]==15,
            "golden:roles","仇神双段或六爻全动组合缺失")
    anchors.append("六老阳全部发动、原忌同动、仇神双段结构和15对动爻")
    before=preview_solar_calendar(date(2026,2,4),time(3,30))
    after=preview_solar_calendar(date(2026,2,4),time(4,30))
    _ensure(before["month_branch"]=="丑" and after["month_branch"]=="寅",
            "golden:lichun","立春交节前后月建不得混同农历月份")
    _ensure(before["day_ganzhi"]==after["day_ganzhi"],
            "golden:lichun","同一日交节不应自动换日")
    late_midnight=preview_solar_calendar(date(2026,2,4),time(23,30),
                                           day_boundary="midnight")
    late_zi=preview_solar_calendar(date(2026,2,4),time(23,30),
                                     day_boundary="zi_hour")
    _ensure(late_midnight["day_ganzhi"]!=late_zi["day_ganzhi"],
            "golden:day","子时与午夜换日约定未被区分")
    anchors.append("2026-02-04立春前后月建、子时与午夜换日")
    missing=cast_six_yao([7]*6)
    _ensure(missing["calendar"]["day"] is None and
            missing["calendar"]["month"] is None and
            all(r["computed"]["original_void"] is None for r in
                missing["cross_condition_audit"]["rows"]),
            "golden:missing-calendar","缺失日月不能冒出确认旬空")
    anchors.append("未提供日月参数时保持未知")
    return anchors


def run_acceptance()->dict:
    names=set()
    mask_counts={str(i):0 for i in range(7)}
    cases=0
    trigram_numbers=list(TRIGRAMS)
    for low,high in product(trigram_numbers,repeat=2):
        bits=TRIGRAMS[low]["lines"]+TRIGRAMS[high]["lines"]
        for count in range(7):
            movers=set(range(1,count+1))
            label=f"upper={high},lower={low},moving={count}"
            result=_cast_check(bits,movers,label)
            names.add(result["ben_gua"]["name"])
            mask_counts[str(count)]+=1
            cases+=1
    _ensure(len(names)==64,"matrix","必须完整覆盖64种本卦")
    first=TRIGRAMS[1]["lines"]*2
    for mask in range(64):
        selected={i+1 for i in range(6) if mask&(1<<i)}
        _cast_check(first,selected,f"all-mask:{mask:06b}")
    anchors=_golden_cases()
    return {
        "version":"V48","result":"passed",
        "git_sha":os.environ.get("GITHUB_SHA"),
        "matrix":{"hexagrams":len(names),"moving_counts":list(range(7)),
                  "casts":cases,"per_moving_count":mask_counts,
                  "all_moving_masks_on_qian":64,"total_matrix_casts":cases+64},
        "golden_cases":anchors,
        "acceptance_basis":"同一卦由输入、八宫纳甲、日月空破、动变、真实作用边、五步报告的跨模块一致性",
        "not_implemented":[
            "真实效力和完整用神旺衰、自动取用取舍",
            "真假空、出空、冲实、合绊、入墓等最终判定",
            "现实吉凶和实际应期判断",
        ],
        "limitations":[
            "通过的是已编程规则之间的一致性，不是所有流派古籍规则的独立学术认证。",
            "除固定卦例外，排列组合验证并不证明每条断卦规则都正确或最终效力已实现。",
            "其它术数门类需要分别进行类似核心功能验收。",
        ],
    }


def main()->None:
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",type=Path,required=True,
                        help="GitHub Actions artifact JSON path")
    args=parser.parse_args()
    output=run_acceptance()
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(output,ensure_ascii=False,indent=2)+"\n",
                           encoding="utf-8")
    print("V48 六爻端到端验收通过："+
          str(output["matrix"]["hexagrams"])+"卦 × 7档动爻数量 = "+
          str(output["matrix"]["casts"])+"盘；另测64种动爻掩码；"+
          str(len(output["golden_cases"]))+"项固定锚点")
    print("验收 JSON: "+str(args.output))


if __name__=="__main__":
    main()
