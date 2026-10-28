"""V70 二十四山全方位独立角度锚点、山界与磁偏角验收。"""
from __future__ import annotations
import argparse,json
from pathlib import Path
from app.core.fengshui import cast_fengshui

# 人工转录自独立二十四山区间表（非从内核派生）。
FIXTURES=[
 (0,"子","午","坎"),(15,"癸","丁","坎"),(30,"丑","未","艮"),
 (45,"艮","坤","艮"),(60,"寅","申","艮"),(75,"甲","庚","震"),
 (90,"卯","酉","震"),(105,"乙","辛","震"),(120,"辰","戌","巽"),
 (135,"巽","乾","巽"),(150,"巳","亥","巽"),(165,"丙","壬","离"),
 (180,"午","子","离"),(195,"丁","癸","离"),(210,"未","丑","坤"),
 (225,"坤","艮","坤"),(240,"申","寅","坤"),(255,"庚","甲","兑"),
 (270,"酉","卯","兑"),(285,"辛","乙","兑"),(300,"戌","辰","乾"),
 (315,"乾","巽","乾"),(330,"亥","巳","乾"),(345,"壬","丙","坎")
]
def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",required=True)
    args=parser.parse_args()
    results=[]
    for degrees,facing,sitting,gua in FIXTURES:
        board=cast_fengshui(degrees)
        assert (board["facing"]["mountain"],board["sitting"]["mountain"],
                board["facing"]["trigram"])==(facing,sitting,gua)
        assert not board["near_boundary"]
        results.append({"degree":degrees,"facing":facing,
                        "sitting":sitting,"facing_trigram":gua,"status":"passed"})
    boundary=cast_fengshui(7.5)
    assert boundary["near_boundary"] and boundary["facing"]["mountain"]=="癸"
    assert cast_fengshui(352.5)["facing"]["mountain"]=="子"
    magnetic=cast_fengshui(350,"facing","magnetic_north",5)
    assert (magnetic["true_bearing_degrees"],magnetic["axis_label"])==(355,"坐午向子")
    evidence={
      "version":"V70","status":"passed","fixture_count":len(results),
      "independent_sources":[
        "https://www.yuanka.com.cn/tools/luopan",
        "https://fengshui.tools/ja/free-luopan-calculator"],
      "cases":results,
      "wraparound":{"degree":352.5,"facing":"子"},
      "boundary":{"degree":7.5,"facing":"癸","near_boundary":True},
      "magnetic":{"measured":350,"declination_east_positive":5,"true_degrees":355,
                  "axis":"坐午向子"},
      "not_asserted":["真实房屋坐向","实际磁偏角来源","玄空飞星","风水吉凶"]
    }
    path=Path(args.output)
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"V70 独立24山锚点{len(results)}组、零度跨界、人工磁偏角换算验收通过。")
if __name__=="__main__":
    main()
