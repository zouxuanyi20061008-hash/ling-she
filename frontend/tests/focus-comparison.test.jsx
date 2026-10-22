// @vitest-environment jsdom
import React from 'react'
import {it,expect,beforeEach,afterEach,vi} from 'vitest'
import {render,screen,fireEvent,cleanup} from '@testing-library/react'
import {FocusComparisonStudy,ChineseLocalCaseArchive} from '../src/SixYaoStage.jsx'
import {saveChoice,readSelectedChoice,choiceKey,readChoices} from '../src/focus-choice-notes.js'

const facts=value=>({status:'recorded',value,effectiveness:'not_determined'})
function chart(position=6,category='父母'){
  const lines=[7,7,7,7,7,7].map(number=>({number}))
  const can=[{position:3,ganzhi:'丙寅'},{position:6,ganzhi:'壬戌'}]
  return {
    lines,ben_gua:{full_name:'乾为天'},bian_gua:{full_name:'乾为天'},
    calendar:{day:{ganzhi:'甲子'},month:{branch:'辰'}},
    focus:{category},focus_decision:{selected_position:position,candidates:can},
    najia_lines:[{ganzhi:'甲子'},{ganzhi:'乙丑'},{ganzhi:'丙寅'},
      {ganzhi:'丁卯'},{ganzhi:'戊辰'},{ganzhi:'壬戌'}],
    focus_comparison:{
      version:'V26',status:'comparison_ready',selected_position:position,
      focus_category:category,
      candidates:[{position:3,ganzhi:'丙寅',selected_by_user:position===3},
                  {position:6,ganzhi:'壬戌',selected_by_user:position===6}],
      pairs:[{first_position:3,second_position:6,axes:[
        {id:'void',title:'本爻旬空',state:'different',
         first_value:'不空',second_value:'旬空'},
        {id:'month_relation',title:'月建五行关系',state:'missing',
         first_value:null,second_value:null},
        {id:'active_yuan',title:'明动原神直连来源',state:'same',
         first_value:[],second_value:[]}
      ]}],
      boundary:'不得据同异评分或断应期',
      references:{liangxian:'https://www.shidianguji.com/book/XYXZSBY/chapter/1lzxsny7db6rt'}
    },
    review_flow:{report:{review_sheet_digest:['已算证据摘要'],
      focus_comparison_digest:['两现差异摘要'],
      outstanding_questions:['日月仍要核对']}}
  }
}
beforeEach(()=>window.localStorage.clear())
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()})

it('两现差异明确区分不同、相同和未核的条件，不给胜者',()=>{
  const c=chart()
  render(<FocusComparisonStudy chart={c}/>)
  fireEvent.click(screen.getByText(/初?三爻 ↔ 上爻/))
  expect(screen.getByText('本爻旬空')).toBeTruthy()
  expect(screen.getByText('条件不同')).toBeTruthy()
  expect(screen.getByText('尚缺数据')).toBeTruthy()
  expect(screen.getByText('现有条件相同')).toBeTruthy()
  expect(screen.getAllByText('未核').length).toBeGreaterThan(0)
  expect(screen.getByText(/不按不同项数量淘汰任何候选/)).toBeTruthy()
})

it('选择理由本机保存、重新打开后可恢复，不混入后台模型',()=>{
  const c=chart()
  const view=render(<FocusComparisonStudy chart={c}/>)
  fireEvent.change(screen.getByLabelText(/为什么先选择这一爻/),{target:{value:'因为需要优先核对空破'}})
  fireEvent.change(screen.getByLabelText(/其他候选与相反证据/),{target:{value:'三爻也有相关证据'}})
  expect(readSelectedChoice(c).reason).toBe('因为需要优先核对空破')
  expect(readSelectedChoice(c).counter).toBe('三爻也有相关证据')
  view.unmount()
  render(<FocusComparisonStudy chart={c}/>)
  expect(screen.getByLabelText(/为什么先选择这一爻/).value).toBe('因为需要优先核对空破')
  expect(screen.getByLabelText(/其他候选与相反证据/).value).toBe('三爻也有相关证据')
})

it('切换指定候选保留两份独立选择依据，同卦不同关注类别也隔离',()=>{
  const upper=chart(6),third=chart(3),otherFocus=chart(6,'官鬼')
  saveChoice(upper,6,{reason:'上爻研究',counter:'',context:''})
  saveChoice(third,3,{reason:'三爻研究',counter:'',context:''})
  expect(choiceKey(upper)).toBe(choiceKey(third))
  expect(choiceKey(upper)).not.toBe(choiceKey(otherFocus))
  expect(readSelectedChoice(upper).reason).toBe('上爻研究')
  expect(readSelectedChoice(third).reason).toBe('三爻研究')
  expect(readSelectedChoice(otherFocus)).toBeNull()
  expect(Object.keys(readChoices(upper))).toEqual(['3','6'])
})

it('未指定主爻或不现的用神，不制作不存在的已选记录',()=>{
  const base=chart(null)
  render(<FocusComparisonStudy chart={base}/>)
  expect(screen.getByText(/尚未指定研习主爻/)).toBeTruthy()
  expect(screen.queryByLabelText(/为什么先选择这一爻/)).toBeNull()
  const absent=chart(null,'妻财')
  absent.focus_decision.candidates=[]
  absent.focus_comparison.status='focus_not_visible'
  absent.focus_comparison.pairs=[]
  absent.focus_comparison.candidates=[]
  cleanup()
  render(<FocusComparisonStudy chart={absent}/>)
  expect(screen.getByText('本卦用神不现')).toBeTruthy()
  expect(readSelectedChoice(absent)).toBeNull()
})

it('已封存的人工择用理由是固定快照，修改本机理由后不变',()=>{
  const c=chart()
  saveChoice(c,6,{reason:'封存前理由',counter:'另一爻不能忽视',context:'现实事项尚未确定'})
  render(<ChineseLocalCaseArchive chart={c} question="示例"/>)
  fireEvent.change(screen.getByLabelText(/本次事前研习笔记/),{target:{value:'事前观察'}})
  fireEvent.click(screen.getByRole('button',{name:'封存当前盘面与事前研究'}))
  const key='wanxiang-liuyao-case-archive-v1'
  let old=JSON.parse(window.localStorage.getItem(key))
  expect(old).toHaveLength(1)
  expect(old[0].snapshot.focus_selection.reason).toBe('封存前理由')
  expect(old[0].snapshot.focus_selection.counter).toBe('另一爻不能忽视')
  expect(old[0].snapshot.focus_comparison_digest).toEqual(['两现差异摘要'])
  saveChoice(c,6,{reason:'后来修改',counter:'',context:''})
  old=JSON.parse(window.localStorage.getItem(key))
  expect(old[0].snapshot.focus_selection.reason).toBe('封存前理由')
  expect(screen.getByText('封存时的人工取用依据 · 只读')).toBeTruthy()
})
