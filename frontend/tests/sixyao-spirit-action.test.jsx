// @vitest-environment jsdom
import React from 'react'
import {it,expect} from 'vitest'
import {render,screen} from '@testing-library/react'
import {SpiritActionAuditStudy} from '../src/SixYaoStage.jsx'

it('V45 shows direct moving roles, two original-moving hops, and no efficacy claim',()=>{
  const c={position:3,ganzhi:'甲辰',selected_by_user:true,
    target_limit_flags:['original_xun_void'],missing_inputs:[],
    active_direct_positions:{'原神':[4],'忌神':[2]},
    roles:{
      '原神':[{role:'原神',source_position:4,source_ganzhi:'壬午',
        kind:'active_direct_edge',source_limit_flags:['actual_changed_xun_void'],
        missing_inputs:[],relation_to_target:'动爻生本卦爻'}],
      '忌神':[{role:'忌神',source_position:2,source_ganzhi:'甲寅',
        kind:'active_direct_edge',source_limit_flags:[],missing_inputs:[],
        relation_to_target:'动爻克本卦爻'}],
      '仇神':[{role:'仇神',source_position:1,source_ganzhi:'甲子',
        kind:'indirect_role',source_limit_flags:[],missing_inputs:[],
        relation_to_target:null}]
    },
    two_hop_paths:[{positions:[1,4,3],via_role:'原神',
      first_relation:'动爻克本卦爻',second_relation:'动爻生本卦爻'}],
    checks:[{id:'yuan_ji_both_active',title:'原忌同时明动直连'}]
  }
  render(<SpiritActionAuditStudy chart={{spirit_action_audit:{
    status:'condition_review_ready',selected_position:3,candidates:[c],
    boundary:'未完成效力判断'
  }}}/>)
  expect(screen.getByText(/V45 · 原忌仇真实明动路径审查/)).toBeTruthy()
  expect(screen.getByText(/原忌同时明动直连/)).toBeTruthy()
  expect(screen.getByText(/初爻 → 四爻 → 三爻/)).toBeTruthy()
  expect(screen.getByText(/真实化爻旬空/)).toBeTruthy()
  expect(screen.getByText(/未完成效力判断/)).toBeTruthy()
})
