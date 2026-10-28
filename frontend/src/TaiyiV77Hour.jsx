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
  return <section className="taiyi-v77-hour" aria-label="V77 太乙时计基础">
    <header>
      <small>V77 · 太乙时计 / 冬夏至定气、阴阳遁与计神</small>
      <h3>时计起盘 · 北京时间双时辰</h3>
      <p>区别于上方岁计：按实际冬至、夏至交节选择阳遁或阴遁；
        太乙沿八宫每三时移一宫，计神每时逆行一支。本版是二至以来相对时数，
        <strong>不是</strong>古籍上元甲子积时五元七十二局或完整主客断课。</p>
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
      {chart.solstice.near_15_minutes&&
        <p className="academy-caution" role="note">
          本次处于交节前后十五分钟内，请进一步核查权威节气时刻。
        </p>}
      <p className="academy-caution">本版没有核定古法甲子元积时、完整时计七十二局、
        文昌天目、始击、主客定计和吉凶断课；不得把岁计算法直接替代时计。</p>
      <a href={chart.sources.zhou} target="_blank" rel="noopener noreferrer">
        《太乙金镜式经》冬夏至时计原文</a>
      <span> · </span>
      <a href={chart.sources.hour_example} target="_blank" rel="noopener noreferrer">
        《太乙金钥匙》时计积47时例盘</a>
    </section>}
  </section>
}
