// @vitest-environment jsdom
import React from 'react'
import {afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup} from '@testing-library/react'
import KnowledgeStage from '../src/KnowledgeStage.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})

const mountains='子癸丑艮寅甲卯乙辰巽巳丙午丁未坤申庚酉辛戌乾亥壬'.split('')
const mountainTable=mountains.map((mountain,i)=>({
  mountain,center_degrees:i*15,start_degrees:(i*15+352.5)%360,
  end_degrees:(i*15+7.5)%360,
  trigram:i===0?'坎':'艮',palace_number:i===0?1:8,
  direction:i===0?'北':'东北',element:i===0?'水':'土',
  opposite_mountain:mountains[(i+12)%24]
}))
const board=[
  ['巽',4,'东南'],['离',9,'南'],['坤',2,'西南'],
  ['震',3,'东'],['中',5,'中央'],['兑',7,'西'],
  ['艮',8,'东北'],['坎',1,'北'],['乾',6,'西北'],
].map(([trigram,number,direction])=>({
  trigram,number,direction,element:'土',mountains:trigram==='坎'?['壬','子','癸']:[],
  is_center:trigram==='中',is_sitting:trigram==='离',is_facing:trigram==='坎',
}))
const fixture={
 version:'V70',axis_label:'坐午向子',true_bearing_degrees:0,
 input:{bearing_degrees:0,bearing_role:'facing',north_reference:'true_north',
       magnetic_declination_degrees:null},
 sitting:{degrees:180,mountain:'午',trigram:'离',palace_number:9,direction:'南',element:'火'},
 facing:{degrees:0,mountain:'子',trigram:'坎',palace_number:1,direction:'北',element:'水'},
 near_boundary:false,nine_palaces:board,twenty_four_mountains:mountainTable,
 compass_convention:{mountain_intervals:'每山15°，左闭右开',
   magnetic_declination:'真北角=磁北角+东偏正西偏负'},
 warnings:['未实现实地坐向测量'],not_implemented:['玄空飞星'],
 sources:{mountain_chart:'https://www.yuanka.com.cn/tools/luopan'},
}

it('V70 real eighth-art entrance posts compass angle and shows 9 palaces and 24 mountains',async()=>{
  const spy=vi.fn().mockResolvedValue({ok:true,json:async()=>fixture})
  vi.stubGlobal('fetch',spy)
  render(<KnowledgeStage mode="fengshui" onBack={()=>{}} onStudy={()=>{}}/>)
  expect(screen.getByRole('button',{name:'计算二十四山坐向'})).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:'计算二十四山坐向'}))
  expect(await screen.findByText('坐午向子')).toBeTruthy()
  expect(spy).toHaveBeenCalledTimes(1)
  expect(spy.mock.calls[0][0]).toBe('/api/fengshui/cast')
  expect(JSON.parse(spy.mock.calls[0][1].body)).toEqual({
    bearing_degrees:0,bearing_role:'facing',north_reference:'true_north'})
  const palaces=screen.getByRole('group',{name:'V70 堪舆后天九宫'})
  expect(within(palaces).getAllByText(/宫/).length).toBeGreaterThanOrEqual(9)
  const ring=screen.getByRole('group',{name:'V70 二十四山逐山核对'})
  expect(within(ring).getAllByRole('button')).toHaveLength(24)
  expect(screen.queryByText('这门古术，先从读懂它开始。')).toBeNull()
  fireEvent.click(within(ring).getByRole('button',{name:/癸/}))
  expect(screen.getByRole('region',{name:'当前选中二十四山'}).textContent)
    .toContain('中心 15°')
})

it('V70 magnetic option sends user-provided declination and changed input role',async()=>{
  const spy=vi.fn().mockResolvedValue({ok:true,json:async()=>fixture})
  vi.stubGlobal('fetch',spy)
  render(<KnowledgeStage mode="fengshui" onBack={()=>{}} onStudy={()=>{}}/>)
  fireEvent.change(screen.getByLabelText('堪舆方位角'),{target:{value:'350'}})
  fireEvent.change(screen.getByLabelText('堪舆输入坐向'),{target:{value:'sitting'}})
  fireEvent.change(screen.getByLabelText('堪舆北向基准'),{target:{value:'magnetic_north'}})
  fireEvent.change(screen.getByLabelText('堪舆磁偏角'),{target:{value:'-6'}})
  fireEvent.click(screen.getByRole('button',{name:'计算二十四山坐向'}))
  expect(await screen.findByText('坐午向子')).toBeTruthy()
  expect(JSON.parse(spy.mock.calls[0][1].body)).toEqual({
    bearing_degrees:350,bearing_role:'sitting',north_reference:'magnetic_north',
    magnetic_declination_degrees:-6})
})

it('V70 boundary is visibly cautionary not falsely certain',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({
    ...fixture,near_boundary:true,warnings:['分界需要复测']
  })}))
  render(<KnowledgeStage mode="fengshui" onBack={()=>{}} onStudy={()=>{}}/>)
  fireEvent.click(screen.getByRole('button',{name:'计算二十四山坐向'}))
  const warning=await screen.findByRole('status')
  expect(warning.textContent).toContain('临近二十四山界')
  expect(warning.textContent).toContain('复测')
})

it('V70 API errors do not render imaginary mountains or nine palaces',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({
    ok:false,json:async()=>({detail:'磁偏角未核验，拒绝计算'})}))
  render(<KnowledgeStage mode="fengshui" onBack={()=>{}} onStudy={()=>{}}/>)
  fireEvent.click(screen.getByRole('button',{name:'计算二十四山坐向'}))
  expect((await screen.findByRole('alert')).textContent).toContain('拒绝计算')
  expect(screen.queryByRole('group',{name:'V70 堪舆后天九宫'})).toBeNull()
})

it('V70 input switching does not retain stale chart',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>fixture}))
  render(<KnowledgeStage mode="fengshui" onBack={()=>{}} onStudy={()=>{}}/>)
  fireEvent.click(screen.getByRole('button',{name:'计算二十四山坐向'}))
  expect(await screen.findByRole('group',{name:'V70 堪舆后天九宫'})).toBeTruthy()
  fireEvent.change(screen.getByLabelText('堪舆北向基准'),
    {target:{value:'magnetic_north'}})
  expect(screen.queryByRole('group',{name:'V70 堪舆后天九宫'})).toBeNull()
  expect(screen.getByLabelText('堪舆磁偏角')).toBeTruthy()
})
