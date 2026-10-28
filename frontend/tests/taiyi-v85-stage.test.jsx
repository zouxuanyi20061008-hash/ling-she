// @vitest-environment jsdom
import React from 'react'
import {it,afterEach,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup} from '@testing-library/react'
import TaiyiV77Hour from '../src/TaiyiV77Hour.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})

const source='https://zh.wikisource.org/zh-hans/太乙金鏡式經_(四庫全書本)/卷01'
const trig={9:'巽',2:'离',7:'坤',4:'震',5:'中',6:'兑',3:'艮',8:'坎',1:'乾'}
const base={
 version:'V77',
 input:{solar_date:'2026-06-22',clock:'09:30:00',hour_branch:'巳'},
 solstice:{name:'夏至',started_at_beijing:'2026-06-21T16:20:00+08:00',near_15_minutes:false},
 time_cycle:{dun:'阴遁',relative_time_count:9,relative_count_in_24:9,hours_in_current_palace:3},
 taiyi_palace:{number:7,trigram:'坤'},
 jishen:{branch:'午',direction:'逆行十二支',movement:'一时一移'},
 nine_palaces:[9,2,7,4,5,6,3,8,1].map(number=>({
   number,trigram:trig[number],is_taiyi:number===7,is_middle_unvisited:number===5
 })),
 sources:{zhou:'https://zh.wikisource.org/zh/太乙金鏡式經',
   hour_example:'https://www.shidianguji.com/book/NGJ89241199902106666022/chapter/1lq8dkylq3yn8'}
}
const witness={source,actual:{
 taiyi_palace:9,wenchang_god:'大武',shiji_god:'高丛',
 main_count:29,guest_count:4,main_general:9,main_assistant:7,
 guest_general:4,guest_assistant:2
}}
const trace=[{order:1,direction:'坤',god:'大武',added:7},
             {order:2,direction:'申',god:'武德',added:0}]
const phase=(n,first,wen,shiji,pending=false)=>({
 phase:n,hypothetical_ji_numbers:[n,n+3],
 first_eye_in_historical_ji:first,
 wenchang:{direction:'坤',god:wen},
 shiji:{direction:'卯',god:shiji},
 main:pending?{status:'pending',count:null,big_general:null,
               assistant_general:null,trace:[]}:
              {status:'computed',count:29,big_general:9,
               assistant_general:7,trace},
 guest:{status:'computed',count:4,big_general:4,
        assistant_general:2,trace}
})
const historicalOrigins={
 status:'verified_historical_zhangliang_six_ji_starts',
 modern_solstice_ji_phase_verified:false,
 may_be_used_as_modern_qiying_anchor:false,
 rows:[[1,9,'吕申'],[2,4,'大威'],[3,9,'阴德'],
       [4,4,'吕申'],[5,9,'大威'],[6,4,'阴德']]
       .map(([ji_number,taiyi_palace,wenchang_god])=>({
         ji_number,taiyi_palace,wenchang_god,jishen:'申'
       }))
}
const hypothesis={
 version:'V85',historical_three_seeds:['吕申','大威','阴德'],
 historical_ji_origin_witness:historicalOrigins,
 hypotheses:[
   phase(1,'吕申','吕申','武德'),
   phase(2,'大威','大威','地主',true),
   phase(3,'阴德','阴德','高丛')],
 preferred_phase:null,confirmed_qiying_main_general:null
}

it('V85 displays the original Yin 315 29/4 and four generals as historical witness, not modern qiying',async()=>{
 const spy=vi.fn().mockResolvedValue({ok:true,json:async()=>({
  ...base,hour_v85_independent_yin_witness:witness,
  hour_v85_phase_hypotheses:hypothesis
 })})
 vi.stubGlobal('fetch',spy)
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 const area=await screen.findByRole('group',{name:'V85 太乙阴遁315原典真值与气应天目三种纪相位'})
 expect(area.textContent).toContain('第六纪·壬子元27局')
 expect(area.textContent).toContain('315时')
 expect(area.textContent).toContain('主算29')
 expect(area.textContent).toContain('客算4')
 const original=within(area).getByRole('group',{name:'V85 金镜式经阴遁第315时主客将独立真值'})
 expect(original.textContent).toContain('大武')
 expect(original.textContent).toContain('高丛')
 expect(original.textContent).toContain('主大/参：9/7宫')
 expect(original.textContent).toContain('客大/参：4/2宫')
 expect(area.textContent).toContain('现代气应派真实纪首相位尚未判定')
 expect(area.textContent).toContain('不能穷尽任意未知历元偏移')
 expect(within(area).getByRole('link').getAttribute('href')).toBe(source)
 expect(spy.mock.calls[0][0]).toBe('/api/taiyi/hour/cast')
})

it('V85 shows three separate phase cards and still conservatively handles same-palace pending',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({
   ...base,hour_v85_independent_yin_witness:witness,
   hour_v85_phase_hypotheses:hypothesis
 })}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 const area=await screen.findByRole('group',{name:'V85 太乙阴遁315原典真值与气应天目三种纪相位'})
 expect(area.querySelectorAll('.taiyi-v85-phases article')).toHaveLength(3)
 expect(area.textContent).toContain('纪1／4')
 expect(area.textContent).toContain('纪2／5')
 expect(area.textContent).toContain('纪3／6')
 expect(area.textContent).toContain('同宫待判，不编造大将')
 fireEvent.click(within(area).getByText('核对相位1主客逐宫投算轨迹'))
 const detail=within(area).getByRole('group',{name:'V85 相位1主客逐宫投算'})
 expect(detail.textContent).toContain('坤·大武 ＋7')
 fireEvent.click(within(area).getByText('核对相位2主客逐宫投算轨迹'))
 const other=within(area).getByRole('group',{name:'V85 相位2主客逐宫投算'})
 expect(other.textContent).toContain('此方起算目与太乙同宫')
})

it('V85 lists six old-Ji primary-text origins without treating them as actual solstice anchors',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({
  ...base,hour_v85_independent_yin_witness:witness,
  hour_v85_phase_hypotheses:hypothesis
 })}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 const area=await screen.findByRole('group',{name:'V85 太乙阴遁315原典真值与气应天目三种纪相位'})
 fireEvent.click(within(area).getByText(/核对张良旧六纪/))
 const origin=within(area).getByRole('group',{name:'V85 张良旧六纪太乙天目计神独立对照'})
 const entries=origin.querySelectorAll('span')
 expect(entries).toHaveLength(6)
 expect(entries[0].textContent).toContain('太乙9宫')
 expect(entries[1].textContent).toContain('太乙4宫')
 expect(entries[5].textContent).toContain('天目阴德')
 expect(area.textContent).toContain('不得据此指定当代文昌、始击或主客大将')
})

it('V85 legacy V84 hourly API does not invent a Yin315 historical example or phases',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>base}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 expect(await screen.findByRole('region',{name:'V77 太乙时计八宫与计神结果'})).toBeTruthy()
 expect(screen.queryByRole('group',{name:'V85 太乙阴遁315原典真值与气应天目三种纪相位'})).toBeNull()
})
