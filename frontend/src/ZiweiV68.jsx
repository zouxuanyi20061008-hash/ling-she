import {useState} from 'react'
import './ziwei-v68.css'

const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date())
const POS={巳:[1,1],午:[1,2],未:[1,3],申:[1,4],辰:[2,1],酉:[2,4],
 卯:[3,1],戌:[3,4],寅:[4,1],丑:[4,2],子:[4,3],亥:[4,4]}

export default function ZiweiV68(){
 const [calendarType,setCalendarType]=useState('solar')
 const [solarDate,setSolarDate]=useState(today)
 const [lunarYear,setLunarYear]=useState(1980)
 const [lunarMonth,setLunarMonth]=useState(1)
 const [lunarDay,setLunarDay]=useState(4)
 const [leap,setLeap]=useState(false)
 const [clock,setClock]=useState('09:00')
 const [gender,setGender]=useState('unspecified')
 const [leapRule,setLeapRule]=useState('same_month')
 const [chart,setChart]=useState(null)
 const [selected,setSelected]=useState(null)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 async function submit(e){
   e.preventDefault()
   setBusy(true);setError('');setChart(null);setSelected(null)
   const body={calendar_type:calendarType,clock,gender,leap_month_rule:leapRule,
     ...(calendarType==='solar'?{solar_date:solarDate}:{
       lunar_year:Number(lunarYear),lunar_month:Number(lunarMonth),
       lunar_day:Number(lunarDay),is_leap_month:leap})}
   try{
     const res=await fetch('/api/ziwei/cast',{method:'POST',
       headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
     const result=await res.json()
     if(!res.ok)throw new Error(typeof result.detail==='string'?
       result.detail:'出生日期、闰月或时辰无效')
     setChart(result);setSelected(result.ming_branch)
   }catch(e){setError(e.message||'排盘失败')}
   finally{setBusy(false)}
 }
 const chosen=chart?.palaces?.find(p=>p.branch===selected)
 return <section className="ziwei-v68" aria-label="V68 紫微真实基础排盘">
   <header><small>V68 · 紫微斗数 / 十四正曜</small>
     <h2>安命身 · 定五行局 · 布十四主星</h2>
     <p>真实农历生日转换与十二宫命盘。本版暂不包含四化、辅煞及实务论断。</p>
   </header>
   <form onSubmit={submit} className="ziwei-v68-form">
     <label>日期历法
       <select aria-label="紫微日期历法" value={calendarType}
         onChange={e=>{setCalendarType(e.target.value);setChart(null)}}>
         <option value="solar">公历（阳历）</option><option value="lunar">农历（阴历）</option>
       </select>
     </label>
     {calendarType==='solar'?<label>公历出生日期
       <input type="date" aria-label="紫微公历日期" required
         min="1901-01-01" max="2099-12-31" value={solarDate}
         onChange={e=>setSolarDate(e.target.value)}/>
     </label>:<>
       <label>农历出生年<input type="number" aria-label="紫微农历年" required
         min="1901" max="2099" value={lunarYear} onChange={e=>setLunarYear(e.target.value)}/></label>
       <label>农历月<input type="number" aria-label="紫微农历月" required
         min="1" max="12" value={lunarMonth} onChange={e=>setLunarMonth(e.target.value)}/></label>
       <label>农历日<input type="number" aria-label="紫微农历日" required
         min="1" max="30" value={lunarDay} onChange={e=>setLunarDay(e.target.value)}/></label>
       <label>出生于闰月
         <input type="checkbox" aria-label="紫微闰月" checked={leap}
           onChange={e=>setLeap(e.target.checked)}/>
       </label>
     </>}
     <label>北京时间<input type="time" aria-label="紫微北京时间" required
       value={clock} onChange={e=>setClock(e.target.value)}/></label>
     <label>性别（仅影响大限）
       <select aria-label="紫微性别" value={gender} onChange={e=>setGender(e.target.value)}>
         <option value="unspecified">不填写（不排大限）</option>
         <option value="male">男</option><option value="female">女</option>
       </select>
     </label>
     <label>闰月安宫口径
       <select aria-label="紫微闰月口径" value={leapRule} onChange={e=>setLeapRule(e.target.value)}>
         <option value="same_month">闰月按本月（默认）</option>
         <option value="next_month">闰月按下月（异法）</option>
       </select>
     </label>
     <button type="submit" disabled={busy}>{busy?'正在起盘…':'计算紫微命盘'}</button>
   </form>
   {error&&<p role="alert" className="ziwei-v68-error">{error}</p>}
   {chart&&<div className="ziwei-v68-result">
     <div className="ziwei-v68-summary">
       <h3>{chart.year_ganzhi}年 · {chart.five_element_bureau.label}</h3>
       <p>公历 {chart.calendar.solar_date} · 农历 {chart.calendar.lunar.display}
         · 北京时间 {chart.input.clock}（{chart.hour_branch}时）</p>
       <p>命宫 {chart.ming_ganzhi} · 身宫 {chart.shen_branch}
         · 紫微 {chart.ziwei_branch} · 天府 {chart.tianfu_branch}</p>
       <p>大限 {chart.great_limit_direction||'未排（未填写性别）'}
         · 闰月口径 {chart.rules.leap_month}</p>
     </div>
     <div className="ziwei-v68-scroll">
       <div className="ziwei-v68-grid" role="group" aria-label="V68 紫微十二宫星盘">
         {chart.palaces.map(p=><button key={p.branch} type="button"
           style={{gridRow:POS[p.branch][0],gridColumn:POS[p.branch][1]}}
           className={['ziwei-v68-palace',p.is_ming?'ming':'',
              p.is_shen?'shen':'',selected===p.branch?'selected':''].join(' ')}
           aria-pressed={selected===p.branch} onClick={()=>setSelected(p.branch)}>
           <small>{p.ganzhi} · {p.name}</small>
           <strong>{p.main_stars.join(' · ')||'无十四主星'}</strong>
           <span>{p.is_ming?'命宫 ':''}{p.is_shen?'身宫 ':''}
             {p.great_limit?'大限'+p.great_limit.start_age+'–'+p.great_limit.end_age:''}</span>
         </button>)}
         <div className="ziwei-v68-center"><small>万象书院</small>
           <strong>紫微十二宫</strong>
           <span>紫微 {chart.ziwei_branch} · 天府 {chart.tianfu_branch}</span>
         </div>
       </div>
     </div>
     {chosen&&<section className="ziwei-v68-picked" aria-label="当前选中的紫微宫位">
       <h3>{chosen.ganzhi} · {chosen.name}</h3>
       <p>十四正曜：{chosen.main_stars.join('、')||'本宫无十四主星，不代表没有其他星曜'}。</p>
       {chosen.great_limit&&<p>大限：{chosen.great_limit.start_age}–{chosen.great_limit.end_age}岁（传统虚岁）</p>}
     </section>}
     <section className="ziwei-v68-trace" aria-label="紫微安星核对步骤">
       <h3>安星可核验步骤</h3>
       <p>{chart.five_element_bureau.number}局、农历{chart.ziwei_trace.day}日，
         借数{chart.ziwei_trace.borrowed}、商数{chart.ziwei_trace.quotient}，
         {chart.ziwei_trace.borrow_direction}，紫微落{chart.ziwei_trace.result}。</p>
       <p>{chart.rules.year_boundary}；{chart.rules.ming_shen}。</p>
       <p>历法来源：{chart.calendar.verification}。非官方历书；不校正地方真太阳时。</p>
     </section>
     {chart.warnings?.map((w,i)=><p key={i} className="ziwei-v68-warning">{w}</p>)}
     <p className="ziwei-v68-warning">仍未实现：{chart.not_implemented.join('、')}。</p>
   </div>}
 </section>
}
