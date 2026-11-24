import {useLayoutEffect,useState,useRef} from 'react'
import CastResultPanels,{CastResultPanel} from './CastResultPanels.jsx'
import {useCastPage,CastPageNav,CastPagePane} from './CastPage.jsx'
import CastLesson,{CastHint} from './CastLesson.jsx'
import BeginnerReading from './BeginnerReading.jsx'
import {apiUrl} from './api-url.js'
import './ziwei-v68.css'

const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date())
const POS={巳:[1,1],午:[1,2],未:[1,3],申:[1,4],辰:[2,1],酉:[2,4],
 卯:[3,1],戌:[3,4],寅:[4,1],丑:[4,2],子:[4,3],亥:[4,4]}
const CAST_NOTES='按《紫微斗数全书》卷二安星，生年四化附在真实星曜落宫。壬年化科口径可切换；本版不作实务吉凶判断。'
const BRANCHES='子丑寅卯辰巳午未申酉戌亥'
const PALACE_TOPICS={
 命宫:'看人的整体特质与做事方式',兄弟:'看兄弟姐妹之间的相处',夫妻:'看亲密关系与长期伴侣之间的相处',
 子女:'看与子女的关系',财帛:'看收入、支出和资源的运用',疾厄:'从传统命盘的角度看身体与日常调养',
 迁移:'看离开熟悉环境后怎样适应和行动',交友:'看与朋友、同事和合作伙伴怎样互动',
 官禄:'看工作、职责与如何发挥能力',田宅:'看居住环境和家业',福德:'看内在感受、兴趣和休息方式',
 父母:'看与父母、长辈的关系和支持',
}
const STAR_THEMES={
 紫微:'主导与统筹',天机:'筹划与应变',太阳:'对外承担与表现',武曲:'资源与执行',天同:'和缓与享受',
 廉贞:'规则与职责',天府:'保管与积累',太阴:'居家与积蓄',贪狼:'交际与爱好',巨门:'言语与分歧',
 天相:'辅佐与协调',天梁:'照应与守则',七杀:'决断与压力',破军:'变动与消耗',
}
const STAR_SOURCE='https://zh.wikisource.org/zh-hans/紫微斗數全書/卷一#諸星問答論'
const palaceName=name=>name.endsWith('宫')?name:`${name}宫`

function ZiweiLesson({chart,chosen}){
 const bodyPalace=chart.palaces.find(palace=>palace.is_shen)
 const steps=[{
   title:'先在十二宫找到命宫和身宫',
   text:'切回「十二宫」，找带「命宫」和「身宫」标记的格子。可以先点命宫，再试着找到身宫所在的格子。',
   layout:'pillars',
   items:[{label:'命宫',value:chart.ming_ganzhi,active:true},
     {label:'身宫',value:bodyPalace?`${bodyPalace.branch} · ${bodyPalace.name}`:chart.shen_branch}],
 }]
 if(chosen){
   const showAuxiliary=Array.isArray(chosen.auxiliary_stars)
   steps.push({
     title:'看所选宫位里安排了哪些星',
     text:(showAuxiliary?'先看正曜，再看辅煞。':'先看这一宫的十四正曜。')+
       '切回「十二宫」换点另一个宫位，再进来就能对照新选的星曜。',
     layout:'sequence',
     items:[{label:'所选宫位',value:`${chosen.ganzhi} · ${chosen.name}`,active:true},
       {label:'十四正曜',value:chosen.main_stars.join('、')||'本宫无十四主星'},
       ...(showAuxiliary?[
         {label:'已安辅煞',value:chosen.auxiliary_stars.join('、')||'本宫未见已安辅煞'},
       ]:[])],
   })
 }
 if(chart.four_transformations?.length){
   steps.push({
     title:'顺着四化标记找星曜',
     text:'可以在「命盘四化」任选一条，记住星名和落宫，再回「十二宫」找到同一颗星。',
     layout:'pillars',
     items:chart.four_transformations.map(item=>({label:item.name,value:`${item.star} · ${item.palace_name}`})),
   })
 }
 return <CastLesson title="跟着你的紫微盘找宫与星" collapsed steps={steps}/>
}

