// @vitest-environment jsdom
import React from 'react'
import {afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup,waitFor} from '@testing-library/react'
import KnowledgeStage from '../src/KnowledgeStage.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})

const sample={
 version:'V55',day_master:'甲',day_master_element:'木',beijing_time:'1999-07-21T16:00:00+08:00',
 day_boundary_label:'午夜换日',solar_term_boundary:{solar_month_branch:'未',
  previous_jie:{name:'小暑'},next_jie:{name:'立秋'}},
 warnings:[],source:{independent_fixed_cases_reference:'https://github.com/6tail/lunar-python'},
 pillars:[{kind:'day',label:'日柱',ganzhi:'甲戌',stem_element:'木',branch_element:'土',
  stem_ten_god:'日主',na_yin:'山头火',hidden_stems:[{stem:'戊',element:'土',ten_god:'偏财'}]}]
}
const phases=Array.from({length:8},(_,i)=>({order:i+1,ganzhi:['壬申','癸酉','甲戌','乙亥','丙子','丁丑','戊寅','己卯'][i],
 stem_element:'水',branch_element:'金',stem_ten_god:'偏印',
 start_calendar_year:2001+i*10,end_calendar_year_exclusive:2011+i*10,
 begins_at_beijing:'2001-03-21T16:00:00+08:00',
 hidden_stems:[{stem:'壬'}]}))
const lucked={...sample,version:'V56',luck:{
 mode_label:'直接指定顺排（不输入性别）',direction:'顺排',month_ganzhi:'辛未',
 reference_jie:{position:'下一个节',name:'立秋',beijing_time:'1999-08-08T00:00:00+08:00'},
 interval_minutes:7200,start_offset:{years:1,months:8,days:0,hours:0},
 start_at_beijing:'2001-03-21T16:00:00+08:00',
 luck_decades:phases
}}

it('V56 does not request gender and V55 request stays backwards compatible',async()=>{
 const spy=vi.fn().mockResolvedValue({ok:true,json:async()=>sample})
 vi.stubGlobal('fetch',spy)
 render(<KnowledgeStage mode="bazi" onBack={()=>{}} onStudy={()=>{}}/>)
 expect(screen.getByLabelText('大运顺逆规则').value).toBe('none')
 fireEvent.click(screen.getByRole('button',{name:'按出生时间排四柱'}))
 expect(await screen.findByText('日主 甲 · 木')).toBeTruthy()
 expect(JSON.parse(spy.mock.calls[0][1].body).luck_direction).toBeUndefined()
 expect(screen.queryByRole('group',{name:'十年大运干支表'})).toBeNull()
})

it('V56 explicit forward computes 8 decade cards and exact Jie and start',async()=>{
 const spy=vi.fn().mockResolvedValue({ok:true,json:async()=>lucked})
 vi.stubGlobal('fetch',spy)
 render(<KnowledgeStage mode="bazi" onBack={()=>{}} onStudy={()=>{}}/>)
 fireEvent.change(screen.getByLabelText('大运顺逆规则'),{target:{value:'forward'}})
 fireEvent.click(screen.getByRole('button',{name:'排四柱及十年大运'}))
 expect(await screen.findByText('十年大运 · 顺排')).toBeTruthy()
 expect(JSON.parse(spy.mock.calls[0][1].body).luck_direction).toBe('forward')
 const grid=screen.getByRole('group',{name:'十年大运干支表'})
 expect(within(grid).getAllByText(/第 \d 步/).length).toBe(8)
 expect(within(grid).getByText('壬申')).toBeTruthy()
 expect(screen.getByText(/推算起运时间：2001-03-21/)).toBeTruthy()
})

it('V56 direct reverse and classic female are both usable without deducing identity',async()=>{
 const spy=vi.fn().mockResolvedValue({ok:true,json:async()=>lucked})
 vi.stubGlobal('fetch',spy)
 render(<KnowledgeStage mode="bazi" onBack={()=>{}} onStudy={()=>{}}/>)
 fireEvent.change(screen.getByLabelText('大运顺逆规则'),{target:{value:'reverse'}})
 fireEvent.click(screen.getByRole('button',{name:'排四柱及十年大运'}))
 await waitFor(()=>expect(spy).toHaveBeenCalledTimes(1))
 fireEvent.change(screen.getByLabelText('大运顺逆规则'),{target:{value:'traditional_female'}})
 fireEvent.click(screen.getByRole('button',{name:'排四柱及十年大运'}))
 await waitFor(()=>expect(spy).toHaveBeenCalledTimes(2))
 expect(JSON.parse(spy.mock.calls[0][1].body).luck_direction).toBe('reverse')
 expect(JSON.parse(spy.mock.calls[1][1].body).luck_direction).toBe('traditional_female')
})
