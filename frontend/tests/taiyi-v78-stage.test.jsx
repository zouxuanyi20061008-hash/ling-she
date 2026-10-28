// @vitest-environment jsdom
import React from 'react'
import {it,afterEach,expect,vi} from 'vitest'
import {render,screen,fireEvent,cleanup,within} from '@testing-library/react'
import TaiyiV77Hour from '../src/TaiyiV77Hour.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})

const palaceMap={9:['巽','东南'],2:['离','南'],7:['坤','西南'],
 4:['震','东'],5:['中','中央'],6:['兑','西'],3:['艮','东北'],
 8:['坎','北'],1:['乾','西北']}
const base={
 version:'V77',historical_ju_version:'V78',
 input:{solar_date:'2026-06-22',clock:'09:30:00',timezone:'Asia/Shanghai',
        hour_branch:'巳'},
 solstice:{name:'夏至',started_at_beijing:'2026-06-21T16:24:30+08:00',
   near_15_minutes:false},
 time_cycle:{dun:'阴遁',relative_time_count:9,relative_count_in_24:9,
   hours_in_current_palace:3},
 taiyi_palace:{number:7,trigram:'坤',direction:'西南'},
 jishen:{branch:'亥',direction:'逆行十二支',movement:'一时一移'},
 nine_palaces:[9,2,7,4,5,6,3,8,1].map(number=>({
   number,trigram:palaceMap[number][0],direction:palaceMap[number][1],
   is_taiyi:number===7,is_middle_unvisited:number===5})),
 sources:{zhou:'https://zh.wikisource.org/zh/太乙金鏡式經',
          hour_example:'https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkylq3yn8'}
}
const classic={
 accumulated_hours:249,
 in_cycle_360:249,six_ji_number:5,
 five_yuan_name:'庚子元',ju:33,
 taiyi_palace:{number:8,trigram:'坎'},
 time_jishen:'申',
 time_wenchang:{index:14,direction:'乾',god:'阴德',count_in_18:15,
   trace:[{count:1,direction:'申',god:'武德',double_stay:false},
          {count:2,direction:'酉',god:'太簇',double_stay:false},
          {count:3,direction:'戌',god:'阴主',double_stay:false},
          {count:4,direction:'乾',god:'阴德',double_stay:false},
          {count:5,direction:'乾',god:'阴德',double_stay:true}]},
 anchor:{prior_jiazi_date:'2026-06-01',days_between_jiazi_and_solstice:20},
 compared_to_v77:{v77_relative_since_solstice:9,v78_from_prior_jiazi:249,
   offset_in_double_hours:240,palace_agrees:false,
   v77_palace:7,v78_palace:8,claim_same_epoch:false},
 sources:{independent_887_and_47:'https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkylq3yn8',
   yin_63:'https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkvlnkx7u'}
}

it('V78 shows separate Jiazi historic school without replacing existing V77 relative chart',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({
   ...base,classical_jiazi_hour_v78:classic
 })}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 const old=await screen.findByRole('region',{name:'V77 太乙时计八宫与计神结果'})
 expect(old.textContent).toContain('太乙7宫坤')
 const section=within(old).getByRole('group',{name:'V78 时计甲子积时与五元文昌证据'})
 expect(section.textContent).toContain('甲子日子时')
 expect(section.textContent).toContain('249')
 expect(section.textContent).toContain('庚子元')
 expect(section.textContent).toContain('六纪')
 expect(section.textContent).toContain('阴德')
 expect(section.textContent).toContain('太乙入宫不同')
 expect(within(section).getAllByRole('link')).toHaveLength(2)
 expect(within(section).getByText(/本课累计/)).toBeTruthy()
 expect(old.querySelectorAll('.taiyi-v77-cell.is-taiyi')).toHaveLength(1)
})

it('V78 can reveal every Wenchang step while preserving doubled-stay marker',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({
    ...base,classical_jiazi_hour_v78:classic
 })}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 const section=await screen.findByRole('group',{name:'V78 时计甲子积时与五元文昌证据'})
 fireEvent.click(within(section).getByText(/查看时文昌十八算/))
 expect(within(section).getByRole('group',{name:'V78 时文昌逐位计数路径'}).textContent)
   .toContain('重留')
})

it('V78 preserves old V77 API response without generating fake historic values',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>base}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 expect(await screen.findByRole('region',{name:'V77 太乙时计八宫与计神结果'})).toBeTruthy()
 expect(screen.queryByRole('group',{name:'V78 时计甲子积时与五元文昌证据'})).toBeNull()
})
