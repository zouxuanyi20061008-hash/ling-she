"""V64 genuine annual accumulation: 1561/1624 ancient examples and all boundary cycles."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.taiyi import year_board,cast_taiyi,YEARLY_RING,YUAN_NAMES

@pytest.mark.parametrize("year,acc,cycle,yuan,ju,palace,tenure,jishen",[
 (1561,10155478,238,4,22,9,"理天","巳"),
 (1624,10155541,301,5,13,6,"理天","寅"),
 (1625,10155542,302,5,14,6,"理地","丑"),
 (1626,10155543,303,5,15,6,"理人","子"),
 (2024,10155941,341,5,53,2,"理地","戌"),
 (2026,10155943,343,5,55,3,"理天","申"),
])
def test_classical_annual_year_yuan_ju_palace(year,acc,cycle,yuan,ju,palace,tenure,jishen):
    v=year_board(year,historical=True)
    annual=v["year"]
    assert annual["accumulated_years"]==acc
    assert annual["in_cycle_number"]==cycle
    assert (annual["five_yuan_number"],annual["ju"],annual["taiyi_palace"]["number"])==(yuan,ju,palace)
    assert annual["year_governing"]==tenure
    assert annual["jishen"]==jishen
    assert len(v["nine_palaces"])==9


def test_historical_witness_stays_reference_not_fabricated_calculation():
    a=year_board(1624,historical=True)
    b=year_board(1561,historical=True)
    assert a["main_guest"]["source_if_attested"]["main_count"]==18
    assert a["main_guest"]["source_if_attested"]["guest_count"]==19
    assert b["main_guest"]["source_if_attested"]["main_count"]==16
    assert b["main_guest"]["source_if_attested"]["guest_count"]==30
    assert not a["has_complete_main_guest"]
    assert a["main_guest"]["main_calculated"] is None
    assert year_board(2026)["main_guest"]["source_if_attested"] is None


def test_taiyi_ring_not_lo_shu_and_center_not_occupied():
    assert [(n,g) for n,g,_ in YEARLY_RING]==[
      (1,"乾"),(2,"离"),(3,"艮"),(4,"震"),(6,"兑"),(7,"坤"),(8,"坎"),(9,"巽")]
    for v in range(1,73):
        # Ancient year 1561 ju22; shift to arbitrary desired Ju.
        year=1561+v-22
        a=year_board(year,historical=True)
        assert a["year"]["ju"]==v
        idx=(v-1)//3
        assert a["year"]["taiyi_palace"]["number"]==YEARLY_RING[idx%8][0]
        assert a["year"]["year_governing"]==("理天","理地","理人")[(v-1)%3]
        assert not any(x["is_taiyi"] for x in a["nine_palaces"] if x["number"]==5)
        assert sum(bool(x["is_taiyi"]) for x in a["nine_palaces"])==1


def test_three_year_palace_shift_and_24_72_360_year_cycles():
    for base in (1561,1624,1901,2026):
        here=year_board(base,historical=True)
        assert year_board(base+1,historical=True)["year"]["ju"]==(here["year"]["ju"]%72)+1
        plus24=year_board(base+24,historical=True)
        plus72=year_board(base+72,historical=True)
        plus360=year_board(base+360,historical=True)
        assert plus24["year"]["taiyi_palace"]==here["year"]["taiyi_palace"]
        assert plus72["year"]["ju"]==here["year"]["ju"]
        assert plus360["year"]["five_yuan_number"]==here["year"]["five_yuan_number"]
        assert plus360["year"]["ju"]==here["year"]["ju"]


def test_whole_public_calendar_range_and_ancient_constancy():
    for year in range(1901,2100):
        a=cast_taiyi(year)
        assert a["year"]["gregorian_year"]==year
        assert a["year"]["direction"]=="阳遁"
        assert a["year"]["taiyi_palace"]["number"] in (1,2,3,4,6,7,8,9)
        assert a["year"]["five_yuan_name"] in YUAN_NAMES
        assert len(a["nine_palaces"])==9
        assert a["main_guest"]["status"]=="pending"
        assert a["fortune_verdict"] is None


def test_out_of_bounds_or_type_does_not_silently_calculate():
    for item in (-1,0,1899,2100,True,2026.0,"2026",None):
        with pytest.raises(ValueError):
            cast_taiyi(item)


def test_api_year_input_and_ancient_rollover_422():
    cli=TestClient(app)
    for year in (1901,2024,2026,2099):
        r=cli.post("/api/taiyi/cast",json={"gregorian_year":year})
        assert r.status_code==200,r.text
        assert r.json()["version"]=="V64"
        assert r.json()["year"]["gregorian_year"]==year
    for year in (1561,1624,2100,-1,"hello"):
        r=cli.post("/api/taiyi/cast",json={"gregorian_year":year})
        assert r.status_code==422,r.text
