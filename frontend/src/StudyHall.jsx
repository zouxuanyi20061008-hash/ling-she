import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { CLASSICS, SOURCES } from './studyContent.js'
import { METHODS, REFERENCES, TEXTS } from './traditionContent.js'
import { ARTS } from './ArtsHub.jsx'
import { LIBRARY_STUDY, LIBRARY_TRIALS } from './libraryStudy.js'
import FullClassicReader from './FullClassicReader.jsx'
import StudyTrial from './StudyTrial.jsx'
import { PRACTICE_METHODS } from './practiceMethods.js'
import './library-trial-hub.css'

const TrialPractice=lazy(()=>import('./AcademyGames.jsx'))
const TrialCases=lazy(()=>import('./LearningRoutes.jsx'))
const isTrialView=view=>view==='quizmenu'||view==='quiz'

const SECTIONS=[
  {id:'bookshelf',number:'壹',title:'典籍',english:'THE ARCHIVES',tag:'古籍原文 · 逐章细读',glyph:'典',detail:'先读前人的话，再学怎样理解。'},
  {id:'courses',number:'贰',title:'修习',english:'THE CLASSROOM',tag:'一课一练',glyph:'習',detail:'每课讲一个知识点，学完就能动手。'},
  {id:'quizmenu',number:'叁',title:'试炼',english:'THE PRACTICE',tag:'入门闯关 · 完整演练',glyph:'练',detail:'从认卦、读盘练起，再亲手排盘和解读。'},
  {id:'settings',number:'肆',title:'设定',english:'THE SETTINGS',tag:'个人 API · 使用偏好',glyph:'设',detail:'自行配置 AI，古籍与排盘照常免费。'}
]
const STUDY_METHODS=[...METHODS,...ARTS.filter(art=>!METHODS.some(method=>method.id===art.id))
  .map(art=>({id:art.id,title:art.name,sub:art.title}))]
const NAMES=Object.fromEntries(STUDY_METHODS.map(m=>[m.id,m.title]))
const DEMO_METHODS=new Set(METHODS.map(method=>method.id))
const READING_PROGRESS_KEY='wanxiang-library-progress-v1'
function loadReadingProgress(){
  try{
    const stored=JSON.parse(window.localStorage.getItem(READING_PROGRESS_KEY)||'{}')
    if(!stored||typeof stored!=='object'||Array.isArray(stored))return {}
    return Object.fromEntries(Object.entries(stored).filter(([key,page])=>{
      const [kind,method,extra]=key.split(':')
      return extra===undefined&&Number.isInteger(page)&&page>=0&&
        ((['reader','fullreader'].includes(kind)&&DEMO_METHODS.has(method))||(kind==='lesson'&&Object.hasOwn(LIBRARY_STUDY,method)))
    }))
  }catch{return {}}
}
function booksFor(id){
  return id==='meihua'
    ? CLASSICS.map(c=>({...c,sourceUrl:SOURCES[c.source]}))
    : (TEXTS[id]||[]).map(c=>({...c,sourceUrl:c.sourceUrl||REFERENCES[id]}))
}
function StudySymbol({kind,playing=false}){
  return <div className={'library-demo '+kind+(playing?' playing':'')} aria-hidden="true">
    <div className="library-demo-ring"/>
    {kind==='liuyao'?<div className="library-demo-coins">{['乾','元','寶'].map((x,i)=><span key={i}>{x}</span>)}</div>:
      kind==='qimen'?<div className="library-demo-nine">{[4,9,2,3,5,7,8,1,6].map(n=><span key={n}>{n}</span>)}</div>:
      kind==='bazi'?<div className="library-demo-pillars">{['年','月','日','时'].map(x=><span key={x}>{x}<strong>甲子</strong></span>)}</div>:
      <div className="library-demo-trigrams">{['☰','☱','☲','☳','☴','☵','☶','☷'].map(x=><span key={x}>{x}</span>)}</div>}
    <small>{kind==='liuyao'?'三钱 · 六掷':kind==='qimen'?'洛书九宫':kind==='bazi'?'干支四柱':'象数 · 八卦'}</small>
  </div>
}

