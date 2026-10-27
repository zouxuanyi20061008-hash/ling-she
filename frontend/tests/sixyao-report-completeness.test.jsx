// @vitest-environment jsdom
import React from 'react'
import {afterEach,it,expect,vi} from 'vitest'
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {ReviewReport} from '../src/SixYaoStage.jsx'

afterEach(()=>{
  cleanup()
  vi.restoreAllMocks()
})
function chart(overrides={}){
  return {review_flow:{report:{
    title:'六爻研判学习笔记',
    verified_by_program:['六爻排盘数据已计算'],
    outstanding_questions:['实际合化仍需人工核实'],
    notice:'传统排盘条件，不是现实吉凶判断',
    sanhe_audit_digest:['V41 审核：两明动且月冲需复核'],
    sanhe_focus_digest:['V40 选取父母三爻，三合效力未定'],
    combination_digest:['V39 六合卦及水局候选'],
    progression_digest:['V38 五爻申化酉进神'],
    ...overrides
  }}}
}

it('V41 合局条件进入第五步研究报告，不遗漏三合、世应与空破',()=>{
  render(<ReviewReport chart={chart()} question="测试事项"/>)
  expect(screen.getByText('V41 三合成局条件与世应空破核查')).toBeTruthy()
  expect(screen.getByText(/V41 审核：两明动且月冲需复核/)).toBeTruthy()
  expect(screen.getByText(/V40 选取父母三爻/)).toBeTruthy()
  expect(screen.getByText(/V39 六合卦及水局候选/)).toBeTruthy()
  expect(screen.getByText(/V38 五爻申化酉进神/)).toBeTruthy()
  expect(screen.getByText(/实际合化仍需人工核实/)).toBeTruthy()
})

it('复制六爻研究记录应完整带上 V38-V41 新增摘要，且不自动判吉凶',async()=>{
  const writeText=vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(window.navigator,'clipboard',{
    configurable:true,value:{writeText}
  })
  render(<ReviewReport chart={chart()} question="家庭事项"/>)
  fireEvent.click(screen.getByRole('button',{name:'复制研究记录'}))
  await waitFor(()=>expect(writeText).toHaveBeenCalledOnce())
  const saved=writeText.mock.calls[0][0]
  expect(saved).toContain('所问事项：家庭事项')
  for(const marker of [
    'V41 三合成立条件与世应空破核验',
    'V40 三合与用神、日月合参',
    'V39 六合六冲卦类与三合候选',
    'V38 动爻进退神',
    'V41 审核：两明动且月冲需复核',
    'V40 选取父母三爻',
    'V39 六合卦及水局候选',
    'V38 五爻申化酉进神',
    '实际合化仍需人工核实'
  ])expect(saved).toContain(marker)
  expect(saved).toContain('不是现实吉凶判断')
})

it('加载旧版不含 V38-V41 摘要的研究记录不会崩溃或编造数据',async()=>{
  render(<ReviewReport chart={chart({
    sanhe_audit_digest:undefined,sanhe_focus_digest:undefined,
    combination_digest:undefined,progression_digest:undefined
  })} question=""/>)
  expect(screen.getByText('六爻研判学习笔记')).toBeTruthy()
  expect(screen.queryByText('V41 三合成局条件与世应空破核查')).toBeNull()
  expect(screen.getByText(/传统排盘条件，不是现实吉凶判断/)).toBeTruthy()
})
