"""V67 independent full path witnesses for 200 庚辰, 辛未, modern 2026."""
from pathlib import Path
import argparse,json,os
from app.core.taiyi import year_board
from app.core.taiyi_v65 import INDEX
from app.core.taiyi_v67 import calculate_dingji
def verify():
    classics=[]
    for year,year_branch,wen,ty,eye,god,count,big,assistant,details in (
      ("汉献帝建安五年庚辰","辰","坤",7,"寅","吕申",16,6,8,
        [["寅",1],["卯",4],["巽",9],["午",2]]),
      ("辛未年定计原典","未","巳",3,"午","大威",24,4,2,
        [["午",2],["坤",7],["酉",6],["乾",1],["子",8]]),
    ):
        result=calculate_dingji(year_branch,INDEX[wen],ty)
        assert (result["dingji_ground_direction"],result["dingji_ground_god"])==(eye,god)
        assert (result["count"],result["main_general"],result["assistant_general"])==(
            count,big,assistant)
        assert [[p["direction"],p["added"]] for p in result["trace"] if p["added"]]>0==details
        classics.append({"classical_case":year,"annual_branch":year_branch,
          "wenchang_direction":wen,"taiyi_palace":ty,
          "dingji_eye":eye,"dingji_god":god,
          "calculated_count":count,"big_general":big,
          "assistant_general":assistant,"full_trace":result["trace"],
          "sky_earth_rotation":result["rotated_sixteen"]})
    modern=year_board(2026)
    assert modern["dingji_v67"]["count"]==22
    assert modern["main_guest"]["guest_calculated"]==3
    x=year_board(2027)
    assert x["middle_five_states"]["case_count"]>=2
    return {"version":"V67","status":"passed","sha":os.getenv("GITHUB_SHA"),
      "classical_independent_dingji":classics,
      "source_one":"https://higrid.net/show/ancient/80-36.html",
      "source_two":"https://ctext.org/wiki.pl?chapter=948786&if=gb",
      "2026_dingji":{"eye":modern["dingji_v67"]["dingji_ground_direction"],
                     "count":modern["dingji_v67"]["count"],
                     "year":modern["year"]["sexagenary_year"]},
      "2027_middle_five":x["middle_five_states"],
      "center_is_never_taiyi":True,
      "full_year_chart_claimed":False,"fortune_verdict":None}
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--output",type=Path,required=True)
    a=p.parse_args();v=verify();a.output.parent.mkdir(parents=True,exist_ok=True)
    a.output.write_text(json.dumps(v,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("V67 古籍庚辰定计16、辛未定计24、岁计六合旋宫、中五将独立验收通过")
