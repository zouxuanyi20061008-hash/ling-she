// @vitest-environment jsdom
import React from 'react'
import {beforeEach,afterEach,it,expect,vi} from 'vitest'
import {cleanup,render,screen,fireEvent} from '@testing-library/react'
import {inspectCaseEvidence,exportCaseReviewCsv,csvCell} from '../src/case-review.js'
import {importToInbox,updateInboxReviewNote,readCaseInbox,
  restoreInboxBackup,INBOX_KEY} from '../src/case-exchange.js'
import CaseExchangeCenter from '../src/CaseExchangeCenter.jsx'

const caseData=(id='alpha')=>({
  format:'wanxiang-sixyao-case-v1',version:1,
  source_key:id,consent:'由分享者主动导出、交给收件人审核的研究材料',
  shared_at:'2026-10-23T10:00:00.000Z',
  case:{
    original_numbers:[7,8,9,6,7,8],before:'事前已明确记录：等待现实后续核验',
    ben_gua:'水天需',bian_gua:'火天大有',created_at:'2026-10-20T10:00:00.000Z',
    day_ganzhi:'甲子',month_branch:'辰',feedback:[],
    selected_position:3,chosen_category:'父母'
  }
})
beforeEach(()=>window.localStorage.clear())
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()})

it('暂无后续事实不等于预测已应验，也不计算准确率',()=>{
  const q=inspectCaseEvidence(caseData().case)
  expect(q.status).toBe('待补后续事实')
  expect(q.has_followup).toBe(false)
  expect(q.independently_verified).toBe(false)
  expect(q.divination_accuracy_calculated).toBe(false)
  expect(q.tags).toContain('待补后续')
})

it('有事实但后续早于事前封存，必须提示时间顺序冲突',()=>{
  const data=caseData().case
  data.feedback=[{result_type:'未吻合',observations:'实际结果与初判不同',
    recorded_at:'2026-10-19T10:00:00.000Z'}]
  const q=inspectCaseEvidence(data)
  expect(q.status).toBe('需核对记录顺序')
  expect(q.needs_time_review).toBe(true)
  expect(q.notices.some(s=>s.includes('早于事前封存'))).toBe(true)
})

it('只有尚无结果/无法判断不应当算真实后续结论',()=>{
  const data=caseData().case
  data.feedback=[{result_type:'尚无结果',observations:'暂时没有实际结果',
    recorded_at:'2026-10-22T10:00:00Z'}]
  const q=inspectCaseEvidence(data)
  expect(q.has_followup).toBe(false)
  expect(q.tags).toContain('待补后续')
})

it('CSV 对 Excel 公式、引号和换行安全编码',()=>{
  const result=csvCell(' =HYPERLINK("https://example.invalid","点我")')
  expect(result.startsWith('"\' =HYPERLINK')).toBe(true)
  expect(result).toContain('""https://example.invalid""')
  const csv=exportCaseReviewCsv([{
    fingerprint:'alpha',status:'待审核',
    review_note:'=1+1',
    case:{...caseData().case,before:'+cmd|test'}
  }])
  expect(csv.startsWith('\ufeff')).toBe(true)
  expect(csv).toContain('"\'=1+1"')
  expect(csv).toContain('"\'+cmd|test"')
})

it('审核备注与状态修改不会修改分享者的封存原文',()=>{
  importToInbox(JSON.stringify(caseData()))
  const original=readCaseInbox()[0].case.before
  const id=readCaseInbox()[0].fingerprint
  updateInboxReviewNote(id,'需要核对日月，保留未吻合案例')
  expect(readCaseInbox()[0].review_note).toBe('需要核对日月，保留未吻合案例')
  expect(readCaseInbox()[0].case.before).toBe(original)
  expect(()=>updateInboxReviewNote(id,'x'.repeat(601))).toThrow()
})

it('审核备注随备份恢复，重复案例不能覆盖较新的审核备注',()=>{
  importToInbox(JSON.stringify(caseData()))
  const original=readCaseInbox()[0]
  updateInboxReviewNote(original.fingerprint,'本机最新意见')
  const backup=JSON.stringify({format:'wanxiang-case-inbox-backup-v1',version:1,records:[
    {...original,review_note:'旧版意见'},
    {fingerprint:'beta',review_note:'第二份复盘',status:'待审核',
      imported_at:'2026-10-23T12:00:00Z',case:caseData('beta').case}
  ]})
  const result=restoreInboxBackup(backup)
  expect(result.added).toBe(1)
  expect(result.duplicates).toBe(1)
  expect(readCaseInbox().find(x=>x.fingerprint===original.fingerprint).review_note).toBe('本机最新意见')
  expect(readCaseInbox().find(x=>x.fingerprint==='beta').review_note).toBe('第二份复盘')
})

it('本机收案界面支持录入复盘备注并显示证据注意事项',()=>{
  importToInbox(JSON.stringify(caseData()))
  render(<CaseExchangeCenter onClose={()=>{}}/>)
  expect(screen.getByText('待补后续事实')).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:'展开研判与反馈'}))
  expect(screen.getByText('V28 · 案例证据与复核提示')).toBeTruthy()
  fireEvent.change(screen.getByLabelText('复盘审核备注'),{target:{value:'另有不同解释，需要继续核查'}})
  expect(readCaseInbox()[0].review_note).toBe('另有不同解释，需要继续核查')
})
