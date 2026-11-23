import { useId, useLayoutEffect, useRef, useState } from 'react'
import EightTrigramExplorer from './EightTrigramExplorer.jsx'
import './home-experiences.css'

const qimenPalaces = [
  ['巽', 4, '死门'], ['离', 9, '惊门'], ['坤', 2, '开门'],
  ['震', 3, '景门'], ['中', 5, '无门'], ['兑', 7, '休门'],
  ['艮', 8, '杜门'], ['坎', 1, '伤门'], ['乾', 6, '生门'],
]
const ziweiPalaces = [
  ['巳', '财帛'], ['午', '子女'], ['未', '夫妻'], ['申', '兄弟'],
  ['辰', '疾厄'], ['酉', '命宫'],
  ['卯', '迁移'], ['戌', '父母'],
  ['寅', '交友'], ['丑', '官禄'], ['子', '田宅'], ['亥', '福德'],
]
const baziPillars = [['年','己','卯'], ['月','辛','未'], ['日','甲','戌'], ['时','壬','申']]
const compassPoints = [['北', 0], ['东', 90], ['南', 180], ['西', 270]]
const coinLineNames = { 6:'老阴', 7:'少阳', 8:'少阴', 9:'老阳' }

function Pick({label, value, answer, picked, onPick, children, style}){
  const selected = picked === value
  const revealed = picked === answer && answer === value
  return <button type="button" className="home-experience-pick" style={style}
    aria-label={label} aria-pressed={selected} data-correct={revealed || undefined}
    onClick={()=>onPick(value)}>{children}</button>
}

function Game({label, prompt, children, feedback}){
  return <>
    <h3 className="home-experience-play">{label}</h3>
    <p className="home-experience-prompt">{prompt}</p>
    {children}
    <div className="home-experience-feedback" role="status">{feedback}</div>
  </>
}

function QimenGame(){
  const [picked,setPicked]=useState(null)
  const feedback = picked === null ? '八门写在格内，九宫图上方是南。' : picked === 9
    ? '找到了。惊门在离九宫，这一局的值使就是它。值使指出本局从哪一门开始看。'
    : '看看格内的门名，找写着「惊门」的一格。'
  return <Game label="九宫寻门" prompt="这张例盘的值使是惊门。点出它所在的宫。" feedback={feedback}>
    <div className="home-experience-grid home-qimen-grid" role="group" aria-label="奇门例盘九宫">
      {qimenPalaces.map(([name,number,gate])=><Pick key={number} label={`${name}${number}宫 · ${gate}`} value={number}
        answer={9} picked={picked} onPick={setPicked}><small>{name}{number}</small><strong>{gate}</strong></Pick>)}
    </div>
  </Game>
}

function ZiweiGame(){
  const [picked,setPicked]=useState(null)
  const feedback = picked === null ? '深边格标出命宫。对宫在方盘的正对面。' : picked === '卯'
    ? '找到了。酉的对宫是卯。这张盘的卯位是迁移宫，可和命宫一起对照外出的主题。'
    : '从「酉 · 命宫」横穿盘心，看看另一侧是哪一格。'
  return <Game label="点出命宫的对宫" prompt="这张例盘的命宫在酉。点出与它正对的一格。" feedback={feedback}>
    <div className="home-experience-grid home-ziwei-grid" role="group" aria-label="紫微例盘十二宫">
      {ziweiPalaces.map(([branch,name])=><Pick key={branch} label={`${branch} · ${name}`} value={branch}
        answer="卯" picked={picked} onPick={setPicked}><small data-origin={branch==='酉'||undefined}>{branch}</small><strong>{name}</strong></Pick>)}
      <span className="home-ziwei-center" aria-hidden="true">紫微<br/>十二宫</span>
    </div>
  </Game>
}

function BaziGame(){
  const [picked,setPicked]=useState(null)
  const feedback = picked === null ? '每柱上格是天干，下格是地支。' : picked === '甲'
    ? '找到了。日柱是甲戌，上面的甲是日主，属木。读十神时，其他天干都要和这个甲木作比较。'
    : '先找到写着「日柱」的一列，再选这一列上面的字。'
  return <Game label="从八字里找日主" prompt="日主是日柱的天干。看看这组八字，点出是哪一个字。" feedback={feedback}>
    <div className="home-experience-grid home-bazi-grid" role="group" aria-label="四柱例盘八个字">
      {baziPillars.map(([pillar,stem,branch])=><div key={pillar} className="home-bazi-pillar">
        <span>{pillar}柱</span>
        <Pick label={`${pillar}柱天干 ${stem}`} value={stem} answer="甲" picked={picked} onPick={setPicked}><strong>{stem}</strong></Pick>
        <Pick label={`${pillar}柱地支 ${branch}`} value={branch} answer="甲" picked={picked} onPick={setPicked}><strong>{branch}</strong></Pick>
      </div>)}
    </div>
  </Game>
}

function FengshuiGame(){
  const [picked,setPicked]=useState(null)
  const feedback = picked === null ? '罗盘从正北 0° 顺时针读。' : picked === '西'
    ? '对了。朝向是东 90°，坐山在正对面的西 270°。坐和向总是相差 180°。'
    : '坐山是朝向的反方向。沿着罗盘横线找东的另一端。'
  return <Game label="罗盘找坐山" prompt="知道这处朝正东，请点出背靠的方向。" feedback={feedback}>
    <div className="home-compass" role="group" aria-label="罗盘四个方向">
      <span className="home-compass-dial" aria-hidden="true"/>
      {compassPoints.map(([name,degrees])=><Pick key={name} label={`${name} ${degrees}度`} value={name}
        style={{gridArea:`direction-${degrees}`}} answer="西" picked={picked} onPick={setPicked}>
        <strong data-origin={name==='东'||undefined}>{name}</strong><small>{degrees}°</small>
      </Pick>)}
    </div>
  </Game>
}