function ZiweiPalaceReading({chart,palace}){
 const topic=PALACE_TOPICS[palace.name]
 if(!topic)return null
 const oppositeBranch=BRANCHES[(BRANCHES.indexOf(palace.branch)+6)%12]
 const opposite=chart.palaces.find(item=>item.branch===oppositeBranch)
 const themes=palace.main_stars
   .filter(star=>STAR_THEMES[star])
   .map(star=>`${star}常用来读${STAR_THEMES[star]}`)
 return <p className="ziwei-palace-reading">
   <strong>这个宫{topic}。</strong>
   {themes.length>0
     ?` 本盘的传统取象是${themes.join('，')}。结合这一宫的主题理解，再对照同宫的辅曜和四化。`
     :!palace.main_stars.length&&opposite?.main_stars?.length
       ?` 本宫没有十四主星，读盘时可从正对面的${palaceName(opposite.name)}及其${opposite.main_stars.join('、')}入手，再看本宫辅曜。`
       :' 先看此处列出的星曜和标记，再和同主题的其他宫位一起读。'}
 </p>
}

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
 const [fourSchool,setFourSchool]=useState('quanshu')
 const [chart,setChart]=useState(null)
 const [selected,setSelected]=useState(null)
 const [resultSection,setResultSection]=useState('palaces')
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const requestVersion=useRef(0)
 const palaceDetailHeading=useRef(null)
 const chosenPalaceButton=useRef(null)
 const restorePalaceFocus=useRef(false)
 const castPage=useCastPage('ziwei',!!chart)
 useLayoutEffect(()=>{
   if(!castPage.compact||castPage.page!=='result')return
   if(resultSection==='palace')palaceDetailHeading.current?.focus({preventScroll:true})
   if(resultSection==='palaces'&&restorePalaceFocus.current){
     restorePalaceFocus.current=false
     chosenPalaceButton.current?.focus({preventScroll:true})
   }
 },[castPage.compact,castPage.page,resultSection])
 function invalidate(){
   requestVersion.current+=1
   setChart(null);setSelected(null);setError('');setBusy(false)
 }
 async function submit(e){
   e.preventDefault()
   const ticket=++requestVersion.current
   setBusy(true);setError('');setChart(null);setSelected(null)
   const body={calendar_type:calendarType,clock,gender,leap_month_rule:leapRule,
     ...(fourSchool==='common'?{four_transform_school:'common'}:{}),
     ...(calendarType==='solar'?{solar_date:solarDate}:{
       lunar_year:Number(lunarYear),lunar_month:Number(lunarMonth),
       lunar_day:Number(lunarDay),is_leap_month:leap})}
   try{
     const res=await fetch(apiUrl('/api/ziwei/cast'),{method:'POST',
       headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
     const result=await res.json()
     if(!res.ok)throw new Error(typeof result.detail==='string'?
       result.detail:'出生日期、闰月或时辰无效')
     if(ticket===requestVersion.current){
       setChart(result);setSelected(result.ming_branch);setResultSection(castPage.compact?'reading':'palaces')
       castPage.showResult()
     }
   }catch(e){
     if(ticket===requestVersion.current)setError(e.message||'排盘失败')
   }finally{
     if(ticket===requestVersion.current)setBusy(false)
   }
 }
 const chosen=chart?.palaces?.find(p=>p.branch===selected)
 const bodyPalace=chart?.palaces?.find(p=>p.is_shen)
 return <section className="ziwei-v68" aria-label="V69 紫微四化与辅曜真实排盘">
   <CastPageNav title="紫微斗数" hasResult={!!chart} {...castPage}/>
   <CastPagePane name="form" {...castPage}>
   <header className="ziwei-cast-title"><small>V69 · 紫微斗数 / 四化与辅曜</small>
     <h2>十四正曜 · 十二辅煞 · 生年四化</h2>
     <p className="cast-form-desktop-notes">{CAST_NOTES}</p>
   </header>
   <form onSubmit={submit} className="ziwei-v68-form">
     <label>日期历法
       <select aria-label="紫微日期历法" value={calendarType}
         onChange={e=>{setCalendarType(e.target.value);invalidate()}}>
         <option value="solar">公历（阳历）</option><option value="lunar">农历（阴历）</option>
       </select>
     </label>
     {calendarType==='solar'?<label>公历出生日期
       <input type="date" aria-label="紫微公历日期" required
         min="1901-01-01" max="2099-12-31" value={solarDate}
         onChange={e=>{setSolarDate(e.target.value);invalidate()}}/>
     </label>:<>
       <label>农历出生年<input type="number" aria-label="紫微农历年" required
         min="1901" max="2099" value={lunarYear} onChange={e=>{setLunarYear(e.target.value);invalidate()}}/></label>
       <label>农历月<input type="number" aria-label="紫微农历月" required
         min="1" max="12" value={lunarMonth} onChange={e=>{setLunarMonth(e.target.value);invalidate()}}/></label>
       <label>农历日<input type="number" aria-label="紫微农历日" required
         min="1" max="30" value={lunarDay} onChange={e=>{setLunarDay(e.target.value);invalidate()}}/></label>
       <label className="ziwei-mobile-leap">出生于闰月
         <input type="checkbox" aria-label="紫微闰月" checked={leap}
           onChange={e=>{setLeap(e.target.checked);invalidate()}}/>
       </label>
     </>}
     <label>北京时间<input type="time" aria-label="紫微北京时间" required
       value={clock} onChange={e=>{setClock(e.target.value);invalidate()}}/></label>
     <label>性别（仅影响大限）
       <select aria-label="紫微性别" value={gender} onChange={e=>{setGender(e.target.value);invalidate()}}>
         <option value="unspecified">不填写（不排大限）</option>
         <option value="male">男</option><option value="female">女</option>
       </select>
     </label>
     <label>闰月安宫口径
       <select aria-label="紫微闰月口径" value={leapRule} onChange={e=>{setLeapRule(e.target.value);invalidate()}}>
         <option value="same_month">闰月按本月（默认）</option>
         <option value="next_month">闰月按下月（异法）</option>
       </select>
     </label>
     <label>生年四化流派
       <select aria-label="紫微四化流派" value={fourSchool}
         onChange={e=>{setFourSchool(e.target.value);invalidate()}}>
         <option value="quanshu">《紫微斗数全书》（壬年天府化科）</option>
         <option value="common">现代通行表（壬年左辅化科）</option>
       </select>
     </label>
     <button type="submit" disabled={busy}>{busy?'正在起盘…':'计算紫微命盘'}</button>
   </form>
   <CastHint>先填出生日期和北京时间。只看命宫和星曜时，性别可以留空。出生在农历闰月要勾选。</CastHint>
   {error&&<p role="alert" className="ziwei-v68-error">{error}</p>}
   <details className="cast-form-mobile-notes"><summary>紫微排盘说明</summary><p>{CAST_NOTES}</p></details>
   </CastPagePane>
   <CastPagePane name="result" {...castPage}>
   {chart&&<div className="ziwei-v68-result">
     <CastResultPanels label="紫微结果分类" value={resultSection} onValueChange={setResultSection}>
     <CastResultPanel value="reading" label="先读重点">
       <BeginnerReading title="紫微命盘怎么读"
         takeaway={`从${chart.ming_ganzhi}命宫看整体特质，再从身宫所在的${chart.shen_branch}位${bodyPalace?`「${palaceName(bodyPalace.name)}」`:''}看日常行动的侧重。`}
         reasons={[
           `用农历出生月定起点，再按${chart.hour_branch}时倒数到命宫、顺数到身宫。`,
           `命宫干支定出${chart.five_element_bureau.label}，再结合农历出生日安星，得到紫微在${chart.ziwei_branch}、天府在${chart.tianfu_branch}。`,
         ]}
         next="想看工作，在「十二宫」点官禄。想看感情点夫妻，想看财务点财帛。每宫会解释本盘标记和主题的关系。"
         actionLabel={castPage.compact?'看十二宫':undefined}
         onAction={castPage.compact?()=>setResultSection('palaces'):undefined}/>
       <ZiweiLesson chart={chart} chosen={chosen}/>
     </CastResultPanel>
     <CastResultPanel value="summary" label="命盘四化">
     <div className="ziwei-v68-summary">
       <h3>{chart.year_ganzhi}年 · {chart.five_element_bureau.label}</h3>
       <p>公历 {chart.calendar.solar_date} · 农历 {chart.calendar.lunar.display}
         · 北京时间 {chart.input.clock}（{chart.hour_branch}时）</p>
       <p>命宫 {chart.ming_ganzhi} · 身宫 {chart.shen_branch}
         · 紫微 {chart.ziwei_branch} · 天府 {chart.tianfu_branch}</p>
       <p>大限 {chart.great_limit_direction||'未排（未填写性别）'}
         · 闰月口径 {chart.rules.leap_month}</p>
       {chart.four_transformations&&<>
         <p>四化是按出生年的天干给四颗星加上的标记。看四化时，先找被标记的星，再看它落在哪个主题的宫位。</p>
         <p>四化口径：<strong>{chart.four_transform_school_label}</strong></p>
         <div className="ziwei-v69-transform-summary" role="group" aria-label="V69 生年四化落宫">
           {chart.four_transformations.map(t=><span key={t.name}>
             <b>{t.name}</b> · {t.star} · {t.branch}（{t.palace_name}）
           </span>)}
         </div>
       </>}
     </div>
     </CastResultPanel>
     <CastResultPanel value="palaces" label="十二宫">
     <div className="ziwei-v68-scroll">
       <div className="ziwei-v68-grid" role="group" aria-label="V69 紫微十二宫星盘">
         {chart.palaces.map(p=><button key={p.branch} type="button"
           style={{gridRow:POS[p.branch][0],gridColumn:POS[p.branch][1]}}
           className={['ziwei-v68-palace',p.is_ming?'ming':'',
              p.is_shen?'shen':'',selected===p.branch?'selected':''].join(' ')}
           ref={selected===p.branch?chosenPalaceButton:undefined}
           aria-pressed={selected===p.branch} onClick={()=>{
             setSelected(p.branch)
             if(castPage.compact)setResultSection('palace')
           }}>
           <small>{p.ganzhi} · {p.name}</small>
           <strong>{p.main_stars.join(' · ')||'无十四主星'}</strong>
           {p.auxiliary_stars?.length>0&&<small className="ziwei-v69-aux">
             {p.auxiliary_stars.join(' · ')}</small>}
           {p.four_transformations?.length>0&&<small className="ziwei-v69-four">
             {p.four_transformations.map(t=>t.star+t.name).join(' · ')}</small>}
           <span>{p.is_ming?'命宫 ':''}{p.is_shen?'身宫 ':''}
             {p.great_limit?'大限'+p.great_limit.start_age+'–'+p.great_limit.end_age:''}</span>
         </button>)}
         <div className="ziwei-v68-center"><small>万象书院</small>
           <strong>紫微十二宫</strong>
           <span>紫微 {chart.ziwei_branch} · 天府 {chart.tianfu_branch}</span>
         </div>
       </div>
     </div>
     </CastResultPanel>
     <CastResultPanel value="palace" label="宫位详情">
     {chosen&&<section className="ziwei-v68-picked" aria-label="当前选中的紫微宫位" aria-live="polite">
       {castPage.compact&&<button type="button" className="ziwei-v68-back-to-palaces" onClick={()=>{
         restorePalaceFocus.current=true
         setResultSection('palaces')
       }}>← 返回十二宫</button>}
       <h3 ref={palaceDetailHeading} tabIndex={-1}>{chosen.ganzhi} · {chosen.name}</h3>
       <ZiweiPalaceReading chart={chart} palace={chosen}/>
       <p>十四正曜：{chosen.main_stars.join('、')||'本宫无十四主星，不代表没有其他星曜'}。</p>
       {chart.auxiliary_star_positions&&<p>已安辅煞：
         {chosen.auxiliary_stars?.join('、')||'本宫未见本版十二颗辅煞星'}。</p>}
       {chosen.four_transformations?.length>0&&<p>
         生年四化：{chosen.four_transformations.map(x=>x.star+x.name).join('、')}。</p>}
       {chosen.great_limit&&<p>大限：{chosen.great_limit.start_age}–{chosen.great_limit.end_age}岁（传统虚岁）</p>}
     </section>}
     </CastResultPanel>
     <CastResultPanel value="sources" label="安星依据">
     <section className="ziwei-v68-trace" aria-label="紫微安星核对步骤">
       <h3>安星可核验步骤</h3>
       <p>{chart.five_element_bureau.number}局、农历{chart.ziwei_trace.day}日，
         借数{chart.ziwei_trace.borrowed}、商数{chart.ziwei_trace.quotient}，
         {chart.ziwei_trace.borrow_direction}，紫微落{chart.ziwei_trace.result}。</p>
       <p>{chart.rules.year_boundary}；{chart.rules.ming_shen}。</p>
       <p>历法来源：{chart.calendar.verification}。非官方历书；不校正地方真太阳时。</p>
       <a href={STAR_SOURCE} target="_blank" rel="noopener noreferrer">星曜传统含义参考《紫微斗数全书》卷一</a>
     </section>
     {chart.auxiliary_rules&&<section className="ziwei-v68-trace"
        aria-label="V69 辅曜安星计算依据">
       <h3>辅煞安星与四化口径</h3>
       <p>{chart.auxiliary_rules.month}；{chart.auxiliary_rules.hour}。</p>
       <p>{chart.auxiliary_rules.year_stem}；{chart.auxiliary_rules.year_branch}。</p>
       <p>{chart.auxiliary_rules.variant}。四化仅显示星曜落宫，不据此自动断吉凶。</p>
       {chart.four_transform_disagreement&&<p className="ziwei-v68-warning">
         壬年异文：本次化科采用{chart.four_transform_disagreement.chosen_star}。
         《全书》作{chart.four_transform_disagreement.quanshu_star}，
         现代通行表作{chart.four_transform_disagreement.common_star}。
       </p>}
     </section>}
     {chart.warnings?.map((w,i)=><p key={i} className="ziwei-v68-warning">{w}</p>)}
     <p className="ziwei-v68-warning">仍未实现：{chart.not_implemented.join('、')}。</p>
     </CastResultPanel>
     </CastResultPanels>
   </div>}
   </CastPagePane>
 </section>
}
