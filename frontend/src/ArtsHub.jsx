import { useMemo, useState } from 'react'
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

function BookSeal({word}){return <span className="atlas-seal">{word}</span>}

export default function ArtsHub({onSelect,onStudy}) {
  const [activeGroup,setActiveGroup]=useState('全部')
  const [featured,setFeatured]=useState('meihua')
  const groups=['全部','象数易','卜筮','三式','命理','空间']
  const visible=useMemo(()=>activeGroup==='全部'?ARTS:ARTS.filter(a=>a.group===activeGroup),[activeGroup])
  const current=ARTS.find(x=>x.id===featured)||ARTS[0]
  return <main className="atlas">
    <div className="atlas-grain" aria-hidden="true"/>
    <div className="atlas-shell">
      <header className="atlas-top">
        <div className="atlas-ident"><BookSeal word="易"/><div>
          <b>万象书院</b><span>中国传统术数 · 互动研习</span>
        </div></div>
        <button type="button" className="atlas-library" onClick={onStudy}>◎ 藏经阁 <span>古籍 · 学堂 · 设置</span></button>
      </header>
      <section className="atlas-hero">
        <div className="atlas-hero-copy">
          <p className="atlas-motto"><span className="atlas-line"/> 读天地之象 · 学古人之思</p>
          <h1>万象有数，<br/><em>问道于心。</em></h1>
          <p className="atlas-lead">择一门术，亲手起盘；读一卷书，细究其理。梅花、六爻、奇门、八字与更多古代术数，在这里从亲身体验开始。</p>
          <div className="atlas-hero-actions">
            <button className="atlas-primary" onClick={()=>onSelect('meihua')}>从梅花开始研习 <span>↗</span></button>
            <button className="atlas-ghost" onClick={onStudy}>先入藏经阁 →</button>
          </div>
          <p className="atlas-hero-note">每门术数各有算法与文献，不混合公式；未实现完整排盘的项目明确标注为互动课堂。</p>
        </div>
        <div className="atlas-orbit" aria-hidden="true">
          <div className="atlas-orbit-ring outer"/>
          <div className="atlas-orbit-ring inner"/>
          {['乾','兑','离','震','巽','坎','艮','坤'].map((x,i)=><span key={x} className="atlas-orbit-gua" style={{'--i':i}}>{x}</span>)}
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
      </section>
      <section className="atlas-selection">
        <div className="atlas-section-head">
          <div><span className="atlas-eyebrow">八门初启 · 一卷一世界</span><h2>择术入境</h2></div>
          <span className="atlas-side-caption">现开放梅花排盘、六爻纳甲基础装卦与两门互动课堂</span>
        </div>
        <div className="atlas-filter" role="group" aria-label="术数分类">
          {groups.map(g=><button key={g} className={g===activeGroup?'active':''} onClick={()=>setActiveGroup(g)}>{g}</button>)}
        </div>
        <div className="atlas-method-grid">
          {visible.map((a,i)=><button key={a.id} type="button"
            className={'atlas-method '+a.tone+(a.id===featured?' hovered':'')}
            onMouseEnter={()=>setFeatured(a.id)} onFocus={()=>setFeatured(a.id)}
            onClick={()=>onSelect(a.id)}>
            <div className="atlas-method-top"><span className="atlas-method-no">第 {String(ARTS.indexOf(a)+1).padStart(2,'0')} 门</span><span className="atlas-method-status">{a.status}</span></div>
            <div className="atlas-method-symbol">{a.symbol}</div>
            <span className="atlas-method-en">{a.en}</span>
            <h3>{a.name}</h3><p>{a.brief}</p>
            <small>{a.detail}</small>
            <span className="atlas-method-arrow">入此门 <b>↗</b></span>
          </button>)}
        </div>
      </section>
      <div className="atlas-extras">
        <button onClick={onStudy} className="atlas-extra">
          <span>藏经阁</span><h3>读原文，而不止听解说。</h3><p>《周易》《梅花易数》《增删卜易》《三命通会》等文献入口与课程导读。</p><b>入阁读书 ↗</b>
        </button>
        <button onClick={()=>onSelect('liuyao')} className="atlas-extra rust">
          <span>铜钱工坊</span><h3>手掷六次，亲自成卦。</h3><p>铜钱翻转，阴阳变化。每一次取数都保留当时的记录。</p><b>进入六爻工坊 ↗</b>
        </button>
      </div>
      <footer className="atlas-footer">万象书院 · 不以吉凶恐吓，不以符号替代现实。术数作为传统文化研习及个人反思工具。</footer>
    </div>
  </main>
}
