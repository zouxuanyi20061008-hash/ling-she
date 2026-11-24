// @vitest-environment jsdom
// 藏经阁动手试炼与首页导航回归。
import React from 'react'
import {afterEach,it,expect,vi} from 'vitest'
import {cleanup,fireEvent,render,screen,within} from '@testing-library/react'
import ArtsHub from '../src/ArtsHub.jsx'
import AcademyGames from '../src/AcademyGames.jsx'

afterEach(()=>{
  cleanup()
  localStorage.removeItem('lingshe.home-challenges.v1')
  vi.restoreAllMocks()
})

function renderHome(overrides={}) {
  const props={
    screen:'home',onStart:vi.fn(),onBack:vi.fn(),onSelect:vi.fn(),
    onStudy:vi.fn(),onLearn:vi.fn(),activeGroup:'全部',setActiveGroup:vi.fn(),
    page:0,setPage:vi.fn(),...overrides
  }
  return {props,...render(<ArtsHub {...props}/>)}
}

function renderGames() {
  const props={onSelect:vi.fn()}
  function GameView() {
    const [activeIndex, setActiveIndex]=React.useState(0)
    return <AcademyGames {...props} activeIndex={activeIndex} onIndexChange={setActiveIndex}/>
  }
  return {props,...render(<GameView/>)}
}

it('动手试炼呈现八个可访问卦象，默认选中乾卦并明确说明体验边界',()=>{
  renderGames()
  const explorer=screen.getByRole('region',{name:'八卦探象互动体验'})
  expect(explorer).toBeTruthy()
  const trigramButtons=screen.getAllByRole('button').filter(button=>
    button.getAttribute('aria-label')?.includes('卦：')
  )
  expect(trigramButtons).toHaveLength(8)
  expect(screen.getByRole('button',{name:'1 · 乾卦：天，西北，五行属金'}).getAttribute('aria-pressed')).toBe('true')
  expect(screen.getByText('乾 · 天')).toBeTruthy()
  expect(screen.getByText(/不参与正式起卦/)).toBeTruthy()
})

it('点选兑卦后，选中态、自然之象、后天方位和五行同步更新',()=>{
  renderGames()
  const qian=screen.getByRole('button',{name:'1 · 乾卦：天，西北，五行属金'})
  const dui=screen.getByRole('button',{name:'2 · 兑卦：泽，西，五行属金'})
  expect(qian.getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(dui)
  expect(dui.getAttribute('aria-pressed')).toBe('true')
  expect(qian.getAttribute('aria-pressed')).toBe('false')
  expect(screen.getByText('兑 · 泽')).toBeTruthy()
  expect(screen.getByText('后天方位 · 西')).toBeTruthy()
  expect(screen.getByText('五行 · 金')).toBeTruthy()
})

it('随机观象从既有八卦资料中选取，并保留非正式起卦提示',()=>{
  vi.spyOn(Math,'random').mockReturnValue(0.5)
  renderGames()
  fireEvent.click(screen.getByRole('button',{name:'随机观象'}))
  expect(screen.getByText('巽 · 风')).toBeTruthy()
  expect(screen.getByText('后天方位 · 东南')).toBeTruthy()
  expect(screen.getByText(/不参与正式起卦/)).toBeTruthy()
})

it('每次随机观象都会切换到另一个卦象',()=>{
  vi.spyOn(Math,'random').mockReturnValue(0)
  renderGames()
  const random=screen.getByRole('button',{name:'随机观象'})
  const qian=screen.getByRole('button',{name:/乾卦：/})
  const dui=screen.getByRole('button',{name:/兑卦：/})
  fireEvent.click(random)
  expect(dui.getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(random)
  expect(qian.getAttribute('aria-pressed')).toBe('true')
})

it('旋转卦环只改变方位，不改变当前所选卦象，并且可以复位',()=>{
  const {container}=renderGames()
  const orbit=container.querySelector('.atlas-orbit')
  const qian=screen.getByRole('button',{name:'1 · 乾卦：天，西北，五行属金'})
  const before=qian.style.getPropertyValue('--orbit-x')
  fireEvent.click(screen.getByRole('button',{name:'顺时针旋转45度'}))
  expect(orbit.getAttribute('data-rotation')).toBe('45')
  expect(qian.style.getPropertyValue('--orbit-x')).not.toBe(before)
  expect(qian.getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(screen.getByRole('button',{name:'恢复八卦环默认方位'}))
  expect(orbit.getAttribute('data-rotation')).toBe('0')
  expect(qian.style.getPropertyValue('--orbit-x')).toBe(before)
})

it('可把当前卦设为上卦或下卦，并用六条阴阳线显示组合卦',()=>{
  renderGames()
  expect(screen.getByText('天地 · 否')).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:'2 · 兑卦：泽，西，五行属金'}))
  fireEvent.click(screen.getByRole('button',{name:'将兑卦设为上卦'}))
  expect(screen.getByText('泽地 · 萃')).toBeTruthy()
  expect(screen.getByRole('img',{name:/六爻卦形/})).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:'将兑卦设为下卦'}))
  expect(screen.getByText('泽泽 · 兑')).toBeTruthy()
})

