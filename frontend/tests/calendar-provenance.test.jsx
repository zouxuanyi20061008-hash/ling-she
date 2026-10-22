// @vitest-environment jsdom
import React from 'react'
import {beforeEach,afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react'
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

it('六爻历法被采纳才提交日期来源；手动编辑即取消旧来源',async()=>{
  const chart=makeChart()
  const converted={
    input:{calendar_type:'solar',date:'2026-02-17',clock:'12:00',day_boundary:'midnight'},
    day_ganzhi:'甲子',month_branch:'寅',month_ganzhi:'庚寅',
    solar_date:'2026-02-17',lunar:{display:'2026年1月1日'},
    previous_jie:{name:'立春',beijing_time:'2026-02-04T04:00:00+08:00'},
    next_jie:{name:'惊蛰',beijing_time:'2026-03-05T22:00:00+08:00'},
    warnings:[],notice:'历法预览'
  }
  globalThis.fetch.mockImplementation(url=>Promise.resolve({
    ok:true,json:async()=>url.endsWith('/api/liuyao/calendar-preview')?converted:chart
  }))
  render(<SixYaoStage onBack={()=>{}} onStudy={()=>{}} apiConfig={config}/>)
  (()=>{for(let n=0;n<6;n++)fireEvent.click(screen.getAllByRole('button',{name:/7.*少阳/})[0])})()
  await waitFor(()=>expect(studio('贰 · 研判台').getAttribute('aria-current')).toBe('page'))
  fireEvent.change(screen.getByLabelText('公历年月日'),{target:{value:'2026-02-17'}})
  fireEvent.click(screen.getByRole('button',{name:'换算日期与节令'}))
  await waitFor(()=>expect(screen.getByRole('button',{name:/确认采用这组日干支与月建/})).toBeTruthy())
  const castCalls=()=>globalThis.fetch.mock.calls.filter(c=>c[0].endsWith('/api/liuyao/cast'))
  expect(JSON.parse(castCalls()[0][1].body).calendar_input).toBeNull()
  fireEvent.click(screen.getByRole('button',{name:/确认采用这组日干支与月建/}))
  await waitFor(()=>expect(castCalls().length).toBe(2))
  expect(JSON.parse(castCalls()[1][1].body).calendar_input).toEqual(converted.input)
  fireEvent.click(screen.getByText(/不使用自动换算？手动填写日干支与月建/))
  fireEvent.change(screen.getByLabelText('日辰 · 六十甲子'),{target:{value:'乙丑'}})
  await waitFor(()=>expect(castCalls().length).toBe(3))
  expect(JSON.parse(castCalls()[2][1].body).calendar_input).toBeNull()
})

