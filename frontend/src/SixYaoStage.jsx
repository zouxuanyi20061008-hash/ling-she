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

function SolarDateAssist({day,month,onApply,busy}){
  const [mode,setMode]=useState('solar')
  const [date,setDate]=useState('')
  const [lunarYear,setLunarYear]=useState('')
  const [lunarMonth,setLunarMonth]=useState('1')
  const [lunarDay,setLunarDay]=useState('1')
  const [isLeap,setIsLeap]=useState(false)
  const [clock,setClock]=useState('12:00')
  const [boundary,setBoundary]=useState('midnight')
  const [loading,setLoading]=useState(false)
  const [preview,setPreview]=useState(null)
  const [error,setError]=useState('')
  const request=useRef(0)
  const change=(setter,value)=>{
    request.current+=1
    setter(value);setPreview(null);setError('')
  }
  function currentTime(){
    const parts=new Intl.DateTimeFormat('en-GB',{
      timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',
      hour:'2-digit',minute:'2-digit',hourCycle:'h23'
    }).formatToParts(new Date())
    const v=x=>parts.find(p=>p.type===x)?.value||'00'
    request.current+=1;setMode('solar')
    setDate(v('year')+'-'+v('month')+'-'+v('day'))
    setClock(v('hour')+':'+v('minute'))
    setPreview(null);setError('')
  }
  async function calculate(){
    if(mode==='solar'&&!date){setError('请选择公历（阳历）日期。');return}
    if(mode==='lunar'&&!lunarYear){setError('请填写农历年份。');return}
    const token=++request.current
    setLoading(true);setError('');setPreview(null)
    const payload={calendar_type:mode,clock,day_boundary:boundary}
    if(mode==='solar')payload.date=date
    else {
      payload.lunar_year=Number(lunarYear)
      payload.lunar_month=Number(lunarMonth)
      payload.lunar_day=Number(lunarDay)
      payload.is_leap_month=isLeap
    }
    try{
      const response=await fetch(api+'/api/liuyao/calendar-preview',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)})
      const result=await response.json()
      if(!response.ok)throw Error(typeof result.detail==='string'?result.detail:'日期换算失败，请核对农历年份和闰月')
      if(token===request.current)setPreview(result)
    }catch(e){if(token===request.current)setError(e.message)}
    finally{if(token===request.current)setLoading(false)}
  }
  return <section className="solar-assist" aria-label="中国公历农历换算和节令月建">
    <div className="solar-assist-head">
      <strong>中国历法 · 农历 / 公历换算</strong>
      <span>统一北京时间 UTC+8</span>
    </div>
    <p>两种日期都可以输入，统一按北京时间计算。<strong>农历月份不是六爻月建</strong>：月建以节气交节为准。系统只提供预览，你确认后才会改动卦盘。</p>
    <div className="solar-assist-tabs" role="group" aria-label="选择日期类型">
      <button type="button" className={mode==='solar'?'active':''}
        aria-pressed={mode==='solar'} onClick={()=>change(setMode,'solar')}>公历（阳历）</button>
      <button type="button" className={mode==='lunar'?'active':''}
        aria-pressed={mode==='lunar'} onClick={()=>change(setMode,'lunar')}>农历（阴历）</button>
    </div>
    <div className="solar-assist-grid">
      {mode==='solar'?<label>公历年月日
        <input type="date" value={date} min="1901-01-01" max="2099-12-31"
          onChange={e=>change(setDate,e.target.value)}/>
      </label>:<>
        <label>农历年份
          <input type="number" value={lunarYear} min="1901" max="2099" step="1"
            placeholder="例如 2026" onChange={e=>change(setLunarYear,e.target.value)}/>
        </label>
        <label>农历月份
          <select value={lunarMonth} onChange={e=>{change(setLunarMonth,e.target.value);setIsLeap(false)}}>
            {Array.from({length:12},(_,i)=><option value={i+1} key={i+1}>{i+1}月</option>)}
          </select>
        </label>
        <label>农历日期
          <select value={lunarDay} onChange={e=>change(setLunarDay,e.target.value)}>
            {Array.from({length:30},(_,i)=><option value={i+1} key={i+1}>{i+1}日</option>)}
          </select>
        </label>
        <label className="solar-assist-leap">
          <input type="checkbox" checked={isLeap} onChange={e=>change(setIsLeap,e.target.checked)}/>
          该月是闰月
        </label>
      </>}
      <label>北京时间
        <input type="time" value={clock} onChange={e=>change(setClock,e.target.value)}/>
      </label>
      <label>日干支换日规则
        <select value={boundary} onChange={e=>change(setBoundary,e.target.value)}>
          <option value="midnight">零点换日</option>
          <option value="zi_hour">子初 23:00 换日</option>
        </select>
      </label>
    </div>
    <div className="solar-assist-actions">
      <button type="button" onClick={currentTime}>填写当前北京时间</button>
      <button type="button" disabled={loading||busy||(mode==='solar'?!date:!lunarYear)} onClick={calculate}>
        {loading?'正在换算…':'换算日期与节令'}
      </button>
    </div>
    {error&&<p role="alert" className="solar-assist-error">{error}</p>}
    {preview&&<div className="solar-assist-result" aria-live="polite">
      <div className="solar-assist-date-pair">
        <div><small>公历（阳历）</small><strong>{preview.solar_date}</strong></div>
        <div><small>农历（阴历）</small><strong>{preview.lunar.display}</strong></div>
      </div>
      <div className="solar-assist-values">
        <div><small>日干支</small><strong>{preview.day_ganzhi}日</strong></div>
        <div><small>六爻节令月建（非农历月份）</small><strong>{preview.month_branch}月</strong><span>{preview.month_ganzhi}月柱</span></div>
      </div>
      <div className="solar-assist-terms">
        <p>上一交节：{preview.previous_jie.name} · 北京时间 {preview.previous_jie.beijing_time.replace('T',' ').slice(0,16)}</p>
        <p>下一交节：{preview.next_jie.name} · 北京时间 {preview.next_jie.beijing_time.replace('T',' ').slice(0,16)}</p>
      </div>
      {preview.warnings.length>0&&<div role="alert" className="solar-assist-warning">
        {preview.warnings.map((v,i)=><p key={i}>{v}</p>)}
      </div>}
      {(day||month)&&<p className="solar-assist-compare">
        当前已选：{day||'日辰未选'} / {month?month+'月':'月建未选'}。
        {day===preview.day_ganzhi&&month===preview.month_branch?'与预览相同。':'预览结果与当前选择不同，请核对后再采纳。'}
      </p>}
      <button type="button" className="solar-assist-apply" disabled={loading||busy}
        onClick={()=>onApply(preview.day_ganzhi,preview.month_branch)}>
        确认采用这组日干支与月建 ↗
      </button>
      <p className="solar-assist-disclaimer">{preview.notice}</p>
    </div>}
  </section>
}

function CalendarControls({chart,day,month,onChange,busy}) {
  const dayInfo=chart.calendar?.day
  const monthInfo=chart.calendar?.month
  return <section className="calendar-volume" aria-label="核对六爻日辰月建">
    <header className="calendar-volume-heading">
      <div><small>第四式 · 日月校时</small><h3>择日辰，布六神。</h3></div>
      <span className="calendar-volume-stamp">时</span>
    </header>
    <p className="calendar-help">可使用下方中国农历／公历换算预览，再亲自采纳；也可以直接手动填写<strong>真实的六十甲子日</strong>和节令月建。留空则不编六神、旬空。</p>
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
    <p className="calendar-boundary">采纳自动换算结果后，日月参与传统排盘规则；节气边界、子时与历算争议仍需复核，不代表完整旺衰判断。</p>
  </section>
}


const FOCUS_OPTIONS=[
  {id:'父母',subtitle:'长辈 · 契约',icon:'文'},
  {id:'官鬼',subtitle:'功名 · 约束',icon:'官'},
  {id:'兄弟',subtitle:'同辈 · 朋友',icon:'友'},
  {id:'妻财',subtitle:'财产 · 收益',icon:'财'},
  {id:'子孙',subtitle:'子女 · 动物',icon:'子'},
  {id:'世爻',subtitle:'自身 · 自方',icon:'世'},
  {id:'应爻',subtitle:'对方 · 他方',icon:'应'}
]
function YongshenGuide({chart,chosen,onChoose,busy}) {
  const focus=chart.focus
  return <section className="yongshen-volume" aria-label="六爻用神取象教学">
    <header className="yongshen-header">
      <div><span>第五式 · 因事取用</span><h3>先明所问，再寻其神。</h3></div>
      <span className="yongshen-sign">神</span>
    </header>
    <p className="yongshen-overview">《增删卜易》按所问对象分类用神。这里<strong>由你选择关注的对象</strong>，系统只标出本卦对应的六亲或世应，不会由 AI 自动替你确定。</p>
    <div className="yongshen-choices" role="group" aria-label="选择本次学习的用神类别">
      {FOCUS_OPTIONS.map(x=><button key={x.id} type="button"
        disabled={busy}
        className={chosen===x.id?'active':''} aria-pressed={chosen===x.id}
        onClick={()=>onChoose(chosen===x.id?'':x.id)}>
        <span className="yongshen-choice-mark">{x.icon}</span>
        <b>{x.id}</b><small>{x.subtitle}</small>
      </button>)}
    </div>
    {!focus?<div className="yongshen-unselected">请先明确想观察的是谁、什么事。也可以不选，先学习完整卦盘。</div>:
      <div className="yongshen-selection" aria-live="polite">
        <p className="yongshen-selection-kicker">已选择 · {focus.category} <span>（由求测者确认）</span></p>
        <h4>{focus.themes}</h4>
        <p>{focus.why}</p>
        <div className="yongshen-example-list">{focus.examples?.map(t=><span key={t}>{t}</span>)}</div>
        <div className="yongshen-diagnosis">
          <strong>{focus.found_in_ben?
            '本卦相关位置：'+focus.primary_positions.map(i=>['初','二','三','四','五','上'][i-1]+'爻').join('、'):
            '本卦不现所选六亲'}</strong>
          <p>{focus.moving_positions.length?
             '其中发动：'+focus.moving_positions.map(i=>['初','二','三','四','五','上'][i-1]+'爻').join('、'):
             '本卦没有该类别的发动之爻。'}</p>
          <p>{focus.note}</p>
        </div>
      </div>}
    <div className="yongshen-classics">
      <span>校读原典</span>
      <a href="https://zh.wikisource.org/zh-hans/增删卜易/8" target="_blank" rel="noopener noreferrer">《增删卜易》· 用神章第八 ↗</a>
      <a href="https://zh.wikisource.org/zh-hans/增删卜易/9" target="_blank" rel="noopener noreferrer">用神、元神、忌神、仇神章 ↗</a>
    </div>
  </section>
}