function MethodSelection({section,onSelect}){
  const bookshelf=section==='bookshelf'
  const courses=section==='courses'
  const methods=bookshelf?METHODS:STUDY_METHODS
  return <div className={'library-method-grid'+(bookshelf?'':' library-study-method-grid')}>
    {methods.map((method,i)=><button type="button" key={method.id} className={"library-method-card library-method--"+method.id} onClick={()=>onSelect(method.id)}>
      <span className="library-method-index">{bookshelf?
        `${String(i+1).padStart(2,'0')}　·　${method.bookStatus??method.status}`:
        courses?`${LIBRARY_STUDY[method.id].length} 课`:`${LIBRARY_TRIALS[method.id].length} 题`}</span>
      <strong>{method.title}</strong>
      <small>{bookshelf&&method.bookTitle?method.bookTitle:method.sub}</small>
      <span className="library-method-action">{bookshelf?'入卷研读':courses?'开始修习':'开始答题'} <b aria-hidden="true">↗</b></span>
    </button>)}
  </div>
}

function SectionHeading({small,title,desc}){
  return <div className="library-content-heading">
    <p>{small}</p><h2>{title}</h2><span>{desc}</span>
  </div>
}

function ZhouyiText({item}){
  const lineImages=item.lines.filter(line=>line.image)
  const commentaryLabels=[item.commentary&&'彖传',lineImages.length>0&&'小象传'].filter(Boolean).join('与')
  return <div className="library-zhouyi-text">
    <section className="library-zhouyi-passage" aria-label="卦辞">
      <h3>卦辞</h3>
      <p>{item.judgment}</p>
    </section>
    <section className="library-zhouyi-passage" aria-label="爻辞">
      <h3>爻辞</h3>
      <dl className="library-zhouyi-lines">
        {item.lines.map(line=><div key={line.name}><dt>{line.name}</dt><dd>{line.text}</dd></div>)}
      </dl>
    </section>
    {item.image&&<section className="library-zhouyi-passage" aria-label="大象传">
      <h3>大象传</h3>
      <p>{item.image}</p>
    </section>}
    {commentaryLabels&&<details className="library-zhouyi-commentary">
      <summary>查看{commentaryLabels}</summary>
      {item.commentary&&<section className="library-zhouyi-passage" aria-label="彖传">
        <h3>彖传</h3>
        <p>{item.commentary}</p>
      </section>}
      {lineImages.length>0&&<section className="library-zhouyi-passage" aria-label="小象传">
        <h3>小象传</h3>
        <dl className="library-zhouyi-lines">
          {lineImages.map(line=><div key={line.name}><dt>{line.name}</dt><dd>{line.image}</dd></div>)}
        </dl>
      </section>}
    </details>}
  </div>
}

function PageControls({index,total,onBack,onNext,firstLabel='上一页',lastLabel='下一页',doneLabel='完成',onFinish,disabled=false}){
  const end=index>=total-1
  return <nav className="library-page-controls" aria-label="翻页导航">
    <button type="button" className="library-prev" disabled={index===0||disabled} onClick={onBack}>← {firstLabel}</button>
    <div className="library-page-count" aria-live="polite">
      <strong>{String(index+1).padStart(2,'0')}</strong><span> / {String(total).padStart(2,'0')}</span>
      <div className="library-page-track" role="progressbar" aria-label="翻阅进度" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index+1}>
        <span style={{width:((index+1)/Math.max(1,total)*100)+'%'}}/>
      </div>
    </div>
    {end?<button type="button" className="library-next" onClick={onFinish} disabled={disabled}>{doneLabel} ↗</button>:
      <button type="button" className="library-next" onClick={onNext} disabled={disabled}>{lastLabel} →</button>}
  </nav>
}

