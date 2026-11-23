// @vitest-environment jsdom
// 藏经阁断点续读回归：不涉及起卦、六爻、历法与个人密钥。
import React from 'react'
import {beforeEach,afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,cleanup,within} from '@testing-library/react'
import StudyHall from '../src/StudyHall.jsx'

const props={onClose:()=>{},apiKey:'',setApiKey:()=>{},aiModel:'deepseek-chat',
  setAiModel:()=>{},accessCode:'',setAccessCode:()=>{}}
const enterCatalog=(name)=>fireEvent.click(screen.getByRole('button',{name:new RegExp(name)}))
beforeEach(()=>{
  window.localStorage.clear()
  vi.stubGlobal('scrollTo',vi.fn())
})
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks()})

it('典籍换篇保存进度，返回目录和重新打开后均可以续读',()=>{
  const first=render(<StudyHall {...props}/>)
  enterCatalog('壹 · 典籍')
  fireEvent.click(screen.getAllByRole('button',{name:/入卷研读/})[1])
  fireEvent.click(screen.getByRole('button',{name:'下一篇 →'}))
  expect(JSON.parse(window.localStorage.getItem('wanxiang-library-progress-v1'))['reader:meihua']).toBe(1)
  first.unmount()
  render(<StudyHall {...props}/>)
  enterCatalog('壹 · 典籍')
  fireEvent.click(screen.getByRole('button',{name:/梅花易数 · 第 2 篇/}))
  expect(screen.getByText(/第 2 篇 \/ 共/)).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:/返回典籍目录/}))
  fireEvent.click(screen.getAllByRole('button',{name:/入卷研读/})[1])
  expect(screen.getByText(/第 1 篇 \/ 共/)).toBeTruthy()
})

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
