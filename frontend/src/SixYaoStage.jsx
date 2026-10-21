import {useEffect,useRef,useState} from 'react'
import './academy.css'

const api=import.meta.env.VITE_API_URL ?? (import.meta.env.PROD?'':window.location.protocol+'//'+window.location.hostname+':8000')
const K={6:{name:'老阴',yin:0,move:true},7:{name:'少阳',yin:1,move:false},8:{name:'少阴',yin:0,move:false},9:{name:'老阳',yin:1,move:true}}
const POS=['初','二','三','四','五','上']

function Diagram({label,hex,moving=[]}) {
  return <article className="academy-hex">
    <small>{label}</small><h3>{hex.full_name}</h3>
    <div className="academy-sixlines">
      {hex.lines_bottom_to_top.map((bit,i)=>({bit,i})).reverse().map(({bit,i})=>
        <div key={i} className={'academy-line '+(moving.includes(i+1)?'moving':'')}>
          <small>{i+1}</small><span className="academy-bars">{bit?<i/>:<><i/><i/></>}</span>
        </div>)}
    </div>
    <b>{hex.keywords}</b><p>{hex.meaning}</p>
  </article>
}


const DAILY_STEMS=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
const DAILY_BRANCHES=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']
const SEXAGENARY_DAYS=Array.from({length:60},(_,i)=>DAILY_STEMS[i%10]+DAILY_BRANCHES[i%12])
const MONTH_WINDOWS=[
 ['寅','立春至惊蛰'],['卯','惊蛰至清明'],['辰','清明至立夏'],
 ['巳','立夏至芒种'],['午','芒种至小暑'],['未','小暑至立秋'],
 ['申','立秋至白露'],['酉','白露至寒露'],['戌','寒露至立冬'],
 ['亥','立冬至大雪'],['子','大雪至小寒'],['丑','小寒至立春']
]
function CalendarControls({chart,day,month,onChange,busy}) {
  const dayInfo=chart.calendar?.day
  const monthInfo=chart.calendar?.month
  return <section className="calendar-volume" aria-label="核对六爻日辰月建">
    <header className="calendar-volume-heading">
      <div><small>第四式 · 日月校时</small><h3>择日辰，布六神。</h3></div>
      <span className="calendar-volume-stamp">时</span>
    </header>
    <p className="calendar-help">请从万年历核对<strong>真实的六十甲子日</strong>和以节气为界的月支。此处不按手机日期自动推算；只计算你确认的值，留空就不编六神、旬空。</p>
    <div className="calendar-pickers">
      <label>日辰 · 六十甲子
        <select value={day} onChange={e=>onChange(e.target.value,month)}>
          <option value="">暂不填写</option>
          {SEXAGENARY_DAYS.map((item,i)=><option key={item} value={item}>{String(i+1).padStart(2,'0')} · {item}日</option>)}
        </select>
      </label>
      <label>月建 · 节令地支
        <select value={month} onChange={e=>onChange(day,e.target.value)}>
          <option value="">暂不填写</option>
          {MONTH_WINDOWS.map(([b,desc])=><option key={b} value={b}>{b}月 · {desc}</option>)}
        </select>
      </label>
    </div>
    <div className="calendar-findings" aria-live="polite">
      {busy?<p>正在依你确认的日月重新装卦…</p>:
       <>
        <div><small>日辰与旬空</small>
          <strong>{dayInfo?dayInfo.ganzhi+'日 · '+dayInfo.xun+'旬':'未确认日辰'}</strong>
          <span>{dayInfo?'旬空：'+dayInfo.xunkong.join('、'):'六神、旬空均未推定'}</span>
        </div>
        <div><small>节令月支</small>
          <strong>{monthInfo?monthInfo.branch+'月 · '+monthInfo.element:'尚未确认月建'}</strong>
          <span>{monthInfo?monthInfo.term_window:'不按公历月份猜测'}</span>
        </div>
       </>}
    </div>
    <p className="calendar-boundary">此处属于「已确认日月参数后的规则演算」，不是自动历法换算或完整旺衰判断；交节前后请优先核对权威历书。</p>
  </section>
}

