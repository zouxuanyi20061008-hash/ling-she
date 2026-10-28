"""V70 堪舆风水：静态二十四山、坐向、后天八卦九宫方位计算。

方位角从正北顺时针；每山15°。只做几何方位换算和传统宫位映射，
不把罗盘读数、磁偏角、房屋坐向或玄空断事冒充已实地测定。
来源：https://www.yuanka.com.cn/tools/luopan
对照：https://fengshui.tools/ja/free-luopan-calculator
"""
from __future__ import annotations

import math

MOUNTAINS = tuple("子癸丑艮寅甲卯乙辰巽巳丙午丁未坤申庚酉辛戌乾亥壬")
TRIGRAMS = ("坎", "艮", "震", "巽", "离", "坤", "兑", "乾")
PALACE_NUMBERS = (1, 8, 3, 4, 9, 2, 7, 6)
COMPASS_POINTS = ("北", "东北", "东", "东南", "南", "西南", "西", "西北")
TRIGRAM_ELEMENTS = ("水", "土", "木", "木", "火", "土", "金", "金")
# 盘面遵循传统方位：上南下北、左东右西；中心五不属于罗盘二十四山。
PALACE_GRID = (3, 4, 5, 2, None, 6, 1, 0, 7)
BOUNDARY_WARNING_DEGREES = 0.2
SOURCES = {
    "mountain_chart": "https://www.yuanka.com.cn/tools/luopan",
    "mountain_crosscheck": "https://fengshui.tools/ja/free-luopan-calculator",
}

def _angle(value: float) -> float:
    value = float(value)
    if not math.isfinite(value) or not 0.0 <= value <= 360.0:
        raise ValueError("输入方位角须为0°至360°之间的有限数字，0°与360°均为正北。")
    return round(value % 360.0, 9) % 360.0

def _normalized(value: float) -> float:
    value = value % 360.0
    return round(value, 9) % 360.0

