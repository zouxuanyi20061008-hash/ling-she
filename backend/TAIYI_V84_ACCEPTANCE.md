# V84 · 王希明二至气应时计独立基本盘与不能借用的主客将

## 古籍来源与校验范围

[《太乙金镜式经》卷一](https://zh.wikisource.org/zh-hans/太乙金鏡式經_(四庫全書本)/卷01) 的“推冬夏二至以后太乙所在法”规定二至以后以24时一周，三时移宫；“推阴阳二遁时计计神法”以十二时逆行计神。[“推八门用法”](https://www.shidianguji.com/zh/book/SK1615/chapter/1l9lir739jmyy) 又明确冬夏至气应起门、三十时换门，并有“常以直门加太乙及主客大将随数而行，太乙三时一移，大将一时一移”。

这些原典支持的**气应时计可唯一确定部分**是以真实交节瞬间起算的太乙宫、计神、直使门和门内时数。将**已算直使**作为锚点临在**已算的太乙宫**，再按 V82 的八门八卦环顺向旋转，可生成数学上完全的八正宫候选图；但 **没有独立时计完整八门实例证明其他七个门都这样布**，故仍属 `verified_as_single_complete_hour_chart=false`。

**主客大将每时一移**虽有史文，但“从何宫初临、如何依气应时计文昌与主客算起大将”没有可确认的完整原始时盘，因此**没有**合法的大将具体宫位，也不能把 V78 甲子前简捷元局、V79 文昌主客将照搬到 V77/V83 二至派。V84 `qiying_main_general.palace=null` 和 `qiying_guest_general.palace=null`，只记录已知运动规则与未决原因。留待今后独立证据。

## 算法与数据

- `backend/app/core/taiyi_hour_v84.py` 的 `qiying_hour_core(relative_hours,dun,solstice_name)` 独立使用 V77 的二至相对时实、阴阳八宫环与计神，另用 V83 的二至直使四门计算，以 V82 八卦环形成**太乙锚点**候选。
- `compare_qiying_and_jiazi(chart)` 重新算气应时与甲子时两派太乙宫/直使和候选八门分布，输出 `same_chief`、`same_taiyi_palace` 和 `same_conditional_taiyi_door_rotation`，并验证源数据未被改写。
- `hour_v84_qiying_plate` 在原 `POST /api/taiyi/hour/cast` 内作为纯新增字段；保留全部 V77–V83 接口。提供 **同一日期的并列候选太乙八门九宫图**，但两图归属各自历元。
- 独立 `has_verified_qiying_main_guest=false`、`has_all_hour_eight_door_positions=false`、`has_full_hour_chart=false` 严格阻止误报。

## 验收

`backend/tests/test_taiyi_v84.py` 与 `backend/scripts/taiyi_v84_acceptance.py` 校验阴阳两遁各360时、2026 年冬夏至交节后一秒第一时、各自的太乙初宫（冬至一宫/夏至九宫）和计神初支（寅/申）、八门直使（开/杜）、现实日期的双校比较、旧岁计隔离与篡改防护。CI 单独上传 `taiyi-v84-qiying-independent-plate` 验收 JSON，Docker 内再跑完整回归。

**仍不宣称完成**：气应独立主客大将、天目文昌、始击/定计，同宫起数、庚戌时定计32/33、完整八门落宫独立例课及绝对上元历元。待证据到位再实算，不虚构。
