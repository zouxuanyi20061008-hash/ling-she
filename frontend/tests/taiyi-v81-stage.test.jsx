// @vitest-environment jsdom
import React from 'react'
import {it,afterEach,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup} from '@testing-library/react'
import TaiyiV77Hour from '../src/TaiyiV77Hour.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
const source='https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkylq3yn8'
const volume='https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkvlnkx7u'
const positions=['子','丑','艮','寅','卯','辰','巽','巳','午','未','坤','申','酉','戌','乾','亥']
const names={9:['巽','东南'],2:['离','南'],7:['坤','西南'],4:['震','东'],
 5:['中','中央'],6:['兑','西'],3:['艮','东北'],8:['坎','北'],1:['乾','西北']}
const base={
  version:'V77',historical_ju_version:'V78',main_guest_version:'V79',
  input:{solar_date:'2026-12-23',clock:'10:30:00',hour_branch:'巳'},
  solstice:{name:'冬至',started_at_beijing:'2026-12-22T04:20:00+08:00',near_15_minutes:false},
  time_cycle:{dun:'阳遁',relative_time_count:16,relative_count_in_24:16,hours_in_current_palace:1},
  taiyi_palace:{number:7,trigram:'坤'},
  jishen:{branch:'亥',direction:'逆行十二支',movement:'一时一移'},
  nine_palaces:[9,2,7,4,5,6,3,8,1].map(number=>({
    number,trigram:names[number][0],direction:names[number][1],
    is_taiyi:number===7,is_middle_unvisited:number===5})),
  sources:{zhou:'https://zh.wikisource.org/zh/太乙金鏡式經',
           hour_example:source}
}
const witness={
 version:'V81',status:'historical_text_arithmetic_disagreement_open',
 calculation_status:'source_conflict',nonzero_sum:32,reported_total:33,
 nonzero_addends:[1,2,7,6,1,8,3,4].map(added=>({added})),
 source_witnesses:[{name:'庚戌时',source,arithmetic_sum:32,written_count:33,
                     independent_from_other_witnesses:false}]
}
const candidate={
 version:'V81',chief_door:'生',candidate_direction:'巳',candidate_god:'大神',
 is_intermediate_direction:true,
 candidate_position_marks:positions.map((direction,index)=>({
   index,direction,god:direction==='巳'?'大神':'十六神',
   candidate_chief_door_here:direction==='巳',
   candidate_door:direction==='巳'?'生':null
 })),
 primary_text_rules:[{source},{source:volume}]
}
const same={version:'V81',pending_sides:1,cases:[{
  side:'客',eye_direction:'巽',eye_god:'大炅'
}]}
function props(mode='disputed'){
 return mode==='disputed'
  ?{...base,hour_v81_source_review:witness,
    hour_v81_door_location_candidate:candidate,
    hour_v81_same_palace_review:same}
  :{...base,hour_v81_source_review:{
      ...witness,calculation_status:'computed',nonzero_sum:22,reported_total:null
    },hour_v81_door_location_candidate:{
      ...candidate,candidate_direction:'乾',candidate_god:'阴德',
      is_intermediate_direction:false,candidate_palace:1,
      candidate_position_marks:positions.map((direction,index)=>({
        index,direction,god:'神',candidate_chief_door_here:direction==='乾',
        candidate_door:direction==='乾'?'开':null
      })),chief_door:'开'
    },hour_v81_same_palace_review:{version:'V81',pending_sides:0,cases:[]}}
}
it('V81 presents a single ancient internal 32-vs-33 dispute, not false independent editions',async()=>{
 const spy=vi.fn().mockResolvedValue({ok:true,json:async()=>props()})
 vi.stubGlobal('fetch',spy)
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 const s=await screen.findByRole('group',{name:'V81 太乙时计原典内部冲突与值使候选位置'})
 expect(s.textContent).toContain('同一本书内部核对')
 expect(s.textContent).toContain('加数为32')
 expect(s.textContent).toContain('正文却写33')
 expect(s.textContent).toContain('尚无这张时计庚戌原例的独立完整落门图')
 expect(s.textContent).toContain('生门')
 expect(s.textContent).toContain('巳·大神')
 expect(s.textContent).toContain('不能强行挪为某一九宫正宫')
 expect(within(s).getAllByRole('link')).toHaveLength(2)
 expect(within(s).getAllByRole('link')[0].getAttribute('href')).toBe(source)
 expect(spy.mock.calls[0][0]).toBe('/api/taiyi/hour/cast')
})
it('V81 source critique lets the user inspect 16 actual spirit marks and no invented plus one',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>props()}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 const s=await screen.findByRole('group',{name:'V81 太乙时计原典内部冲突与值使候选位置'})
 fireEvent.click(within(s).getByText('展开 V81 十六神直使候选标记与定算文字审查'))
 const marks=within(s).getByRole('group',{name:'V81 直使候选十六神位置'})
 expect(marks.querySelectorAll('span')).toHaveLength(16)
 expect(marks.textContent).toContain('巳·大神 [候选生门]')
 expect(s.textContent).toContain('1＋2＋7＋6＋1＋8＋3＋4＝32')
 expect(s.textContent).toContain('但不是庚戌时的独立异本')
 expect(s.textContent).toContain('同宫特殊取算仍未决')
 expect(s.textContent).toContain('客方 巽·大炅')
 expect(s.textContent).not.toContain('定大将 3宫')
})
it('V81 candidate on canonical main palace remains only a candidate, not the eight-door board',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>props('computed')}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 const s=await screen.findByRole('group',{name:'V81 太乙时计原典内部冲突与值使候选位置'})
 expect(s.textContent).toContain('本身是八正宫')
 expect(s.textContent).toContain('所有八门已飞布')
 expect(s.textContent).not.toContain('正文却写33')
})
it('V81 optional audit does not invent values for legacy V80 responses',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>base}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 expect(await screen.findByRole('region',{name:'V77 太乙时计八宫与计神结果'})).toBeTruthy()
 expect(screen.queryByRole('group',{name:'V81 太乙时计原典内部冲突与值使候选位置'})).toBeNull()
})
