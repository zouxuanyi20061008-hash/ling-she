// @vitest-environment jsdom
import React from 'react'
import {cleanup, fireEvent, render, screen, within} from '@testing-library/react'
import {afterEach, beforeEach, expect, it} from 'vitest'
import LearningRoutes from '../src/LearningRoutes.jsx'
import {FOUNDATION_CASES} from '../src/learningCasesFoundations.js'

const [guided, solo] = FOUNDATION_CASES.meihua
const button = (name) => screen.getByRole('button', {name, exact:true})
const choose = (step, choice = step.answer) => {
  const options = within(screen.getByRole('group', {name:'选择盘面或判断依据'}))
  fireEvent.click(options.getByRole('button', {name:step.options[choice], exact:true}))
}

beforeEach(() => localStorage.clear())
afterEach(cleanup)

it('resumes a confirmed step without saving an unconfirmed choice', () => {
  const first = render(<LearningRoutes activeIndex={0}/>)
  expect(button('核对这步').disabled).toBe(true)
  choose(guided.steps[0], 0)
  fireEvent.click(button('核对这步'))
  expect(screen.getByRole('status').textContent).toMatch(/还没对上/)
  choose(guided.steps[0])
  fireEvent.click(button('核对这步'))
  expect(screen.getByRole('status').textContent).toBe(guided.steps[0].why)
  fireEvent.click(button('下一步'))
  choose(guided.steps[1])
  first.unmount()

  render(<LearningRoutes activeIndex={0}/>)
  expect(screen.getByRole('heading', {name:guided.steps[1].prompt})).toBeTruthy()
  expect(button('核对这步').disabled).toBe(true)
  fireEvent.click(screen.getByText('查看已排盘面'))
  expect(screen.getByText(guided.steps[0].record)).toBeTruthy()
})

it('withholds checking until independent submission and opens review at the first mistake', () => {
  render(<LearningRoutes activeIndex={0}/>)
  fireEvent.click(button('独立实战'))
  const firstStep = solo.steps[0]
  const wrong = (firstStep.answer + 1) % firstStep.options.length
  choose(firstStep, wrong)
  fireEvent.click(button('确认并继续'))
  expect(screen.queryByRole('status')).toBeNull()
  expect(screen.queryByRole('button', {name:'上一步'})).toBeNull()
  expect(screen.queryByText('看提示')).toBeNull()
  fireEvent.click(screen.getByText('查看已填盘面'))
  expect(screen.getByText(firstStep.options[wrong])).toBeTruthy()
  expect(screen.queryByText(firstStep.record)).toBeNull()
  for (const [index, step] of solo.steps.entries()) {
    if (index === 0) continue
    choose(step)
    fireEvent.click(button(index + 1 === solo.steps.length ? '交卷看结果' : '确认并继续'))
  }

  expect(screen.getByRole('heading', {name:'独立实战已交卷'})).toBeTruthy()
  expect(screen.getByText('独立通过 0/8 门')).toBeTruthy()
  fireEvent.click(button('逐步看讲解'))
  expect(screen.getByRole('heading', {name:firstStep.prompt})).toBeTruthy()
  expect(screen.getByText(firstStep.why)).toBeTruthy()
  fireEvent.click(button('回结果'))
  fireEvent.click(button('重做本题'))
  expect(screen.getByRole('heading', {name:firstStep.prompt})).toBeTruthy()
})
