from datetime import datetime, timezone
from app.core.hexagrams import arrange
from app.core.casting import cast
def test_moving_yin_yang():
    result=arrange(4,4,8)
    assert result["ben_gua"]["name"]=="震"
    assert result["dong_yao"]==2
def test_number_cast():
    result=cast("3,6",datetime(2026,10,22,12,0,tzinfo=timezone.utc))
    assert result["method_numbers"]["upper"]==3
    assert result["method_numbers"]["lower"]==6
