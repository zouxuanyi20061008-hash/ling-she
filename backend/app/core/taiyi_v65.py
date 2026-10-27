"""V65 太乙岁计文昌、始击与主客投算。

原典依《太乙金镜式经》卷二与《太乙金钥匙》：
  文昌：申位武德为岁计阳遁起点，沿十六神顺数，乾阴德和坤大武重留，
        十八算一周；
  始击：计神加艮和德，读取文昌所临之下，十六位旋转位移；
  投算：从文昌、始击起逐宫正宫累算，间位作为起点作1算，
        遇到太乙本宫即停止（该宫不计）；
  大将：满十去之用零，十/二十/三十取1/2/3；
  参将：大将三因同样去十用零。

当文昌/始击本身与太乙同宫时，是否依特殊掩/囚法起算存在
待校勘口径，V65 不虚构 0、全周算或应期，返回该方 pending。
"""
from __future__ import annotations

DIRECTIONS=("子","丑","艮","寅","卯","辰","巽","巳",
            "午","未","坤","申","酉","戌","乾","亥")
GODS=("地主","阳德","和德","吕申","高丛","太阳","大炅","大神",
      "大威","天道","大武","武德","太簇","阴主","阴德","大义")
GONG={"子":8,"艮":3,"卯":4,"巽":9,"午":2,"坤":7,"酉":6,"乾":1}
INDEX={name:i for i,name in enumerate(DIRECTIONS)}
GOD_INDEX={name:i for i,name in enumerate(GODS)}
SOURCES={
 "sequence":"https://www.shidianguji.com/zh/book/SK1390/chapter/1l94vald3plie",
 "wenchang":"https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkylq3yn8",
 "shiji":"https://www.shidianguji.com/zh/book/SK1615/chapter/1l9lir7w2mwii",
 "calculation":"https://www.shidianguji.com/mid-page/7524449811795148827",
 "main_guest":"https://ctext.org/wiki.pl?chapter=275091&if=gb",
}
WENCHANG_SEQUENCE=tuple(
    x for step in range(16)
    for x in ([INDEX[DIRECTIONS[(INDEX["申"]+step)%16]]]*
              (2 if DIRECTIONS[(INDEX["申"]+step)%16] in ("乾","坤") else 1))
)
if len(WENCHANG_SEQUENCE)!=18 or len(set(WENCHANG_SEQUENCE))!=16:
    raise ValueError("岁计文昌十八算十六神周法不闭合")


def _position(n:int)->dict:
    return {"index":n,"direction":DIRECTIONS[n],"god":GODS[n],
            "palace":GONG.get(DIRECTIONS[n]),
            "is_intermediate":DIRECTIONS[n] not in GONG}


def wenchang_from_accumulated(accum:int)->dict:
    if isinstance(accum,bool) or not isinstance(accum,int) or accum<=0:
        raise ValueError("文昌起算必须有正整数积年")
    remainder=(accum-1)%18
    n=WENCHANG_SEQUENCE[remainder]
    path=[{**_position(WENCHANG_SEQUENCE[i]),
           "count":i+1,"double_stay":i>0 and WENCHANG_SEQUENCE[i]==WENCHANG_SEQUENCE[i-1]}
          for i in range(remainder+1)]
    return {**_position(n),"count_in_18":remainder+1,
            "cycle_number":(accum-1)//18+1,
            "trace":path,
            "double_stay_places":["乾","坤"],
            "sequence_start":"申·武德"}


def shiji_from_wenchang(wenchang_index:int,jishen:str)->dict:
    if wenchang_index not in range(16) or jishen not in INDEX:
        raise ValueError("始击十六神位与计神必须有效")
    n=(wenchang_index+INDEX["艮"]-INDEX[jishen])%16
    return {**_position(n),
        "formula":"(文昌位 + 艮和德位 - 计神位) mod 16",
        "wenchang_index":wenchang_index,
        "hude_index":INDEX["艮"],
        "jishen_index":INDEX[jishen],
        "jishen_direction":jishen,
        "manual_rotation":False}


def trace_count(from_index:int,taiyi_palace:int)->dict:
    if from_index not in range(16) or taiyi_palace not in GONG.values():
        raise ValueError("主客投算须有真实十六神及八宫太乙位")
    stop=next(i for i,way in enumerate(DIRECTIONS) if GONG.get(way)==taiyi_palace)
    if from_index==stop:
        return {"status":"pending","count":None,"trace":[],
                "reason":"起算目与太乙同宫：默认逐宫停算法不自动定算。另列《武备志》同宫取本宫宫数的古籍变法。",
                "same_palace_as_taiyi":True,
                "stop_palace":taiyi_palace,
                "stop_direction":DIRECTIONS[stop],
                "historical_alternative":{
                    "school":"《武备志》卷一百六十九",
                    "source":"https://www.shidianguji.com/book/CADAL02092259/chapter/1lb3wzm7f2qzs",
                    "rule":"文昌/始击与太乙同宫时直接按该宫宫数取算",
                    "calculated_count":taiyi_palace,
                    "main_general":taiyi_palace,
                    "assistant_general":(taiyi_palace*3)%10 or (taiyi_palace*3)//10,
                    "is_default":False,
                }}
    trace=[]
    for offset in range(16):
        n=(from_index+offset)%16
        if n==stop:break
        pos=_position(n)
        amount=pos["palace"] if pos["palace"] is not None else (1 if offset==0 else 0)
        trace.append({**pos,"order":offset+1,"added":amount,
                      "why":("起于间神作一算" if offset==0 and pos["is_intermediate"]
                             else "正宫依宫数累算" if pos["palace"] else "经过间神不累加")})
    else:raise ValueError("十六神顺行未在太乙宫停算")
    total=sum(p["added"] for p in trace)
    if total<=0:raise ValueError("太乙投算不得在尚未确认时返回零")
    return {"status":"computed","count":total,"trace":trace,
            "stop_direction":DIRECTIONS[stop],"stop_palace":taiyi_palace,
            "same_palace_as_taiyi":False,
            "trace_complete":True,
            "stop_excluded":True}


