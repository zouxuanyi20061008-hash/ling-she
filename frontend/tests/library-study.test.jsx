// @vitest-environment jsdom
import React from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import StudyHall from '../src/StudyHall.jsx'
import { ARTS } from '../src/ArtsHub.jsx'
import { LIBRARY_STUDY, LIBRARY_TRIALS } from '../src/libraryStudy.js'
import { COURSE_QUIZ, TEXTS } from '../src/traditionContent.js'

const progressKey='wanxiang-library-progress-v1'
const click=(name)=>fireEvent.click(screen.getByRole('button',{name}))
const choose=(name,value)=>fireEvent.change(screen.getByRole('combobox',{name}),{target:{value:String(value)}})
const trialQuestion=()=>screen.getByRole('group',{name:/^(答案卡片|答题盘|顺序卡片)$/})

beforeEach(()=>{
  localStorage.clear()
  vi.stubGlobal('scrollTo',vi.fn())
})

afterEach(()=>{
  cleanup()
  vi.unstubAllGlobals()
})

it('《周易》和全部术数都有随课试炼，原有六爻题目仍然可选',()=>{
  expect(Object.keys(LIBRARY_STUDY).sort()).toEqual(['zhouyi',...ARTS.map(art=>art.id)].sort())
  for(const [method,lessons] of Object.entries(LIBRARY_STUDY)){
    expect(lessons.length).toBeGreaterThanOrEqual(5)
    expect(new Set(lessons.map(lesson=>lesson.id)).size).toBe(lessons.length)
    for(const [index,lesson] of lessons.entries()){
      expect(LIBRARY_TRIALS[method][index]).toEqual({...lesson.challenge,lessonIndex:index})
      expect(lesson.challenge.hint).toBeTruthy()
      expect(lesson.challenge.why).toBeTruthy()
      if(lesson.challenge.type==='order'){
        const indices=lesson.challenge.options.map((_,i)=>i)
        expect([...lesson.challenge.answer].sort((a,b)=>a-b)).toEqual(indices)
        expect(lesson.challenge.answer).not.toEqual(indices)
      }else{
        expect(lesson.challenge.options[lesson.challenge.answer]).toBeTruthy()
      }
      if(lesson.readingIndex!==undefined)expect(TEXTS[method][lesson.readingIndex]).toBeTruthy()
    }
  }
  const liuyaoQuestions=LIBRARY_TRIALS.liuyao.map(trial=>trial.question)
  for(const oldQuestion of COURSE_QUIZ.liuyao)expect(liuyaoQuestions).toContain(oldQuestion.q)
})

it('旧版修习进度仍可续读，《周易》课可跳到对应卦再返回',()=>{
  localStorage.setItem(progressKey,JSON.stringify({'lesson:qimen':1,'reader:zhouyi':0}))
  render(<StudyHall/>)
  click(/贰 · 修习/)
  click(/奇门遁甲 · 第 2 课/)
  expect(screen.getByRole('heading',{name:'认识八门'})).toBeTruthy()
  click(/返回课程目录/)
  click(/周易.*开始修习/)
  choose('选择课程',6)
  expect(screen.getByRole('heading',{name:'去典籍找一卦'})).toBeTruthy()
  click(/读原典/)
  expect(screen.getByRole('heading',{name:/咸.*xián/})).toBeTruthy()
  click(/返回本课/)
  expect(screen.getByRole('heading',{name:'去典籍找一卦'})).toBeTruthy()
  expect(JSON.parse(localStorage.getItem(progressKey))).toMatchObject({
    'lesson:qimen':1,'lesson:zhouyi':6,'reader:zhouyi':30,
  })
})

