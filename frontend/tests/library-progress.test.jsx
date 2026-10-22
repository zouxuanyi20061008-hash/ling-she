// @vitest-environment jsdom
// 藏经阁断点续读回归：不涉及起卦、六爻、历法与个人密钥。
import React from 'react'
import {beforeEach,afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,cleanup} from '@testing-library/react'
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
