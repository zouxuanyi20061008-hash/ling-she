// @vitest-environment jsdom
import React, { useState } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CastPageNav, CastPagePane, useCastPage } from '../src/CastPage.jsx'
import CastResultPanels, { CastResultPanel } from '../src/CastResultPanels.jsx'

function Workspace() {
  const [chart, setChart] = useState(null)
  const [date, setDate] = useState('')
  const page = useCastPage('qimen', Boolean(chart))
  return <>
    <CastPageNav title="奇门遁甲" hasResult={Boolean(chart)} {...page} />
    <CastPagePane name="form" {...page}>
      <label>起局日期<input value={date} onChange={event => { setDate(event.target.value); setChart(null) }} /></label>
      <button type="button" onClick={() => { setChart(date); page.showResult() }}>起局</button>
    </CastPagePane>
    <CastPagePane name="result" {...page}><p>盘面日期 {chart}</p></CastPagePane>
  </>
}

function ResultCategories() {
  const [value, setValue] = useState('board')
  return <CastResultPanels label="结果分类" value={value} onValueChange={setValue}>
    <CastResultPanel value="board" label="九宫盘">
      <button type="button" onClick={() => setValue('palace')}>打开震宫</button>
    </CastResultPanel>
    <CastResultPanel value="palace" label="宫位详情" mobileOnly>
      <button type="button" onClick={() => setValue('board')}>返回九宫</button>
    </CastResultPanel>
  </CastResultPanels>
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }))
  vi.stubGlobal('scrollTo', vi.fn())
  window.history.replaceState({}, '', '#qimen')
})

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '#qimen')
  vi.unstubAllGlobals()
})

it('手机排盘进入独立结果页，浏览器返回和前进保留参数及已算盘面', async () => {
  render(<Workspace />)
  expect(screen.getByRole('button', { name: '排盘结果' }).disabled).toBe(true)
  fireEvent.change(screen.getByRole('textbox', { name: '起局日期' }), { target: { value: '2026-06-22' } })
  fireEvent.click(screen.getByRole('button', { name: '起局' }))
  expect(window.location.hash).toBe('#qimen/result')
  expect(screen.queryByRole('textbox', { name: '起局日期' })).toBeNull()
  expect(screen.getByText('盘面日期 2026-06-22').closest('[data-cast-pane]').hidden).toBe(false)

  window.history.back()
  const date = await screen.findByRole('textbox', { name: '起局日期' })
  expect(window.location.hash).toBe('#qimen')
  expect(date.value).toBe('2026-06-22')
  window.history.forward()
  await waitFor(() => expect(screen.queryByRole('textbox', { name: '起局日期' })).toBeNull())
  expect(screen.getByText('盘面日期 2026-06-22').closest('[data-cast-pane]').hidden).toBe(false)

  fireEvent.click(screen.getByRole('button', { name: /返回排盘/ }))
  await waitFor(() => expect(window.location.hash).toBe('#qimen'))
  fireEvent.change(screen.getByRole('textbox', { name: '起局日期' }), { target: { value: '2026-06-23' } })
  expect(screen.getByRole('button', { name: '排盘结果' }).disabled).toBe(true)
})

it('没有本次盘面时，从结果地址加载会回到排盘参数', () => {
  window.history.replaceState({}, '', '#qimen/result')
  render(<Workspace />)
  expect(window.location.hash).toBe('#qimen')
  expect(screen.getByRole('textbox', { name: '起局日期' })).toBeTruthy()
  expect(screen.getByRole('button', { name: '排盘结果' }).disabled).toBe(true)
})

it('点宫位和从分类进入详情会同步高亮，返回九宫可以继续选宫', () => {
  render(<ResultCategories />)
  fireEvent.click(screen.getByRole('button', { name: '打开震宫' }))
  expect(screen.getByRole('button', { name: '宫位详情' }).getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(screen.getByRole('button', { name: '返回九宫' }))
  expect(screen.getByRole('button', { name: '九宫盘' }).getAttribute('aria-pressed')).toBe('true')
})