function CoinGame(){
  const [faces,setFaces]=useState([2,2,3])
  const total=faces.reduce((sum,face)=>sum+face,0)
  const moving=total===6||total===9
  return <Game label="三钱记一爻" prompt="字面算 2，背面算 3。点任意一枚翻面，看看总数写成哪一爻。"
    feedback={<><strong>{faces.join(' ＋ ')} ＝ {total} · {coinLineNames[total]}</strong><span>{moving?'这爻会变，称作动爻。':'这爻保持原来的阴阳，称作静爻。'}</span></>}>
    <div className="home-experience-grid home-coins" role="group" aria-label="翻动三枚练习铜钱">
      {faces.map((face,index)=><button type="button" className="home-coin-pick" key={index}
        aria-label={`第 ${index+1} 枚铜钱。${face===2?'字面 2':'背面 3'}。翻面`}
        data-back={face===3||undefined} onClick={()=>setFaces(current=>current.map((value,i)=>i===index?5-value:value))}>
        <span>{face===2?'字':'背'}</span><b>{face}</b>
      </button>)}
    </div>
  </Game>
}

function LiurenGame(){
  const [picked,setPicked]=useState(null)
  const feedback = picked === null ? '先看初传「申」，把它当作地盘位置。' : picked === '亥'
    ? '得到了中传亥。再找地盘亥的上方，得到末传寅。这个例子的三传是申、亥、寅。'
    : '本课从地盘申往上找，天盘压在申上的字是亥。'
  return <Game label="沿天盘接出三传" prompt="例盘里申位上面是亥。初传为申，中传该接哪一个？" feedback={feedback}>
    <div className="home-liuren-chain" aria-label="本课三传顺序">
      <span><small>初传</small><b>申</b></span><span aria-hidden="true">→</span>
      <span><small>中传</small><b>{picked==='亥'?'亥':'？'}</b></span><span aria-hidden="true">→</span>
      <span><small>末传</small><b>{picked==='亥'?'寅':'？'}</b></span>
    </div>
    <div className="home-experience-grid home-option-three" role="group" aria-label="选择中传">
      {['午','亥','卯'].map(branch=><Pick key={branch} value={branch} answer="亥" picked={picked} onPick={setPicked}><strong>{branch}</strong></Pick>)}
    </div>
  </Game>
}

function TaiyiGame(){
  const [picked,setPicked]=useState(1)
  const palace = picked === 4 ? '坎八宫' : '巽九宫'
  return <Game label="点时辰，观察太乙换宫" prompt="从夏至所在的时辰数起。点前四个时辰，看看什么时候换宫。"
    feedback={<><strong>第 {picked} 时辰 · {palace}</strong><span>{picked===4?'三个时辰走完，就沿阴遁次序移到坎八宫。':'夏至用阴遁，从巽九宫起步，前三个时辰都在这里。'}</span></>}>
    <div className="home-taiyi-plates" aria-hidden="true">
      <span data-palace-active={picked<4||undefined}>巽九宫</span><span>→</span>
      <span data-palace-active={picked===4||undefined}>坎八宫</span>
    </div>
    <div className="home-experience-grid home-option-four" role="group" aria-label="夏至起相对时辰">
      {[1,2,3,4].map(number=><Pick key={number} label={`第 ${number} 时辰`} value={number} picked={picked} onPick={setPicked}>
        <strong>{number}</strong><small>时辰</small>
      </Pick>)}
    </div>
  </Game>
}

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

export default function HomeExperiences({onSelect, activeIndex=0, onIndexChange}){
  const labelId=useId()
  const cardId=useId()
  const rail=useRef(null)
  const start=useRef(null)
  const suppressClick=useRef(false)
  const current=EXPERIENCES[activeIndex]

  useLayoutEffect(()=>{
    const list=rail.current
    const selected=list?.querySelector('[aria-pressed="true"]')
    if (!selected) return
    const left=selected.offsetLeft
    const right=left+selected.offsetWidth
    if(left<list.scrollLeft)list.scrollLeft=left
    else if(right>list.scrollLeft+list.clientWidth)list.scrollLeft=right-list.clientWidth
  },[activeIndex])

  function advance(step){
    onIndexChange?.((activeIndex+step+EXPERIENCES.length)%EXPERIENCES.length)
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
      <div><h2 id={labelId}>术数体验</h2><p>左右滑动，换一门试试</p></div>
      <div className="home-experience-arrows" role="group" aria-label="切换术数体验">
        <button type="button" aria-label="上一个术数体验" aria-controls={cardId} onClick={()=>advance(-1)}>‹</button>
        <span role="status" aria-label={`${current.name}，第 ${activeIndex+1} 项，共 ${EXPERIENCES.length} 项`}>{activeIndex+1}/{EXPERIENCES.length}</span>
        <button type="button" aria-label="下一个术数体验" aria-controls={cardId} onClick={()=>advance(1)}>›</button>
      </div>
    </header>
    <div className="home-experience-rail" role="group" aria-label="直接选择要体验的术数" ref={rail}>
      {EXPERIENCES.map(({id,name,tab},index)=><button type="button" key={id} aria-label={`体验${name}`}
        aria-pressed={activeIndex===index} aria-controls={cardId} onClick={()=>onIndexChange?.(index)}>{tab}</button>)}
    </div>
    <div id={cardId} className="home-experience-stage" onPointerDown={event=>{
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
      {EXPERIENCES.map(({id,name,icon,Game:Play}, index)=><div key={id} hidden={index!==activeIndex}>
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