const RELATION_ROLES=[
  {name:'用神',desc:'所问之象'},
  {name:'原神',desc:'五行生用神'},
  {name:'忌神',desc:'五行克用神'},
  {name:'仇神',desc:'克原神 · 生忌神'}
]
function SpiritRelationsPanel({chart,activeRole,onChange,busy}) {
  const study=chart.spirit_relations
  if(!study)return <section className="spirit-panel">
    <div className="spirit-panel-top"><span>第六式 · 推原忌仇</span><strong>选定关注对象后解锁</strong></div>
    <p>先在上方「因事取用」中选择父母、官鬼、兄弟、妻财、子孙或世应，再查看这一卦的五行支持与制约关系。</p>
  </section>
  if(study.status==='not_visible')return <section className="spirit-panel" aria-live="polite">
    <div className="spirit-panel-top"><span>第六式 · 推原忌仇</span><strong>本卦不现</strong></div>
    <p>{study.note}</p>
    <a href={study.reference} target="_blank" rel="noopener noreferrer">阅读《增删卜易》原典 ↗</a>
  </section>
  const selected=study.roles[activeRole]||study.roles['用神']
  return <section className="spirit-panel" aria-label="原神忌神仇神关系分析">
    <div className="spirit-panel-top"><span>第六式 · 推原忌仇</span><strong>以{study.focus_element}为关注五行</strong></div>
    <h3>五行之间，如何相生相克？</h3>
    <p className="spirit-intro">已按你选定的「{study.basis}」定位。选择下列任一关系，盘中实际出现的本卦爻位会相应标注。</p>
    <div className="spirit-role-grid">
      {RELATION_ROLES.map(r=>{
        const data=study.roles[r.name]
        return <button type="button" className={activeRole===r.name?'selected':''}
          aria-pressed={activeRole===r.name} disabled={busy} onClick={()=>onChange(r.name)} key={r.name}>
          <strong>{r.name}</strong><span>{data.element}行</span><small>{r.desc}</small>
          <em>{data.visible?data.positions.length+' 爻可见':'本卦未见'}</em>
        </button>
      })}
    </div>
    <div className="spirit-selected" aria-live="polite">
      <span>当前查看 · {activeRole} · {selected.element}行</span>
      <p>{selected.description}</p>
      <strong>{selected.visible?'本卦：'+selected.lines.map(l=>POS[l.position-1]+'爻 '+l.ganzhi+(l.moving?'（动）':'')).join('、'):'当前本卦没有符合此关系的可见爻'}</strong>
      {selected.moving_positions.length>0&&<p>发动爻：{selected.moving_positions.map(i=>POS[i-1]+'爻').join('、')}。发动不等于必然能生克，还要结合实际日月、动变等条件。</p>}
    </div>
    {study.moving_transforms.length>0&&<details className="spirit-transform">
      <summary>查看动爻变出干支（{study.moving_transforms.length} 爻）</summary>
      <p>{study.moving_transforms.map(l=>POS[l.position-1]+'爻 → '+l.ganzhi+'（'+l.element+'）').join('、')}。这里只列变化，不自动判断回头生克。</p>
    </details>}
    <p className="spirit-boundary">{study.note}</p>
    <a href={study.reference} target="_blank" rel="noopener noreferrer">《增删卜易》· 用神元神忌神仇神章 ↗</a>
  </section>
}


function FuShenStudy({chart,onChoose,busy}){
  const data=chart.fushen
  if(!data)return null
  const selected=data.selected
  const entries=selected?.status==='hidden_in_palace'?selected.entries:[]
  const candidateReview=selected?.day_month_review
  const missing=data.missing_relatives
  return <section className="fushen-study" aria-label="六爻飞伏神教学装卦">
    <div className="fushen-heading"><span>第七式 · 飞伏寻踪</span><strong>{data.palace}宫 · {data.pure_hexagram}</strong></div>
    <p>先查本卦缺少哪些六亲，再回到本宫首卦取同位伏神。本卦同一爻位为<strong>飞神</strong>；隐藏者不是额外的第七爻。</p>
    <div className="fushen-summary">
      <small>本卦缺失的六亲</small>
      {missing.length?<div className="fushen-missing">
        {missing.map(relative=><button type="button" key={relative}
          onClick={()=>onChoose(relative)} disabled={busy}
          className={selected?.category===relative?'active':''}
          aria-pressed={selected?.category===relative}>
          {relative} · {data.by_relative[relative].length} 处伏神 ↗
        </button>)}
      </div>:<strong>五种六亲均现于本卦，不必装缺失六亲的伏神。</strong>}
    </div>
    {selected?.status==='hidden_in_palace'?<div className="fushen-detail" aria-live="polite">
      <h3>{selected.category}不现 · 本宫找伏神</h3>
      <p>{selected.note}</p>
      <div className="fushen-pairs">{entries.map((entry,i)=><article key={entry.position+'-'+i}>
        <span>第 {POS[entry.position-1]} 爻 · 飞伏同位</span>
        <div className="fushen-pair">
          <div><small>飞神（本卦明爻）</small><strong>{entry.flying.ganzhi}</strong>
            <span>{entry.flying.liuqin} · {entry.flying.element}{entry.flying.moving?' · 动爻':''}</span></div>
          <span className="fushen-pair-arrow">↓ 伏</span>
          <div><small>伏神（本宫首卦）</small><strong>{entry.hidden.ganzhi}</strong>
            <span>{entry.hidden.liuqin} · {entry.hidden.element}</span></div>
        </div>
        <b>{entry.flying_hidden_relation}</b>
      </article>)}</div>
      {candidateReview&&<div className="fushen-day-note">
        <b>日月取用提醒</b>
        <p>{candidateReview.note}</p>
        <span>日辰：{candidateReview.day_branch?
          candidateReview.day_branch+'支 · '+(candidateReview.day_same_element?'五行同类':'五行不同类'):'未确认'}</span>
        <span>月建：{candidateReview.month_branch?
          candidateReview.month_branch+'月 · '+(candidateReview.month_same_element?'五行同类':'五行不同类'):'未确认'}</span>
      </div>}
    </div>:
    selected?.status==='visible'||selected?.status==='position_only'?
      <p className="fushen-selected-note">{selected.note}</p>:
      <p className="fushen-selected-note">点击上方缺失六亲，即可查看对应的飞伏配对。无缺失时，不会编造伏神。</p>}
    <p className="fushen-warning">{data.boundary}</p>
    <a href={data.reference} target="_blank" rel="noopener noreferrer">核读《增删卜易》· 飞伏神章 ↗</a>
  </section>
}







function YongshenPathwaysStudy({chart}){
  const data=chart.yongshen_pathways
  const [chosen,setChosen]=useState(null)
  if(!data)return null
  const positions=data.focus_candidates.map(x=>x.position)
  const pos=positions.includes(chosen)?chosen:
    positions.includes(data.selected_position)?data.selected_position:positions[0]
  const candidate=data.focus_candidates.find(x=>x.position===pos)
  const groups=[
    {key:'原神',explain:'五行生用神'},
    {key:'忌神',explain:'五行克用神'},
    {key:'仇神',explain:'克原神、间接生忌神'}
  ]
  return <section className="yongshen-chain" aria-label="用神原忌仇神逐爻合参">
    <header className="yongshen-chain-head">
      <div><small>第十六式 · 原忌仇合参</small><h3>沿着用神，追查每条作用路径。</h3></div>
      <span>非自动断吉凶</span>
    </header>
    <p className="yongshen-chain-lead">{data.comparison} 原神、忌神与仇神的名称表示传统五行角色，并不代表一定已经发挥作用。</p>
    {data.status==='focus_not_selected'?<p className="yongshen-chain-empty">请先进入第二步「因事取用」，选定要研究的六亲或世应。</p>:
     data.status==='focus_not_visible'?<div className="yongshen-chain-empty">
       <strong>本卦用神不现</strong><p>{data.message}</p>
       <p>请先回到第二步核对日月与本宫飞伏，不凭隐藏伏神伪造本卦明动生克路径。</p>
     </div>:<>
       <div className="yongshen-chain-picks" role="group" aria-label="选择要核对的用神候选">
         {data.focus_candidates.map(c=><button type="button" key={c.position}
           aria-pressed={pos===c.position} className={pos===c.position?'active':''}
           onClick={()=>setChosen(c.position)}>
           {POS[c.position-1]}爻 · {c.ganzhi}
           {c.selected_by_user&&<small>人工指定</small>}
         </button>)}
       </div>
       {candidate&&<>
         {candidate.focus_has_opposing_indicators&&<p className="yongshen-chain-notice">
           当前候选用神自身已有生扶与制约并见的标记；以下原忌仇神同样必须分别审查。
         </p>}
         {data.moving_yuan_ji_together&&<p className="yongshen-chain-notice">
           本卦原神与忌神均有明动爻。古籍讨论二者同动的特殊情况，但不能视作自动互相抵消。
         </p>}
         <div className="yongshen-chain-groups">
           {groups.map(g=><article key={g.key} className={'yongshen-chain-role '+g.key}>
             <header><strong>{g.key} · {data.roles[g.key]?.element}</strong><small>{g.explain}</small></header>
             {!candidate.pathways[g.key].length?<p className="yongshen-chain-no-source">本卦此五行没有明现爻；不能补造来源。</p>:
               candidate.pathways[g.key].map(path=><div className="yongshen-chain-source" key={path.source_position}>
                 <b>{POS[path.source_position-1]}爻 · {path.source_ganzhi}</b>
                 <small>{path.source_liuqin} · {path.source_season||'月令未核对'}</small>
                 <p>{path.direction}</p>
                 <p className="yongshen-chain-source-status">
                   {path.status==='moving_path_pending_effect'?'明动路径已记录 · 实际效力待辨':
                    path.status==='indirect_role_not_direct_action'?'间接五行角色 · 不是直接克用神':
                    '安静爻 · 仅有五行关系，未形成已确认的动爻作用'}
                 </p>
                 {path.relation_to_target&&<p>本卦作用边：{path.relation_to_target}</p>}
                 {path.source_flags.length>0&&<div className="yongshen-chain-flags">
                   {path.source_flags.map((flag,i)=><span key={i}>{flag}</span>)}
                 </div>}
                 <small>生扶线索 {path.source_supporting_count} 项 / 制约条件 {path.source_restraining_count} 项 · 仅供追查，不是分数</small>
               </div>)}
           </article>)}
         </div>
       </>}
     </>}
    <p className="yongshen-chain-boundary">{data.boundary}</p>
    <div className="yongshen-chain-links">
      <a href={data.references.roles} target="_blank" rel="noopener noreferrer">《增删卜易》用神原忌仇章 ↗</a>
      <a href={data.references.strength} target="_blank" rel="noopener noreferrer">元神忌神衰旺章 ↗</a>
    </div>
  </section>
}