function NajiaBoard({chart}) {
  const [selected,setSelected]=useState(0)
  const [changed,setChanged]=useState(false)
  const pal=chart.eight_palaces?.ben
  const changedPal=chart.eight_palaces?.bian
  const all=changed?chart.bian_najia_lines:chart.najia_lines
  const detail=all?.[selected]
  if(!pal||!all)return null
  return <section className="najia-board" aria-label="六爻纳甲与世应教学盘">
    <header className="najia-header">
      <div><span>第三式 · 纳甲装卦</span><h3>京房八宫 · 六亲世应</h3></div>
      <div className="najia-palace-seal">{pal.palace}宫<span>{pal.palace_element}</span></div>
    </header>
    <div className="najia-palace-summary">
      <div><small>本卦归属</small><strong>{pal.palace}宫 · {pal.stage}</strong></div>
      <div><small>世爻 / 应爻</small><strong>{POS[pal.shi_position-1]} / {POS[pal.ying_position-1]}</strong></div>
      <div><small>之卦归属（对照）</small><strong>{changedPal.palace}宫 · {changedPal.stage}</strong></div>
    </div>
    <div className="najia-switch" role="tablist" aria-label="选择本卦或变卦纳甲">
      <button type="button" role="tab" aria-selected={!changed} className={!changed?'active':''} onClick={()=>{setChanged(false);setSelected(0)}}>本卦装卦</button>
      <button type="button" role="tab" aria-selected={changed} className={changed?'active':''} onClick={()=>{setChanged(true);setSelected(0)}}>变卦纳甲</button>
    </div>
    <div className="najia-table" role="list">
      <div className="najia-column-label"><span>爻位</span><span>卦爻</span><span>纳甲干支</span><span>五行</span><span>六亲</span><span>世应</span></div>
      {[...all].reverse().map((line,i)=>{
        const row=5-i
        const lines=changed?chart.bian_gua.lines_bottom_to_top:chart.ben_gua.lines_bottom_to_top
        const role=row+1===pal.shi_position?'世':row+1===pal.ying_position?'应':''
        return <button key={line.position} type="button" role="listitem" aria-current={selected===row?'true':undefined}
          className={'najia-row '+(selected===row?'selected ':'')+(line.moving?'moving':'')}
          onClick={()=>setSelected(row)}>
          <span>{POS[row]}<small>{line.moving?'动':''}</small></span>
          <span className="najia-strokes">{lines[row]===1?<i/>:<><i/><i/></>}</span>
          <strong>{line.ganzhi}</strong><span>{line.element}</span><span>{line.liuqin}</span><b>{[role,line.is_xunkong?'空':''].filter(Boolean).join('·')}</b>
        </button>
      })}
    </div>
    {detail&&<article className="najia-focused">
      <span className="najia-learning">逐爻研习 · 点选上方任意一爻</span>
      <h4>{POS[selected]}爻 · {detail.ganzhi} · {detail.liuqin}{detail.moving?' · 动':''}</h4>
      <p>此爻位于{detail.trigram}卦，纳{detail.stem}干、{detail.branch}支，支属{detail.element}。以本卦的{pal.palace}宫{pal.palace_element}为“我”，按五行生克定为<strong>{detail.liuqin}</strong>。
        {!changed&&detail.role?'这是本卦'+detail.role+'爻。':changed?'变卦干支仍以本卦宫五行定六亲，不重新用变卦所属宫计算。':''}
      </p>
      <p>{detail.moving?'此爻发生阴阳变换；对照“本卦”和“变卦”可观察此爻干支的改变。':'此爻没有发生阴阳变换。'}</p>
      {detail.liushen&&<p className="calendar-single"><b>六神 · {detail.liushen}</b>　根据已选日干自初爻起依序布列，仅供辅助取象。</p>}
      {detail.is_xunkong!==null&&<p className="calendar-single"><b>旬空 · {detail.is_xunkong?'是':'否'}</b>　日辰属于{chart.calendar.day.xun}旬，空{chart.calendar.day.xunkong.join('、')}。</p>}
      {detail.month_relation&&<p className="calendar-single"><b>月支 · {detail.month_relation}</b>
       {detail.is_yuejian?' · 临月建':''}{detail.is_yuechong?' · 与月建相冲':''}；只给关系提示，不直接断旺衰。</p>}
    </article>}
    <div className="najia-footnote">
      <p>{chart.najia_note}</p>
      <p>六亲与世应由固定算法计算。六神、旬空需要提供有效日辰；月支标记需要提供节令月支。即便填写完整，也不可仅凭一项标记判断吉凶或应期。</p>
      <a href="https://www.guyujian.cn/learn/liuyao/05" rel="noopener noreferrer" target="_blank">八宫与世应讲解 ↗</a>
      <a href="https://shunshi.ai/zh-cn/wiki/liuyao/zhuangua/najia" rel="noopener noreferrer" target="_blank">纳甲口诀与全表 ↗</a>
    </div>
  </section>
}

