// @vitest-environment jsdom
// 藏经阁断点续读回归：不涉及起卦、六爻、历法与个人密钥。
import React from 'react'
import {beforeEach,afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,cleanup,within} from '@testing-library/react'
import StudyHall from '../src/StudyHall.jsx'

const props={onClose:()=>{},apiKey:'',setApiKey:()=>{},aiModel:'deepseek-chat',
  setAiModel:()=>{},accessCode:'',setAccessCode:()=>{}}
const enterCatalog=(name)=>fireEvent.click(screen.getByRole('button',{name:new RegExp(name)}))
const readerWait={timeout:10000}
beforeEach(()=>{
  window.localStorage.clear()
  vi.stubGlobal('scrollTo',vi.fn())
})
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks()})

it.each([
  ['紫微斗数', '紫微斗数全书', 3],
  ['堪舆风水', '宅经', 3],
  ['大六壬', '六壬大全', 13],
  ['太乙神数', '太乙金镜式经', 11],
])('%s：典籍可打开并切换到末卷', async (method, title, count)=>{
  render(<StudyHall {...props}/>)
  enterCatalog('壹 · 典籍')
  expect(screen.getAllByRole('button',{name:/入卷研读/})).toHaveLength(9)
  enterCatalog(method+'.*入卷研读')
  const book=await screen.findByRole('region',{name:`《${title}》原文阅读`},{timeout:10000})
  const volumes=within(book).getByRole('combobox',{name:'选择卷次'})
  expect(volumes.options).toHaveLength(count)
  fireEvent.change(volumes,{target:{value:String(count-1)}})
  expect(volumes.value).toBe(String(count-1))
  expect((await within(book).findByLabelText('原文')).textContent.trim().length).toBeGreaterThan(20)
  expect(within(book).getByRole('link',{name:/核对原典/}).href).toContain('wikisource.org')
},15000)

it('关闭操作声音后重新打开书房设定仍保持关闭', ()=>{
  const first=render(<StudyHall {...props}/>)
  enterCatalog('肆 · 设定')
  const toggle=()=>screen.getByRole('button',{name:'操作声音',exact:true})
  expect(toggle().getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(toggle())
  expect(toggle().getAttribute('aria-pressed')).toBe('false')
  first.unmount()
  render(<StudyHall {...props}/>)
  enterCatalog('肆 · 设定')
  expect(toggle().getAttribute('aria-pressed')).toBe('false')
})

it('典籍换篇保存进度，返回目录和重新打开后均可以续读',async()=>{
  const first=render(<StudyHall {...props}/>)
  enterCatalog('壹 · 典籍')
  const openMeihua=()=>fireEvent.click(screen.getByRole('button',{name:/梅花易数.*入卷研读/}))
  openMeihua()
  const quick=await screen.findByRole('navigation',{name:'藏经阁快速翻篇'},readerWait)
  fireEvent.click(within(quick).getByRole('button',{name:'下一篇 →'}))
  expect(JSON.parse(window.localStorage.getItem('wanxiang-library-progress-v1'))['fullreader:meihua']).toBe(1)
  first.unmount()
  render(<StudyHall {...props}/>)
  enterCatalog('壹 · 典籍')
  fireEvent.click(screen.getByRole('button',{name:/梅花易数 · 第 2 篇/}))
  expect(await screen.findByText(/第 2 篇 \/ 共/,{},readerWait)).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:/返回典籍目录/}))
  openMeihua()
  expect(await screen.findByText(/第 1 篇 \/ 共/,{},readerWait)).toBeTruthy()
},30000)

it('课程可以续读，损坏的旧进度不会导致页面崩溃',()=>{
  const first=render(<StudyHall {...props}/>)
  enterCatalog('贰 · 修习')
  fireEvent.click(screen.getAllByRole('button',{name:/开始修习/})[1])
  fireEvent.click(screen.getByRole('button',{name:/下一页/}))
  expect(JSON.parse(window.localStorage.getItem('wanxiang-library-progress-v1'))['lesson:meihua']).toBe(1)
  first.unmount()
  render(<StudyHall {...props}/>)
  enterCatalog('贰 · 修习')
  expect(screen.getByRole('button',{name:/梅花易数 · 第 2 课/})).toBeTruthy()
})

