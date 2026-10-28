// @vitest-environment jsdom
import React from 'react'
import {it,afterEach,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup} from '@testing-library/react'
import TaiyiV77Hour from '../src/TaiyiV77Hour.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})

const trig={9:'巽',2:'离',7:'坤',4:'震',5:'中',6:'兑',3:'艮',8:'坎',1:'乾'}
const doors=['开','休','生','伤','杜','景','死','惊']
const palaces=[1,8,3,4,9,2,7,6]
function rotate(origin,chief){
 const a=palaces.indexOf(origin),c=doors.indexOf(chief)
 const slots=palaces.map((_,i)=>({
   palace:palaces[(a+i)%8],door:doors[(c+i)%8]}))
 return {by_palace:Object.fromEntries(slots.map(x=>[String(x.palace),x.door])),
  by_door:Object.fromEntries(slots.map(x=>[x.door,x.palace]))}
}
const qSource={
 hour_palace_jishen:'https://zh.wikisource.org/zh-hans/太乙金鏡式經_(四庫全書本)/卷01',
 chief_and_general_motion:'https://www.shidianguji.com/zh/book/SK1615/chapter/1l9lir739jmyy'}
const base={
 version:'V77',
 input:{solar_date:'2026-06-22',clock:'09:30:00',hour_branch:'巳'},
 solstice:{name:'夏至',started_at_beijing:'2026-06-21T16:20:00+08:00',
   near_15_minutes:false},
 time_cycle:{dun:'阴遁',relative_time_count:9,relative_count_in_24:9,
   hours_in_current_palace:3},
 taiyi_palace:{number:7,trigram:'坤'},
 jishen:{branch:'午',direction:'逆行十二支',movement:'一时一移'},
 nine_palaces:[9,2,7,4,5,6,3,8,1].map(number=>({
   number,trigram:trig[number],is_taiyi:number===7,is_middle_unvisited:number===5
 })),
 sources:{zhou:'https://zh.wikisource.org/zh/太乙金鏡式經',
 hour_example:'https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkylq3yn8'}
}
const v84={
 version:'V84',
 qiying:{taiyi_palace:{number:7,trigram:'坤'},jishen:'午',
   hour_chief:{chief_door:'杜'},
   taiyi_eight_door_conditional_rotation:rotate(7,'杜'),
   qiying_main_general:{palace:null},qiying_guest_general:{palace:null},
   source:qSource},
 jiazi:{taiyi_palace:{number:3,trigram:'艮'},
   hour_chief:{chief_door:'死'},
   taiyi_eight_door_conditional_rotation:rotate(3,'死'),
   may_be_reused_as_qiying_general:false},
 same_chief:false,same_taiyi_palace:false,
 same_conditional_taiyi_door_rotation:false
}
it('V84 renders separate Taiyi-anchored source-specific nine-palace candidate boards',async()=>{
 const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({
   ...base,hour_v84_qiying_plate:v84
 })})
 vi.stubGlobal('fetch',fetcher)
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 const s=await screen.findByRole('group',{name:'V84 气应与甲子派独立太乙八门候选九宫对照'})
 expect(s.textContent).toContain('太乙7宫坤')
 expect(s.textContent).toContain('计神')
 expect(s.textContent).toContain('杜门')
 expect(s.textContent).toContain('太乙 3宫')
 expect(s.textContent).toContain('死门')
 expect(s.textContent).toContain('两派直使门名不同')
 expect(s.textContent).toContain('太乙落宫不同')
 expect(s.textContent).toContain('两张八门条件图不同')
 const qi=within(s).getByRole('group',{name:'V84 王希明二至气应八门条件九宫图'})
 const jiazi=within(s).getByRole('group',{name:'V84 前甲子日简捷八门条件九宫图'})
 expect(qi.children).toHaveLength(9)
 expect(jiazi.children).toHaveLength(9)
 expect(qi.textContent).toContain('7宫杜门')
 expect(jiazi.textContent).toContain('3宫死门')
 expect(qi.textContent).toContain('5宫中五')
 expect(s.textContent).toContain('气应主大将与客大将均待判')
 expect(s.textContent).toContain('不是独立古籍验真的完整八门实盘')
 expect(within(s).getAllByRole('link')).toHaveLength(2)
 expect(fetcher.mock.calls[0][0]).toBe('/api/taiyi/hour/cast')
})
it('V84 identical conditional plate never promotes two epochs into full attested chart',async()=>{
 const equal={...v84,jiazi:{...v84.jiazi,
    taiyi_palace:{number:7,trigram:'坤'},
    hour_chief:{chief_door:'杜'},
    taiyi_eight_door_conditional_rotation:rotate(7,'杜')},
    same_chief:true,same_taiyi_palace:true,same_conditional_taiyi_door_rotation:true}
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({
   ...base,hour_v84_qiying_plate:equal
 })}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 const s=await screen.findByRole('group',{name:'V84 气应与甲子派独立太乙八门候选九宫对照'})
 expect(s.textContent).toContain('两派直使门名相同')
 expect(s.textContent).toContain('太乙落宫相同')
 expect(s.textContent).toContain('两张八门条件图恰好相同')
 expect(s.textContent).toContain('也不证明起元相同或完整时计已验真')
 expect(s.textContent).toContain('主大将与客大将均待判')
})
it('V84 old V83 API response is not embellished with imaginary school charts',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>base}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 expect(await screen.findByRole('region',{name:'V77 太乙时计八宫与计神结果'})).toBeTruthy()
 expect(screen.queryByRole('group',{name:'V84 气应与甲子派独立太乙八门候选九宫对照'}))
   .toBeNull()
})
