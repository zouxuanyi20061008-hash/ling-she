// @vitest-environment jsdom
import React,{useState} from 'react'
import {cleanup,fireEvent,render,screen,within} from '@testing-library/react'
import {afterEach,expect,it,vi} from 'vitest'
import ArtsHub from '../src/ArtsHub.jsx'

afterEach(()=>{
  cleanup()
  vi.unstubAllGlobals()
})

function renderSelection(compact) {
  vi.stubGlobal('matchMedia',()=>({matches:compact,addEventListener(){},removeEventListener(){}}))
  const onSelect=vi.fn()
  function Selection() {
    const [group,setGroup]=useState('全部')
    const [page,setPage]=useState(0)
    return <ArtsHub screen="choose" activeGroup={group} setActiveGroup={setGroup}
      page={page} setPage={setPage} onSelect={onSelect}/>
  }
  render(<Selection/>)
  return onSelect
}

it('shows all eight methods on a phone and filters without pagination',()=>{
  const onSelect=renderSelection(true)
  const selection=within(screen.getByRole('region',{name:'择术入境'}))
  expect(selection.getAllByRole('button',{name:/^进入/})).toHaveLength(8)
  expect(selection.queryByRole('navigation',{name:'术数列表分页'})).toBeNull()
  fireEvent.click(selection.getByRole('button',{name:'三式'}))
  expect(selection.getAllByRole('button',{name:/^进入/})).toHaveLength(3)
  fireEvent.click(selection.getByRole('button',{name:/^进入太乙神数/}))
  expect(onSelect).toHaveBeenCalledWith('taiyi')
})

it('keeps the desktop paginated selection',()=>{
  renderSelection(false)
  expect(screen.queryByRole('button',{name:/^进入太乙神数/})).toBeNull()
  fireEvent.click(screen.getByRole('button',{name:/下一页/}))
  expect(screen.getByRole('button',{name:/^进入太乙神数/})).toBeTruthy()
})
