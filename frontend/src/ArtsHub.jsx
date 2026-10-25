import { useMemo, useRef } from 'react'
import './academy.css'

export const ARTS = [
  {id:'meihua',name:'梅花易数',title:'梅花心易',symbol:'☯',en:'MEIHUA YISHU',tone:'jade',
   brief:'一字一象，万物皆可起卦。',detail:'体用生克 · 先后天八卦 · 本互变卦',status:'完整排盘',group:'象数易'},
  {id:'liuyao',name:'六爻纳甲',title:'六爻铜钱',symbol:'☰',en:'LIUYAO',tone:'copper',
   brief:'三钱在掌，六掷自下而上。',detail:'三钱六掷 · 京房八宫 · 世应六亲 · 六神旬空',status:'纳甲装卦',group:'卜筮'},
  {id:'qimen',name:'奇门遁甲',title:'九宫遁甲',symbol:'九',en:'QIMEN DUNJIA',tone:'night',
   brief:'九宫为盘，观察时空的结构。',detail:'洛书九宫 · 方位 · 八门认识',status:'互动课堂',group:'三式'},
  {id:'bazi',name:'四柱八字',title:'干支四柱',symbol:'干',en:'FOUR PILLARS',tone:'amber',
   brief:'年、月、日、时，观干支历法。',detail:'天干地支 · 四柱结构 · 节气边界',status:'互动课堂',group:'命理'},
  {id:'liuren',name:'大六壬',title:'六壬天盘',symbol:'壬',en:'DA LIU REN',tone:'night',
   brief:'天盘地盘，古代三式之一。',detail:'十二支 · 四课三传 · 典籍导读',status:'典籍导览',group:'三式'},
  {id:'taiyi',name:'太乙神数',title:'太乙行宫',symbol:'乙',en:'TAI YI',tone:'jade',
   brief:'步宫推数，历法中的术数传统。',detail:'九宫 · 积年 · 原典入门',status:'典籍导览',group:'三式'},
  {id:'ziwei',name:'紫微斗数',title:'紫微星盘',symbol:'星',en:'ZIWEI DOUSHU',tone:'copper',
   brief:'十二宫垣，星曜的古典语言。',detail:'命盘结构 · 宫位星曜 · 流派边界',status:'典籍导览',group:'命理'},
  {id:'fengshui',name:'堪舆风水',title:'山川堪舆',symbol:'山',en:'KAN YU',tone:'amber',
   brief:'察山水形势，读空间的传统观念。',detail:'形势 · 理气 · 方位基础',status:'典籍导览',group:'空间'},
]

const GROUPS=['全部','象数易','卜筮','三式','命理','空间']
const CARD_LIMIT=4

function BookSeal({word}) {
  return <span className="atlas-seal" aria-hidden="true">{word}</span>
}

function InkLandscape() {
  return <svg className="academy-cover-landscape" viewBox="0 0 840 255" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <linearGradient id="land-fog" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#67836c" stopOpacity=".29"/>
        <stop offset="1" stopColor="#67836c" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="land-foreground" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#3e6653" stopOpacity=".24"/>
        <stop offset="1" stopColor="#3e6653" stopOpacity=".025"/>
      </linearGradient>
    </defs>
    <circle cx="600" cy="57" r="44" fill="#b5a077" opacity=".13"/>
    <path d="M0 206 L110 121 155 174 245 82 316 165 398 112 494 211 569 160 665 222 754 149 840 216V255H0Z" fill="url(#land-fog)"/>
    <path d="M0 240 L92 182 146 203 238 124 282 168 358 150 460 241 538 165 594 193 693 146 767 208 840 182V255H0Z" fill="url(#land-foreground)"/>
    <g stroke="#658272" fill="none" strokeWidth="1.4" strokeOpacity=".25">
      <path d="M221 153L245 82 290 133M526 187L569 160 618 200M683 169L754 149 820 202"/>
      <path d="M0 236 Q180 212 328 234 T638 227 T840 236" strokeDasharray="4 9"/>
    </g>
    <g transform="translate(515 158)" fill="#466f5c" opacity=".34">
      <path d="M0 54L37 54 37 17 0 17Z"/>
      <path d="M-10 19L18-3 47 19 40 20 18 8-4 20Z"/>
      <path d="M-6 12L18-10 42 12 34 11 18-2 2 11Z"/>
      <path d="M8 54V31Q18 23 28 31V54" fill="#ebdfc4"/>
    </g>
  </svg>
}

function OrbitArtwork() {
  return <div className="atlas-orbit" aria-hidden="true">
    <div className="atlas-orbit-ring outer"/>
    <div className="atlas-orbit-ring inner"/>
    {['乾','兑','离','震','巽','坎','艮','坤'].map((x,i)=>
      <span key={x} className="atlas-orbit-gua" style={{'--i':i}}>{x}</span>)}
    <div className="atlas-yinyang">
      <div className="atlas-taiji">
        <svg viewBox="0 0 100 100" width="100%" aria-hidden="true">
          <circle cx="50" cy="50" r="49" fill="#d1bf94" stroke="#e6d4aa"/>
          <path d="M50 1A49 49 0 0 0 50 99 A24.5 24.5 0 0 1 50 50 A24.5 24.5 0 0 0 50 1Z" fill="#173d35"/>
          <circle cx="50" cy="25.5" r="7" fill="#173d35"/>
          <circle cx="50" cy="74.5" r="7" fill="#d1bf94"/>
        </svg>
      </div>
      <small>象 · 数 · 理</small>
    </div>
  </div>
}