function SpecialConditionsStudy({chart}){
  const data=chart.special_conditions
  const [inspected,setInspected]=useState(null)
  if(!data)return null
  const chosen=inspected??data.selected_focus_position??data.affected_positions[0]??1
  const row=data.rows[chosen-1]
  const types=[
    {id:'combinations',name:'六合、合起与合绊',empty:'此爻尚无已计算的六合条件'},
    {id:'tombs',name:'日墓、动墓与化墓',empty:'此爻尚无已计算的三墓条件'},
    {id:'extinctions',name:'绝地与化绝',empty:'此爻尚无已计算的逢绝条件'}
  ]
  return <section className="special-conditions" aria-label="六合墓绝的教学审议">
    <div className="special-conditions-head"><div>
      <small>第十五式 · 合墓绝审议</small>
      <h3>见合须分动静，逢墓绝先列条件。</h3>
    </div><span>{data.affected_positions.length} 爻有参考条件</span></div>
    <p className="special-conditions-intro">
      本页参考《增删卜易》的六合、三墓章与《卜筮正宗》的绝处逢生论。
      <strong>这里只核对对应地支，不断合绊有效、出入墓成败或绝处生死。</strong>
    </p>
    <div className="special-conditions-positions" role="group" aria-label="选择查看墓绝合条件的爻位">
      {data.rows.map(x=><button key={x.position} type="button" aria-pressed={chosen===x.position}
          onClick={()=>setInspected(x.position)} className={chosen===x.position?'active':''}>
        {POS[x.position-1]}爻
        {x.has_any_condition&&<small>有条件</small>}
      </button>)}
    </div>
    <div className="special-conditions-selected">
      <strong>{POS[row.position-1]}爻 · {row.ganzhi}</strong>
      <span>{row.element} · {row.moving?'明动':'静爻'} · 墓支{row.tomb_branch} · 绝地{row.extinction_branch}</span>
    </div>
    <div className="special-conditions-list">
      {types.map(group=><article key={group.id}>
        <h4>{group.name}</h4>
        {row[group.id].length?row[group.id].map((x,i)=><div key={i} className="special-conditions-entry">
          <b>{x.kind}</b><small>来源：{x.source}</small><p>{x.detail}</p>
        </div>):<p className="special-conditions-empty">{group.empty}</p>}
      </article>)}
    </div>
    {row.pending.length>0&&<div className="special-conditions-caution">
      <b>缺少日月条件</b>
      {row.pending.map((x,i)=><p key={i}>{x}</p>)}
    </div>}
    {row.warnings.length>0&&<div className="special-conditions-caution">
      <b>必须合参</b>
      {row.warnings.map((x,i)=><p key={i}>{x}</p>)}
    </div>}
    <p className="special-conditions-limits">{data.scope}</p>
    <div className="special-conditions-sources">
      <a href={data.references.liuhe} target="_blank" rel="noopener noreferrer">六合章 ↗</a>
      <a href={data.references.three_tombs} target="_blank" rel="noopener noreferrer">随鬼入墓章 ↗</a>
      <a href={data.references.extinction} target="_blank" rel="noopener noreferrer">绝处逢生论 ↗</a>
    </div>
  </section>
}

function MovingEffectReview({chart}) {
  const data=chart.moving_effect_review
  const [inspected,setInspected]=useState(null)
  if(!data)return null
  const positions=data.moving_positions
  const selected=positions.includes(inspected)?inspected:
    positions.includes(data.selected_focus_position)?data.selected_focus_position:positions[0]
  const item=data.movements.find(x=>x.position===selected)
  function EvidenceSide({side,label}){
    const actions=[side.day,side.month]
    return <article className="moving-effect-side">
      <small>{label} · {side.ganzhi}</small>
      <h4>{side.element} · {side.season||'月令未核'}</h4>
      {actions.map(a=><p key={a.source}>
        <b>{a.source}：</b>
        {a.status==='computed'?a.relation+
          (a.clash?' · 相冲':'')+
          (a.combine?' · 六合':'')+
          (a.same_branch?' · 临建':''):'尚未确认'}
      </p>)}
      <div className="moving-effect-badges">
        <span>{side.void===null?'旬空待核':side.void?'旬空':'不空'}</span>
        <span>{side.month_clash===null?'月冲待核':side.month_clash?'月破条件':'未月冲'}</span>
        <span>{side.day_clash===null?'日冲待核':side.day_clash?'逢日冲':'未日冲'}</span>
      </div>
    </article>
  }
  return <section className="moving-effect-review" aria-label="六爻本位动变与日月效力辨析">
    <header className="moving-effect-head">
      <div><small>第十四式 · 动变合参</small><h3>动爻与变爻，各受日月。</h3></div>
      <span>{positions.length} 爻发动</span>
    </header>
    <p className="moving-effect-intro">
      《增删卜易》动变生克冲合章明确：本位变爻可以回头作用动爻，日月能够作用变爻，
      其他本卦爻不能跨位生克变爻。<strong>此处先核对规则关系，不直接判定生克成败。</strong>
    </p>
    {!item?<p className="moving-effect-empty">本卦没有真正发动的爻，因此不产生本位变爻效力审议；静态之卦同位支不当作动爻。</p>:
      <>
        <div className="moving-effect-selector" role="group" aria-label="选择发动爻">
          {positions.map(pos=><button type="button" key={pos}
            aria-pressed={selected===pos} className={selected===pos?'active':''}
            onClick={()=>setInspected(pos)}>
            {POS[pos-1]}爻 · {chart.najia_lines[pos-1].ganzhi}
          </button>)}
        </div>
        <div className="moving-effect-grid">
          <EvidenceSide side={item.moving} label="本卦 · 明动爻"/>
          <EvidenceSide side={item.transformed} label="本位 · 变爻"/>
        </div>
        <div className="moving-effect-return">
          <small>回头关系 · 本位专属</small>
          <h4>{item.moving.ganzhi} → {item.transformed.ganzhi} · {item.returning_tags.join(' · ')}</h4>
          <p>{item.returning_element_relation}</p>
          <p>已确认关系，<strong>实际效力尚未判断。</strong>不会让该变爻跨位作用其他爻。</p>
        </div>
        <div className="moving-effect-reviewlist">
          <h4>需要合参的条件</h4>
          {item.conditions_to_review.length?
            item.conditions_to_review.map((x,i)=><p key={i}>· {x}</p>):
            <p>暂未发现额外空破或日月冲突；这仍不等于已经判断了真实效力。</p>}
        </div>
      </>}
    <p className="moving-effect-scope">{data.boundary}</p>
    <a href={data.sources.moving} target="_blank" rel="noopener noreferrer" className="moving-effect-source">
      《增删卜易》动变生克冲合章原文 ↗
    </a>
  </section>
}

