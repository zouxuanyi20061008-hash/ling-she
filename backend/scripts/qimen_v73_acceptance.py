"""V73 separate, independently sourced Q1 complete outer 4-layer fixed chart."""
import argparse,json
from pathlib import Path
from datetime import date,time
from app.core.qimen import cast_qimen

# Q1 actual 8 outer palace expected witness: https://www.guyujian.cn/learn/qimen/07
EXPECTED={
  1:("丁","壬","天任","伤门","六合"),
  2:("丙","辛","天柱","开门","值符"),
  3:("乙","戊","天辅","景门","玄武"),
  4:("戊","癸","天英","死门","九地"),
  6:("庚","丁","天蓬","生门","太阴"),
  7:("辛","庚","天心","休门","腾蛇"),
  8:("壬","乙","天冲","杜门","白虎"),
  9:("癸","丙","天芮","惊门","九天"),
}

def audit():
  chart=cast_qimen(date(2026,3,18),time(15,20))
  assert (chart["ju_label"],chart["yuan"],chart["hour_ganzhi"])==(
      "阳遁4局","下元","丙申")
  assert (chart["duty_origin"]["rotated_star_display_palace"],
          chart["duty_origin"]["rotated_door_display_palace"])==(2,9)
  data=[]
  for n in sorted(EXPECTED):
    p=next(z for z in chart["palaces"] if z["number"]==n)
    actual=(p["earth_stem"],p["sky_stem"],p["actual_star"],
            p["actual_gate"],p["actual_spirit"])
    assert actual==EXPECTED[n],(n,actual,EXPECTED[n])
    data.append({"palace":n,"earth_stem":actual[0],"sky_stem":actual[1],
                 "star":actual[2],"gate":actual[3],"spirit":actual[4],
                 "verified_against_independent_fixture":True})
  center=next(z for z in chart["palaces"] if z["number"]==5)
  assert (center["earth_stem"],center["sky_stem"],center["actual_gate"],
          center["actual_star"],center["actual_spirit"])==("己","己",None,None,None)
  assert next(z for z in chart["palaces"] if z["number"]==9)["attached_center_star"]=="天禽"
  assert chart["core_plate_audit"]["verification_count"]==33
  assert chart["core_plate_audit"]["has_complete_core_four_layers"] is True
  assert chart["has_complete_rotating_plate"] is False
  return {
    "version":"V73","status":"passed","date":"2026-03-18","clock":"15:20",
    "source":"https://www.guyujian.cn/learn/qimen/07",
    "palaces":data,"center":{"palace":5,"earth":"己","sky":"己",
                              "star":None,"gate":None,"spirit":None},
    "unverified_classical_dark_plate":True,
    "core_plate_checks":chart["core_plate_audit"],
    "not_a_fortune_verdict":True,
  }

if __name__=="__main__":
  parser=argparse.ArgumentParser()
  parser.add_argument("--output",required=True)
  args=parser.parse_args()
  evidence=audit()
  target=Path(args.output)
  target.parent.mkdir(parents=True,exist_ok=True)
  target.write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
  print("V73 Q1 外部整盘8外宫×5原始字段+中五天禽：核验通过")
