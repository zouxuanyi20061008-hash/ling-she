// @vitest-environment jsdom
import React from 'react'
import {afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup} from '@testing-library/react'
import KnowledgeStage from '../src/KnowledgeStage.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})

const palaces=[
 [9,'巽','东南'],[2,'离','南'],[7,'坤','西南'],
 [4,'震','东'],[5,'中','中央'],[6,'兑','西'],
 [3,'艮','东北'],[8,'坎','北'],[1,'乾','西北']]
const chart={
 version:'V64',year:{gregorian_year:2026,accumulated_years:10155943,
 five_yuan_name:'壬子元',five_yuan_number:5,ju_label:'阳遁55局',ju:55,
 in_cycle_number:343,jishen:'申',sexagenary_year:'丙午',
 full_360_year_cycles:100,three_year_cycle:19,year_governing:'理天',
 year_of_palace:1,taiyi_palace:{number:3,trigram:'艮',direction:'东北'}},
 palace_ring:[{number:1,trigram:'乾'},{number:2,trigram:'离'},
 {number:3,trigram:'艮'},{number:4,trigram:'震'},
 {number:6,trigram:'兑'},{number:7,trigram:'坤'},
 {number:8,trigram:'坎'},{number:9,trigram:'巽'}],
 nine_palaces:palaces.map(([number,trigram,direction])=>({
 number,trigram,direction,is_taiyi:number===3,is_center_unoccupied:number===5})),
 main_guest:{status:'pending',source_if_attested:null,reason:'未完成十六神及投算'},
 sources:{historical_1624:'https://zh.wikisource.org/wiki/',
 historical_1561:'https://www.shidianguji.com/'}
}
it('V64 real annual year input outputs historical-cycle Taiyi octagonal nine grid and honest host-guest pending',async()=>{
 const spy=vi.fn().mockResolvedValue({ok:true,json:async()=>chart})
 vi.stubGlobal('fetch',spy)
 render(<KnowledgeStage mode="taiyi" onBack={()=>{}} onStudy={()=>{}}/>)
 fireEvent.change(screen.getByLabelText('太乙岁计公历年'),{target:{value:'2026'}})
 fireEvent.click(screen.getByRole('button',{name:'计算太乙年局'}))
 expect(await screen.findByText(/2026年 · 壬子元 · 阳遁55局/)).toBeTruthy()
 expect(JSON.parse(spy.mock.calls[0][1].body)).toEqual({gregorian_year:2026})
 expect(spy.mock.calls[0][0]).toBe('/api/taiyi/cast')
 const grid=screen.getByRole('group',{name:'太乙式九宫岁计盘'})
 expect(within(grid).getAllByRole('button')).toHaveLength(9)
 expect(within(grid).getByText('3宫 · 艮')).toBeTruthy()
 expect(within(grid).getByText('中五不游')).toBeTruthy()
 expect(screen.getByText(/本年主算、客算不输出/)).toBeTruthy()
 expect(screen.getByText(/太乙在 3宫艮/)).toBeTruthy()
})
it('V64 validates typed year and does not make historical uncomputed host and guest into numbers',async()=>{
 const spy=vi.fn().mockResolvedValue({ok:true,json:async()=>({
 ...chart,year:{...chart.year,gregorian_year:1624},
 main_guest:{status:'historical_witness_only',reason:'尚未实现文昌始击',
 source_if_attested:{main_count:18,guest_count:19}}})})
 vi.stubGlobal('fetch',spy)
 render(<KnowledgeStage mode="taiyi" onBack={()=>{}} onStudy={()=>{}}/>)
 const field=screen.getByLabelText('太乙岁计公历年')
 fireEvent.change(field,{target:{value:'1900'}})
 fireEvent.click(screen.getByRole('button',{name:'计算太乙年局'}))
 expect(spy).not.toHaveBeenCalled()
 fireEvent.change(field,{target:{value:'2026'}})
 fireEvent.click(screen.getByRole('button',{name:'计算太乙年局'}))
 expect(await screen.findByText(/仅为古籍原文校验值/)).toBeTruthy()
 expect(screen.getByText(/主算18、客算19/)).toBeTruthy()
})