function StrengthEvidenceStudy({chart}){
  const data=chart.strength_evidence
  const [inspected,setInspected]=useState(null)
  if(!data)return null
  const focus=data.focus_candidate_positions
  const pos=inspected??data.selected_position??focus[0]??1
  const line=data.rows[pos-1]
  const sections=[
    {key:'supporting',title:'生扶线索',empty:'本卦目前没有已计算的生扶标记。'},
    {key:'restraining',title:'制约条件',empty:'本卦目前没有已计算的制约标记。'},
    {key:'context',title:'动静、六合与其他背景',empty:'暂无额外参考标记。'},
  ]
  return <section className="strength-evidence-study" aria-label="六爻日月动变与空破综合证据">
    <header className="strength-evidence-head">
      <div><small>第十三式 · 合参旺衰</small><h3>逐爻列证，不以分数论吉凶。</h3></div>
      <span>六爻逐项核对</span>
    </header>
    <p className="strength-evidence-intro">{data.method} <strong>生扶与制约可能同时存在，条目数量不代表力量大小。</strong></p>
    <div className="strength-evidence-positions" role="group" aria-label="选择查看综合证据的爻位">
      {data.rows.map(row=><button type="button" key={row.position}
        aria-pressed={pos===row.position}
        className={pos===row.position?'active':''}
        onClick={()=>setInspected(row.position)}>
        {POS[row.position-1]}爻
        {data.selected_position===row.position&&<small>研习主爻</small>}
        {!data.selected_position&&focus.includes(row.position)&&<small>候选</small>}
      </button>)}
    </div>
    <div className="strength-evidence-target">
      <div><b>{POS[line.position-1]}爻 · {line.ganzhi}</b>
        <small>{line.liuqin} · {line.element} · {line.moving?'明动':'静爻'}</small></div>
      {line.has_opposing_indicators&&<span>生扶与制约并存</span>}
    </div>
    <p className="strength-evidence-summary" role="status">{line.summary}</p>
    <div className="strength-evidence-grid">
      {sections.map(section=><article key={section.key} className={'strength-evidence-col '+section.key}>
        <h4>{section.title}</h4>
        {line[section.key].length?line[section.key].map((e,i)=><div key={i} className="strength-evidence-entry">
          <strong>{e.title}</strong><p>{e.detail}</p><small>规则：{e.origin}</small>
        </div>):<p className="strength-evidence-no-entry">{section.empty}</p>}
      </article>)}
    </div>
    {line.pending.length>0&&<div className="strength-evidence-pending">
      <b>尚缺输入</b>
      {line.pending.map((x,i)=><p key={i}>· {x}</p>)}
    </div>}
    {data.focus_candidates.length>1&&<p className="strength-evidence-multi">
      所选六亲在本卦有 {data.focus_candidates.length} 处候选。所有候选均可按上方爻位查看，
      当前显示哪一爻不代表软件已替你择优。
    </p>}
    {data.focus_status==='not_visible'&&<p className="strength-evidence-multi">
      用神本卦不现，请回到「因事取用」核对飞伏。此页只列六爻明现关系，不把伏神冒充明爻。
    </p>}
    <p className="strength-evidence-boundary">{data.boundary}</p>
    <div className="strength-evidence-links">
      <a href={data.references.month} target="_blank" rel="noopener noreferrer">《增删卜易》月将章 ↗</a>
      <a href={data.references.day} target="_blank" rel="noopener noreferrer">日辰章 ↗</a>
      <a href={data.references.void} target="_blank" rel="noopener noreferrer">旬空章 ↗</a>
    </div>
  </section>
}

function SeasonalMovingStudy({chart}) {
  const influences=chart.moving_influences
  const seasonal=chart.seasonal_outline
  const [requestedSource,setRequestedSource]=useState(null)
  if(!influences||!seasonal)return null
  const positions=influences.moving_positions
  const source=positions.includes(requestedSource)?requestedSource:positions[0]
  const edges=influences.edges.filter(x=>x.source_position===source)
  return <section className="moving-season-study" aria-label="动爻作用与节令旺相研习">
    <header className="moving-season-head">
      <div><span>第九式 · 逐动观势</span><h3>动爻生克 · 四时旺相</h3></div>
      <span>{positions.length} 个动爻</span>
    </header>
    <div className="moving-season-block">
      <h4>一、看动爻对本卦其他爻的关系</h4>
      <p>{influences.rule}</p>
      {positions.length?<><div className="moving-source-list" role="group" aria-label="选择发动的爻">
        {positions.map(position=><button type="button" key={position}
          aria-pressed={source===position} className={source===position?'active':''}
          onClick={()=>setRequestedSource(position)}>
          {POS[position-1]}爻 · {chart.najia_lines[position-1].ganzhi}
        </button>)}
      </div><div className="moving-influence-lines">
        {edges.map(edge=><div className="moving-influence-row" key={edge.target_position}>
          <div><strong>{POS[edge.target_position-1]}爻 · {edge.target_ganzhi}</strong>
            <small>{edge.target_moving?'此爻亦发动':'本卦静爻'}</small></div>
          <span>{edge.element_relation}{edge.clash?' · 相冲':''}{edge.combine?' · 六合':''}</span>
        </div>)}
      </div></>:<p className="moving-empty">本卦无动爻，因此没有动爻对其他爻的作用列表。</p>}
      <p className="moving-boundary">{influences.limit}</p>
    </div>
    <div className="moving-season-block">
      <h4>二、节令月支的四时概览</h4>
      {seasonal.visible?<><p>你选择了<strong>{seasonal.month_branch}月</strong>。按《增删卜易》四时旺相章，可查看以下教学分类：</p>
        <div className="season-element-grid">
          {seasonal.grades.map(x=><div key={x.element}><strong>{x.element}</strong><span>{x.grade}</span></div>)}
        </div>
      </>:<p>尚未选择节令月支。请在上面的「日月校时」中确认后再查看，不自动按公历月份猜测。</p>}
      <p className="moving-boundary">{seasonal.limit}</p>
    </div>
    <div className="moving-season-sources">
      <a href={influences.source} target="_blank" rel="noopener noreferrer">古籍 · 动变生克冲合 ↗</a>
      <a href={seasonal.source} target="_blank" rel="noopener noreferrer">古籍 · 四时旺相 ↗</a>
    </div>
  </section>
}



function VoidInteractionsStudy({chart}){
  const voidData=chart.void_interactions
  const [selected,setSelected]=useState(1)
  if(!voidData)return null
  const row=chart.najia_lines[selected-1]
  const changed=chart.bian_najia_lines[selected-1]
  const current=row.void_review
  const transformed=changed.void_review
  const focus=chart.focus
  return <section className="void-study" aria-label="六爻旬空冲空化空交互研习">
    <header className="void-study-head">
      <div><small>第十一式 · 旬空合参</small><h3>空有其名，须辨其用。</h3></div>
      <b>{voidData.day_ganzhi||'日辰待定'}</b>
    </header>
    <p className="void-study-intro">旬空是按日旬缺失的两支核定的。先分别看本卦爻、动爻变出的支和伏神，再结合日月、动静、月破等条件，不可见“空”字便断无用。</p>
    {voidData.status==='day_unconfirmed'?
      <p className="void-day-missing">尚未确认日辰。请先在「日月校时」选择真实的六十甲子日；本页不会推测旬空。</p>:
      <div className="void-summary"><span>当日旬空地支</span>
        <strong>{voidData.empty_branches.join(' · ')}</strong>
        <small>本卦 {voidData.original_void_positions.length} 爻逢空 · {voidData.moving_into_void_positions.length} 处明动化空条件</small>
      </div>}
    <div className="void-position-list" role="group" aria-label="选取旬空复核爻位">
      {[1,2,3,4,5,6].map(pos=><button type="button" key={pos}
        className={selected===pos?'active':''}
        aria-pressed={selected===pos} onClick={()=>setSelected(pos)}>
        {POS[pos-1]}爻
        {chart.najia_lines[pos-1].void_review.is_void===true&&<span>空</span>}
      </button>)}
    </div>
    <div className="void-review-grid" aria-live="polite">
      <article>
        <small>本卦 · {row.ganzhi}</small>
        <strong>{current.status==='day_unconfirmed'?'未核对日旬':
          current.is_void?'本卦爻逢旬空':'本卦爻不旬空'}</strong>
        {current.conditions?.length?
          <div>{current.conditions.map((condition,i)=><p key={i}>· {condition}</p>)}</div>:
          <p>{current.note}</p>}
        {current.is_void&&<p className="void-condition-note">{current.note}</p>}
      </article>
      <article>
        <small>{row.moving?'本位动爻之变 · '+changed.ganzhi:'变卦同位 · '+changed.ganzhi}</small>
        <strong>{transformed.status==='day_unconfirmed'?'日旬待核':
          transformed.is_huakong?'动爻化空条件':
          transformed.is_void?'之卦同位支旬空（不是化空）':'变卦同位支不空'}</strong>
        <p>{transformed.note}</p>
      </article>
    </div>
    {focus&&<div className="void-focus-lesson">
      <h4>所问「{focus.category}」的空亡复核</h4>
      {voidData.focus_status==='visible_candidates'?
        voidData.focus_candidates.map(row=><div key={row.position}>
          <b>{POS[row.position-1]}爻 · {row.ganzhi}</b>
          <span>{row.is_void===null?'日辰未核':row.is_void?'本卦逢空':'本卦不空'}
            {row.moving_into_void?' · 本位明动化空':''}</span>
        </div>):
        voidData.focus_status==='focus_not_visible'?
          <p>本卦不现所选六亲；参看飞伏神页。本宫伏神与飞神会分别核对旬空，不能把飞神的空亡当作伏神的空亡。</p>:
          <p>先明确六亲或世应关注对象，系统才会列出候选爻的空亡条件。</p>}
    </div>}
    <p className="void-study-boundary">{voidData.boundary}</p>
    <div className="void-study-links">
      <a href={voidData.sources.xunkong} target="_blank" rel="noopener noreferrer">《增删卜易》旬空章 ↗</a>
      <a href={voidData.sources.day} target="_blank" rel="noopener noreferrer">日辰冲空原文 ↗</a>
    </div>
  </section>
}


