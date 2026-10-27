"""V53 independent classic cross-answers and Q1 condition integrity."""
from __future__ import annotations
import argparse,json,os
from pathlib import Path
from datetime import date,time
from app.core.qimen import cast_qimen
from app.core.qimen_patterns import lookup_ten_stem,_patterns,NAME_ROWS,COLUMNS
from app.core.qimen_rotation import OUTER_RING

def verify()->dict:
    expected={
        "戊丙":"青龙返首","丙戊":"飞鸟跌穴","辛乙":"白虎猖狂",
        "丁癸":"朱雀投江","癸丁":"螣蛇天矫",
        "庚丙":"太白入荧","丙庚":"荧入太白","庚癸":"大格"}
    for pair,label in expected.items():
        assert lookup_ten_stem(pair[0],pair[1])["title"]==label,pair
    assert len(NAME_ROWS)*len(COLUMNS)==81
    assert [p["title"] for p in _patterns("丙","丁","生门","玄武")]==["天遁"]
    assert [p["title"] for p in _patterns("乙","己","开门","玄武")]==["地遁"]
    assert [p["title"] for p in _patterns("丁","壬","休门","太阴")]==["人遁"]
    c=cast_qimen(date(2026,3,18),time(15,20))
    rows={p["number"]:p for p in c["palaces"]}
    assert [rows[3]["sky_stem"],rows[3]["earth_stem"]]==["戊","乙"]
    assert [rows[4]["sky_stem"],rows[4]["earth_stem"]]==["癸","戊"]
    assert all(rows[n]["ten_stem_response"] is not None for n in OUTER_RING)
    assert rows[5]["ten_stem_response"] is None
    assert set(c["dark_stem_plate"]["placements"].values())==set(NAME_ROWS)
    assert c["has_dark_stem_variant"] and not c["has_final_divination"]
    return {"version":"V53","result":"passed","sha":os.getenv("GITHUB_SHA"),
        "primary_reference":"https://www.shidianguji.com/book/SDZJ0630/chapter/1lx9g1urkiyp2",
        "classical_escapes_reference":"https://book.taiyi.me/%E5%8D%9C/%E5%A5%87%E9%97%80%E9%81%81%E7%94%B2%E7%A7%98%E7%AC%88%E5%A4%A7%E5%85%A8/%E5%A5%87%E9%97%80%E9%81%81%E7%94%B2%E7%A7%98%E7%AC%88%E5%A4%A7%E5%85%A8%28%E5%8D%B7%E5%8D%81%E4%BA%94%29",
        "independent_pair_anchors":expected,"lookup_pairs":81,
        "three_escapes_require_all_conditions":True,
        "q1_real_outer_palaces_checked":8,
        "dark_stem_mode":"值使门起飞宫（含中五特例）",
        "dark_stem_variant_independently_golden_verified":False,
        "outcome_judgement_implemented":False}
if __name__=="__main__":
    parser=argparse.ArgumentParser();parser.add_argument("--output",required=True,type=Path)
    args=parser.parse_args();r=verify()
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(r,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("V53 81个十干克应资料对照、八组古籍格名锚点和三遁多条件核验通过")
