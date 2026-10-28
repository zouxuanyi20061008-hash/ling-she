# V82 · 时计八门四种史源锚点与八卦旋宫候选盘

**绝不把候选盘标成古籍独立验证的唯一时计完整八门盘**。

史源：
- [《太白兵备统宗宝鉴·释八门直事》](https://www.shidianguji.com/book/SDZJ0646/chapter/1kg32q85u563p) 明载 **开乾、休坎、生艮、伤震、杜巽、景离、死坤、惊兑**。八卦方位按顺时针 `乾坎艮震巽离坤兑`，宫序 `1,8,3,4,9,2,7,6`，中五不参与。
- [《太乙金镜式经》卷一《推八门用法》](https://www.shidianguji.com/zh/book/SK1615/chapter/1l9lir739jmyy)：“常以直门加太乙及主客大将，随数而行”，据已算时计太乙和主客大将，各建立一个**分支**的“直使门为锚点”旋宫候选；若大将同宫 pending 或落中五则不能安门。
- [《太乙金钥匙》古法](https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkvlnkx7u)：“古法以直使门加于定计目”。以 V81 真实定计目为候选起始，**定计目属十六神间位时**保留空宫，绝不强塞九宫。
- [《太乙金钥匙·续集》庚戌时例](https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkylq3yn8) 独立验证 **生门第17时**，**没有**给完整时计八门落宫真值，不能充当上面四个分支中某一个的独立认证。

### 可复算的八门数学环

依每一锚点「哪一宫承载哪一门」作有向环旋转，得八宫各八门、门宫唯一且没有中五（纯算法）。同一时局因**锚点来源不同**出现多套候选；必须各自显示原典、所用起点、缺失条件、旋转环，不合并为一张正式盘。旋转算法自身不是时计八门已验真例课，也不推出占断结论。

特别注意：**太乙八宫游行顺序 `1→2→3→4→6→7→8→9` 不是八门八卦方位环 `1→8→3→4→9→2→7→6`**；不得直接用前者布门。分支是古籍八门环序与起宫的组合推导，未有全部落宫原例，因此 `verified_as_single_complete_hour_chart=false`。

### 887时真值的边界

戊子元阳遁23局、太乙 **九宫**、主大将 **六宫**、客大将 **三宫**，定计目 **巳·大神，属于间位，无八正宫**。V82 固定输出 **三套独立旋宫候选**，第四套标记不可强安；庚戌定计的 32/33 仍保留 `source_conflict`，不得使用分歧的定计将作新锚点。

### 安全 API 与验收

`backend/app/core/taiyi_hour_v82.py` 新增纯函数 `rotate_eight_door_candidate()`、`source_scoped_eight_door_candidates()`，集成 `POST /api/taiyi/hour/cast`。新增 `hour_v82_eight_door_schools`、`hour_door_school_version=V82`，旧 V77–V81 结构保持稳定；`has_verified_hour_door_location=false`、`has_all_hour_eight_door_positions=false`、`has_full_hour_chart=false`、`which_school_is_default=null`。

`backend/tests/test_taiyi_v82.py` 覆盖 64 种八门×八正宫旋宫、阳阴合计720时局、同宫大将待判、中五不可置、间位不得冒充正宫、古籍887主客锚点与防改写 API。独立 `backend/scripts/taiyi_v82_acceptance.py` 上传固定八卦门环、887四分支结果、720时局类别统计。
