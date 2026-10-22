// @vitest-environment jsdom
import React from 'react'
import {beforeEach,afterEach,it,expect,vi} from 'vitest'
import {cleanup,render,fireEvent,screen} from '@testing-library/react'
import {HumanReviewWorkbook,ChineseLocalCaseArchive} from '../src/SixYaoStage.jsx'
import {workbookKey,readWorkbook,saveWorkbook,reviewIdentity} from '../src/review-workbook.js'

function chart(position=6){
  const name='壬戌'
  return {
    lines:[7,7,7,7,7,7].map(number=>({number})),
    ben_gua:{full_name:'乾为天'},
    bian_gua:{full_name:'乾为天'},
    calendar:{day:{ganzhi:'甲子'},month:{branch:'辰'}},
    focus:{category:'父母'},
    focus_decision:{selected_position:position},
    review_sheet:{
      status:'ready_to_record',focus_category:'父母',selected_position:position,
      calendar_source:'manual_unverified',
      candidates:[{position:6,ganzhi:name,selected_by_user:position===6,
        supporting:[{title:'日辰生爻',detail:'有生扶关系'}],
        restraining:[{title:'旬空条件',detail:'真假未断'}],
        pending:['日月相互条件未决']}],
      boundary:'程序不能直接断吉凶'
    },
    review_flow:{report:{
      evidence_digest:['空破条件'],review_sheet_digest:['程序证据一条'],
      outstanding_questions:['真实背景待验证'],
      yongshen_pathway_digest:[],moving_effect_digest:[],
      special_conditions_digest:[]
    }}
  }
}
beforeEach(()=>window.localStorage.clear())
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()})

it('四栏草稿自动保存到当前浏览器，并能在重新打开时恢复',()=>{
  const c=chart()
  const view=render(<HumanReviewWorkbook chart={c} question="研究事项"/>)
  fireEvent.change(screen.getByLabelText(/事前研判假设/),{target:{value:'待核实的初步研习假设'}})
  fireEvent.change(screen.getByLabelText(/相反证据与不确定性/),{target:{value:'存在其他解释'}})
  expect(readWorkbook(c).fields.hypothesis).toBe('待核实的初步研习假设')
  expect(readWorkbook(c).fields.counter).toBe('存在其他解释')
  view.unmount()
  render(<HumanReviewWorkbook chart={c} question="研究事项"/>)
  expect(screen.getByLabelText(/事前研判假设/).value).toBe('待核实的初步研习假设')
  expect(screen.getByText('日辰生爻：有生扶关系')).toBeTruthy()
  expect(screen.getByText('旬空条件：真假未断')).toBeTruthy()
})

it('切换研习主爻隔离草稿，不误覆盖另一组证据',()=>{
  const c1=chart(6),c2=chart(3)
  saveWorkbook(c1,{hypothesis:'上爻研习',support:'',counter:'',verification:''})
  expect(workbookKey(c1)).not.toBe(workbookKey(c2))
  expect(reviewIdentity(c1)).not.toBe(reviewIdentity(c2))
  expect(readWorkbook(c2)).toBeNull()
  render(<HumanReviewWorkbook chart={c2} question="另一研究"/>)
  expect(screen.getByLabelText(/事前研判假设/).value).toBe('')
})

it('封存时固定结构化草稿快照，后来修改不会改变它',()=>{
  const c=chart()
  saveWorkbook(c,{hypothesis:'最初假设',support:'日辰线索',counter:'可能相反',verification:'检查真实结果'})
  render(<ChineseLocalCaseArchive chart={c} question="示例问题"/>)
  fireEvent.click(screen.getByRole('button',{name:'封存当前盘面与事前研究'}))
  const before=JSON.parse(window.localStorage.getItem('wanxiang-liuyao-case-archive-v1'))
  expect(before).toHaveLength(1)
  expect(before[0].before).toBe('最初假设')
  expect(before[0].snapshot.human_review.fields.counter).toBe('可能相反')
  expect(before[0].snapshot.review_sheet.digest).toEqual(['程序证据一条'])
  saveWorkbook(c,{hypothesis:'事后改写',support:'',counter:'',verification:''})
  const sealed=JSON.parse(window.localStorage.getItem('wanxiang-liuyao-case-archive-v1'))
  expect(sealed[0].before).toBe('最初假设')
  expect(sealed[0].snapshot.human_review.fields.hypothesis).toBe('最初假设')
  expect(screen.getByText('事前四栏研判（封存只读）')).toBeTruthy()
})

it('清空草稿需经本人确认，不修改其他已保存的研判材料',()=>{
  vi.stubGlobal('confirm',()=>true)
  const c=chart()
  render(<HumanReviewWorkbook chart={c}/>)
  fireEvent.change(screen.getByLabelText(/事前研判假设/),{target:{value:'测试笔记'}})
  fireEvent.click(screen.getByRole('button',{name:'清空本机草稿'}))
  expect(readWorkbook(c)).toBeNull()
  expect(screen.getByLabelText(/事前研判假设/).value).toBe('')
})
