// @vitest-environment jsdom
import React from 'react'
import {afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,waitFor,cleanup,within} from '@testing-library/react'
import KnowledgeStage from '../src/KnowledgeStage.jsx'

afterEach(()=>{
  cleanup()
  vi.unstubAllGlobals()
})

function panel(){
 return render(<KnowledgeStage mode="qimen" onBack={()=>{}} onStudy={()=>{}}/>)
}

it('V50 user inputs Beijing date/time, requests server cast, shows computed earth disc not moving sky',async()=>{
 const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({
   version:'V50',ju_label:'阳遁8局',yuan:'上元',solar_term:'立春',
   day_ganzhi:'甲子',hour_ganzhi:'丙寅',day_fu_tou:'甲子',
   duty_origin:{time_xun:'甲子',concealed_stem:'戊',
     origin_star:'天冲',earth_origin_palace:3,origin_door:'伤门'},
   palaces:[
     {number:4,name:'巽',earth_stem:'己',original_star:'天辅',original_door:'杜门'},
     {number:9,name:'离',earth_stem:'戊',original_star:'天英',original_door:'景门'}
   ],input_provenance:{warnings:[]},
   reference:'https://daizhige.org/易藏/术数/奇门遁甲元灵经.html'
 })})
 vi.stubGlobal('fetch',fetchMock)
 panel()
 expect(screen.getByRole('heading',{name:'北京时间定局 · 九宫星门转盘'})).toBeTruthy()
 fireEvent.change(screen.getByLabelText('奇门公历日期'),{target:{value:'2026-02-04'}})
 fireEvent.change(screen.getByLabelText('奇门北京时间'),{target:{value:'04:30'}})
 fireEvent.change(screen.getByLabelText('奇门换日规则'),{target:{value:'midnight'}})
 fireEvent.click(screen.getByRole('button',{name:'按所选时间起局'}))
 await waitFor(()=>expect(fetchMock).toHaveBeenCalledTimes(1))
 expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
   solar_date:'2026-02-04',clock:'04:30',day_boundary:'midnight'
 })
 expect(await screen.findByText('阳遁8局 · 上元')).toBeTruthy()
 const earth=screen.getByRole('group',{name:'V50 奇门九宫真实地盘'})
 expect(within(earth).getByText('己')).toBeTruthy()
 expect(within(earth).getByText('戊')).toBeTruthy()
 expect(screen.getByText(/不是完整奇门时盘/)).toBeTruthy()
})

it('V50 does not hallucinate a plate when server rejects date',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({
   ok:false,json:async()=>({detail:'日期超过可换算范围'})
 }))
 panel()
 fireEvent.click(screen.getByRole('button',{name:'按所选时间起局'}))
 expect(await screen.findByRole('alert')).toHaveProperty('textContent','日期超过可换算范围')
 expect(screen.queryByRole('group',{name:'V50 奇门九宫真实地盘'})).toBeNull()
})
