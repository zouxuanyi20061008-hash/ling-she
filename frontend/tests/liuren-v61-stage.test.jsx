// @vitest-environment jsdom
import React from 'react'
import {it,afterEach,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup} from '@testing-library/react'
import LiurenV58 from '../src/LiurenV58.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
const br=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']
const sky=Object.fromEntries(br.map((b,i)=>[b,br[(i+10)%12]]))
const base={
 version:'V61',day_ganzhi:'丁卯',hour_branch:'丑',month_general:'亥',
 month_general_name:'登明',day_stem_lodge:'未',
 palaces:br.map(earth=>({earth,heaven:sky[earth]})),
 heaven_plate:sky,four_lessons:[
  {number:1,upper:'巳',lower:'丁',upper_element:'火',lower_element:'火',relation:'无直接克'},
  {number:2,upper:'卯',lower:'巳',upper_element:'木',lower_element:'火',relation:'无直接克'},
  {number:3,upper:'丑',lower:'卯',upper_element:'土',lower_element:'木',relation:'下贼上'},
  {number:4,upper:'亥',lower:'丑',upper_element:'水',lower_element:'土',relation:'下贼上'}
 ],source:{earth_heaven_four_lessons:'https://zh.wikisource.org/wiki/六壬指南'},
 calendar_provenance:{previous_middle_term:{name:'雨水',beijing_time:'2026-02-18T12:00:00+08:00'},
 next_middle_term:{name:'春分',beijing_time:'2026-03-20T12:00:00+08:00'},warnings:[]},
 transmission_review:{version:'V61',method_family:'涉害·循宫计害',offset_palaces:10,
 distinct_lesson_audit:{distinct_lesson_count:4,unique_pairs:[]}},
 has_full_nine_methods:false
}
const details=[
 {upper:'亥',actual_ground_palace:'丑',shehai_trace:{depth:6,
   path:['丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'],
   hits:[{earth:'丑',kind:'地支',symbol:'丑',element:'土'},
        {earth:'辰',kind:'地支',symbol:'辰',element:'土'}]},
   shehai_excluding_start:{depth:5}},
 {upper:'丑',actual_ground_palace:'卯',shehai_trace:{depth:2,
   path:['卯','辰','巳','午','未','申','酉','戌','亥','子','丑'],
   hits:[{earth:'卯',kind:'地支',symbol:'卯',element:'木'}]},
   shehai_excluding_start:{depth:1}}
]
const chosen={...base,
 three_transmissions:{status:'computed',method:'涉害·逐宫归本家（受克深者发用）',
 initial_candidates:['亥','丑'],transmissions:[
 {order:1,name:'初传',branch:'亥'},{order:2,name:'中传',branch:'酉'},
 {order:3,name:'末传',branch:'未'}],rule_audit:{candidate_details:details}},
 shehai_v61:{full_path_witnesses:true,relationship:'下贼上',
 source:'https://www.shidianguji.com/book/SK1599/chapter/1m1g2evjvmoez',
 selected_by_inclusive:{winner:'亥',depth:6},
 selected_by_exclusive:{winner:'亥'},selected_by_direct_class:{winner:'丑'},
 variance:{depth_vs_shortcut_disagree:true,inclusive_vs_exclusive_disagree:false}}
}
it('V61 displays route, depth and explicit simplified-rule divergence alongside real transmissions',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>chosen}))
 render(<LiurenV58/>)
 fireEvent.click(screen.getByRole('button',{name:'起大六壬天地盘'}))
 expect(await screen.findByText(/V61 取传门类：涉害/)).toBeTruthy()
 const evidence=screen.getByRole('group',{name:'V61 涉害逐宫路径与分歧'})
 expect(within(evidence).getByText(/循宫深度法/)).toBeTruthy()
 expect(within(evidence).getByText(/孟仲季先取简式/)).toBeTruthy()
 expect(screen.getByText(/古籍口径存在取用分歧/)).toBeTruthy()
 expect(within(evidence).getByText(/丑 → 寅 → 卯 → 辰/)).toBeTruthy()
 expect(screen.getByRole('group',{name:'大六壬三传'}).textContent).toContain('初传')
})
it('V61 older V60 data without route fields still renders',async()=>{
 const copy={...base,version:'V60',
   three_transmissions:{status:'pending',method:'涉害候选待算',
   reason:'规则未核准',initial_candidates:['亥','丑'],transmissions:null,
   rule_audit:{candidate_details:[]}}}
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>copy}))
 render(<LiurenV58/>)
 fireEvent.click(screen.getByRole('button',{name:'起大六壬天地盘'}))
 expect(await screen.findByText('此课三传尚未完成核验')).toBeTruthy()
 expect(screen.queryByRole('group',{name:'V61 涉害逐宫路径与分歧'})).toBeNull()
})
