// @vitest-environment jsdom
import React from 'react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import CaseExchangeCenter from '../src/CaseExchangeCenter.jsx'
import {BACKUP_FORMAT_V2,BACKUP_MAX_CHARS,INBOX_KEY,MAX_INBOX,
 createInboxBackup,previewInboxBackup,restoreInboxBackup,readCaseInbox} from '../src/case-exchange.js'

const entry=(id,status='待审核',before='封存的原始事前推演')=>({
 fingerprint:id,status,imported_at:'2026-10-23T09:00:00.000Z',
 review_note:'本地站长备注：'+id,
 case:{
   original_numbers:[6,7,8,9,7,8],before,ben_gua:'水天需',bian_gua:'火天大有',
   chosen_category:'父母',selected_position:3,created_at:'2026-10-22T09:00:00.000Z',
   day_ganzhi:'甲子',month_branch:'辰',
   feedback:[{recorded_at:'2026-10-25T10:00:00.000Z',result_type:'未吻合',
     observations:'事实并未符合事前预测'}],
   human_review:null,focus_selection:null,
   hidden_token:'sk-MUST-NOT-BE-IN-BACKUP'
 },
 password:'private-owner-password',
})
const v1=entries=>JSON.stringify({
 format:'wanxiang-case-inbox-backup-v1',version:1,
 exported_at:'2026-10-24T12:00:00Z',records:entries
})
beforeEach(()=>window.localStorage.clear())
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()})

it('V34 导出新版私密备份，只保留案例白名单与审核状态，不包含意外密钥',()=>{
  const result=createInboxBackup([entry('old','收录'),entry('other')])
  expect(result.format).toBe(BACKUP_FORMAT_V2)
  expect(result.version).toBe(2)
  expect(result.manifest).toMatchObject({total:2,pending:1,approved:1,excluded:0})
  const raw=JSON.stringify(result)
  expect(raw).toContain('事实并未符合事前预测')
  expect(raw).toContain('本地站长备注')
  expect(raw).not.toContain('password')
  expect(raw).not.toContain('sk-MUST-NOT-BE-IN-BACKUP')
  expect(result.records[0].status).toBe('收录')
})

it('V27 旧备份可在新设备恢复；确认前预览完全不会写入',()=>{
  const raw=v1([entry('legacy','收录')])
  const preview=previewInboxBackup(raw)
  expect(preview).toMatchObject({version:1,total:1,added:1,duplicates:0,
    conflicts:0,existing:0,canRestore:true})
  expect(window.localStorage.getItem(INBOX_KEY)).toBeNull()
  const result=restoreInboxBackup(raw)
  expect(result.added).toBe(1)
  expect(readCaseInbox()[0].review_note).toBe('本地站长备注：legacy')
  expect(readCaseInbox()[0].status).toBe('收录')
})

it('V34 跨设备合并不覆盖已有审核；同编号不同原文明确报告冲突并跳过',()=>{
  const current=entry('same','收录','本机封存原话必须保留')
  window.localStorage.setItem(INBOX_KEY,JSON.stringify([current]))
  const raw=JSON.stringify(createInboxBackup([
    entry('same','暂不收录','另一设备封存了不同的原话'),
    entry('new','待审核','新设备不存在的记录')
  ]))
  const original=window.localStorage.getItem(INBOX_KEY)
  const preview=previewInboxBackup(raw)
  expect(preview).toMatchObject({total:2,existing:1,added:1,duplicates:1,
    conflicts:1,overLimit:false})
  expect(preview.conflicted_ids).toEqual(['same'])
  expect(window.localStorage.getItem(INBOX_KEY)).toBe(original)
  const result=restoreInboxBackup(raw)
  expect(result).toMatchObject({added:1,duplicates:1,conflicts:1})
  const saved=readCaseInbox()
  expect(saved).toHaveLength(2)
  expect(saved.find(x=>x.fingerprint==='same').case.before).toBe('本机封存原话必须保留')
  expect(saved.find(x=>x.fingerprint==='same').status).toBe('收录')
  expect(saved.find(x=>x.fingerprint==='same').review_note).toBe('本地站长备注：same')
})

