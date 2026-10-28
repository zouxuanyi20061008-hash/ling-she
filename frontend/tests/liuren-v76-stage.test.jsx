// @vitest-environment jsdom
import React from 'react'
import {afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,cleanup,within} from '@testing-library/react'
import LiurenV58 from '../src/LiurenV58.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})

const branches='子丑寅卯辰巳午未申酉戌亥'.split('')
const heaven=Object.fromEntries(branches.map((v,i)=>[v,branches[(i+6)%12]]))
const witness={
 version:'V76',applied:true,category:'fanyin_tied_classical_witness',
 status:'pending',requested_school:'pending',
 selected_initial:null,
 source_evidence_level:'not_selected_or_outside_source_scope',
 witness_matches_this_exact_plate:false,
 cunyan_witness:{day_ganzhi:'戊辰',month_general:'戌',hour_ganzhi:'丙辰',
   hour_branch:'辰',three_transmissions:['巳','亥','巳'],
   four_lessons:[{upper:'亥',lower:'戊'},{upper:'巳',lower:'亥'},
                 {upper:'戌',lower:'辰'},{upper:'辰',lower:'戌'}],
   source:'https://libokang.com/classics/liuren/六壬存验/',
   evidence_scope:'one_documented_time_and_four_lessons'},
 tanyuan_general_rule:{days:['戊辰','戊戌'],
   three_transmissions:['亥','巳','亥'],
   source:'https://shuyuan.zhiming.life/read/六壬探原/1',
   evidence_scope:'explicit_general_reverse_chant_equal-depth_rule'}
}
const chart={
 version:'V63',audit_version:'V74',day_ganzhi:'戊辰',day_stem_lodge:'巳',
 hour_branch:'午',month_general:'子',month_general_name:'神后',
 heaven_plate:heaven,palaces:branches.map(earth=>({earth,heaven:heaven[earth]})),
 four_lessons:[{number:1,upper:'亥',lower:'戊',upper_element:'水',lower_element:'土',
  relation:'下贼上',from:'日干寄宫'}],
 three_transmissions:{status:'pending',method:'反吟多贼克仍需涉害',
  reason:'同深未决',initial_candidates:['亥','巳'],transmissions:null},
 pending_branch_review:{version:'V74',status:'pending',
  label:'反吟多贼克需涉害',method:'反吟多贼克仍需涉害',
  reason:'同深未决',candidate_branches:['亥','巳'],
  next_check:'查看两套古籍',source:'https://libokang.com/'},
 fanyin_shehai_v75:{version:'V75',applied:true,original_candidates:['亥','巳'],
  candidate_details:[],selected_initial:null,decision_rule:'unresolved_equal_depth',
  historical_alternatives:{tanyuan:{
   first:'亥',transmissions:['亥','巳','亥'],source:'https://shuyuan.zhiming.life/read/六壬探原/1'}},
  reason_pending:'仍待判'},
 historical_witness_v76:witness,
 source:{earth_heaven_four_lessons:'https://zh.wikisource.org/wiki/六壬指南'},
 calendar_provenance:{previous_middle_term:{name:'雨水',beijing_time:'2026-02-19T00:00:00+08:00'},
 next_middle_term:{name:'春分',beijing_time:'2026-03-20T00:00:00+08:00'},warnings:[]}
}

it('V76 exposes single-case original four lessons and unverified same-shape scope',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>chart}))
 render(<LiurenV58/>)
 fireEvent.click(screen.getByRole('button',{name:'起大六壬天地盘'}))
 const section=await screen.findByRole('group',{name:'V76 反吟复等原典例课适用范围'})
 expect(section.textContent).toContain('24 个反吟时将组合')
 expect(section.textContent).toContain('不是《六壬存验》所记载的确切时将')
 const table=within(section).getByRole('group',{name:'V76 六壬存验原始四课真值'})
 expect(table.textContent).toContain('第1课 亥临戊')
 expect(table.textContent).toContain('第2课 巳临亥')
 expect(table.textContent).toContain('第3课 戌临辰')
 expect(table.textContent).toContain('第4课 辰临戌')
 expect(within(section).getAllByRole('link')).toHaveLength(2)
 expect(screen.queryByRole('group',{name:'大六壬三传'})).toBeNull()
})

it('V76 exact historical witness is visibly eligible but not auto-selected',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({
  ...chart,month_general:'戌',hour_branch:'辰',
  historical_witness_v76:{...witness,witness_matches_this_exact_plate:true},
  fanyin_shehai_v75:{...chart.fanyin_shehai_v75,
   historical_alternatives:{...chart.fanyin_shehai_v75.historical_alternatives,
    cunyan:{first:'巳',transmissions:['巳','亥','巳'],
    source:witness.cunyan_witness.source}}}
 })}))
 render(<LiurenV58/>)
 fireEvent.click(screen.getByRole('button',{name:'起大六壬天地盘'}))
 const section=await screen.findByRole('group',{name:'V76 反吟复等原典例课适用范围'})
 expect(section.textContent).toContain('完全吻合')
 expect(section.textContent).toContain('可手动选巳亥巳')
 expect(screen.queryByRole('group',{name:'大六壬三传'})).toBeNull()
})

it('V76 selection of Cuny an sends explicit field without pretending other time valid',async()=>{
 const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>chart})
 vi.stubGlobal('fetch',fetcher)
 render(<LiurenV58/>)
 fireEvent.change(screen.getByLabelText('反吟复等古籍取法'),{target:{value:'cunyan'}})
 fireEvent.click(screen.getByRole('button',{name:'起大六壬天地盘'}))
 expect(await screen.findByRole('group',{name:'V76 反吟复等原典例课适用范围'})).toBeTruthy()
 expect(JSON.parse(fetcher.mock.calls[0][1].body).fanyin_tie_school).toBe('cunyan')
 expect(screen.getByRole('status').textContent).toContain('此课三传尚未完成核验')
})

it('V76 old V75 API still renders without invented historical audit',async()=>{
 const {historical_witness_v76,...legacy}=chart
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>legacy}))
 render(<LiurenV58/>)
 fireEvent.click(screen.getByRole('button',{name:'起大六壬天地盘'}))
 expect(await screen.findByText('此课三传尚未完成核验')).toBeTruthy()
 expect(screen.queryByRole('group',{name:'V76 反吟复等原典例课适用范围'})).toBeNull()
})
