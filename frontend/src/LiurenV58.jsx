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
  return <section className="liuren-v58" aria-label="V59 大六壬真实起课">
    <header><small>V59 · 大六壬 / 九宗门逐步完善</small>
      <h2>北京时间起课 · 十二宫天地盘</h2>
      <p>月将按雨水、春分等十二中气更换，将月将加在占时地支上排天盘，再按日干寄宫与日支起四课。三传已扩展贼克、比用、遥克、伏吟与反吟可核定课式；涉害多候选保留公开审计，不伪造初传。</p>
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
      {chart.transmission_review&&<div className="liuren-v59-rule">
        <strong>V59 取传门类：{chart.transmission_review.method_family}</strong>
        <small>天地盘偏移 {chart.transmission_review.offset_palaces} 宫；
          {chart.has_full_nine_methods?'九宗门已齐':'九宗门仍有未完规则'}</small>
      </div>}
      {chart.three_transmissions.status==='computed'?
        <div role="group" aria-label="大六壬三传" className="liuren-v58-transmissions">
          {chart.three_transmissions.transmissions.map(p=><article key={p.order}>
            <small>{p.name}</small><strong>{p.branch}</strong>
          </article>)}
          <p>发用规则：{chart.three_transmissions.method}。初传候选：
            {chart.three_transmissions.initial_candidates.join('、')}</p>
          {chart.three_transmissions.rule_audit?.initial_self_punishment&&
            <p>本课初传自刑，已经按伏吟专法另取中传。</p>}
          {chart.three_transmissions.rule_audit?.middle_self_punishment&&
            <p>中传自刑，本课末传改用相冲支。</p>}
        </div>:
        <div className="liuren-v58-pending" role="status">
          <strong>此课三传尚未完成核验</strong>
          <p>{chart.three_transmissions.method}：{chart.three_transmissions.reason}</p>
          {chart.three_transmissions.initial_candidates?.length>0&&
            <span>待复核候选：{chart.three_transmissions.initial_candidates.join('、')}</span>}
          <p>天地盘与四课照常展示，不擅自选初传。</p>
          {chart.three_transmissions.rule_audit?.candidate_details?.length>0&&
            <div role="group" aria-label="涉害候选审计" className="liuren-v59-candidates">
              {chart.three_transmissions.rule_audit.candidate_details.map((c,i)=>
                <article key={i}>
                  <strong>候选上神 {c.upper}</strong>
                  <span>原课第 {c.lesson_numbers.join('、')} 课</span>
                  <span>下神：{c.lowers.join('、')} · 地盘落位：{c.lowers_lodges.join('、')}</span>
                  <span>{c.candidate_branch_class}位 ·
                    {c.same_yin_yang_as_day?'与日干阴阳相同':'与日干阴阳不同'}</span>
                </article>)}
              <p>逐宫涉害深浅未独立核验；不同口径不可自动择一。</p>
            </div>}
        </div>}
      {chart.calendar_provenance.warnings.map((w,i)=>
        <p key={i} className="academy-caution">{w}</p>)}
      <p className="academy-caution">V59 已支持遥克、伏吟、反吟部分明晰规则；涉害完整深浅、昴星、别责、八专仍未覆盖。
        尚未完整排十二天将，不能把本版叫作全部大六壬断课，也不生成实际吉凶预测。</p>
      <a href={chart.source.earth_heaven_four_lessons} target="_blank"
        rel="noopener noreferrer">阅读《六壬指南》天地盘与四课原文</a>
    </div>}
  </section>
}
