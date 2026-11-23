import { useId, useLayoutEffect, useRef, useState } from 'react'
import './home-experiences.css'
import './home-dioramas.css'
import './home-observatory-scenes.css'
import EightTrigramExplorer from './EightTrigramExplorer.jsx'
import { HomeChallengeProvider, useHomeChallengeProgress } from './HomeChallenge.jsx'
import { QimenGame, ZiweiGame } from './HomeObservatoryGames.jsx'
import { BaziGame, FengshuiGame } from './HomeCabinetGames.jsx'
import { CoinGame, LiurenGame, TaiyiGame } from './HomeMotionGames.jsx'

const EXPERIENCES = [
  {id:'meihua', name:'梅花心易', tab:'八卦', icon:'☯'},
  {id:'qimen', name:'奇门遁甲', tab:'奇门', icon:'九', Game:QimenGame},
  {id:'ziwei', name:'紫微斗数', tab:'紫微', icon:'星', Game:ZiweiGame},
  {id:'bazi', name:'四柱八字', tab:'四柱', icon:'干', Game:BaziGame},
  {id:'fengshui', name:'堪舆风水', tab:'风水', icon:'向', Game:FengshuiGame},
  {id:'liuyao', name:'六爻铜钱', tab:'六爻', icon:'爻', Game:CoinGame},
  {id:'liuren', name:'大六壬', tab:'六壬', icon:'壬', Game:LiurenGame},
  {id:'taiyi', name:'太乙神数', tab:'太乙', icon:'乙', Game:TaiyiGame},
]

export default function HomeExperiences(props){
  return <HomeChallengeProvider><HomeExperienceCarousel {...props}/></HomeChallengeProvider>
}

function HomeExperienceCarousel({onSelect, activeIndex=0, onIndexChange}){
  const [entrySide,setEntrySide]=useState('right')
  const labelId=useId()
  const cardId=useId()
  const rail=useRef(null)
  const start=useRef(null)
  const suppressClick=useRef(false)
  const current=EXPERIENCES[activeIndex]
  const progress=useHomeChallengeProgress()
  const completed=EXPERIENCES.filter(({id})=>progress[id]?.cleared===true).length

  useLayoutEffect(()=>{
    const list=rail.current
    const selected=list?.querySelector('[aria-pressed="true"]')
    if (!selected) return
    const left=selected.offsetLeft
    const right=left+selected.offsetWidth
    if(left<list.scrollLeft)list.scrollLeft=left
    else if(right>list.scrollLeft+list.clientWidth)list.scrollLeft=right-list.clientWidth
  },[activeIndex])

  function selectExperience(index,step=index-activeIndex){
    if(index===activeIndex)return
    setEntrySide(step<0?'left':'right')
    onIndexChange?.(index)
  }

  function advance(step){
    selectExperience((activeIndex+step+EXPERIENCES.length)%EXPERIENCES.length,step)
  }

  function finishSwipe(event){
    const begin=start.current
    start.current=null
    if(!begin||event.pointerId!==begin.id)return
    const dx=event.clientX-begin.x
    const dy=event.clientY-begin.y
    if(Math.abs(dx)<48||Math.abs(dx)<Math.abs(dy)*1.45)return
    suppressClick.current=true
    advance(dx<0?1:-1)
  }

  return <section className="home-experiences" aria-labelledby={labelId}>
    <header className="home-experience-header">
      <div><h2 id={labelId}>术数体验</h2><p>左右滑动 · 已通关 {completed}/{EXPERIENCES.length} 门</p></div>
      <div className="home-experience-arrows" role="group" aria-label="切换术数体验">
        <button type="button" aria-label="上一个术数体验" aria-controls={cardId} onClick={()=>advance(-1)}>‹</button>
        <span role="status" aria-label={`${current.name}，第 ${activeIndex+1} 项，共 ${EXPERIENCES.length} 项`}>{activeIndex+1}/{EXPERIENCES.length}</span>
        <button type="button" aria-label="下一个术数体验" aria-controls={cardId} onClick={()=>advance(1)}>›</button>
      </div>
    </header>
    <div className="home-experience-rail" role="group" aria-label="直接选择要体验的术数" ref={rail}>
      {EXPERIENCES.map(({id,name,tab},index)=>{
        const cleared=progress[id]?.cleared===true
        return <button type="button" key={id} aria-label={`体验${name}`}
          aria-description={cleared?'已通关':undefined} aria-pressed={activeIndex===index} aria-controls={cardId}
          onClick={()=>selectExperience(index)}>{tab}{cleared&&<span className="home-challenge-badge" aria-hidden="true">✓</span>}</button>
      })}
    </div>
    <div id={cardId} className="home-experience-stage" data-entry-side={entrySide} onPointerDown={event=>{
      suppressClick.current=false
      start.current=event.isPrimary&&(event.pointerType==='touch'||event.pointerType==='pen')
        ? { id:event.pointerId, x:event.clientX, y:event.clientY }:null
    }} onPointerUp={finishSwipe} onPointerCancel={()=>{start.current=null}} onClickCapture={event=>{
      if(suppressClick.current&&event.detail>0){
        suppressClick.current=false
        event.preventDefault()
        event.stopPropagation()
      }
    }}>
      {EXPERIENCES.map(({id,name,icon,Game:Play}, index)=><div className="home-experience-page" key={id} hidden={index!==activeIndex}>
        {Play?<article className={`home-experience-card home-experience-card--${id}`} aria-label={`${name}互动体验`}>
          <header><span aria-hidden="true">{icon}</span><h2>{name}</h2></header>
          <Play/>
          <button type="button" className="home-experience-workshop" onClick={()=>onSelect(id)}>进入{name}工坊 <span aria-hidden="true">↗</span></button>
        </article>:<>
          <EightTrigramExplorer/>
          <button type="button" className="home-experience-workshop home-experience-workshop--meihua" onClick={()=>onSelect(id)}>进入{name}工坊 <span aria-hidden="true">↗</span></button>
        </>}
      </div>)}
    </div>
  </section>
}
