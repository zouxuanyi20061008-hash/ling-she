// @vitest-environment jsdom
import React from 'react'
import {afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup,act} from '@testing-library/react'
import LiurenV58 from '../src/LiurenV58.jsx'

afterEach(()=>{cleanup();vi.unstubAllGlobals()})
const branches='子丑寅卯辰巳午未申酉戌亥'.split('')
const fixture={
 version:'V63',audit_version:'V74',
 day_ganzhi:'丁卯',day_stem_lodge:'未',hour_branch:'未',
 month_general:'未',month_general_name:'小吉',
 heaven_plate:Object.fromEntries(branches.map(x=>[x,x])),
 palaces:branches.map(x=>({earth:x,heaven:x})),
 four_lessons:[{number:1,upper:'未',lower:'丁',upper_element:'土',
  lower_element:'火',relation:'无直接克',from:'日干寄宫'}],
 three_transmissions:{
  status:'computed',method:'伏吟·自信 · 卯子互刑杜传取子冲午',
  initial_candidates:[],transmissions:[
   {order:1,name:'初传',branch:'卯'},
   {order:2,name:'中传',branch:'子'},
   {order:3,name:'末传',branch:'午'}]
 },
 pending_branch_review:{
   version:'V74',status:'computed',category:'fuyin_reciprocal_punishment',
   label:'伏吟卯子互刑特例，改冲午',classical_exception_applied:true,
   candidate_branches:[],three_transmissions:['卯','子','午'],
   source:'https://www.zhaosir.online/Books/BookChapterDetail.aspx?did=1650'
 },
 calendar_provenance:{
  previous_middle_term:{name:'夏至',beijing_time:'2026-06-21T17:00:00+08:00'},
  next_middle_term:{name:'大暑',beijing_time:'2026-07-23T12:00:00+08:00'},
  warnings:[]},
 source:{earth_heaven_four_lessons:'https://zh.wikisource.org/zh/六壬指南'}
}
const pendingReview={
 version:'V74',status:'pending',category:'fanyin_multi_conflict',
 label:'反吟多贼克需涉害',
 method:'反吟多贼克仍需涉害',
 reason:'多个候选，阴阳比用不唯一',
 candidate_branches:['寅','申'],candidate_count:2,
 can_auto_select:false,three_transmissions:null,
 next_check:'必须核对反吟涉害经典实例',
 source:'https://libokang.com/classics/liuren/六壬粹言/',
}
it('V74 shows Mao Zi Wu classical exception and does not change genuine three transmissions',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>fixture}))
 render(<LiurenV58/>)
 fireEvent.click(screen.getByRole('button',{name:'起大六壬天地盘'}))
 const section=await screen.findByRole('group',{name:'V74 大六壬三传古籍例外与未决审查'})
 expect(section.textContent).toContain('伏吟卯子互刑特例')
 expect(section.textContent).toContain('卯 → 子 → 午')
 expect(section.textContent).toContain('不自动断吉凶')
 const triple=screen.getByRole('group',{name:'大六壬三传'})
 expect(triple.textContent).toContain('卯')
 expect(triple.textContent).toContain('子')
 expect(triple.textContent).toContain('午')
 expect(screen.getByText(/V62 十二天将、V63 日旬遁干与旬空实算/)).toBeTruthy()
})

it('V74 pending shows exact unresolved category but no imaginary transmissions',async()=>{
 const pending={...fixture,
  three_transmissions:{status:'pending',method:'反吟多贼克仍需涉害',
    reason:'多个候选，阴阳比用不唯一',initial_candidates:['寅','申'],transmissions:null},
  pending_branch_review:pendingReview}
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>pending}))
 render(<LiurenV58/>)
 fireEvent.click(screen.getByRole('button',{name:'起大六壬天地盘'}))
 const section=await screen.findByRole('group',{name:'V74 大六壬三传古籍例外与未决审查'})
 expect(section.textContent).toContain('反吟多贼克需涉害')
 expect(section.textContent).toContain('寅、申')
 expect(section.textContent).toContain('不自动推算中末')
 expect(screen.queryByRole('group',{name:'大六壬三传'})).toBeNull()
 expect(screen.getByRole('status').textContent).toContain('此课三传尚未完成核验')
})

it('V74 if input is edited mid-request old completion cannot override new input',async()=>{
 let finish
 const fetcher=vi.fn(()=>new Promise(resolve=>{finish=resolve}))
 vi.stubGlobal('fetch',fetcher)
 render(<LiurenV58/>)
 fireEvent.click(screen.getByRole('button',{name:'起大六壬天地盘'}))
 expect(fetcher).toHaveBeenCalledTimes(1)
 fireEvent.change(screen.getByLabelText('六壬北京时间'),{target:{value:'15:00'}})
 await act(async()=>finish({ok:true,json:async()=>fixture}))
 expect(screen.queryByRole('group',{name:'V74 大六壬三传古籍例外与未决审查'})).toBeNull()
 expect(screen.getByRole('button',{name:'起大六壬天地盘'}).disabled).toBe(false)
})

it('V74 old V63 response without new audit stays readable',async()=>{
 const {audit_version,pending_branch_review,...old}=fixture
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>old}))
 render(<LiurenV58/>)
 fireEvent.click(screen.getByRole('button',{name:'起大六壬天地盘'}))
 expect(await screen.findByRole('group',{name:'大六壬三传'})).toBeTruthy()
 expect(screen.queryByRole('group',{name:'V74 大六壬三传古籍例外与未决审查'})).toBeNull()
})
