// @vitest-environment jsdom
import React from 'react'
import {beforeEach,afterEach,it,expect,vi} from 'vitest'
import {cleanup,render,screen,fireEvent} from '@testing-library/react'
import CaseExchangeCenter from '../src/CaseExchangeCenter.jsx'
import {conditionValue,conditionGroups,conditionContrast,compareCasePair} from '../src/case-compare.js'
import {INBOX_KEY,readCaseInbox} from '../src/case-exchange.js'

const entry=(id,ben,nums,feedback=[])=>({
  fingerprint:id,status:'待审核',review_note:'保留相反解释',
  case:{original_numbers:nums,ben_gua:ben,bian_gua:'火天大有',
    day_ganzhi:'甲子',month_branch:'辰',chosen_category:'父母',
    selected_position:3,created_at:'2026-10-23T08:00:00Z',
    before:'事前封存研究 '+id,feedback}
})
const obs=(label)=>({result_type:label,observations:'后续实际情况还需独立核验',
  recorded_at:'2026-10-24T08:00:00Z'})
const cases=()=>[
  entry('a','水天需',[7,8,9,6,7,8],[obs('基本吻合')]),
  entry('b','水天需',[7,8,9,7,7,8],[obs('未吻合')]),
  entry('c','乾为天',[7,8,7,7,7,8],[obs('尚无结果')]),
  entry('d','乾为天',[6,8,7,7,7,8],[obs('无法判断'),obs('部分吻合')])
]
beforeEach(()=>localStorage.clear())
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()})

it('V33 对动爻按六九识别，不能将七八误作动爻',()=>{
  expect(conditionValue(cases()[0].case,'moving_count')).toBe('2爻')
  expect(conditionValue(cases()[1].case,'moving_lines')).toBe('第3爻')
  expect(conditionValue(cases()[2].case,'moving_count')).toBe('0爻')
  expect(conditionValue({original_numbers:[7,8]},'moving_count')).toBe('未记录')
  expect(()=>conditionValue({},'unknown')).toThrow('不支持')
})

it('相同本卦分组仍包括未吻合、无结果和其他条件，且不推算准确率',()=>{
  const groups=conditionGroups(cases(),'ben_gua')
  expect(groups.map(x=>x.total).reduce((a,b)=>a+b,0)).toBe(4)
  const comparison=conditionContrast(cases(),'ben_gua','水天需')
  expect(comparison.matching.total).toBe(2)
  expect(comparison.other.total).toBe(2)
  expect(comparison.matching.self_reports['未吻合']).toBe(1)
  expect(comparison.other.self_reports['尚无结果']).toBe(1)
  expect(comparison.other.unresolved_cases).toBe(2)
  expect(comparison.caution).toContain('不足5份')
  expect(comparison.matching.accuracy_calculated).toBe(false)
  expect(comparison.other.independently_verified).toBe(0)
})

it('同一卦例多次自述标签不可被误加为成功率',()=>{
  const group=conditionContrast(cases(),'moving_count','1爻')
  expect(group.matching.total).toBe(2)
  expect(group.matching.unresolved_cases).toBe(1)
  expect(group.matching.self_reports['部分吻合']).toBe(1)
  expect(group.matching.self_reports['无法判断']).toBe(1)
})

it('两案对照显示共通条件和不同动爻，并保留不吻合反例',()=>{
  const pair=compareCasePair(cases(),['a','b'])
  expect(pair.rows.find(x=>x.label==='本卦').equal).toBe(true)
  expect(pair.rows.find(x=>x.label==='动爻数量').equal).toBe(false)
  expect(pair.cases[1].feedback[0].result_type).toBe('未吻合')
  expect(()=>compareCasePair(cases(),['a','a'])).toThrow()
  expect(()=>compareCasePair(cases(),['a','nonexistent'])).toThrow()
})

it('V33 本机条件筛选与两案对照不自动上传，不修改已有收案簿',()=>{
  localStorage.setItem(INBOX_KEY,JSON.stringify(cases()))
  const remote=vi.fn()
  vi.stubGlobal('fetch',remote)
  render(<CaseExchangeCenter onClose={()=>{}}/>)
  expect(screen.getByText('V33 · 卦象条件与反例对照')).toBeTruthy()
  fireEvent.change(screen.getByLabelText('目标条件值'),{target:{value:'水天需'}})
  fireEvent.click(screen.getByRole('button',{name:'在下方只看符合条件的案例'}))
  expect(screen.getByText(/显示 2 \/ 4 份/)).toBeTruthy()
  fireEvent.click(screen.getByLabelText('选择案例 a'))
  fireEvent.click(screen.getByLabelText('选择案例 b'))
  fireEvent.click(screen.getByRole('button',{name:/对照已选的两份案例/}))
  expect(screen.getAllByText('动爻位置组合').length).toBeGreaterThan(0)
  expect(screen.getByText(/相同卦象和动爻不意味着问题背景等价/)).toBeTruthy()
  expect(remote).not.toHaveBeenCalled()
  expect(readCaseInbox()).toHaveLength(4)
})

it('更换维度会重置条件筛选，并保留原始本机案例',()=>{
  localStorage.setItem(INBOX_KEY,JSON.stringify(cases()))
  render(<CaseExchangeCenter onClose={()=>{}}/>)
  fireEvent.change(screen.getByLabelText('研究条件'),{target:{value:'moving_count'}})
  expect(screen.getByLabelText('目标条件值').value).toMatch(/爻/)
  expect(readCaseInbox()).toHaveLength(4)
})
