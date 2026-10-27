"""V64 太乙神数岁计阳遁：古籍积年、五元六纪、七十二局、八宫三年。

独立校核《钦定古今图书集成·艺术典》天启四年甲子、
《太乙金钥匙》嘉靖四十年辛酉。古本积年有不同元系，
明确采用上述两例相互吻合的 10155541@1624 系列。

注意：太乙式1=乾、2=离、3=艮、4=震、6=兑、7=坤、
8=坎、9=巽，不是洛书九宫数字所代表的传统方位。
岁计阳遁与以冬至夏至分阴阳的时计不可混算。V64
尚未完成文昌天目和始击在十六神盘的计算，不杜撰主客算。
"""
from __future__ import annotations

from .calendar import BRANCHES,SIXTY_DAYS

YEAR_ANCHOR=1624
ANCIENT_ACCUMULATED=10155541
YEAR_MIN,YEAR_MAX=1901,2099  # consistent with site's public calendar bounds
YEARLY_RING=((1,"乾","西北"),(2,"离","南"),
             (3,"艮","东北"),(4,"震","东"),
             (6,"兑","西"),(7,"坤","西南"),
             (8,"坎","北"),(9,"巽","东南"))
PALACES={n:{"number":n,"trigram":g,"direction":d} for n,g,d in YEARLY_RING}
PALACES[5]={"number":5,"trigram":"中","direction":"中央"}
YUAN_NAMES=("甲子元","丙子元","戊子元","庚子元","壬子元")
TENURE=("理天","理地","理人")
SOURCES={
 "historical_1624":"https://zh.wikisource.org/wiki/%E6%AC%BD%E5%AE%9A%E5%8F%A4%E4%BB%8A%E5%9C%96%E6%9B%B8%E9%9B%86%E6%88%90/%E5%8D%9A%E7%89%A9%E5%BD%99%E7%B7%A8/%E8%97%9D%E8%A1%93%E5%85%B8/%E7%AC%AC688%E5%8D%B7",
 "historical_1561":"https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkylq3yn8",
 "rule":"https://libokang.com/classics/taiyi/%E5%A4%AA%E4%B9%99%E9%87%91%E9%95%9C%E5%BC%8F%E7%BB%8F/",
}

