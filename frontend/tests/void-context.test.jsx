// @vitest-environment jsdom
import React from 'react'
import {afterEach,it,expect} from 'vitest'
import {render,screen,fireEvent,cleanup} from '@testing-library/react'
import {VoidContextStudy} from '../src/SixYaoStage.jsx'

afterEach(()=>cleanup())
const names=['甲子','乙丑','丙寅','丁卯','戊辰','己巳']
function makeRow(position, category='neither_void'){
  return {
    position,ganzhi:names[position-1],category,
    selected_by_user:false,
    steps:[
      {id:'xun',title:'先核日旬与本卦爻',status:'review',
       observations:['本卦旬空测试事实'],pending:[]},
      {id:'day',title:'再察日辰生克冲合',status:'review',
       observations:['日冲待分辨'],pending:[]}
    ],
    cross_checks:category==='transformed_void_only'?['真实动爻化空：本卦本爻是否旬空要单独核实']:[],
    note:'此处只列规则条件'
  }
}
const base=(overrides={})=>({
  version:'V23',status:'joint_review_ready',
  rows:[makeRow(1),makeRow(2,'transformed_void_only'),makeRow(3),makeRow(4),makeRow(5),makeRow(6,'original_void')],
  focus_status:'visible_candidates',focus_candidate_positions:[2,6],
  attention_positions:[2,6],selected_position:6,empty_branches:['戌','亥'],
  boundary:'无法自动断真假空',references:{void:'https://zh.wikisource.org/zh-hans/增删卜易/26'},
  ...overrides
})

it('可以逐爻切换，并将化空与本卦旬空分开显示',()=>{
  render(<VoidContextStudy chart={{void_context_review:base()}}/>)
  expect(screen.getByText('本卦旬空',{selector:'span'})).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:/二爻.*化空/}))
  expect(screen.getByText('仅真实明动化空')).toBeTruthy()
  expect(screen.getByText(/真实动爻化空：本卦本爻是否旬空/)).toBeTruthy()
  expect(screen.getByText('无法自动断真假空',{exact:false})).toBeTruthy()
})

it('未填日辰时展示待核提醒，不展示已经裁定真假空',()=>{
  const rows=Array.from({length:6},(_,i)=>({
    ...makeRow(i+1,'day_missing'),
    steps:[{id:'xun',title:'先核日旬与本卦爻',status:'missing',
      observations:[],pending:['先按北京时间确认六十甲子日']}]
  }))
  render(<VoidContextStudy chart={{void_context_review:base({
    status:'day_unconfirmed',rows,selected_position:null,focus_candidate_positions:[],
    attention_positions:[]
  })}}/>)
  expect(screen.getByText(/尚缺有效日辰/)).toBeTruthy()
  expect(screen.getByText(/待补：先按北京时间确认六十甲子日/)).toBeTruthy()
  expect(screen.getByText('日辰尚未核定')).toBeTruthy()
})