function Locus({view,method,index,onClose,onLobby,onSection}){
  const reading=view==='reader'||view==='fullreader'
  const crumbs=[{label:'藏经阁',do:onLobby}]
  if(view!=='lobby'){
    const section=(reading?'bookshelf':view==='lesson'?'courses':view==='quiz'?'quizmenu':view)
    crumbs.push({label:SECTIONS.find(s=>s.id===section)?.title||section,do:()=>onSection(section)})
  }
  if(reading||['lesson','quiz'].includes(view))crumbs.push({label:NAMES[method],do:null})
  return <header className="library-topbar">
    <button className="library-brand" type="button" onClick={onLobby} title="返回藏经阁目录">
      <span className="library-brand-seal">藏</span>
      <span><strong>万象书院</strong><small>藏经阁 · 百家研习</small></span>
    </button>
    <nav className="library-crumbs" aria-label="当前位置">
      {crumbs.map((c,i)=><span key={i}>
        {i>0&&<em>／</em>}
        {c.do?<button type="button" onClick={c.do}>{c.label}</button>:<b>{c.label}</b>}
      </span>)}
      {(reading||view==='lesson')&&<span className="library-crumb-page">· 第 {index+1} {view==='lesson'?'课':'页'}</span>}
    </nav>
    <button className="library-exit" type="button" onClick={onClose}>返回书院 <span>↗</span></button>
  </header>
}

