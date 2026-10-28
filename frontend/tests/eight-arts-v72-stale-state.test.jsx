// @vitest-environment jsdom
// V72: Edit-after-cast invalidation and in-flight out-of-order responses.
import React from 'react'
import {afterEach,it,expect,vi} from 'vitest'
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react'
import KnowledgeStage from '../src/KnowledgeStage.jsx'
import FengshuiV70 from '../src/FengshuiV70.jsx'
import ZiweiV68 from '../src/ZiweiV68.jsx'

afterEach(()=>{cleanup();vi.unstubAllGlobals()})
const ok=body=>({ok:true,json:async()=>body})
const deferred=()=>{
  let resolve
  const promise=new Promise(r=>{resolve=r})
  return {promise,resolve}
}

const fChart={
 version:'V70',axis_label:'坐午向子',
 input:{bearing_degrees:0,bearing_role:'facing',north_reference:'true_north'},
 sitting:{degrees:180,mountain:'午',trigram:'离',palace_number:9,direction:'南',element:'火'},
 facing:{degrees:0,mountain:'子',trigram:'坎',palace_number:1,direction:'北',element:'水'},
 true_bearing_degrees:0,near_boundary:false,
 nine_palaces:[],twenty_four_mountains:[],
 compass_convention:{mountain_intervals:'24山15度',magnetic_declination:'手动校正'},
 warnings:[],not_implemented:[],sources:{mountain_chart:'https://www.yuanka.com.cn/tools/luopan'},
}
const zChart={
 version:'V69',year_ganzhi:'庚申',ming_ganzhi:'乙酉',ming_branch:'酉',
 shen_branch:'未',ziwei_branch:'卯',tianfu_branch:'丑',hour_branch:'巳',
 great_limit_direction:'顺行',five_element_bureau:{label:'水二局',number:2},
 calendar:{solar_date:'1980-02-19',lunar:{display:'1980年1月4日'},verification:'test_library'},
 input:{clock:'09:00'},rules:{leap_month:'闰月当本月',year_boundary:'农历正月初一',
  ming_shen:'寅宫起正月'},
 ziwei_trace:{day:4,borrowed:0,quotient:2,borrow_direction:'不借数',result:'卯'},
 palaces:[],warnings:[],not_implemented:[]
}

it('Fengshui hides old board after editing bearing and ignores a stale response',async()=>{
 const later=deferred()
 const fetcher=vi.fn().mockResolvedValueOnce(ok(fChart))
                  .mockImplementationOnce(()=>later.promise)
 vi.stubGlobal('fetch',fetcher)
 render(<FengshuiV70/>)
 fireEvent.click(screen.getByRole('button',{name:'计算二十四山坐向'}))
 expect(await screen.findByText('坐午向子')).toBeTruthy()
 fireEvent.change(screen.getByLabelText('堪舆方位角'),{target:{value:'90'}})
 expect(screen.queryByText('坐午向子')).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'计算二十四山坐向'}))
 expect(fetcher).toHaveBeenCalledTimes(2)
 fireEvent.change(screen.getByLabelText('堪舆方位角'),{target:{value:'180'}})
 await act(async()=>later.resolve(ok(fChart)))
 expect(screen.queryByText('坐午向子')).toBeNull()
 expect(screen.getByRole('button',{name:'计算二十四山坐向'}).disabled).toBe(false)
})

it('Ziwei gender/date school changes cannot retain or resurrect a previous chart',async()=>{
 const later=deferred()
 const fetcher=vi.fn().mockResolvedValueOnce(ok(zChart))
                  .mockImplementationOnce(()=>later.promise)
 vi.stubGlobal('fetch',fetcher)
 render(<ZiweiV68/>)
 fireEvent.click(screen.getByRole('button',{name:'计算紫微命盘'}))
 expect(await screen.findByText(/庚申年 · 水二局/)).toBeTruthy()
 fireEvent.change(screen.getByLabelText('紫微性别'),{target:{value:'female'}})
 expect(screen.queryByText(/庚申年 · 水二局/)).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'计算紫微命盘'}))
 expect(fetcher).toHaveBeenCalledTimes(2)
 fireEvent.change(screen.getByLabelText('紫微四化流派'),{target:{value:'common'}})
 await act(async()=>later.resolve(ok(zChart)))
 expect(screen.queryByText(/庚申年 · 水二局/)).toBeNull()
 expect(screen.getByRole('button',{name:'计算紫微命盘'}).disabled).toBe(false)
})

it('Qimen input changes invalidate an in-flight earlier term and plate',async()=>{
 const later=deferred()
 vi.stubGlobal('fetch',vi.fn().mockImplementation(()=>later.promise))
 const {container}=render(<KnowledgeStage mode="qimen" onBack={()=>{}} onStudy={()=>{}}/>)
 fireEvent.click(screen.getByRole('button',{name:'按所选时间起局'}))
 fireEvent.change(screen.getByLabelText('奇门换日规则'),{target:{value:'midnight'}})
 await act(async()=>later.resolve(ok({ju_label:'不应出现旧盘'})))
 expect(container.querySelector('.qimen-v50-result')).toBeNull()
 expect(screen.getByRole('button',{name:'按所选时间起局'}).disabled).toBe(false)
})

it('Bazi input changes invalidate an in-flight earlier four-pillars response',async()=>{
 const later=deferred()
 vi.stubGlobal('fetch',vi.fn().mockImplementation(()=>later.promise))
 const {container}=render(<KnowledgeStage mode="bazi" onBack={()=>{}} onStudy={()=>{}}/>)
 const form=container.querySelector('form.bazi-v55-form')
 expect(form).toBeTruthy()
 fireEvent.submit(form)
 fireEvent.change(screen.getByLabelText('八字换日规则'),{target:{value:'zi_hour'}})
 await act(async()=>later.resolve(ok({pillars:[]})))
 expect(container.querySelector('.bazi-v55-result')).toBeNull()
 expect(form.querySelector('button[type=submit]').disabled).toBe(false)
})
