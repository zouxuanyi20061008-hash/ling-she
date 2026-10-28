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
  const [doorSchool,setDoorSchool]=useState('jinjing_taiyi')
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
  const v82=chart?.hour_v82_eight_door_schools
  const v84=chart?.hour_v84_qiying_plate
  const doorChoices=v82?.candidates||[]
  const doorBoard=doorChoices.find(c=>c.school===doorSchool)||doorChoices[0]
  const doorTitle={
    jinjing_taiyi:'《太乙金镜式经》·直使加太乙',
    jinjing_main:'《太乙金镜式经》·直使加主大将',
    jinjing_guest:'《太乙金镜式经》·直使加客大将',
    jinyao_dingji_eye:'《太乙金钥匙》·直使加定计目'
  }
  return <section className="taiyi-v77-hour" aria-label="V84 太乙时计气应独立基本盘与甲子派分图对照">
    <header>
      <small>V84 · 太乙时计 / 二至气应独立太乙与甲子派八门条件盘</small>
      <h3>时计起盘 · 北京时间双时辰</h3>
      <p>区别于上方岁计：按实际冬至、夏至交节选择阳遁或阴遁；
        太乙沿八宫每三时移一宫，计神每时逆行一支。
        V78 另算冬夏至前最近甲子日简捷历元的五元七十二局、六纪与阴阳文昌十八算；
        V79 增加计神加和德取始击、主客逐宫投算与大参将；
        V80 增加时支六合合神、定计目、十六神逐宫定算与四门120时直使。
        V81 继续保留庚戌时定计32／33原文矛盾；
        V82 将古籍“直使加太乙／主客大将／定计目”四种起宫方法分栏旋宫。
        所得八门图是有出处的数学候选，并非唯一已验真的完整时计式。
        V83 加入王希明二至气应起门，与V78甲子日前捷法分开显示，
        不把一个历元的直使挪到另一个历元的主客大将上。
        V84 将气应派太乙、计神和直使独立组成基本盘，主客将尚缺初始宫位，
        不能从甲子派借来完成气应派的全盘。</p>
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
      {chart.hour_v83_chief_epoch_comparison&&
        <section className="taiyi-v83-epoch" role="group"
          aria-label="V83 太乙时计二至气应和甲子捷法直使对照">
          <h4>V83 · 两种时计历元分别推直使</h4>
          <p>原典《太乙金镜式经》载旧法甲子日起门、
            王希明新法以冬夏至气应即时起门，不拘固定干支日。
            两种起点不可默认相同。</p>
          <div className="taiyi-v83-clocks">
            <article>
              <small>王希明 · 二至交节后相对时实（V77）</small>
              <strong>{chart.hour_v83_chief_epoch_comparison.solstice_chief}门</strong>
              <span>积{chart.hour_v83_chief_epoch_comparison.relative_count}时，
                门内第{chart.hour_v83_chief_epoch_comparison.solstice_hour_in_door}时</span>
              <span>来源：《太乙金镜式经》二至气应起门</span>
            </article>
            <article>
              <small>前甲子日简捷积时（V78–V82）</small>
              <strong>{chart.hour_v83_chief_epoch_comparison.jiazi_chief}门</strong>
              <span>积{chart.hour_v83_chief_epoch_comparison.previous_jiazi_count}时，
                门内第{chart.hour_v83_chief_epoch_comparison.jiazi_hour_in_door}时</span>
              <span>来源：《太乙金钥匙》甲子简捷起点</span>
            </article>
          </div>
          <p>起点相差 <strong>
            {chart.hour_v83_chief_epoch_comparison.offset_between_epoch_hours}时</strong>，
            120时周余
            {chart.hour_v83_chief_epoch_comparison.offset_modulo_120}时。
            <strong>{chart.hour_v83_chief_epoch_comparison.same_chief_door?
              ' 两法此课直使门名相同。':
              ' 两法此课直使门名不同，必须分别保留。'}</strong>
            {chart.hour_v83_chief_epoch_comparison.same_chief_and_hour_in_door?
              ' 两法本课门内时数也相同，并不证明起点一致。':
              ' 两法不能作为同一个值使起算结果。'}
          </p>
          <p className="academy-caution">
            下方 V82 八门九宫候选使用
            <strong>前甲子日捷法</strong>的文昌、主客大将与直使。
            不得把此处王希明二至法直使直接套到下方原有大将宫；
            气应派完整八门主客宫仍未单独验证。</p>
          <p>
            <a href={chart.hour_v83_chief_epoch_comparison.jinjing_solstice_relative.source}
              target="_blank" rel="noopener noreferrer">《太乙金镜式经》二至气应起门原文</a>
            {' · '}
            <a href={chart.hour_v83_chief_epoch_comparison.jinyao_jiazi_shortcut.source}
              target="_blank" rel="noopener noreferrer">《太乙金钥匙》时计起门法</a>
          </p>
        </section>}
      {v84&&<section className="taiyi-v84-independent" role="group"
         aria-label="V84 气应与甲子派独立太乙八门候选九宫对照">
        <h4>V84 · 二至气应派独立基本盘</h4>
        <p>王希明二至气应起时：
          <strong>太乙{v84.qiying.taiyi_palace.number}宫
          {v84.qiying.taiyi_palace.trigram}</strong>，
          计神 <strong>{v84.qiying.jishen}</strong>，
          直使 <strong>{v84.qiying.hour_chief.chief_door}门</strong>；
          太乙每三时一移，计神逐时逆行。</p>
        <div className="taiyi-v84-comparisons">
          {[
            {key:'qiying',label:'二至气应派 · V77/V83',
             plate:v84.qiying.taiyi_eight_door_conditional_rotation,
             palace:v84.qiying.taiyi_palace.number,
             chief:v84.qiying.hour_chief.chief_door},
            {key:'jiazi',label:'甲子日前简捷派 · V78/V82',
             plate:v84.jiazi.taiyi_eight_door_conditional_rotation,
             palace:v84.jiazi.taiyi_palace.number,
             chief:v84.jiazi.hour_chief.chief_door}
          ].map(s=><article key={s.key}>
            <h5>{s.label}</h5>
            <p>太乙 {s.palace}宫 · 直使 {s.chief}门
              （只以太乙宫作条件锚点）</p>
            <div className="taiyi-v84-grid" role="group"
                 aria-label={s.key==='qiying'?
                   'V84 王希明二至气应八门条件九宫图':
                   'V84 前甲子日简捷八门条件九宫图'}>
              {[9,2,7,4,5,6,3,8,1].map(p=>
                <div key={p} className={'taiyi-v84-cell'+
                  (p===s.palace?' is-origin':'')+(p===5?' is-center':'')}>
                  <small>{p}宫</small>
                  <strong>{p===5?'中五':
                    (s.plate.by_palace[String(p)]||'未决')+'门'}</strong>
                  <small>{p===s.palace?'太乙候选起门':
                    p===5?'不入八门':'数学旋宫，未验真'}</small>
                </div>)}
            </div>
          </article>)}
        </div>
        <p>核对结果：
          {v84.same_chief?'两派直使门名相同':'两派直使门名不同'}；
          {v84.same_taiyi_palace?'太乙落宫相同':'太乙落宫不同'}；
          <strong>{v84.same_conditional_taiyi_door_rotation?
             '两张八门条件图恰好相同':'两张八门条件图不同'}</strong>。
          即使恰好同图，也不证明起元相同或完整时计已验真。</p>
        <p className="academy-caution">气应派的主、客大将每时一移虽然见于古籍，
          但缺少同一历元的可校初始宫位：
          <strong>气应主大将与客大将均待判</strong>，
          不显示借来的甲子派将位。上方两套八门图仅为各自以太乙宫起门的
          条件数学旋转，不是独立古籍验真的完整八门实盘。</p>
        <p><a href={v84.qiying.source.hour_palace_jishen}
          target="_blank" rel="noopener noreferrer">《太乙金镜式经》二至后太乙与计神</a>
          {' · '}
          <a href={v84.qiying.source.chief_and_general_motion}
             target="_blank" rel="noopener noreferrer">直使加太乙及大将移动法</a>
        </p>
      </section>}
      {v82&&<section className="taiyi-v82-schools" role="group"
        aria-label="V82 太乙时计四派八门古籍旋宫候选">
        <h4>V82 · 分古籍起宫的八门候选排布</h4>
        <p>八门八卦环序：
          <strong>开乾、休坎、生艮、伤震、杜巽、景离、死坤、惊兑</strong>。
          本局实际直使是 <strong>{v82.chief}门</strong>，
          门内第{v82.chief_hour_in_30}时；环序可校，起点古法却不唯一。</p>
        {doorBoard&&<>
          <label className="taiyi-v82-chooser">对照古籍起宫分支
            <select value={doorBoard.school} aria-label="V82 选择太乙八门古籍起宫法"
              onChange={e=>setDoorSchool(e.target.value)}>
              {doorChoices.map(q=><option key={q.school} value={q.school}>
                {doorTitle[q.school]||q.school}（{q.anchor_palace}宫）
              </option>)}
            </select>
          </label>
          <p>当前：<strong>{doorTitle[doorBoard.school]||doorBoard.school}</strong>，
            候选将{doorBoard.chief}门置于
            <strong>{doorBoard.anchor_palace}宫·{doorBoard.anchor_direction}</strong>，
            顺八卦方位环旋宫；不得混用太乙的八宫游行顺序。</p>
          <div className="taiyi-v82-nine" role="group"
            aria-label="V82 当前古法候选八门九宫布局">
            {[9,2,7,4,5,6,3,8,1].map(n=><div key={n}
              className={'taiyi-v82-cell'+(n===5?' is-center':'')+
                (n===doorBoard.anchor_palace?' is-anchor':'')}>
              <small>{n}宫</small>
              <strong>{n===5?'中五不布门':
                (doorBoard.by_palace[String(n)]||'待判')+'门'}</strong>
              <small>{n===doorBoard.anchor_palace?'直使候选起点':
                n===5?'不入八门八方环':'旋宫候选，非已验真'}</small>
            </div>)}
          </div>
          <details>
            <summary>核对这一古法候选的八方逐宫路径及原典</summary>
            <div className="taiyi-v82-path" role="group"
              aria-label="V82 古法八门逐宫候选轨迹">
              {doorBoard.slots.map(s=><span key={s.palace}>
                {s.step+1}. {s.direction}·{s.palace}宫 {s.door}门
                {s.is_chief_anchor?' · 直使候选起点':''}
              </span>)}
            </div>
            <a href={doorBoard.anchor_source} target="_blank" rel="noopener noreferrer">
              此古法候选起宫原文</a>
          </details>
        </>}
        <p>本局四种来源共核得 {v82.candidate_count} 套可旋宫候选；
          其他起宫法因同宫未决、中五不能布门或定计目在间神而不能置入正宫。</p>
        {v82.unplaceable?.length>0&&<details>
          <summary>查看无法安宫的来源（{v82.unplaceable.length}条）</summary>
          <div role="group" aria-label="V82 未决八门起宫来源">
            {v82.unplaceable.map(p=><p key={p.school}>
              <strong>{doorTitle[p.school]||p.school}</strong>：
              {p.reason}{p.eye_direction?'；原始定计目：'+p.eye_direction:''}
            </p>)}
          </div>
        </details>}
        <p className="academy-caution">所有八门方位都只是带有明确来源起点的
          <strong>条件推演</strong>。古籍庚戌时例只核对了生门直使，
          未提供完整八门落宫独立真值。不得把任一候选直接当作统一时计盘；
          庚戌定计32／33及同宫特殊取算仍待校勘。</p>
        <p><a href={v82.source_support.canonical_eight_door_compass}
             target="_blank" rel="noopener noreferrer">八门八卦固定环序原文</a>
          {' · '}
          <a href={v82.source_support.time_chief_taiyi_main_guest}
             target="_blank" rel="noopener noreferrer">直使加太乙及主客大将原文</a>
          {' · '}
          <a href={v82.source_support.ancient_dingji_eye_variant}
             target="_blank" rel="noopener noreferrer">定计目古法原文</a>
        </p>
      </section>}
      {chart.solstice.near_15_minutes&&
        <p className="academy-caution" role="note">
          本次处于交节前后十五分钟内，请进一步核查权威节气时刻。
        </p>}
      <p className="academy-caution">V84 新增二至气应独立太乙、计神、直使及太乙锚点候选八门；
        气应主客将初始宫位未有独立真值，不能借用V78甲子派大将。
        庚戌定算32／33、同宫专法、全部八门落宫和古代绝对上元积时仍未完成；
        岁计独立，不作现实吉凶判断。</p>
      <a href={chart.sources.zhou} target="_blank" rel="noopener noreferrer">
        《太乙金镜式经》冬夏至时计原文</a>
      <span> · </span>
      <a href={chart.sources.hour_example} target="_blank" rel="noopener noreferrer">
        《太乙金钥匙》时计积47时例盘</a>
    </section>}
  </section>
}
