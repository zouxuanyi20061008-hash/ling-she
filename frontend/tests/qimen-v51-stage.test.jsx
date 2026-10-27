// @vitest-environment jsdom
import React from 'react'
import {afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,waitFor,cleanup,within} from '@testing-library/react'
import KnowledgeStage from '../src/KnowledgeStage.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})

it('V51 renders true rotating sky stars and gates with source and destination while marking spirits pending',async()=>{
 const palaces=[
  {number:4,name:'巽',earth_stem:'戊',sky_stem:'癸',actual_star:'天英',actual_gate:'死门',sky_stem_from_palace:9,star_from_palace:9,gate_from_palace:2},
  {number:9,name:'离',earth_stem:'癸',sky_stem:'丙',actual_star:'天芮',actual_gate:'惊门',attached_center_star:'天禽',attached_center_stem:'己',sky_stem_from_palace:2,star_from_palace:2,gate_from_palace:7},
  {number:2,name:'坤',earth_stem:'丙',sky_stem:'辛',actual_star:'天柱',actual_gate:'开门',sky_stem_from_palace:7,star_from_palace:7,gate_from_palace:6},
  {number:3,name:'震',earth_stem:'乙',sky_stem:'戊',actual_star:'天辅',actual_gate:'景门',sky_stem_from_palace:4,star_from_palace:4,gate_from_palace:9},
  {number:5,name:'中',earth_stem:'己',sky_stem:'己',actual_star:null,actual_gate:null},
  {number:7,name:'兑',earth_stem:'辛',sky_stem:'庚',actual_star:'天心',actual_gate:'休门',sky_stem_from_palace:6,star_from_palace:6,gate_from_palace:1},
  {number:8,name:'艮',earth_stem:'壬',sky_stem:'乙',actual_star:'天冲',actual_gate:'杜门',sky_stem_from_palace:3,star_from_palace:3,gate_from_palace:4},
  {number:1,name:'坎',earth_stem:'丁',sky_stem:'壬',actual_star:'天任',actual_gate:'伤门',sky_stem_from_palace:8,star_from_palace:8,gate_from_palace:3},
  {number:6,name:'乾',earth_stem:'庚',sky_stem:'丁',actual_star:'天蓬',actual_gate:'生门',sky_stem_from_palace:1,star_from_palace:1,gate_from_palace:8},
 ]
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({
   version:'V51',ju_label:'阳遁4局',yuan:'下元',solar_term:'惊蛰',
   day_ganzhi:'辛卯',hour_ganzhi:'丙申',day_fu_tou:'己亥',
   duty_origin:{time_xun:'甲午',concealed_stem:'辛',origin_star:'天柱',
      earth_origin_palace:7,origin_door:'惊门',rotated_star_palace:2,
      rotated_door_palace:9,rotated_star_display_palace:2,
      rotated_door_display_palace:9},
   palaces,input_provenance:{warnings:[]},
   has_rotated_stars_and_gates:true,has_complete_rotating_plate:false,
   reference:'https://zh.wikisource.org/zh/奇門遁甲元靈經'
 })}))
 render(<KnowledgeStage mode="qimen" onBack={()=>{}} onStudy={()=>{}}/>)
 fireEvent.click(screen.getByRole('button',{name:'按所选时间起局'}))
 expect(await screen.findByText('阳遁4局 · 下元')).toBeTruthy()
 expect(screen.getByText(/值符天柱：原7宫 → 2宫/)).toBeTruthy()
 expect(screen.getByText(/值使惊门：原7宫 → 9宫/)).toBeTruthy()
 const chart=screen.getByRole('group',{name:'V51 奇门九宫星门转盘'})
 const palace2=within(chart).getByRole('button',{name:/坤宫 · 2/})
 expect(within(palace2).getByText('天柱')).toBeTruthy()
 expect(within(palace2).getByText('开门')).toBeTruthy()
 expect(within(palace2).getByText(/地丙 · 天辛/)).toBeTruthy()
 fireEvent.click(palace2)
 expect(screen.getByText(/来源兑7宫/)).toBeTruthy()
 expect(screen.getByText(/八神尚待完成/)).toBeTruthy()
})

it('V51 keeps V50-only saved response fallback with no fake rotated stars',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({
   version:'V50',ju_label:'阳遁8局',yuan:'上元',solar_term:'立春',
   day_ganzhi:'甲子',hour_ganzhi:'甲子',day_fu_tou:'甲子',
   duty_origin:{time_xun:'甲子',concealed_stem:'戊',
       origin_star:'天冲',earth_origin_palace:3,origin_door:'伤门'},
   palaces:[{number:4,name:'巽',earth_stem:'己',original_star:'天辅',original_door:'杜门'}],
   input_provenance:{warnings:[]},reference:'https://zh.wikisource.org/zh/奇門遁甲元靈經'
 })}))
 render(<KnowledgeStage mode="qimen" onBack={()=>{}} onStudy={()=>{}}/>)
 fireEvent.click(screen.getByRole('button',{name:'按所选时间起局'}))
 expect(await screen.findByText('阳遁8局 · 上元')).toBeTruthy()
 expect(screen.queryByRole('group',{name:'V51 奇门九宫星门转盘'})).toBeNull()
 expect(screen.getByRole('group',{name:'V50 奇门九宫真实地盘'})).toBeTruthy()
})
