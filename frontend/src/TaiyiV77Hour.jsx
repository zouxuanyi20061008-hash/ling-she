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
  return <section className="taiyi-v77-hour" aria-label="V81 太乙时计原典内证及八门实盘">
    <header>
      <small>V81 · 太乙时计 / 直使候选落位与原典内证审查</small>
      <h3>时计起盘 · 北京时间双时辰</h3>
      <p>区别于上方岁计：按实际冬至、夏至交节选择阳遁或阴遁；
        太乙沿八宫每三时移一宫，计神每时逆行一支。
        V78 另算冬夏至前最近甲子日简捷历元的五元七十二局、六纪与阴阳文昌十八算；
        V79 增加计神加和德取始击、主客逐宫投算与大参将；
        V80 增加时支六合合神、定计目、十六神逐宫定算与四门120时直使。
        V81 核对古籍定计32/33为同一文本内部冲突，并补充八门直使古法候选定位；
        冲突盘绝不冒称定大参将已定，也不把时计门位候选当作已核实九宫飞布。</p>
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
          不能跳过甲子元23局直接推出文昌；古代绝对上元积时、时计定计、
          全部八门飞布及断课仍待核准。</p>
        <a href={chart.classical_jiazi_hour_v78.sources.independent_887_and_47}
          target="_blank" rel="noopener noreferrer">887时与47时原例</a>
        <span> · </span>
        <a href={chart.classical_jiazi_hour_v78.sources.yin_63}
          target="_blank" rel="noopener noreferrer">戊子元阴63局原例</a>
      </section>}
      {chart.hour_main_guest_v79&&<section className="taiyi-v79-main-guest"
          role="group" aria-label="V79 时计始击与主客大小将实盘">
        <h4>V79 · 始击与主客投算（甲子日前简捷历元）</h4>
        <p>本时局来自 V78 的
          <strong> {chart.hour_main_guest_v79.five_yuan_name}
            {chart.hour_main_guest_v79.dun}{chart.hour_main_guest_v79.ju}局</strong>，
          太乙{chart.hour_main_guest_v79.taiyi_palace}宫；
          计神{chart.hour_main_guest_v79.jishen}。
          文昌 <strong>{chart.hour_main_guest_v79.heaven_eye_wenchang.direction}
            ·{chart.hour_main_guest_v79.heaven_eye_wenchang.god}</strong>；
          始击 <strong>{chart.hour_main_guest_v79.earth_eye_shiji.direction}
            ·{chart.hour_main_guest_v79.earth_eye_shiji.god}</strong>。
        </p>
        <p>始击算法：将计神加于艮和德，再看文昌所临之下。
          主客双方分别按自己的起算目顺行十六神，遇太乙宫前截止。</p>
        <div className="taiyi-v79-sides">
          {[
             {label:'主',v:chart.hour_main_guest_v79.main},
             {label:'客',v:chart.hour_main_guest_v79.guest}
           ].map(({label,v})=><article key={label}>
            <h5>{label}算 · {v.status==='computed'?v.count+' 算':'同宫规则待判'}</h5>
            {v.status==='computed'?
              <p>{label}大将 <strong>{v.main_general}宫</strong>，
                {label}参将 <strong>{v.assistant_general}宫</strong></p>:
              <p className="academy-caution">{v.reason}</p>}
            <details>
              <summary>展开{label}方逐宫取算路径
                {v.status==='computed'?'（不含太乙本宫）':'（保留原典异法）'}</summary>
              {v.status==='computed'?
                <div className="taiyi-v79-trace" role="group"
                    aria-label={label+'方主客逐位投算'}>
                  {v.trace.map(s=><span key={s.order}>
                    {s.order}. {s.direction}·{s.god} {s.added>0?'＋'+s.added:'＋0'}
                  </span>)}
                </div>:
                <p>本方尚无唯一可核时计同宫取算依据，不显示虚构算数。</p>}
            </details>
          </article>)}
        </div>
        <p>{chart.hour_main_guest_v79.status==='computed'?
          '主客双方逐宫实算完毕；这只是传统排盘结构，不构成现实断语。':
          '本课有同宫特殊取算未核：只显示已核的一方，不把未决数补为零或套用岁计异法。'}</p>
        <details>
          <summary>核对 V79 时计十六神：文昌、始击与计神实际位置</summary>
          <div className="taiyi-v79-spirits" role="group"
               aria-label="V79 时计十六神原始位置">
            {chart.hour_main_guest_v79.sixteen_spirits.map(s=><span key={s.index}>
              {s.direction}·{s.god}
              {s.has_wenchang?' [文昌]':''}
              {s.has_shiji?' [始击]':''}
              {s.has_jishen?' [计神]':''}
            </span>)}
          </div>
        </details>
        <p className="academy-caution">本盘依据 V78 二至前甲子日简捷积时；
          合神、定目、值使在 V80 独立核算，全部八门飞布、
          定算古籍数字分歧与绝对上元历元仍需校勘。不输出吉凶或应期。</p>
        <a href={chart.hour_main_guest_v79.sources.ancient_887}
          target="_blank" rel="noopener noreferrer">
          《太乙金钥匙》庚戌时主16客23、大参6/8与3/9古籍例盘
        </a>
      </section>}
      {chart.hour_dingji_v80&&chart.hour_eight_doors_v80&&
        <section className="taiyi-v80-hour-dingji" role="group"
                 aria-label="V80 太乙时计合神定算与八门直使">
          <h4>V80 · 合神、定计目与时计直使</h4>
          <p>时支 <strong>{chart.hour_dingji_v80.hour_branch}</strong>，
             六合 <strong>{chart.hour_dingji_v80.harmony.branch}</strong>，
             合神 <strong>{chart.hour_dingji_v80.harmony.god}</strong>。
             文昌临于定目 <strong>{chart.hour_dingji_v80.dingji_eye.direction}
             ·{chart.hour_dingji_v80.dingji_eye.god}</strong>。
             合神加时支的完整十六神旋宫可展开复核。</p>
          <p>当前定计：{chart.hour_dingji_v80.status==='computed'?
             <><strong>{chart.hour_dingji_v80.count} 算</strong>；
               定大将 {chart.hour_dingji_v80.main_general} 宫，
               定参将 {chart.hour_dingji_v80.assistant_general} 宫。</>:
             chart.hour_dingji_v80.status==='source_conflict'?
             <><strong>古籍原文与列数冲突，默认待判。</strong>
               本盘按逐项列数合计
               {chart.hour_dingji_v80.computed_trace_sum}算，
               原书另记{chart.hour_dingji_v80.source_disagreement.printed_total}算。
               原书并记大将
               {chart.hour_dingji_v80.source_disagreement.printed_big_general}宫、
               参将
               {chart.hour_dingji_v80.source_disagreement.printed_assistant_general}宫；
               未将其作为唯一计算答案。</>:
             <strong>定目与太乙同宫，特殊取算尚待校勘。</strong>}</p>
          <details>
            <summary>展开 V80 定计目十六神旋宫和逐宫取算证据</summary>
            <div className="taiyi-v80-rotation" role="group"
                 aria-label="V80 时支六合旋宫原始位置">
              {chart.hour_dingji_v80.rotation.rotated_sixteen.map((x,i)=>
                <span key={i}>{x.ground} 下临 {x.heaven}
                  {x.is_dingji_eye?' · 定目':''}
                </span>)}
            </div>
            <div className="taiyi-v80-trace" role="group" aria-label="V80 定算逐项加数">
              {chart.hour_dingji_v80.computed_trace.map(s=>
                <span key={s.order}>{s.order}. {s.direction}·{s.god}
                  {' ＋'+s.added}</span>)}
            </div>
            {chart.hour_dingji_v80.source_disagreement&&
              <p className="academy-caution">
                原典明确记载 33 算，但所列
                {chart.hour_dingji_v80.source_disagreement.actual_listed_addends.join('＋')}
                ={chart.hour_dingji_v80.source_disagreement.listed_sum}。
                本站未人为加一；定大参将保持空值，待异本校勘。
              </p>}
          </details>
          <div className="taiyi-v80-door" role="group"
               aria-label="V80 时计八门值使与门内时数">
            <strong>直使：{chart.hour_eight_doors_v80.chief_door}门</strong>
            <span>{chart.hour_eight_doors_v80.dun} ·
              每门30时，当前第{chart.hour_eight_doors_v80.hour_in_door}时
              （120时周内第{chart.hour_eight_doors_v80.hour_in_120}时）</span>
            <span>时计门序：
              {chart.hour_eight_doors_v80.sequence.map(s=>s+'门').join(' → ')}</span>
            <span>只确定直使门及定计目锚位；其他门完整飞宫尚未核验。</span>
          </div>
          <p className="academy-caution">V80 核算的是传统太乙时计结构；
            史料庚戌时“定计33”与逐宫列数32矛盾，不能因算数不符
            而伪造一算。其他时局遇同宫亦保留待判。
            古代绝对上元历元、全部八门飞布与实际断课仍待完成。</p>
          <a href={chart.hour_dingji_v80.sources.classical}
             target="_blank" rel="noopener noreferrer">
            《太乙金钥匙》庚戌时合神、定计、八门原文
          </a>
        </section>}
      {chart.hour_v81_source_review&&chart.hour_v81_door_location_candidate&&
       <section className="taiyi-v81-source-review" role="group"
                aria-label="V81 太乙时计原典内部冲突与值使候选位置">
         <h4>V81 · 定算内证与值使十六神候选位</h4>
         <p>古籍证据性质：
           <strong>《太乙金钥匙》同一本书内部核对</strong>，
           并非两种独立刻本已经确认的异文。
           {chart.hour_v81_source_review.calculation_status==='source_conflict'?
             ' 本课定算沿途加数为32，正文却写33；未凭空加一，定大参继续待判。':
             chart.hour_v81_source_review.calculation_status==='pending'?
             ' 本课定计目与太乙同宫，缺少独立时计专例，继续待判。':
             ' 本课定算按实际逐宫求和，未落入庚戌时已知32／33分歧类。'}
         </p>
         <p>古法候选：直使 <strong>
           {chart.hour_v81_door_location_candidate.chief_door}门</strong>
           可依“直使加定计目”规则候选临在
           <strong> {chart.hour_v81_door_location_candidate.candidate_direction}
           ·{chart.hour_v81_door_location_candidate.candidate_god}</strong>。
           {chart.hour_v81_door_location_candidate.is_intermediate_direction?
             '此处是十六神间位，不能强行挪为某一九宫正宫。':
             '此处本身是八正宫的十六神位置，可标注对应宫位，但不等于所有八门已飞布。'}
         </p>
         <p>此定位来自古法及岁计相关段落的推算候选，
           <strong>尚无这张时计庚戌原例的独立完整落门图</strong>，
           因此不是已认证的时计落宫结果。</p>
         <details>
           <summary>展开 V81 十六神直使候选标记与定算文字审查</summary>
           <div className="taiyi-v81-spirits" role="group"
                aria-label="V81 直使候选十六神位置">
             {chart.hour_v81_door_location_candidate.candidate_position_marks.map(p=>
               <span key={p.index}>
                 {p.direction}·{p.god}
                 {p.candidate_chief_door_here?' [候选'+p.candidate_door+'门]':''}
               </span>)}
           </div>
           {chart.hour_v81_source_review.calculation_status==='source_conflict'&&
            <p>本课非零加数：
              {chart.hour_v81_source_review.nonzero_addends.map(x=>x.added).join('＋')}
              ＝{chart.hour_v81_source_review.nonzero_sum}；
              原书文字记{chart.hour_v81_source_review.reported_total}，
              同书另一张丁未日例课算32，
              <strong>但不是庚戌时的独立异本</strong>。</p>}
           {chart.hour_v81_same_palace_review?.pending_sides>0&&
            <p>同宫特殊取算仍未决：
              {chart.hour_v81_same_palace_review.cases.map(s=>
                s.side+'方 '+s.eye_direction+'·'+s.eye_god).join('；')}。
              旧岁计候选未被自动用于时计。</p>}
         </details>
         <p className="academy-caution">时计八门直使的轮值门名已实算；
           V81 只有有出处的候选十六神位，不能冒充完整八门实际飞宫。
           古代绝对上元积时、定算冲突与同宫异法继续待校勘。</p>
         <a href={chart.hour_v81_source_review.source_witnesses[0].source}
            target="_blank" rel="noopener noreferrer">庚戌时定计原文</a>
         <span> · </span>
         <a href={chart.hour_v81_door_location_candidate.primary_text_rules[1].source}
            target="_blank" rel="noopener noreferrer">直使加定计目的古法出处</a>
       </section>}
      {chart.solstice.near_15_minutes&&
        <p className="academy-caution" role="note">
          本次处于交节前后十五分钟内，请进一步核查权威节气时刻。
        </p>}
      <p className="academy-caution">V81 对 V80 的定算古籍32／33内部矛盾和
        “直使加定目”候选位进行逐项来源审查；同宫待判、全部八门飞布未完成。
        古代绝对上元积时尚未核验；岁计、交节时实与甲子日起点独立，
        不作现实吉凶判断。</p>
      <a href={chart.sources.zhou} target="_blank" rel="noopener noreferrer">
        《太乙金镜式经》冬夏至时计原文</a>
      <span> · </span>
      <a href={chart.sources.hour_example} target="_blank" rel="noopener noreferrer">
        《太乙金钥匙》时计积47时例盘</a>
    </section>}
  </section>
}