def _sector(angle: float) -> dict:
    # 左闭右开：7.5°归癸、352.5°归子；界点并非测量精度保证。
    index = math.floor(((angle + 7.5) % 360.0) / 15.0)
    center = (index * 15.0) % 360.0
    deviation = ((angle - center + 180.0) % 360.0) - 180.0
    distance = max(0.0, 7.5 - abs(deviation))
    trigram_index = ((index + 1) // 3) % 8
    return {
        "mountain": MOUNTAINS[index], "mountain_index": index,
        "center_degrees": center,
        "start_degrees": (center - 7.5) % 360.0,
        "end_degrees": (center + 7.5) % 360.0,
        "offset_from_center_degrees": round(deviation, 9),
        "distance_to_mountain_boundary_degrees": round(distance, 9),
        "near_mountain_boundary": distance <= BOUNDARY_WARNING_DEGREES + 1e-9,
        "trigram": TRIGRAMS[trigram_index],
        "palace_number": PALACE_NUMBERS[trigram_index],
        "direction": COMPASS_POINTS[trigram_index],
        "element": TRIGRAM_ELEMENTS[trigram_index],
    }

def _mountain_table() -> list[dict]:
    result = []
    for i in range(24):
        row = _sector(i * 15.0)
        row["opposite_mountain"] = MOUNTAINS[(i + 12) % 24]
        result.append(row)
    return result

def _nine_palaces(sitting: dict, facing: dict) -> list[dict]:
    result=[]
    for place in PALACE_GRID:
        if place is None:
            result.append({
                "number": 5, "trigram": "中", "direction": "中央",
                "element": "土", "mountains": [], "is_center": True,
                "is_sitting": False, "is_facing": False
            })
            continue
        mountains = [MOUNTAINS[(3*place-1+j)%24] for j in range(3)]
        result.append({
            "number": PALACE_NUMBERS[place], "trigram": TRIGRAMS[place],
            "direction": COMPASS_POINTS[place], "element": TRIGRAM_ELEMENTS[place],
            "mountains": mountains, "is_center": False,
            "is_sitting": sitting["trigram"] == TRIGRAMS[place],
            "is_facing": facing["trigram"] == TRIGRAMS[place],
        })
    return result

def cast_fengshui(bearing_degrees: float, bearing_role: str = "facing",
                  north_reference: str = "true_north",
                  magnetic_declination_degrees: float | None = None) -> dict:
    """手动输入轴线角：磁偏角正东负西，真方位角=磁方位角+偏角。"""
    if bearing_role not in ("facing", "sitting"):
        raise ValueError("请明确输入的是朝向还是坐向。")
    if north_reference not in ("true_north", "magnetic_north"):
        raise ValueError("请明确输入角度相对真北还是磁北。")
    measured=_angle(bearing_degrees)
    if north_reference == "true_north":
        if magnetic_declination_degrees is not None:
            raise ValueError("真北读数不可额外输入磁偏角，避免重复校正。")
        declination=None
        reference_status="true_north_supplied_by_user"
        true_angle=measured
    else:
        if magnetic_declination_degrees is None:
            raise ValueError("使用磁北罗盘必须提供实测地的磁偏角；不能由网站猜测。")
        declination=float(magnetic_declination_degrees)
        if not math.isfinite(declination) or not -180.0 <= declination <= 180.0:
            raise ValueError("磁偏角须为−180°至180°之间的有限数字，东偏为正、西偏为负。")
        reference_status="manual_declination_unverified"
        true_angle=_normalized(measured + declination)
    if bearing_role=="facing":
        facing_angle=true_angle
        sitting_angle=_normalized(true_angle+180.0)
    else:
        sitting_angle=true_angle
        facing_angle=_normalized(true_angle+180.0)
    sitting=_sector(sitting_angle)
    facing=_sector(facing_angle)
    sitting["degrees"]=sitting_angle
    facing["degrees"]=facing_angle
    # 同轴恰好相差十二山，强制保留核验不变量，不由 AI 推演。
    if (sitting["mountain_index"]-facing["mountain_index"])%24!=12:
        raise ValueError("坐向计算在二十四山界线上出现不一致，请核查度数。")
    near=sitting["near_mountain_boundary"] or facing["near_mountain_boundary"]
    warnings=[]
    if near:
        warnings.append("当前度数距离二十四山分界不超过0.2°：按左闭右开区间暂列本山，但罗盘误差可能改变归山，请复测，不作确定立向。")
    if north_reference=="magnetic_north":
        warnings.append("磁偏角为用户手动提供，软件未按地点、日期或地磁模型验证；若偏角不准，真北归山也会改变。")
    warnings.append("本版仅计算静态方位：不自动确定房屋真实坐向、不推断吉凶；未实现玄空飞星、三元九运、分金和形势评估。")
    return {
        "version": "V70", "system": "堪舆风水",
        "status": "twenty_four_mountains_and_sitting_facing_computed",
        "input": {
            "bearing_degrees": measured, "bearing_role": bearing_role,
            "north_reference": north_reference,
            "magnetic_declination_degrees": declination,
            "declination_convention": "east_positive_west_negative",
            "verification": "user_supplied_bearing_not_field_verified",
        },
        "reference_status": reference_status,
        "true_bearing_degrees": true_angle,
        "sitting": sitting, "facing": facing,
        "axis_label": f"坐{sitting['mountain']}向{facing['mountain']}",
        "near_boundary": near, "boundary_threshold_degrees": BOUNDARY_WARNING_DEGREES,
        "twenty_four_mountains": _mountain_table(),
        "nine_palaces": _nine_palaces(sitting,facing),
        "compass_convention": {
            "degree_origin": "真北0°顺时针，东90°、南180°、西270°；360°视作0°",
            "bearing_role": "向为朝向，坐为其反方向，坐向相差180°",
            "mountain_intervals": "24山，每山15°；左闭右开，界点须复测",
            "nine_palace_orientation": "上南下北、左东右西；中五仅用于九宫图示，不入二十四山",
            "magnetic_declination": "真北角=磁北角+磁偏角；东偏为正，西偏为负；偏角只接收用户提供数值",
        },
        "warnings": warnings, "not_implemented": [
            "实地真北测量或设备定位", "自动地磁偏角查询", "玄空飞星和三元九运",
            "兼向与分金流派细算", "形势判断及吉凶断语"
        ], "sources": SOURCES,
    }
