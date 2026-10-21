import { useEffect, useState } from 'react'
import { CLASSICS, LESSONS, QUIZZES, SOURCES } from './studyContent.js'
import './study.css'

const ITEMS = [
  {key:'classics',title:'典籍',sub:'原文有据',number:'壹'},
  {key:'lessons',title:'修习',sub:'循序学易',number:'贰'},
  {key:'practice',title:'试炼',sub:'自证所学',number:'叁'},
  {key:'api',title:'设定',sub:'AI 接入',number:'肆'},
]

function ShelfOrnament() {
  return <svg className="shrine-art" aria-hidden="true" viewBox="0 0 360 190">
    <defs><linearGradient id="ridge" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#a7b7a0" stopOpacity=".08"/><stop offset="1" stopColor="#385f4c" stopOpacity=".3"/></linearGradient></defs>
    <path d="M0 174L82 94L125 134L189 33L247 116L290 73L360 150V190H0Z" fill="url(#ridge)"/>
    <path d="M140 190L218 58L282 171M45 181L109 104L161 161" stroke="#406153" strokeOpacity=".25" strokeWidth="2" fill="none"/>
    <circle cx="281" cy="39" r="23" fill="#d9bb78" opacity=".45"/>
    <path d="M360 2C312 16 297 32 285 58M321 22Q334 45 354 55M293 46Q263 36 249 21" fill="none" stroke="#7c6051" strokeWidth="3" strokeLinecap="round"/>
    {[[312,20],[341,42],[279,50],[250,21],[300,45]].map(([x,y],i)=><g key={i} transform={'translate('+x+' '+y+')'}>{[0,72,144,216,288].map(d=><ellipse key={d} cx="0" cy="-5" rx="4" ry="7" transform={'rotate('+d+')'} fill="#aa7866" opacity=".66"/>)}<circle r="2.4" fill="#b6a06e"/></g>)}
  </svg>
}

function Classics({ onLearn }) {
  const [selected,setSelected]=useState('numbers')
  const [showReading,setShowReading]=useState(false)
  const item=CLASSICS.find(c=>c.id===selected)||CLASSICS[0]
  return <div className="study-content">
    <div className="study-headrow">
      <div><p className="shrine-overline">梅花易数 · 古籍选读</p><h2>原典有据，方可观心。</h2></div>
      <span className="study-count">三卷 · 八则节录</span>
    </div>
    <p className="study-deck">摘录自公开古籍文本；分清「原文节录」「现代解释」「本体系心法」。点击下方的「读原典」可以查看对应整卷，而不是将节选冒称为全文。</p>
    <div className="shrine-reading-grid">
      <div className="shrine-chapter-list" role="list" aria-label="古籍选读目录">
        {CLASSICS.map((entry,i)=><button key={entry.id} role="listitem" className={'shrine-chapter '+(selected===entry.id?'selected':'')} onClick={()=>{setSelected(entry.id);setShowReading(false)}}>
          <span className="chapter-number">{String(i+1).padStart(2,'0')}</span>
          <span><b>{entry.heading}</b><small>{entry.volume}</small></span>
          <span className="chapter-chevron">›</span>
        </button>)}
      </div>
      <article className="shrine-scroll" key={item.id}>
        <div className="shrine-scroll-inner">
          <div className="shrine-scroll-heading"><span>校读选段</span><span>梅花易数</span></div>
          <p className="shrine-source-tag">{item.volume} · {item.section}</p>
          <h3>{item.heading}</h3>
          <div className="shrine-verse"><p>{item.original}</p></div>
          <div className="shrine-explanation"><strong>释其意</strong><p>{item.explanation}</p></div>
          <div className="shrine-note"><strong>辨其界</strong><p>{item.note}</p></div>
          <div className="study-actions">
            <a className="study-action" href={SOURCES[item.source]} target="_blank" rel="noopener noreferrer">读原典整卷 ↗</a>
            <button className="study-muted-action" onClick={()=>{onLearn();setShowReading(false)}}>前往循序修习 →</button>
          </div>
          {showReading && <div className="study-alert">该选段仅用于入门。阅读整卷时可直接对照「体用」「先天后天论」等章节。</div>}
        </div>
      </article>
    </div>
    <p className="study-footnote">版本说明：《梅花易数》传统上与邵雍相关联，但流传文本及作者归属问题仍值得考证。此处采用维基文库公开校录文本作为学习入口，并非文献定本；部分古字按网页简体转换。</p>
  </div>
}