it('课程直达九宫答题，排序可撤回，解析能跳回对应课程',()=>{
  render(<StudyHall/>)
  click(/贰 · 修习/)
  click(/太乙神数.*开始修习/)
  choose('选择课程',1)
  click('本课试炼')
  expect(screen.getByRole('combobox',{name:'选择题目'}).value).toBe('1')
  expect(within(trialQuestion()).getAllByRole('button')).toHaveLength(9)
  fireEvent.click(screen.getByText('给我一点提示'))
  expect(screen.getByText(/正北在下排的中间/).closest('details').open).toBe(true)
  fireEvent.click(within(trialQuestion()).getByRole('button',{name:'坎八'}))
  expect(screen.getByRole('status').getAttribute('data-correct')).toBe('true')
  click('回到本课')
  expect(screen.getByRole('heading',{name:'认识太乙式九宫'})).toBeTruthy()
  click('本课试炼')
  choose('选择题目',2)
  const order=within(trialQuestion())
  expect(screen.getByRole('button',{name:'核对顺序'}).disabled).toBe(true)
  fireEvent.click(order.getByRole('button',{name:'坤七宫'}))
  click('撤回一步')
  expect(order.getByRole('button',{name:'坤七宫'}).disabled).toBe(false)
  for(const palace of ['震四宫','兑六宫','坤七宫'])fireEvent.click(order.getByRole('button',{name:palace}))
  click('核对顺序')
  expect(screen.getByRole('status').getAttribute('data-correct')).toBe('true')
  fireEvent.click(screen.getByText('回顾本课 · 三年换一宫'))
  click('打开本课')
  expect(screen.getByRole('heading',{name:'三年换一宫'})).toBeTruthy()
  expect(JSON.parse(localStorage.getItem(progressKey))['lesson:taiyi']).toBe(2)
})

it('五题连练记录首次得分，重试答对后仍能从成绩页回顾首道错题',()=>{
  render(<StudyHall/>)
  click(/叁 · 试炼/)
  click('课后答题')
  click(/太乙神数.*开始答题/)
  const first=LIBRARY_TRIALS.taiyi[0]
  fireEvent.click(within(trialQuestion()).getByText(first.options.find((_,i)=>i!==first.answer)))
  expect(screen.getByRole('status').getAttribute('data-correct')).toBe('false')
  click('再试一次')
  expect(screen.getByRole('button',{name:'下一题 →'}).disabled).toBe(true)
  for(const [i,challenge] of LIBRARY_TRIALS.taiyi.slice(0,5).entries()){
    expect(screen.getByRole('progressbar',{name:'本轮进度'}).getAttribute('aria-valuenow')).toBe(String(i+1))
    const options=within(trialQuestion())
    const answers=Array.isArray(challenge.answer)?challenge.answer:[challenge.answer]
    for(const answer of answers)fireEvent.click(options.getByText(challenge.options[answer]))
    if(challenge.type==='order')click('核对顺序')
    click(i===4?'看看本轮成绩 →':'下一题 →')
  }
  expect(screen.getByRole('heading',{name:'本轮完成'})).toBeTruthy()
  expect(screen.getByText('首次答对 4 / 5 题')).toBeTruthy()
  click('回看第一道错题的课')
  expect(screen.getByRole('heading',{name:'先选岁计或时计'})).toBeTruthy()
})

it('修习直达同门动手试炼，原有课后题仍在同一个试炼入口',async()=>{
  const routeChange=vi.fn()
  const workshop=vi.fn()
  render(<StudyHall onTrialRouteChange={routeChange} onTrialWorkshop={workshop}/>)
  click(/贰 · 修习/)
  click(/奇门遁甲.*开始修习/)
  click('动手练这一门')
  const board=await screen.findByRole('article',{name:'奇门遁甲互动体验'})
  fireEvent.click(within(board).getByRole('button',{name:'离9宫 · 惊门'}))
  fireEvent.click(within(board).getByRole('button',{name:'进入奇门遁甲工坊'}))
  expect(workshop).toHaveBeenCalledWith('qimen')
  expect(routeChange).toHaveBeenLastCalledWith(true)
  const modes=within(screen.getByRole('group',{name:'试炼方式'}))
  expect(modes.getByRole('button',{name:'动手试炼'}).getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(modes.getByRole('button',{name:'课后答题'}))
  expect(screen.queryByRole('article',{name:'奇门遁甲互动体验'})).toBeNull()
  click(/奇门遁甲.*开始答题/)
  expect(screen.getByRole('combobox',{name:'选择题目'})).toBeTruthy()
  click(/返回练习目录/)
  fireEvent.click(modes.getByRole('button',{name:'动手试炼'}))
  expect(within(board).getByRole('button',{name:'下一关'})).toBeTruthy()
})
