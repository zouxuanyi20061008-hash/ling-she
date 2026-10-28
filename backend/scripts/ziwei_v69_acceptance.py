"""V69 古籍独立星位、十干四化、壬年异文验收。"""
import argparse,json
from datetime import time
from pathlib import Path
from app.core.ziwei import cast_ziwei

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--output",required=True)
    args=p.parse_args()
    def cast(year,school="quanshu"):
        return cast_ziwei("lunar",None,year,1,4,False,time(9),"male","same_month",school)
    geng=cast(1980)
    ren=cast(1992)
    alt=cast(1992,"common")
    assert (geng["calendar"]["solar_date"],geng["year_ganzhi"])==("1980-02-19","庚申")
    assert geng["auxiliary_star_positions"]=={
      "左辅":"辰","右弼":"戌","文昌":"巳","文曲":"酉",
      "禄存":"申","天魁":"丑","天钺":"未","天马":"寅",
      "擎羊":"酉","陀罗":"未","地劫":"辰","地空":"午"}
    assert [(x["star"],x["branch"]) for x in geng["four_transformations"]]==[
      ("太阳","子"),("武曲","亥"),("太阴","寅"),("天同","戌")]
    assert ren["four_transformations"][2]["star"]=="天府"
    assert alt["four_transformations"][2]["star"]=="左辅"
    assert ren["all_star_positions"]==alt["all_star_positions"]
    data={
      "version":"V69","status":"passed",
      "ancient_primary_source":"https://wk.100ke.info/zh/紫微斗數全書/卷二",
      "modern_comparison_source":"https://fortunecloud.co/zh-cn/learn/four-transformations",
      "fixtures":{
        "1980_gengshen":{"lunar":"正月初四巳时","auxiliary_star_positions":geng["auxiliary_star_positions"],
          "four_transformations":geng["four_transformations"]},
        "1992_ren_shen":{"quanshu":ren["four_transformations"],
          "common":alt["four_transformations"],
          "disagreement":ren["four_transform_disagreement"]}},
      "not_implemented":geng["not_implemented"],
    }
    path=Path(args.output)
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("V69 独立安星与双口径检验通过：庚申固定辅煞及四化、壬申科星异文")

if __name__=="__main__":
    main()
