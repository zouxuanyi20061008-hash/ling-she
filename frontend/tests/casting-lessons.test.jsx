// @vitest-environment jsdom
import React from 'react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import LearnCastingStage from '../src/LearnCastingStage.jsx'
import {EIGHT_TRIGRAMS,HEXAGRAM_SHORT_NAMES,coinLine,analyzeSixCoins,
  meihuaTwoNumbers,hexagramForLines} from '../src/casting-lessons.js'

afterEach(()=>{cleanup();vi.restoreAllMocks()})
beforeEach(()=>{})

it('八卦卦数、三爻次序、六十四卦表不重复；和书院传统的上下卦约定一致',()=>{
  expect(EIGHT_TRIGRAMS).toHaveLength(8)
  expect(new Set(EIGHT_TRIGRAMS.map(x=>x.lines.join(''))).size).toBe(8)
  expect(HEXAGRAM_SHORT_NAMES).toHaveLength(8)
  HEXAGRAM_SHORT_NAMES.forEach(row=>expect(row).toHaveLength(8))
  expect(new Set(HEXAGRAM_SHORT_NAMES.flat()).size).toBe(64)
  expect(hexagramForLines([0,1,0,1,0,1]).name).toBe('未济')
  expect(hexagramForLines([1,0,1,0,1,0]).name).toBe('既济')
})

it('三枚钱字背演算准确，6和9为动，7和8为静',()=>{
  const examples=[
    [[2,2,2],6,'老阴',false,true,true],
    [[3,2,2],7,'少阳',true,false,true],
    [[3,3,2],8,'少阴',false,false,false],
    [[3,3,3],9,'老阳',true,true,false],
  ]
  for(const [faces,total,label,yang,moving,changedYang] of examples){
    expect(coinLine(faces)).toMatchObject({sum:total,label,yang,moving,changedYang})
  }
  expect(()=>coinLine([2,3])).toThrow()
  expect(()=>coinLine([2,3,4])).toThrow()
})

it('六爻从初爻向上组合，老阴老阳变爻后能得到正确之卦',()=>{
  const partial=analyzeSixCoins([7,8,9])
  expect(partial.complete).toBe(false)
  expect(partial.movingPositions).toEqual([3])
  const full=analyzeSixCoins([7,8,9,6,7,8])
  expect(full.complete).toBe(true)
  expect(full.original.name).toBe('既济')
  expect(full.changed.name).toBe('随')
  expect(full.movingPositions).toEqual([3,4])
  expect(full.original.lines).toEqual([1,0,1,0,1,0])
  expect(full.changed.lines).toEqual([1,0,0,1,1,0])
  expect(()=>analyzeSixCoins([7,6,9,8,7,8,9])).toThrow()
})

it('梅花两数取卦与后端保持相同的8取余、6取余、体用与变爻规则',()=>{
  const one=meihuaTwoNumbers(3,6)
  expect(one.upper.name).toBe('离')
  expect(one.lower.name).toBe('坎')
  expect(one.moving).toBe(3)
  expect(one.original.name).toBe('未济')
  expect(one.changed.name).toBe('鼎')
  expect(one.ti.name).toBe('离')
  expect(one.yong.name).toBe('坎')
  const two=meihuaTwoNumbers(8,8)
  expect(two.upper.name).toBe('坤')
  expect(two.lower.name).toBe('坤')
  expect(two.upperRemainder).toBe(0)
  expect(two.lowerRemainder).toBe(0)
  expect(two.moving).toBe(4)
  expect(two.changed.name).toBe('豫')
  expect(()=>meihuaTwoNumbers(0,5)).toThrow()
  expect(()=>meihuaTwoNumbers(1.2,8)).toThrow()
  expect(()=>meihuaTwoNumbers(999999999,1)).toThrow()
})

it('零基础教学可以选择钱币面、记爻和撤回；不调用网络或伪装正式起卦',()=>{
  const onPractice=vi.fn(),onBack=vi.fn(), network=vi.fn()
  vi.stubGlobal('fetch',network)
  render(<LearnCastingStage onBack={onBack} onPractice={onPractice}/>)
  expect(screen.getByText(/第一课 · 什么是爻与卦/)).toBeTruthy()
  expect(screen.getByText(/2 \+ 3 \+ 2 = 7 · 少阳/)).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:/记下第 1 爻/}))
  expect(screen.getByText('你的卦：已完成 1 / 6 爻')).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:/撤回最后一爻/}))
  expect(screen.getByText('你的卦：已完成 0 / 6 爻')).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:/第1枚钱币：字/}))
  expect(screen.getByText(/3 \+ 3 \+ 2 = 8 · 少阴/)).toBeTruthy()
  expect(network).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button',{name:/返回择术/}))
  expect(onBack).toHaveBeenCalledOnce()
})

it('六次记录后能亲自看本卦与之卦，再进入真实六爻排盘',()=>{
  const onPractice=vi.fn()
  render(<LearnCastingStage onBack={()=>{}} onPractice={onPractice}/>)
  for(let i=0;i<6;i++){
    fireEvent.click(screen.getByRole('button',{name:/记下第 [1-6] 爻/}))
  }
  expect(screen.getByText(/六爻齐备，读出本卦与之卦/)).toBeTruthy()
  expect(screen.getByText(/本卦 · /)).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:/到正式六爻工坊排盘/}))
  expect(onPractice).toHaveBeenCalledWith('liuyao')
})

it('梅花从数字到上下卦动爻、体用的推演可交互，输入错误不误算',()=>{
  const onPractice=vi.fn()
  render(<LearnCastingStage onBack={()=>{}} onPractice={onPractice}/>)
  fireEvent.click(screen.getByRole('tab',{name:/梅花 · 两数起卦/}))
  fireEvent.click(screen.getByRole('button',{name:/一步步计算上下卦和动爻/}))
  expect(screen.getByText(/本卦 · 未济/)).toBeTruthy()
  expect(screen.getByText(/变卦 · 鼎/)).toBeTruthy()
  expect(screen.getByText(/离为体，坎为用/)).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:/到梅花工坊/}))
  expect(onPractice).toHaveBeenCalledWith('meihua')
  fireEvent.change(screen.getByLabelText(/第一数 · 上卦/),{target:{value:'0'}})
  fireEvent.click(screen.getByRole('button',{name:/一步步计算上下卦和动爻/}))
  expect(screen.getByRole('alert')).toBeTruthy()
  expect(screen.queryByText(/本卦 · 未济/)).toBeNull()
})

it('八卦速查可点选并解释阴阳与方位，不把类象冒充预测结论',()=>{
  render(<LearnCastingStage onBack={()=>{}} onPractice={()=>{}}/>)
  fireEvent.click(screen.getByRole('button',{name:/2 · 兑/}))
  expect(screen.getByText(/兑 · 泽/)).toBeTruthy()
  expect(screen.getByText(/爻形由下到上：阳、阳、阴/)).toBeTruthy()
  expect(screen.getByText(/后天方位：/)).toBeTruthy()
})
