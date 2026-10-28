// @vitest-environment jsdom
import React from 'react'
import {it,afterEach,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup} from '@testing-library/react'
import TaiyiV77Hour from '../src/TaiyiV77Hour.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
const src={
 canonical_eight_door_compass:'https://www.shidianguji.com/book/SDZJ0646/chapter/1kg32q85u563p',
 time_chief_taiyi_main_guest:'https://www.shidianguji.com/zh/book/SK1615/chapter/1l9lir739jmyy',
 ancient_dingji_eye_variant:'https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkvlnkx7u'
}
const doors=['开','休','生','伤','杜','景','死','惊']
const palaces=[1,8,3,4,9,2,7,6]
const directions=['乾','坎','艮','震','巽','离','坤','兑']
function rotation(id,palace){
 const i=palaces.indexOf(palace),d=doors.indexOf('生')
 const slots=palaces.map((_,step)=>({
   step,palace:palaces[(i+step)%8],direction:directions[(i+step)%8],
   door:doors[(d+step)%8],is_chief_anchor:step===0
 }))
 return {school:id,chief:'生',anchor_palace:palace,
   anchor_direction:directions[i],
   slots,
   by_palace:Object.fromEntries(slots.map(s=>[String(s.palace),s.door])),
   by_door:Object.fromEntries(slots.map(s=>[s.door,s.palace])),
   anchor_source:id==='jinyao_dingji_eye'?src.ancient_dingji_eye_variant:src.time_chief_taiyi_main_guest,
   verified_as_single_complete_hour_chart:false}
}
const v82={version:'V82',chief:'生',chief_hour_in_30:17,
 candidate_count:3,
 candidates:[
   rotation('jinjing_taiyi',9),
   rotation('jinjing_main',6),
   rotation('jinjing_guest',3)
 ],unplaceable:[{school:'jinyao_dingji_eye',reason:'定计目在十六神间位，不能强制映射到八正宫',
   eye_direction:'巳'}],
 source_support:src,which_school_is_default:null,complete_eight_door_chart_verified:false}
const trig={9:'巽',2:'离',7:'坤',4:'震',5:'中',6:'兑',3:'艮',8:'坎',1:'乾'}
const base={
 version:'V77',historical_ju_version:'V78',main_guest_version:'V79',
 input:{solar_date:'2026-12-23',clock:'10:30:00',hour_branch:'巳'},
 solstice:{name:'冬至',started_at_beijing:'2026-12-22T04:20:00+08:00',
   near_15_minutes:false},
 time_cycle:{dun:'阳遁',relative_time_count:16,relative_count_in_24:16,
   hours_in_current_palace:1},
 taiyi_palace:{number:7,trigram:'坤'},
 jishen:{branch:'亥',direction:'逆行十二支',movement:'一时一移'},
 nine_palaces:[9,2,7,4,5,6,3,8,1].map(number=>({
   number,trigram:trig[number],is_taiyi:number===7,is_middle_unvisited:number===5
 })),
 sources:{zhou:'https://zh.wikisource.org/zh/太乙金鏡式經',
  hour_example:'https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkylq3yn8'},
 hour_v82_eight_door_schools:v82
}

it('V82 distinguishes mathematically complete candidate map from independently verified full hour chart',async()=>{
 const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>base})
 vi.stubGlobal('fetch',fetcher)
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 const section=await screen.findByRole('group',{name:'V82 太乙时计四派八门古籍旋宫候选'})
 expect(section.textContent).toContain('生门')
 expect(section.textContent).toContain('门内第17时')
 expect(section.textContent).toContain('非唯一已验真的完整时计式')
 const grid=within(section).getByRole('group',{name:'V82 当前古法候选八门九宫布局'})
 expect(grid.querySelectorAll('.taiyi-v82-cell')).toHaveLength(9)
 expect(grid.querySelectorAll('.is-center')).toHaveLength(1)
 expect(grid.querySelectorAll('.is-anchor')).toHaveLength(1)
 expect(grid.textContent).toContain('9宫生门')
 expect(grid.textContent).toContain('5宫中五不布门')
 expect(within(section).getAllByRole('link')).toHaveLength(3)
 expect(fetcher.mock.calls[0][0]).toBe('/api/taiyi/hour/cast')
})

it('V82 select changes anchor and every door without changing source epoch data',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>base}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 const section=await screen.findByRole('group',{name:'V82 太乙时计四派八门古籍旋宫候选'})
 const chooser=within(section).getByRole('combobox',{name:'V82 选择太乙八门古籍起宫法'})
 expect(chooser.options).toHaveLength(3)
 fireEvent.change(chooser,{target:{value:'jinjing_main'}})
 let grid=within(section).getByRole('group',{name:'V82 当前古法候选八门九宫布局'})
 expect(grid.textContent).toContain('6宫生门')
 expect(grid.querySelectorAll('.is-anchor')).toHaveLength(1)
 fireEvent.change(chooser,{target:{value:'jinjing_guest'}})
 grid=within(section).getByRole('group',{name:'V82 当前古法候选八门九宫布局'})
 expect(grid.textContent).toContain('3宫生门')
 expect(grid.textContent).toContain('中五不布门')
 fireEvent.click(within(section).getByText('核对这一古法候选的八方逐宫路径及原典'))
 const trace=within(section).getByRole('group',{name:'V82 古法八门逐宫候选轨迹'})
 expect(trace.querySelectorAll('span')).toHaveLength(8)
 expect(trace.textContent).toContain('生门')
 expect(trace.textContent).toContain('直使候选起点')
})

it('V82 refused Dingji intermediate cannot be selected as a nine-palace variant',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>base}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 const section=await screen.findByRole('group',{name:'V82 太乙时计四派八门古籍旋宫候选'})
 const select=within(section).getByRole('combobox',{name:'V82 选择太乙八门古籍起宫法'})
 expect(Array.from(select.options).map(z=>z.value)).not.toContain('jinyao_dingji_eye')
 fireEvent.click(within(section).getByText('查看无法安宫的来源（1条）'))
 const unresolved=within(section).getByRole('group',{name:'V82 未决八门起宫来源'})
 expect(unresolved.textContent).toContain('直使加定计目')
 expect(unresolved.textContent).toContain('巳')
 expect(unresolved.textContent).toContain('不能强制映射到八正宫')
})

it('V82 old V81 response does not fabricate an eight-door map',async()=>{
 const {hour_v82_eight_door_schools,...legacy}=base
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>legacy}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 expect(await screen.findByRole('region',{name:'V77 太乙时计八宫与计神结果'})).toBeTruthy()
 expect(screen.queryByRole('group',{name:'V82 太乙时计四派八门古籍旋宫候选'})).toBeNull()
})
