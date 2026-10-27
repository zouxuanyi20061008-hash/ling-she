// @vitest-environment jsdom
import React from 'react'
import {it,afterEach,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup,waitFor} from '@testing-library/react'
import KnowledgeStage from '../src/KnowledgeStage.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})

const chart={
 version:'V55',day_master:'甲',day_master_element:'木',
 beijing_time:'1999-07-21T16:00:00+08:00',day_boundary_label:'零点换日',
 solar_term_boundary:{solar_month_branch:'未',previous_jie:{name:'小暑'},next_jie:{name:'立秋'}},
 warnings:[],source:{independent_fixed_cases_reference:'https://github.com/6tail/lunar-python'},
 pillars:[{kind:'day',label:'日柱',ganzhi:'甲戌',stem_element:'木',branch_element:'土',
  stem_ten_god:'日主',na_yin:'山头火',hidden_stems:[{stem:'戊',element:'土',ten_god:'偏财'}]}]
}
const names=['立春','惊蛰','清明','立夏','芒种','小暑','立秋','白露','寒露','立冬','大雪','小寒']
const months=names.map((name,i)=>({
 order:i+1,jie_name:name,ganzhi:['庚寅','辛卯','壬辰','癸巳','甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑'][i],
 stem_ten_god:'正财',selected:i===0,
 begins_at_beijing:'2026-02-04T04:01:00+08:00',
 ends_before_beijing:'2026-03-05T20:00:00+08:00',
 hidden_stems:[{stem:'甲'}]
}))
const withFlow={...chart,version:'V57',flow:{
 target_beijing_time:'2026-02-04T04:30:00+08:00',
 year:{ganzhi:'丙午',stem_ten_god:'食神',begins_at_beijing:'2026-02-04T04:01:00+08:00'},
 month:months[0],months,
 luck_at_target:{status:'not_requested',label:'未选择大运排法，仅列真实流年流月'},
 near_jie:false
}}

it('V57 opt-in request sends chosen Beijing date and returns twelve monthly windows',async()=>{
 const request=vi.fn().mockResolvedValue({ok:true,json:async()=>withFlow})
 vi.stubGlobal('fetch',request)
 render(<KnowledgeStage mode="bazi" onBack={()=>{}} onStudy={()=>{}}/>)
 fireEvent.click(screen.getByLabelText('启用流年流月'))
 fireEvent.change(screen.getByLabelText('八字流年日期'),{target:{value:'2026-02-04'}})
 fireEvent.change(screen.getByLabelText('八字流年北京时间'),{target:{value:'04:30'}})
 fireEvent.click(screen.getByRole('button',{name:'排四柱 · 查流年流月'}))
 expect(await screen.findByText('流年 丙午 · 流月 庚寅')).toBeTruthy()
 const args=JSON.parse(request.mock.calls[0][1].body)
 expect(args.flow_solar_date).toBe('2026-02-04')
 expect(args.flow_clock).toBe('04:30')
 expect(args.luck_direction).toBeUndefined()
 const board=screen.getByRole('group',{name:'十二节令流月表'})
 expect(within(board).getAllByText(/第 \d+ 月/).length).toBe(12)
 expect(within(board).getByText('庚寅')).toBeTruthy()
 expect(screen.getByText(/大运对应：未选择大运排法/)).toBeTruthy()
})

it('V57 default response V55 remains usable and no unsolicited flow dates',async()=>{
 const request=vi.fn().mockResolvedValue({ok:true,json:async()=>chart})
 vi.stubGlobal('fetch',request)
 render(<KnowledgeStage mode="bazi" onBack={()=>{}} onStudy={()=>{}}/>)
 expect(screen.queryByLabelText('八字流年日期')).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'按出生时间排四柱'}))
 expect(await screen.findByText('日主 甲 · 木')).toBeTruthy()
 const args=JSON.parse(request.mock.calls[0][1].body)
 expect(args.flow_solar_date).toBeUndefined()
 expect(screen.queryByRole('group',{name:'十二节令流月表'})).toBeNull()
})
