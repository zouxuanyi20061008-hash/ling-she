// @vitest-environment jsdom
import React from 'react'
import {beforeEach,afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,cleanup,act,within} from '@testing-library/react'
import SixYaoStage from '../src/SixYaoStage.jsx'
const config={personalApiKey:'',aiAccessCode:'',aiModel:'deepseek-chat'}
const makeChart=()=>({
  ben_gua:{full_name:'乾为天',lines_bottom_to_top:[1,1,1,1,1,1],keywords:'刚健',meaning:'刚健'},
  bian_gua:{full_name:'乾为天',lines_bottom_to_top:[1,1,1,1,1,1],keywords:'刚健',meaning:'刚健'},
  dong_yao:[],calendar:{day:null,month:null},
  review_flow:{stages:[{id:'calendar',summary:'核对日月',action:'请核对',status:'review'},
    {id:'focus',summary:'因事取用',action:'请核对',status:'review'},
    {id:'relations',summary:'辨生克',action:'请核对',status:'review'},
    {id:'conflicts',summary:'参空破',action:'请核对',status:'review'},
    {id:'report',summary:'整理研究',action:'请核对',status:'review'}]}
})
beforeEach(()=>{
  vi.stubGlobal('scrollTo',vi.fn())
  vi.stubGlobal('requestAnimationFrame',cb=>{cb();return 1})
  HTMLElement.prototype.scrollIntoView=vi.fn()
  vi.stubGlobal('fetch',vi.fn())
})
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks()})

function makePreview(date='2026-02-17'){
  return {
    input:{calendar_type:'solar',date,clock:'12:00',day_boundary:'midnight'},
    day_ganzhi:'甲子',month_branch:'寅',month_ganzhi:'庚寅',
    solar_date:date,lunar:{display:'2026年1月1日'},
    previous_jie:{name:'立春',beijing_time:'2026-02-04T04:00:00+08:00'},
    next_jie:{name:'惊蛰',beijing_time:'2026-03-05T22:00:00+08:00'},
    warnings:[],notice:'历法预览'
  }
}

async function openCalendar(){
  render(<SixYaoStage apiConfig={config}/>)
  const addSeven=screen.getByRole('button',{name:/7.*少阳/})
  for(let n=0;n<5;n++)fireEvent.click(addSeven)
  await act(async()=>{fireEvent.click(addSeven)})
  return within(screen.getByRole('region',{name:'中国公历农历换算和节令月建'}))
}

it('六爻历法被采纳才提交日期来源；手动编辑即取消旧来源',async()=>{
  const chart=makeChart()
  const converted=makePreview()
  globalThis.fetch.mockImplementation(url=>Promise.resolve({
    ok:true,json:async()=>url.endsWith('/api/liuyao/calendar-preview')?converted:chart
  }))
  const calendar=await openCalendar()
  fireEvent.change(calendar.getByLabelText('公历年月日'),{target:{value:'2026-02-17'}})
  await act(async()=>{fireEvent.click(calendar.getByRole('button',{name:'换算日期与节令'}))})
  const castCalls=()=>globalThis.fetch.mock.calls.filter(c=>c[0].endsWith('/api/liuyao/cast'))
  expect(JSON.parse(castCalls()[0][1].body).calendar_input).toBeNull()
  await act(async()=>{fireEvent.click(calendar.getByRole('button',{name:/确认采用这组日干支与月建/}))})
  expect(castCalls()).toHaveLength(2)
  expect(JSON.parse(castCalls()[1][1].body).calendar_input).toEqual(converted.input)
  fireEvent.click(screen.getByText(/不使用自动换算？手动填写日干支与月建/))
  await act(async()=>{fireEvent.change(screen.getByLabelText('日辰 · 六十甲子'),{target:{value:'乙丑'}})})
  expect(castCalls()).toHaveLength(3)
  expect(JSON.parse(castCalls()[2][1].body).calendar_input).toBeNull()
},30000)

it('换算中改日期能直接重试，旧的历法预览不会盖住当前输入',async()=>{
  let finishOld,finishNew
  globalThis.fetch
    .mockResolvedValueOnce({ok:true,json:async()=>makeChart()})
    .mockImplementationOnce(()=>new Promise(resolve=>{finishOld=resolve}))
    .mockImplementationOnce(()=>new Promise(resolve=>{finishNew=resolve}))
  const calendar=await openCalendar()
  const date=calendar.getByLabelText('公历年月日')
  const convert=()=>calendar.getByRole('button',{name:'换算日期与节令'})
  fireEvent.change(date,{target:{value:'2026-02-17'}})
  fireEvent.click(convert())
  expect(calendar.getByRole('button',{name:'正在换算…'}).disabled).toBe(true)

  fireEvent.change(date,{target:{value:'2026-02-18'}})
  expect(convert().disabled).toBe(false)
  fireEvent.click(convert())
  await act(async()=>{finishOld({ok:true,json:async()=>makePreview()})})
  expect(calendar.getByRole('button',{name:'正在换算…'}).disabled).toBe(true)
  expect(calendar.queryByRole('button',{name:/确认采用这组日干支与月建/})).toBeNull()

  await act(async()=>{finishNew({ok:true,json:async()=>makePreview('2026-02-18')})})
  expect(calendar.getByText('2026-02-18',{exact:true})).toBeTruthy()
  expect(convert().disabled).toBe(false)
},30000)

