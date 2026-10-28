// @vitest-environment jsdom
import React from 'react'
import {it,afterEach,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup} from '@testing-library/react'
import TaiyiV77Hour from '../src/TaiyiV77Hour.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
const dirs='子丑寅卯辰巳午未申酉戌亥'.split('')
const stars={
  "9":["巽","东南"],"2":["离","南"],"7":["坤","西南"],"4":["震","东"],
  "5":["中","中央"],"6":["兑","西"],"3":["艮","东北"],
  "8":["坎","北"],"1":["乾","西北"]
}
const mainTrace=[
 {order:1,index:14,direction:'乾',god:'阴德',added:1},
 {order:2,index:15,direction:'亥',god:'大义',added:0},
 {order:3,index:0,direction:'子',god:'地主',added:8},
 {order:4,index:1,direction:'丑',god:'阳德',added:0},
 {order:5,index:2,direction:'艮',god:'和德',added:3},
 {order:6,index:3,direction:'寅',god:'吕申',added:0},
 {order:7,index:4,direction:'卯',god:'高丛',added:4},
]
const guestTrace=[
 {order:1,index:11,direction:'申',god:'武德',added:1},
 {order:2,index:12,direction:'酉',god:'太簇',added:6},
 {order:3,index:13,direction:'戌',god:'阴主',added:0},
 ...mainTrace.map((row,i)=>({...row,order:i+4}))
]
const source='https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkylq3yn8'
const completed={
 version:'V79',status:'computed',five_yuan_name:'戊子元',dun:'阳遁',ju:23,
 taiyi_palace:9,jishen:'辰',
 heaven_eye_wenchang:{direction:'乾',god:'阴德',index:14},
 earth_eye_shiji:{direction:'申',god:'武德',index:11},
 main:{status:'computed',count:16,main_general:6,assistant_general:8,
       trace:mainTrace,stop_direction:'巽'},
 guest:{status:'computed',count:23,main_general:3,assistant_general:9,
       trace:guestTrace,stop_direction:'巽'},
 sixteen_spirits:[{index:0,direction:'子',god:'地主',
  has_wenchang:false,has_shiji:false,has_jishen:false},
 {index:5,direction:'辰',god:'太阳',
  has_wenchang:false,has_shiji:false,has_jishen:true},
 {index:11,direction:'申',god:'武德',
  has_wenchang:false,has_shiji:true,has_jishen:false},
 {index:14,direction:'乾',god:'阴德',
  has_wenchang:true,has_shiji:false,has_jishen:false}],
 sources:{ancient_887:source}
}
const chart={
 version:'V77',historical_ju_version:'V78',main_guest_version:'V79',
 input:{solar_date:'2026-12-23',clock:'10:30:00',hour_branch:'巳'},
 solstice:{name:'冬至',started_at_beijing:'2026-12-22T04:17:00+08:00',
   near_15_minutes:false},
 time_cycle:{dun:'阳遁',relative_time_count:16,relative_count_in_24:16,
   hours_in_current_palace:1},
 taiyi_palace:{number:7,trigram:'坤'},
 jishen:{branch:'亥',direction:'逆行十二支',movement:'一时一移'},
 nine_palaces:[9,2,7,4,5,6,3,8,1].map(number=>({
   number,trigram:stars[number][0],direction:stars[number][1],
   is_taiyi:number===7,is_middle_unvisited:number===5})),
 sources:{zhou:'https://zh.wikisource.org/zh/太乙金鏡式經',
   hour_example:source},
 hour_main_guest_v79:completed
}

it('V79 shows independent classical hour counts, full directions and all four generals',async()=>{
 const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>chart})
 vi.stubGlobal('fetch',fetcher)
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 const section=await screen.findByRole('group',{name:'V79 时计始击与主客大小将实盘'})
 expect(section.textContent).toContain('戊子元')
 expect(section.textContent).toContain('阳遁23局')
 expect(section.textContent).toContain('阴德')
 expect(section.textContent).toContain('武德')
 expect(section.textContent).toContain('16 算')
 expect(section.textContent).toContain('23 算')
 expect(section.textContent).toContain('主大将')
 expect(section.textContent).toContain('客大将')
 expect(section.textContent).toContain('6宫')
 expect(section.textContent).toContain('8宫')
 expect(section.textContent).toContain('3宫')
 expect(section.textContent).toContain('9宫')
 expect(within(section).getByRole('link').getAttribute('href')).toBe(source)
 const main=within(section).getByText('展开主方逐宫取算路径（不含太乙本宫）')
 fireEvent.click(main)
 const trace=within(section).getByRole('group',{name:'主方主客逐位投算'})
 expect(trace.textContent).toContain('地主 ＋8')
 expect(trace.textContent).toContain('高丛 ＋4')
 expect(trace.textContent).not.toContain('巽')
 const guest=within(section).getByText('展开客方逐宫取算路径（不含太乙本宫）')
 fireEvent.click(guest)
 expect(within(section).getByRole('group',{name:'客方主客逐位投算'}).textContent)
   .toContain('太簇 ＋6')
 const btn=within(section).getByText('核对 V79 时计十六神：文昌、始击与计神实际位置')
 fireEvent.click(btn)
 expect(within(section).getByRole('group',{name:'V79 时计十六神原始位置'}).textContent)
   .toContain('[始击]')
 expect(screen.getByRole('region',{name:'V77 太乙时计八宫与计神结果'}).textContent)
   .toContain('太乙7宫坤')
 expect(JSON.parse(fetcher.mock.calls[0][1].body)).toHaveProperty('solar_date')
})

it('V79 partial same-palace is not silently coerced into zero or a fake general',async()=>{
 const ambiguous={...completed,status:'partially_computed',
   main:{status:'pending',count:null,main_general:null,assistant_general:null,
         trace:[],reason:'起算目与太乙同宫，未独立核定',same_palace_as_taiyi:true}}
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({
   ...chart,hour_main_guest_v79:ambiguous
 })}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 const section=await screen.findByRole('group',{name:'V79 时计始击与主客大小将实盘'})
 expect(section.textContent).toContain('同宫规则待判')
 expect(section.textContent).toContain('同宫特殊取算未核')
 expect(section.textContent).toContain('未决')
 expect(section.textContent).toContain('客大将')
 expect(section.textContent).toContain('3宫')
 expect(section.textContent).not.toContain('主大将 0宫')
 expect(section.textContent).not.toContain('主大将 9宫')
})

it('V79 previous V78 API fields without new calculation display safely',async()=>{
 const {hour_main_guest_v79,...legacy}=chart
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>legacy}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 expect(await screen.findByRole('region',{name:'V77 太乙时计八宫与计神结果'}))
   .toBeTruthy()
 expect(screen.queryByRole('group',{name:'V79 时计始击与主客大小将实盘'}))
   .toBeNull()
})
