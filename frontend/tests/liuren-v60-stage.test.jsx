// @vitest-environment jsdom
import React from 'react'
import {afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup} from '@testing-library/react'
import LiurenV58 from '../src/LiurenV58.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})

const branches=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']
const sky=Object.fromEntries(branches.map((v,i)=>[v,branches[(i+9)%12]]))
const lesson=(number,upper,lower)=>({number,upper,lower,from:'古籍四课',
 lower_element:'木',upper_element:'水',relation:'无直接克'})
const common={version:'V60',day_ganzhi:'甲寅',day_stem_lodge:'寅',
 hour_branch:'辰',month_general:'丑',month_general_name:'大吉',
 heaven_plate:sky,palaces:branches.map(earth=>({earth,heaven:sky[earth]})),
 four_lessons:[lesson(1,'亥','甲'),lesson(2,'申','亥'),
               lesson(3,'亥','寅'),lesson(4,'申','亥')],
 source:{earth_heaven_four_lessons:'https://zh.wikisource.org/wiki/六壬大全'},
 calendar_provenance:{previous_middle_term:{name:'冬至',beijing_time:'2026-12-21T12:00:00+08:00'},
 next_middle_term:{name:'大寒',beijing_time:'2027-01-20T12:00:00+08:00'},warnings:[]}}
const audit={distinct_lesson_count:2,unique_pairs:[
 {ground:'寅',heaven:'亥',from_original_lessons:[1,3]},
 {ground:'亥',heaven:'申',from_original_lessons:[2,4]}]}
it('V60 shows actually merged eight-special lessons and authentic three transmissions',async()=>{
 const body={...common,has_full_nine_methods:false,
  transmission_review:{version:'V60',method_family:'八专',offset_palaces:9,
   distinct_lesson_audit:audit},
  three_transmissions:{status:'computed',method:'八专·阳顺数三（干上）',
   initial_candidates:['丑'],transmissions:[
    {order:1,name:'初传',branch:'丑'},{order:2,name:'中传',branch:'亥'},
    {order:3,name:'末传',branch:'亥'}]}}
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>body}))
 render(<LiurenV58/>)
 fireEvent.click(screen.getByRole('button',{name:'起大六壬天地盘'}))
 expect(await screen.findByText(/V60 取传门类：八专/)).toBeTruthy()
 const evidence=screen.getByRole('group',{name:'四课实际合并证据'})
 expect(within(evidence).getByText(/第1、3课同组/)).toBeTruthy()
 expect(screen.getByText(/八专·阳顺数三/)).toBeTruthy()
 expect(screen.getByRole('group',{name:'大六壬三传'}).textContent).toContain('末传')
})
it('V60 shehai candidate shows grounded Earth palace but no fabricated transmission',async()=>{
 const body={...common,has_full_nine_methods:false,
 transmission_review:{version:'V60',method_family:'涉害审计',offset_palaces:10,
  distinct_lesson_audit:audit},
 three_transmissions:{status:'pending',method:'涉害·候选分析已完成',
  reason:'涉害深浅待核验',initial_candidates:['戌'],transmissions:null,
  rule_audit:{candidate_details:[
  {upper:'戌',lesson_numbers:[2],lowers:['子'],lowers_lodges:['子'],
   candidate_branch_class:'仲',actual_ground_palace:'酉',actual_ground_class:'仲',
   classification_basis:'天盘上神下临的实际地盘宫',
   same_yin_yang_as_day:true}]}}}
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>body}))
 render(<LiurenV58/>)
 fireEvent.click(screen.getByRole('button',{name:'起大六壬天地盘'}))
 expect(await screen.findByText('此课三传尚未完成核验')).toBeTruthy()
 expect(screen.getByText(/下临地盘 酉 宫/)).toBeTruthy()
 expect(screen.queryByRole('group',{name:'大六壬三传'})).toBeNull()
})