def year_board(gregorian_year:int, *, historical:bool=False)->dict:
    """Pure mathematical ages with explicit epoch lineage; historical fixture option."""
    if isinstance(gregorian_year,bool) or not isinstance(gregorian_year,int):
        raise ValueError("年计必须是整数公历年")
    if not (1<=gregorian_year<=9999) or (not historical and not YEAR_MIN<=gregorian_year<=YEAR_MAX):
        raise ValueError("V64 年计公共接口仅支持公历1901至2099年")
    accum=ANCIENT_ACCUMULATED+(gregorian_year-YEAR_ANCHOR)
    if accum<=0:raise ValueError("古籍积年不能是负值")
    x=(accum-1)%360  # 古籍第一算为甲子元第一局，整除边界仍在前元72局
    cycle_round=(accum-1)//360+1
    cycle_index=x+1
    yuan=(x//72)+1
    ju=(x%72)+1
    cycle_in_sixty=((accum-1)%60)
    sexagenary=SIXTY_DAYS[cycle_in_sixty]
    step=(ju-1)//3
    ring_index=step%8
    palace_num=YEARLY_RING[ring_index][0]
    tenure=TENURE[(ju-1)%3]
    # 计神法另用纪法六十，命起寅逆行十二支，首年在寅。
    deity=BRANCHES[(BRANCHES.index("寅")-cycle_in_sixty)%12]
    if not (1<=ju<=72 and 1<=yuan<=5 and palace_num!=5):
        raise ValueError("古籍五元七十二局循环验算失败")
    for n in range(1,25):
        if YEARLY_RING[((n-1)//3)%8][0] not in PALACES:
            raise ValueError("年计二十四局八宫规则未闭合")
    nine=[
        {"number":p,"trigram":PALACES[p]["trigram"],
         "direction":PALACES[p]["direction"],
         "is_taiyi":p==palace_num,
         "is_center_unoccupied":p==5,
         "is_western_lo_shu_number":False}
        for p in (9,2,7,4,5,6,3,8,1)
    ]
    annual={
        "gregorian_year":gregorian_year,
        "accumulated_years":accum,
        "anchor_year":YEAR_ANCHOR,
        "anchor_accumulated":ANCIENT_ACCUMULATED,
        "historical_epoch":"《古今图书集成》1624 年积年系（对应《太乙金钥匙》1561 年数据）",
        "full_360_year_cycles":cycle_round-1,
        "in_cycle_number":cycle_index,
        "five_yuan_number":yuan,
        "five_yuan_name":YUAN_NAMES[yuan-1],
        "ju":ju,
        "ju_label":f"阳遁{ju}局",
        "sixty_ji_number":cycle_in_sixty//60+1,
        "sexagenary_year":sexagenary,
        "period_in_72":(ju-1)//24+1,
        "three_year_cycle":(ju-1)//3+1,
        "year_of_palace":(ju-1)%3+1,
        "year_governing":tenure,
        "direction":"阳遁",
        "direction_reason":"岁计固定按阳遁八宫轮次；不把冬夏二至时计误当岁计",
        "taiyi_palace":{**PALACES[palace_num],"ring_index":ring_index+1},
        "noble_general":"不适用：此项不是大六壬贵人",
        "jishen":deity,
        "jishen_rule":"岁计计神按六十纪、寅起逆行十二支",
    }
    # True historical witness only: never claim 主客 positions from an
    # incomplete 16-spirit board for arbitrary present-day years.
    known={
       1561:{"main_eye":"阴德","main_count":16,
             "guest_eye":"天道","guest_count":30,"source":SOURCES["historical_1561"]},
       1624:{"main_eye":"大炅","main_count":18,"main_general_palace":8,
             "guest_eye":"太阳","guest_count":19,"guest_general_palace":9,
             "source":SOURCES["historical_1624"]},
    }
    main_guest={
        "status":"historical_witness_only" if gregorian_year in known else "pending",
        "source_if_attested":known.get(gregorian_year),
        "heaven_eye_wenchang":None,
        "earth_eye_shiji":None,
        "main_calculated":None,
        "guest_calculated":None,
        "main_guest_generals_computed":False,
        "reason":"主客需先严密完成十六神文昌、始击和投算；本版尚未实现，历史例盘仅作校勘真值。",
        "next":"V65 校勘十六神、文昌、计神加宫与始击，才能建立全部年份的主客算。",
    }
    board={
       "version":"V64",
       "art":"太乙神数","calculation":"岁计",
       "school":"太乙古籍积年 1624 锚点系",
       "year":annual,
       "nine_palaces":nine,
       "palace_ring":[{"number":n,"trigram":g,"direction":d} for n,g,d in YEARLY_RING],
       "middle_palace_has_taiyi":False,
       "main_guest":main_guest,
       "has_real_accumulation_and_taiyi_palace":True,
       "has_complete_main_guest":False,
       "has_full_annual_chart":False,
       "sources":SOURCES,
       "warnings":[
         "本版只进行岁计阳遁；不是月计、日计或时计，不能从季节直接切换本年阴遁。",
         "太乙式九宫编号不同于后天洛书原号：一乾、二离、三艮、四震、六兑、七坤、八坎、九巽；中五不游。",
         "历史积年起点有不同传本，当前明确采用古籍1624/1561相符的同一积年系。",
         "文昌、始击、主客算未实现，界面明确待算，不以猜测数字进行吉凶推断。",
       ],
       "fortune_verdict":None,
    }

    from .taiyi_v65 import decorate_taiyi_v65
    return decorate_taiyi_v65(board)


def cast_taiyi(gregorian_year:int)->dict:
    return year_board(gregorian_year)