export default function StudyHall({onClose,onPractice,apiKey,setApiKey,aiModel,setAiModel,accessCode,setAccessCode,
  trialRoute=false,onTrialRouteChange,trialPanel,onTrialPanelChange,
  trialExperienceIndex,onTrialExperienceChange,onTrialWorkshop}){
  const [view,setView]=useState(()=>trialRoute?'quizmenu':'lobby')
  const [method,setMethod]=useState('meihua')
  const [index,setIndex]=useState(0)
  const [playing,setPlaying]=useState(false)
  const [trialMode,setTrialMode]=useState('round')
  const [readerLesson,setReaderLesson]=useState(null)
  const [reveal,setReveal]=useState(false)
  const [notice,setNotice]=useState('')
  const [readingProgress,setReadingProgress]=useState(loadReadingProgress)
  const [localTrialPanel,setLocalTrialPanel]=useState('practice')
  const [practiceOpened,setPracticeOpened]=useState(false)
  const [casesOpened,setCasesOpened]=useState(false)
  const [localExperienceIndex,setLocalExperienceIndex]=useState(0)
  const activeTrialPanel=trialPanel??localTrialPanel
  const selectTrialPanel=onTrialPanelChange??setLocalTrialPanel
  const activeExperienceIndex=trialExperienceIndex??localExperienceIndex
  const selectExperience=onTrialExperienceChange??setLocalExperienceIndex
  const swipe=useRef(null)
  useEffect(()=>{
    try{window.localStorage.setItem(READING_PROGRESS_KEY,JSON.stringify(readingProgress))}catch{}
  },[readingProgress])
  useEffect(()=>{
    setView(current=>{
      if(isTrialView(current)===trialRoute)return current
      return trialRoute?'quizmenu':'lobby'
    })
  },[trialRoute])
  useEffect(()=>{
    if(trialRoute&&activeTrialPanel==='cases')setView('quizmenu')
  },[trialRoute,activeTrialPanel])

  const reading=view==='reader'||view==='fullreader'
  const sectionId=reading?'bookshelf':view==='lesson'?'courses':view==='quiz'?'quizmenu':view
  const section=SECTIONS.find(s=>s.id===sectionId)
  const lessons=LIBRARY_STUDY[method]
  const items=view==='reader'?booksFor(method):view==='lesson'?lessons:[]
  const item=items[index]
  const zhouyiReader=view==='reader'&&method==='zhouyi'
  const relatedExperience=PRACTICE_METHODS.findIndex(({id})=>id===(method==='zhouyi'?'meihua':method))
  const resumeEntries=view==='bookshelf'
    ? METHODS.flatMap(entry=>['reader','fullreader'].map(kind=>({entry,kind,page:readingProgress[`${kind}:${entry.id}`]})))
        .filter(({entry,kind,page})=>page>0&&(kind==='fullreader'||page<booksFor(entry.id).length))
    : view==='courses'?STUDY_METHODS.map(entry=>({entry,kind:'lesson',page:readingProgress[`lesson:${entry.id}`]}))
        .filter(({entry,page})=>page>0&&page<LIBRARY_STUDY[entry.id].length):[]
  function savePage(kind,id,page){
    setReadingProgress(previous=>({...previous,[kind+':'+id]:page}))
  }
  function rememberPage(page){
    if(reading||view==='lesson')savePage(view,method,page)
  }
  const navigate=(next,page=0,panel=activeTrialPanel)=>{
    const trial=isTrialView(next)
    if(trial!==isTrialView(view)){
      if(trial&&(panel==='cases'||activeTrialPanel==='cases'))onTrialRouteChange?.(true,panel)
      else onTrialRouteChange?.(trial)
    }
    setView(next);setIndex(page);setPlaying(false);setReaderLesson(null);setNotice('')
    window.scrollTo({top:0,behavior:'instant'})
  }
  function enter(methodId){
    const nextView=view==='bookshelf'?(methodId==='zhouyi'?'reader':'fullreader'):view==='courses'?'lesson':'quiz'
    setMethod(methodId)
    if(nextView==='quiz')setTrialMode('round')
    navigate(nextView)
  }
  function resume({entry,kind,page}){
    setMethod(entry.id)
    navigate(kind,page)
  }
  function switchReading(kind){
    const saved=readingProgress[`${kind}:${method}`]??0
    navigate(kind,saved)
    setReaderLesson(readerLesson)
  }
  function turnPage(page){
    rememberPage(page);setIndex(page);setPlaying(false)
    window.scrollTo({top:0,behavior:'instant'})
  }
  function prev(){if(index>0)turnPage(index-1)}
  function next(){if(index+1<items.length)turnPage(index+1)}
  function startTrial(page,mode){
    switchTrialPanel('quiz')
    setTrialMode(mode)
    navigate('quiz',page,'quiz')
  }
  function openPractice(panel){
    selectExperience(relatedExperience)
    switchTrialPanel(panel)
    navigate('quizmenu',0,panel)
  }
  function switchTrialPanel(panel){
    if(view==='quizmenu'&&activeTrialPanel==='practice')setPracticeOpened(true)
    if(view==='quizmenu'&&activeTrialPanel==='cases')setCasesOpened(true)
    selectTrialPanel(panel)
    if(panel!==activeTrialPanel)window.scrollTo({top:0,behavior:'instant'})
  }
  function openLesson(page){
    savePage('lesson',method,page)
    navigate('lesson',page)
  }
  function readFromLesson(page){
    savePage('reader',method,page)
    navigate('reader',page)
    setReaderLesson(index)
  }
  function back(){
    if(view==='lobby'){onClose();return}
    if(reading){readerLesson===null?navigate('bookshelf'):openLesson(readerLesson);return}
    if(view==='lesson'){navigate('courses');return}
    if(view==='quiz'){navigate('quizmenu');return}
    navigate('lobby')
  }
  useEffect(()=>{
    function keys(e){
      if(e.key==='Escape'){back();return}
      if(!['reader','lesson'].includes(view)||e.target.closest?.('input,select,textarea,button,a'))return
      if(e.key==='ArrowLeft'&&index>0)prev()
      if(e.key==='ArrowRight'&&index<items.length-1)next()
    }
    window.addEventListener('keydown',keys)
    return ()=>window.removeEventListener('keydown',keys)
  },[view,method,index,items.length,readerLesson,onClose])
  function swipeStart(e){
    if(!['reader','lesson'].includes(view)||e.target.closest?.('input,select,textarea,button,a'))return
    const t=e.touches?.[0]
    if(t)swipe.current={x:t.clientX,y:t.clientY}
  }
  function swipeEnd(e){
    const origin=swipe.current;swipe.current=null
    if(!origin||!e.changedTouches?.[0])return
    const t=e.changedTouches[0],dx=t.clientX-origin.x,dy=t.clientY-origin.y
    if(Math.abs(dx)<85||Math.abs(dx)<Math.abs(dy)*1.6)return
    if(dx>0)prev();else next()
  }

  return <main className={"library-stage library-stage--"+(view==='lobby'?'archive':view==='quizmenu'?'trial':method)}
    data-trial-panel={view==='quizmenu'?activeTrialPanel:undefined}>
    <div className="library-shell">
      <Locus view={view} method={method} index={index} onClose={onClose}
        onLobby={()=>navigate('lobby')} onSection={navigate}/>
      <div className="library-inner">
        {view!=='lobby'&&<nav className="library-secondary-nav" aria-label="藏经阁快捷栏目">
          <button type="button" className="library-back-button" onClick={back}>← 返回{reading?(readerLesson===null?'典籍目录':'本课'):view==='lesson'?'课程目录':view==='quiz'?'练习目录':'藏经阁'}</button>
          <div className="library-section-links">
            {SECTIONS.map(s=><button type="button" key={s.id} className={sectionId===s.id?'active':''}
              aria-current={sectionId===s.id?'page':undefined} onClick={()=>navigate(s.id)}>{s.title}</button>)}
          </div>
        </nav>}

        <div className="library-turn" key={isTrialView(view)?'trial':`${view}-${method}${view==='reader'?`-${index}`:''}`}
          onTouchStart={swipeStart} onTouchEnd={swipeEnd}>
          {view==='lobby'&&<section className="library-lobby" aria-label="藏经阁目录">
            <div className="library-lobby-title">
              <p className="library-eyebrow">万卷藏心 · 格物求理</p>
              <h1>一卷古今，<em>见天地心。</em></h1>
              <p>先读古籍，循序修习，再亲自排盘与复盘。每门术数各循其法，不以传闻替代原典。</p>
            </div>
            <div className="library-gateway-grid">
              {SECTIONS.map(s=><button type="button" className={'library-gateway '+s.id} key={s.id} onClick={()=>navigate(s.id)}>
                <span className="library-gateway-top"><b>{s.number} · {s.title}</b><small>{s.english}</small></span>
                <strong className="library-gateway-glyph" aria-hidden="true">{s.glyph}</strong>
                <span className="library-gateway-description">{s.detail}</span>
                <span className="library-gateway-bottom">{s.tag}<b>→</b></span>
              </button>)}
            </div>
            <button className="library-action" type="button" onClick={onPractice}>先动手练起卦：六爻与梅花零基础课 →</button>
            <p className="library-lobby-foot">点选一阁进入专属页面；每一章节、每一节课和每一道练习都能独立翻页。</p>
          </section>}

          {['bookshelf','courses'].includes(view)&&<section className="library-directory">
            <SectionHeading
              small={section.number+' · '+section.english}
              title={view==='bookshelf'?'择卷研读':'择门修习'}
              desc={view==='bookshelf'?'按卦序读《周易》经文与十翼，或选其他古籍逐卷读原文。每篇附底本出处。':
                '选一门，从第一课开始。也可以直接选课，做对应的小挑战。'}/>
            {resumeEntries.length>0&&<aside className="library-resume" aria-label="藏经阁断点续读">
              <div className="library-resume-title"><strong>续读 · 接着上次的位置</strong><small>进度仅存于当前浏览器</small></div>
              <div className="library-resume-links">{resumeEntries.map(({entry,kind,page})=>
                <button type="button" key={`${kind}:${entry.id}`} onClick={()=>resume({entry,kind,page})}>
                  {entry.title}{entry.id==='zhouyi'&&kind==='fullreader'?'易传':kind==='reader'&&entry.id!=='zhouyi'?'选读':''}
                  {' · 第 '}{page+1} {kind==='lesson'?'课':entry.id==='zhouyi'&&kind==='reader'?'卦':'篇'} <span aria-hidden="true">→</span>
                </button>)}</div>
            </aside>}
            <MethodSelection section={view} onSelect={enter}/>
            {view==='bookshelf'&&<p className="library-directory-note">阅读时可按卦或篇章直达，也能接着上次的位置继续。</p>}
          </section>}

          {isTrialView(view)&&<section className="library-trial-hub" aria-labelledby="library-trial-title"
            data-panel={activeTrialPanel} hidden={view!=='quizmenu'}>
            <header className="library-trial-hub-header">
              <h2 id="library-trial-title">入境试炼</h2>
              <div className="library-trial-tabs" role="group" aria-label="试炼方式">
                <button type="button" aria-pressed={activeTrialPanel==='practice'} onClick={()=>switchTrialPanel('practice')}>动手试炼</button>
                <button type="button" aria-pressed={activeTrialPanel==='cases'} onClick={()=>switchTrialPanel('cases')}>完整演练</button>
                <button type="button" aria-pressed={activeTrialPanel==='quiz'} onClick={()=>switchTrialPanel('quiz')}>课后答题</button>
              </div>
            </header>
            {(activeTrialPanel==='practice'||practiceOpened)&&<div hidden={activeTrialPanel!=='practice'}>
              <Suspense fallback={<p className="library-trial-loading" role="status">正在打开动手试炼…</p>}>
                <TrialPractice activeIndex={activeExperienceIndex} onIndexChange={selectExperience} onSelect={onTrialWorkshop}/>
              </Suspense>
            </div>}
            {(activeTrialPanel==='cases'||casesOpened)&&<div hidden={activeTrialPanel!=='cases'}>
              <Suspense fallback={<p className="library-trial-loading" role="status">正在打开完整演练…</p>}>
                <TrialCases activeIndex={activeExperienceIndex} onIndexChange={selectExperience}/>
              </Suspense>
            </div>}
            {activeTrialPanel==='quiz'&&
              <div className="library-directory library-trial-quiz-directory">
                <p className="library-trial-quiz-intro">选一门开始连练，也能直接选题。卡住时可以看提示或回顾本课。</p>
                <MethodSelection section="quizmenu" onSelect={enter}/>
              </div>}
          </section>}

          {view==='reader'&&item&&<section className="library-reading-screen">
            <div className="library-reading-edition">
              <span>{zhouyiReader?'六十四卦 · 上经与下经':'课程选读'}</span>
              <button type="button" onClick={()=>switchReading('fullreader')}>{zhouyiReader?'读易传 ↗':'阅读全书 ↗'}</button>
            </div>
            <div className="library-book-head">
              <span className="library-eyebrow">典籍 · {NAMES[method]} · 第 {index+1} {zhouyiReader?'卦':'则'}</span>
              <div className="library-chapter-menu">
                <label htmlFor="library-chapter">{zhouyiReader?'选择卦象':'选择篇章'}</label>
                <select id="library-chapter" value={index} onChange={e=>turnPage(Number(e.target.value))}>
                  {zhouyiReader?<>
                    <optgroup label="上经">
                      {items.slice(0,30).map((c,i)=><option value={i} key={c.id}>{i+1}. {c.heading} · {c.pinyin}</option>)}
                    </optgroup>
                    <optgroup label="下经">
                      {items.slice(30).map((c,i)=><option value={i+30} key={c.id}>{i+31}. {c.heading} · {c.pinyin}</option>)}
                    </optgroup>
                  </>:items.map((c,i)=><option value={i} key={c.id}>{i+1}. {c.heading}</option>)}
                </select>
              </div>
            </div>
            <nav className="library-reader-quick" aria-label="藏经阁快速翻篇">
              <button type="button" disabled={index===0} onClick={prev}>← {zhouyiReader?'上一卦':'上一篇'}</button>
              <span>第 {index+1} {zhouyiReader?'卦':'篇'} / 共 {items.length} {zhouyiReader?'卦':'篇'}</span>
              {index===items.length-1?
                <button type="button" className="library-reader-quick-next" onClick={()=>navigate('bookshelf')}>返回目录 ↑</button>:
                <button type="button" className="library-reader-quick-next" onClick={next}>{zhouyiReader?'下一卦':'下一篇'} →</button>}
            </nav>
            <article className="library-page-paper">
              <div className="library-paper-line"><span>{zhouyiReader?'经传原文':'原典选读'}</span><span>{item.volume}</span></div>
              <p className="library-text-section">{item.section}</p>
              <h2>{zhouyiReader?<ruby>{item.heading}<rt lang="zh-Latn-pinyin">{item.pinyin}</rt></ruby>:item.heading}</h2>
              {zhouyiReader&&item.alternatePinyin&&<p className="library-alternate-pinyin">今读也见 <span lang="zh-Latn-pinyin">{item.alternatePinyin}</span></p>}
              {zhouyiReader?<ZhouyiText item={item}/>:<blockquote className="library-original">{item.original}</blockquote>}
              {(item.explanation||item.note)&&<div className="library-reading-grid">
                {item.explanation&&<section><b>今释 · 通其意</b><p>{item.explanation}</p></section>}
                {item.note&&<section><b>辨析 · 知其界</b><p>{item.note}</p></section>}
              </div>}
              <div className="library-source">
                {zhouyiReader?
                  <span>卦序依通行本，原文据维基文库整理。<br/>卦名音读参照 <a className="library-source-license" href="https://zh.wikisource.org/wiki/經典釋文_(四庫全書本)/卷02" target="_blank" rel="noopener noreferrer">《经典释文·周易音义》</a>。转录整理许可 <a className="library-source-license" href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a></span>:
                  <span>此为选段或整理文字，请以完整古籍为准；非离线全文。</span>}
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">核对原典 ↗</a>
              </div>
            </article>
            <PageControls index={index} total={items.length} onBack={prev} onNext={next}
              firstLabel={zhouyiReader?'上一卦':undefined} lastLabel={zhouyiReader?'下一卦':undefined}
              doneLabel="返回目录" onFinish={()=>navigate('bookshelf')}/>
          </section>}

          {view==='fullreader'&&<FullClassicReader method={method} page={index} onPage={turnPage}
            onExit={back} onAlternate={method==='zhouyi'?()=>switchReading('reader'):undefined} alternateLabel="回六十四卦 ↗"/>}

          {view==='lesson'&&item&&<section className="library-learning-screen">
            <div className="library-book-head library-study-head">
              <span className="library-eyebrow">修习 · {NAMES[method]}</span>
              <div className="library-chapter-menu">
                <label htmlFor="library-lesson-select">选择课程</label>
                <select id="library-lesson-select" value={index} onChange={e=>turnPage(Number(e.target.value))}>
                  {items.map((lesson,i)=><option key={lesson.id} value={i}>{i+1}. {lesson.title}</option>)}
                </select>
              </div>
            </div>
            <article className="library-lesson-paper">
              <div className="library-paper-line"><span>第 {index+1} 课</span><span>共 {items.length} 课</span></div>
              <h2>{item.title}</h2>
              {item.summary&&<p className="library-lesson-sub">{item.summary}</p>}
              <div className="library-lesson-actions">
                <button type="button" className="library-action" onClick={()=>startTrial(index,'single')}>本课试炼 <span aria-hidden="true">→</span></button>
                {Number.isInteger(item.readingIndex)&&<button type="button" className="library-action secondary"
                  onClick={()=>readFromLesson(item.readingIndex)}>读原典 <span aria-hidden="true">↗</span></button>}
              </div>
              <div className="library-lesson-text">{item.paragraphs.map((p,i)=><p key={i}>{p}</p>)}</div>
              {item.example&&<div className="library-lesson-example"><b>例子</b><p>{item.example}</p></div>}
              {relatedExperience>=0&&<div className="library-lesson-practice-links">
                <button type="button" className="library-trial-lesson-link" onClick={()=>openPractice('practice')}>
                  动手练这一门 <span aria-hidden="true">→</span>
                </button>
                <button type="button" className="library-trial-lesson-link" onClick={()=>openPractice('cases')}>
                  做完整演练 <span aria-hidden="true">→</span>
                </button>
              </div>}
              {DEMO_METHODS.has(method)&&<details className="library-lesson-demo" key={item.id}
                onToggle={e=>{if(!e.currentTarget.open)setPlaying(false)}}>
                <summary>查看概念图</summary>
                <div className="library-lesson-visual">
                  <StudySymbol kind={method} playing={playing}/>
                  <button type="button" className="library-play" onClick={()=>setPlaying(p=>!p)}>
                    {playing?'■ 停止演示':'▷ 播放演示'}
                  </button>
                </div>
              </details>}
            </article>
            <PageControls index={index} total={items.length} onBack={prev} onNext={next}
              doneLabel="本课练习" onFinish={()=>startTrial(index,'single')}/>
          </section>}

          {view==='quiz'&&<StudyTrial key={`${method}-${index}-${trialMode}`} name={NAMES[method]} lessons={lessons}
            trials={LIBRARY_TRIALS[method]} start={index} mode={trialMode}
            onSelect={i=>startTrial(i,'single')} onRound={i=>startTrial(i,'round')}
            onLesson={openLesson} onExit={()=>navigate('quizmenu')}/>}

          {view==='settings'&&<section className="library-settings-screen">
            <SectionHeading small="肆 · AI 接入" title="书房设定" desc="基础排盘、阅读与课程不需要 AI。只有调用模型进行深入解读时，才需要个人密钥或站长服务器配置。"/>
            <div className="library-settings-grid">
              <div className="library-settings-paper">
                <div className="library-paper-line"><span>私人设置</span><span>DEEPSEEK</span></div>
                <div className="library-key-status">
                  <strong>个人临时 API 密钥</strong>
                  <span className={apiKey?'filled':''}>{apiKey?'已填写 · 尚未验证':'尚未填写'}</span>
                </div>
                <div className="library-setting-label"><label htmlFor="library-api-key">DeepSeek API Key</label>
                  <div className="library-key-input">
                    <input id="library-api-key" type={reveal?'text':'password'} autoComplete="off" spellCheck={false}
                      value={apiKey} onChange={e=>{setApiKey(e.target.value);setNotice(e.target.value?'密钥已在本次会话填写，尚未验证':'已清空密钥')}}
                      placeholder="sk-••••••••••" aria-label="个人 DeepSeek API Key"/>
                    <button type="button" aria-controls="library-api-key" onClick={()=>setReveal(r=>!r)}>{reveal?'隐藏':'显示'}</button>
                  </div>
                </div>
                <label className="library-setting-label">选择模型
                  <select value={aiModel} onChange={e=>{setAiModel(e.target.value);setNotice('已选择 '+e.target.value)}}>
                    <option value="deepseek-flash">DeepSeek Flash（快速）</option>
                    <option value="deepseek-v4-pro">DeepSeek V4 Pro（深入）</option>
                  </select>
                </label>
                <label className="library-setting-label">站长访问码（可留空）
                  <input type="password" autoComplete="off" value={accessCode}
                    onChange={e=>{setAccessCode(e.target.value);setNotice(e.target.value?'访问码已在本次会话填写':'访问码已清空')}} placeholder="仅在服务器设置访问码时需要"/>
                </label>
                <div className="library-key-actions">
                  <button type="button" onClick={()=>{setApiKey('');setReveal(false);setNotice('个人密钥已清空')}} disabled={!apiKey}>清除密钥</button>
                  <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer">密钥控制台 ↗</a>
                </div>
                <p className="library-setting-notice" role="status">{notice||'设置仅在本次浏览器页面内存中生效，刷新后需要重新填写。'}</p>
              </div>
              <aside className="library-settings-note">
                <span className="library-notebook-seal">慎</span>
                <h3>用 AI，也要知其界。</h3>
                <p>你的个人密钥只保留在当前网页内存中。请求会通过本站 HTTPS 后端转发至 DeepSeek，不会写入浏览器本地存储。</p>
                <p>站长如需长期配置，应通过 Render 的 Environment 设置 <code>LLM_API_KEY</code>，并建议设置 <code>AI_ACCESS_CODE</code>。</p>
                <p>不要在问题与背景里填写隐私信息。AI 的解卦属于文化学习与辅助思考，不替代专业意见。</p>
              </aside>
            </div>
          </section>}
        </div>
        <footer className="library-footer"><span>藏经阁 · 以古籍为师，以事实为鉴</span>
          <button type="button" onClick={()=>navigate('lobby')}>返回总目录 ↑</button>
        </footer>
      </div>
    </div>
  </main>
}
