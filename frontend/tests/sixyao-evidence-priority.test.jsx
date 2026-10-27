// @vitest-environment jsdom
import React from 'react'
import {afterEach,it,expect} from 'vitest'
import {cleanup,render,screen} from '@testing-library/react'
import {EvidencePriorityAuditStudy} from '../src/SixYaoStage.jsx'
afterEach(cleanup)

it('V47 distinguishes input review first and simultaneous evidence without strength verdict',()=>{
  const chart={evidence_priority_audit:{
    fact_count:10,deduplicated_reference_count:3,
    rows:[{position:1,evidence_ids:['line:1:original:moving']}],
    review_queue:[
      {id:'missing:1:day',priority:0,title:'日辰未提供'},
      {id:'line:1:tension:void_month',priority:2,title:'旬空与月冲同时成立'}
    ],
    priority_semantics:{'0':'缺失输入待补齐','1':'手动历法待核','2':'并见待核'},
    boundary:'不判实际效力'
  }}
  render(<EvidencePriorityAuditStudy chart={chart}/>)
  expect(screen.getByText('V47 · 已算证据去重与检查次序')).toBeTruthy()
  expect(screen.getByText(/日辰未提供/)).toBeTruthy()
  expect(screen.getByText(/旬空与月冲同时成立/)).toBeTruthy()
  expect(screen.getByText(/不判实际效力/)).toBeTruthy()
})

it('V47 shows no fabricated tensions with empty input review list',()=>{
  const chart={evidence_priority_audit:{
    fact_count:0,deduplicated_reference_count:0,rows:[],
    review_queue:[],priority_semantics:{},boundary:'无最终判断'
  }}
  render(<EvidencePriorityAuditStudy chart={chart}/>)
  expect(screen.getByText(/当前没有额外交叉审议项/)).toBeTruthy()
})
