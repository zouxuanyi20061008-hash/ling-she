// @vitest-environment jsdom
import React from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import App from '../src/App.jsx'

const config={personalApiKey:'',aiAccessCode:'',aiModel:'deepseek-chat'}
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
