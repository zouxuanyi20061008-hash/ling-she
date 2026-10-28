// @vitest-environment jsdom
import React from 'react'
import {it,afterEach,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup} from '@testing-library/react'
import TaiyiV77Hour from '../src/TaiyiV77Hour.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})

const source='https://www.shidianguji.com/zh/book/SK1615/chapter/1l9lir739jmyy'
const src2='https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkvlnkx7u'
const trig={9:'巽',2:'离',7:'坤',4:'震',5:'中',6:'兑',3:'艮',8:'坎',1:'乾'}
const base={
 version:'V77',
 input:{solar_date:'2026-10-28',clock:'14:30:00',hour_branch:'未'},
 solstice:{name:'夏至',started_at_beijing:'2026-06-21T16:20:00+08:00',
  near_15_minutes:false},
 time_cycle:{dun:'阴遁',relative_time_count:1550,
  relative_count_in_24:14,hours_in_current_palace:2},
 taiyi_palace:{number:7,trigram:'坤'},
 jishen:{branch:'午',direction:'逆行十二支',movement:'一时一移'},
 nine_palaces:[9,2,7,4,5,6,3,8,1].map(number=>({
    number,trigram:trig[number],is_taiyi:number===7,is_middle_unvisited:number===5
 })),
 sources:{zhou:'https://zh.wikisource.org/zh/太乙金鏡式經',
 hour_example:'https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkylq3yn8'}
}
const different={
 version:'V83',dun:'阴遁',solstice_name:'夏至',
 relative_count:1550,previous_jiazi_count:1718,
 offset_between_epoch_hours:168,offset_modulo_120:48,
 solstice_chief:'景',jiazi_chief:'死',
 solstice_hour_in_door:20,jiazi_hour_in_door:8,
 same_chief_door:false,same_chief_and_hour_in_door:false,
 jinjing_solstice_relative:{source,school_id:'wangximing_solstice_qi'},
 jinyao_jiazi_shortcut:{source:src2,school_id:'jiazi_before_solstice_shortcut'}
}
const same={...different,
 relative_count:47,previous_jiazi_count:887,offset_between_epoch_hours:840,
 offset_modulo_120:0,solstice_chief:'生',jiazi_chief:'生',
 solstice_hour_in_door:17,jiazi_hour_in_door:17,
 same_chief_door:true,same_chief_and_hour_in_door:true}

it('V83 shows different solstice and Jiazi door clocks without replacing earlier V77 board',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({
   ...base,hour_v83_chief_epoch_comparison:different
 })}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 const s=await screen.findByRole('group',{name:'V83 太乙时计二至气应和甲子捷法直使对照'})
 expect(s.textContent).toContain('王希明')
 expect(s.textContent).toContain('景门')
 expect(s.textContent).toContain('死门')
 expect(s.textContent).toContain('积1550时')
 expect(s.textContent).toContain('积1718时')
 expect(s.textContent).toContain('两法此课直使门名不同')
 expect(s.textContent).toContain('不得把此处王希明二至法直使直接套到下方原有大将宫')
 expect(within(s).getAllByRole('link')).toHaveLength(2)
 expect(within(s).getAllByRole('link')[0].getAttribute('href')).toBe(source)
 expect(screen.getByRole('region',{name:'V77 太乙时计八宫与计神结果'}).textContent)
 .toContain('太乙7宫坤')
})

it('V83 equal doors still openly disclose different epochs and non-equivalent full chart',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({
   ...base,hour_v83_chief_epoch_comparison:same
 })}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 const s=await screen.findByRole('group',{name:'V83 太乙时计二至气应和甲子捷法直使对照'})
 expect(s.textContent).toContain('两法此课直使门名相同')
 expect(s.textContent).toContain('两法本课门内时数也相同')
 expect(s.textContent).toContain('不证明起点一致')
 expect(s.textContent).toContain('起点相差')
 expect(s.textContent).toContain('840时')
 expect(s.textContent).toContain('120时周余0时')
})

it('V83 older V82 API stays operational without fake comparison',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>base}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 expect(await screen.findByRole('region',{name:'V77 太乙时计八宫与计神结果'})).toBeTruthy()
 expect(screen.queryByRole('group',{name:'V83 太乙时计二至气应和甲子捷法直使对照'})).toBeNull()
})
