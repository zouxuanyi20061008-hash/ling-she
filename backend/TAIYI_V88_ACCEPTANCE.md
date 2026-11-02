# V88 · 《太乙金镜式经》明钞本候选见证登记

## 新发现的馆藏实体

V87 已证明卷九“阴遁第三纪第五十二局乙卯时”三个标签在当前六纪/72局/60时纪口径下不能同时成立，但三份网页文字都属于四库全书本的转录，尚未找到独立校本。

本轮新增一条不同馆藏实体线索：

- 馆藏机构：台湾国家图书馆
- 题名：《太乙金镜式经》
- 版本著录：明钞本，目录年代范围为明代（1368—1644）
- 十卷，线装四册；索书号 306.6 06604，登录号 06604
- 馆藏著录行款：九行、每行二十字、双栏、版心白口、单鱼尾
- 对应数字扫描：124页，2350×1700像素；Commons 文件 SHA-1 46b2774f6d66fb61db3617673672ec721bdc0904

目录与扫描：
- [台湾国家图书馆馆藏目录](https://rbook.ncl.edu.tw/NCLSearch/Search/SearchDetail?HasImage=&SourceID=1&item=13b06fa9483b4e5c94ff0d8120e7dafafDcyODI50.Bfft4JFnqn4EbB0D_K05Qt4TOObWV_cCRKArHV41ULs_&page=)
- [国家图书馆明钞本数字扫描（Wikimedia Commons）](https://commons.wikimedia.org/wiki/File:NCL-06604_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93.pdf)
- [数字典藏联合目录记录](https://catalog.digitalarchives.tw/item/00/07/ed/67.html)

## 严格的证据状态

本版只完成目录与扫描元数据登记，不宣称已经校勘卷九。

目前尚未完成：
- 124页扫描中卷九的具体页/叶定位；
- “推敌国动静”段落的逐字转录；
- 与四库本逐字比对；
- 判断明钞本与四库本的文本谱系关系。

因此：
- textual_independence_established = false
- is_verified_independent_variant = false
- can_resolve_v87_conflict = false
- preferred_correction = null
- has_full_hour_chart = false

馆藏年代不同、物理抄本不同，不等于已经证明文本传承独立，更不能仅凭目录信息改动原典。

## 工程验收

新增：
- backend/app/core/taiyi_hour_v88.py：登记候选馆藏见证并保护 V87 未决状态；
- backend/tests/test_taiyi_v88.py：目录字段、未转录状态、V87 冲突保持、现代气应字段隔离及 API 回归；
- backend/scripts/taiyi_v88_acceptance.py：三组实际时计输入的独立 JSON 验收；
- frontend/src/TaiyiV77Hour.jsx：显示明钞本线索与明确的“尚未校勘”边界；
- frontend/tests/taiyi-v85-stage.test.jsx：页面展示与旧 API 兼容测试。

V88 不改变 V77–V87 的既有太乙计算公式，不将历史目录记录移植为现代二至气应文昌、始击或主客将，不输出吉凶与应期。
