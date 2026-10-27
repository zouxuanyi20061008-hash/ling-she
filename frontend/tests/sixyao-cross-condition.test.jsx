// @vitest-environment jsdom
import React from 'react'
import {it,expect} from 'vitest'
import {render,screen} from '@testing-library/react'
import {CrossConditionAuditStudy} from '../src/SixYaoStage.jsx'

it('V44 shows independent known, unknown and real-moving-only evidence',()=>{
  const row=(position,moving)=>({
    position,ganzhi:'甲子',moving,focus_candidate:position===1,selected_by_user:false,
    checks:position===1?[{id:'check',title:'旬空与月冲并见',facts:['两项已计算'] }]:[],
    computed:{day:{status:'missing',relation:null},month:{status:'computed',relation:'月建克爻'},
      original_void:null,original_month_clash:true},
    actual_change:moving?{ganzhi:'乙卯',returning_term:'回头克',original_void:null,month_clash:false}:null,
    incoming_movers:[],missing_inputs:['日辰未提供']
  })
  const chart={cross_condition_audit:{
    status:'calendar_incomplete',rows:[row(1,false),row(2,true)],
    unimplemented:['最终用神旺衰'],boundary:'结论不得自动裁断'
  }}
  render(<CrossConditionAuditStudy chart={chart}/>)
  expect(screen.getByText(/V44 · 核心规则交叉核验/)).toBeTruthy()
  expect(screen.getByText(/本爻安静，不将变卦静态同位支作为化爻/)).toBeTruthy()
  expect(screen.getByText(/真实本位化爻：乙卯/)).toBeTruthy()
  expect(screen.getByText(/旬空与月冲并见/)).toBeTruthy()
  expect(screen.getAllByText(/日辰未提供/)).toHaveLength(2)
  expect(screen.getByText(/最终用神旺衰/)).toBeTruthy()
})
