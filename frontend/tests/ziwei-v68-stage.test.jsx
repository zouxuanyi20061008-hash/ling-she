// @vitest-environment jsdom
import React from 'react'
import {afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup} from '@testing-library/react'
import KnowledgeStage from '../src/KnowledgeStage.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
const br='子丑寅卯辰巳午未申酉戌亥'.split('')
const s={子:['太阳'],丑:['天府'],寅:['天机','太阴'],卯:['紫微','贪狼'],
 辰:['巨门'],巳:['天相'],午:['天梁'],未:['廉贞','七杀'],
 申:[],酉:[],戌:['天同'],亥:['武曲','破军']}
const chart={version:'V68',year_ganzhi:'庚申',ming_ganzhi:'乙酉',shen_branch:'未',
 ming_branch:'酉',ziwei_branch:'卯',tianfu_branch:'丑',hour_branch:'巳',
 great_limit_direction:'顺行',five_element_bureau:{label:'水二局',number:2},
 calendar:{solar_date:'1980-02-19',lunar:{display:'1980年1月4日'},verification:'lunar_python'},
 input:{clock:'09:00'},rules:{leap_month:'闰月当本月',year_boundary:'农历正月初一',ming_shen:'寅起正月'},
 ziwei_trace:{day:4,borrowed:0,quotient:2,borrow_direction:'不借数',result:'卯'},
 palaces:br.map((branch,i)=>({branch,ganzhi:'甲'+branch,name:branch==='酉'?'命宫':'第'+i+'宫',
  is_ming:branch==='酉',is_shen:branch==='未',main_stars:s[branch],
  great_limit:{start_age:i*10+2,end_age:i*10+11}})),
 not_implemented:['四化','辅曜'],warnings:[]}
it('V68 actual Ziwei entrance posts birth time and shows twelve selectable stars',async()=>{
 const spy=vi.fn().mockResolvedValue({ok:true,json:async()=>chart})
 vi.stubGlobal('fetch',spy)
 render(<KnowledgeStage mode="ziwei" onBack={()=>{}} onStudy={()=>{}}/>)
 fireEvent.change(screen.getByLabelText('紫微公历日期'),{target:{value:'1980-02-19'}})
 fireEvent.change(screen.getByLabelText('紫微性别'),{target:{value:'male'}})
 fireEvent.click(screen.getByRole('button',{name:'计算紫微命盘'}))
 expect(await screen.findByText(/庚申年 · 水二局/)).toBeTruthy()
 expect(spy.mock.calls[0][0]).toBe('/api/ziwei/cast')
 expect(JSON.parse(spy.mock.calls[0][1].body)).toEqual({
  calendar_type:'solar',solar_date:'1980-02-19',clock:'09:00',gender:'male',
  leap_month_rule:'same_month'})
 const grid=screen.getByRole('group',{name:'V69 紫微十二宫星盘'})
 expect(within(grid).getAllByRole('button')).toHaveLength(12)
 expect(within(grid).getByText('紫微 · 贪狼')).toBeTruthy()
 fireEvent.click(within(grid).getByRole('button',{name:/甲卯/}))
 expect(screen.getByRole('region',{name:'当前选中的紫微宫位'}).textContent).toContain('紫微')
})
it('V68 lunar leap fields and alternate convention sent exactly',async()=>{
 const spy=vi.fn().mockResolvedValue({ok:true,json:async()=>chart})
 vi.stubGlobal('fetch',spy)
 render(<KnowledgeStage mode="ziwei" onBack={()=>{}} onStudy={()=>{}}/>)
 fireEvent.change(screen.getByLabelText('紫微日期历法'),{target:{value:'lunar'}})
 fireEvent.change(screen.getByLabelText('紫微农历年'),{target:{value:'2020'}})
 fireEvent.change(screen.getByLabelText('紫微农历月'),{target:{value:'4'}})
 fireEvent.change(screen.getByLabelText('紫微农历日'),{target:{value:'1'}})
 fireEvent.click(screen.getByLabelText('紫微闰月'))
 fireEvent.change(screen.getByLabelText('紫微闰月口径'),{target:{value:'next_month'}})
 fireEvent.click(screen.getByRole('button',{name:'计算紫微命盘'}))
 expect(await screen.findByText(/庚申年 · 水二局/)).toBeTruthy()
 expect(JSON.parse(spy.mock.calls[0][1].body)).toEqual({
  calendar_type:'lunar',lunar_year:2020,lunar_month:4,lunar_day:1,
  is_leap_month:true,clock:'09:00',gender:'unspecified',leap_month_rule:'next_month'})
})
it('V68 invalid calendar error shown without fabricated chart',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,
   json:async()=>({detail:'这一年没有所选的闰月'})}))
 render(<KnowledgeStage mode="ziwei" onBack={()=>{}} onStudy={()=>{}}/>)
 fireEvent.click(screen.getByRole('button',{name:'计算紫微命盘'}))
 expect((await screen.findByRole('alert')).textContent).toContain('闰月')
 expect(screen.queryByRole('group',{name:'V69 紫微十二宫星盘'})).toBeNull()
})
