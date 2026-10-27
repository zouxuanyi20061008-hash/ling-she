"""V51 fully independent sky/star/gate fixture check plus classical center scenarios."""
from __future__ import annotations
import argparse,json,os
from pathlib import Path
from app.core.qimen import _plate,cast_qimen
from app.core.qimen_rotation import rotate_qimen

# External Q1 fixture transcribed from https://www.guyujian.cn/learn/qimen/07
EXAMPLE={
 1:("丁","壬","天任","伤门"),2:("丙","辛","天柱","开门"),
 3:("乙","戊","天辅","景门"),4:("戊","癸","天英","死门"),
 6:("庚","丁","天蓬","生门"),7:("辛","庚","天心","休门"),
 8:("壬","乙","天冲","杜门"),9:("癸","丙","天芮","惊门"),
}


def run_acceptance()->dict:
    x=rotate_qimen(_plate("惊蛰","辛卯","丙申"))
    if x["ju_label"]!="阳遁4局":raise AssertionError("V51 示例局数不符")
    for p in x["palaces"]:
        if p["number"] in EXAMPLE:
            expected=EXAMPLE[p["number"]]
            actual=(p["earth_stem"],p["sky_stem"],p["actual_star"],p["actual_gate"])
            if actual!=expected:
                raise AssertionError(f"V51 宫位 {p['number']} expected={expected}, actual={actual}")
    if (x["duty_origin"]["rotated_star_palace"],
        x["duty_origin"]["rotated_door_palace"])!=(2,9):
        raise AssertionError("值符/值使独立参考落宫不符")
    y=rotate_qimen(_plate("芒种","癸亥","丙辰"))
    if (y["duty_origin"]["rotated_star_palace"],
        y["duty_origin"]["rotated_door_palace"])!=(7,7):
        raise AssertionError("V51 元灵经阳九源中五例不符")
    z=rotate_qimen(_plate("霜降","甲寅","辛未"))
    if (z["duty_origin"]["rotated_star_palace"],
        z["duty_origin"]["rotated_door_palace"])!=(5,1):
        raise AssertionError("V51 元灵经阴八目标中五例不符")
    if not (z["duty_origin"]["rotated_star_display_palace"]==2
            and z["has_rotated_stars_and_gates"]
            and z["has_complete_rotating_plate"] is False):
        raise AssertionError("V51 中五寄坤及完整性边界有误")
    return {"version":"V51","status":"passed","git_sha":os.getenv("GITHUB_SHA"),
        "independent_full_disc_reference":"https://www.guyujian.cn/learn/qimen/07",
        "classical_reference":"https://zh.wikisource.org/zh/奇門遁甲元靈經",
        "external_example":{"day":"辛卯","hour":"丙申","ju":"阳遁4局",
                            "star_target":2,"door_target":9,"validated_palaces":8},
        "classical_origin_center":{"star_target":7,"door_target":7},
        "classical_target_center":{"star_logical":5,"star_display":2,"door_target":1},
        "rotated_sky_and_gates":True,"eight_spirits_computed":False,
        "has_complete_rotating_plate":False,
        "unresolved":["八神真实落宫","暗干、空亡、马星和格局","历法临界流派差异与断课"]}
 

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",type=Path,required=True)
    args=parser.parse_args()
    report=run_acceptance()
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",
                           encoding="utf-8")
    print("V51 九星天盘干与八门动态转盘验收通过：公开整盘8宫+元灵经中五双锚点")
    print("验收 JSON："+str(args.output))
if __name__=="__main__":
    main()
