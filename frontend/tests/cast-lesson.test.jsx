// @vitest-environment jsdom
import React from 'react'
import { afterEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import CastLesson from '../src/CastLesson.jsx'

afterEach(cleanup)

it('随盘演示按操作逐步展示当前数据，最后可以从头看', () => {
  render(<CastLesson title="读盘示范" steps={[
    {title:'先找位置',text:'看这一宫。',layout:'layers',items:[{label:'宫位',value:'坎宫',active:true}]},
    {title:'再核对方位',text:'看罗盘标注。',visual:<span>北 0°</span>},
  ]}/>)
  const guide=within(screen.getByRole('region',{name:'读盘示范'}))
  expect(guide.getByRole('button',{name:/上一步/}).disabled).toBe(true)
  expect(guide.getByText('坎宫')).toBeTruthy()
  expect(guide.queryByText('北 0°')).toBeNull()
  fireEvent.click(guide.getByRole('button',{name:/下一步/}))
  expect(guide.getByRole('heading',{name:'再核对方位'})).toBeTruthy()
  expect(guide.getByText('北 0°')).toBeTruthy()
  expect(guide.queryByText('坎宫')).toBeNull()
  fireEvent.click(guide.getByRole('button',{name:/从头再看/}))
  expect(guide.getByRole('heading',{name:'先找位置'})).toBeTruthy()
})
