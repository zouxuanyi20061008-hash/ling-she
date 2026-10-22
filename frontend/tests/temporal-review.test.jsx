// @vitest-environment jsdom
import React from 'react'
import {afterEach,it,expect} from 'vitest'
import {render,screen,cleanup} from '@testing-library/react'
import {TemporalReviewStudy} from '../src/SixYaoStage.jsx'

afterEach(()=>cleanup())

const source={
  void:'https://zh.wikisource.org/zh-hans/增删卜易/26'
}
const candidate=(date=null)=>({
  position:6,ganzhi:'壬戌',branch:'戌',originally_void:true,selected_by_user:true,
  events:[{offset_days:10,solar_date:date,day_ganzhi:'甲戌',
    conditions:[{id:'next_xun',title:'原旬空后的换旬参照',basis:'换旬不是确定出空'}]}]
})
const base=(override={})=>({
  version:'V22',status:'relative_ganzhi_only',
  notice:'手工干支只列相对日数',anchor_date:null,beijing_clock:null,day_boundary:null,
  selected_position:6,candidates:[candidate()],
  references:source,
  limitations:['日期条件不是实际应期'],
  ...override
})

it('没有公历来源时只显示相对天数，不捏造具体年月日',()=>{
  render(<TemporalReviewStudy chart={{temporal_review:base()}}/>)
  expect(screen.getByRole('heading',{name:/旬空、值日、冲日/})).toBeTruthy()
  expect(screen.getByText('第 10 日')).toBeTruthy()
  expect(screen.getByText('原旬空后的换旬参照')).toBeTruthy()
  expect(screen.queryByText(/2026-02-/)).toBeNull()
  expect(screen.getByText(/日期条件不是实际应期/)).toBeTruthy()
})

it('只在具有服务端重算日期时显示对应日期和子初换日',()=>{
  render(<TemporalReviewStudy chart={{temporal_review:base({
    status:'dated_calendar_relations',anchor_date:'2026-02-17',beijing_clock:'23:30',
    day_boundary:'zi_hour',notice:'服务器复算日辰',
    candidates:[candidate('2026-02-27')]
  })}}/>)
  expect(screen.getByText(/起算：2026-02-17/)).toBeTruthy()
  expect(screen.getByText('2026-02-27')).toBeTruthy()
  expect(screen.getByText(/23时子初换日/)).toBeTruthy()
})

it('未确认日辰时只提示补齐，不会生成候选日期',()=>{
  render(<TemporalReviewStudy chart={{temporal_review:base({
    status:'day_missing',candidates:[],selected_position:null
  })}}/>)
  expect(screen.getByText(/请先在「核日月」确认六十甲子日/)).toBeTruthy()
  expect(screen.queryByText('第 10 日')).toBeNull()
})
