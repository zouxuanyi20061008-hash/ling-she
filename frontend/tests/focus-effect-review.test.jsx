// @vitest-environment jsdom
import React from 'react'
import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import {it,expect,afterEach} from 'vitest'
import {FocusEffectReviewStudy} from '../src/SixYaoStage.jsx'
afterEach(()=>cleanup())

const src=(role='原神')=>({
  source_position:2,source_ganzhi:'乙丑',
  role,moving:true,kind:'active_direct_edge_pending_effect',
  relation_to_target:'动爻生本卦爻',
  checks:[{id:'day',title:'来源爻的日辰关系',status:'recorded',
    facts:['日辰生爻']}],
  source_flags:['原爻旬空']
})
const candidate=(position,selected=false)=>({
  position,ganzhi:position===6?'壬戌':'丙寅',selected_by_user:selected,
  simultaneous_yuan_ji_moving:false,
  roles:{'原神':[src()], '忌神':[], '仇神':[]},
  cautions:['该来源日月和旬空待复核']
})
const base=(extra={})=>({
  status:'conditional_review_ready',
  selected_position:6,
  candidates:[candidate(6,true)],
  boundary:'此处只是传统教学，不生成预测',
  references:{roles:'https://zh.wikisource.org/zh-hans/增删卜易/9'},
  ...extra
})

it('明动来源按原忌仇展示，但明确作用实效尚未决',()=>{
  render(<FocusEffectReviewStudy chart={{focus_effect_review:base()}}/>)
  expect(screen.getByRole('heading',{name:/原忌仇神作用来源/})).toBeTruthy()
  expect(screen.getByText(/本卦真实明动 · 有作用方向，效力未决/)).toBeTruthy()
  expect(screen.getByText('来源爻的日辰关系 · 条件已记录')).toBeTruthy()
  expect(screen.getByText(/该来源日月和旬空待复核/)).toBeTruthy()
  expect(screen.getByText(/此处只是传统教学/)).toBeTruthy()
})

it('同类候选可切换，不能自动替使用者选择主爻',()=>{
  render(<FocusEffectReviewStudy chart={{focus_effect_review:base({
    status:'multiple_candidates_pending',selected_position:null,
    candidates:[candidate(3),candidate(6)]
  })}}/>)
  expect(screen.getByText(/仅为候选，不自动排序/)).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:/上爻.*壬戌/}))
  expect(screen.getByText(/上爻 · 壬戌/)).toBeTruthy()
  expect(screen.getAllByText(/仅为候选，不自动排序/).length).toBeGreaterThan(0)
})

it('用神不现时不合成不存在的原忌来源',()=>{
  render(<FocusEffectReviewStudy chart={{focus_effect_review:base({
    status:'focus_not_visible',selected_position:null,candidates:[]
  })}}/>)
  expect(screen.getByText(/本卦不现，须先核对飞伏/)).toBeTruthy()
  expect(screen.queryByText(/本卦真实明动 · 有作用方向/)).toBeNull()
})
