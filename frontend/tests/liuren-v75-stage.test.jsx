// @vitest-environment jsdom
import React from 'react'
import {afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,cleanup,within,act} from '@testing-library/react'
import LiurenV58 from '../src/LiurenV58.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})

const branches='子丑寅卯辰巳午未申酉戌亥'.split('')
const sky=Object.fromEntries(branches.map((x,i)=>[x,branches[(i+6)%12]]))
const examples=[
 {upper:'亥',actual_ground_palace:'巳',lesson_numbers:[1],
   shehai_trace:{depth:4,path:['巳','午','未','申','酉','戌','亥']},
   shehai_excluding_start:{depth:3}},
 {upper:'巳',actual_ground_palace:'亥',lesson_numbers:[2],
   shehai_trace:{depth:4,path:['亥','子','丑','寅','卯','辰','巳']},
   shehai_excluding_start:{depth:4}},
]
const methods={
  tanyuan:{first:'亥',transmissions:['亥','巳','亥'],source:'https://dclef.com/tanyuan'},
  cunyan:{first:'巳',transmissions:['巳','亥','巳'],source:'https://libokang.com/cunyan'}
}
const base={
 version:'V63',audit_version:'V74',
 day_ganzhi:'戊辰',day_stem_lodge:'巳',hour_branch:'辰',
 month_general:'戌',month_general_name:'河魁',heaven_plate:sky,
 palaces:branches.map(earth=>({earth,heaven:sky[earth]})),
 four_lessons:[{number:1,lower:'戊',upper:'亥',lower_element:'土',
   upper_element:'水',relation:'下贼上',from:'日干寄宫'}],
 calendar_provenance:{
   previous_middle_term:{name:'春分',beijing_time:'2026-03-20T12:00:00+08:00'},
   next_middle_term:{name:'谷雨',beijing_time:'2026-04-20T12:00:00+08:00'},
   warnings:[]},
 source:{earth_heaven_four_lessons:'https://zh.wikisource.org/zh/六壬指南'},
 pending_branch_review:{version:'V74',status:'pending',label:'反吟多克需涉害',
   category:'fanyin_multi_conflict',method:'反吟多贼克仍需涉害',
   reason:'循宫同深未选定原典',candidate_branches:['亥','巳'],
   next_check:'用户选原典',source:'https://libokang.com/'},
 three_transmissions:{status:'pending',method:'反吟多贼克仍需涉害',
   reason:'循宫同深未选定原典',initial_candidates:['亥','巳'],transmissions:null},
 fanyin_shehai_v75:{
   version:'V75',applied:true,status:'pending',original_candidates:['亥','巳'],
   candidate_details:examples,school_selection:'pending',decision_rule:'unresolved_equal_depth',
   selected_initial:null,historical_alternatives:methods,
   reason_pending:'同深复等存在独立古籍取法差异，默认维持待判。'
 },
}

it('V75 default keeps equal-depth historical ambiguity and shows two independent sources',async()=>{
 const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>base})
 vi.stubGlobal('fetch',fetcher)
 render(<LiurenV58/>)
 fireEvent.click(screen.getByRole('button',{name:'起大六壬天地盘'}))
 const section=await screen.findByRole('group',{name:'V75 反吟多克逐宫涉害与古籍流派'})
 expect(section.textContent).toContain('计首宫 4 重')
 expect(section.textContent).toContain('不计首宫 3 重')
 expect(section.textContent).toContain('亥 → 巳 → 亥')
 expect(section.textContent).toContain('巳 → 亥 → 巳')
 expect(section.textContent).toContain('默认维持待判')
 expect(within(section).getAllByText('原文')).toHaveLength(2)
 expect(screen.queryByRole('group',{name:'大六壬三传'})).toBeNull()
 const request=JSON.parse(fetcher.mock.calls[0][1].body)
 expect(request.fanyin_tie_school).toBeUndefined()
})

it('V75 explicit Tanyuan selection changes only its named API field',async()=>{
 const successful={...base,
   three_transmissions:{status:'computed',method:'反吟·有克·复等显式古籍取法',
     initial_candidates:['亥','巳'],transmissions:[
       {order:1,name:'初传',branch:'亥'},
       {order:2,name:'中传',branch:'巳'},
       {order:3,name:'末传',branch:'亥'}]},
   pending_branch_review:{status:'computed',label:'已按现有口径计算三传',
     classical_exception_applied:false,three_transmissions:['亥','巳','亥'],
     source:'https://dclef.com/tanyuan'},
   fanyin_shehai_v75:{...base.fanyin_shehai_v75,
     status:'computed',school_selection:'tanyuan',
     selected_initial:'亥',decision_rule:'explicit_classical_school'}
 }
 const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>successful})
 vi.stubGlobal('fetch',fetcher)
 render(<LiurenV58/>)
 fireEvent.change(screen.getByLabelText('反吟复等古籍取法'),{target:{value:'tanyuan'}})
 fireEvent.click(screen.getByRole('button',{name:'起大六壬天地盘'}))
 expect(await screen.findByRole('group',{name:'V75 反吟多克逐宫涉害与古籍流派'})).toBeTruthy()
 const payload=JSON.parse(fetcher.mock.calls[0][1].body)
 expect(payload.fanyin_tie_school).toBe('tanyuan')
 expect(screen.getByRole('group',{name:'大六壬三传'}).textContent).toContain('亥')
 fireEvent.change(screen.getByLabelText('反吟复等古籍取法'),{target:{value:'pending'}})
 expect(screen.queryByRole('group',{name:'大六壬三传'})).toBeNull()
})

it('V75 legacy API without new branch evidence remains safe and readable',async()=>{
 const {fanyin_shehai_v75,...old}=base
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>old}))
 render(<LiurenV58/>)
 fireEvent.click(screen.getByRole('button',{name:'起大六壬天地盘'}))
 expect(await screen.findByText('此课三传尚未完成核验')).toBeTruthy()
 expect(screen.queryByRole('group',{name:'V75 反吟多克逐宫涉害与古籍流派'})).toBeNull()
})
