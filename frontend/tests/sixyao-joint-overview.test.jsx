// @vitest-environment jsdom
import React from 'react'
import {afterEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import SixYaoJointOverview from '../src/SixYaoJointOverview.jsx'
afterEach(()=>{cleanup();vi.restoreAllMocks()})
const choices=['父母','官鬼','兄弟','妻财','子孙','世爻','应爻'].map(id=>({id,themes:id+'类象'}))
function fakeRow(position){
  const isMoving=position===1
  return {
    position,ganzhi:'甲子',liuqin:position===6||position===3?'父母':'兄弟',
    element:'水',role:position===6?'世':'',
    moving:isMoving,focus_candidate:position===6||position===3,
    selected_by_user:position===6,
    day:{known:true,relation:'日辰生爻',clash:position===1,combine:false,same_branch:false},
    month:{known:true,relation:'月建克爻',clash:position===1,combine:false,same_branch:false},
    season:'休囚（未细分）',
    original_void:false,month_break:position===1,day_clash:position===1,
    incoming_movers:isMoving?[]:[{from_position:1,from_ganzhi:'甲子',to_position:position,
      relation:'动爻生本卦爻',clash:false,combine:false,confirmed_mover:true,effectiveness:null}],
    self_change:{ganzhi:'辛丑',liuqin:'父母',returning_term:isMoving?'回头克':null,
      returning_clash:null,returning_combine:null,transformed_void:isMoving?false:null,
      is_actual_change:isMoving,effectiveness:null},
    hidden_relatives:[],supporting:[{title:'日辰生扶',detail:'日辰生爻'}],
    restraining:[{title:'月建克爻',detail:'月建克爻'}],
    pending:[],has_opposing_indicators:true,cross_checks:['日月并见需合参'],
    final_strength:null,outcome:null
  }
}
function chart(){
  return {joint_overview:{
    version:'V37',status:'structured_review_ready',
    calendar:{day_ganzhi:'甲子',month_branch:'辰',day_confirmed:true,
      month_confirmed:true,server_recomputed:false},
    focus_choices:choices,focus_category:'父母',
    focus_positions:[3,6],selected_position:6,hidden_focus:[],
    rows:Array.from({length:6},(_,i)=>fakeRow(i+1)),
    moving_positions:[1],requires_user_choice:false,has_complete_calendar:true,
    strength_score:null,effective_strength_computed:false,
    fortune_conclusion:null,timing_conclusion:null,
    boundary:'不判真实应期与吉凶'
  }}
}
it('合参盘同时展示六爻、日月、动爻与空破，且不进行旺衰评分',()=>{
  render(<SixYaoJointOverview chart={chart()} onChooseFocus={()=>{}} onChoosePosition={()=>{}}/>)
  expect(screen.getByText(/先选关注对象，再核日月/)).toBeTruthy()
  expect(screen.getByText(/不判真实应期与吉凶/)).toBeTruthy()
  expect(screen.getAllByRole('row')).toHaveLength(7)
  expect(screen.getByText(/已由你选择/)).toBeTruthy()
  expect(screen.getAllByText(/生扶与制约并见/)).toHaveLength(6)
  expect(screen.getAllByText(/月冲/).length).toBeGreaterThan(0)
  const details=screen.getAllByText('逐项查看')
  expect(details).toHaveLength(6)
  fireEvent.click(details[5])
  expect(screen.getByText(/本位动变（非跨位变爻）/)).toBeTruthy()
})
it('选择六亲和具体爻位应要求重新排盘，而非界面偷偷替用户选择',()=>{
  const onChooseFocus=vi.fn(),onChoosePosition=vi.fn()
  render(<SixYaoJointOverview chart={chart()} onChooseFocus={onChooseFocus}
    onChoosePosition={onChoosePosition}/>)
  fireEvent.click(screen.getByRole('button',{name:'官鬼'}))
  expect(onChooseFocus).toHaveBeenCalledWith('官鬼')
  fireEvent.click(screen.getByRole('button',{name:/三爻 甲子/}))
  expect(onChoosePosition).toHaveBeenCalledWith(3)
})
it('缺失日月时须显示未核，且未明现关注对象只展示伏神',()=>{
  const sample=chart()
  sample.joint_overview.status='hidden_focus'
  sample.joint_overview.calendar={day_ganzhi:null,month_branch:null,day_confirmed:false,
    month_confirmed:false,server_recomputed:false}
  sample.joint_overview.focus_category='妻财'
  sample.joint_overview.focus_positions=[]
  sample.joint_overview.selected_position=null
  sample.joint_overview.hidden_focus=[{position:2,hidden_ganzhi:'甲寅',
    hidden_liuqin:'妻财',flying_ganzhi:'辛亥',flying_liuqin:'兄弟',
    relation:'飞生伏',effective:null}]
  for(const row of sample.joint_overview.rows){
    row.day={known:false,relation:null,clash:null,combine:null}
    row.month={known:false,relation:null,clash:null,combine:null}
    row.original_void=null;row.month_break=null;row.day_clash=null;row.season=null
    row.supporting=[];row.restraining=[]
  }
  render(<SixYaoJointOverview chart={sample} onChooseFocus={()=>{}}/>)
  expect(screen.getByText(/没有明现的 妻财/)).toBeTruthy()
  expect(screen.getByText(/妻财 甲寅/)).toBeTruthy()
  expect(screen.getAllByText('日辰未核')).toHaveLength(6)
  expect(screen.getAllByText('节令月未核')).toHaveLength(6)
  expect(screen.getAllByText(/旬空未核/)).toHaveLength(6)
})
