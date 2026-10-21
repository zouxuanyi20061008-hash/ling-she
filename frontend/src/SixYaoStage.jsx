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
  const timer=useRef(null)
  useEffect(()=>()=>clearTimeout(timer.current),[])
  async function process(seq){
    try{
      const response=await fetch(api+'/api/liuyao/cast',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({numbers:seq})})
      const data=await response.json()
      if(!response.ok)throw Error(typeof data.detail==='string'?data.detail:'排盘失败')
      setChart(data)
    }catch(e){setError(e.message)}
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
  function restart(){clearTimeout(timer.current);setIsSpinning(false);setCoins([2,3,2]);setLines([]);setChart(null);setAnswer('');setError('')}
  async function interpret(){
    if(!chart||busy)return
    if(!question.trim()||background.trim().length<2){setError('请填写所问之事，并补充一次现实背景。');return}
    setBusy(true);setError('');setAnswer('')
    try{
      const headers={'Content-Type':'application/json'}
      if(apiConfig.personalApiKey.trim())headers['X-User-API-Key']=apiConfig.personalApiKey.trim()
      else if(apiConfig.aiAccessCode)headers['X-AI-Access-Code']=apiConfig.aiAccessCode
      const res=await fetch(api+'/api/liuyao/interpret',{method:'POST',headers,body:JSON.stringify({
        numbers:lines,question,background,background_confirmed:true,ai_model:apiConfig.aiModel
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
            <div className="academy-scope">{chart.note}</div>
          </div>:<div className="academy-empty-result">铜钱逐次成爻，六爻齐备后展示完整本卦、之卦、动爻与传统象义。</div>}
        </section>
      </div>
      {chart&&<section className="academy-ai-section">
        <h2>你的这一卦，问的是什么？</h2>
        <p>AI 可结合你所说的现实处境讨论卦象，但此版本没有计算纳甲、六亲、六神、世应，绝不会冒称完整六爻断事。</p>
        <div className="academy-ai-inputs">
          <label>你想问什么<textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="例如我和朋友的合作是否适合继续？"/></label>
          <label>补充一次现实背景<textarea value={background} onChange={e=>setBackground(e.target.value)} placeholder="目前到了哪一步？现实障碍是什么？"/></label>
        </div>
        <div className="academy-ai-actions"><button className="academy-primary" onClick={interpret} disabled={busy}>{busy?'正在解读…':'AI 辅助理解这一卦 ↗'}</button>
          <button onClick={onStudy}>设置 DeepSeek API</button></div>
        {error&&<p className="academy-error" role="alert">{error}</p>}
        {answer&&<div className="academy-answer"><h3>卦象研究笔记</h3><p>{answer}</p></div>}
        <CaseNotebook method="六爻三钱起卦" question={question} chart={chart}/>
      </section>}
      <footer className="academy-bottom">一门一法，不以梅花体用硬套六爻 · 观象研究，不作确定预测</footer>
    </div>
  </main>
}
