# V89 · 《太乙金镜式经》数字化见证来源谱系清点

## 本轮发现

Wikimedia Commons 的《太乙金镜式经》分类页列出7个数字化文件。逐项检查文件题名、来源说明和馆藏元数据后，不能将它们算作7个独立版本。

| 数字文件 | 当前分类 | 依据 |
|---|---|---|
| NCL-06604 | 国图明钞本候选 | 台湾国家图书馆著录明钞本，登录号06604 |
| CADAL06056494（卷一至四） | 四库全书系统 | 文件说明标注“四库全书；子部；术数类” |
| CADAL06056495（卷五至十） | 四库全书系统 | 文件说明标注“四库全书；子部；术数类” |
| SSID-12326977（第一册） | 来源待考 | 页面无机器可读来源 |
| SSID-12326978（第二册） | 来源待考 | 页面无机器可读来源 |
| SSID-13003380 | 四库全书系统 | 文件题名明确为“钦定四库全书” |
| 文渊阁四库全书0810册 | 四库全书系统 | 文件题名明确为文渊阁四库全书 |

来源页：
- [《太乙金镜式经》数字文件分类页](https://commons.wikimedia.org/wiki/Category:太乙金鏡式經)
- [NCL-06604 明钞本](https://commons.wikimedia.org/wiki/File:NCL-06604_太乙金鏡式經.pdf)
- [CADAL 卷五至十](https://commons.wikimedia.org/wiki/File:CADAL06056495_太乙金鏡式經·卷五~卷十.djvu)
- [SSID-12326977](https://commons.wikimedia.org/wiki/File:SSID-12326977_太乙金鏡式經_1.pdf)
- [SSID-12326978](https://commons.wikimedia.org/wiki/File:SSID-12326978_太乙金鏡式經_2.pdf)
- [SSID-13003380 四库本](https://commons.wikimedia.org/wiki/File:SSID-13003380_太乙金鏡式經_欽定四庫全書.pdf)

## 证据结论

- 数字化文件：7个
- 明钞本馆藏候选：1件（NCL-06604）
- 明确属于四库系统的数字文件：4个
- 来源待考的数字文件：2个
- 已经完成逐字校勘、证明独立文本谱系的异本：0件

两个SSID文件不能因为名称不同就自动算作独立底本；四库本的多份扫描也不能互相充当独立版本证据。

## 明钞本页叶定位状态

NCL-06604 扫描共124页。已通过逐页预览检查第2、3页；目标段落“推敌国动静”尚未出现在已检查页中。当前仍未定位卷九目标叶，未转录目标段落，未与四库本逐字校勘。

国家图书馆FAQ说明其古籍全文影像阅览有馆内/合作馆权限安排；本项目使用公开数字化副本时仍须尊重文件来源和授权说明，不绕过馆方访问控制。

## 工程验收边界

V89 只完成数字文件来源谱系清点，不宣称已经找到独立异文：
- verified_independent_textual_witnesses = 0
- target_leaf_located = false
- full_text_collation_completed = false
- can_resolve_v87_conflict = false
- preferred_correction = null
- has_full_hour_chart = false

新增：
- backend/app/core/taiyi_hour_v89.py
- backend/tests/test_taiyi_v89.py
- backend/scripts/taiyi_v89_acceptance.py
- backend/TAIYI_V89_ACCEPTANCE.md
- 太乙时计页的V89来源谱系展示与前端回归测试。

V89 不修改 V77–V88 的任何排盘公式、历史纪局或现代气应推演。
