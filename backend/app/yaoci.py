"""动爻文本：逐条校勘收录。其他爻暂不杜撰原文。"""
VERIFIED_LINES = {
    ("震",2): "震卦六二：震来厉，亿丧贝。跻于九陵，勿逐，七日得。",
}
def moving_line_text(chart: dict) -> str | None:
    return VERIFIED_LINES.get((chart["ben_gua"]["name"],chart["dong_yao"]))
