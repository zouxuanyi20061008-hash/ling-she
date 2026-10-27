// @vitest-environment jsdom
import React from 'react'
import {afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup} from '@testing-library/react'
import LiurenV58 from '../src/LiurenV58.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})

const branches=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']
const assignment={子:'甲',丑:'乙',寅:'丙',卯:'丁',辰:'戊',巳:'己',
 午:'庚',未:'辛',申:'壬',酉:'癸',戌:null,亥:null}
const heaven=Object.fromEntries(branches.map((p,i)=>[p,branches[(i+3)%12]]))
const palaces=branches.map(earth=>({earth,heaven:heaven[earth],
 heavenly_general:earth==='子'?'天空':'贵人',general_element:'土',
 heaven_xun_dun:assignment[heaven[earth]],heaven_is_void:assignment[heaven[earth]]===null,
 earth_xun_dun:assignment[earth],earth_is_void:assignment[earth]===null}))
const root={version:'V63',day_ganzhi:'丙寅',day_stem_lodge:'巳',
 hour_branch:'申',month_general:'亥',month_general_name:'登明',
 heaven_plate:heaven,palaces,
 four_lessons:[{number:1,upper:'申',lower:'丙',upper_element:'金',lower_element:'火',
 relation:'下贼上',from:'日干寄宫',upper_xun_dun:'壬',upper_is_void:false,
 heavenly_general:'贵人',general_element:'土'}],
 three_transmissions:{status:'computed',method:'下贼上（重审）',initial_candidates:['申'],
 transmissions:[
 {order:1,name:'初传',branch:'申',xun_dun_stem:'壬',is_xun_void:false,heavenly_general:'贵人',earth_palace:'巳'},
 {order:2,name:'中传',branch:'亥',xun_dun_stem:null,is_xun_void:true,heavenly_general:'六合',earth_palace:'申'},
 {order:3,name:'末传',branch:'寅',xun_dun_stem:'丙',is_xun_void:false,heavenly_general:'朱雀',earth_palace:'亥'}]},
 xun_void_and_dun:{xun_head:'甲子',day_ganzhi:'丙寅',empty_branches:['戌','亥'],
 by_branch:assignment,branch_table:branches.map(branch=>({
 branch,xun_dun_stem:assignment[branch],is_void:assignment[branch]===null})),
 heaven_void_earth_palaces:[{earth:'未',heaven:'戌'},{earth:'申',heaven:'亥'}],
 earth_branch_void_palaces:['戌','亥']},
 source:{earth_heaven_four_lessons:'https://zh.wikisource.org/wiki/六壬指南'},
 calendar_provenance:{previous_middle_term:{name:'雨水',beijing_time:'2026-02-19T00:00:00+08:00'},
 next_middle_term:{name:'春分',beijing_time:'2026-03-20T00:00:00+08:00'},warnings:[]}
}
it('V63 shows classical BingYin empty-middle transmission and separate heaven-earth void',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>root}))
 render(<LiurenV58/>)
 fireEvent.click(screen.getByRole('button',{name:'起大六壬天地盘'}))
 expect(await screen.findByText(/甲子旬 ·/)).toBeTruthy()
 const table=screen.getByRole('group',{name:'十二支旬遁干对照'})
 expect(within(table).getAllByText('旬空')).toHaveLength(2)
 const triple=screen.getByRole('group',{name:'大六壬三传'})
 expect(triple.textContent).toContain('壬')
 expect(triple.textContent).toContain('旬空')
 expect(triple.textContent).toContain('丙')
 expect(screen.getByText(/天盘空亡支实际下临/)).toBeTruthy()
 expect(screen.getByText(/与六甲旬的“旬空”是两套不同概念/)).toBeTruthy()
})
it('V63 compatibility: former V62 response without xun fields still renders',async()=>{
 const legacy={...root,version:'V62',xun_void_and_dun:undefined,
 palaces:root.palaces.map(({heaven_xun_dun,heaven_is_void,earth_xun_dun,earth_is_void,...p})=>p),
 three_transmissions:{...root.three_transmissions,
 transmissions:root.three_transmissions.transmissions.map(({xun_dun_stem,is_xun_void,...p})=>p)}}
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>legacy}))
 render(<LiurenV58/>)
 fireEvent.click(screen.getByRole('button',{name:'起大六壬天地盘'}))
 expect(await screen.findByText(/丙寅日 · 申时/)).toBeTruthy()
 expect(screen.queryByRole('group',{name:'V63 六甲旬遁干与旬空'})).toBeNull()
})
