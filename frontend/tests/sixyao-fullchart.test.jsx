// @vitest-environment jsdom
import React from 'react'
import {afterEach,beforeEach,it,expect,vi} from 'vitest'
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import SixYaoStage from '../src/SixYaoStage.jsx'
import SixYaoFullChart from '../src/SixYaoFullChart.jsx'

const GUA={full_name:'乾为天',name:'乾',lines_bottom_to_top:[1,1,1,1,1,1],keywords:'健行',meaning:'仅作传统象义参考'}
const CHANGED={full_name:'天风姤',name:'姤',lines_bottom_to_top:[0,1,1,1,1,1],keywords:'相遇',meaning:'传统卦象'}
function chart(){
  const row=i=>({
    position:i+1,liushen:['青龙','朱雀','勾陈','螣蛇','白虎','玄武'][i],
    liuqin:['子孙','妻财','父母','官鬼','兄弟','父母'][i],
    ganzhi:['甲子','甲寅','甲辰','壬午','壬申','壬戌'][i],
    element:['水','木','土','火','金','土'][i],
    role:i===5?'世':i===2?'应':'',moving:i===0,
    is_xunkong:i===5,is_yuechong:i===0,is_yuejian:i===3,
    month_relation:i===0?'月冲爻':'月爻同五行'
  })
  const lines=Array.from({length:6},(_,i)=>({position:i+1,number:i===0?9:7}))
  return {
    ben_gua:GUA,bian_gua:CHANGED,dong_yao:[1],lines,
    najia_lines:Array.from({length:6},(_,i)=>row(i)),
    bian_najia_lines:Array.from({length:6},(_,i)=>({...row(i),ganzhi:i===0?'辛丑':row(i).ganzhi})),
    eight_palaces:{ben:{palace:'乾',stage:'本宫',palace_element:'金',shi_position:6,ying_position:3}},
    calendar:{day:{ganzhi:'甲子',xunkong:['戌','亥']},month:{branch:'午'}},
    review_flow:{
      stages:[
        {id:'calendar',summary:'核日月',action:'核实日辰',status:'review'},
        {id:'focus',summary:'因事取用',action:'选用神',status:'review'},
        {id:'relations',summary:'辨生克',action:'看五行',status:'review'},
        {id:'conflicts',summary:'参空破',action:'核对',status:'review'},
        {id:'report',summary:'成研究案',action:'记录',status:'review'}
      ],workflow_note:'逐项核对'
    }
  }
}
const config={personalApiKey:'',aiAccessCode:'',aiModel:'deepseek-chat'}
beforeEach(()=>{
  vi.stubGlobal('scrollTo',vi.fn())
  vi.stubGlobal('requestAnimationFrame',fn=>{fn();return 1})
  HTMLElement.prototype.scrollIntoView=vi.fn()
})
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()})

it('完整六爻盘一屏按上至下列出六亲、六神、世应、纳甲及变爻，不给出未计算的最终吉凶',()=>{
  render(<SixYaoFullChart chart={chart()}/>)
  expect(screen.getByRole('region',{name:/六爻纳甲全表/})).toBeTruthy()
  expect(screen.getByText('乾宫 · 本宫')).toBeTruthy()
  expect(screen.queryByText('上爻 / 二爻')).toBeNull() // palace 应为三爻
  expect(screen.getByText('上爻 / 三爻')).toBeTruthy()
  expect(screen.getByText('青龙')).toBeTruthy()
  expect(screen.getByText(/旬空 ·/)).toBeTruthy()
  expect(screen.getByText(/临月建 ·/)).toBeTruthy()
  expect(screen.getByText(/本位动变/)).toBeTruthy()
  const rows=screen.getAllByRole('row')
  expect(rows).toHaveLength(7)
  expect(rows[1].textContent).toContain('上爻')
  expect(rows[6].textContent).toContain('初爻')
  expect(screen.getByText(/用神取舍、旺衰及应期判断/)).toBeTruthy()
})

it('未核日辰与月建时不凭空产生六神、旬空或月冲信息',()=>{
  const sample=chart()
  sample.calendar={day:null,month:null}
  sample.najia_lines=sample.najia_lines.map(row=>({
    ...row,liushen:null,is_xunkong:null,is_yuechong:null,is_yuejian:null,month_relation:null
  }))
  render(<SixYaoFullChart chart={sample}/>)
  expect(screen.getAllByText('日辰未核')).toHaveLength(6)
  expect(screen.getAllByText('待核日辰与月建')).toHaveLength(6)
  expect(screen.getByText('须先核实日辰')).toBeTruthy()
})

it('起卦核验记录显示真实铜钱/手动来源与六次顺序，不混称自动断卦',()=>{
  const sample=chart()
  sample.core_chart={
    schema_version:'liuyao-core/1.0',
    casting_record:{recorded_coins:1,manual_entries:5,unknown_sources:0,throws:[
      {position:1,number:9,faces:[3,3,3],source:'three_coins'},
      ...Array.from({length:5},(_,i)=>({position:i+2,number:7,faces:null,source:'manual_number'}))
    ]}
  }
  render(<SixYaoFullChart chart={sample}/>)
  const receipt=screen.getByRole('region',{name:'六爻起卦记录核验'})
  expect(receipt.textContent).toContain('三钱原始记录 1 爻')
  expect(receipt.textContent).toContain('手动爻数 5 爻')
  fireEvent.click(screen.getByText('核对六次起卦原始记录'))
  expect(receipt.textContent).toContain('背 · 背 · 背')
  expect(receipt.textContent).toContain('手动输入')
})

it('六爻台完整六掷后立即显示装卦总览，撤回一爻后可重新排盘不改变其他五爻',async()=>{
  const castChart=chart()
  const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>castChart})
  vi.stubGlobal('fetch',fetchMock)
  render(<SixYaoStage onBack={()=>{}} onStudy={()=>{}} onLearn={()=>{}} apiConfig={config}/>)
  const addSeven=()=>screen.getByRole('button',{name:/7.*少阳/})
  for(let i=0;i<6;i++)fireEvent.click(addSeven())
  await waitFor(()=>expect(screen.getByText('本卦、之卦与六亲纳甲总览')).toBeTruthy())
  const first=JSON.parse(fetchMock.mock.calls[0][1].body)
  expect(first.numbers).toEqual([7,7,7,7,7,7])
  expect(first.coin_tosses).toEqual([null,null,null,null,null,null])
  fireEvent.click(screen.getByRole('button',{name:/壹 · 起卦台/}))
  fireEvent.click(screen.getByRole('button',{name:/撤回最后一爻/}))
  expect(screen.getByText('5/6')).toBeTruthy()
  expect(screen.queryByText('本卦、之卦与六亲纳甲总览')).toBeNull()
  fireEvent.click(screen.getByRole('button',{name:/9.*老阳/}))
  await waitFor(()=>expect(fetchMock).toHaveBeenCalledTimes(2))
  const second=JSON.parse(fetchMock.mock.calls[1][1].body)
  expect(second.numbers).toEqual([7,7,7,7,7,9])
  expect(second.coin_tosses).toEqual([null,null,null,null,null,null])
})