function FocusDecisionStudy({chart,onChoose,busy}){
  const data=chart.focus_decision
  if(!data)return null
  const selected=data.selected_position
  return <section className="focus-decision" aria-label="用神两现与取舍证据研究">
    <header className="focus-decision-head">
      <div><span>第十二式 · 两现取用</span><h3>多爻同现，逐证对照。</h3></div>
      <small>人工审议 · 不自动择优</small>
    </header>
    <p className="focus-decision-lead">《增删卜易》“两现章”记载了传统的动静、旺相、空破比较，也有旬空、月破之爻实际应事的反例。<strong>由你亲自选择研习主爻，软件只展示证据。</strong></p>
    {data.status==='not_selected'?<p className="focus-decision-empty">请先在上面的「因事取用」选择关注的六亲或世应。未选择时，不推断用神。</p>:
      data.status==='not_visible'?<div className="focus-decision-missing">
        <h4>本卦不现 · 先日月，后伏神</h4>
        <p>{data.message}</p>
        {(data.hidden_candidates||[]).map(c=><article key={c.position}>
          <b>{POS[c.position-1]}爻 · 伏神 {c.hidden_ganzhi}</b>
          <p>飞神 {c.flying_ganzhi} · {c.flying_hidden_relation}</p>
          <p>日支同五行：{c.day_element_match===null?'未核对':c.day_element_match?'是':'否'}；月支同五行：{c.month_element_match===null?'未核对':c.month_element_match?'是':'否'}</p>
          <p>伏神旬空：{c.hidden_is_void===null?'未核对':c.hidden_is_void?'是':'否'}；飞神旬空：{c.flying_is_void===null?'未核对':c.flying_is_void?'是':'否'}</p>
        </article>)}
        <p className="focus-decision-caution">这里只核对日月同五行与飞伏位置，不会自动认定某个伏神可用。</p>
      </div>:
      <>
        <div className="focus-decision-status" role="status">
          {data.status==='multiple_visible'?'本卦有 '+data.candidates.length+' 个「'+data.category+'」候选，全部保留。':'本卦有一处「'+data.category+'」相关爻。'}
          {selected?' 你已指定'+POS[selected-1]+'爻为本次研习焦点。':' 尚未手动指定研习主爻。'}
        </div>
        <div className="focus-decision-cards">
          {data.candidates.map(c=><article key={c.position} className={selected===c.position?'active':''}>
            <div className="focus-decision-card-head"><b>{POS[c.position-1]}爻 · {c.ganzhi}</b><small>{c.liuqin} · {c.element}</small></div>
            <dl>
              <div><dt>月令概要</dt><dd>{c.indicators.season||'未核对'}</dd></div>
              <div><dt>动静</dt><dd>{c.indicators.moving}</dd></div>
              <div><dt>旬空</dt><dd>{c.indicators.xunkong===null?'未核对':c.indicators.xunkong?'旬空':'不空'}</dd></div>
              <div><dt>月破</dt><dd>{c.indicators.month_break===null?'未核对':c.indicators.month_break?'月冲':'未月冲'}</dd></div>
              <div><dt>动变</dt><dd>{c.indicators.turnback||'无本位回头关系'}</dd></div>
            </dl>
            <button type="button" disabled={busy} className="focus-decision-select"
              aria-pressed={selected===c.position}
              onClick={()=>onChoose(selected===c.position?null:c.position)}>
              {selected===c.position?'✓ 已指定 · 点此取消':'指定为本次研习主爻 ↗'}
            </button>
          </article>)}
        </div>
        {data.comparisons.length>0&&<div className="focus-decision-compare">
          <h4>同类候选的不同之处</h4>
          {data.comparisons.map(pair=><article key={pair.first_position+'-'+pair.second_position}>
            <b>{POS[pair.first_position-1]}爻 ↔ {POS[pair.second_position-1]}爻</b>
            {pair.differences.length?pair.differences.map(v=><p key={v.criterion}>{v.criterion}：{String(v.first_value)} / {String(v.second_value)}</p>):<p>当前已计算条件没有可比的差异，不等于两爻完全相同。</p>}
            <small>{pair.note}</small>
          </article>)}
        </div>}
        {data.outstanding_checks?.length>0&&<div className="focus-decision-caution">
          <b>仍须人工判断</b>
          {data.outstanding_checks.map((x,i)=><p key={i}>· {x}</p>)}
        </div>}
        {data.selected_candidate&&<p className="focus-decision-status">已将{POS[data.selected_candidate.position-1]}爻作为<strong>本次研习焦点</strong>交给排盘和 AI。其他候选仍然保留，不构成最终断卦。</p>}
      </>}
    <p className="focus-decision-limit">此功能不提供吉凶排名、自动选优或应期预测。{data.limitation||'必须核实真实日月及所问事项。'}</p>
    <div className="focus-decision-links">
      <a href={data.references.multiple} rel="noopener noreferrer" target="_blank">《增删卜易》两现章 ↗</a>
      <a href={data.references.hidden} rel="noopener noreferrer" target="_blank">飞伏神章 ↗</a>
    </div>
  </section>
}

function DayMonthReview({chart}) {
  const review=chart.day_month_review
  const [selected,setSelected]=useState(1)
  if(!review)return null
  const row=chart.najia_lines[selected-1]
  const day=row.conflict_review.day_clash
  const month=row.conflict_review.month_break
  const selectedFocus=chart.focus?.category
  const findings=review.candidates||[]
  return <section className="academy-review" aria-label="六爻日冲月破与用神条件复核">
    <header className="academy-review-header">
      <div><span>第十式 · 合参诸象</span><h3>月破与日冲，不可一概而断。</h3></div>
      <small>逐爻核验</small>
    </header>
    <p className="academy-review-intro">{review.rule}</p>
    <div className="academy-review-picks" role="group" aria-label="选择日冲月破复核的爻位">
      {[1,2,3,4,5,6].map(pos=><button type="button" key={pos}
        className={selected===pos?'active':''} aria-pressed={selected===pos}
        onClick={()=>setSelected(pos)}>{POS[pos-1]}爻</button>)}
    </div>
    <div className="academy-review-grid" aria-live="polite">
      <article><small>日冲辨析 · {row.ganzhi}</small>
        <strong>{day.label}</strong>
        <p>{day.month_grade?'节令概要：'+day.month_grade:'节令概要：未提供或尚不可用'}</p>
        {day.cautions?.map((t,i)=><p key={i}>· {t}</p>)}
      </article>
      <article><small>月破条件</small><strong>{month.label}</strong>
        {month.review?.map((t,i)=><p key={i}>· {t}</p>)}
      </article>
    </div>
    <div className="academy-review-focus">
      <h4>所问用神 · 证据对照</h4>
      {review.status==='focus_not_selected'?<p>先在「因事取用」选择要研究的六亲或世应，系统才会整理相关候选爻的条件。</p>:
       review.status==='focus_not_visible'?<div><p>{review.message}</p>
         <p>本宫伏神候选：{review.hidden_candidates?.map(x=>POS[x.position-1]+'爻 '+x.hidden.ganzhi).join('、')||'无'}</p>
       </div>:
       <><p>当前关注：<b>{selectedFocus}</b>。以下只是已经计算出来的条件清单，不是吉凶评分。</p>
         <div className="academy-review-candidates">
          {findings.map(candidate=><article key={candidate.position}>
            <button type="button" onClick={()=>setSelected(candidate.position)}
              className="academy-review-focus-jump">{POS[candidate.position-1]}爻 · {candidate.ganzhi} ↗</button>
            <small>{candidate.liuqin} · {candidate.element} · {candidate.season||'未确认月令'}</small>
            <div className="academy-review-signals">
              <div><b>已观察到的生扶、动静</b>
                {(candidate.supportive_observations.length?candidate.supportive_observations:['暂无已确认的正向条件']).map((v,i)=><p key={i}>{v}</p>)}
              </div>
              <div><b>需要谨慎核对的条件</b>
                {(candidate.cautionary_observations.length?candidate.cautionary_observations:['暂无已确认的制约标记']).map((v,i)=><p key={i}>{v}</p>)}
              </div>
            </div>
          </article>)}
         </div></>}
    </div>
    <p className="academy-review-boundary">{review.manual_calendar_notice} 此处不自动判断完整旺衰、暗动实效、日破实效或应期，也不将传统象征当作现实结论。</p>
    <div className="academy-review-links">
      <a href={review.source.day} target="_blank" rel="noopener noreferrer">《增删卜易》日辰章 ↗</a>
      <a href={review.source.dark} target="_blank" rel="noopener noreferrer">暗动章 ↗</a>
      <a href={review.source.month} target="_blank" rel="noopener noreferrer">月破章 ↗</a>
    </div>
  </section>
}

function LineDynamicsStudy({chart}) {
  const dynamics=chart.line_dynamics
  const [position,setPosition]=useState(1)
  if(!dynamics)return null
  const ben=chart.najia_lines[position-1]
  const bian=chart.bian_najia_lines[position-1]
  const turnback=ben.turnback
  function calSummary(action,prefix){
    if(!action)return '尚未确认'+prefix+'，此项不作推算。'
    const extra=[
      action.same_branch?prefix+'同支（临建）':null,
      action.clash?prefix+'相冲'+(prefix==='月建'?' · 月破条件':' · 不自动判暗动'):null,
      action.combine?prefix+'六合':null
    ].filter(Boolean)
    return action.element_relation+(extra.length?'；'+extra.join('；'):'')
  }
  return <section className="dynamics-study" aria-label="日月作用与动变回头关系教学">
    <header className="dynamics-head">
      <div><span>第八式 · 日月动变</span><h3>先辨作用，再论力量。</h3></div>
      <small>{dynamics.moving_positions.length} 个动爻</small>
    </header>
    <p className="dynamics-intro">
      点击任意一爻，查看日辰、月建对本卦爻与变卦爻分别产生的关系；
      <strong>只有真正发动的爻，才计算本位变爻的回头生克冲合。</strong>
    </p>
    <div className="dynamics-positions" role="group" aria-label="选择六爻中的一爻">
      {[0,1,2,3,4,5].map(i=><button type="button" key={i}
        aria-pressed={position===i+1}
        className={position===i+1?'active':''}
        onClick={()=>setPosition(i+1)}>{POS[i]}爻
          {chart.dong_yao.includes(i+1)&&<small>动</small>}
        </button>)}
    </div>
    <div className="dynamics-detail">
      <div className="dynamics-two-column">
        <article>
          <small>本卦 · {POS[position-1]}爻</small>
          <h4>{ben.ganzhi} · {ben.element}</h4>
          <p><b>日辰：</b>{calSummary(ben.day_action,'日辰')}</p>
          <p><b>月建：</b>{calSummary(ben.month_action,'月建')}</p>
        </article>
        <article>
          <small>{turnback?'本位变爻':'之卦同位 · 非动爻'}</small>
          <h4>{bian.ganzhi} · {bian.element}</h4>
          <p><b>日辰：</b>{calSummary(bian.day_action,'日辰')}</p>
          <p><b>月建：</b>{calSummary(bian.month_action,'月建')}</p>
        </article>
      </div>
      {turnback?<div className="dynamics-turnback">
        <span>动爻 {turnback.moving.ganzhi} → 变爻 {turnback.transformed.ganzhi}</span>
        <strong>{turnback.tags.join(' · ')}</strong>
        <p>{turnback.limitation}</p>
      </div>:<div className="dynamics-turnback quiet">
        此爻没有发动。即使之卦同位干支可列出，也不能将它认作主动回头生克。
      </div>}
    </div>
    <div className="dynamics-scope">{dynamics.calendar_boundary} {dynamics.interpretation_boundary}</div>
    <div className="dynamics-sources">
      <a href={dynamics.sources.day_month} rel="noopener noreferrer" target="_blank">日月四处生克 ↗</a>
      <a href={dynamics.sources.liuhe} rel="noopener noreferrer" target="_blank">六合原文 ↗</a>
      <a href={dynamics.sources.moving} rel="noopener noreferrer" target="_blank">动变生克原文 ↗</a>
    </div>
  </section>
}

