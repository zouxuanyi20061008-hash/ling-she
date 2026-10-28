"""V71 independent construction-period and 8th-period Zi-Wu three-plate fixtures."""
import argparse,json
from datetime import date,time
from pathlib import Path
from app.core.fengshui import cast_fengshui

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",required=True)
    args=parser.parse_args()
    chart=cast_fengshui(180,foundation_date=date(2019,6,1))
    # Independent published 8-period 子山午向 lower chart: research.xishe.ai/flying-stars
    assert chart["period"]["period"]==8
    assert chart["axis_label"]=="坐子向午"
    assert chart["flying_stars"]["mountain_trace"]["seed"]==4
    assert chart["flying_stars"]["mountain_trace"]["direction"]=="顺飞"
    assert chart["flying_stars"]["facing_trace"]["seed"]==3
    assert chart["flying_stars"]["facing_trace"]["direction"]=="逆飞"
    expected={
       4:(7,3,4),9:(3,8,8),2:(5,1,6),
       3:(6,2,5),5:(8,4,3),7:(1,6,1),
       8:(2,7,9),1:(4,9,7),6:(9,5,2)
    } # (period, mountain, facing), map as actual published matrix.
    rows=[]
    for palace in chart["flying_stars"]["palaces"]:
        n=palace["number"]
        actual=(palace["period_star"],palace["mountain_star"],palace["facing_star"])
        assert actual==expected[n],(n,actual,expected[n])
        rows.append({"number":n,"period_star":actual[0],"mountain_star":actual[1],"facing_star":actual[2]})
    before=cast_fengshui(180,foundation_date=date(2024,2,4),foundation_clock=time(16,0))
    after=cast_fengshui(180,foundation_date=date(2024,2,4),foundation_clock=time(17,0))
    assert before["period"]["period"]==8 and after["period"]["period"]==9
    near=cast_fengshui(187.5,foundation_date=date(2024,6,1))
    assert near["flying_stars"] is None and near["flying_status"]=="blocked_mountain_boundary"
    data={"version":"V71","status":"passed","period8_zi_wu":rows,
      "published_chart":"https://research.xishe.ai/flying-stars",
      "published_alt_chart":"https://profound.fate-craft.com/fengshui/feixing/8/zi-wu",
      "lichun_2024":{"before_2024_02_04_16":before["period"],
                     "after_2024_02_04_17":after["period"]},
      "boundary_blocked":near["flying_status"],
      "not_asserted":["替卦","形势吉凶","流年飞星"]}
    output=Path(args.output)
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("V71 独立八运子山午向9宫三盘、立春交运和山界拒绝验收通过")

if __name__=="__main__":
    main()
