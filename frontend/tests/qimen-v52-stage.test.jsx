// @vitest-environment jsdom
import React from 'react'
import {it,afterEach,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup} from '@testing-library/react'
import KnowledgeStage from '../src/KnowledgeStage.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
const rows=[
 {number:4,name:'巽',earth_stem:'戊',sky_stem:'癸',actual_star:'天英',actual_gate:'死门',actual_spirit:'九地',has_hour_void:true,hour_xunkong_branches_here:['辰','巳'],hour_horse:false,structural_tags:['天盘六仪击刑条件'],door_palace_relation:'宫克门',star_from_palace:9,gate_from_palace:2},
 {number:2,name:'坤',earth_stem:'丙',sky_stem:'辛',actual_star:'天柱',actual_gate:'开门',actual_spirit:'值符',has_hour_void:false,hour_xunkong_branches_here:[],hour_horse:false,structural_tags:[],door_palace_relation:'宫生门',star_from_palace:7,gate_from_palace:6},
 {number:8,name:'艮',earth_stem:'壬',sky_stem:'乙',actual_star:'天冲',actual_gate:'杜门',actual_spirit:'白虎',has_hour_void:false,hour_xunkong_branches_here:[],hour_horse:true,horse_branch_here:'寅',structural_tags:['门迫条件'],door_palace_relation:'门克宫（门迫条件）',star_from_palace:3,gate_from_palace:4},
]
it('V52 visible spirits and specific void branches, horse, and structural tags',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({
   version:'V52',ju_label:'阳遁4局',yuan:'下元',solar_term:'惊蛰',
   day_ganzhi:'辛卯',hour_ganzhi:'丙申',day_fu_tou:'己亥',
   duty_origin:{time_xun:'甲午',concealed_stem:'辛',
     origin_star:'天柱',earth_origin_palace:7,origin_door:'惊门',
     rotated_star_palace:2,rotated_door_palace:9,rotated_star_display_palace:2,rotated_door_display_palace:9},
   palaces:rows,input_provenance:{warnings:[]},
   has_rotated_stars_and_gates:true,has_eight_spirits:true,
   has_hourly_void_and_horse:true,
   spirit_plate:{direction:'阳顺',chief_star_display_palace:2},
   hour_markers:{void_branches:['辰','巳'],void_palaces:[4],
     horse_time_branch:'申',horse_branch:'寅',horse_palace:8},
   reference:'https://www.guyujian.cn/learn/qimen/07'
 })}))
 render(<KnowledgeStage mode="qimen" onBack={()=>{}} onStudy={()=>{}}/>)
 fireEvent.click(screen.getByRole('button',{name:'按所选时间起局'}))
 expect(await screen.findByText('阳遁4局 · 下元')).toBeTruthy()
 expect(screen.getByText(/时旬空：辰、巳/)).toBeTruthy()
 expect(screen.getByText(/时支申 · 马星寅/)).toBeTruthy()
 const disc=screen.getByRole('group',{name:'V51 奇门九宫星门转盘'})
 const four=within(disc).getByRole('button',{name:/巽宫 · 4/})
 expect(within(four).getByText('九地')).toBeTruthy()
 expect(within(four).getByText(/空辰巳/)).toBeTruthy()
 fireEvent.click(four)
 expect(screen.getByText(/时旬空 辰、巳/)).toBeTruthy()
 const eight=within(disc).getByRole('button',{name:/艮宫 · 8/})
 expect(within(eight).getByText('白虎')).toBeTruthy()
 expect(within(eight).getByText(/马 · 门迫条件/)).toBeTruthy()
 fireEvent.click(eight)
 expect(screen.getByText(/时支马星 寅/)).toBeTruthy()
 expect(screen.getByText(/仅标记结构，不作吉凶结论/)).toBeTruthy()
})
