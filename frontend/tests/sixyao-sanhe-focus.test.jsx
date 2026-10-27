// @vitest-environment jsdom
import React from 'react'
import {afterEach,expect,it} from 'vitest'
import {cleanup,render,screen,fireEvent} from '@testing-library/react'
import SixYaoCombinationPanel from '../src/SixYaoCombinationPanel.jsx'
afterEach(()=>cleanup())
function fixture(status='user_selected'){
  const item={
    candidate_key:'original_triad_candidates:1',kind:'multiple_moving_three_branches',
    source_type:'original_triad_candidates',source_label:'本卦三支俱见',
    element:'水',branches:['申','子','辰'],positions:[5,1,3],
    moving_positions:[1,5],missing_branch:null,transformed_branch:null,
    transformed_position:null,selected_position_is_member:status==='user_selected',
    focus_members:status==='no_focus'?[]:[
      {position:3,ganzhi:'甲辰',liuqin:'父母',role:'应',element:'土',
        is_selected_by_user:status==='user_selected',is_pattern_member:true,
        five_element_relation:'该爻五行克局'},
      {position:6,ganzhi:'壬戌',liuqin:'父母',role:'世',element:'土',
        is_selected_by_user:false,is_pattern_member:false,
        five_element_relation:'该爻五行克局'}
    ],
    season:{day_known:true,month_known:true,day_branch:'子',month_branch:'午',
      day_branch_in_pattern:true,month_branch_in_pattern:false,
      day_element_relation:'同五行',month_element_relation:'局五行克该爻',
      original_void_positions:[],original_month_clash_positions:[1],
      effective_formation:null},
    formed:null
  }
  return {hexagram_combinations:{
    ben:{name:'乾',label:'六冲卦',pair_evidence:[]},
    bian:{name:'乾',label:'六冲卦',pair_evidence:[]},
    counts:{visible:1,mixed:0,waiting:0},
    original_triad_candidates:[{element:'水',branches:['申','子','辰'],
      positions:[5,1,3],moving_positions:[1,5],kind:'multiple_moving_three_branches',
      calendar_warnings:[]}],
    moving_transformed_candidates:[],missing_branch_candidates:[],
    scope:'三合只列候选',reference:'https://zh.wikisource.org/zh-hans/增删卜易/19'
  },sanhe_focus_review:{
    version:'V40',status,focus_category:status==='no_focus'?null:'父母',
    focus_positions:status==='no_focus'?[]:[3,6],
    rows:[item],selected_position:status==='user_selected'?3:null
  }}
}
it('三合候选展示与所选用神、日辰、月建、生克与月冲证据',()=>{
  render(<SixYaoCombinationPanel chart={fixture()}/>)
  expect(screen.getByText(/三合局与用神、日月合参/)).toBeTruthy()
  fireEvent.click(screen.getByText(/展开三合局与用神的逐组核查/))
  expect(screen.getByText(/包含你选择的研习主爻/)).toBeTruthy()
  expect(screen.getByText(/该爻五行克局 · 位于当前组合/)).toBeTruthy()
  expect(screen.getByText(/该爻五行克局 · 不在当前组合/)).toBeTruthy()
  expect(screen.getByText(/日支见组合支/)).toBeTruthy()
  expect(screen.getByText(/月支不在组合支/)).toBeTruthy()
  expect(screen.getByText(/月冲涉及/)).toBeTruthy()
  expect(screen.getByText(/是否真正合局、合化后是否作用于用神/)).toBeTruthy()
})
it('未选用神时提示后续选择，不提供伪造的用神对应',()=>{
  render(<SixYaoCombinationPanel chart={fixture('no_focus')}/>)
  expect(screen.getByText(/还没有选择用神/)).toBeTruthy()
  fireEvent.click(screen.getByText(/展开三合局与用神的逐组核查/))
  expect(screen.getByText('没有明现用神，需先核飞伏。')).toBeTruthy()
})
it('旧版缺少 V40 审议数据时三合局原本的展示仍可正常使用',()=>{
  const sample=fixture()
  delete sample.sanhe_focus_review
  render(<SixYaoCombinationPanel chart={sample}/>)
  expect(screen.getByText('六合、六冲与三合候选')).toBeTruthy()
  expect(screen.queryByText(/三合局与用神、日月合参/)).toBeNull()
})
