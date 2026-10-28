// @vitest-environment jsdom
import React from 'react'
import {it,afterEach,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup} from '@testing-library/react'
import TaiyiV77Hour from '../src/TaiyiV77Hour.jsx'

afterEach(()=>{cleanup();vi.unstubAllGlobals()})

const source='https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkylq3yn8'
const names={9:['巽','东南'],2:['离','南'],7:['坤','西南'],4:['震','东'],
 5:['中','中央'],6:['兑','西'],3:['艮','东北'],8:['坎','北'],1:['乾','西北']}
const base={
  version:'V77',historical_ju_version:'V78',main_guest_version:'V79',
  input:{solar_date:'2026-12-23',clock:'10:30:00',hour_branch:'巳'},
  solstice:{name:'冬至',started_at_beijing:'2026-12-22T04:20:00+08:00',
     near_15_minutes:false},
  time_cycle:{dun:'阳遁',relative_time_count:16,
    relative_count_in_24:16,hours_in_current_palace:1},
  taiyi_palace:{number:7,trigram:'坤'},
  jishen:{branch:'亥',direction:'逆行十二支',movement:'一时一移'},
  nine_palaces:[9,2,7,4,5,6,3,8,1].map(number=>({
    number,trigram:names[number][0],direction:names[number][1],
    is_taiyi:number===7,is_middle_unvisited:number===5})),
  sources:{zhou:'https://zh.wikisource.org/zh/太乙金鏡式經',
           hour_example:source},
}
const eye={index:7,direction:'巳',god:'大神',palace:null,is_intermediate:true}
const addends=[1,2,0,7,0,6,0,1,0,8,0,3,0,4,0]
const trace=addends.map((added,i)=>({
   order:i+1,direction:['巳','午','未','坤','申','酉','戌','乾','亥','子','丑','艮','寅','卯','辰'][i],
   god:['大神','大威','天道','大武','武德','太簇','阴主','阴德','大义',
        '地主','阳德','和德','吕申','高丛','太阳'][i],added
 }))
const rotation=['子','丑','艮','寅','卯','辰','巽','巳','午','未','坤','申','酉','戌','乾','亥']
const v80={
 version:'V80',status:'source_conflict',hour_branch:'戌',
 harmony:{branch:'卯',god:'高丛'},
 dingji_eye:eye,
 computed_trace:trace,computed_trace_sum:32,
 count:null,main_general:null,assistant_general:null,
 source_disagreement:{
   actual_listed_addends:[1,2,7,6,1,8,3,4],listed_sum:32,
   printed_total:33,printed_big_general:3,
   printed_assistant_general:9},
 rotation:{rotated_sixteen:rotation.map((ground,i)=>({
    ground,heaven:rotation[(i+7)%16],is_dingji_eye:ground==='巳'}))},
 sources:{classical:source}
}
const gates={
 version:'V80',dun:'阳遁',chief_door:'生',
 hour_in_door:17,hour_in_120:47,
 sequence:['开','生','惊','休']
}

it('V80 never presents classical 33 as verified when trace adds to 32',async()=>{
 const f=vi.fn().mockResolvedValue({ok:true,json:async()=>({
    ...base,hour_dingji_v80:v80,hour_eight_doors_v80:gates
 })})
 vi.stubGlobal('fetch',f)
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 const section=await screen.findByRole('group',{name:'V80 太乙时计合神定算与八门直使'})
 expect(section.textContent).toContain('合神')
 expect(section.textContent).toContain('高丛')
 expect(section.textContent).toContain('大神')
 expect(section.textContent).toContain('古籍原文与列数冲突')
 expect(section.textContent).toContain('32算')
 expect(section.textContent).toContain('33算')
 expect(section.textContent).toContain('未将其作为唯一计算答案')
 expect(section.textContent).not.toContain('定大将 3 宫')
 expect(section.textContent).toContain('生门')
 expect(section.textContent).toContain('第17时')
 expect(section.textContent).toContain('开门 → 生门 → 惊门 → 休门')
 expect(within(section).getByRole('link').getAttribute('href')).toBe(source)
 expect(f.mock.calls[0][0]).toBe('/api/taiyi/hour/cast')
})

it('V80 makes every ancient addend inspectable while never fabricating +1',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({
    ...base,hour_dingji_v80:v80,hour_eight_doors_v80:gates
 })}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 const section=await screen.findByRole('group',{name:'V80 太乙时计合神定算与八门直使'})
 fireEvent.click(within(section).getByText('展开 V80 定计目十六神旋宫和逐宫取算证据'))
 const movement=within(section).getByRole('group',{name:'V80 定算逐项加数'})
 expect(movement.textContent).toContain('大神 ＋1')
 expect(movement.textContent).toContain('大威 ＋2')
 expect(movement.textContent).toContain('大武 ＋7')
 expect(movement.textContent).toContain('太簇 ＋6')
 expect(movement.textContent).toContain('地主 ＋8')
 expect(movement.textContent).toContain('高丛 ＋4')
 expect(movement.querySelectorAll('span')).toHaveLength(15)
 expect(within(section).getByRole('group',{name:'V80 时支六合旋宫原始位置'})
   .querySelectorAll('span')).toHaveLength(16)
 expect(section.textContent).toContain('1＋2＋7＋6＋1＋8＋3＋4=32')
})

it('V80 shows verified count generals and conservative same-palace separately',async()=>{
 const computed={...v80,status:'computed',count:22,main_general:2,
    assistant_general:6,source_disagreement:null}
 const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({
    ...base,hour_dingji_v80:computed,hour_eight_doors_v80:gates
 })})
 vi.stubGlobal('fetch',fetcher)
 const {rerender}=render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 const section=await screen.findByRole('group',{name:'V80 太乙时计合神定算与八门直使'})
 expect(section.textContent).toContain('22 算')
 expect(section.textContent).toContain('定大将 2 宫')
 expect(section.textContent).toContain('定参将 6 宫')
 expect(section.textContent).not.toContain('古籍原文与列数冲突')
 cleanup()
 const pending={...v80,status:'pending',count:null,
   main_general:null,assistant_general:null,source_disagreement:null}
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({
    ...base,hour_dingji_v80:pending,hour_eight_doors_v80:gates
 })}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 const second=await screen.findByRole('group',{name:'V80 太乙时计合神定算与八门直使'})
 expect(second.textContent).toContain('定目与太乙同宫')
 expect(second.textContent).not.toContain('定大将 0 宫')
})

it('V80 older V79 API works without inventing the new evidence',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>base}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 expect(await screen.findByRole('region',{name:'V77 太乙时计八宫与计神结果'})).toBeTruthy()
 expect(screen.queryByRole('group',{name:'V80 太乙时计合神定算与八门直使'})).toBeNull()
})
