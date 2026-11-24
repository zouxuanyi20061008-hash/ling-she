// @vitest-environment jsdom
import React from 'react'
import { afterEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import EightTrigramExplorer from '../src/EightTrigramExplorer.jsx'
import { HomeChallengeProvider } from '../src/HomeChallenge.jsx'

afterEach(cleanup)

it('口诀依原顺序展示，八幅卦图与三爻上下位置一致', () => {
  render(<HomeChallengeProvider><EightTrigramExplorer /></HomeChallengeProvider>)
  const toggle = screen.getByRole('button', { name: '八卦口诀' })
  expect(toggle.getAttribute('aria-expanded')).toBe('false')
  expect(screen.queryByRole('list', { name: '八卦口诀对照' })).toBeNull()
  fireEvent.click(toggle)
  const guide = screen.getByRole('list', { name: '八卦口诀对照' })
  const verses = within(guide).getAllByRole('listitem')
  expect(verses.map(row => [row.textContent, Array.from(within(row).getByRole('img').children)
    .map(line => line.hasAttribute('data-yang') ? 1 : 0).join('')])).toEqual([
    ['乾三连', '111'], ['坤六段', '000'], ['离中虚', '101'], ['坎中满', '010'],
    ['巽下断', '110'], ['兑上缺', '011'], ['震仰盂', '001'], ['艮覆碗', '100'],
  ])
  expect(within(guide).getByRole('img', { name: '艮卦从上到下是阳、阴、阴' })).toBeTruthy()

  fireEvent.click(screen.getByRole('button', { name: /震卦：雷/ }))
  expect(guide.querySelector('[aria-current="true"]').textContent).toBe('震仰盂')
  fireEvent.click(toggle)
  expect(screen.queryByRole('list', { name: '八卦口诀对照' })).toBeNull()
  expect(screen.getByText('震仰盂', { selector: 'strong' })).toBeTruthy()

  fireEvent.click(screen.getByRole('button', { name: '看提示' }))
  expect(screen.getByText(/口诀是「艮覆碗」/)).toBeTruthy()
})
