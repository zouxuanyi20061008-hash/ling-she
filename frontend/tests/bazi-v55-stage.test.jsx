// @vitest-environment jsdom
import React from 'react'
import {it,afterEach,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,waitFor,cleanup} from '@testing-library/react'
import KnowledgeStage from '../src/KnowledgeStage.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
const chart={
 version:'V55',day_master:'甲',day_master_element:'木',
 beijing_time:'1999-07-21T16:00:00+08:00',
 day_boundary_label:'零点换日（23:00–23:59仍按当天）',
 solar_term_boundary:{solar_month_branch:'未',
  previous_jie:{name:'小暑'},next_jie:{name:'立秋'}},
 warnings:[],source:{
  independent_fixed_cases_reference:'https://github.com/6tail/lunar-python/blob/master/test/EightCharTest.py'
 },
 pillars:[
  {kind:'year',label:'年柱',ganzhi:'己卯',stem_element:'土',branch_element:'木',
   stem_ten_god:'正财',na_yin:'城头土',hidden_stems:[{stem:'乙',element:'木',ten_god:'劫财'}]},
  {kind:'month',label:'月柱',ganzhi:'辛未',stem_element:'金',branch_element:'土',
   stem_ten_god:'正官',na_yin:'路旁土',hidden_stems:[{stem:'己',element:'土',ten_god:'正财'}]},
  {kind:'day',label:'日柱',ganzhi:'甲戌',stem_element:'木',branch_element:'土',
   stem_ten_god:'日主',na_yin:'山头火',hidden_stems:[{stem:'戊',element:'土',ten_god:'偏财'}]},
  {kind:'hour',label:'时柱',ganzhi:'壬申',stem_element:'水',branch_element:'金',
   stem_ten_god:'偏印',na_yin:'剑锋金',hidden_stems:[{stem:'庚',element:'金',ten_god:'七杀'}]},
 ]
}

it('V55 allows Beijing birth time and midnight/zi-hour choice and displays real four pillars',async()=>{
 const request=vi.fn().mockResolvedValue({ok:true,json:async()=>chart})
 vi.stubGlobal('fetch',request)
 render(<KnowledgeStage mode="bazi" onBack={()=>{}} onStudy={()=>{}}/>)
 fireEvent.change(screen.getByLabelText('八字公历出生日期'),{target:{value:'1999-07-21'}})
 fireEvent.change(screen.getByLabelText('八字北京时间'),{target:{value:'16:00'}})
 fireEvent.change(screen.getByLabelText('八字换日规则'),{target:{value:'midnight'}})
 fireEvent.click(screen.getByRole('button',{name:'按出生时间排四柱'}))
 await waitFor(()=>expect(request).toHaveBeenCalledTimes(1))
 expect(request.mock.calls[0][0]).toBe('/api/bazi/cast')
 expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({
  solar_date:'1999-07-21',clock:'16:00',day_boundary:'midnight'
 })
 expect(await screen.findByText('日主 甲 · 木')).toBeTruthy()
 const board=screen.getByRole('group',{name:'V55 真实八字四柱'})
 for(const gz of ['己卯','辛未','甲戌','壬申']){
  expect(within(board).getByText(gz)).toBeTruthy()
 }
 expect(within(board).getByText('天干十神：日主')).toBeTruthy()
 expect(screen.getByText(/年柱依立春、月柱依交节/)).toBeTruthy()
})

it('V55 switches late-zi rule and does not display stale result on API error',async()=>{
 const fn=vi.fn()
  .mockResolvedValueOnce({ok:true,json:async()=>chart})
  .mockResolvedValueOnce({ok:false,json:async()=>({detail:'出生日期超过历法支持范围'})})
 vi.stubGlobal('fetch',fn)
 render(<KnowledgeStage mode="bazi" onBack={()=>{}} onStudy={()=>{}}/>)
 fireEvent.click(screen.getByRole('button',{name:'按出生时间排四柱'}))
 expect(await screen.findByText('日主 甲 · 木')).toBeTruthy()
 fireEvent.change(screen.getByLabelText('八字换日规则'),{target:{value:'zi_hour'}})
 fireEvent.click(screen.getByRole('button',{name:'按出生时间排四柱'}))
 expect(await screen.findByRole('alert')).toHaveProperty('textContent','出生日期超过历法支持范围')
 expect(screen.queryByRole('group',{name:'V55 真实八字四柱'})).toBeNull()
 expect(JSON.parse(fn.mock.calls[1][1].body).day_boundary).toBe('zi_hour')
})

it('V55 keeps the old self-chosen heavenly stem training separate from real computed values',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>chart}))
 render(<KnowledgeStage mode="bazi" onBack={()=>{}} onStudy={()=>{}}/>)
 fireEvent.click(screen.getByRole('button',{name:'按出生时间排四柱'}))
 const board=screen.getByRole('group',{name:'V55 真实八字四柱'})
 expect(await within(board).findByText('甲戌')).toBeTruthy()
 const teaching=screen.getByRole('heading',{name:/教学自选/})
 expect(teaching).toBeTruthy()
 expect(within(board).getByText('甲戌')).toBeTruthy()
})