function NajiaBoard({chart,roleView='用神'}) {
  const [selected,setSelected]=useState(0)
  const [changed,setChanged]=useState(false)
  const pal=chart.eight_palaces?.ben
  const changedPal=chart.eight_palaces?.bian
  const all=changed?chart.bian_najia_lines:chart.najia_lines
  const detail=all?.[selected]
  const focus=chart.focus
  const selectedRelation=chart.spirit_relations?.roles?.[roleView]
  const hiddenPositions=chart.fushen?.selected?.status==='hidden_in_palace'?
    chart.fushen.selected.entries.map(item=>item.position):[]
  const highlighted=changed?[]:(selectedRelation?.positions??(hiddenPositions.length?
    hiddenPositions:focus?.primary_positions))
  useEffect(()=>{
    if(!changed&&hiddenPositions.length)setSelected(hiddenPositions[0]-1)
  },[changed,chart.fushen])
  useEffect(()=>{
    if(!changed&&selectedRelation?.positions?.length)setSelected(selectedRelation.positions[0]-1)
  },[roleView,changed,chart.spirit_relations])
  useEffect(()=>{
    if(focus?.primary_positions?.length)setSelected(focus.primary_positions[0]-1)
  },[focus?.category])
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
          className={'najia-row '+(selected===row?'selected ':'')+(line.moving?'moving ':'')+(highlighted?.includes(row+1)?'yongshen-highlight':'')}
          onClick={()=>setSelected(row)}>
          <span>{POS[row]}<small>{line.moving?'动':''}{!changed&&line.fushen?.length?' · 伏':''}</small></span>
          <span className="najia-strokes">{lines[row]===1?<i/>:<><i/><i/></>}</span>
          <strong>{line.ganzhi}</strong><span>{line.element}</span><span>{line.liuqin}</span><b>{[role,line.is_xunkong?'空':''].filter(Boolean).join('·')}</b>
        </button>
      })}
    </div>
    {focus&&<div className="yongshen-najia-hint">
      {changed?'变卦仅作对照，不把本卦伏神或原忌仇位置直接套用到变卦':
        '金线标记 · '+(selectedRelation?'本卦'+roleView+'（'+selectedRelation.element+'）':
          hiddenPositions.length?'所选伏神位（本宫纯卦同位）':'本卦'+focus.category+'候选位置')}
    </div>}
    {detail&&<article className="najia-focused">
      <span className="najia-learning">逐爻研习 · 点选上方任意一爻</span>
      <h4>{POS[selected]}爻 · {detail.ganzhi} · {detail.liuqin}{detail.moving?' · 动':''}</h4>
      <p>此爻位于{detail.trigram}卦，纳{detail.stem}干、{detail.branch}支，支属{detail.element}。以本卦的{pal.palace}宫{pal.palace_element}为“我”，按五行生克定为<strong>{detail.liuqin}</strong>。
        {!changed&&detail.role?'这是本卦'+detail.role+'爻。':changed?'变卦干支仍以本卦宫五行定六亲，不重新用变卦所属宫计算。':''}
      </p>
      <p>{detail.moving?'此爻发生阴阳变换；对照“本卦”和“变卦”可观察此爻干支的改变。':'此爻没有发生阴阳变换。'}</p>
      {!changed&&detail.fushen?.length>0&&<div className="najia-fushen-mini">
        <b>此爻下伏：</b>{detail.fushen.map((f,i)=><span key={i}>{f.liuqin} {f.ganzhi} · {f.relation}</span>)}
      </div>}
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

const REVIEW_STEPS=[
  {id:'calendar',title:'核日月',no:'一'},
  {id:'focus',title:'因事取用',no:'二'},
  {id:'relations',title:'辨生克',no:'三'},
  {id:'conflicts',title:'参空破',no:'四'},
  {id:'report',title:'成研究案',no:'五'}
]
const CASE_ARCHIVE_KEY='wanxiang-liuyao-case-archive-v1'
function loadLocalCases(){
  try{
    const value=JSON.parse(window.localStorage.getItem(CASE_ARCHIVE_KEY)||'[]')
    return Array.isArray(value)?value.filter(x=>x&&typeof x.id==='string'&&x.snapshot).slice(0,12):[]
  }catch{return []}
}
function ChineseLocalCaseArchive({chart,question}){
  const [cases,setCases]=useState(loadLocalCases)
  const [before,setBefore]=useState('')
  const [selectedId,setSelectedId]=useState(null)
  const [actual,setActual]=useState('')
  const [resultType,setResultType]=useState('部分吻合')
  const [message,setMessage]=useState('')
  const report=chart.review_flow?.report
  const selected=cases.find(x=>x.id===selectedId)||cases[0]
  if(!report)return null
  function persist(next){
    try{
      window.localStorage.setItem(CASE_ARCHIVE_KEY,JSON.stringify(next))
      setCases(next)
      setMessage('已保存到本机浏览器，未上传服务器。')
      return true
    }catch{
      setMessage('浏览器无法保存本地记录。可改用上方的文本笔记下载，检查是否为隐私模式或空间不足。')
      return false
    }
  }
  function seal(){
    if(!before.trim()){setMessage('请先写下事前研究的判断或尚待验证的问题，再封存。');return}
    const now=new Date()
    const newCase={
      id:String(now.getTime())+'-'+Math.random().toString(36).slice(2),
      created_at:now.toISOString(),
      question:question.trim().slice(0,700),
      before:before.trim().slice(0,1500),
      snapshot:{
        original_numbers:chart.lines.map(x=>x.number),
        ben_gua:chart.ben_gua.full_name,
        bian_gua:chart.bian_gua.full_name,
        day_ganzhi:chart.calendar.day?.ganzhi||null,
        month_branch:chart.calendar.month?.branch||null,
        chosen_category:chart.focus?.category||null,
        selected_position:chart.focus_decision.selected_position,
        focus_paths:report.yongshen_pathway_digest||[],
        evidence:report.evidence_digest||[],
        moving:report.moving_effect_digest||[],
        special:report.special_conditions_digest||[],
        unresolved:report.outstanding_questions||[]
      },
      feedback:[]
    }
    if(persist([newCase,...cases].slice(0,12))){
      setSelectedId(newCase.id);setBefore('');setActual('')
    }
  }
  function saveFeedback(){
    if(!selected){setMessage('请先封存一份事前记录。');return}
    if(!actual.trim()){setMessage('请先填写后续实际观察，再追记。');return}
    const feedback={
      recorded_at:new Date().toISOString(),result_type:resultType,
      observations:actual.trim().slice(0,1600),
      note:'事后自述，未经独立核实；并非算法自动预测成功率'
    }
    if(persist(cases.map(x=>x.id===selected.id?{...x,feedback:[...x.feedback,feedback]}:x))){
      setActual('')
    }
  }
  function removeCase(){
    if(!selected||!window.confirm('确定删除这份仅存于本机的案例吗？删除后无法从本站恢复。'))return
    if(persist(cases.filter(x=>x.id!==selected.id)))setSelectedId(null)
  }
  function exportCase(){
    if(!selected)return
    try{
      const url=URL.createObjectURL(new Blob([JSON.stringify(selected,null,2)],
        {type:'application/json;charset=utf-8'}))
      const a=document.createElement('a')
      a.href=url;a.download='万象书院-六爻封存复盘-'+selected.created_at.slice(0,10)+'.json'
      document.body.appendChild(a);a.click();a.remove()
      setTimeout(()=>URL.revokeObjectURL(url),1000)
      setMessage('已导出本地 JSON 文件。')
    }catch{setMessage('下载失败，请检查浏览器文件下载权限。')}
  }
  const cdate=iso=>{
    try{return new Date(iso).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})+'（北京时间）'}
    catch{return iso}
  }
  return <section className="local-case-archive" aria-label="六爻本地案例封存与事后复盘">
    <header><small>第十七式 · 案例复盘</small><h3>先封存事前研究，再追记实际发生。</h3></header>
    <p>点击封存时，保存当前六爻、用神、证据及未决事项的<b>固定快照</b>；后续只追加观察，不修改原先写下的话。全部仅保存在当前设备浏览器，不会自动上传或同步。请避免填写敏感个人信息，清除浏览器数据可能导致记录丢失。</p>
    <label>本次事前研习笔记（封存后不能修改）
      <textarea maxLength={1500} rows={3} value={before}
        onChange={e=>setBefore(e.target.value)}
        placeholder="例如：这次主要观察哪一爻？我事前认为哪些条件更值得核实？还有什么相反的可能？"/>
    </label>
    <button type="button" className="local-case-seal" onClick={seal}>封存当前盘面与事前研究</button>
    {cases.length>0&&<div className="local-case-history">
      <h4>本机已封存案例（最多12份）</h4>
      <div className="local-case-buttons">
        {cases.map((entry,i)=><button key={entry.id} type="button"
          aria-pressed={selected?.id===entry.id}
          onClick={()=>{setSelectedId(entry.id);setActual('')}}>
          {entry.snapshot.ben_gua} · {entry.created_at.slice(0,10)} · #{i+1}
        </button>)}
      </div>
      {selected&&<div className="local-case-detail">
        <b>封存于 {cdate(selected.created_at)}</b>
        <p>本卦：{selected.snapshot.ben_gua}；之卦：{selected.snapshot.bian_gua}</p>
        <p>当时日月：{selected.snapshot.day_ganzhi||'未核'}日 /
          {selected.snapshot.month_branch?selected.snapshot.month_branch+'月':'未核月建'}；
          关注：{selected.snapshot.chosen_category||'未选用神'}；
          主爻：{selected.snapshot.selected_position?POS[selected.snapshot.selected_position-1]+'爻':'未指定'}</p>
        <p><strong>事前原文（不可改动）：</strong>{selected.before}</p>
        <div className="local-case-outcome">
          <h4>后续事实 · 只能追加</h4>
          <label>对事前研究的回看
            <select value={resultType} onChange={e=>setResultType(e.target.value)}>
              {['部分吻合','基本吻合','未吻合','尚无结果','无法判断'].map(x=><option key={x} value={x}>{x}</option>)}
            </select>
          </label>
          <label>后来实际观察到什么？
            <textarea rows={3} maxLength={1600} value={actual}
              onChange={e=>setActual(e.target.value)}
              placeholder="明确事实与尚未核实之处，尽量写具体；切勿事后改写原先的推断"/>
          </label>
          <button type="button" onClick={saveFeedback}>追加一条事后观察</button>
          {selected.feedback.map((f,i)=><div className="local-case-feedback" key={i}>
            <small>{cdate(f.recorded_at)} · {f.result_type}</small>
            <p>{f.observations}</p>
          </div>)}
        </div>
        <div className="local-case-actions">
          <button type="button" onClick={exportCase}>导出该案例 JSON</button>
          <button type="button" onClick={removeCase}>删除本机案例</button>
        </div>
      </div>}
    </div>}
    {message&&<p className="local-case-message" role="status">{message}</p>}
    <p className="local-case-limit">案例中的“吻合”只是用户自述归类，不代表科学验证或可计算的预测准确率；建议同时记录未吻合、缺失的信息和现实证据。</p>
  </section>
}

