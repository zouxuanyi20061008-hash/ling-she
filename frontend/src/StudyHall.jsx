import { useEffect, useRef, useState } from 'react'
import { CLASSICS, LESSONS, QUIZZES, SOURCES } from './studyContent.js'
import { METHODS, REFERENCES, TEXTS, COURSE, COURSE_QUIZ } from './traditionContent.js'
import './library.css'

const SECTIONS=[
  {id:'bookshelf',number:'壹',title:'典籍',english:'THE ARCHIVES',tag:'古籍原文 · 逐章细读',glyph:'典',detail:'先读前人的话，再学怎样理解。'},
  {id:'courses',number:'贰',title:'修习',english:'THE CLASSROOM',tag:'分门课程 · 动态演示',glyph:'習',detail:'从象数基础，逐步走向实战。'},
  {id:'quizmenu',number:'叁',title:'试炼',english:'THE PRACTICE',tag:'一题一页 · 即答即解',glyph:'问',detail:'亲自作答，验证有没有学懂。'},
  {id:'settings',number:'肆',title:'设定',english:'THE SETTINGS',tag:'个人 API · 使用偏好',glyph:'设',detail:'自行配置 AI，古籍与排盘照常免费。'}
]
const NAMES=Object.fromEntries(METHODS.map(m=>[m.id,m.title]))
const QUAD=['甲','乙','丙','丁']
function booksFor(id){
  return id==='meihua'
    ? CLASSICS.map(c=>({...c,sourceUrl:SOURCES[c.source]}))
    : (TEXTS[id]||[]).map(c=>({...c,sourceUrl:REFERENCES[id]}))
}
function lessonsFor(id){
  return id==='meihua'?LESSONS.map(l=>({
    title:l.title,kicker:l.level,sub:l.subtitle,
    paragraphs:l.paragraphs,example:l.example
  })):(COURSE[id]||[]).map((l,i)=>({
    title:l[0],kicker:'第 '+(i+1)+' 课',sub:'循序研习',
    paragraphs:l.slice(1),example:null
  }))
}
function questionsFor(id){
  return id==='meihua'
    ? QUIZZES.map(q=>({question:q.question,options:q.options,answer:q.answer,why:q.why}))
    : (COURSE_QUIZ[id]||[]).map(q=>({question:q.q,options:q.a,answer:q.correct,why:q.why}))
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
  return <div className="library-method-grid">
    {METHODS.map((method,i)=><button type="button" key={method.id} className="library-method-card" onClick={()=>onSelect(method.id)}>
      <span className="library-method-index">{String(i+1).padStart(2,'0')}　·　{method.status}</span>
      <strong>{method.title}</strong>
      <small>{method.sub}</small>
      <span className="library-method-action">{section==='bookshelf'?'入卷研读':section==='courses'?'开始修习':'开始答题'} <b>↗</b></span>
    </button>)}
  </div>
}

function SectionHeading({small,title,desc}){
  return <div className="library-content-heading">
    <p>{small}</p><h2>{title}</h2><span>{desc}</span>
  </div>
}

function PageControls({index,total,onBack,onNext,firstLabel='上一页',lastLabel='下一页',doneLabel='完成',onFinish,disabled=false}){
  const end=index>=total-1
  return <nav className="library-page-controls" aria-label="翻页导航">
    <button type="button" className="library-prev" disabled={index===0||disabled} onClick={onBack}>← {firstLabel}</button>
    <div className="library-page-count" aria-live="polite">
      <strong>{String(index+1).padStart(2,'0')}</strong><span> / {String(total).padStart(2,'0')}</span>
      <div className="library-page-track"><span style={{width:((index+1)/Math.max(1,total)*100)+'%'}}/></div>
    </div>
    {end?<button type="button" className="library-next" onClick={onFinish} disabled={disabled}>{doneLabel} ↗</button>:
      <button type="button" className="library-next" onClick={onNext} disabled={disabled}>{lastLabel} →</button>}
  </nav>
}

