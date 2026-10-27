// @vitest-environment jsdom
import React from 'react'
import {afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup} from '@testing-library/react'
import KnowledgeStage from '../src/KnowledgeStage.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})

const plate={子:'卯',丑:'辰',寅:'巳',卯:'午',辰:'未',巳:'申',午:'酉',未:'戌',申:'亥',酉:'子',戌:'丑',亥:'寅'}
const lessons=[
 {number:1,upper:'申',lower:'丙',upper_element:'金',lower_element:'火',from:'日干寄宫',relation:'下贼上'},
 {number:2,upper:'亥',lower:'申',upper_element:'水',lower_element:'金',from:'干上神',relation:'无直接克'},
 {number:3,upper:'丑',lower:'戌',upper_element:'土',lower_element:'土',from:'日支',relation:'无直接克'},
 {number:4,upper:'辰',lower:'丑',upper_element:'土',lower_element:'土',from:'支上神',relation:'无直接克'}]
const original={version:'V58',day_ganzhi:'丙戌',day_stem_lodge:'巳',
 hour_branch:'巳',month_general:'申',month_general_name:'传送',
 heaven_plate:plate,palaces:Object.entries(plate).map(([earth,heaven])=>({earth,heaven})),
 four_lessons:lessons,source:{earth_heaven_four_lessons:'https://zh.wikisource.org/'},
 calendar_provenance:{
  previous_middle_term:{name:'小满',beijing_time:'2026-05-21T09:00:00+08:00'},
  next_middle_term:{name:'夏至',beijing_time:'2026-06-21T18:00:00+08:00'},
  warnings:[]}}
const computed={...original,three_transmissions:{status:'computed',
 method:'下贼上（重审）',initial_candidates:['申'],
 transmissions:[{order:1,name:'初传',branch:'申'},
 {order:2,name:'中传',branch:'亥'},{order:3,name:'末传',branch:'寅'}]}}
const pending={...original,three_transmissions:{status:'pending',
 method:'需涉害判深浅',reason:'多贼克候选在比用后仍非唯一',
 initial_candidates:['子','戌'],transmissions:null}}

it('V58 real UI shows twelve plates, four lessons and known three transmissions',async()=>{
 const spy=vi.fn().mockResolvedValue({ok:true,json:async()=>computed})
 vi.stubGlobal('fetch',spy)
 render(<KnowledgeStage mode="liuren" onBack={()=>{}} onStudy={()=>{}}/>)
 fireEvent.change(screen.getByLabelText('六壬公历日期'),{target:{value:'2026-06-01'}})
 fireEvent.change(screen.getByLabelText('六壬北京时间'),{target:{value:'10:00'}})
 fireEvent.click(screen.getByRole('button',{name:'起大六壬天地盘'}))
 expect(await screen.findByText(/丙戌日 · 巳时/)).toBeTruthy()
 expect(JSON.parse(spy.mock.calls[0][1].body)).toEqual({
  solar_date:'2026-06-01',clock:'10:00',day_boundary:'zi_hour'})
 const twelve=screen.getByRole('group',{name:'大六壬十二宫天地盘'})
 expect(within(twelve).getAllByRole('button')).toHaveLength(12)
 expect(screen.getByRole('group',{name:'大六壬四课'}).textContent).toContain('第 4 课')
 expect(screen.getByRole('group',{name:'大六壬三传'}).textContent).toContain('初传')
 fireEvent.click(within(twelve).getAllByRole('button')[0])
 expect(screen.getByText(/所选地盘 子/)).toBeTruthy()
})

it('V58 unknown nine-method case explicitly pending, never invent triple',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>pending}))
 render(<KnowledgeStage mode="liuren" onBack={()=>{}} onStudy={()=>{}}/>)
 fireEvent.click(screen.getByRole('button',{name:'起大六壬天地盘'}))
 expect(await screen.findByText('此课三传尚未完成核验')).toBeTruthy()
 expect(screen.getByText(/需涉害判深浅/)).toBeTruthy()
 expect(screen.queryByRole('group',{name:'大六壬三传'})).toBeNull()
})
