// @vitest-environment jsdom
import React from 'react'
import {it,afterEach,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup} from '@testing-library/react'
import KnowledgeStage from '../src/KnowledgeStage.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
const basePalace={number:9,name:'离',earth_stem:'癸',sky_stem:'丙',dark_stem:'庚',
  actual_star:'天芮',actual_gate:'惊门',actual_spirit:'九天',
  hour_xunkong_branches_here:[],has_hour_void:false,hour_horse:false,
  structural_tags:[],ten_stem_response:{sky_stem:'丙',earth_stem:'癸',title:'华盖孛师'},
  classical_patterns:[],star_from_palace:2,gate_from_palace:7}
const wonder={
 palace:9,sky_stem:'丙',earth_stem:'癸',burial:false,
 classical_six_jia_de_shi:false,alternative_chief_door_overlap:true,
 strict_good_chief_door_overlap:false,classical_and_alternative_disagree:true,
 candidates:[{id:'three_wonders_meets_chief_door',title:'三奇遇值使门 · 另一口径',
     evidence:'天盘丙与值使惊门同在9宫'}]
}
function fixture(hasV54){
 return {
    version:hasV54?'V54':'V53',ju_label:'阳遁4局',yuan:'下元',solar_term:'惊蛰',
    day_ganzhi:'辛卯',hour_ganzhi:'丙申',day_fu_tou:'己亥',
    duty_origin:{time_xun:'甲午',concealed_stem:'辛',
      origin_star:'天柱',earth_origin_palace:7,origin_door:'惊门',
      rotated_star_palace:2,rotated_door_palace:9,rotated_star_display_palace:2,
      rotated_door_display_palace:9},
    palaces:[{...basePalace,...(hasV54?{wonder_rule_review:wonder}:{})}],
    has_rotated_stars_and_gates:true,has_eight_spirits:true,
    has_hourly_void_and_horse:true,has_ten_stem_lookup:true,
    input_provenance:{warnings:[]},reference:'https://zh.wikisource.org/',
    spirit_plate:{direction:'阳顺',chief_star_display_palace:2},
    hour_markers:{void_branches:['辰','巳'],void_palaces:[4],
      horse_time_branch:'申',horse_branch:'寅',horse_palace:8},
    dark_stem_plate:{method:'值使门起飞宫暗干',origin_reason:'改从中五起',origin_logical_palace:5},
    ...(hasV54?{wonder_rule_review:{burial_positions:[],classical_six_jia_positions:[],
      chief_door_overlap_positions:[9],interpretation_disagreements:[9]}}:{})
 }
}
it('V54 identifies classical false vs chief-door true as different readings',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>fixture(true)}))
 render(<KnowledgeStage mode="qimen" onBack={()=>{}} onStudy={()=>{}}/>)
 fireEvent.click(screen.getByRole('button',{name:'按所选时间起局'}))
 expect(await screen.findByText('阳遁4局 · 下元')).toBeTruthy()
 expect(screen.getByText(/V54 三奇入墓：本盘未见/)).toBeTruthy()
 const disc=screen.getByRole('group',{name:'V51 奇门九宫星门转盘'})
 const nine=within(disc).getByRole('button',{name:/离宫 · 9/})
 expect(within(nine).getByText(/三奇遇值使门 · 另一口径/)).toBeTruthy()
 fireEvent.click(nine)
 expect(screen.getByText(/古籍六甲式三奇得使：当前未见/)).toBeTruthy()
 expect(screen.getByText(/两种口径对此宫判断不同/)).toBeTruthy()
})
it('V54 display falls back on persisted V53 cast lacking the new layer',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>fixture(false)}))
 render(<KnowledgeStage mode="qimen" onBack={()=>{}} onStudy={()=>{}}/>)
 fireEvent.click(screen.getByRole('button',{name:'按所选时间起局'}))
 expect(await screen.findByText('阳遁4局 · 下元')).toBeTruthy()
 expect(screen.queryByText(/V54 三奇入墓：/)).toBeNull()
 expect(screen.getByRole('group',{name:'V51 奇门九宫星门转盘'})).toBeTruthy()
})
