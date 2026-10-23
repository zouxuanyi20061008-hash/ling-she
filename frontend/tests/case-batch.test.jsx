// @vitest-environment jsdom
import React from 'react'
import {beforeEach,afterEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import CaseExchangeCenter from '../src/CaseExchangeCenter.jsx'
import {markInboxCases,readCaseInbox,INBOX_KEY} from '../src/case-exchange.js'
import {summarizeCaseInbox,reviewQueueMatch,
  exportSelectedReviewCsv,selectedReport} from '../src/case-batch.js'

const base=(id,status='待审核',opts={})=>({
  fingerprint:id,status,imported_at:'2026-10-23T12:00:00Z',
  review_note:opts.review_note||'',
  case:{
    original_numbers:[7,8,9,6,7,8],
    before:opts.before||'事前研究要核对相反证据，尚未判定实际结果',
    ben_gua:opts.ben||'水天需',bian_gua:'火天大有',
    day_ganzhi:opts.noCal?'':'甲子',month_branch:opts.noCal?'':'辰',
    chosen_category:opts.category||'父母',created_at:opts.created||'2026-10-22T12:00:00Z',
    feedback:opts.feedback||[],
    human_review:null,focus_selection:null
  }
})
const obs=(result_type,recorded_at='2026-10-23T14:00:00Z')=>({
  result_type,recorded_at,observations:'后来根据实际情况核对的材料'
})
const dataset=()=>[
  base('no-outcome'),
  base('with-outcome','收录',{ben:'乾为天',category:'官鬼',feedback:[obs('未吻合')]}),
  base('time-error','待审核',{created:'2026-10-25T12:00:00Z',feedback:[obs('部分吻合')]}),
  base('no-calendar','暂不收录',{noCal:true,ben:'坎为水',feedback:[obs('尚无结果')]}),
]
beforeEach(()=>window.localStorage.clear())
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()})

it('V32 资料完备统计包含未吻合与未决，不计算预测准确率',()=>{
  const stats=summarizeCaseInbox(dataset())
  expect(stats.total).toBe(4)
  expect(stats.by_status).toEqual({'待审核':2,'收录':1,'暂不收录':1})
  expect(stats.with_followup).toBe(2)
  expect(stats.missing_followup).toBe(2)
  expect(stats.needs_time_review).toBe(1)
  expect(stats.missing_calendar).toBe(1)
  expect(stats.reported_outcomes['未吻合']).toBe(1)
  expect(stats.reported_outcomes['部分吻合']).toBe(1)
  expect(stats.reported_outcomes['尚无结果']).toBe(1)
  expect(stats.case_with_unresolved).toBe(1)
  expect(stats.independently_verified).toBe(0)
  expect(stats.accuracy_calculated).toBe(false)
})

it('复核队列按事实、时间、日月缺项挑选，不影响已收录状态',()=>{
  const data=dataset()
  const selected=queue=>data.filter(item=>reviewQueueMatch(item,queue)).map(x=>x.fingerprint)
  expect(selected('missing_followup')).toEqual(['no-outcome','no-calendar'])
  expect(selected('time_review')).toEqual(['time-error'])
  expect(selected('missing_calendar')).toEqual(['no-calendar'])
  expect(selected('pending')).toEqual(['no-outcome','time-error'])
  expect(selected('with_followup')).toEqual(['with-outcome','time-error'])
  expect(()=>reviewQueueMatch(data[0],'unknown')).toThrow()
})

it('批量只允许待审核和暂不收录，不能批量通过或篡改案例原文',()=>{
  window.localStorage.setItem(INBOX_KEY,JSON.stringify(dataset()))
  const original=readCaseInbox()[0].case.before
  expect(()=>markInboxCases(['no-outcome'],'收录')).toThrow('批量操作')
  expect(()=>markInboxCases(['no-outcome','bad'],'待审核')).toThrow('不存在')
  expect(()=>markInboxCases(['no-outcome','no-outcome'],'待审核')).toThrow('不重复')
  expect(readCaseInbox()[0].status).toBe('待审核')
  const after=markInboxCases(['no-outcome','time-error'],'暂不收录')
  expect(after.find(x=>x.fingerprint==='no-outcome').status).toBe('暂不收录')
  expect(after.find(x=>x.fingerprint==='no-outcome').case.before).toBe(original)
  expect(after.find(x=>x.fingerprint==='with-outcome').status).toBe('收录')
})

it('选中 CSV 只导出选择范围并防止表格公式执行',()=>{
  const data=dataset()
  data[0].review_note='=HYPERLINK("https://example.invalid")'
  const exported=exportSelectedReviewCsv(data,['no-outcome'])
  expect(exported).toContain('"\'=HYPERLINK(')
  expect(exported).toContain('no-outcome')
  expect(exported).not.toContain('time-error')
  expect(exported).not.toContain('with-outcome')
  const summary=selectedReport(data,['no-outcome'])
  expect(summary.total).toBe(1)
  expect(()=>exportSelectedReviewCsv(data,[])).toThrow('请先选择')
  expect(()=>exportSelectedReviewCsv(data,['missing'])).toThrow('已经变化')
})

it('移动端收案台可按证据队列筛选、选择、批量退回待审核',()=>{
  window.localStorage.setItem(INBOX_KEY,JSON.stringify(dataset()))
  vi.stubGlobal('confirm',()=>true)
  render(<CaseExchangeCenter onClose={()=>{}}/>)
  expect(screen.getByText('V32 · 案例研究概览')).toBeTruthy()
  expect(screen.getByText(/一份案例可能有多次/)).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:'时间需核'}))
  expect(screen.getByText('显示 1 / 4 份，当前最多保留 40 份。')).toBeTruthy()
  fireEvent.click(screen.getByLabelText('全选当前可见案例'))
  expect(screen.getByText(/已选 1 份/)).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:'批量暂不收录'}))
  expect(readCaseInbox().find(x=>x.fingerprint==='time-error').status).toBe('暂不收录')
  expect(readCaseInbox()).toHaveLength(4)
})

it('本机搜索和批量操作不启动后台上传，也不删除未选中的记录',()=>{
  window.localStorage.setItem(INBOX_KEY,JSON.stringify(dataset()))
  const upload=vi.fn()
  vi.stubGlobal('fetch',upload)
  render(<CaseExchangeCenter onClose={()=>{}}/>)
  fireEvent.change(screen.getByLabelText('搜索本机案例'),{target:{value:'坎为水'}})
  expect(screen.getByText('显示 1 / 4 份，当前最多保留 40 份。')).toBeTruthy()
  expect(screen.getByLabelText('选择案例 no-calendar')).toBeTruthy()
  expect(upload).not.toHaveBeenCalled()
})
