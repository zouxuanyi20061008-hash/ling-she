import { useRef, useState, useSyncExternalStore } from 'react'
import './academy.css'
import HomeExperiences from './HomeExperiences.jsx'
import academyLandscape from './assets/academy-landscape.webp'
import academyLandscapeSmall from './assets/academy-landscape-small.webp'

export const ARTS = [
  {id:'meihua',name:'梅花易数',title:'梅花心易',symbol:'☯',en:'MEIHUA YISHU',tone:'jade',
   brief:'一字一象，万物皆可起卦。',detail:'体用生克 · 先后天八卦 · 本互变卦',status:'可实际排盘',group:'象数易'},
  {id:'liuyao',name:'六爻纳甲',title:'六爻铜钱',symbol:'☰',en:'LIUYAO',tone:'copper',
   brief:'三钱在掌，六掷自下而上。',detail:'三钱六掷 · 京房八宫 · 世应六亲 · 六神旬空',status:'排盘继续完善',group:'卜筮'},
  {id:'qimen',name:'奇门遁甲',title:'九宫遁甲',symbol:'九',en:'QIMEN DUNJIA',tone:'night',
   brief:'九宫为盘，观察时空的结构。',detail:'星门神实盘 · 逐宫四层校核 · 古籍例盘',status:'V73 真实整盘校核',group:'三式'},
  {id:'bazi',name:'四柱八字',title:'干支四柱',symbol:'干',en:'FOUR PILLARS',tone:'amber',
   brief:'年、月、日、时，观干支历法。',detail:'四柱十神 · 大运 · 十二节令流月',status:'V57 可查流年流月',group:'命理'},
  {id:'liuren',name:'大六壬',title:'六壬天盘',symbol:'壬',en:'DA LIU REN',tone:'night',
   brief:'天盘地盘，古代三式之一。',detail:'反吟涉害 · 原典单例边界 · 旬空天将',status:'V76 取传证据校核',group:'三式'},
  {id:'taiyi',name:'太乙神数',title:'太乙行宫',symbol:'乙',en:'TAI YI',tone:'jade',
   brief:'步宫推数，历法中的术数传统。',detail:'阴遁315独立古籍例课 · 气应六纪三相位逐宫候选',status:'岁计与时计排盘',group:'三式'},
  {id:'ziwei',name:'紫微斗数',title:'紫微星盘',symbol:'星',en:'ZIWEI DOUSHU',tone:'copper',
   brief:'十二宫垣，星曜的古典语言。',detail:'十四正曜 · 十二辅煞 · 生年四化双口径',status:'V69 四化辅曜',group:'命理'},
  {id:'fengshui',name:'堪舆风水',title:'山川堪舆',symbol:'山',en:'KAN YU',tone:'amber',
   brief:'察山水形势，读空间的传统观念。',detail:'二十四山 · 立春定运 · 运山向三盘',status:'V71 玄空下卦',group:'空间'},
]

const GROUPS=['全部','象数易','卜筮','三式','命理','空间']
const CARD_LIMIT=4
const COMPACT_LIST_QUERY='(max-width: 650px)'

function subscribeToCompactList(onChange) {
  const query=window.matchMedia?.(COMPACT_LIST_QUERY)
  query?.addEventListener?.('change',onChange)
  return ()=>query?.removeEventListener?.('change',onChange)
}

function isCompactList() {
  return window.matchMedia?.(COMPACT_LIST_QUERY).matches ?? false
}

function BookSeal({word}) {
  return <span className="atlas-seal" aria-hidden="true">{word}</span>
}

function MethodCard({method,onSelect}) {
  return <button type="button" className={'atlas-method '+method.tone+' atlas-method--'+method.id}
    onClick={()=>onSelect(method.id)} aria-label={'进入'+method.name+'，'+method.status}>
    <span className="atlas-method-top">
      <span className="atlas-method-status">{method.status}</span>
    </span>
    <span className="atlas-method-symbol" aria-hidden="true">{method.symbol}</span>
    <span className="atlas-method-en">{method.en}</span>
    <h3>{method.name}</h3>
    <p>{method.brief}</p>
    <small>{method.detail}</small>
    <span className="atlas-method-arrow">入此门 <b>↗</b></span>
    <span className="atlas-method-chevron" aria-hidden="true"/>
  </button>
}