function ReviewReport({chart,question}) {
  const data=chart.review_flow?.report
  const [message,setMessage]=useState('')
  if(!data)return null
  const lines=[
    '# 万象书院 · 六爻研判学习笔记',
    question?.trim()?'所问事项：'+question.trim():'所问事项：尚未填写',
    ...data.verified_by_program,
    '',
    '综合证据摘记（条数并非旺衰分数）：',
    ...(data.evidence_digest||[]),
    '',
    '本位动变与日月空破核对（效力尚未判断）：',
    ...(data.moving_effect_digest||[]),
    '',
    '用神原忌仇作用来源（效力未判定）：',
    ...(data.yongshen_pathway_digest||[]),
    '',
    '六合、墓绝条件摘记（不判效力）：',
    ...(data.special_conditions_digest||[]),
    '',
    '待核实与未完成事项：',
    ...data.outstanding_questions.map((x,i)=>(i+1)+'. '+x),
    '',
    data.notice
  ]
  function download(){
    const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'})
    const url=URL.createObjectURL(blob)
    const link=document.createElement('a')
    link.href=url
    link.download='万象书院-六爻研判笔记.txt'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setMessage('已生成本地文本文件。不会把笔记上传到服务器。')
  }
  async function copy(){
    try{
      if(!navigator.clipboard)throw new Error('浏览器不支持剪贴板')
      await navigator.clipboard.writeText(lines.join('\n'))
      setMessage('学习笔记已复制到剪贴板。')
    }catch(e){setMessage('剪贴板不可用，请点击「保存文本笔记」。')}
  }
  return <section className="review-report" aria-label="六爻研判学习报告">
    <div className="review-report-head"><small>第五步 · 整理研究案</small><h3>{data.title}</h3></div>
    <p>这一页记录已经排出的结构及需要核实的问题，不自动给出吉凶分数、最终取用或应期。</p>
    <div className="review-report-facts">
      {data.verified_by_program.map((x,i)=><p key={i}>{x}</p>)}
    </div>
    {data.evidence_digest?.length>0&&<div className="strength-evidence-report">
      <h4>综合证据摘记</h4>
      {data.evidence_digest.map((text,i)=><p key={i}>{text}</p>)}
      <small>这里只记录两类条件，不作净额评分，也不视为最终旺衰结论。</small>
    </div>}
    {data.moving_effect_digest?.length>0&&<div className="strength-evidence-report">
      <h4>动变与日月合参摘记</h4>
      {data.moving_effect_digest.map((entry,i)=><p key={i}>{entry}</p>)}
      <small>本位回头关系不等于作用已生效。</small>
    </div>}
    {data.special_conditions_digest?.length>0&&<div className="strength-evidence-report">
      <h4>六合、墓绝条件摘记</h4>
      {data.special_conditions_digest.map((entry,i)=><p key={i}>{entry}</p>)}
      <small>只供日后复核，不意味着合绊、入墓或逢绝已经实际生效。</small>
    </div>}
    {data.yongshen_pathway_digest?.length>0&&<div className="strength-evidence-report">
      <h4>用神原忌仇逐项审议</h4>
      {data.yongshen_pathway_digest.map((entry,i)=><p key={i}>{entry}</p>)}
      <small>来源是否发动可以核查，作用是否有效仍未判定。</small>
    </div>}
    <div className="review-report-outstanding">
      <h4>尚待核实</h4>
      <ol>{data.outstanding_questions.map((x,i)=><li key={i}>{x}</li>)}</ol>
    </div>
    <p className="review-report-caution">{data.notice}</p>
    <div className="review-report-actions">
      <button type="button" onClick={download}>保存文本笔记 ↧</button>
      <button type="button" onClick={copy}>复制研究记录</button>
    </div>
    {message&&<p className="review-report-message" role="status">{message}</p>}
    <p className="review-report-hint">若需要结合现实问题讨论，可在本页下方填写背景并使用可选 AI；案例簿也在此页，先记事前分析，再记录事后结果。</p>
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
  const [focusLiugin,setFocusLiugin]=useState('')
  const [studyPosition,setStudyPosition]=useState(null)
  const [roleView,setRoleView]=useState('用神')
  const [reviewStage,setReviewStage]=useState('calendar')
  const [relationsView,setRelationsView]=useState('summary')
  const [studioView,setStudioView]=useState('casting')
  const requestNumber=useRef(0)
  const reviewNavRef=useRef(null)
  const timer=useRef(null)
  useEffect(()=>()=>clearTimeout(timer.current),[])
  async function process(seq,day=dayGanzhi,month=monthBranch,focus=focusLiugin,position=studyPosition,openOnSuccess=false){
    const token=++requestNumber.current
    setCalendarBusy(true)
    try{
      const response=await fetch(api+'/api/liuyao/cast',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({numbers:seq,day_ganzhi:day||null,month_branch:month||null,focus_liuqin:focus||null,focus_position:position||null})})
      const data=await response.json()
      if(!response.ok)throw Error(typeof data.detail==='string'?data.detail:'排盘失败')
      if(token===requestNumber.current){
        setChart(data)
        setError('')
        if(openOnSuccess)setStudioView('analysis')
      }
    }catch(e){if(token===requestNumber.current){setError(e.message||'排盘失败，请检查网络后重试。');if(openOnSuccess)setStudioView('casting')}}
    finally{if(token===requestNumber.current)setCalendarBusy(false)}
  }
  function updateCalendar(day,month) {
    setDayGanzhi(day);setMonthBranch(month);setAnswer('')
    if(lines.length===6)process(lines,day,month)
  }
  function chooseFocus(next){
    setFocusLiugin(next);setStudyPosition(null);setRoleView('用神');setAnswer('');setError('')
    if(lines.length===6)process(lines,dayGanzhi,monthBranch,next,null)
  }
  function chooseStudyPosition(next){
    setStudyPosition(next);setAnswer('');setError('')
    if(lines.length===6)process(lines,dayGanzhi,monthBranch,focusLiugin,next)
  }
  function addLine(value,faces){
    if(lines.length>=6||busy||calendarBusy)return
    if(faces)setCoins(faces)
    const seq=[...lines,value];setLines(seq);setChart(null);setAnswer('');setError('')
    if(seq.length===6){setReviewStage('calendar');process(seq,dayGanzhi,monthBranch,focusLiugin,studyPosition,true)}
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
  function restart(){clearTimeout(timer.current);requestNumber.current+=1;setCalendarBusy(false);setIsSpinning(false);setCoins([2,3,2]);setLines([]);setChart(null);setAnswer('');setError('');setFocusLiugin('');setStudyPosition(null);setRoleView('用神');setReviewStage('calendar');setStudioView('casting')}
  function goReviewStep(target){
    if(calendarBusy)return
    setReviewStage(target)
    window.requestAnimationFrame?.(()=>reviewNavRef.current?.scrollIntoView({
      behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',
      block:'start'
    }))
  }
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
        focus_liuqin:focusLiugin||null,focus_position:studyPosition||null,
        question,background,background_confirmed:true,ai_model:apiConfig.aiModel
      })})
      const data=await res.json()
      if(!res.ok)throw Error(typeof data.detail==='string'?data.detail:data.detail?.message||'AI 暂不可用')
      setAnswer(data.interpretation)
    }catch(e){setError(e.message)}
    finally{setBusy(false)}
  }
  return <main className="academy-stage academy-stage--liuyao">
    <div className="academy-container">
      <header className="academy-stage-nav"><button onClick={onBack}>← 返回万象书院</button><b>铜钱六爻 · 六次成卦</b><button onClick={onStudy}>藏经阁 ◎</button></header>
      <section className="academy-stage-banner"><div>
        <small className="method-theme-identity">青铜卜筮 · 三钱纳甲 · 十八式研判</small>
        <p>六爻 · 铜钱起卦工坊</p><h1>铜钱一掷，<em>爻象渐生。</em></h1>
        <span>本工坊按《增删卜易》三钱六掷法演示。先取初爻，再从下向上记到上爻。<a href="https://zh.wikisource.org/zh-hans/增删卜易/2" target="_blank" rel="noopener noreferrer">阅读古籍来源 ↗</a></span>
      </div><div className="academy-stage-glyph">☰</div></section>
      <nav className="liuyao-studio-switch" aria-label="六爻工坊工作区">
        <button type="button" className={studioView==='casting'?'active':''} aria-current={studioView==='casting'?'page':undefined}
          onClick={()=>{setStudioView('casting');window.scrollTo({top:0,behavior:'smooth'})}}>
          <b>壹 · 起卦台</b><small>三钱六掷 · 记录六爻 {lines.length}/6</small>
        </button>
        <button type="button" className={studioView==='analysis'?'active':''}
          aria-current={studioView==='analysis'?'page':undefined}
          disabled={!chart} onClick={()=>{setStudioView('analysis');window.scrollTo({top:0,behavior:'smooth'})}}>
          <b>贰 · 研判台</b><small>{chart?'卦已成 · 进入五步分析':'六爻齐备后开放'}</small>
        </button>
      </nav>
      {studioView==='analysis'&&!chart&&(calendarBusy?
        <p className="liuyao-state-message" role="status">正在生成纳甲排盘和五步研判……</p>:
        error?<p className="liuyao-state-message" role="alert">{error}</p>:null)}
      <div className={'academy-stage-grid liuyao-studio-grid '+(studioView==='casting'?'view-casting':'view-analysis')}>
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
          <div className="academy-under-actions"><button type="button" onClick={restart}>重新起卦 ↻</button><button type="button" onClick={onStudy}>学六爻原理 ↗</button></div>
          {calendarBusy&&<p className="liuyao-cast-status" role="status">六爻已齐，正在排盘。原始爻数已保留，请勿重复起卦。</p>}
          {error&&<div className="liuyao-cast-error" role="alert">
            <p>{error}</p>
            {lines.length===6&&!chart&&<button type="button" disabled={calendarBusy}
              onClick={()=>process(lines,dayGanzhi,monthBranch,focusLiugin,studyPosition,true)}>
              保留这六爻 · 重新排盘 ↻
            </button>}
          </div>}
          {chart&&<button type="button" className="liuyao-ready-action" onClick={()=>setStudioView('analysis')}>卦已成 · 前往研判台 →</button>}
        </section>
        <section className="academy-casting-result">
          <div className="academy-panel-head"><span>{studioView==='analysis'?'本变卦 · 五步研判':'第二式 · 记六爻'}</span><b>{lines.length}/6</b></div>
          <div className="academy-ledger">{[0,1,2,3,4,5].map(i=>{
            const num=lines[i], info=K[num]
            return <div className={'academy-ledger-row '+(info?.move?'moving':'')} key={i}>
              <span>{POS[i]}爻</span><div className="academy-bars">
                {info?(info.yin?<i/>:<><i/><i/></>):<em>待掷</em>}</div><small>{info?num+' · '+info.name:'尚未记录'}</small>
            </div>
          })}</div>
          {chart?<div className="academy-computed">
            <p className="liuyao-workbench-lead">研判台 · 先看本卦与之卦，再选下方一个步骤。想修改六爻，可返回「起卦台」。</p>
            <div className="academy-hex-pair"><Diagram label="本卦" hex={chart.ben_gua} moving={chart.dong_yao}/><Diagram label="之卦" hex={chart.bian_gua}/></div>
            <p>动爻：{chart.dong_yao.length?chart.dong_yao.map(i=>POS[i-1]+'爻').join('、'):'无动爻'}</p>
            <nav className="review-flow-nav" ref={reviewNavRef} aria-label="六爻五步研判页面">
              {REVIEW_STEPS.map((step,i)=>{
                const state=chart.review_flow?.stages?.[i]?.status
                return <button type="button" key={step.id} onClick={()=>goReviewStep(step.id)}
                  aria-current={reviewStage===step.id?'step':undefined}
                  disabled={calendarBusy} className={reviewStage===step.id?'active':''}>
                  <span>{step.no} · {step.title}</span>
                  <small>{state==='pending'?'待输入':state==='partial'?'待补全':'需核对'}</small>
                </button>
              })}
            </nav>
            {chart.review_flow?.stages?.filter(x=>x.id===reviewStage).map(step=>
              <p className="review-flow-message" key={step.id} role="status">
                <b>{step.summary}</b><span>{step.action}</span>
              </p>)}
            {reviewStage==='calendar'&&<>
              <SolarDateAssist day={dayGanzhi} month={monthBranch} onApply={updateCalendar} busy={calendarBusy}/>
              <details className="liuyao-depth-panel">
                <summary>不使用自动换算？手动填写日干支与月建</summary>
                <CalendarControls chart={chart} day={dayGanzhi} month={monthBranch} onChange={updateCalendar} busy={calendarBusy}/>
              </details>
            </>}
            {reviewStage==='focus'&&<>
              <YongshenGuide chart={chart} chosen={focusLiugin} onChoose={chooseFocus} busy={calendarBusy}/>
              <FocusDecisionStudy chart={chart} onChoose={chooseStudyPosition} busy={calendarBusy}/>
              {chart.focus_decision?.status==='not_visible'?
                <FuShenStudy chart={chart} onChoose={chooseFocus} busy={calendarBusy}/>:
                <details className="liuyao-depth-panel">
                  <summary>飞伏神装配详情（需要时展开）</summary>
                  <FuShenStudy chart={chart} onChoose={chooseFocus} busy={calendarBusy}/>
                </details>}
            </>}
            {reviewStage==='relations'&&<>
              <div className="relations-view-tabs" role="group" aria-label="辨生克详细程度">
                <button type="button" className={relationsView==='summary'?'active':''}
                  aria-pressed={relationsView==='summary'}
                  onClick={()=>setRelationsView('summary')}>综合证据</button>
                <button type="button" className={relationsView==='pathways'?'active':''}
                  aria-pressed={relationsView==='pathways'}
                  onClick={()=>setRelationsView('pathways')}>用神作用链</button>
                <button type="button" className={relationsView==='motion'?'active':''}
                  aria-pressed={relationsView==='motion'}
                  onClick={()=>setRelationsView('motion')}>动爻效力</button>
                <button type="button" className={relationsView==='special'?'active':''}
                  aria-pressed={relationsView==='special'}
                  onClick={()=>setRelationsView('special')}>六合墓绝</button>
                <button type="button" className={relationsView==='details'?'active':''}
                  aria-pressed={relationsView==='details'}
                  onClick={()=>setRelationsView('details')}>纳甲与动变明细</button>
              </div>
              {relationsView==='summary'?<StrengthEvidenceStudy chart={chart}/>:
                relationsView==='pathways'?<YongshenPathwaysStudy chart={chart}/>:
                relationsView==='motion'?<MovingEffectReview chart={chart}/>:
                relationsView==='special'?<SpecialConditionsStudy chart={chart}/>:
                <>
                  <NajiaBoard chart={chart} roleView={roleView}/>
                  <details className="liuyao-depth-panel">
                    <summary>深入：展开动变、月令与原忌仇传统装卦明细</summary>
                    <LineDynamicsStudy chart={chart}/>
                    <SeasonalMovingStudy chart={chart}/>
                    <SpiritRelationsPanel chart={chart} activeRole={roleView} onChange={setRoleView} busy={calendarBusy}/>
                  </details>
                </>
              }
            </>}
            {reviewStage==='conflicts'&&<>
              <DayMonthReview chart={chart}/>
              <details className="liuyao-depth-panel">
                <summary>进一步核对：旬空、冲空、化空与伏神合参</summary>
                <VoidInteractionsStudy chart={chart}/>
              </details>
            </>}
            {reviewStage==='report'&&<>
              <ReviewReport chart={chart} question={question}/>
              <details className="liuyao-depth-panel">
                <summary>案例簿 · 封存事前研习与事后复盘</summary>
                <ChineseLocalCaseArchive chart={chart} question={question}/>
              </details>
              <div className="academy-scope">{chart.review_flow?.workflow_note}</div>
            </>}
            <div className="review-flow-footer">
              <button type="button" disabled={reviewStage==='calendar'||calendarBusy}
                onClick={()=>goReviewStep(REVIEW_STEPS[Math.max(0,REVIEW_STEPS.findIndex(s=>s.id===reviewStage)-1)].id)}>← 上一步</button>
              <span>{REVIEW_STEPS.findIndex(s=>s.id===reviewStage)+1} / 5 · 研习流程</span>
              <button type="button" disabled={reviewStage==='report'||calendarBusy}
                onClick={()=>goReviewStep(REVIEW_STEPS[Math.min(4,REVIEW_STEPS.findIndex(s=>s.id===reviewStage)+1)].id)}>下一步 →</button>
            </div>
          </div>:<div className="academy-empty-result">铜钱逐次成爻，六爻齐备后展示完整本卦、之卦、动爻与传统象义。</div>}
        </section>
      </div>
      {chart&&studioView==='analysis'&&reviewStage==='report'&&<section className="academy-ai-section">
        <h2>你的这一卦，问的是什么？</h2>
        <p>AI 可结合实际问题讨论已计算的八宫世应、纳甲六亲；如果你确认日辰和月支，还能参考六神、旬空和月建辅助标记。原神忌神仇神已能按静态五行关系定位；缺失六亲的伏神也能按本宫首卦装配；日月作用与动变回头生克冲合已按规则计算。动爻对本卦其他爻的作用以及月令旺相余气分类也已计算，但自动农历／公历换算预览已支持北京时间；精细用神取舍及完整旺衰仍未实现；旬空、冲空、化空以及空破交互已经逐项标记，不能凭此确定吉凶与应期。两现候选现可逐条对照，并由求测者选择研习主爻，但不会自动择优。你手动选择的关注对象会交给 AI 作为讨论线索，而非确定判断。</p>
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
