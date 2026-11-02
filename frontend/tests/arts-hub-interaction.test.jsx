// @vitest-environment jsdom
// 首页互动回归：八卦探象只作象意练习，不触碰正式排盘算法。
import React from 'react'
import {afterEach,it,expect,vi} from 'vitest'
import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import ArtsHub from '../src/ArtsHub.jsx'

afterEach(()=>{cleanup();vi.restoreAllMocks()})

function renderHome(overrides={}) {
  const props={
    screen:'home',onStart:vi.fn(),onBack:vi.fn(),onSelect:vi.fn(),
    onStudy:vi.fn(),onLearn:vi.fn(),activeGroup:'全部',setActiveGroup:vi.fn(),
    page:0,setPage:vi.fn(),...overrides
  }
  return {props,...render(<ArtsHub {...props}/>)}
}

it('首页呈现八个可访问卦象，默认选中乾卦并明确说明体验边界',()=>{
  renderHome()
  const explorer=screen.getByRole('region',{name:'八卦探象互动体验'})
  expect(explorer).toBeTruthy()
  const trigramButtons=screen.getAllByRole('button').filter(button=>
    button.getAttribute('aria-label')?.includes('卦：')
  )
  expect(trigramButtons).toHaveLength(8)
  expect(screen.getByRole('button',{name:/乾卦/}).getAttribute('aria-pressed')).toBe('true')
  expect(screen.getByText('乾 · 天')).toBeTruthy()
  expect(screen.getByText(/不参与正式起卦/)).toBeTruthy()
})

it('点选兑卦后，选中态、自然之象、后天方位和五行同步更新',()=>{
  renderHome()
  const qian=screen.getByRole('button',{name:/乾卦/})
  const dui=screen.getByRole('button',{name:/兑卦/})
  expect(qian.getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(dui)
  expect(dui.getAttribute('aria-pressed')).toBe('true')
  expect(qian.getAttribute('aria-pressed')).toBe('false')
  expect(screen.getByText('兑 · 泽')).toBeTruthy()
  expect(screen.getByText('后天方位 · 西')).toBeTruthy()
  expect(screen.getByText('五行 · 金')).toBeTruthy()
})

it('随机观象从既有八卦资料中选取，并保留非正式起卦提示',()=>{
  vi.spyOn(Math,'random').mockReturnValue(0.5)
  renderHome()
  fireEvent.click(screen.getByRole('button',{name:'随机观象'}))
  expect(screen.getByText('巽 · 风')).toBeTruthy()
  expect(screen.getByText('后天方位 · 东南')).toBeTruthy()
  expect(screen.getByText(/不参与正式起卦/)).toBeTruthy()
})

it('旋转卦环只改变方位，不改变当前所选卦象，并且可以复位',()=>{
  const {container}=renderHome()
  const orbit=container.querySelector('.atlas-orbit')
  const qian=screen.getByRole('button',{name:/乾卦/})
  const before=qian.style.getPropertyValue('--orbit-x')
  fireEvent.click(screen.getByRole('button',{name:'顺时针旋转45度'}))
  expect(orbit.getAttribute('data-rotation')).toBe('45')
  expect(qian.style.getPropertyValue('--orbit-x')).not.toBe(before)
  expect(qian.getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(screen.getByRole('button',{name:'恢复八卦环默认方位'}))
  expect(orbit.getAttribute('data-rotation')).toBe('0')
  expect(qian.style.getPropertyValue('--orbit-x')).toBe(before)
})

it('可把当前卦设为上卦或下卦，并用六条阴阳线显示组合卦',()=>{
  renderHome()
  expect(screen.getByText('天地 · 否')).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:/兑卦/}))
  fireEvent.click(screen.getByRole('button',{name:'将兑卦设为上卦'}))
  expect(screen.getByText('泽地 · 萃')).toBeTruthy()
  expect(screen.getByRole('img',{name:/六爻卦形/})).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:'将兑卦设为下卦'}))
  expect(screen.getByText('泽泽 · 兑')).toBeTruthy()
})

it('首页开始研习入口仍调用原有导航回调',()=>{
  const onStart=vi.fn()
  renderHome({onStart})
  fireEvent.click(screen.getByRole('button',{name:/开始研习/}))
  expect(onStart).toHaveBeenCalledOnce()
})
