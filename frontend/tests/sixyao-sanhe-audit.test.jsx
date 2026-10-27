// @vitest-environment jsdom
import React from 'react'
import {afterEach,expect,it} from 'vitest'
import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import SixYaoCombinationPanel from '../src/SixYaoCombinationPanel.jsx'
afterEach(()=>cleanup())
function sample(withAudit=true){
  const combo={
    hexagram_combinations:{
      ben:{name:'乾',label:'六冲卦',pair_evidence:[]},
      bian:{name:'泰',label:'六合卦',pair_evidence:[]},
      counts:{visible:1,mixed:0,waiting:0},
      original_triad_candidates:[{element:'水',branches:['申','子','辰'],
        positions:[5,1,3],moving_positions:[1,5],kind:'multiple_moving_three_branches',
        calendar_warnings:[]}],
      moving_transformed_candidates:[],missing_branch_candidates:[],
      scope:'三合结构不等于吉凶',
      reference:'https://zh.wikisource.org/zh-hans/增删卜易/19'
    }
  }
  if(withAudit)combo.sanhe_condition_audit={
    version:'V41',
    counts:{static_three_branches:0,with_actual_movers:1,missing_one_branch:0},
    rows:[{
      candidate_key:'original_triad_candidates:1',element:'水',
      branches:['申','子','辰'],movement_state:'two_or_more_real_movers',
      roles:{
        '世':{position:6,ganzhi:'壬戌',liuqin:'父母',
          originally_in_positions:false,relation_to_pattern:'该爻五行克局'},
        '应':{position:3,ganzhi:'甲辰',liuqin:'父母',
          originally_in_positions:true,relation_to_pattern:'该爻五行克局'}
      },
      calendar:{day_branch_matches_missing:null,month_branch_matches_missing:null},
      changed_position_check:null,
      gates:[{key:'structure',state:'three_original_branches',fact:'原卦三支俱见'},
        {key:'formation',state:'requires_traditional_judgment',fact:'不能自动判定成局'}],
      pending:['原卦局内月冲：1爻']
    }]
  }
  return combo
}
it('三合局逐组列出独立世应、动静和空破核验，不显示最终成局推断',()=>{
  render(<SixYaoCombinationPanel chart={sample()}/>)
  expect(screen.getByText(/三合条件与世应空破逐项校验/)).toBeTruthy()
  fireEvent.click(screen.getByText(/多处明动 · 世应核查/))
  expect(screen.getByText(/上爻/)).toBeTruthy()
  expect(screen.getByText(/三爻/)).toBeTruthy()
  expect(screen.getByText(/位置不在候选结构内/)).toBeTruthy()
  expect(screen.getByText(/位置在候选结构内/)).toBeTruthy()
  expect(screen.getByText(/原卦局内月冲/)).toBeTruthy()
  expect(screen.getByText(/不据此判定成局、局旺/)).toBeTruthy()
})
it('V40 旧盘未提供 V41 审核结构时仍能看到原有三合结果',()=>{
  render(<SixYaoCombinationPanel chart={sample(false)}/>)
  expect(screen.getByText('六合、六冲与三合候选')).toBeTruthy()
  expect(screen.queryByText(/V41 · 三合条件/)).toBeNull()
})
