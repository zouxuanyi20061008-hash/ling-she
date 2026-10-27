import {useState} from 'react'
import './academy.css'

const BEIJING_DATE=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date())

export default function LiurenV58(){
  const [date,setDate]=useState(BEIJING_DATE)
  const [clock,setClock]=useState('12:00')
  const [dayBoundary,setDayBoundary]=useState('zi_hour')
  const [chart,setChart]=useState(null)
  const [selected,setSelected]=useState('子')
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  async function cast(event){
    event.preventDefault()
    setBusy(true)
    setError('')
    setChart(null)
    try{
      const r=await fetch('/api/liuren/cast',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({solar_date:date,clock,day_boundary:dayBoundary})
      })
      const result=await r.json()
      if(!r.ok)throw new Error(typeof result.detail==='string'?result.detail:'请核对日期或时辰')
      setChart(result)
      setSelected(result.hour_branch)
    }catch(e){setError(e?.message||'大六壬起课失败')}
    finally{setBusy(false)}
  }
  return <section className="liuren-v58" aria-label="V58 大六壬真实起课">
    <header><small>V58 · 大六壬 / 中气月将</small>
      <h2>北京时间起课 · 十二宫天地盘</h2>
      <p>月将按雨水、春分等十二中气更换，将月将加在占时地支上排天盘，再按日干寄宫与日支起四课。三传只在贼克、比用能唯一确认时计算。</p>
    </header>
    <form className="liuren-v58-form" onSubmit={cast}>
      <label>公历起课日期
        <input aria-label="六壬公历日期" type="date" min="1901-01-01" max="2099-12-31"
          value={date} onChange={e=>setDate(e.target.value)} required/>
      </label>
      <label>北京时间
        <input aria-label="六壬北京时间" type="time" value={clock}
          onChange={e=>setClock(e.target.value)} required/>
      </label>
      <label>日柱换日口径
        <select aria-label="六壬换日规则" value={dayBoundary}
          onChange={e=>setDayBoundary(e.target.value)}>
          <option value="zi_hour">子初23点换日</option>
          <option value="midnight">零点换日</option>
        </select>
      </label>
      <button type="submit" disabled={busy}>{busy?'起课中…':'起大六壬天地盘'}</button>
    </form>
    {error&&<p role="alert" className="academy-caution">{error}</p>}
    {chart&&<div className="liuren-v58-result">
      <div className="liuren-v58-meta">
        <strong>{chart.day_ganzhi}日 · {chart.hour_branch}时 · {chart.month_general}{chart.month_general_name}将</strong>
        <span>上一中气：{chart.calendar_provenance.previous_middle_term.name}，
          {chart.calendar_provenance.previous_middle_term.beijing_time.replace('T',' ')}</span>
        <span>下一中气：{chart.calendar_provenance.next_middle_term.name}，
          {chart.calendar_provenance.next_middle_term.beijing_time.replace('T',' ')}</span>
        <span>日干寄宫：{chart.day_stem_lodge}；月将按中气、八字月柱按节，两者不同。</span>
      </div>
      <h3>十二宫 · 天盘在上、地盘在下</h3>
      <div role="group" aria-label="大六壬十二宫天地盘" className="liuren-v58-plate">
        {chart.palaces.map(p=><button type="button" key={p.earth}
          className={selected===p.earth?'active':''} onClick={()=>setSelected(p.earth)}>
          <small>地盘 {p.earth}</small><strong>天盘 {p.heaven}</strong>
          <span>{p.earth===chart.hour_branch?'占时':''}
            {p.heaven===chart.month_general?' · 月将':''}</span>
        </button>)}
      </div>
      <p className="liuren-v58-selected">所选地盘 {selected} · 上临天盘
        <strong> {chart.heaven_plate[selected]}</strong></p>
      <h3>四课 · 上神与下神</h3>
      <div role="group" aria-label="大六壬四课" className="liuren-v58-lessons">
        {chart.four_lessons.map(p=><article key={p.number}>
          <small>第 {p.number} 课 · {p.from}</small>
          <strong>{p.upper}</strong><span>上神 · {p.upper_element}</span>
          <strong>{p.lower}</strong><span>下神 · {p.lower_element}</span>
          <b>{p.relation}</b>
        </article>)}
      </div>
      <h3>三传 · 初传、中传、末传</h3>
      {chart.three_transmissions.status==='computed'?
        <div role="group" aria-label="大六壬三传" className="liuren-v58-transmissions">
          {chart.three_transmissions.transmissions.map(p=><article key={p.order}>
            <small>{p.name}</small><strong>{p.branch}</strong>
          </article>)}
          <p>发用规则：{chart.three_transmissions.method}。初传候选：
            {chart.three_transmissions.initial_candidates.join('、')}</p>
        </div>:
        <div className="liuren-v58-pending" role="status">
          <strong>此课三传尚未完成核验</strong>
          <p>{chart.three_transmissions.method}：{chart.three_transmissions.reason}</p>
          {chart.three_transmissions.initial_candidates?.length>0&&
            <span>待复核候选：{chart.three_transmissions.initial_candidates.join('、')}</span>}
          <p>天地盘与四课照常展示，不擅自选初传。</p>
        </div>}
      {chart.calendar_provenance.warnings.map((w,i)=>
        <p key={i} className="academy-caution">{w}</p>)}
      <p className="academy-caution">九宗门仍有涉害、遥克、昴星、别责、八专、伏吟、反吟等未完成规则。
        尚未完整排十二天将，不能把本版叫作全部大六壬断课，也不生成实际吉凶预测。</p>
      <a href={chart.source.earth_heaven_four_lessons} target="_blank"
        rel="noopener noreferrer">阅读《六壬指南》天地盘与四课原文</a>
    </div>}
  </section>
}
