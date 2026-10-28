import {useState,useRef} from 'react'
import './academy.css'

const BEIJING_DATE=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date())

export default function LiurenV58(){
  const [date,setDate]=useState(BEIJING_DATE)
  const [clock,setClock]=useState('12:00')
  const [dayBoundary,setDayBoundary]=useState('zi_hour')
  const [nobleMode,setNobleMode]=useState('hour_branch')
  const [chart,setChart]=useState(null)
  const [selected,setSelected]=useState('子')
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  const requestVersion=useRef(0)
  function invalidate(){
    requestVersion.current+=1
    setChart(null);setError('');setBusy(false)
  }
  async function cast(event){
    event.preventDefault()
    const ticket=++requestVersion.current
    setBusy(true)
    setError('')
    setChart(null)
    try{
      const r=await fetch('/api/liuren/cast',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({solar_date:date,clock,day_boundary:dayBoundary,
          ...(nobleMode!=='hour_branch'?{noble_mode:nobleMode}:{})})
      })
      const result=await r.json()
      if(!r.ok)throw new Error(typeof result.detail==='string'?result.detail:'请核对日期或时辰')
      if(ticket===requestVersion.current){
        setChart(result)
        setSelected(result.hour_branch)
      }
    }catch(e){
      if(ticket===requestVersion.current)setError(e?.message||'大六壬起课失败')
    }finally{
      if(ticket===requestVersion.current)setBusy(false)
    }
  }
  return <section className="liuren-v58" aria-label="V74 大六壬真实起课">
    <header><small>V74 · 大六壬 / 伏吟例外与三传未决审查</small>
      <h2>北京时间起课 · 十二宫天地盘</h2>
      <p>月将按雨水、春分等十二中气更换，将月将加在占时地支上排天盘，再按日干寄宫与日支起四课。大六壬真实天地盘、四课三传、贵人及十二天将基础上，再按起课日所属六甲旬标注旬遁干、旬空。将天盘与地盘的空亡标记分开呈现，便于核对。</p>
    </header>
    <form className="liuren-v58-form" onSubmit={cast}>
      <label>公历起课日期
        <input aria-label="六壬公历日期" type="date" min="1901-01-01" max="2099-12-31"
          value={date} onChange={e=>{setDate(e.target.value);invalidate()}} required/>
      </label>
      <label>北京时间
        <input aria-label="六壬北京时间" type="time" value={clock}
          onChange={e=>{setClock(e.target.value);invalidate()}} required/>
      </label>
      <label>日柱换日口径
        <select aria-label="六壬换日规则" value={dayBoundary}
          onChange={e=>{setDayBoundary(e.target.value);invalidate()}}>
          <option value="zi_hour">子初23点换日</option>
          <option value="midnight">零点换日</option>
        </select>
      </label>
      <label>贵人昼夜口径
        <select aria-label="贵人昼夜规则" value={nobleMode}
          onChange={e=>{setNobleMode(e.target.value);invalidate()}}>
          <option value="hour_branch">按时支：卯至申昼，酉至寅夜</option>
          <option value="day">手动指定昼贵</option>
          <option value="night">手动指定夜贵</option>
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
      {chart.heavenly_generals&&<section className="liuren-v62-generals"
          aria-label="V62 贵人与十二天将">
        <header>
          <small>V62 · 贵人定位 / 十二天将</small>
          <h3>{chart.heavenly_generals.period} {chart.heavenly_generals.noble_branch} ·
            下临地盘 {chart.heavenly_generals.noble_ground_palace} ·
            {chart.heavenly_generals.direction}</h3>
          <p>贵人日干 {chart.heavenly_generals.day_stem}；
            昼贵 {chart.heavenly_generals.day_noble}，
            夜贵 {chart.heavenly_generals.night_noble}。</p>
          <p>{chart.heavenly_generals.clock_basis}。
            {chart.heavenly_generals.manual_override?
              '本盘是用户手动指定昼／夜贵的结果。':'本盘按占时地支自动分昼夜。'}</p>
          <p>{chart.heavenly_generals.direction_basis}。</p>
        </header>
        <div role="group" aria-label="十二天将次序" className="liuren-v62-order">
          {chart.heavenly_generals.order.map((g,i)=>
            <span key={g}><small>{i+1}</small><strong>{g}</strong></span>)}
        </div>
      </section>}
      {chart.xun_void_and_dun&&<section className="liuren-v63-xun"
          role="group" aria-label="V63 六甲旬遁干与旬空">
        <header>
          <small>V63 · 日旬六甲 / 遁干空亡</small>
          <h3>{chart.xun_void_and_dun.xun_head}旬 ·
            旬空 {chart.xun_void_and_dun.empty_branches.join('、')}</h3>
          <p>以{chart.xun_void_and_dun.day_ganzhi}日所属旬为准。
            天盘上神的遁干随天盘支走；地盘本位支的旬空则另外标记。</p>
        </header>
        <div role="group" aria-label="十二支旬遁干对照" className="liuren-v63-branch-table">
          {chart.xun_void_and_dun.branch_table.map(p=>
            <div key={p.branch} className={p.is_void?'empty':''}>
              <span>{p.branch}</span>
              <strong>{p.xun_dun_stem||'旬空'}</strong>
            </div>)}
        </div>
        <p>天盘空亡支实际下临：
          {chart.xun_void_and_dun.heaven_void_earth_palaces.map(p=>
            p.heaven+'临地'+p.earth).join('、')}。
          地盘本位旬空：{chart.xun_void_and_dun.earth_branch_void_palaces.join('、')}。</p>
        <p className="liuren-v63-distinction">注意：十二天将“天空”与六甲旬的“旬空”是两套不同概念。
          本盘不推断真空、假空或现实应期。</p>
      </section>}
      <h3>十二宫 · 天盘在上、地盘在下</h3>
      <div role="group" aria-label="大六壬十二宫天地盘" className="liuren-v58-plate">
        {chart.palaces.map(p=><button type="button" key={p.earth}
          className={selected===p.earth?'active':''} onClick={()=>setSelected(p.earth)}>
          <small>地盘 {p.earth}</small><strong>天盘 {p.heaven}</strong>
          {chart.xun_void_and_dun&&<small className={p.heaven_is_void?'liuren-v63-empty':''}>
            天盘{p.heaven_is_void?'旬空':('遁'+p.heaven_xun_dun)}
          </small>}
          {p.heavenly_general&&<b className={p.is_noble?'liuren-v62-noble':''}>
            {p.heavenly_general} · {p.general_element}</b>}
          <span>{p.earth===chart.hour_branch?'占时':''}
            {p.heaven===chart.month_general?' · 月将':''}</span>
        </button>)}
      </div>
      <p className="liuren-v58-selected">所选地盘 {selected} · 上临天盘
        <strong> {chart.heaven_plate[selected]}</strong>
        {chart.heavenly_generals&&<span> · 乘
          {chart.heavenly_generals.by_earth[selected]}天将</span>}
        {chart.xun_void_and_dun&&<span> · 天盘
          {chart.xun_void_and_dun.by_branch[chart.heaven_plate[selected]]||'旬空'}，
          地盘本位{chart.xun_void_and_dun.by_branch[selected]||'旬空'}</span>}</p>
      <h3>四课 · 上神与下神</h3>
      <div role="group" aria-label="大六壬四课" className="liuren-v58-lessons">
        {chart.four_lessons.map(p=><article key={p.number}>
          <small>第 {p.number} 课 · {p.from}</small>
          <strong>{p.upper}</strong><span>上神 · {p.upper_element}</span>
          <strong>{p.lower}</strong><span>下神 · {p.lower_element}</span>
          <b>{p.relation}</b>
          {p.heavenly_general&&<small className="liuren-v62-lesson-general">
            乘 {p.heavenly_general} · {p.general_element}</small>}
          {chart.xun_void_and_dun&&<small className={p.upper_is_void?'liuren-v63-empty':''}>
            上神 {p.upper_is_void?'旬空':('遁'+p.upper_xun_dun)}
          </small>}
        </article>)}
      </div>
      <h3>三传 · 初传、中传、末传</h3>
      {chart.pending_branch_review&&<section className="liuren-v74-branch"
          role="group" aria-label="V74 大六壬三传古籍例外与未决审查">
        <h4>V74 · {chart.pending_branch_review.label}</h4>
        {chart.pending_branch_review.status==='pending'?
          <>
            <p>未决门类：{chart.pending_branch_review.method}；
              {chart.pending_branch_review.reason}</p>
            <p>需复核：{chart.pending_branch_review.next_check}</p>
            <p>原课候选：{chart.pending_branch_review.candidate_branches.join('、')||'未能确定候选'}。
              未确定初传，不自动推算中末。</p>
          </>:
          chart.pending_branch_review.classical_exception_applied?
          <p>古籍固定三卯日：卯刑子，子再刑卯会重复，故末传改取子冲午。
            三传：{chart.pending_branch_review.three_transmissions.join(' → ')}。</p>:
          <p>本课三传已有本门现行规则来源校核，仍须区别实算排盘与最终断课。</p>}
        {chart.pending_branch_review.source&&<a
          href={chart.pending_branch_review.source}
          rel="noopener noreferrer" target="_blank">三传规则来源与复核资料</a>}
        <p>本版不自动断吉凶，也不把未完成的九宗门流派规则标为已完成。</p>
      </section>}
      {chart.transmission_review&&<div className="liuren-v59-rule">
        <strong>{chart.transmission_review.version||chart.version} 取传门类：{chart.transmission_review.method_family}</strong>
        <small>天地盘偏移 {chart.transmission_review.offset_palaces} 宫；
          {chart.has_full_nine_methods?'九宗门已齐':'九宗门仍有未完规则'}</small>
        {chart.transmission_review.distinct_lesson_audit&&<>
          <span>实际相异课数：
            <strong>{chart.transmission_review.distinct_lesson_audit.distinct_lesson_count}课</strong>；
            日干下神按寄宫归地盘判重。</span>
          <div role="group" aria-label="四课实际合并证据" className="liuren-v60-lesson-audit">
            {chart.transmission_review.distinct_lesson_audit.unique_pairs.map((p,i)=>
              <span key={i}>第{p.from_original_lessons.join('、')}课同组：
                {p.ground}宫上临{p.heaven}</span>)}
          </div>
        </>}
      </div>}
      {chart.shehai_v61?.full_path_witnesses&&<section className="liuren-v61-evidence"
          role="group" aria-label="V61 涉害逐宫路径与分歧">
        <h3>V61 涉害 · 逐宫计害证据</h3>
        <p>原课贼克方向：{chart.shehai_v61.relationship}；
          主法从实际下临地盘宫走到候选上神本家，逐一核查地支与寄干。</p>
        <div className="liuren-v61-compare">
          <span>循宫深度法：
            <strong>{chart.shehai_v61.selected_by_inclusive.winner||'待核'} </strong>
            （{chart.shehai_v61.selected_by_inclusive.depth}重最大深度）</span>
          <span>不计首宫：
            <strong>{chart.shehai_v61.selected_by_exclusive.winner||'待核'} </strong></span>
          <span>孟仲季先取简式：
            <strong>{chart.shehai_v61.selected_by_direct_class.winner||'待核'} </strong></span>
        </div>
        {(chart.shehai_v61.variance.depth_vs_shortcut_disagree||
           chart.shehai_v61.variance.inclusive_vs_exclusive_disagree)&&
          <p className="liuren-v61-disagreement" role="note">
            古籍口径存在取用分歧：当前三传仅按「循宫深度、首宫计入」结果排出，
            其他口径单独对照，不能当作一致结论。
          </p>}
        <div className="liuren-v61-candidates">
          {chart.three_transmissions.rule_audit.candidate_details
            .filter(p=>p.shehai_trace).map(p=><article key={p.upper}>
            <strong>{p.upper} 上神 · 下临 {p.actual_ground_palace} 宫</strong>
            <span>归本家路径：{p.shehai_trace.path.join(' → ')}</span>
            <span>计首宫 {p.shehai_trace.depth} 重；不计首宫
              {p.shehai_excluding_start.depth} 重</span>
            <div className="liuren-v61-hit-list">
              {p.shehai_trace.hits.map((h,i)=><small key={i}>
                {h.earth}宫 · {h.kind}{h.symbol}（{h.element}）
              </small>)}
            </div>
          </article>)}
        </div>
        <a href={chart.shehai_v61.source} rel="noopener noreferrer"
           target="_blank">《六壬大全》涉害原文</a>
      </section>}
      {chart.three_transmissions.status==='computed'?
        <div role="group" aria-label="大六壬三传" className="liuren-v58-transmissions">
          {chart.three_transmissions.transmissions.map(p=><article key={p.order}>
            <small>{p.name}</small><strong>{p.branch}</strong>
            {p.heavenly_general&&<span className="liuren-v62-trans-general">
              {p.heavenly_general} · 临地盘{p.earth_palace}</span>}
            {chart.xun_void_and_dun&&<span className={p.is_xun_void?'liuren-v63-empty':''}>
              {p.is_xun_void?'旬空':('旬遁'+p.xun_dun_stem)}</span>}
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
                  <span>下临地盘 {c.actual_ground_palace||'待核'} 宫，
                    {c.actual_ground_class||c.candidate_branch_class}位 ·
                    {c.same_yin_yang_as_day?'与日干阴阳相同':'与日干阴阳不同'}</span>
                  {c.classification_basis&&<small>依据：{c.classification_basis}</small>}
                </article>)}
              <p>逐宫涉害深浅未独立核验；不同口径不可自动择一。</p>
            </div>}
        </div>}
      {chart.calendar_provenance.warnings.map((w,i)=>
        <p key={i} className="academy-caution">{w}</p>)}
      <p className="academy-caution">V74 已保留 V62 十二天将、V63 日旬遁干与旬空实算，并修正丁卯、己卯、辛卯伏吟互刑杜传。
        对涉害争议、反吟多克等未决条件仍不自行选择初传；完整九宗门异派、贵人异法、真太阳时与吉凶断课未全部核实。</p>
      <a href={chart.source.earth_heaven_four_lessons} target="_blank"
        rel="noopener noreferrer">阅读《六壬指南》天地盘与四课原文</a>
    </div>}
  </section>
}
