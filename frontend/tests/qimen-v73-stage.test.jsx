// @vitest-environment jsdom
import React from 'react'
import {it,afterEach,expect,vi} from 'vitest'
import {render,screen,fireEvent,cleanup} from '@testing-library/react'
import KnowledgeStage from '../src/KnowledgeStage.jsx'

afterEach(()=>{cleanup();vi.unstubAllGlobals()})

const base={
 version:'V54',ju_label:'阳遁4局',yuan:'下元',solar_term:'惊蛰',
 day_ganzhi:'辛卯',hour_ganzhi:'丙申',day_fu_tou:'己亥',
 has_rotated_stars_and_gates:true,has_eight_spirits:true,
 has_hourly_void_and_horse:true,has_ten_stem_lookup:true,
 has_complete_rotating_plate:false,has_final_divination:false,
 input_provenance:{warnings:[]},reference:'https://www.guyujian.cn/learn/qimen/07',
 duty_origin:{time_xun:'甲午',concealed_stem:'辛',origin_star:'天柱',
   earth_origin_palace:7,origin_door:'惊门',
   rotated_star_palace:2,rotated_star_display_palace:2,
   rotated_door_palace:9,rotated_door_display_palace:9},
 spirit_plate:{direction:'阳顺',chief_star_display_palace:2},
 hour_markers:{void_branches:['辰','巳'],void_palaces:[4],
   horse_time_branch:'申',horse_branch:'寅',horse_palace:8},
 palaces:[{number:9,name:'离',earth_stem:'癸',sky_stem:'丙',
   actual_star:'天芮',actual_gate:'惊门',actual_spirit:'九天',
   star_from_palace:2,gate_from_palace:7,
   hour_xunkong_branches_here:[],has_hour_void:false,hour_horse:false,
   structural_tags:[],ten_stem_response:{sky_stem:'丙',earth_stem:'癸',title:'华盖孛师'},
   classical_patterns:[],wonder_rule_review:null}],
}

const audit={
 version:'V73',status:'core_four_layers_consistent',
 core_layers:[
   {name:'地盘三奇六仪',expected_positions:9,verified_positions:9},
   {name:'天盘干及九星',expected_positions:8,verified_positions:8},
   {name:'八门值使落宫',expected_positions:8,verified_positions:8},
   {name:'八神值符旋转',expected_positions:8,verified_positions:8}
 ],
 verification_count:33,
 duty:{chief_star_original:7,chief_star_logical:2,chief_star_display:2,
   chief_gate_logical:9,chief_gate_display:9,hourly_steps:2},
 source:{full_external_worked_chart:'https://www.guyujian.cn/learn/qimen/07'},
 unverified_modules:['值使飞宫暗干完整独立古籍整盘','置闰定局与替代寄宫流派','最终断课'],
 has_complete_core_four_layers:true,has_full_multi_school_coverage:false,
}

it('V73 renders verified 33 core-layer cells and preserves unverified context',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({
   ...base,audit_version:'V73',core_plate_audit:audit
 })}))
 render(<KnowledgeStage mode="qimen" onBack={()=>{}} onStudy={()=>{}}/>)
 fireEvent.click(screen.getByRole('button',{name:'按所选时间起局'}))
 const section=await screen.findByRole('region',{name:'V73 奇门四层整盘交叉审计'})
 expect(section.textContent).toContain('地盘三奇六仪（9/9）')
 expect(section.textContent).toContain('天盘干及九星（8/8）')
 expect(section.textContent).toContain('八门值使落宫（8/8）')
 expect(section.textContent).toContain('八神值符旋转（8/8）')
 expect(section.textContent).toContain('未')
 expect(section.textContent).toContain('不自动断吉凶')
 expect(screen.getByText(/V73 核心四层一致性审计/)).toBeTruthy()
 expect(section.querySelector('a').getAttribute('href')).toBe(audit.source.full_external_worked_chart)
})
it('V73 never fabricates audit if API returns older V54 chart without it',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>base}))
 render(<KnowledgeStage mode="qimen" onBack={()=>{}} onStudy={()=>{}}/>)
 fireEvent.click(screen.getByRole('button',{name:'按所选时间起局'}))
 expect(await screen.findByText('阳遁4局 · 下元')).toBeTruthy()
 expect(screen.queryByRole('region',{name:'V73 奇门四层整盘交叉审计'})).toBeNull()
 expect(screen.getByRole('group',{name:'V51 奇门九宫星门转盘'})).toBeTruthy()
})
