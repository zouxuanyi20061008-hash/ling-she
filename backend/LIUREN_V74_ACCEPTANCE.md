# V74 · 大六壬三传古籍例外、未决分支审计

目标：完善实际三传计算，不为通过率冒险填入无法由原典明确证明的初传。

## 修复真实错误

`liuren_v59._fuyin` 原先对所有伏吟课机械依次取“初传刑 → 中传刑”；**丁卯、己卯、辛卯**三个伏吟日，初卯刑子，子再刑卯，形成无限互刑，古籍要求中子**冲午**作末传，而非重回卯。现在三日均确认为 **卯 → 子 → 午**，带 `rule_audit.reciprocal_punishment_broken_by_clash=true`、独立原典 URL，并在 V74 审计层拒绝错误旧值。

- [《大六壬课经集·伏吟课》](https://www.zhaosir.online/Books/BookChapterDetail.aspx?did=1650)：明确列丁卯、己卯、辛卯三日为卯子午。
- [《大六壬探原》](https://orasage.com/zh-CN/daozang/docs/zh-cn/5_5_3)：同录“丁己辛三卯日”例外规则。
- 不修改丙辰、丁丑、癸丑、壬辰等原已通过的自任、自信、不虞、双自刑课。

## 未决真实边界

V74 将每张真实三传的当前已算/待判状态加 `pending_branch_review` 元数据：未决课按反吟多贼克、伏吟特殊、多涉害、遥克多候选、其他特殊课式分类，逐一列原因、候选上神及下一步核验内容。**对未决保持 `transmissions=null` 和 `has_three_transmissions=false`**；即使基础天地盘、四课、贵人及旬空全有，不宣称九宗门全自动完成。

重新遍历 60 干支日 × 12 月将 × 12 占时，形成 `backend/scripts/liuren_v74_acceptance.py` 的统计与代表案例，CI 上传 `liuren-v74-classical-mao-and-pending-census` JSON。未来应针对尚存的未决类型搜集原典和有完整四课真值的独立例课，再扩大可唯一发用范围。

## 兼容与展示

- API `POST /api/liuren/cast` 的原 `version=V63` 和全部固定盘字段不变，新增 `audit_version=V74`。
- 页面补充三卯伏吟已核验例外、明确的未决分类与来源；修复排盘后调整日期/时间或贵人规则时旧盘残留、慢请求覆盖新表单的交互风险。
- **未支持：**所有流派的涉害细法、反吟多克唯一裁决、最终断课、吉凶及实际应期。
