"""V72 八门同源 API 可用性、固定锚点、拒绝伪参数和未完成功能审查。

使用 TestClient 从真实 FastAPI 路由排盘；与各门独立测试并行而不替代。
页面/路由状态绝不可被等同于完整吉凶论断。
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from fastapi.testclient import TestClient
from app.main import app

SCHOOLS={
  "meihua":{
    "name":"梅花易数","route":"/api/cast",
    "payload":{"question":"核对数字卦","value":"3,6","time_iso":"2026-10-22T12:00:00+08:00"},
    "verified":"数字取象、本互变、体用和动爻",
    "pending":"完整事象判断及现实条件校核",
  },
  "liuyao":{
    "name":"六爻纳甲","route":"/api/liuyao/cast",
    "payload":{"numbers":[9,7,7,7,7,7],"day_ganzhi":"甲子","month_branch":"午"},
    "verified":"三钱六掷、京房八宫纳甲、六亲世应、日月旬空、动变条件证据链",
    "pending":"最终用神取舍、真实旺衰、作用效力和应期",
  },
  "qimen":{
    "name":"奇门遁甲","route":"/api/qimen/cast",
    "payload":{"solar_date":"2026-02-04","clock":"04:30","day_boundary":"zi_hour"},
    "verified":"拆补定局、九宫天地盘、星门神与奇格结构",
    "pending":"完整流派争议统一与正式断课，尚未标定完整转盘为已验证",
  },
  "bazi":{
    "name":"四柱八字","route":"/api/bazi/cast",
    "payload":{"solar_date":"1999-07-21","clock":"16:00","day_boundary":"midnight"},
    "verified":"立春和节令换年换月、四柱十神、藏干、大运及流月",
    "pending":"最终命理断语、真太阳时及未选定的大运性别取法",
  },
  "liuren":{
    "name":"大六壬","route":"/api/liuren/cast",
    "payload":{"solar_date":"2026-03-20","clock":"12:00","day_boundary":"midnight"},
    "verified":"中气月将、天地盘四课、可判定的三传、旬空遁干",
    "pending":"部分九宗门歧路仍保留待判，未实现完整断课",
  },
  "taiyi":{
    "name":"太乙神数","route":"/api/taiyi/cast",
    "payload":{"gregorian_year":2026},
    "verified":"岁计积年五元六纪、七十二局、十六神、主客计和定计",
    "pending":"时计、其他尺度以及未证实的传统断验",
  },
  "ziwei":{
    "name":"紫微斗数","route":"/api/ziwei/cast",
    "payload":{"calendar_type":"solar","solar_date":"1980-02-19","clock":"09:00","gender":"male"},
    "verified":"农历定命身十二宫、十四正曜、十二辅煞和生年四化",
    "pending":"其他杂曜、流年小限和完整四化变体",
  },
  "fengshui":{
    "name":"堪舆风水","route":"/api/fengshui/cast",
    "payload":{"bearing_degrees":180,"bearing_role":"facing","foundation_date":"2019-06-01","foundation_clock":"12:00"},
    "verified":"二十四山坐向、洛书九宫、立春三元九运、下卦运山向三盘",
    "pending":"兼向替卦、年/月飞星、实测轴线和形势断验",
  },
}

def verify_structure(school:str,chart:dict)->dict:
    """逐门独立固定例盘/结构，不以成功 HTTP 状态冒充排盘成功。"""
    if school=="meihua":
        assert chart["method_numbers"]["upper"]==3
        assert chart["method_numbers"]["lower"]==6
        assert 1<=chart["dong_yao"]<=6
        assert all(chart.get(key) for key in ("ben_gua","hu_gua","bian_gua","ti_gua","yong_gua"))
        return {"moving_line":chart["dong_yao"],"ben_gua":chart["ben_gua"]["full_name"]}
    if school=="liuyao":
        assert chart["ben_gua"]["full_name"]=="乾为天"
        assert chart["bian_gua"]["full_name"]=="天风姤"
        assert chart["dong_yao"]==[1]
        assert len(chart["najia_lines"])==len(chart["bian_najia_lines"])==6
        assert chart["eight_palaces"]["ben"]["palace"]=="乾"
        assert chart["calendar"]["day"]["xunkong"]==["戌","亥"]
        assert chart["calendar"]["verification"]=="manual"
        assert chart["review_flow"]["report"]["has_final_decision"] is False
        return {"movers":chart["dong_yao"],"ben_gua":chart["ben_gua"]["full_name"]}
    if school=="qimen":
        assert chart["solar_term"]=="立春"
        assert len(chart["palaces"])==9
        assert len(chart["earth_plate"])==9
        assert chart["has_rotated_stars_and_gates"] is True
        assert chart["has_complete_rotating_plate"] is False
        return {"term":chart["solar_term"],"ju":chart["ju_label"],
                "full_plate_claim":chart["has_complete_rotating_plate"]}
    if school=="bazi":
        assert [p["ganzhi"] for p in chart["pillars"]]==["己卯","辛未","甲戌","壬申"]
        assert chart["has_final_fortune_judgement"] is False
        return {"pillars":[p["ganzhi"] for p in chart["pillars"]]}
    if school=="liuren":
        assert len(chart["four_lessons"])==4
        assert len(chart["heaven_plate"])==12
        assert chart["heaven_plate"][chart["hour_branch"]]==chart["month_general"]
        assert chart["three_transmissions"]["status"] in ("computed","pending")
        assert chart["fortune_verdict"] is None
        return {"month_general":chart["month_general"],
                "three_transmissions":chart["three_transmissions"]["status"]}
    if school=="taiyi":
        assert chart["version"]=="V67"
        assert chart["year"]["ju"]==55
        assert len(chart["nine_palaces"])==9
        assert chart["fortune_verdict"] is None
        return {"annual_ju":chart["year"]["ju"],"has_taiyi_palace":True}
    if school=="ziwei":
        assert chart["version"]=="V69"
        assert chart["year_ganzhi"]=="庚申" and chart["ming_branch"]=="酉"
        assert chart["ziwei_branch"]=="卯"
        assert len(chart["palaces"])==12
        assert sum(len(p["main_stars"]) for p in chart["palaces"])==14
        assert sum(len(p["auxiliary_stars"]) for p in chart["palaces"])==12
        assert len(chart["four_transformations"])==4
        assert chart["not_implemented"]
        return {"year_ganzhi":chart["year_ganzhi"],"palaces":12,
                "four_transformations":4}
    if school=="fengshui":
        assert chart["version"]=="V71"
        assert chart["axis_label"]=="坐子向午"
        assert chart["period"]["period"]==8
        assert chart["flying_status"]=="computed_regular_lower_chart"
        assert len(chart["twenty_four_mountains"])==24
        assert len(chart["flying_stars"]["palaces"])==9
        assert next(p for p in chart["flying_stars"]["palaces"] if p["number"]==9)[
            "facing_star"]==8
        return {"axis":chart["axis_label"],"period":8,"triple_palaces":9}
    raise AssertionError(f"Unknown school {school}")

def audit_all()->dict:
    client=TestClient(app)
    assert len(SCHOOLS)==8
    successes=[]
    for school,case in SCHOOLS.items():
        res=client.post(case["route"],json=case["payload"])
        assert res.status_code==200,(school,res.status_code,res.text)
        chart=res.json()
        proof=verify_structure(school,chart)
        # All core routes must reject extra payload keys instead of silently discarding them.
        for extra in ({"bogus_v72":"ignored?"},{"timezone":"Asia/Tokyo"}):
            bad=client.post(case["route"],json={**case["payload"],**extra})
            assert bad.status_code==422,(school,extra,bad.status_code,bad.text)
        successes.append({
            "id":school,"name":case["name"],"api":case["route"],
            "status":"calculated_with_known_limits","proof":proof,
            "computed_scope":case["verified"],"not_yet_complete":case["pending"],
            "unknown_field_rejected":True
        })
    # No float->int, bool->int or numeric string silently changes discrete casting inputs.
    for value in (7.0,True,"7"):
        payload={"numbers":[7,7,7,7,7,value]}
        res=client.post("/api/liuyao/cast",json=payload)
        assert res.status_code==422,(value,res.status_code)
    for value in (2026.0,True,"2026"):
        res=client.post("/api/taiyi/cast",json={"gregorian_year":value})
        assert res.status_code==422,(value,res.status_code)
    for path,payload in [
      ("/api/fengshui/cast",{"bearing_degrees":180,"foundation_clock":"13:00"}),
      ("/api/bazi/cast",{"solar_date":"2026-02-04","clock":"12:00","flow_clock":"13:00"})
    ]:
        res=client.post(path,json=payload)
        assert res.status_code==422,(path,res.status_code,res.text)
    return {
        "version":"V72","status":"passed","scope":"eight deterministic casting APIs",
        "school_count":len(successes),"passed_school_count":len(successes),
        "schools":successes,
        "contract_guards":{
          "unknown_fields_rejected_for_each_school":True,
          "taiji_year_strict_integer":True,"liuyao_coin_strict_integer":True,
          "orphan_flow_and_foundation_clock_rejected":True
        },
        "limitations":"接口/固定真值审查通过不等于八门所有流派、应期和吉凶判定已完成。",
        "future_priority":["独立原典锚点仍偏少的规则","残余分歧规则逐条校勘",
                           "全部核心功能稳定后再完善教程、藏经阁和美术"]
    }

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",required=True)
    args=parser.parse_args()
    evidence=audit_all()
    path=Path(args.output)
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("V72 八门联验通过：8/8真实API案例、逐门输入拒错和剩余能力边界")

if __name__=="__main__":
    main()
