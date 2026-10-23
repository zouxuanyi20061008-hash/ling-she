// @vitest-environment jsdom
import React from 'react'
import {beforeEach,afterEach,it,expect,vi} from 'vitest'
import {cleanup,render,screen,fireEvent,waitFor} from '@testing-library/react'
import CaseExchangeCenter from '../src/CaseExchangeCenter.jsx'
import {INBOX_KEY,MAX_INBOX,shareCaseFromArchive,parseSharedCase,
 importToInbox,readCaseInbox,markInboxCase,restoreInboxBackup} from '../src/case-exchange.js'

const mockCase=(id='friend-001')=>({
  id,created_at:'2026-10-23T09:01:00.000Z',
  question:'私人求问：绝不外传！',
  before:'事前判断：需要核实日月与冲合',
  feedback:[{recorded_at:'2026-10-23T10:00:00.000Z',
    result_type:'未吻合',observations:'后来实际结果与初判不一致'}],
  snapshot:{
    original_numbers:[7,8,9,6,7,8],
    ben_gua:'水天需',bian_gua:'火天大有',
    day_ganzhi:'甲子',month_branch:'辰',
    chosen_category:'父母',selected_position:3,
    human_review:{fields:{hypothesis:'主观假设',support:'未证实',
      counter:'相反条件',verification:'跟踪实际后果'}},
    focus_selection:{position:3,reason:'选此爻的理由',counter:'其他爻也可能有关',
      context:'不适合转发的私人背景'},
    secret_api_key:'sk-example-would-never-export'
  }
})
beforeEach(()=>window.localStorage.clear())
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()})

it('默认分享文件没有私人提问、密钥、人工草稿、选择理由',()=>{
  const bundle=shareCaseFromArchive(mockCase())
  const raw=JSON.stringify(bundle)
  expect(bundle.format).toBe('wanxiang-sixyao-case-v1')
  expect(bundle.case.original_numbers).toEqual([7,8,9,6,7,8])
  expect(bundle.case.before).toContain('事前判断')
  expect(bundle.case.feedback[0].result_type).toBe('未吻合')
  for(const privateField of ['私人求问','sk-example','主观假设','选此爻的理由','私人背景']){
    expect(raw).not.toContain(privateField)
  }
  expect(bundle.case.human_review).toBeNull()
  expect(bundle.case.focus_selection).toBeNull()
})

it('分享者明确选择附带人工材料后才导出相应字段',()=>{
  const bundle=shareCaseFromArchive(mockCase(),{includeResearch:true})
  expect(bundle.case.human_review.counter).toBe('相反条件')
  expect(bundle.case.focus_selection.reason).toBe('选此爻的理由')
  expect(JSON.stringify(bundle)).not.toContain('私人求问')
})

it('导入去重不覆盖已经审核或封存的内容',()=>{
  const one=JSON.stringify(shareCaseFromArchive(mockCase()))
  const records=importToInbox(one)
  expect(records).toHaveLength(1)
  expect(records[0].case.before).toContain('事前判断')
  expect(()=>importToInbox(one)).toThrow('已经导入')
  const saved=markInboxCase(records[0].fingerprint,'收录')
  expect(saved[0].status).toBe('收录')
  expect(readCaseInbox()[0].status).toBe('收录')
})

it('坏文件、非法爻值、缺分享同意不能写入案例簿',()=>{
  const original=JSON.stringify(shareCaseFromArchive(mockCase()))
  const wrongNumbers=JSON.parse(original);wrongNumbers.case.original_numbers=[5,6,7,8,9,9]
  const missingConsent=JSON.parse(original);missingConsent.consent='自动发送'
  for(const file of ['{broken',JSON.stringify(wrongNumbers),JSON.stringify(missingConsent)]){
    expect(()=>importToInbox(file)).toThrow()
  }
  expect(window.localStorage.getItem(INBOX_KEY)).toBeNull()
})

it('本机备份可合并恢复；已有案例及审核状态不被覆盖',()=>{
  const a=JSON.stringify(shareCaseFromArchive(mockCase('friend-a')))
  const b=JSON.stringify(shareCaseFromArchive(mockCase('friend-b')))
  let inbox=importToInbox(a)
  const oldId=inbox[0].fingerprint
  const other=parseSharedCase(b)
  inbox=markInboxCase(oldId,'收录')
  const backup={
    format:'wanxiang-case-inbox-backup-v1',version:1,
    records:[{fingerprint:oldId,status:'暂不收录',case:inbox[0].case,
      imported_at:'2026-10-23T12:00:00Z'},
      {fingerprint:other.source_key,status:'待审核',case:other.case,
      imported_at:'2026-10-23T12:00:00Z'}]
  }
  const merged=restoreInboxBackup(JSON.stringify(backup))
  expect(merged.added).toBe(1)
  expect(merged.duplicates).toBe(1)
  expect(merged.entries).toHaveLength(2)
  expect(merged.entries.find(x=>x.fingerprint===oldId).status).toBe('收录')
  expect(MAX_INBOX).toBe(40)
})

it('恢复坏的备份时不会修改现有案例簿',()=>{
  const original=JSON.stringify(shareCaseFromArchive(mockCase()))
  importToInbox(original)
  const unchanged=window.localStorage.getItem(INBOX_KEY)
  const backup={format:'wanxiang-case-inbox-backup-v1',version:1,
    records:[{fingerprint:'bad',status:'未知',case:parseSharedCase(original).case}]}
  expect(()=>restoreInboxBackup(JSON.stringify(backup))).toThrow()
  expect(window.localStorage.getItem(INBOX_KEY)).toBe(unchanged)
})

it('书院收案中心可以预览、导入、标记状态，完全本机完成',async()=>{
  const json=JSON.stringify(shareCaseFromArchive(mockCase()))
  render(<CaseExchangeCenter onClose={()=>{}}/>)
  const file=new File([json],'share.json',{type:'application/json'})
  Object.defineProperty(file,'text',{value:async()=>json})
  fireEvent.change(screen.getByLabelText('选择一份 JSON 分享包'),{target:{files:[file]}})
  await waitFor(()=>expect(screen.getByText(/导入前预览/)).toBeTruthy())
  expect(readCaseInbox()).toHaveLength(0)
  fireEvent.click(screen.getByRole('button',{name:'确认导入本机待审核'}))
  expect(readCaseInbox()).toHaveLength(1)
  fireEvent.click(screen.getByRole('button',{name:'展开研判与反馈'}))
  expect(screen.getByText(/后来实际结果与初判不一致/)).toBeTruthy()
  fireEvent.click(screen.getAllByRole('button',{name:'收录'})[1])
  expect(readCaseInbox()[0].status).toBe('收录')
})
