"""V49 verifiable fixed classic cases, intentionally independent from generated snapshots.

The JSON fixture is manually transcribed from a cited primary-text chapter.
No expected field is generated from the app under test.
"""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path

from app.core.liuyao import cast_six_yao

ROOT=Path(__file__).resolve().parents[1]
FIXTURES=ROOT/"fixtures"/"liuyao_classic_cases_v49.json"


def run_classical_examples(path:Path=FIXTURES)->dict:
    data=json.loads(path.read_text(encoding="utf-8"))
    if data["version"]!="V49" or not data["cases"]:
        raise AssertionError("V49 需要版本化且非空的独立古籍真值集")
    seen=set()
    results=[]
    for case in data["cases"]:
        name=case["id"]
        if name in seen:raise AssertionError("V49 卦例 ID 不可重复")
        seen.add(name)
        request=case["input"]
        expected=case["expected"]
        chart=cast_six_yao(request["numbers"],focus_liuqin=request["focus_liuqin"])
        def check(actual,wanted,label):
            if actual!=wanted:
                raise AssertionError(f"{name}: {label}: {actual!r} != {wanted!r}")
        check(chart["ben_gua"]["full_name"],expected["ben_gua"],"本卦")
        pal=chart["eight_palaces"]["ben"]
        check(pal["palace"],expected["palace"],"八宫")
        check(pal["stage"],expected["stage"],"世次")
        check(pal["shi_position"],expected["shi"],"世爻")
        check(pal["ying_position"],expected["ying"],"应爻")
        check([line["ganzhi"] for line in chart["najia_lines"]],
              expected["najia_ganzhi"],"完整纳甲")
        check([line["liuqin"] for line in chart["najia_lines"]],
              expected["liuqin"],"六亲")
        check(chart["focus_decision"]["status"],expected["focus_status"],"取用状态")
        hidden=chart["fushen"]["selected"]
        check(hidden["status"],"hidden_in_palace","本宫寻伏")
        checks=[]
        for e in hidden["entries"]:
            checks.append({
                "position":e["position"],
                "hidden_ganzhi":e["hidden"]["ganzhi"],
                "hidden_liuqin":e["hidden"]["liuqin"],
                "flying_ganzhi":e["flying"]["ganzhi"],
                "flying_liuqin":e["flying"]["liuqin"],
                "flying_hidden_relation":e["flying_hidden_relation"],
            })
        check(checks,expected["hidden"],"飞伏同位与关系")
        review=chart["hidden_condition_review"]
        check(review["version"],"V49","飞伏条件审议版本")
        check(len(review["rows"]),len(expected["hidden"]),"伏神条件候选")
        for entry in review["rows"]:
            check(entry["hidden_void"],None,"古籍无日辰不补造旬空")
            check(entry["hidden_month_break"],None,"古籍无月建不补造月破")
            check(entry["actual_hidden_available"],None,"不得挪用古籍吉凶为实效")
            check(entry["hidden_chosen_as_yongshen"],False,"不得代求测者自动取用")
        results.append({"id":name,"result":"passed","kind":"independent_primary_text_fixture"})
    return {
        "version":"V49","status":"passed","fixture_path":str(path.relative_to(ROOT)),
        "source_title":data["source_title"],"source_url":data["source_url"],
        "git_sha":os.environ.get("GITHUB_SHA"),
        "case_count":len(results),"cases":results,
        "scope":"原典载卦象六爻、飞伏同位、五行生克关系；原典未给此两例实际占日，故日月空破保留未知",
        "not_asserted":["伏神实际是否透出","旺衰、空破实际效力","现实吉凶和应期"],
    }


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--output",required=True,type=Path)
    args=p.parse_args()
    report=run_classical_examples()
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("V49 古籍独立卦例核验通过：%s条，出处：%s"%(report["case_count"],report["source_title"]))
    print("验收 JSON："+str(args.output))


if __name__=="__main__":
    main()
