# V81 · 太乙时计史料临本与值使门位证据边界

继续 V80 的**计算内核**而非转入教学/美术。现找到两项可核的古籍材料：

1. [《太乙金钥匙续集》庚戌时](https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkylq3yn8) 原文同时载「大神1，大威2，大武7，太簇6，阴德1，地主8，和德3，高丛4」与「定算33、定大将3、定参将9」。逐项和为32。这**是同一文本内部的数字冲突**，**不是**有独立书证的两种合法“版本”；不能因为正文章写33便创造特殊加一法。V81 继续使相关课 `count/main_general/assistant_general=null`。
2. 同一《续集》的**丁未日**也写定计逐项 `3+4+9+2+7+6+1=32`，正文亦记32，定大将2、参将6。该例说明「逐项求和」有另一张书内支持案例，但**并非庚戌时的独立异本，也不能独立证明庚戌必定32**。
3. 《续集》岁计八门节载「直事门加定计目所治之宫」；[《太乙金钥匙一卷》八门总法](https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkvlnkx7u) 也说「古法以直使门加于定计目」。V81 计算该**古法候选**的准确 **十六神方位**，保留时计四门120时直使真值；但庚戌时原文没给出完整八门九宫图，所以**不能据岁计文字外推全部时计八门落宫**。
4. 同宫时计：从起算目实际十六神位严格核对与太乙同宫条件。现有《武备志》岁计同宫异文只能列为**未选用古法候选**，不自动作为时计已认证公式。

## 本轮代码与 API

- `backend/app/core/taiyi_hour_v81.py`：原始逐宫零/非零项证据级别、古籍文字与算术冲突内证、同宫神位真实校验及值使加定目候选落位。
- 延续 `/api/taiyi/hour/cast` 中 `version=V77`、`historical_ju_version=V78`、`main_guest_version=V79`、`classical_hour_extension_version=V80`，新增 `historical_review_version=V81`。
- `hour_v81_door_location_candidate`：16神唯一候选标记，`candidate_palace=null` 时表示落在间神**不得硬塞到九宫正宫**；`actual_hour_palace_if_unverified=null`、`all_eight_doors_placed=false`。
- `hour_v81_source_review` 将 **32算法候选**和 **33古籍文字**继续分别记录，`does_not_claim_two_independent_editions=true`。
- `hour_v81_same_palace_review` 每个待判的主、客、定计独立列实际同宫精确神位，不掩盖与太乙冲突，更不拿同宫候选自动给大将数。
- 真实性边界：`has_full_hour_chart=false`、`has_verified_hour_door_location=false`、不计算预言结论。

## 回归验收

`backend/tests/test_taiyi_v81.py` 与 `backend/scripts/taiyi_v81_acceptance.py` 从 **阳阴两遁各360时计，共720课**核对唯一候选门位、间神正宫区分、同宫待判、原典矛盾、旧岁计 API 独立；CI 上传 JSON，Docker 内整套旧八门测试和新例课复核。

**待实现**：找到庚戌时定算33的独立底本解释、具备时计独立实例的同宫算法、完整八门飞布规则和上元绝对积时。在未解决之前，不宣称时计全局完成。