function Locus({view,method,index,onClose,onLobby,onSection}){
  const crumbs=[{label:'藏经阁',do:onLobby}]
  if(view!=='lobby'){
    const section=(view==='reader'?'bookshelf':view==='lesson'?'courses':view==='quiz'?'quizmenu':view)
    crumbs.push({label:SECTIONS.find(s=>s.id===section)?.title||section,do:()=>onSection(section)})
  }
  if(['reader','lesson','quiz'].includes(view))crumbs.push({label:NAMES[method],do:null})
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
      {['reader','lesson','quiz'].includes(view)&&<span className="library-crumb-page">· 第 {index+1} 页</span>}
    </nav>
    <button className="library-exit" type="button" onClick={onClose}>返回书院 <span>↗</span></button>
  </header>
}

export default function StudyHall({onClose,apiKey,setApiKey,aiModel,setAiModel,accessCode,setAccessCode}){
  const [view,setView]=useState('lobby')
  const [method,setMethod]=useState('meihua')
  const [index,setIndex]=useState(0)
  const [playing,setPlaying]=useState(false)
  const [choice,setChoice]=useState(null)
  const [correct,setCorrect]=useState(0)
  const [quizComplete,setQuizComplete]=useState(false)
  const [reveal,setReveal]=useState(false)
  const [notice,setNotice]=useState('')
  const swipe=useRef(null)

  const sectionId=view==='reader'?'bookshelf':view==='lesson'?'courses':view==='quiz'?'quizmenu':view
  const section=SECTIONS.find(s=>s.id===sectionId)
  const items=view==='reader'?booksFor(method):view==='lesson'?lessonsFor(method):view==='quiz'?questionsFor(method):[]
  const item=items[index]
  const viewingPages=['reader','lesson','quiz'].includes(view)
  const navigate=(next)=>{
    setView(next);setIndex(0);setChoice(null);setCorrect(0);setQuizComplete(false);setPlaying(false);setNotice('')
    window.scrollTo({top:0,behavior:'instant'})
  }
  function enter(methodId){
    setMethod(methodId);setIndex(0);setChoice(null);setCorrect(0);setQuizComplete(false);setPlaying(false)
    setView(view==='bookshelf'?'reader':view==='courses'?'lesson':'quiz')
    setNotice('')
    window.scrollTo({top:0,behavior:'instant'})
  }
  function prev(){if(index>0){setIndex(i=>i-1);setPlaying(false);setNotice('');window.scrollTo({top:0,behavior:'instant'})}}
  function next(){
    if(index+1<items.length){
      setIndex(i=>i+1);setPlaying(false);setChoice(null);setNotice('')
      window.scrollTo({top:0,behavior:'instant'})
    }
  }
  function back(){
    if(view==='lobby'){onClose();return}
    if(view==='reader'){navigate('bookshelf');return}
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
  },[view,index,items.length,onClose])
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

  const quiz=items[index]
  const answered=choice!==null
  return <main className="library-stage">
    <div className="library-shell">
      <Locus view={view} method={method} index={index} onClose={onClose}
        onLobby={()=>navigate('lobby')} onSection={navigate}/>
      <div className="library-inner">
        {view!=='lobby'&&<nav className="library-secondary-nav" aria-label="藏经阁快捷栏目">
          <button type="button" className="library-back-button" onClick={back}>← 返回{view==='reader'?'典籍目录':view==='lesson'?'课程目录':view==='quiz'?'练习目录':'藏经阁'}</button>
          <div className="library-section-links">
            {SECTIONS.map(s=><button type="button" key={s.id} className={sectionId===s.id?'active':''}
              aria-current={sectionId===s.id?'page':undefined} onClick={()=>navigate(s.id)}>{s.title}</button>)}
          </div>
        </nav>}

        <div className="library-turn" key={view+'-'+method+'-'+index+(quizComplete?'-done':'')}
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
            <p className="library-lobby-foot">点选一阁进入专属页面；每一章节、每一节课和每一道练习都能独立翻页。</p>
          </section>}

          {['bookshelf','courses','quizmenu'].includes(view)&&<section className="library-directory">
            <SectionHeading
              small={section.number+' · '+section.english}
              title={view==='bookshelf'?'择卷研读':view==='courses'?'择门修习':'入境试炼'}
              desc={view==='bookshelf'?'五系古籍选读与原文链接。每页一章，原文、释义和辨析分别标明。':
                view==='courses'?'选择一门术数，逐课翻阅；配有互动概念演示。':
                '选择一种术数进行练习；每答完一题，立刻呈现解析。'}/>
            <MethodSelection section={view} onSelect={enter}/>
            <p className="library-directory-note">目前是精选入门篇目，并非已完整收录所有古籍。原文出处可在具体篇章中打开核对。</p>
          </section>}

          {view==='reader'&&item&&<section className="library-reading-screen">
            <div className="library-book-head">
              <span className="library-eyebrow">典籍 · {NAMES[method]} · 第 {index+1} 则</span>
              <div className="library-chapter-menu">
                <label htmlFor="library-chapter">选择篇章</label>
                <select id="library-chapter" value={index} onChange={e=>{setIndex(Number(e.target.value));window.scrollTo({top:0,behavior:'instant'})}}>
                  {items.map((c,i)=><option value={i} key={c.id}>{i+1}. {c.heading}</option>)}
                </select>
              </div>
            </div>
            <article className="library-page-paper">
              <div className="library-paper-line"><span>原典选读</span><span>{item.volume}</span></div>
              <p className="library-text-section">{item.section}</p>
              <h2>{item.heading}</h2>
              <blockquote className="library-original">{item.original}</blockquote>
              <div className="library-reading-grid">
                <section><b>今释 · 通其意</b><p>{item.explanation}</p></section>
                <section><b>辨析 · 知其界</b><p>{item.note}</p></section>
              </div>
              <div className="library-source">
                <span>此为选段或整理文字，请以完整古籍为准；非离线全文。</span>
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">核对原典 ↗</a>
              </div>
            </article>
            <PageControls index={index} total={items.length} onBack={prev} onNext={next}
              doneLabel="返回目录" onFinish={()=>navigate('bookshelf')}/>
          </section>}

          {view==='lesson'&&item&&<section className="library-learning-screen">
            <div className="library-book-head">
              <span className="library-eyebrow">修习 · {NAMES[method]} · {item.kicker}</span>
              <span className="library-lesson-count">循序研读 · {items.length} 课</span>
            </div>
            <div className="library-learning-grid">
              <article className="library-lesson-paper">
                <div className="library-paper-line"><span>研习讲义</span><span>第 {index+1} 课</span></div>
                <h2>{item.title}</h2><span className="library-lesson-sub">{item.sub}</span>
                <div className="library-lesson-text">{item.paragraphs.map((p,i)=><p key={i}>{p}</p>)}</div>
                {item.example&&<div className="library-lesson-example"><b>思考题</b><p>{item.example}</p></div>}
                <p className="library-lesson-note">请把传统取象视为文化研习与思考工具，并核实具体事情中的事实。</p>
              </article>
              <aside className="library-lesson-visual">
                <p className="library-eyebrow">互动图解 · 认识结构</p>
                <StudySymbol kind={method} playing={playing}/>
                <button type="button" className="library-play" onClick={()=>setPlaying(p=>!p)}>
                  {playing?'■ 停止演示':'▷ 播放演示'}
                </button>
                <small>动画是概念示意，不是实时排盘。点击按钮可播放或停止。</small>
              </aside>
            </div>
            <PageControls index={index} total={items.length} onBack={prev} onNext={next}
              doneLabel="开始练习" onFinish={()=>{setView('quiz');setIndex(0);setChoice(null);setCorrect(0);setQuizComplete(false)}}/>
          </section>}

          {view==='quiz'&&quiz&&<section className="library-quiz-screen">
            <div className="library-book-head"><span className="library-eyebrow">研习试炼 · {NAMES[method]}</span>
              <span className="library-lesson-count">{quizComplete?'已完成':'一题一页 · 即答即解'}</span></div>
            {quizComplete?<article className="library-quiz-paper library-quiz-finish">
              <span className="library-finish-seal">成</span>
              <p className="library-eyebrow">本卷答题结束</p>
              <h2>{correct} / {items.length} 题答对</h2>
              <p>通过这组练习，重要的不只是记住名称，更是知道何处该看规则、何处需要现实证据。</p>
              <div className="library-quiz-actions">
                <button type="button" className="library-action" onClick={()=>{setIndex(0);setChoice(null);setCorrect(0);setQuizComplete(false)}}>重新试炼 ↻</button>
                <button type="button" className="library-action secondary" onClick={()=>navigate('quizmenu')}>返回练习目录 →</button>
              </div>
            </article>:<article className="library-quiz-paper">
              <p className="library-eyebrow">第 {index+1} 问 · 共 {items.length} 问</p>
              <div className="library-quiz-progress"><span style={{width:(index+1)/items.length*100+'%'}}/></div>
              <h2>{quiz.question}</h2>
              <div className="library-quiz-options">
                {quiz.options.map((option,i)=><button type="button" key={i} disabled={answered}
                  className={answered?(i===quiz.answer?'right':choice===i?'wrong':''):''}
                  onClick={()=>{setChoice(i);if(i===quiz.answer)setCorrect(s=>s+1)}}>
                  <span>{QUAD[i]||i+1}</span>{option}
                </button>)}
              </div>
              {answered?<div className="library-quiz-explanation" role="status">
                <b>{choice===quiz.answer?'答对了 · 取象得法':'再思考 · 已显示正确答案'}</b>
                <p>{quiz.why}</p>
              </div>:<p className="library-quiz-hint">请选择一个答案，系统会立即显示判断与原因。</p>}
              <div className="library-quiz-actions">
                <button type="button" className="library-action secondary" onClick={()=>{navigate('quizmenu')}}>结束本次练习</button>
                <button type="button" disabled={!answered} className="library-action" onClick={()=>{
                  if(index===items.length-1){setQuizComplete(true)}
                  else{setIndex(i=>i+1);setChoice(null)}
                  window.scrollTo({top:0,behavior:'instant'})
                }}>{index===items.length-1?'查看成绩':'下一题 →'}</button>
              </div>
            </article>}
          </section>}

          {view==='settings'&&<section className="library-settings-screen">
            <SectionHeading small="肆 · AI 接入" title="书房设定" desc="基础排盘、阅读与课程不需要 AI。只有调用模型进行深入解读时，才需要个人密钥或站长服务器配置。"/>
            <div className="library-settings-grid">
              <div className="library-settings-paper">
                <div className="library-paper-line"><span>私人设置</span><span>DEEPSEEK</span></div>
                <div className="library-key-status">
                  <strong>个人临时 API 密钥</strong>
                  <span className={apiKey?'filled':''}>{apiKey?'已填写 · 尚未验证':'尚未填写'}</span>
                </div>
                <label className="library-setting-label">DeepSeek API Key
                  <div className="library-key-input">
                    <input type={reveal?'text':'password'} autoComplete="off" spellCheck={false}
                      value={apiKey} onChange={e=>{setApiKey(e.target.value);setNotice(e.target.value?'密钥已在本次会话填写，尚未验证':'已清空密钥')}}
                      placeholder="sk-••••••••••" aria-label="个人 DeepSeek API Key"/>
                    <button type="button" onClick={()=>setReveal(r=>!r)}>{reveal?'隐藏':'显示'}</button>
                  </div>
                </label>
                <label className="library-setting-label">选择模型
                  <select value={aiModel} onChange={e=>{setAiModel(e.target.value);setNotice('已选择 '+e.target.value)}}>
                    <option value="deepseek-chat">DeepSeek Chat</option>
                    <option value="deepseek-reasoner">DeepSeek Reasoner</option>
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
