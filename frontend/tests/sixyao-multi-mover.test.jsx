// @vitest-environment jsdom
import React from 'react'
import {render,screen,cleanup} from '@testing-library/react'
import {afterEach,it,expect} from 'vitest'
import {MultiMoverAuditStudy} from '../src/SixYaoStage.jsx'
afterEach(cleanup)

it('V46 independently shows both original directions, unknown date and role overlap',()=>{
 const p={
   positions:[2,4],
   a_to_b:{relation:'动爻克本卦爻'},b_to_a:{relation:'动爻生本卦爻'},
   a_state:{restriction_flags:['original_xun_void'],missing_inputs:['日辰未核']},
   b_state:{restriction_flags:[],missing_inputs:[]},
   mutual_combine:false,mutual_clash:true,
   special:{has_moving_tomb_candidate:true,
     a_tomb_source_at_b:['动墓条件'],b_tomb_source_at_a:[]},
   focus_links:[{focus_position:3,a_role:'忌神',b_role:'原神',
     yuan_ji_pair:true,two_hop_via_roles:[]}]
 }
 render(<MultiMoverAuditStudy chart={{multi_mover_audit:{
   status:'multiple_movers_ready',moving_positions:[2,4],pair_count:1,
   pairs:[p],boundary:'效力与应期未判定'
 }}}/>)
 expect(screen.getByText('V46 · 多动爻双向条件核验')).toBeTruthy()
 expect(screen.getByText(/二爻 → 四爻：动爻克本卦爻/)).toBeTruthy()
 expect(screen.getByText(/四爻 → 二爻：动爻生本卦爻/)).toBeTruthy()
 expect(screen.getByText(/原忌同时明动的来源角色/)).toBeTruthy()
 expect(screen.getByText(/效力与应期未判定/)).toBeTruthy()
})

it('V46 does not invent pairs for a single mover',()=>{
 render(<MultiMoverAuditStudy chart={{multi_mover_audit:{
   status:'single_mover_only',moving_positions:[2],pair_count:0,pairs:[],
   boundary:'没有自动判定'
 }}}/>)
 expect(screen.getByText(/不足两个真实动爻/)).toBeTruthy()
})
