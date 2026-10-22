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
  const [roleView,setRoleView]=useState('用神')
  const requestNumber=useRef(0)
  const timer=useRef(null)
  useEffect(()=>()=>clearTimeout(timer.current),[])
  async function process(seq,day=dayGanzhi,month=monthBranch,focus=focusLiugin){
    const token=++requestNumber.current
    setCalendarBusy(true)
    try{
      const response=await fetch(api+'/api/liuyao/cast',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({numbers:seq,day_ganzhi:day||null,month_branch:month||null,focus_liuqin:focus||null})})
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
  function chooseFocus(next){
    setFocusLiugin(next);setRoleView('用神');setAnswer('');setError('')
    if(lines.length===6)process(lines,dayGanzhi,monthBranch,next)
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
  function restart(){clearTimeout(timer.current);requestNumber.current+=1;setCalendarBusy(false);setIsSpinning(false);setCoins([2,3,2]);setLines([]);setChart(null);setAnswer('');setError('');setFocusLiugin('');setRoleView('用神')}
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
        focus_liuqin:focusLiugin||null,
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
            <LineDynamicsStudy chart={chart}/>
            <SeasonalMovingStudy chart={chart}/>
            <YongshenGuide chart={chart} chosen={focusLiugin} onChoose={chooseFocus} busy={calendarBusy}/>
            <SpiritRelationsPanel chart={chart} activeRole={roleView} onChange={setRoleView} busy={calendarBusy}/>
            <FuShenStudy chart={chart} onChoose={chooseFocus} busy={calendarBusy}/>
            <NajiaBoard chart={chart} roleView={roleView}/>
            <div className="academy-scope">{chart.note}</div>
          </div>:<div className="academy-empty-result">铜钱逐次成爻，六爻齐备后展示完整本卦、之卦、动爻与传统象义。</div>}
        </section>
      </div>
      {chart&&<section className="academy-ai-section">
        <h2>你的这一卦，问的是什么？</h2>
        <p>AI 可结合实际问题讨论已计算的八宫世应、纳甲六亲；如果你确认日辰和月支，还能参考六神、旬空和月建辅助标记。原神忌神仇神已能按静态五行关系定位；缺失六亲的伏神也能按本宫首卦装配；日月作用与动变回头生克冲合已按规则计算。动爻对本卦其他爻的作用以及月令旺相余气分类也已计算，但真正的历法换算、精细用神取舍及综合旺衰尚未实现。你手动选择的关注对象会交给 AI 作为讨论线索，而非确定判断。</p>
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
