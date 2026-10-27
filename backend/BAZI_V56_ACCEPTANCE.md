# V56 四柱八字大运（传统命理结构计算，非现实预测）

## 采用口径

**默认只看 V55 四柱**。想排运时必须主动选一种：

- `traditional_male`：按照传统“男命”规则，阳年干顺，阴年干逆
- `traditional_female`：按照传统“女命”规则，阴年干顺，阳年干逆
- `forward` / `reverse`：直接选择顺逆，不需要向系统填写个人性别、身份
- 无选择时不推断、不生成大运

注意“男命”“女命”只用于历史文本中的起运参数，不等同用户现在的性别认同或个人信息。严禁由姓名、出生日期等推断。

起运按**十二“节”**（不是二十四节气混用），顺排取出生后下一节、逆排取出生前上一节，以真实交节时间计算间隔。选用 `lunar-python Yun sect=2` **分钟折算**：

- 3天＝1起运年，即4320分钟；
- 360分钟＝1起运月；12分钟＝1起运日；余1分钟＝2起运小时；
- 将结果按历法年/月/日/小时累加到出生时刻；每十年对应一柱，首步从出生月柱顺/逆推一位（不包括原月柱）。
- “岁数”属于起运折算概念，网站显示确切推算起点与日历年份区间，绝不将日历年索引冒充年龄。

传统模式不仅独立计算，还与 `lunar_python.EightChar.getYun(gender,2)` 的顺逆、年月日小时折算、起运日及8步大运干支逐项对照。手动指定顺逆则复用同一可复算公式，但不虚构性别或把它当作上游原库性别校验。

独立规则参考：《[三车一览·起大运例](https://tianjihq.com/zh-CN/learn/books/sanche-yilan/9)》；[6tail Yun.py](https://github.com/6tail/lunar-python/blob/master/lunar_python/eightchar/Yun.py)、[DaYun.py](https://github.com/6tail/lunar-python/blob/master/lunar_python/eightchar/DaYun.py)。

## 验收

新增 `backend/tests/test_bazi_v56.py`；独立 `backend/scripts/bazi_v56_acceptance.py` 上传 JSON。1999年阴年、1990年阳年、2026立春两侧逆顺翻转、历法极端边界；验证不请求性别也能手动排运，不影响既有子时换日、日主藏干与十神。

## 尚未完成

真实出生地太阳时/经度校正、大运多个流派折算法切换、流年流月全面排布、合冲刑害关系及传统命理推演都在后续。不会将大运干支生成的传统名称当现实吉凶预测。
