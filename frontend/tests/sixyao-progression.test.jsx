// @vitest-environment jsdom
import React from 'react'
import {afterEach,it,expect} from 'vitest'
import {cleanup,render,screen} from '@testing-library/react'
import SixYaoFullChart from '../src/SixYaoFullChart.jsx'
import SixYaoJointOverview from '../src/SixYaoJointOverview.jsx'
afterEach(()=>cleanup())
function build(){
  const row=i=>({
    position:i+1,liushen:'青龙',liuqin:'官鬼',
    ganzhi:i===4?'庚申':'甲子',element:i===4?'金':'水',role:i===4?'世':'',
    month_relation:null,is_xunkong:null,is_yuechong:null,is_yuejian:null
  })
  const prog=i=>({
    position:i+1,label:i===4?'化进神':'静爻不论化进退',
    kind:i===4?'advance':'not_moving',source_status:i===4?'primary_edition':'not_applicable'
  })
  const joined=i=>({
    position:i+1,ganzhi:i===4?'庚申':'甲子',liuqin:'官鬼',role:'',
    moving:i===4,selected_by_user:false,
    day:{known:false},month:{known:false},original_void:null,month_break:null,
    season:null,incoming_movers:[],supporting:[],restraining:[],pending:[],
    hidden_relatives:[],cross_checks:[],has_opposing_indicators:false,
    self_change:{ganzhi:'丁酉',returning_term:null,transformed_void:null,
      progression_kind:i===4?'advance':'not_moving',
      progression_label:i===4?'化进神':null,
      progression_source_status:i===4?'primary_edition':'not_applicable',
      progression_cautions:i===4?['未核日辰']:[]}
  })
  return {
    ben_gua:{full_name:'雷风恒',lines_bottom_to_top:[0,1,1,1,0,0]},
    bian_gua:{full_name:'泽风大过',lines_bottom_to_top:[0,1,1,1,1,0]},
    eight_palaces:{ben:{palace:'震',stage:'三世',shi_position:3,ying_position:6}},
    lines:Array.from({length:6},(_,i)=>({number:i===4?6:7})),
    dong_yao:[5],najia_lines:Array.from({length:6},(_,i)=>row(i)),
    bian_najia_lines:Array.from({length:6},(_,i)=>({...row(i),ganzhi:i===4?'丁酉':row(i).ganzhi})),
    calendar:{day:null,month:null},
    progression_review:{rows:Array.from({length:6},(_,i)=>prog(i)),
      primary_advances:[5],primary_retreats:[],edition_variants:[],
      source:'https://www.shidianguji.com/book/XYXZSBY/chapter/1lzxsny7da4uh'},
    joint_overview:{version:'V37',status:'calendar_incomplete',
      calendar:{day_ganzhi:null,month_branch:null,day_confirmed:false,month_confirmed:false,server_recomputed:false},
      focus_choices:[],focus_category:null,focus_positions:[],selected_position:null,
      hidden_focus:[],rows:Array.from({length:6},(_,i)=>joined(i)),
      boundary:'不可直接断吉凶'}
  }
}
it('六爻全盘只将真实动爻的本位申化酉标为进神，并标明原典',()=>{
  render(<SixYaoFullChart chart={build()}/>)
  expect(screen.getByText('动化进退')).toBeTruthy()
  expect(screen.getByText('化进神')).toBeTruthy()
  expect(screen.getAllByText('静爻不论化进退')).toHaveLength(5)
  expect(screen.getByText(/动爻进退：化进/)).toBeTruthy()
  expect(screen.getByRole('link',{name:/增删卜易/}).getAttribute('href')).toContain('1lzxsny7da4uh')
})
it('合参盘本位进神可以展开，但不会被说成直接旺衰结论',()=>{
  render(<SixYaoJointOverview chart={build()}/>)
  const details=screen.getAllByText('逐项查看')
  expect(details).toHaveLength(6)
  // Fifth line: descending six-line order => table row index 1.
  details[1].click()
  expect(screen.getByText(/化进退核查：/)).toBeTruthy()
  expect(screen.getByText(/只表示同位地支的进退转换/)).toBeTruthy()
  expect(screen.getByText(/不可直接断吉凶/)).toBeTruthy()
})
