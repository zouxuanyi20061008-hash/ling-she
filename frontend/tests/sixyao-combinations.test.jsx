// @vitest-environment jsdom
import React from 'react'
import {afterEach,expect,it} from 'vitest'
import {cleanup,render,screen,fireEvent} from '@testing-library/react'
import SixYaoCombinationPanel from '../src/SixYaoCombinationPanel.jsx'
afterEach(()=>cleanup())
const pair=(positions,branches,he=false,chong=false)=>({
  positions,branches,is_six_he:he,is_six_chong:chong
})
function fixture(){
  return {hexagram_combinations:{
    version:'V39',reference:'https://zh.wikisource.org/zh-hans/增删卜易/19',
    scope:'本模块只列结构，不自动定吉凶与合化',
    ben:{name:'乾',label:'六冲卦',kind:'six_chong',pair_evidence:[
      pair([1,4],['子','午'],false,true),
      pair([2,5],['寅','申'],false,true),
      pair([3,6],['辰','戌'],false,true)]},
    bian:{name:'泰',label:'六合卦',kind:'six_he',pair_evidence:[]},
    transition:'六冲卦 → 六合卦',
    counts:{visible:1,mixed:0,waiting:1},
    original_triad_candidates:[{
      element:'水',branches:['申','子','辰'],positions:[5,1,3],
      moving_positions:[5],kind:'one_moving_three_branches',
      formed:null,calendar_warnings:['未确认日辰，旬空未核']}],
    moving_transformed_candidates:[],
    missing_branch_candidates:[{
      element:'金',positions:[1,3],present_branches:['丑','酉'],
      missing_branch:'巳',kind:'two_moving_missing_third',formed:false}]
  }}
}
it('六爻全盘下展示本卦六冲、之卦六合和三支原卦候选，附典籍链接',()=>{
  render(<SixYaoCombinationPanel chart={fixture()}/>)
  expect(screen.getByRole('region',{name:/六爻六合六冲与三合局分析/})).toBeTruthy()
  expect(screen.getByText('六合、六冲与三合候选')).toBeTruthy()
  expect(screen.getByText('六冲卦')).toBeTruthy()
  expect(screen.getByText('六合卦')).toBeTruthy()
  expect(screen.queryByText('动爻进退')).toBeNull()
  expect(screen.getByRole('link',{name:/增删卜易/}).getAttribute('href')).toContain('增删卜易/19')
  const btn=screen.getByText(/原卦三支俱见 · 1 组/)
  fireEvent.click(btn)
  expect(screen.getByText(/三支组合候选/)).toBeTruthy()
  expect(screen.getByText(/未确认日辰，旬空未核/)).toBeTruthy()
})
it('两明动仍缺一支只列虚三待用，没有虚构补足时间',()=>{
  render(<SixYaoCombinationPanel chart={fixture()}/>)
  fireEvent.click(screen.getByText(/虚三待用：两动尚缺一支/))
  expect(screen.getByText(/尚缺 巳/)).toBeTruthy()
  expect(screen.getByText(/不推测什么时候补齐/)).toBeTruthy()
})
it('老版本没有三合数据时友好提示，不输出伪造结论',()=>{
  render(<SixYaoCombinationPanel chart={{}}/>)
  expect(screen.getByText(/三合六合结构尚未生成/)).toBeTruthy()
})