it('《周易》按上经和下经列全六十四卦，可直达并连续翻卦',()=>{
  render(<StudyHall {...props}/>)
  enterCatalog('壹 · 典籍')
  fireEvent.click(screen.getByRole('button',{name:/周易.*入卷研读/}))
  const chooser=()=>screen.getByRole('combobox',{name:'选择卦象'})
  const quick=()=>within(screen.getByRole('navigation',{name:'藏经阁快速翻篇'}))
  const groups=Array.from(chooser().querySelectorAll('optgroup'))
  expect(groups.map(group=>[group.label,group.children.length])).toEqual([['上经',30],['下经',34]])
  expect(groups[0].children[0].textContent).toMatch(/^1\. .*乾/)
  expect(groups[0].children[29].textContent).toMatch(/^30\. .*[离離]/)
  expect(groups[0].children[2].textContent).toMatch(/屯 · zhūn/)
  fireEvent.change(chooser(),{target:{value:'2'}})
  expect(screen.getByRole('heading',{name:/屯/}).querySelector('rt').textContent).toBe('zhūn')
  fireEvent.change(chooser(),{target:{value:'0'}})
  expect(groups[1].children[0].textContent).toMatch(/^31\. .*咸/)
  expect(groups[1].children[33].textContent).toMatch(/^64\. .*未[济濟]/)
  expect(quick().getByRole('button',{name:/上一卦/}).disabled).toBe(true)
  expect(within(screen.getByRole('region',{name:'卦辞'})).getByText(/元.*亨.*利.*[贞貞]/)).toBeTruthy()
  const lines=screen.getByRole('region',{name:'爻辞'})
  expect(Array.from(lines.querySelectorAll('dt'),term=>term.textContent)).toEqual([
    '初九','九二','九三','九四','九五','上九','用九',
  ])
  expect(screen.getByRole('region',{name:'大象传'}).textContent).toMatch(/君子以自[强強彊]不息/)
  const commentary=screen.getByText('查看彖传与小象传')
  expect(commentary.closest('details').open).toBe(false)
  fireEvent.click(commentary)
  expect(commentary.closest('details').open).toBe(true)
  const firstSource=screen.getByRole('link',{name:/核对原典/}).href
  fireEvent.change(chooser(),{target:{value:'29'}})
  expect(quick().getByText('第 30 卦 / 共 64 卦')).toBeTruthy()
  fireEvent.click(quick().getByRole('button',{name:/下一卦/}))
  expect(quick().getByText('第 31 卦 / 共 64 卦')).toBeTruthy()
  fireEvent.change(chooser(),{target:{value:'63'}})
  expect(quick().getByText('第 64 卦 / 共 64 卦')).toBeTruthy()
  expect(screen.getByRole('heading',{name:/未[济濟]/})).toBeTruthy()
  expect(screen.getByRole('region',{name:'爻辞'}).querySelectorAll('dt')).toHaveLength(6)
  expect(screen.getByRole('link',{name:/核对原典/}).href).not.toBe(firstSource)
  expect(JSON.parse(window.localStorage.getItem('wanxiang-library-progress-v1'))['reader:zhouyi']).toBe(63)
  fireEvent.click(quick().getByRole('button',{name:/返回目录/}))
  expect(screen.getByRole('button',{name:/周易 · 第 64 卦/})).toBeTruthy()
})

it('易传可逐篇查看，并回到之前的卦',async()=>{
  render(<StudyHall {...props}/>)
  enterCatalog('壹 · 典籍')
  fireEvent.click(screen.getByRole('button',{name:/周易.*入卷研读/}))
  fireEvent.change(screen.getByRole('combobox',{name:'选择卦象'}),{target:{value:'43'}})
  fireEvent.click(screen.getByRole('button',{name:/读易传/}))
  const volume=await screen.findByRole('combobox',{name:'选择易传'},readerWait)
  expect(Array.from(volume.options,entry=>entry.textContent)).toEqual([
    '文言传','系辞上传','系辞下传','说卦传','序卦传','杂卦传',
  ])
  fireEvent.change(volume,{target:{value:'4'}})
  expect(screen.getByText(/有天地，然后万物生焉/)).toBeTruthy()
  expect(screen.getByRole('link',{name:/核对原典/}).href).toContain('oldid=')
  fireEvent.click(screen.getByRole('button',{name:/回六十四卦/}))
  expect(screen.getByRole('heading',{name:/姤/}).querySelector('rt').textContent).toBe('gòu')
},15000)

it('旧版《周易》第二页的进度仍续读坤卦，并保留原有今释',()=>{
  window.localStorage.setItem('wanxiang-library-progress-v1',JSON.stringify({'reader:zhouyi':1}))
  render(<StudyHall {...props}/>)
  enterCatalog('壹 · 典籍')
  fireEvent.click(screen.getByRole('button',{name:/周易 · 第 2 卦/}))
  const reader=within(screen.getByRole('navigation',{name:'藏经阁快速翻篇'}))
  expect(reader.getByText('第 2 卦 / 共 64 卦')).toBeTruthy()
  expect(screen.getByRole('heading',{name:/坤/})).toBeTruthy()
  expect(within(screen.getByRole('region',{name:'爻辞'})).getByText('用六',{exact:true})).toBeTruthy()
  expect(screen.getByText(/地的承载之德可以作为修身的文化比喻/)).toBeTruthy()
})
