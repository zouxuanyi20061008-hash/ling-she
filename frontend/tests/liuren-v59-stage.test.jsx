// @vitest-environment jsdom
import React from 'react'
import {afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup} from '@testing-library/react'
import LiurenV58 from '../src/LiurenV58.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
const branches=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']
const plate=Object.fromEntries(branches.map((s,i)=>[s,branches[(i+3)%12]]))
const common={version:'V59',day_ganzhi:'庚戌',day_stem_lodge:'申',
 hour_branch:'丑',month_general:'辰',month_general_name:'天罡',
 heaven_plate:plate,palaces:branches.map(earth=>({earth,heaven:plate[earth]})),
 four_lessons:[
  {number:1,from:'日干寄宫',lower:'庚',upper:'亥',lower_element:'金',upper_element:'水',relation:'无直接克'},
  {number:2,from:'干上神',lower:'亥',upper:'寅',lower_element:'水',upper_element:'木',relation:'无直接克'},
  {number:3,from:'日支',lower:'戌',upper:'丑',lower_element:'土',upper_element:'土',relation:'无直接克'},
  {number:4,from:'支上神',lower:'丑',upper:'辰',lower_element:'土',upper_element:'土',relation:'无直接克'}
 ],
 calendar_provenance:{previous_middle_term:{name:'春分',beijing_time:'2026-03-20T10:00:00+08:00'},
 next_middle_term:{name:'谷雨',beijing_time:'2026-04-20T10:00:00+08:00'},warnings:[]},
 source:{earth_heaven_four_lessons:'https://zh.wikisource.org/wiki/六壬指南'},
 has_full_nine_methods:false}
it('V59 renders remote method provenance and genuine transmission',async()=>{
 const d={...common,transmission_review:{method_family:'遥克',offset_palaces:3},
 three_transmissions:{status:'computed',method:'遥克·弹射（日干遥克上神）',
 initial_candidates:['寅'],transmissions:[{order:1,name:'初传',branch:'寅'},
 {order:2,name:'中传',branch:'巳'},{order:3,name:'末传',branch:'申'}],rule_audit:{}}}
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>d}))
 render(<LiurenV58/>)
 fireEvent.click(screen.getByRole('button',{name:'起大六壬天地盘'}))
 expect(await screen.findByText(/V59 取传门类：遥克/)).toBeTruthy()
 expect(screen.getByText(/遥克·弹射/)).toBeTruthy()
 expect(screen.getByRole('group',{name:'大六壬三传'}).textContent).toContain('末传')
})
it('V59 shehai keeps multiple auditable candidates without invented result',async()=>{
 const d={...common,transmission_review:{method_family:'涉害审计（未自动发用）',offset_palaces:10},
 three_transmissions:{status:'pending',method:'涉害·候选分析已完成，计害流派待验',
 reason:'仍有多贼克候选，等待独立计害校验',
 initial_candidates:['戌','午'],transmissions:null,
 rule_audit:{candidate_details:[
 {upper:'戌',lesson_numbers:[2],lowers:['子'],lowers_lodges:['子'],
 candidate_branch_class:'季',same_yin_yang_as_day:true},
 {upper:'午',lesson_numbers:[3],lowers:['申'],lowers_lodges:['申'],
 candidate_branch_class:'仲',same_yin_yang_as_day:true}]}}}
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>d}))
 render(<LiurenV58/>)
 fireEvent.click(screen.getByRole('button',{name:'起大六壬天地盘'}))
 expect(await screen.findByText('此课三传尚未完成核验')).toBeTruthy()
 const group=screen.getByRole('group',{name:'涉害候选审计'})
 expect(within(group).getByText('候选上神 戌')).toBeTruthy()
 expect(within(group).getByText('候选上神 午')).toBeTruthy()
 expect(screen.queryByRole('group',{name:'大六壬三传'})).toBeNull()
})
