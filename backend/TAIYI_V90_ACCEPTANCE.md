# V90 · NCL-06604 明钞本扫描前段页序定位

## 本轮实际核验范围

本轮通过 Wikimedia Commons 的逐页预览，视觉检查了 NCL-06604 明钞本扫描第1—9页。该文件共124页，2350×1700像素，23,669,039字节，SHA-1 为 \`46b2774f6d66fb61db3617673672ec721bdc0904\`。

| PDF扫描页 | 实际看到的内容 | 判断 |
|---:|---|---|
| 1 | 《太乙金镜序》开篇 | 序文 |
| 2 | 序文续页 | 序文 |
| 3 | 序文续页 | 序文 |
| 4 | 版框内空白 | 空白页 |
| 5 | 《太乙金镜卷第一》题名及目录起页 | 卷一题名/目录 |
| 6 | 卷一目录续页 | 目录 |
| 7 | 卷一目录续页 | 目录 |
| 8 | 卷一目录末页 | 目录 |
| 9 | 可辨“推月计法”等篇目 | 卷一正文起页 |

**关键进展：** 已确定这份PDF的前九页并非卷九正文；卷一正文从扫描第9页开始。卷九所在册、所在扫描页和叶码仍未定位。没有依据把扫描页9以后的页数按十卷平均分配，因此不推算卷九页码。

## 可逐页复核的原始影像

- [PDF第1页](https://commons.wikimedia.org/wiki/File:NCL-06604_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93.pdf)
- [PDF第2页](https://commons.wikimedia.org/w/index.php?page=2&title=File%3ANCL-06604_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93.pdf)
- [PDF第3页](https://commons.wikimedia.org/w/index.php?page=3&title=File%3ANCL-06604_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93.pdf)
- [PDF第4页](https://commons.wikimedia.org/w/index.php?page=4&title=File%3ANCL-06604_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93.pdf)
- [PDF第5页](https://commons.wikimedia.org/w/index.php?page=5&title=File%3ANCL-06604_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93.pdf)
- [PDF第6页](https://commons.wikimedia.org/w/index.php?page=6&title=File%3ANCL-06604_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93.pdf)
- [PDF第7页](https://commons.wikimedia.org/w/index.php?page=7&title=File%3ANCL-06604_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93.pdf)
- [PDF第8页](https://commons.wikimedia.org/w/index.php?page=8&title=File%3ANCL-06604_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93.pdf)
- [PDF第9页](https://commons.wikimedia.org/w/index.php?page=9&title=File%3ANCL-06604_%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93.pdf)

## 卷九目标文字的待校底文（不是明钞本读文）

四库全书本卷九的网页转录作：

> 假令阴遁第三纪第五十二局乙卯时太乙在八宫阳德为天目巳为计神始击将临太簇客计得七大将七参将一此为五将发阴阳和主客俱会北方又敌转而北方如此则敌来不为盗

可交叉查看：
- [维基文库·四库全书本卷九](https://zh.wikisource.org/zh-hans/%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93_%28%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8%E6%9C%AC%29/%E5%8D%B709)
- [中国哲学书电子化计划·卷九](https://ctext.org/wiki.pl?chapter=435698&if=en)
- [知命书院·卷九转录](https://shuyuan.zhiming.life/read/%E5%A4%AA%E4%B9%99%E9%87%91%E9%8F%A1%E5%BC%8F%E7%B6%93/13)

这些是四库文本的网络转录/再展示，不是明钞本读文，也不是独立异本。它们只用于定位目标段落和建立待校底文。特别是“巳为计神”仍须由明钞本影像核实，不能把网页转录当作最终证据。

## 当前严格结论

- 已视觉核验扫描页：9/124
- 卷一正文起页：PDF第9页
- 卷九起页：未知
- “推敌国动静”目标叶：未定位
- 明钞本目标段落转录：0字
- 明钞本与四库本逐字比对：未开始
- 已核实独立阴遁异文：0
- V87三项同余冲突：保持待判
- 原文修订建议：无
- 完整时计盘：未完成

## 工程变更

新增：
- \`backend/app/core/taiyi_hour_v90.py\`
- \`backend/tests/test_taiyi_v90.py\`
- \`backend/scripts/taiyi_v90_acceptance.py\`
- \`backend/TAIYI_V90_ACCEPTANCE.md\`

更新：
- V89 在时计结果链末端接入 V90 页序定位；
- 太乙时计页面增加已核扫描页、四库待校底文与证据边界；
- GitHub Actions 增加 V90 专项验收和 JSON 证据归档。

V90 不修改V77—V89排盘算法、纪局、时柱或现代气应推演。