export function CaseNotebook({method,question,chart}) {
  const [open,setOpen]=useState(false)
  const [omen,setOmen]=useState('')
  const [before,setBefore]=useState('')
  const [after,setAfter]=useState('')
  const [message,setMessage]=useState('')
  function exportCase(){
    const payload={method,question,chart,observed_omens:omen,before_result_prediction:before,after_result_feedback:after,
      time:new Date().toISOString(),note:'自述案例，未核实；事前判断与事后反馈应分别记录'}
    try{
      const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}))
      const a=document.createElement('a');a.href=url;a.download='万象书院-复盘笔记.json';a.click()
      setTimeout(()=>URL.revokeObjectURL(url),1000)
      setMessage('笔记已导出，本站未保存。')
    }catch {setMessage('浏览器导出失败，请手动复制。')}
  }
  return <section className="academy-casebook">
    <button className="academy-casebook-tab" onClick={()=>setOpen(v=>!v)}>✎ 外应与意外反馈 <span>{open?'收起 ∧':'展开 ∨'}</span></button>
    {open&&<div className="academy-casebook-inner">
      <p>把真实观察、事前判断与后来发生的事情分开记录。仅保留在当前页面内存；主动导出才生成本地文件，不自动上传。</p>
      <label>起卦时所见所闻<textarea value={omen} onChange={e=>setOmen(e.target.value)} placeholder="当时确实发生的声音、人物、天气、动作"/></label>
      <label>当时的第一判断<textarea value={before} onChange={e=>setBefore(e.target.value)} placeholder="请记录事前说过的话"/></label>
      <label>实际结果与意外转折<textarea value={after} onChange={e=>setAfter(e.target.value)} placeholder="后来真实发生了什么？哪些地方判断错了？"/></label>
      <button className="academy-primary" onClick={exportCase}>导出案例笔记 ↗</button><small role="status">{message}</small>
    </div>}
  </section>
}
export default function SixYaoStage({onBack,onStudy,apiConfig}) {
  const [coins,setCoins]=useState([2,3,2])
  const [lines,setLines]=useState([])
  const [isSpinning,setIsSpinning]=useState(false)
  const [chart,setChart]=useState(null)
  const [question,setQuestion]=useState('')
  const [background,setBackground]=useState('')
  const [answer,setAnswer]=useState('')
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  const [dayGanzhi,setDayGanzhi]=useState('')
  const [monthBranch,setMonthBranch]=useState('')
  const [calendarBusy,setCalendarBusy]=useState(false)
  const requestNumber=useRef(0)
  const timer=useRef(null)
  useEffect(()=>()=>clearTimeout(timer.current),[])
  async function process(seq,day=dayGanzhi,month=monthBranch){
    const token=++requestNumber.current
    setCalendarBusy(true)
    try{
      const response=await fetch(api+'/api/liuyao/cast',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({numbers:seq,day_ganzhi:day||null,month_branch:month||null})})
      const data=await response.json()
      if(!response.ok)throw Error(typeof data.detail==='string'?data.detail:'排盘失败')
      if(token===requestNumber.current)setChart(data)
    }catch(e){if(token===requestNumber.current)setError(e.message)}
    finally{if(token===requestNumber.current)setCalendarBusy(false)}
  }
  function updateCalendar(day,month) {
    setDayGanzhi(day);setMonthBranch(month);setAnswer('')
    if(lines.length===6)process(lines,day,month)
  }
  function addLine(value,faces){
    if(lines.length>=6||busy)return
    if(faces)setCoins(faces)
    const seq=[...lines,value];setLines(seq);setChart(null);setAnswer('');setError('')
    if(seq.length===6)process(seq)
  }
  function cast(){
    if(isSpinning||lines.length>=6)return
    setIsSpinning(true)
    timer.current=setTimeout(()=>{
      const entropy=window.crypto?.getRandomValues?window.crypto.getRandomValues(new Uint32Array(3)):null
      const faces=[0,1,2].map(i=>entropy?((entropy[i]&1)?3:2):Math.random()<.5?2:3)
      setIsSpinning(false);addLine(faces[0]+faces[1]+faces[2],faces)
    },800)
  }
  function restart(){clearTimeout(timer.current);requestNumber.current+=1;setCalendarBusy(false);setIsSpinning(false);setCoins([2,3,2]);setLines([]);setChart(null);setAnswer('');setError('')}
  async function interpret(){
    if(!chart||busy||calendarBusy)return
    if(!question.trim()||background.trim().length<2){setError('请填写所问之事，并补充一次现实背景。');return}
    setBusy(true);setError('');setAnswer('')
    try{
      const headers={'Content-Type':'application/json'}
      if(apiConfig.personalApiKey.trim())headers['X-User-API-Key']=apiConfig.personalApiKey.trim()
      else if(apiConfig.aiAccessCode)headers['X-AI-Access-Code']=apiConfig.aiAccessCode
      const res=await fetch(api+'/api/liuyao/interpret',{method:'POST',headers,body:JSON.stringify({
        numbers:lines,day_ganzhi:dayGanzhi||null,month_branch:monthBranch||null,
        question,background,background_confirmed:true,ai_model:apiConfig.aiModel
      })})
      const data=await res.json()
      if(!res.ok)throw Error(typeof data.detail==='string'?data.detail:data.detail?.message||'AI 暂不可用')
      setAnswer(data.interpretation)
    }catch(e){setError(e.message)}
    finally{setBusy(false)}
  }
  return <main className="academy-stage">
    <div className="academy-container">
      <header className="academy-stage-nav"><button onClick={onBack}>← 返回万象书院</button><b>铜钱六爻 · 六次成卦</b><button onClick={onStudy}>藏经阁 ◎</button></header>
      <section className="academy-stage-banner"><div>
        <p>六爻 · 铜钱起卦工坊</p><h1>铜钱一掷，<em>爻象渐生。</em></h1>
        <span>本工坊按《增删卜易》三钱六掷法演示。先取初爻，再从下向上记到上爻。<a href="https://zh.wikisource.org/zh-hans/增删卜易/2" target="_blank" rel="noopener noreferrer">阅读古籍来源 ↗</a></span>
      </div><div className="academy-stage-glyph">☰</div></section>
      <div className="academy-stage-grid">
        <section className="academy-casting-table">
          <div className="academy-panel-head"><span>第一式 · 摇钱成爻</span><b>{Math.min(6,lines.length+1)} / 六</b></div>
          <label className="academy-quick-question">你想问什么？
            <textarea value={question} onChange={e=>setQuestion(e.target.value)}
              placeholder="认真求测，请先写下问题。只为学习摇卦，也可以暂时留空。"/>
          </label>
          <div className="academy-coin-altar">
            <div className="academy-coins">{coins.map((value,i)=><div className={'academy-coin '+(isSpinning?'spinning':'')} key={i} style={{animationDelay:(i*.085)+'s'}}>
              <div className="academy-coin-inside"><span>{value===3?'背':'字'}</span><b>{value===3?'乾元':'通宝'}</b></div>
            </div>)}</div>
            <p>字面记二 · 背面记三</p>
            <button className="academy-primary" onClick={cast} disabled={isSpinning||lines.length>=6}>
              {isSpinning?'铜钱翻转中…':lines.length===6?'六爻已成':'摇第'+['一','二','三','四','五','六'][lines.length]+'爻'} ↗
            </button>
          </div>
          <p className="academy-subtitle">也可手动输入自己掷出的爻态</p>
          <div className="academy-manual">{[6,7,8,9].map(n=><button key={n} onClick={()=>addLine(n)} disabled={lines.length===6||isSpinning}><b>{n}</b><small>{K[n].name}</small></button>)}</div>
          <p className="academy-help">三字为老阴6；一背两字为少阳7；两背一字为少阴8；三背为老阳9。老阴、老阳为动爻。</p>
          <div className="academy-under-actions"><button onClick={restart}>重新起卦 ↻</button><button onClick={onStudy}>学六爻原理 ↗</button></div>
        </section>
        <section className="academy-casting-result">
          <div className="academy-panel-head"><span>第二式 · 记六爻</span><b>{lines.length}/6</b></div>
          <div className="academy-ledger">{[0,1,2,3,4,5].map(i=>{
            const num=lines[i], info=K[num]
            return <div className={'academy-ledger-row '+(info?.move?'moving':'')} key={i}>
              <span>{POS[i]}爻</span><div className="academy-bars">
                {info?(info.yin?<i/>:<><i/><i/></>):<em>待掷</em>}</div><small>{info?num+' · '+info.name:'尚未记录'}</small>
            </div>
          })}</div>
          {chart?<div className="academy-computed">
            <div className="academy-hex-pair"><Diagram label="本卦" hex={chart.ben_gua} moving={chart.dong_yao}/><Diagram label="之卦" hex={chart.bian_gua}/></div>
            <p>动爻：{chart.dong_yao.length?chart.dong_yao.map(i=>POS[i-1]+'爻').join('、'):'无动爻'}</p>
            <CalendarControls chart={chart} day={dayGanzhi} month={monthBranch} onChange={updateCalendar} busy={calendarBusy}/>
            <NajiaBoard chart={chart}/>
            <div className="academy-scope">{chart.note}</div>
          </div>:<div className="academy-empty-result">铜钱逐次成爻，六爻齐备后展示完整本卦、之卦、动爻与传统象义。</div>}
        </section>
      </div>
      {chart&&<section className="academy-ai-section">
        <h2>你的这一卦，问的是什么？</h2>
        <p>AI 可结合实际问题讨论已计算的八宫世应、纳甲六亲；如果你确认日辰和月支，还能参考六神、旬空和月建辅助标记。真正的历法换算、用神取用及综合旺衰尚未实现。</p>
        <div className="academy-ai-inputs">
          <label>你想问什么<textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="例如我和朋友的合作是否适合继续？"/></label>
          <label>补充一次现实背景<textarea value={background} onChange={e=>setBackground(e.target.value)} placeholder="目前到了哪一步？现实障碍是什么？"/></label>
        </div>
        <div className="academy-ai-actions"><button className="academy-primary" onClick={interpret} disabled={busy||calendarBusy}>{busy?'正在解读…':'AI 辅助理解这一卦 ↗'}</button>
          <button onClick={onStudy}>设置 DeepSeek API</button></div>
        {error&&<p className="academy-error" role="alert">{error}</p>}
        {answer&&<div className="academy-answer"><h3>卦象研究笔记</h3><p>{answer}</p></div>}
        <CaseNotebook method="六爻三钱起卦" question={question} chart={chart}/>
      </section>}
      <footer className="academy-bottom">一门一法，不以梅花体用硬套六爻 · 观象研究，不作确定预测</footer>
    </div>
  </main>
}