it('首页能直达排盘和藏经阁，试炼收进藏经阁',()=>{
  const {props,container}=renderHome()
  const archive=screen.getAllByRole('button',{name:/藏经阁/})
  expect(archive).toHaveLength(1)
  expect(container.querySelector('.home-experiences')).toBeNull()
  expect(screen.queryByRole('button',{name:/术数游学/})).toBeNull()
  fireEvent.click(screen.getByRole('button',{name:'开始排盘'}))
  fireEvent.click(archive[0])
  expect(props.onStart).toHaveBeenCalledOnce()
  expect(props.onStudy).toHaveBeenCalledOnce()
})

it('动手试炼可前后切换体验，八卦环位置在换页后保留',()=>{
  renderGames()
  fireEvent.click(screen.getByRole('button',{name:'顺时针旋转45度'}))
  fireEvent.click(screen.getByRole('button',{name:'下一个术数体验'}))
  expect(screen.queryByRole('region',{name:'八卦探象互动体验'})).toBeNull()
  const qimen=screen.getByRole('article',{name:'奇门遁甲互动体验'})
  fireEvent.click(within(qimen).getByRole('button',{name:'离9宫 · 惊门'}))
  expect(within(qimen).getByRole('status').textContent).toContain('惊门在离九宫')
  fireEvent.click(screen.getByRole('button',{name:'上一个术数体验'}))
  const trigram=screen.getByRole('region',{name:'八卦探象互动体验'})
  expect(within(trigram).getByRole('group',{name:'选择八卦'}).dataset.rotation).toBe('45')
})

it('可直达各术数小玩法，改动只发生在样盘，并能进入对应工坊',()=>{
  const {props}=renderGames()
  const cases=[
    ['紫微斗数','卯 · 迁移','酉的对宫是卯','ziwei'],
    ['四柱八字','日柱天干 甲','甲是日主','bazi'],
    ['堪舆风水','西 270度','西 270°','fengshui'],
    ['六爻铜钱','第 3 枚铜钱。背面 3。翻面','6 · 老阴','liuyao'],
    ['大六壬','亥','中传亥','liuren'],
    ['太乙神数','第 4 时辰','坎八宫','taiyi'],
  ]
  for(const [name,choice,explanation,route] of cases){
    fireEvent.click(screen.getByRole('button',{name:`体验${name}`}))
    const card=within(screen.getByRole('article',{name:`${name}互动体验`}))
    fireEvent.click(card.getByRole('button',{name:choice}))
    expect(card.getByRole('status').textContent).toContain(explanation)
    fireEvent.click(card.getByRole('button',{name:`进入${name}工坊`}))
    expect(props.onSelect).toHaveBeenLastCalledWith(route)
  }
},15000)

it('八卦挑战能提示、重试、从存档继续、通关和重玩',()=>{
  const explorer=()=>within(screen.getByRole('region',{name:'八卦探象互动体验'}))
  const press=(name)=>fireEvent.click(explorer().getByRole('button',{name}))
  const first=renderGames()
  press('看提示')
  expect(screen.getByText(/上面一条实线/)).toBeTruthy()
  press('收起提示')
  press(/兑卦：/)
  expect(screen.getByText(/再找代表山的卦/)).toBeTruthy()
  expect(screen.queryByRole('button',{name:'下一关'})).toBeNull()
  press(/艮卦：/)
  press('下一关')
  press('检查合卦')
  expect(screen.getByText(/按题目核对/)).toBeTruthy()
  press(/巽卦：/)
  press('将巽卦设为上卦')
  press(/震卦：/)
  press('将震卦设为下卦')
  press('检查合卦')
  expect(screen.getByText(/巽上、震下合为风雷益/)).toBeTruthy()
  press('下一关')
  first.unmount()

  const resumed=renderGames()
  expect(explorer().getByText('第 3 / 3 关')).toBeTruthy()
  press(/震卦：/)
  press('将震卦设为上卦')
  press(/巽卦：/)
  press('将巽卦设为下卦')
  press('检查合卦')
  expect(screen.getByText(/震上、巽下合为雷风恒/)).toBeTruthy()
  press('完成挑战')
  expect(screen.getByText('通关了')).toBeTruthy()
  resumed.unmount()

  renderGames()
  expect(screen.getByText('通关了')).toBeTruthy()
  expect(screen.getByRole('button',{name:'体验梅花心易'}).getAttribute('aria-description')).toBe('已通关')
  press('再玩一次')
  expect(explorer().getByText('第 1 / 3 关')).toBeTruthy()
  expect(screen.getByText('天地 · 否')).toBeTruthy()
  expect(screen.getByText(/已通关 1\/8 门/)).toBeTruthy()
},15000)