export default function ArtsHub({screen='home',onStart,onBack,onSelect,onStudy,onLearn,onCases,
  activeGroup='全部',setActiveGroup,page=0,setPage,homeExperience,setHomeExperience}) {
  const startTouch=useRef(null)
  const [localExperience,setLocalExperience]=useState(0)
  const compactList=useSyncExternalStore(subscribeToCompactList,isCompactList)
  const visible=activeGroup==='全部'?ARTS:ARTS.filter(a=>a.group===activeGroup)
  const pageCount=Math.max(1,Math.ceil(visible.length/CARD_LIMIT))
  const index=Math.min(page,pageCount-1)
  const methods=compactList?visible:visible.slice(index*CARD_LIMIT,(index+1)*CARD_LIMIT)
  const canPage=!compactList&&pageCount>1
  const chooseGroup=g=>{setActiveGroup(g);setPage(0)}
  const choosePage=p=>setPage(Math.min(Math.max(0,p),pageCount-1))
  const isWelcome=screen!=='choose'

  return <main className={'atlas atlas-screen '+(isWelcome?'atlas-welcome':'atlas-choose')}>
    <div className="atlas-grain" aria-hidden="true"/>
    <div className="atlas-shell">
      <header className="atlas-top">
        <button type="button" className="atlas-logo-button" onClick={isWelcome?undefined:onBack}
          disabled={isWelcome} aria-label={isWelcome?'万象书院':'返回万象书院首页'}>
          <BookSeal word="易"/>
          <span className="atlas-ident-text"><b>万象书院</b><small>中国传统术数 · 互动研习</small></span>
        </button>
        <button type="button" className="atlas-library" onClick={onStudy}>
          <span aria-hidden="true">◎</span> 藏经阁 <span>古籍 · 学堂 · 设置</span>
        </button>
      </header>

      {isWelcome ?
        <section className="atlas-hero atlas-cover-page" aria-label="万象书院欢迎页">
          <div className="atlas-hero-copy">
            <picture className="atlas-cover-painting" aria-hidden="true">
              <source media={COMPACT_LIST_QUERY} srcSet={academyLandscapeSmall}/>
              <img src={academyLandscape} alt="" width="1280" height="853"/>
            </picture>
            <p className="atlas-motto"><span className="atlas-line"/> 读天地之象 · 学古人之思</p>
            <h1>万象有数，<br/><em>问道于心。</em></h1>
            <p className="atlas-lead">一座可以亲手起卦、翻阅原典、循序研习的中国传统术数书院。</p>
            <div className="atlas-hero-actions">
              <button type="button" className="atlas-primary atlas-start" onClick={onStart}>
                开始研习 <span aria-hidden="true">→</span>
              </button>
              <button type="button" className="atlas-ghost" onClick={onStudy}>
                查阅典籍 · 藏经阁 ↗
              </button>
            </div>
          </div>
          <HomeExperiences onSelect={onSelect} activeIndex={homeExperience??localExperience}
            onIndexChange={setHomeExperience??setLocalExperience}/>
        </section>
      :
        <section className="atlas-selection atlas-choose-page" aria-label="择术入境">
          <div className="atlas-choose-heading">
            <button type="button" className="atlas-return" onClick={onBack}>
              ← 返回书院
            </button>
            <div>
              <h1>择术入境</h1>
            </div>
            <span className="atlas-choose-stamp" aria-hidden="true">择<br/>术</span>
          </div>
          <div className="atlas-filter" role="group" aria-label="术数分类">
            {GROUPS.map(g=><button type="button" key={g}
              aria-pressed={activeGroup===g} className={g===activeGroup?'active':''}
              onClick={()=>chooseGroup(g)}>{g}</button>)}
          </div>
          <div className="atlas-choice-book" key={activeGroup+'-'+(compactList?'all':index)}
            onTouchStart={e=>{startTouch.current=canPage&&e.touches.length===1?e.touches[0]:null}}
            onTouchCancel={()=>{startTouch.current=null}}
            onTouchEnd={e=>{
              const start=startTouch.current;startTouch.current=null
              if(!canPage||!start||!e.changedTouches?.length)return
              const t=e.changedTouches[0],dx=t.clientX-start.x,dy=t.clientY-start.y
              if(Math.abs(dx)<80||Math.abs(dx)<Math.abs(dy)*1.5)return
              choosePage(index+(dx<0?1:-1))
            }}>
            <div className="atlas-method-grid">
              {methods.map(method=><MethodCard key={method.id} method={method} onSelect={onSelect}/>)}
            </div>
          </div>
          {canPage&&<nav className="atlas-page-controls" aria-label="术数列表分页">
            <button type="button" className="atlas-page-arrow" disabled={index===0}
              onClick={()=>choosePage(index-1)}>← 上一页</button>
            <div className="atlas-page-indicators">
              {Array.from({length:pageCount},(_,i)=><button key={i} type="button"
                aria-label={'查看第'+(i+1)+'页'} aria-current={index===i?'page':undefined}
                className={index===i?'active':''} onClick={()=>choosePage(i)}>
                {String(i+1).padStart(2,'0')}
              </button>)}
              <span> / {String(pageCount).padStart(2,'0')}</span>
            </div>
            <button type="button" className="atlas-page-arrow" disabled={index===pageCount-1}
              onClick={()=>choosePage(index+1)}>下一页 →</button>
          </nav>}
          <div className="atlas-choice-help">
            <button type="button" onClick={onLearn}>第一次算卦？先学六爻与梅花基本操作 ↗</button>
            {onCases&&<button type="button" onClick={onCases}>进入案例交换中心 ↗</button>}
          </div>
        </section>
      }
      <footer className="atlas-footer">万象书院 · 一门一境，各循其法　｜　先明其理，再辨其事</footer>
    </div>
  </main>
}
