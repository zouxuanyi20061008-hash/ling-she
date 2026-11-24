// @vitest-environment jsdom
import React from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import App from '../src/App.jsx'
import {getContextualMeihuaReading,getOracleQuestionTopic} from '../src/oracle-question.js'

const config={personalApiKey:'',aiAccessCode:'',aiModel:'deepseek-flash'}
const makeChart=name=>{
  const hex={full_name:name,upper:{name:'乾'},lower:{name:'坤'},lines_bottom_to_top:[0,0,0,1,1,1]}
  return {ben_gua:hex,hu_gua:hex,bian_gua:hex,dong_yao:3,ti_gua:{name:'乾',element:'金'},yong_gua:{name:'坤',element:'土'},sheng_ke:'用生体'}
}
const chartResponse=name=>({ok:true,json:async()=>makeChart(name)})

afterEach(()=>{cleanup();vi.unstubAllGlobals()})

it('改取数后能立即再排，先回来的旧请求不会显示旧盘或结束新请求',async()=>{
  let finishOld,finishNew
  const fetchMock=vi.fn()
    .mockImplementationOnce(()=>new Promise(resolve=>{finishOld=resolve}))
    .mockImplementationOnce(()=>new Promise(resolve=>{finishNew=resolve}))
  vi.stubGlobal('fetch',fetchMock)
  vi.stubGlobal('scrollTo',vi.fn())
  const {container}=render(<App apiConfig={config}/>)
  const [question,value]=container.querySelectorAll('.book-inputs textarea')
  const cast=()=>screen.getByRole('button',{name:'仅排盘',exact:true})
  fireEvent.change(question,{target:{value:'练习核对取数'}})
  fireEvent.change(value,{target:{value:'3,6'}})
  fireEvent.click(cast())
  expect(cast().disabled).toBe(true)

  fireEvent.change(value,{target:{value:'8,8'}})
  expect(cast().disabled).toBe(false)
  fireEvent.click(cast())
  expect(fetchMock.mock.calls.map(([,request])=>JSON.parse(request.body).value)).toEqual(['3,6','8,8'])

  await act(async()=>{finishOld(chartResponse('上一张卦盘'))})
  expect(screen.queryByRole('region',{name:'观卦'})).toBeNull()
  expect(cast().disabled).toBe(true)
  expect(value.value).toBe('8,8')

  await act(async()=>{finishNew(chartResponse('当前卦盘'))})
  expect(screen.getByRole('region',{name:'观卦'})).toBeTruthy()
  expect(screen.getAllByRole('heading',{name:'当前卦盘'})).toHaveLength(3)
  expect(screen.queryByRole('heading',{name:'上一张卦盘'})).toBeNull()
})

it('翻开即读到结合所问的卦意与依据，并能查看对应的周易爻辞',async()=>{
  const chart={
    ...makeChart('火水未济'),
    ben_gua:{...makeChart('火水未济').ben_gua,name:'未济',keywords:'未成·待渡',meaning:'条件尚未齐备，宜辨清未解的阻碍。'},
    hu_gua:{...makeChart('水火既济').hu_gua,keywords:'事成·防变'},
    bian_gua:{...makeChart('火风鼎').bian_gua,meaning:'重整秩序、成就新局，求其稳固。'},
    ti_gua:{name:'离',element:'火'},yong_gua:{name:'坎',element:'水'},sheng_ke:'用克体',
  }
  const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>chart})
  vi.stubGlobal('fetch',fetchMock)
  vi.stubGlobal('scrollTo',vi.fn())
  const {container}=render(<App apiConfig={config}/>)
  const [question,value]=container.querySelectorAll('.book-inputs textarea')
  fireEvent.change(question,{target:{value:'下周面试能不能拿到录用机会？'}})
  fireEvent.change(value,{target:{value:'3,6'}})
  await act(async()=>{fireEvent.click(screen.getByRole('button',{name:'仅排盘',exact:true}))})
  fireEvent.click(screen.getByRole('button',{name:/翻开白话解读/}))
  expect(screen.getByRole('region',{name:'这卦怎么回答你的问题'})).toBeTruthy()
  expect(screen.getByText(/录用或工作进展.*眼下偏受外部条件牵制.*对方的决定和流程/)).toBeTruthy()
  expect(screen.getByText(/坎水克离火.*用克体/)).toBeTruthy()
  expect(screen.getByText(/第 3 爻动成 火风鼎/)).toBeTruthy()
  expect(screen.getByText(/可以问清预计何时回复/)).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:'看完整卦解'}))
  expect(screen.getByRole('heading',{name:'互卦 · 水火既济'})).toBeTruthy()
  expect(await screen.findByText(/未济卦六三：未济，征凶，利涉大川/)).toBeTruthy()
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/cast$/)
})

it.each([
  ['比和','盘里有配合的空间'],
  ['用生体','盘里偏有外部助力'],
  ['体生用','你要先投入时间或精力'],
  ['体克用','你能主动调整'],
  ['用克体','眼下偏受外部条件牵制'],
])('把盘上的体用关系 %s 和所问事项连起来', (relation,hint)=>{
  const topic=getOracleQuestionTopic('这段合作能继续吗？')
  expect(getContextualMeihuaReading(relation,topic)).toContain(topic.subject)
  expect(getContextualMeihuaReading(relation,topic)).toContain(hint)
})

it('排盘后 AI 请求失败时能在解读页看到原因和重试，已经起好的卦可继续查看',async()=>{
  const message='尚未配置 AI：请在藏经阁填写个人 DeepSeek API Key。'
  const fetchMock=vi.fn().mockResolvedValueOnce(chartResponse('火水未济'))
    .mockResolvedValueOnce({ok:false,json:async()=>({detail:message})})
  vi.stubGlobal('fetch',fetchMock)
  vi.stubGlobal('scrollTo',vi.fn())
  const {container}=render(<App apiConfig={config}/>)
  const [question,value]=container.querySelectorAll('.book-inputs textarea')
  fireEvent.change(question,{target:{value:'排盘接口回归测试'}})
  fireEvent.change(value,{target:{value:'3,6'}})
  fireEvent.click(screen.getByRole('button',{name:'排盘 + AI 解读',exact:true}))
  const context=within(await screen.findByRole('dialog',{name:'卦已排好，请补充现实背景'}))
  fireEvent.change(context.getByRole('textbox'),{target:{value:'已收到合约附录，接下来核对条款。'}})
  fireEvent.click(context.getByRole('button',{name:'确认背景，开始解读'}))

  const ai=within(await screen.findByRole('region',{name:'AI 解读'}))
  expect(ai.getByRole('alert').textContent).toBe(message)
  expect(ai.getByRole('button',{name:'结合现实背景 · 深入断事'}).disabled).toBe(false)
  expect(fetchMock.mock.calls.map(([url])=>url)).toEqual(['/api/cast','/api/interpret'])
  expect(JSON.parse(fetchMock.mock.calls[1][1].body).ai_model).toBe('deepseek-flash')
  fireEvent.click(screen.getByRole('button',{name:/再看卦象/}))
  expect(within(screen.getByRole('region',{name:'观卦'})).getAllByRole('heading',{name:'火水未济'})).toHaveLength(3)
})
