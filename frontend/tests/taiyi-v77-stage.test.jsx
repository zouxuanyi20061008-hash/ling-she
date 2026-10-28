// @vitest-environment jsdom
import React from 'react'
import {it,afterEach,expect,vi} from 'vitest'
import {render,screen,fireEvent,cleanup,act,within} from '@testing-library/react'
import TaiyiV77Hour from '../src/TaiyiV77Hour.jsx'
import TaiyiV64 from '../src/TaiyiV64.jsx'

afterEach(()=>{cleanup();vi.unstubAllGlobals()})
const palaceMap={
  9:['巽','东南'],2:['离','南'],7:['坤','西南'],4:['震','东'],
  5:['中','中央'],6:['兑','西'],3:['艮','东北'],8:['坎','北'],1:['乾','西北']
}
const chart={
 version:'V77',art:'太乙神数',
 calculation:'时计·冬夏至后相对时实（基础）',
 input:{solar_date:'2026-06-21',clock:'17:30:00',timezone:'Asia/Shanghai',
        hour_branch:'酉',uses_civil_double_hour:true},
 solstice:{name:'夏至',started_at_beijing:'2026-06-21T16:24:30+08:00',
           near_15_minutes:false},
 time_cycle:{dun:'阴遁',relative_time_count:2,relative_count_in_24:2,
    hours_in_current_palace:2},
 taiyi_palace:{number:9,trigram:'巽',direction:'东南'},
 jishen:{branch:'未',direction:'逆行十二支',movement:'一时一移'},
 nine_palaces:[9,2,7,4,5,6,3,8,1].map(number=>({
   number,trigram:palaceMap[number][0],direction:palaceMap[number][1],
   is_taiyi:number===9,is_middle_unvisited:number===5
 })),
 sources:{zhou:'https://zh.wikisource.org/zh/太乙金鏡式經',
          hour_example:'https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkylq3yn8'},
 has_full_hour_chart:false,canonical_five_yuan_72_ju:null,
 canonical_historical_hour_count:null,fortune_verdict:null
}

it('V77 renders separate genuine hour board without mixing annual Taiyi structure',async()=>{
 const spy=vi.fn().mockResolvedValue({ok:true,json:async()=>chart})
 vi.stubGlobal('fetch',spy)
 render(<TaiyiV64/>)
 expect(screen.getByRole('heading',{name:'时计起盘 · 北京时间双时辰'})).toBeTruthy()
 expect(screen.getByRole('button',{name:'计算太乙年局'})).toBeTruthy()
 fireEvent.change(screen.getByLabelText('太乙时计公历日期'),
   {target:{value:'2026-06-21'}})
 fireEvent.change(screen.getByLabelText('太乙时计北京时间'),
   {target:{value:'17:30'}})
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 const section=await screen.findByRole('region',{name:'V77 太乙时计八宫与计神结果'})
 expect(section.textContent).toContain('夏至后')
 expect(section.textContent).toContain('阴遁')
 expect(section.textContent).toContain('太乙9宫巽')
 expect(section.textContent).toContain('相对第 2 时')
 expect(section.textContent).toContain('计神：未')
 const palaces=within(section).getByRole('group',{name:'太乙时计九宫位置'})
 expect(palaces.querySelectorAll('.taiyi-v77-cell')).toHaveLength(9)
 expect(palaces.querySelectorAll('.is-taiyi')).toHaveLength(1)
 expect(palaces.querySelectorAll('.is-center')).toHaveLength(1)
 const payload=JSON.parse(spy.mock.calls[0][1].body)
 expect(payload).toEqual({solar_date:'2026-06-21',clock:'17:30'})
 expect(spy.mock.calls[0][0]).toBe('/api/taiyi/hour/cast')
 expect(screen.queryByRole('group',{name:'太乙式九宫岁计盘'})).toBeNull()
})

it('V77 near actual solstice always warns about boundary',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({
   ...chart,solstice:{...chart.solstice,near_15_minutes:true}})}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 const section=await screen.findByRole('region',{name:'V77 太乙时计八宫与计神结果'})
 expect(within(section).getByRole('note').textContent).toContain('交节前后十五分钟')
 expect(section.textContent).toContain('甲子元积时')
})

it('V77 field edits invalidate rendered board and stale requests',async()=>{
 let done
 const fetcher=vi.fn().mockImplementationOnce(()=>Promise.resolve({
    ok:true,json:async()=>chart
 })).mockImplementationOnce(()=>new Promise(r=>{done=r}))
 vi.stubGlobal('fetch',fetcher)
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 expect(await screen.findByRole('region',{name:'V77 太乙时计八宫与计神结果'})).toBeTruthy()
 fireEvent.change(screen.getByLabelText('太乙时计北京时间'),
   {target:{value:'18:30'}})
 expect(screen.queryByRole('region',{name:'V77 太乙时计八宫与计神结果'})).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 expect(fetcher).toHaveBeenCalledTimes(2)
 fireEvent.change(screen.getByLabelText('太乙时计公历日期'),
   {target:{value:'2026-06-22'}})
 await act(async()=>done({ok:true,json:async()=>chart}))
 expect(screen.queryByRole('region',{name:'V77 太乙时计八宫与计神结果'})).toBeNull()
 expect(screen.getByRole('button',{name:'计算太乙时计基础盘'}).disabled).toBe(false)
})

it('V77 fails visibly when time input is rejected rather than showing false output',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({
  ok:false,json:async()=>({detail:'V77 时计仅支持1901至2099年公历'})}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 expect((await screen.findByRole('alert')).textContent).toContain('1901至2099')
 expect(screen.queryByRole('region',{name:'V77 太乙时计八宫与计神结果'})).toBeNull()
})
