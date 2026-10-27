import {useState} from 'react'
import './academy.css'

const YEAR_NOW=()=>Number(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Shanghai',
  year:'numeric'}).format(new Date()))

export default function TaiyiV64(){
  const [year,setYear]=useState(YEAR_NOW)
  const [chart,setChart]=useState(null)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [picked,setPicked]=useState(null)
  async function cast(event){
    event.preventDefault()
    const n=Number(year)
    if(!Number.isInteger(n)||n<1901||n>2099){
      setError('请选择 1901 至 2099 年之间的整数公历年份。')
      setChart(null)
      return
    }
    setBusy(true);setError('');setChart(null)
    try{
      const response=await fetch('/api/taiyi/cast',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({gregorian_year:n})
      })
      const result=await response.json()
      if(!response.ok)throw new Error(typeof result.detail==='string'?
        result.detail:'请核对公历年份和选用的太乙岁计历元。')
      setChart(result);setPicked(result.year.taiyi_palace.number)
    }catch(e){setError(e?.message||'太乙岁计失败')}
    finally{setBusy(false)}
  }
  const chosen=chart?.nine_palaces.find(p=>p.number===picked)
  return <section className="taiyi-v64" aria-label="V64 太乙真实岁计">
    <header><small>V64 · 太乙神数 / 岁计阳遁</small>
      <h2>积年推局 · 太乙八宫行次</h2>
      <p>采用《古今图书集成》天启四年与《太乙金钥匙》嘉靖四十年的同系积年，
        实算五元、七十二局、太乙行宫、理天理地理人及岁计计神。此为岁计，
        不把冬夏至转换的时计阴阳规则混入。</p>
    </header>
    <form onSubmit={cast} className="taiyi-v64-form">
      <label>公历年份
        <input type="number" aria-label="太乙岁计公历年" min="1901" max="2099" step="1"
          value={year} onChange={e=>setYear(e.target.value)} required/>
      </label>
      <button type="submit" disabled={busy}>{busy?'正在排岁计…':'计算太乙年局'}</button>
    </form>
    {error&&<p className="academy-caution" role="alert">{error}</p>}
    {chart&&<div className="taiyi-v64-result">
      <div className="taiyi-v64-overview">
        <strong>{chart.year.gregorian_year}年 · {chart.year.five_yuan_name} · {chart.year.ju_label}</strong>
        <div><span>历史积年：{chart.year.accumulated_years.toLocaleString('zh-CN')}</span>
          <span>周纪余数：{chart.year.in_cycle_number} / 360</span>
          <span>计神：{chart.year.jishen} · 岁干支 {chart.year.sexagenary_year}</span></div>
        <p>太乙在 {chart.year.taiyi_palace.number}宫
          {chart.year.taiyi_palace.trigram}（{chart.year.taiyi_palace.direction}）
          · {chart.year.year_governing} · 本宫第 {chart.year.year_of_palace} 年</p>
      </div>
      <h3>太乙式九宫（上南下北）</h3>
      <div className="taiyi-v64-palaces" role="group" aria-label="太乙式九宫岁计盘">
        {chart.nine_palaces.map(p=><button type="button" key={p.number}
           className={[p.is_taiyi?'taiyi':'',p.is_center_unoccupied?'center':'',
             picked===p.number?'selected':''].join(' ')}
           onClick={()=>setPicked(p.number)}>
          <small>{p.direction}</small>
          <strong>{p.number}宫 · {p.trigram}</strong>
          <span>{p.is_taiyi?'太乙在此':p.is_center_unoccupied?'中五不游':'查看宫位'}</span>
        </button>)}
      </div>
      {chosen&&<p className="taiyi-v64-picked">
        当前查看：{chosen.number}宫 · {chosen.trigram} · {chosen.direction}。
        {chosen.is_taiyi?'本年太乙入此宫。':
          chosen.is_center_unoccupied?'太乙不进入中五宫。':'本年太乙不在此宫。'}
      </p>}
      <section aria-label="太乙五元及周期拆解" className="taiyi-v64-cycles">
        <h3>五元、三年与二十四年循环</h3>
        <div className="taiyi-v64-summary">
          <span>五元序号：第 {chart.year.five_yuan_number} 元</span>
          <span>周纪第 {chart.year.full_360_year_cycles+1} 周</span>
          <span>元内第 {chart.year.ju} / 72 局</span>
          <span>本元第 {chart.year.three_year_cycle} 个三年宫期</span>
          <span>八宫依次：{chart.palace_ring.map(x=>x.number+x.trigram).join(' → ')}</span>
        </div>
        <p>太乙式数字按“一乾、二离、三艮、四震、六兑、七坤、八坎、九巽”，
          不是常见洛书的“坎一离九”；中宫五不入。</p>
      </section>
      <section aria-label="太乙主客待校勘" className="taiyi-v64-pending">
        <h3>主客计算 · 原典校勘中</h3>
        <p>当前只完成岁计积年、入局、太乙落宫及计神。文昌天目、
          始击地目和投算程序尚未完成，因此本年主算、客算不输出。</p>
        <p>{chart.main_guest.reason}</p>
        {chart.main_guest.source_if_attested&&<p>
          该历史年份在古籍中有记载：主算
          {chart.main_guest.source_if_attested.main_count}、客算
          {chart.main_guest.source_if_attested.guest_count}。
          <strong>仅为古籍原文校验值，并非本版主客计算结果。</strong>
        </p>}
      </section>
      <p className="academy-caution">V64 为古典岁计结构推演，不包含月计、日计、时计或现代事件预测。
        不同太乙历元传承不能混用；不将未算出的主客将数字充当排盘结论。</p>
      <a href={chart.sources.historical_1624} target="_blank" rel="noopener noreferrer">
        《古今图书集成》1624 年原始年局案例</a>
      <span className="taiyi-v64-source-sep"> · </span>
      <a href={chart.sources.historical_1561} target="_blank" rel="noopener noreferrer">
        《太乙金钥匙》1561 年年局案例</a>
    </div>}
  </section>
}