function Lessons({ setTab, lessonIndex, setLessonIndex }) {
  const item=LESSONS[lessonIndex]
  return <div className="study-content">
    <div className="study-headrow"><div><p className="shrine-overline">循序研习 · 从初识到实战</p><h2>学易，先明其理。</h2></div><span className="study-count">{lessonIndex+1} / {LESSONS.length} 课</span></div>
    <div className="lesson-book">
      <div className="lesson-rail" role="navigation" aria-label="八课课程列表">
        {LESSONS.map((lesson,i)=><button key={lesson.title} className={'lesson-link '+(lessonIndex===i?'active':'')} onClick={()=>setLessonIndex(i)}>
          <span className="lesson-dot">{String(i+1).padStart(2,'0')}</span>
          <span>{lesson.title}</span>
        </button>)}
      </div>
      <article className="lesson-page" key={lessonIndex}>
        <div className="lesson-top"><span>{item.level}</span><span className="lesson-emblem">習</span></div>
        <h3>{item.title}</h3>
        <p className="lesson-subtitle">{item.subtitle}</p>
        <div className="lesson-prose">{item.paragraphs.map((p,i)=><p key={i}>{p}</p>)}</div>
        <div className="lesson-example"><span>尝试观想</span><p>{item.example}</p></div>
        <div className="lesson-bottom">
          <button className="study-muted-action" onClick={()=>setLessonIndex(i=>Math.max(0,i-1))} disabled={lessonIndex===0}>← 上一课</button>
          {lessonIndex<LESSONS.length-1
            ? <button className="study-action" onClick={()=>setLessonIndex(i=>i+1)}>下一课 →</button>
            : <button className="study-action" onClick={()=>setTab('practice')}>完成课程 · 去练习 →</button>}
        </div>
      </article>
    </div>
  </div>
}

function Practice({ goCast }) {
  const [index,setIndex]=useState(0)
  const [selected,setSelected]=useState(null)
  const [correct,setCorrect]=useState(0)
  const [completed,setCompleted]=useState(false)
  const quiz=QUIZZES[index]
  const answered=selected!==null
  function next() {
    if(index===QUIZZES.length-1){setCompleted(true);return}
    setIndex(i=>i+1)
    setSelected(null)
  }
  function restart() {setIndex(0);setSelected(null);setCorrect(0);setCompleted(false)}
  return <div className="study-content">
    <div className="study-headrow"><div><p className="shrine-overline">温故知新 · 辨象不执象</p><h2>纸上得来终觉浅。</h2></div><span className="study-count">八问 · 即答即解</span></div>
    <p className="study-deck">以下练习没有吉凶预测，只有取数、取象与判断边界。做错后也会展示解释，适合边学边练。</p>
    {completed ? <section className="exercise-card exercise-finish">
      <span className="exercise-seal">成</span><p className="shrine-overline">研习结课</p>
      <h3>{correct} / {QUIZZES.length} 题答对</h3>
      <p>懂得起卦，是学术；懂得问问题、留证据、承认未知，是修习心易时值得珍视的功夫。</p>
      <div className="study-actions"><button className="study-action" onClick={restart}>再温习一遍</button><button className="study-muted-action" onClick={goCast}>返回书卷起卦 →</button></div>
    </section> : <section className="exercise-card">
      <div className="exercise-top"><span>第 {index+1} 问</span><span>{index+1} / {QUIZZES.length}</span></div>
      <div className="exercise-progress"><span style={{width:(index+1)/QUIZZES.length*100+'%'}}/></div>
      <h3>{quiz.question}</h3>
      <div className="exercise-options">
        {quiz.options.map((text,i)=>{
          let kind=answered ? (i===quiz.answer?'right':selected===i?'wrong':''):''
          return <button type="button" key={i} disabled={answered} onClick={()=>{
            setSelected(i)
            if(i===quiz.answer)setCorrect(c=>c+1)
          }} className={'exercise-option '+kind}>
            <span>{['甲','乙','丙'][i]}</span>{text}
          </button>
        })}
      </div>
      {answered && <div className="exercise-feedback" role="status">
        <b>{selected===quiz.answer?'取象得法':'此处再思'}</b><p>{quiz.why}</p>
        <button className="study-action" onClick={next}>{index===QUIZZES.length-1?'查看修习结果':'继续下一问 →'}</button>
      </div>}
      {!answered && <p className="study-footnote">选出最合适的理解，即可查看解释。</p>}
    </section>}
  </div>
}