it('坏 JSON、伪造审核状态、同文件重复编号、超容量均整体失败，不修改已有本机数据',()=>{
  window.localStorage.setItem(INBOX_KEY,JSON.stringify([entry('safe')]))
  const existing=window.localStorage.getItem(INBOX_KEY)
  const badStatus=JSON.stringify({format:BACKUP_FORMAT_V2,version:2,records:[
    {...entry('new'),status:'管理员已自动通过'}]})
  const tooMany=JSON.stringify({format:BACKUP_FORMAT_V2,version:2,records:
    Array.from({length:MAX_INBOX+1},(_,i)=>entry('record-'+i))})
  const duplicated=JSON.stringify({format:BACKUP_FORMAT_V2,version:2,records:
    [entry('same-id'),entry('same-id')]})
  for(const raw of ['bad json',badStatus,tooMany,duplicated,'x'.repeat(BACKUP_MAX_CHARS+1)]){
    expect(()=>previewInboxBackup(raw)).toThrow()
    expect(()=>restoreInboxBackup(raw)).toThrow()
    expect(window.localStorage.getItem(INBOX_KEY)).toBe(existing)
  }
})

it('V34 合并后超过40份会阻止写入，不静默截断文件',()=>{
  const old=Array.from({length:MAX_INBOX},(_,i)=>entry('old-'+i))
  window.localStorage.setItem(INBOX_KEY,JSON.stringify(old))
  const preserved=window.localStorage.getItem(INBOX_KEY)
  const raw=JSON.stringify(createInboxBackup([entry('one-more')]))
  expect(previewInboxBackup(raw).overLimit).toBe(true)
  expect(()=>restoreInboxBackup(raw)).toThrow('超过40份')
  expect(window.localStorage.getItem(INBOX_KEY)).toBe(preserved)
})

it('当前设备已有损坏的本机记录时拒绝覆盖，避免把损坏数据过滤后重写',()=>{
  window.localStorage.setItem(INBOX_KEY,'{broken-local')
  expect(()=>previewInboxBackup(v1([entry('new')]))).toThrow('本机')
  expect(()=>restoreInboxBackup(v1([entry('new')]))).toThrow()
  expect(window.localStorage.getItem(INBOX_KEY)).toBe('{broken-local')
})

it('跨设备恢复 UI 在文件预览与明确勾选之前不进行合并',async()=>{
  window.localStorage.setItem(INBOX_KEY,JSON.stringify([entry('existing','收录')]))
  const raw=JSON.stringify(createInboxBackup([
    entry('existing','暂不收录','不同的原始推演'),
    entry('portable')
  ]))
  render(<CaseExchangeCenter onClose={()=>{}}/>)
  const file=new File([raw],'私人迁移.json',{type:'application/json'})
  Object.defineProperty(file,'text',{value:async()=>raw})
  fireEvent.change(screen.getByLabelText('从收案簿备份恢复'),{target:{files:[file]}})
  await waitFor(()=>expect(screen.getByText('合并预览：尚未保存')).toBeTruthy())
  expect(readCaseInbox()).toHaveLength(1)
  expect(screen.getByText(/检测到 1 份同编号/)).toBeTruthy()
  const confirm=screen.getByRole('button',{name:'确认合并 1 份到本机'})
  expect(confirm.disabled).toBe(true)
  fireEvent.click(screen.getByRole('checkbox',{name:/我已确认这是自己的备份/}))
  expect(confirm.disabled).toBe(false)
  fireEvent.click(confirm)
  expect(readCaseInbox()).toHaveLength(2)
  expect(readCaseInbox().find(x=>x.fingerprint==='existing').status).toBe('收录')
  expect(screen.getByText(/V34 恢复完成/)).toBeTruthy()
})

it('文件仅在本机读取，预览与合并不会发起网络上传',async()=>{
  const fetchSpy=vi.fn()
  vi.stubGlobal('fetch',fetchSpy)
  render(<CaseExchangeCenter onClose={()=>{}}/>)
  const raw=v1([entry('moved')])
  const file=new File([raw],'old.json',{type:'application/json'})
  Object.defineProperty(file,'text',{value:async()=>raw})
  fireEvent.change(screen.getByLabelText('从收案簿备份恢复'),{target:{files:[file]}})
  await waitFor(()=>expect(screen.getByText('合并预览：尚未保存')).toBeTruthy())
  fireEvent.click(screen.getByRole('checkbox',{name:/我已确认这是自己的备份/}))
  fireEvent.click(screen.getByRole('button',{name:'确认合并 1 份到本机'}))
  expect(fetchSpy).not.toHaveBeenCalled()
})
