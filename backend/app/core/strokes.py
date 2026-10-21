"""离线字形结构 + 汉字阴阳取数（简体常用笔画口径）。

不把 IDS 的几何分解等同于拆字阴阳：独体字先查人工审定的白名单；
复杂/笔画有歧义时主动要求人工确认，绝不由大模型补笔画。
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
import re

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
ARITY = {"⿰": 2, "⿱": 2, "⿲": 3, "⿳": 3, "⿴": 2, "⿵": 2,
         "⿶": 2, "⿷": 2, "⿸": 2, "⿹": 2, "⿺": 2, "⿻": 2}
ENCLOSURES = {"⿴", "⿵", "⿶", "⿷", "⿸", "⿹", "⿺"}
# 「王」「天」虽然 CJKVI IDS 形如 ⿱，但在本产品按独体字取数。
# 这是人工审定的*保守白名单*，不是所有独体字的穷举列表。
INDEPENDENT_CHARACTERS = frozenset("王天大人小中山土木水火日月口手心田目一二三")
# 明确采用的简体常用笔画口径；上游 CJKVI 在不同地区可能给出多值。
SIMPLIFIED_STROKES = {"辶": 3, "艹": 3}
LEFT_RADICALS = frozenset({"氵", "亻", "扌", "忄", "钅", "讠", "彳", "犭", "女", "木", "口", "土"})
TOP_RADICALS = frozenset({"艹", "宀", "雨", "竹", "⺮"})


class UnsupportedCharacter(ValueError):
    """无法可靠归属阴阳部件，请 UI 弹窗要求用户人工确认。"""

    def __init__(self, message: str, structure: str = "待人工确认", ids: str | None = None):
        super().__init__(message)
        self.structure = structure
        self.ids = ids


def is_hanzi(value: str) -> bool:
    if len(value) != 1:
        return False
    cp = ord(value)
    return (0x3400 <= cp <= 0x9FFF or 0x20000 <= cp <= 0x323AF)


@lru_cache(maxsize=1)
def load_data() -> tuple[dict[str, str | None], dict[str, tuple[int, ...]]]:
    ids_path = DATA_DIR / "ids.txt"
    strokes_path = DATA_DIR / "ucs-strokes.txt"
    if not ids_path.exists() or not strokes_path.exists():
        raise RuntimeError("缺少 CJKVI 数据，请先运行 python scripts/download_data.py")

    ids_map: dict[str, str | None] = {}
    for line in ids_path.read_text(encoding="utf-8").splitlines():
        if line.startswith("#") or not line.strip():
            continue
        fields = line.split("\t")
        if len(fields) < 3:
            continue
        char, raw_candidates = fields[1], fields[2:]
        # G 表示大陆字形。优先带 G 的版本，其次不带地域标记的版本。
        # 同等优先级若有多种分解，视为歧义，不擅自选第一条。
        marked = [(re.sub(r"\[[A-Z]+\]$", "", s),
                   (re.search(r"\[([A-Z]+)\]$", s).group(1)
                    if re.search(r"\[([A-Z]+)\]$", s) else ""))
                  for s in raw_candidates]
        mainland = [expr for expr, tag in marked if "G" in tag]
        neutral = [expr for expr, tag in marked if not tag]
        choices = mainland or neutral
        ids_map[char] = choices[0] if choices and len(set(choices)) == 1 else None

    counts: dict[str, tuple[int, ...]] = {}
    for line in strokes_path.read_text(encoding="utf-8").splitlines():
        if line.startswith("#") or not line.strip():
            continue
        fields = line.split("\t")
        if len(fields) < 3:
            continue
        raw = fields[2]
        if re.fullmatch(r"\d+(?:,\d+)*", raw):
            counts[fields[1]] = tuple(int(x) for x in raw.split(","))
    return ids_map, counts


def read_node(s: str, pos: int = 0) -> tuple[tuple, int]:
    """将前缀 IDS 解析为语法树，字符实体 &CDP-...; 作为单个叶子。"""
    if pos >= len(s):
        raise UnsupportedCharacter("IDS 结构拆分不完整")
    char = s[pos]
    if char in ARITY:
        children = []
        next_pos = pos + 1
        for _ in range(ARITY[char]):
            child, next_pos = read_node(s, next_pos)
            children.append(child)
        return (char, *children), next_pos
    if char == "&":
        semicolon = s.find(";", pos)
        if semicolon < 0:
            raise UnsupportedCharacter("IDS 含有无法读取的特殊部件")
        return (s[pos:semicolon + 1],), semicolon + 1
    return (char,), pos + 1


def node_to_ids(node: tuple) -> str:
    return node[0] if len(node) == 1 else node[0] + "".join(map(node_to_ids, node[1:]))


def options(value: int | tuple[int, ...] | None) -> tuple[int, ...]:
    return (value,) if isinstance(value, int) else (value or ())


def node_strokes(node: tuple, stroke_map: dict) -> int:
    """只汇总可验证的独立部件。交叠形绝不能机械累加。"""
    if len(node) == 1:
        c = node[0]
        if c in SIMPLIFIED_STROKES:
            return SIMPLIFIED_STROKES[c]
        stroke_options = options(stroke_map.get(c))
        if len(stroke_options) != 1:
            raise UnsupportedCharacter(f"部件「{c}」笔画数据缺失或有歧义")
        return stroke_options[0]
    if node[0] == "⿻":
        raise UnsupportedCharacter("结构存在笔画交叠，不能简单求和")
    return sum(node_strokes(child, stroke_map) for child in node[1:])


def split_character(char: str) -> dict:
    """返回阳部/阴部/结构说明；独体返回整字笔画和阴默认值 1 的提示。"""
    if not is_hanzi(char):
        raise ValueError("汉字模式必须输入一个汉字")
    ids, counts = load_data()
    official_options = options(counts.get(char))
    expression = ids.get(char)
    if not official_options:
        raise UnsupportedCharacter("整字标准笔画缺失，请人工填写")

    if char in INDEPENDENT_CHARACTERS:
        if len(official_options) != 1:
            raise UnsupportedCharacter("独体字笔画有歧义，请人工填写", "独体", expression)
        return {
            "character": char, "structure": "独体", "ids": expression,
            "yang_part": char, "yin_part": "默认数 1",
            "yang_strokes": official_options[0], "yin_strokes": 1,
            "first_strokes": official_options[0], "second_strokes": 1,
            "total_strokes": official_options[0],
            "moving_basis": "整字总笔画",
            "stroke_reference_total_candidates": list(official_options),
            "stroke_policy": "独体字以整字为阳，阴默认取 1",
            "source": "CJKVI + 独体字审定表",
        }

    if expression is None:
        raise UnsupportedCharacter("缺少可靠的字形拆分或存在地区版本歧义，请人工确认")
    try:
        node, end = read_node(expression)
    except UnsupportedCharacter as exc:
        raise UnsupportedCharacter(str(exc), ids=expression) from exc
    if end != len(expression):
        raise UnsupportedCharacter("IDS 存在多个或无法读取的拆字表达式", ids=expression)

    op = node[0]
    if len(node) == 1:
        # IDS 明确为不可再拆的字形且整字笔画唯一，可按独体处理。
        if len(official_options) != 1:
            raise UnsupportedCharacter("该字独体笔画有歧义", "独体", expression)
        total = official_options[0]
        return {
            "character": char, "structure": "独体", "ids": expression,
            "yang_part": char, "yin_part": "默认数 1",
            "yang_strokes": total, "yin_strokes": 1,
            "first_strokes": total, "second_strokes": 1,
            "total_strokes": total, "moving_basis": "整字总笔画",
            "stroke_reference_total_candidates": list(official_options),
            "stroke_policy": "IDS 单体 + 整字笔画唯一；阴默认取 1",
            "source": "CJKVI",
        }

    if op == "⿰":
        structure = "左右"
        yang_node, yin_node = node[1], node[2]
        grouping = "左为阳、右为阴"
    elif op == "⿱":
        structure = "上下"
        yang_node, yin_node = node[1], node[2]
        grouping = "上为阳、下为阴"
    elif op in ENCLOSURES:
        structure = "全包围" if op == "⿴" else "半包围"
        yang_node, yin_node = node[1], node[2]
        grouping = "外为阳、内为阴"
    elif op == "⿲":
        structure = "左中右"
        if node[1] == (node[1][0],) and node[1][0] in LEFT_RADICALS:
            yang_node = node[1]
            yin_node = ("⿰", node[2], node[3])
            grouping = "左部是经确认的独立偏旁，阳取左部；中右合并为阴"
        else:
            raise UnsupportedCharacter("左中右结构缺少可靠的独立左部首，需人工指定阳/阴部", structure, expression)
    elif op == "⿳":
        structure = "上中下"
        if node[1] == (node[1][0],) and node[1][0] in TOP_RADICALS:
            yang_node = node[1]
            yin_node = ("⿱", node[2], node[3])
            grouping = "上部是经确认的独立偏旁，阳取上部；中下合并为阴"
        else:
            raise UnsupportedCharacter("上中下结构缺少可靠的独立上部首，需人工指定阳/阴部", structure, expression)
    else:
        raise UnsupportedCharacter("交叠结构无法按内外/左右确定阴阳，请人工填写", "交叠", expression)

    try:
        yang_count = node_strokes(yang_node, counts)
        yin_count = node_strokes(yin_node, counts)
    except UnsupportedCharacter as exc:
        raise UnsupportedCharacter(str(exc), structure, expression) from exc
    summed = yang_count + yin_count
    if summed not in official_options:
        raise UnsupportedCharacter(
            f"阳部 {yang_count} + 阴部 {yin_count} = {summed}，与整字笔画候选 {official_options} 不符",
            structure, expression)
    return {
        "character": char, "structure": structure, "ids": expression,
        "yang_part": node_to_ids(yang_node), "yin_part": node_to_ids(yin_node),
        "yang_strokes": yang_count, "yin_strokes": yin_count,
        "first_strokes": yang_count, "second_strokes": yin_count,
        "total_strokes": summed, "moving_basis": "阳部 + 阴部笔画",
        "stroke_reference_total_candidates": list(official_options),
        "stroke_policy": "简体笔画：辶、艹按 3 画；其他部件若有歧义则人工确认",
        "yin_yang_rule": grouping, "source": "CJKVI + 阴阳部件规则",
    }