function ApiSettings({ apiKey, setApiKey, aiModel, setAiModel, accessCode, setAccessCode }) {
  const [reveal,setReveal]=useState(false)
  return <div className="study-content">
    <div className="study-headrow"><div><p className="shrine-overline">模型接入 · 各凭本心</p><h2>把 AI 留给需要的时候。</h2></div><span className="study-count">DeepSeek</span></div>
    <p className="study-deck">基础排盘、六十四卦释义、先后天对照、古籍阅读与课程全部无需 AI。配置 API 只是为「结合现实背景的深入断事」启用可选功能。</p>
    <div className="api-settings-card">
      <div className="api-card-head"><span>个人临时密钥</span><span className={'api-status '+(apiKey?'connected':'')}>{apiKey?'已填写 · 尚未验证':'未填写'}</span></div>
      <p className="study-footnote">自己的 DeepSeek API Key 仅在当前打开的网页内存中保留，刷新或关闭后清空；调用时通过本站 HTTPS 后端转发至 DeepSeek。不会写入本地存储、GitHub、网址或后台设置。请勿使用来源不明的网站或共享他人的密钥。</p>
      <label className="api-label">DeepSeek API Key
        <div className="api-input-wrap">
          <input autoComplete="off" spellCheck="false" type={reveal?'text':'password'} value={apiKey} onChange={e=>setApiKey(e.target.value)} className="field" placeholder="sk-••••••••••••" aria-label="个人 DeepSeek API Key"/>
          <button type="button" onClick={()=>setReveal(v=>!v)} aria-label={reveal?'隐藏密钥':'显示密钥'}>{reveal?'隐藏':'显示'}</button>
        </div>
      </label>
      <div className="api-two-columns">
        <label className="api-label">模型
          <select className="field" value={aiModel} onChange={e=>setAiModel(e.target.value)}>
            <option value="deepseek-chat">DeepSeek Chat</option>
            <option value="deepseek-reasoner">DeepSeek Reasoner</option>
          </select>
        </label>
        <label className="api-label">站长访问码（选填）
          <input type="password" autoComplete="off" className="field" value={accessCode} onChange={e=>setAccessCode(e.target.value)} placeholder="站长设置后才需要"/>
        </label>
      </div>
      <div className="study-actions" style={{marginTop:16}}>
        <button className="study-action" type="button" onClick={()=>{setApiKey('');setReveal(false)}} disabled={!apiKey}>清除个人密钥</button>
        <a className="study-muted-action" href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer">DeepSeek 密钥控制台 ↗</a>
      </div>
    </div>
    <div className="api-info">
      <b>如果你是网站站长</b>
      <p>要让自己的 API Key 跨设备长期生效，应在 Render 服务的 Environment 中配置 <code>LLM_API_KEY</code>，并建议同时设置 <code>AI_ACCESS_CODE</code> 控制调用。公共网页的「设置」不能修改 Render 环境变量，也不会显示或读取后台保存的密钥。</p>
      <p>如果填写了上面的个人密钥，调用时优先使用个人密钥及所选模型；未填写时才尝试使用站长在服务器配置的模型与访问码。</p>
    </div>
    <p className="study-footnote">隐私提示：你输入的问事背景会与起卦数据一起发送给所选的模型提供商处理；不要输入自己或他人的敏感信息。AI 不负责医学诊断或重大决定。</p>
  </div>
}

export default function StudyHall({
  onClose,apiKey,setApiKey,aiModel,setAiModel,accessCode,setAccessCode
}) {
  const [tab,setTab]=useState('classics')
  const [lessonIndex,setLessonIndex]=useState(0)
  useEffect(()=>{
    function esc(e){if(e.key==='Escape')onClose()}
    document.addEventListener('keydown',esc)
    const prev=document.body.style.overflow
    document.body.style.overflow='hidden'
    return ()=>{document.removeEventListener('keydown',esc);document.body.style.overflow=prev}
  },[onClose])
  return <div className="study-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <section className="study-dialog" role="dialog" aria-modal="true" aria-labelledby="shrine-title">
      <div className="study-inner">
        <header className="shrine-header">
          <div className="shrine-title-area"><div className="shrine-seal" aria-hidden="true">梅</div><div>
            <p className="shrine-overline">梅花心易 · 藏经阁</p>
            <h1 id="shrine-title">一卷古今，见天地心。</h1>
            <p>读原典 · 学起卦 · 自校心法 · 接入 AI</p>
          </div></div>
          <button type="button" className="shrine-close" onClick={onClose} aria-label="关闭藏经阁">×</button>
          <ShelfOrnament/>
        </header>
        <nav className="shrine-nav" aria-label="藏经阁栏目">
          {ITEMS.map(it=><button type="button" key={it.key} onClick={()=>setTab(it.key)}
            className={'shrine-nav-link '+(tab===it.key?'active':'')} aria-current={tab===it.key?'page':undefined}>
            <span className="shrine-nav-no">{it.number}</span><span>{it.title}</span><small>{it.sub}</small>
          </button>)}
        </nav>
        <div className="shrine-view" key={tab}>
          {tab==='classics'&&<Classics onLearn={()=>setTab('lessons')}/>}
          {tab==='lessons'&&<Lessons setTab={setTab} lessonIndex={lessonIndex} setLessonIndex={setLessonIndex}/>}
          {tab==='practice'&&<Practice goCast={onClose}/>}
          {tab==='api'&&<ApiSettings apiKey={apiKey} setApiKey={setApiKey} aiModel={aiModel} setAiModel={setAiModel} accessCode={accessCode} setAccessCode={setAccessCode}/>}
        </div>
        <footer className="shrine-footer"><span>学而时习之 · 以古籍为师，以事实为鉴</span><button type="button" onClick={onClose}>合卷 · 返回排盘 ↗</button></footer>
      </div>
    </section>
  </div>
}