function MethodCard({method,onSelect}) {
  const index=ARTS.findIndex(a=>a.id===method.id)
  return <button type="button" className={'atlas-method '+method.tone+' atlas-method--'+method.id}
    onClick={()=>onSelect(method.id)} aria-label={'进入'+method.name+'，'+method.status}>
    <span className="atlas-method-top">
      <span className="atlas-method-no">第 {String(index+1).padStart(2,'0')} 门</span>
      <span className="atlas-method-status">{method.status}</span>
    </span>
    <span className="atlas-method-symbol" aria-hidden="true">{method.symbol}</span>
    <span className="atlas-method-identity" aria-hidden="true">{({meihua:"梅影 · 水墨",liuyao:"青铜 · 龟甲",qimen:"玄夜 · 九宫",bazi:"赤金 · 四柱",liuren:"沧海 · 天盘",taiyi:"云穹 · 太乙",ziwei:"星垣 · 紫微",fengshui:"山川 · 堪舆"})[method.id]}</span>
    <span className="atlas-method-en">{method.en}</span>
    <h3>{method.name}</h3>
    <p>{method.brief}</p>
    <small>{method.detail}</small>
    <span className="atlas-method-arrow">入此门 <b>↗</b></span>
  </button>
}

export default function ArtsHub({screen='home',onStart,onBack,onSelect,onStudy,onLearn,
  activeGroup='全部',setActiveGroup,page=0,setPage}) {
  const startTouch=useRef(null)
  const visible=useMemo(
    ()=>activeGroup==='全部'?ARTS:ARTS.filter(a=>a.group===activeGroup),
    [activeGroup]
  )
  const pageCount=Math.max(1,Math.ceil(visible.length/CARD_LIMIT))
  const index=Math.min(page,pageCount-1)
  const methods=visible.slice(index*CARD_LIMIT,(index+1)*CARD_LIMIT)
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
          <InkLandscape/>
          <div className="atlas-hero-copy">
            <p className="atlas-motto"><span className="atlas-line"/> 读天地之象 · 学古人之思</p>
            <h1>万象有数，<br/><em>问道于心。</em></h1>
            <p className="atlas-lead">一座可以亲手起卦、翻阅原典、循序研习的中国传统术数书院。</p>
            <div className="atlas-hero-actions">
              <button type="button" className="atlas-primary atlas-start" onClick={onStart}>
                开始研习 <span aria-hidden="true">→</span>
              </button>
              <button type="button" className="atlas-ghost" onClick={onLearn}>
                零基础 · 先学起卦 ↗
              </button>
            </div>
            <div className="atlas-entry-steps" aria-label="学习路径">
              <span><b>壹</b> 学算卦</span><i/>
              <span><b>贰</b> 亲手起卦</span><i/>
              <span><b>叁</b> 读盘明理</span>
            </div>
          </div>
          <OrbitArtwork/>
          <p className="atlas-cover-corner" aria-hidden="true">八 门 初 开 · 各 循 其 法</p>
        </section>
      :
        <section className="atlas-selection atlas-choose-page" aria-label="择术入境">
          <div className="atlas-choose-heading">
            <button type="button" className="atlas-return" onClick={onBack}>
              ← 返回书院
            </button>
            <div>
              <span className="atlas-eyebrow">第二页 · 选一门术，入一重境</span>
              <h1>择术入境</h1>
              <p>梅花、六爻、奇门、八字……各有其法。选定一门，便进入独立的起卦或研习空间。</p>
            </div>
            <span className="atlas-choose-stamp" aria-hidden="true">择<br/>术</span>
          </div>
          <div className="atlas-filter" role="group" aria-label="术数分类">
            {GROUPS.map(g=><button type="button" key={g}
              aria-pressed={activeGroup===g} className={g===activeGroup?'active':''}
              onClick={()=>chooseGroup(g)}>{g}</button>)}
          </div>
          <div className="atlas-choice-book" key={activeGroup+'-'+index}
            onTouchStart={e=>{const t=e.touches[0];startTouch.current={x:t.clientX,y:t.clientY}}}
            onTouchEnd={e=>{
              const start=startTouch.current;startTouch.current=null
              if(!start||!e.changedTouches?.length)return
              const t=e.changedTouches[0],dx=t.clientX-start.x,dy=t.clientY-start.y
              if(Math.abs(dx)<80||Math.abs(dx)<Math.abs(dy)*1.5)return
              choosePage(index+(dx<0?1:-1))
            }}>
            <div className="atlas-method-grid">
              {methods.map(method=><MethodCard key={method.id} method={method} onSelect={onSelect}/>)}
            </div>
          </div>
          <nav className="atlas-page-controls" aria-label="术数列表分页">
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
          </nav>
          <div className="atlas-choice-help">
            <span>梅花与六爻可实际排盘，其余门类逐步开放。尚未完成的算法不冒充已实现。</span>
            <button type="button" onClick={onLearn}>第一次算卦？先学六爻与梅花基本操作 ↗</button>
          </div>
        </section>
      }
      <footer className="atlas-footer">万象书院 · 一门一境，各循其法　｜　先明其理，再辨其事</footer>
    </div>
  </main>
}
