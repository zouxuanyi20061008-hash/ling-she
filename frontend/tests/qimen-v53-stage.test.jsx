// @vitest-environment jsdom
import React from 'react'
import {it,afterEach,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup} from '@testing-library/react'
import KnowledgeStage from '../src/KnowledgeStage.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})

function mockV53(isV53=true){
 const palace={
   number:4,name:'巽',earth_stem:'戊',sky_stem:'癸',
   actual_star:'天英',actual_gate:'死门',actual_spirit:'九地',
   has_hour_void:true,hour_xunkong_branches_here:['辰','巳'],
   hour_horse:false,structural_tags:[],
   ...(isV53?{
     dark_stem:'丁',ten_stem_response:{sky_stem:'癸',earth_stem:'戊',title:'天乙会合'},
     classical_patterns:[{id:'heaven_escape',title:'天遁',evidence:'天盘丙、地盘丁、生门同宫'}]
   }:{})
 }
 const data={
   version:isV53?'V53':'V52',ju_label:'阳遁4局',yuan:'下元',solar_term:'惊蛰',
   day_ganzhi:'辛卯',hour_ganzhi:'丙申',day_fu_tou:'己亥',
   duty_origin:{time_xun:'甲午',concealed_stem:'辛',origin_star:'天柱',
      earth_origin_palace:7,origin_door:'惊门',rotated_star_palace:2,
      rotated_door_palace:9,rotated_star_display_palace:2,rotated_door_display_palace:9},
   palaces:[palace],has_rotated_stars_and_gates:true,
   has_eight_spirits:true,has_hourly_void_and_horse:true,
   hour_markers:{void_branches:['辰','巳'],void_palaces:[4],
     horse_time_branch:'申',horse_branch:'寅',horse_palace:8},
   spirit_plate:{direction:'阳顺',chief_star_display_palace:2},
   input_provenance:{warnings:[]},reference:'https://www.shidianguji.com/'
 }
 if(isV53){
   data.has_ten_stem_lookup=true
   data.dark_stem_plate={
     method:'值使门起飞宫暗干（阳顺阴逆，特殊时干改中五）',
     origin_reason:'时干同值使门宫天地盘干，改从中五起（本口径约定）',
     origin_logical_palace:5
   }
 }
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>data}))
}

it('V53 shows historical ten-stem reference separately from the variant dark-stem plate',async()=>{
 mockV53()
 render(<KnowledgeStage mode="qimen" onBack={()=>{}} onStudy={()=>{}}/>)
 fireEvent.click(screen.getByRole('button',{name:'按所选时间起局'}))
 expect(await screen.findByText('阳遁4局 · 下元')).toBeTruthy()
 expect(screen.getByText(/V53 暗干：值使门起飞宫暗干/)).toBeTruthy()
 const board=screen.getByRole('group',{name:'V51 奇门九宫星门转盘'})
 const palace=within(board).getByRole('button',{name:/巽宫 · 4/})
 expect(within(palace).getByText(/暗丁 · 天乙会合/)).toBeTruthy()
 fireEvent.click(palace)
 expect(screen.getByText(/十干克应：/)).toBeTruthy()
 expect(screen.getByText(/复合格局候选/)).toBeTruthy()
 expect(screen.getByText(/暗干（飞宫法试算）丁/)).toBeTruthy()
 expect(screen.getByText(/格名只说明传统结构，不能直接下吉凶结论/)).toBeTruthy()
})

it('V53 UI remains compatible with a V52-only API object',async()=>{
 mockV53(false)
 render(<KnowledgeStage mode="qimen" onBack={()=>{}} onStudy={()=>{}}/>)
 fireEvent.click(screen.getByRole('button',{name:'按所选时间起局'}))
 expect(await screen.findByText('阳遁4局 · 下元')).toBeTruthy()
 expect(screen.queryByText(/V53 暗干：/)).toBeNull()
 const board=screen.getByRole('group',{name:'V51 奇门九宫星门转盘'})
 expect(within(board).getByRole('button',{name:/巽宫 · 4/})).toBeTruthy()
})