def _general_from_count(num:int)->int:
    if not isinstance(num,int) or num<=0:raise ValueError("大将宫只能从正整数算得")
    return num%10 or num//10


def _count_result(position:dict,palace:int)->dict:
    t=trace_count(position["index"],palace)
    if t["status"]!="computed":
        return {**t,"main_general":None,"assistant_general":None,
                "general_status":"pending"}
    n=t["count"]
    general=_general_from_count(n)
    assistant=_general_from_count(general*3)
    if not 1<=general<=9 or not 1<=assistant<=9:
        raise ValueError("主客将迁宫非太乙九宫")
    return {**t,"main_general":general,"assistant_general":assistant,
            "general_status":"computed",
            "general_rule":"主客算去十用零；参将为大将宫三因后去十用零"}


def decorate_taiyi_v65(board:dict)->dict:
    if board.get("version")!="V64" or board.get("calculation")!="岁计":
        raise ValueError("V65 必须由 V64 原始岁计盘衍算")
    annual=board["year"]
    wen=wenchang_from_accumulated(annual["accumulated_years"])
    shi=shiji_from_wenchang(wen["index"],annual["jishen"])
    p=annual["taiyi_palace"]["number"]
    main=_count_result(wen,p)
    guest=_count_result(shi,p)
    old=board["main_guest"]
    attested=old.get("source_if_attested")
    if attested is not None:
        if (wen["god"],shi["god"],main["count"],guest["count"])!=(
                attested["main_eye"],attested["guest_eye"],
                attested["main_count"],attested["guest_count"]):
            raise ValueError("V65 与古籍1561/1624独立例盘不一致")
        for field,calculated in (("main_general_palace",main["main_general"]),
                                 ("guest_general_palace",guest["main_general"])):
            if field in attested and attested[field]!=calculated:
                raise ValueError("V65 原典主客大将所在宫不一致")
    status=("computed" if main["status"]==guest["status"]=="computed"
            else "partially_computed" if "computed" in (main["status"],guest["status"])
            else "pending")
    main_guest={
        "status":status,
        "source_if_attested":attested,
        "heaven_eye_wenchang":wen,
        "earth_eye_shiji":shi,
        "main_calculated":main["count"],
        "guest_calculated":guest["count"],
        "main_general":main,
        "guest_general":guest,
        "main_guest_generals_computed":status=="computed",
        "verified_by_independent_ancient_case":attested is not None,
        "reason":("文昌、始击、主算、客算及大小将均已实算，路径可逐位复核。" if status=="computed"
                  else "起算目与太乙同宫，特殊掩/囚取算尚未完成；另一方可以独立实算，不杜撰缺失结果。"),
        "next":"V66 完成与太乙同宫专法及不同古籍主客临位交叉校验。",
        "sources":SOURCES,
        "uncertain_same_palace":any(x["same_palace_as_taiyi"] for x in (main,guest)),
    }
    for palace in board["nine_palaces"]:
        palace["wenchang_here"]=wen["palace"]==palace["number"]
        palace["shiji_here"]=shi["palace"]==palace["number"]
        palace["main_general_here"]=main["main_general"]==palace["number"]
        palace["guest_general_here"]=guest["main_general"]==palace["number"]
    board["sixteen_spirits"]=[
        {**_position(i),"has_wenchang":i==wen["index"],
         "has_shiji":i==shi["index"],
         "has_jishen":DIRECTIONS[i]==annual["jishen"]}
        for i in range(16)]
    board["main_guest"]=main_guest
    board["has_complete_main_guest"]=status=="computed"
    board["has_full_annual_chart"]=False
    board["version"]="V65"
    board["warnings"]=[
        "V65 岁计文昌按十八年一周（乾坤重留），始击以计神加和德求文昌下临位。",
        "正宫以宫数累加，间神仅起算作一，遇太乙宫即停且太乙本宫不计入；保留全部逐宫算式。",
        "文昌/始击与太乙同宫时属于特殊掩/囚边界；未经独立古籍验收，此方暂不计算。",
        "主客将是传统结构符号，不推出真实战争、人物财富健康与吉凶结果；月日时计和其他神仍未完成。",
    ]
    return board
