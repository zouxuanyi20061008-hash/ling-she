import {useRef,useState} from 'react'
import './academy.css'

const CN_DATE=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date())
const CN_CLOCK=()=>new Intl.DateTimeFormat('en-GB',{
  timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hour12:false
}).format(new Date())

export default function TaiyiV77Hour(){
  const [date,setDate]=useState(CN_DATE)
  const [clock,setClock]=useState(CN_CLOCK)
  const [chart,setChart]=useState(null)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const version=useRef(0)
  function invalidate(){
    version.current+=1
    setChart(null);setBusy(false);setError('')
  }
  async function cast(e){
    e.preventDefault()
    const ticket=++version.current
    setBusy(true);setChart(null);setError('')
    try{
      const r=await fetch('/api/taiyi/hour/cast',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({solar_date:date,clock})
      })
      const data=await r.json()
      if(!r.ok)throw new Error(typeof data.detail==='string'?data.detail:
        '时计起算失败，请核对北京时间及节气历法。')
      if(ticket===version.current)setChart(data)
    }catch(err){
      if(ticket===version.current)setError(err?.message||'时计起算失败')
    }finally{
      if(ticket===version.current)setBusy(false)
    }
  }
  return <section className="taiyi-v77-hour" aria-label="V78 太乙时计分历元实盘">
    <header>
      <small>V78 · 太乙时计 / 冬夏至相对时与甲子元简捷积时</small>
      <h3>时计起盘 · 北京时间双时辰</h3>
      <p>区别于上方岁计：按实际冬至、夏至交节选择阳遁或阴遁；
        太乙沿八宫每三时移一宫，计神每时逆行一支。
        V78 另算冬夏至前最近甲子日简捷历元的五元七十二局、六纪与阴阳文昌十八算；
        它不是古代绝对上元积时，也不是完整主客断课。</p>
    </header>
    <form className="taiyi-v77-form" onSubmit={cast}>
      <label>时计公历日期
        <input aria-label="太乙时计公历日期" type="date" required
          min="1901-01-01" max="2099-12-31" value={date}
          onChange={e=>{setDate(e.target.value);invalidate()}}/>
      </label>
      <label>时计北京时间
        <input aria-label="太乙时计北京时间" type="time" required
          value={clock} onChange={e=>{setClock(e.target.value);invalidate()}}/>
      </label>
      <button type="submit" disabled={busy}>{busy?'正在计算时计…':'计算太乙时计基础盘'}</button>
    </form>
    {error&&<p role="alert" className="academy-caution">{error}</p>}
    {chart&&<section className="taiyi-v77-result"
        role="region" aria-label="V77 太乙时计八宫与计神结果">
      <h4>{chart.solstice.name}后 · {chart.time_cycle.dun} ·
        太乙{chart.taiyi_palace.number}宫{chart.taiyi_palace.trigram}</h4>
      <p>本次北京时间 {chart.input.solar_date} {chart.input.clock}（{chart.input.hour_branch}时）；
        二至真实交节：{chart.solstice.started_at_beijing.replace('T',' ')}。
        二至以来相对第 <strong>{chart.time_cycle.relative_time_count}</strong> 时，
        当前八宫周内第 {chart.time_cycle.relative_count_in_24}/24 时，
        太乙在此宫第 {chart.time_cycle.hours_in_current_palace}/3 时。</p>
      <p>时计计神：<strong>{chart.jishen.branch}</strong> ·
        {chart.jishen.direction} · {chart.jishen.movement}。
        此处计神与上方岁计计神不是同一输入规则。</p>
      <div className="taiyi-v77-palace-grid" role="group" aria-label="太乙时计九宫位置">
        {chart.nine_palaces.map(p=><div key={p.number}
          className={'taiyi-v77-cell'+(p.is_taiyi?' is-taiyi':'')+
            (p.is_middle_unvisited?' is-center':'')}>
          <small>{p.direction}</small><strong>{p.number}宫 · {p.trigram}</strong>
          <span>{p.is_taiyi?'太乙所在':
            p.is_middle_unvisited?'中五不游':'—'}</span>
        </div>)}
      </div>
      {chart.classical_jiazi_hour_v78&&<section className="taiyi-v78-epoch"
          role="group" aria-label="V78 时计甲子积时与五元文昌证据">
        <h4>V78 · 冬夏至前甲子日简捷历元</h4>
        <p>起点：{chart.classical_jiazi_hour_v78.anchor.prior_jiazi_date}
          甲子日子时，至二至相距
          {chart.classical_jiazi_hour_v78.anchor.days_between_jiazi_and_solstice}天。
          本课累计 <strong>{chart.classical_jiazi_hour_v78.accumulated_hours}</strong> 时。</p>
        <div className="taiyi-v78-numbers">
          <span>360周余 <strong>{chart.classical_jiazi_hour_v78.in_cycle_360}</strong>时</span>
          <span>第<strong>{chart.classical_jiazi_hour_v78.six_ji_number}</strong>纪</span>
          <span><strong>{chart.classical_jiazi_hour_v78.five_yuan_name}</strong></span>
          <span>第<strong>{chart.classical_jiazi_hour_v78.ju}</strong>/72 局</span>
          <span>太乙 <strong>{chart.classical_jiazi_hour_v78.taiyi_palace.number}宫
            {chart.classical_jiazi_hour_v78.taiyi_palace.trigram}</strong></span>
          <span>计神 <strong>{chart.classical_jiazi_hour_v78.time_jishen}</strong></span>
          <span>文昌 <strong>{chart.classical_jiazi_hour_v78.time_wenchang.direction}
            · {chart.classical_jiazi_hour_v78.time_wenchang.god}</strong></span>
        </div>
        <details>
          <summary>查看时文昌十八算与乾坤、艮巽重留路径</summary>
          <p>按{chart.time_cycle.dun}计算，本周第
            {chart.classical_jiazi_hour_v78.time_wenchang.count_in_18}算。</p>
          <div className="taiyi-v78-trace" role="group"
               aria-label="V78 时文昌逐位计数路径">
            {chart.classical_jiazi_hour_v78.time_wenchang.trace.map(s=>
              <span key={s.count}>{s.count}. {s.direction} {s.god}
                {s.double_stay?' · 重留':''}</span>)}
          </div>
        </details>
        <p>与 V77 交节相对法对照：V77 为第
          {chart.classical_jiazi_hour_v78.compared_to_v77.v77_relative_since_solstice}时；
          V78 为第{chart.classical_jiazi_hour_v78.compared_to_v77.v78_from_prior_jiazi}时，
          起点相差{chart.classical_jiazi_hour_v78.compared_to_v77.offset_in_double_hours}时。
          {chart.classical_jiazi_hour_v78.compared_to_v77.palace_agrees?
            '两法此课恰同宫，不代表历元相同。':
            '两法此课太乙入宫不同；独立展示，不互相覆盖。'}</p>
        <p className="academy-caution">《太乙金钥匙》的“47时”只可独立核对行宫，
          不能跳过甲子元23局直接推出文昌；古代绝对上元积时、时计始击、
          主客定计、八门及断课仍待核准。</p>
        <a href={chart.classical_jiazi_hour_v78.sources.independent_887_and_47}
          target="_blank" rel="noopener noreferrer">887时与47时原例</a>
        <span> · </span>
        <a href={chart.classical_jiazi_hour_v78.sources.yin_63}
          target="_blank" rel="noopener noreferrer">戊子元阴63局原例</a>
      </section>}
      {chart.solstice.near_15_minutes&&
        <p className="academy-caution" role="note">
          本次处于交节前后十五分钟内，请进一步核查权威节气时刻。
        </p>}
      <p className="academy-caution">V78 已计算甲子日前简捷积时的五元七十二局、
        六纪及文昌十八算；古代绝对上元积时、始击、主客定计与断课仍待校核。
        岁计与时计各用自己的历元，不得直接混用。</p>
      <a href={chart.sources.zhou} target="_blank" rel="noopener noreferrer">
        《太乙金镜式经》冬夏至时计原文</a>
      <span> · </span>
      <a href={chart.sources.hour_example} target="_blank" rel="noopener noreferrer">
        《太乙金钥匙》时计积47时例盘</a>
    </section>}
  </section>
}
