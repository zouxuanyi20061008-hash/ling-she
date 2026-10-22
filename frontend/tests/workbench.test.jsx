// @vitest-environment jsdom
// 万象书院 V20：实际渲染和点击测试，保护布局升级时的六爻排盘状态。
// 只 mock 网络响应，不修改摇钱、历法或纳甲算法。
import React from 'react'
import {beforeEach,afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,waitFor,cleanup,act} from '@testing-library/react'
import SixYaoStage from '../src/SixYaoStage.jsx'

const makeHex=()=>({
  full_name:'乾为天',
  lines_bottom_to_top:[1,1,1,1,1,1],
  keywords:'刚健',
  meaning:'以刚健之象作研习参照'
})
const makeChart=()=>({
  ben_gua:makeHex(),bian_gua:makeHex(),dong_yao:[],
  calendar:{day:null,month:null},
  review_flow:{
    stages:[
      {id:'calendar',summary:'日月尚未确认',action:'可以输入公历或农历',status:'pending'},
      {id:'focus',summary:'选择关注对象',action:'由用户选择',status:'pending'},
      {id:'relations',summary:'研习生克',action:'查看计算来源',status:'review'},
      {id:'conflicts',summary:'研习空破',action:'分别核对',status:'review'},
      {id:'report',summary:'整理笔记',action:'逐项留存',status:'review'}
    ],
    workflow_note:'不自动断吉凶'
  }
})
const config={personalApiKey:'',aiAccessCode:'',aiModel:'deepseek-chat'}
const castButtons=()=>screen.getAllByRole('button',{name:/7.*少阳/})
const studio=label=>screen.getByRole('button',{name:new RegExp(label)})

function enterSixManual(){
  for(let i=0;i<6;i++)fireEvent.click(castButtons()[0])
}
beforeEach(()=>{
  vi.stubGlobal('scrollTo',vi.fn())
  vi.stubGlobal('requestAnimationFrame',cb=>{cb();return 1})
  HTMLElement.prototype.scrollIntoView=vi.fn()
  vi.stubGlobal('fetch',vi.fn())
})
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks()})

it('六爻未齐时研判台不可进入；起卦阶段保留手输爻位',()=>{
  render(<SixYaoStage onBack={()=>{}} onStudy={()=>{}} apiConfig={config}/>)
  expect(studio('壹 · 起卦台').getAttribute('aria-current')).toBe('page')
  expect(studio('贰 · 研判台').disabled).toBe(true)
  for(let i=0;i<5;i++)fireEvent.click(castButtons()[0])
  expect(screen.getByText('5/6')).toBeTruthy()
  expect(studio('贰 · 研判台').disabled).toBe(true)
  expect(globalThis.fetch).not.toHaveBeenCalled()
})

it('只有 API 真正成功才切到研判台；先显示排盘中而不是空白页面',async()=>{
  let finish
  globalThis.fetch.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve}))
  render(<SixYaoStage onBack={()=>{}} onStudy={()=>{}} apiConfig={config}/>)
  enterSixManual()
  expect(screen.getByText(/正在排盘。原始爻数已保留/)).toBeTruthy()
  expect(studio('贰 · 研判台').disabled).toBe(true)
  const payload=JSON.parse(globalThis.fetch.mock.calls[0][1].body)
  expect(payload.numbers).toEqual([7,7,7,7,7,7])
  await act(async()=>finish({ok:true,json:async()=>makeChart()}))
  await waitFor(()=>expect(studio('贰 · 研判台').getAttribute('aria-current')).toBe('page'))
  expect(screen.getByText('中国历法 · 农历 / 公历换算')).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:'农历（阴历）'}))
  expect(screen.getByText('农历年份')).toBeTruthy()
  fireEvent.click(studio('壹 · 起卦台'))
  expect(screen.getByText(/卦已成 · 前往研判台/)).toBeTruthy()
  fireEvent.click(studio('贰 · 研判台'))
  expect(screen.getByText('中国历法 · 农历 / 公历换算')).toBeTruthy()
  expect(globalThis.fetch).toHaveBeenCalledTimes(1)
})

it('排盘网络失败保留六爻，显示原因并允许按原爻重试',async()=>{
  globalThis.fetch.mockResolvedValueOnce({ok:false,json:async()=>({detail:'网络暂不可用'})})
  .mockResolvedValueOnce({ok:true,json:async()=>makeChart()})
  render(<SixYaoStage onBack={()=>{}} onStudy={()=>{}} apiConfig={config}/>)
  enterSixManual()
  await waitFor(()=>expect(screen.getByText('网络暂不可用')).toBeTruthy())
  expect(studio('壹 · 起卦台').getAttribute('aria-current')).toBe('page')
  expect(studio('贰 · 研判台').disabled).toBe(true)
  fireEvent.click(screen.getByRole('button',{name:/保留这六爻 · 重新排盘/}))
  await waitFor(()=>expect(studio('贰 · 研判台').getAttribute('aria-current')).toBe('page'))
  const both=globalThis.fetch.mock.calls.map(x=>JSON.parse(x[1].body).numbers)
  expect(both).toEqual([[7,7,7,7,7,7],[7,7,7,7,7,7]])
})

it('失败状态下重新起卦会复位录爻数与操作按钮',async()=>{
  globalThis.fetch.mockRejectedValueOnce(new Error('连接已中断'))
  render(<SixYaoStage onBack={()=>{}} onStudy={()=>{}} apiConfig={config}/>)
  enterSixManual()
  await waitFor(()=>expect(screen.getByText('连接已中断')).toBeTruthy())
  fireEvent.click(screen.getByRole('button',{name:/重新起卦/}))
  expect(screen.getByText('0/6')).toBeTruthy()
  expect(studio('贰 · 研判台').disabled).toBe(true)
  expect(castButtons()[0].disabled).toBe(false)
})
