// @vitest-environment jsdom
import React from 'react'
import {afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup} from '@testing-library/react'
import KnowledgeStage from '../src/KnowledgeStage.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
const names=['巽','离','坤','震','中','兑','艮','坎','乾']
const numbers=[4,9,2,3,5,7,8,1,6]
const base=[7,3,5,6,8,1,2,4,9]
const mountain=[3,8,1,2,4,6,7,9,5]
const facing=[4,8,6,5,3,1,9,7,2]
const stars=names.map((name,i)=>({number:numbers[i],trigram:name,
  period_star:base[i],mountain_star:mountain[i],facing_star:facing[i]}))
const palaces=names.map((name,i)=>({
 number:numbers[i],trigram:name,direction:'方向',
 mountains:name==='中'?[]:['山'],
 is_center:name==='中',is_sitting:name==='坎',is_facing:name==='离',
 flying_stars:{period_star:base[i],mountain_star:mountain[i],facing_star:facing[i]}
}))
const mountains='子癸丑艮寅甲卯乙辰巽巳丙午丁未坤申庚酉辛戌乾亥壬'.split('')
const fixture={
 version:'V71',axis_label:'坐子向午',
 input:{bearing_degrees:180,bearing_role:'facing',north_reference:'true_north'},
 sitting:{mountain:'子',degrees:0,trigram:'坎',palace_number:1,direction:'北',element:'水'},
 facing:{mountain:'午',degrees:180,trigram:'离',palace_number:9,direction:'南',element:'火'},
 true_bearing_degrees:180,near_boundary:false,
 nine_palaces:palaces,twenty_four_mountains:mountains.map((mountain,i)=>({
  mountain,center_degrees:i*15,start_degrees:(i*15+352.5)%360,
  end_degrees:(i*15+7.5)%360,opposite_mountain:mountains[(i+12)%24],
  trigram:'坎',palace_number:1,direction:'北',element:'水'
 })),
 period:{yuan:'下元',label:'8运',star_name:'八白左辅',start_year:2004,end_year_inclusive:2023,
  foundation_beijing:'2019-06-01T12:00:00+08:00',
  effective_lichun_for_input_year:'2019-02-04T11:14:00+08:00',
  near_lichun_boundary:false},
 flying_status:'computed_regular_lower_chart',
 flying_stars:{period_star:8,flight_path:[5,6,7,8,9,1,2,3,4],
   mountain_trace:{seed:4,direction:'顺飞',home_trigram:'巽',yuan_long:'天元龙',
     home_same_yuan_mountain:'巽',home_yinyang:'阳',borrowed_five:false},
   facing_trace:{seed:3,direction:'逆飞',home_trigram:'震',yuan_long:'天元龙',
     home_same_yuan_mountain:'卯',home_yinyang:'阴',borrowed_five:false},
   rules:{period:'运星入中顺飞',limit:'正向下卦，不含兼向替卦'},
   palaces:stars},
 compass_convention:{mountain_intervals:'24山各15度',magnetic_declination:'真北角=磁北角+偏角'},
 warnings:[],not_implemented:['替卦'],
 sources:{mountain_chart:'https://www.yuanka.com.cn/tools/luopan',
   period_and_lower_chart:{independent_period8_zi_wu:'https://research.xishe.ai/flying-stars'}}
}
it('V71 requests supplied foundation Lichun date and renders nine 3-layer cells',async()=>{
 const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>fixture})
 vi.stubGlobal('fetch',fetcher)
 render(<KnowledgeStage mode="fengshui" onBack={()=>{}} onStudy={()=>{}}/>)
 fireEvent.click(screen.getByLabelText('启用 V71 玄空三盘'))
 fireEvent.change(screen.getByLabelText('堪舆方位角'),{target:{value:'180'}})
 fireEvent.change(screen.getByLabelText('堪舆立极公历日期'),{target:{value:'2019-06-01'}})
 fireEvent.change(screen.getByLabelText('堪舆立极北京时间'),{target:{value:'12:00'}})
 fireEvent.click(screen.getByRole('button',{name:'计算玄空三盘'}))
 expect(await screen.findByRole('region',{name:'V71 三元九运结果'})).toBeTruthy()
 expect(fetcher).toHaveBeenCalledTimes(1)
 expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({
   bearing_degrees:180,bearing_role:'facing',north_reference:'true_north',
   foundation_date:'2019-06-01',foundation_clock:'12:00'})
 const board=screen.getByRole('group',{name:'V70 堪舆后天九宫'})
 expect(within(board).getAllByRole('article')).toHaveLength(9)
 const south=within(board).getByLabelText('离9宫玄空三盘')
 expect(south.textContent).toContain('运 3')
 expect(south.textContent).toContain('山 8')
 expect(south.textContent).toContain('向 8')
 expect(screen.getByRole('region',{name:'V71 玄空飞星逐步溯源'}).textContent).toContain('巽')
})

it('V71 does not forge a plate when boundary or substitute star rule is unknown',async()=>{
 const blocked={...fixture,flying_stars:null,flying_status:'blocked_replacement_chart_uncertain',
  nine_palaces:palaces.map(({flying_stars,...row})=>row)}
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>blocked}))
 render(<KnowledgeStage mode="fengshui" onBack={()=>{}} onStudy={()=>{}}/>)
 fireEvent.click(screen.getByLabelText('启用 V71 玄空三盘'))
 fireEvent.click(screen.getByRole('button',{name:'计算玄空三盘'}))
 expect((await screen.findByRole('status')).textContent).toContain('替卦')
 expect(screen.queryByRole('region',{name:'V71 玄空飞星逐步溯源'})).toBeNull()
 expect(screen.queryByLabelText('离9宫玄空三盘')).toBeNull()
})

it('V71 user can opt out and ordinary V70 request remains unchanged',async()=>{
 const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>fixture})
 vi.stubGlobal('fetch',fetcher)
 render(<KnowledgeStage mode="fengshui" onBack={()=>{}} onStudy={()=>{}}/>)
 expect(screen.queryByLabelText('堪舆立极公历日期')).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'计算二十四山坐向'}))
 expect(await screen.findByRole('region',{name:'V71 三元九运结果'})).toBeTruthy()
 expect(JSON.parse(fetcher.mock.calls[0][1].body).foundation_date).toBeUndefined()
 fireEvent.click(screen.getByLabelText('启用 V71 玄空三盘'))
 expect(screen.queryByRole('region',{name:'V71 三元九运结果'})).toBeNull()
 expect(screen.getByLabelText('堪舆立极公历日期')).toBeTruthy()
})
