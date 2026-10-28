import {useState} from 'react'
import './academy.css'
import TaiyiV77Hour from './TaiyiV77Hour.jsx'

const YEAR_NOW=()=>Number(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Shanghai',
  year:'numeric'}).format(new Date()))

export default function TaiyiV64(){
  const [year,setYear]=useState(YEAR_NOW)
  const [chart,setChart]=useState(null)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [picked,setPicked]=useState(null)
  const [pickedSpirit,setPickedSpirit]=useState(null)
  const [samePalaceRule,setSamePalaceRule]=useState('wubeizhi')
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
        body:JSON.stringify({gregorian_year:n,
          ...(samePalaceRule==='conservative'?{same_palace_rule:'conservative'}:{})})
      })
      const result=await response.json()
      if(!response.ok)throw new Error(typeof result.detail==='string'?
        result.detail:'请核对公历年份和选用的太乙岁计历元。')
      setChart(result);setPicked(result.year.taiyi_palace.number)
      setPickedSpirit(result.main_guest?.heaven_eye_wenchang?.index??null)
    }catch(e){setError(e?.message||'太乙岁计失败')}
    finally{setBusy(false)}
  }
  const chosen=chart?.nine_palaces.find(p=>p.number===picked)
  const spirit=chart?.sixteen_spirits?.find(s=>s.index===pickedSpirit)
  return <section className="taiyi-v64" aria-label="V67 太乙真实岁计">
    <header><small>V67 · 太乙神数 / 定计与中五将</small>
      <h2>积年推局 · 太乙八宫行次</h2>
      <p>采用《古今图书集成》天启四年与《太乙金钥匙》嘉靖四十年的同系积年，
        实算五元、七十二局、太乙行宫、理天理地理人及岁计计神。此为岁计，
        不把冬夏至转换的时计阴阳规则混入。V67 已实算岁计定计目、定计大将与参将，并记录中五不出；仍可切换《武备志》同宫取算与 V65 谨慎待算口径。</p>
    </header>
    <form onSubmit={cast} className="taiyi-v64-form">
      <label>公历年份
        <input type="number" aria-label="太乙岁计公历年" min="1901" max="2099" step="1"
          value={year} onChange={e=>setYear(e.target.value)} required/>
      </label>
      <label>同宫特殊取算口径
        <select aria-label="太乙同宫计算口径" value={samePalaceRule}
          onChange={e=>setSamePalaceRule(e.target.value)}>
          <option value="wubeizhi">《武备志》同宫取本宫数（默认）</option>
          <option value="conservative">谨慎口径：同宫待校勘（V65）</option>
        </select>
      </label>
      <button type="submit" disabled={busy}>{busy?'正在排岁计…':'计算太乙年局'}</button>
    </form>
    <TaiyiV77Hour/>
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
          <span>{p.is_taiyi?'太乙在此':p.is_center_unoccupied?'太乙中五不游':'查看宫位'}</span>
          {chart.dingji_v67&&<small>
            {p.dingji_eye_here?'定计目 ':''}
            {p.dingji_big_general_here?'定计大将 ':''}
            {p.dingji_assistant_here?'定计参将 ':''}
            {p.any_general_five?'有大参将居中五 ':''}
          </small>}
          {chart.sixteen_spirits&&<small>
            {p.wenchang_here?'文昌临宫 ':''}{p.shiji_here?'始击临宫 ':''}
            {p.main_general_here?'主大将 ':''}{p.guest_general_here?'客大将 ':''}
          </small>}
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
      {chart.main_guest.heaven_eye_wenchang&&<>
        <section className="taiyi-v65-marks" aria-label="V65 十六神与文昌始击定位">
          <h3>十六神 · 文昌与始击实算</h3>
          <p>文昌：<strong>{chart.main_guest.heaven_eye_wenchang.direction}
              · {chart.main_guest.heaven_eye_wenchang.god}</strong>（积年在十八算周内第
              {chart.main_guest.heaven_eye_wenchang.count_in_18}算）；
            始击：<strong>{chart.main_guest.earth_eye_shiji.direction}
              · {chart.main_guest.earth_eye_shiji.god}</strong>。
            计神在 {chart.year.jishen}，加艮和德之后读取文昌下临神。</p>
          <div role="group" aria-label="太乙十六神方位" className="taiyi-v65-spirits">
            {chart.sixteen_spirits.map(p=><button key={p.index} type="button"
              className={[
                p.has_wenchang?'wenchang':'',p.has_shiji?'shiji':'',
                p.index===pickedSpirit?'selected':''].join(' ')}
              onClick={()=>setPickedSpirit(p.index)}>
              <small>{p.direction} · {p.palace!=null?p.palace+'宫':'间位'}</small>
              <strong>{p.god}</strong>
              <span>{p.has_wenchang?'文昌 ':''}{p.has_shiji?'始击 ':''}
                {p.has_jishen?'计神 ':''}</span>
            </button>)}
          </div>
          {spirit&&<p className="taiyi-v65-picked">
            选中：{spirit.direction} · {spirit.god}。
            {spirit.palace!=null?'正宫按'+spirit.palace+'数累计。':'间位非起点时不累算。'}
          </p>}
        </section>
        <section className="taiyi-v65-counts" role="group" aria-label="V65 主客逐宫投算证据">
          <h3>主客投算 · 可逐位复核</h3>
          {chart.main_guest.same_palace_rule_label&&<p>
            当前同宫取算口径：<strong>{chart.main_guest.same_palace_rule_label}</strong>。
            非同宫课仍沿用原有逐宫累计算法。</p>}
          <div className="taiyi-v65-count-grid">
            {[
              ['主算 · 文昌出发',chart.main_guest.main_general],
              ['客算 · 始击出发',chart.main_guest.guest_general]
            ].map(([title,calc])=><article key={title}>
              <small>{title}</small>
              {calc.status==='computed'?<>
                <strong>{calc.count} 算</strong>
                <p>大将 {calc.main_general} 宫 · 参将 {calc.assistant_general} 宫</p>
                {calc.special_rule_applied&&<p className="taiyi-v66-special">
                  <strong>同宫特例已计算</strong>：按《武备志》只取本宫数，
                  不沿十六神再绕一周；原 V65 待算分支仍有记录。
                </p>}
                <div className="taiyi-v65-steps">
                  {calc.trace.map(x=><span key={x.order}
                    className={x.added>0?'counted':''}>
                    {x.direction} {x.god}：+{x.added}
                  </span>)}
                </div>
                <p>{calc.special_rule_applied?
                 '同宫特法：在太乙'+calc.stop_palace+'宫取本宫数后立即止算。':
                 '常规法：行至太乙'+calc.stop_palace+'宫前止，不计本宫。'}</p>
              </>:<>
                <strong>待校勘</strong>
                <p>{calc.reason}</p>
                {calc.historical_alternative&&<div className="taiyi-v65-variant">
                  <b>另一原典口径：{calc.historical_alternative.school}</b>
                  <p>同宫按宫数：{calc.historical_alternative.calculated_count}算，
                     大将{calc.historical_alternative.main_general}宫，
                     参将{calc.historical_alternative.assistant_general}宫。
                     此为独立异派结果，未加入默认主客算。</p>
                  <a href={calc.historical_alternative.source}
                     target="_blank" rel="noopener noreferrer">查看同宫异法原文</a>
                </div>}
              </>}
            </article>)}
          </div>
          {chart.historical_case_audit&&<p className="taiyi-v66-verified">
            阳遁第{chart.historical_case_audit.ju}局已与独立古籍原文逐项核对：
            文昌、始击、主客算以及大将迁宫有完整例盘证据。
          </p>}
          {chart.main_guest.verified_by_independent_ancient_case&&<p>
            本年份文昌、始击、主客算已与独立古籍固定例盘逐项相符。</p>}
          <p>本盘主客状态：{chart.main_guest.status==='computed'?'两方均已计算':
             chart.main_guest.status==='partially_computed'?'仅部分已计算':'待核验'}。
             主客将与主客算是古典算式，不代表现实事件吉凶。</p>
        </section>
        {chart.school_disagreements?.length>0&&<section className="taiyi-v66-disagreements"
            role="group" aria-label="太乙古籍异文比对">
          <h3>古籍异文 · 保留不同记载</h3>
          {chart.school_disagreements.map((c,i)=><div key={i}>
            <strong>{c.topic}</strong>
            <p>{c.chosen_school}：主算{c.chosen_main_count}；
              {c.other_school}：主算{c.other_main_count}。
              当前程序遵循实际逐宫投算，其他记载不自动覆盖结果。</p>
            <a href={c.chosen_source} target="_blank" rel="noopener noreferrer">
              当前口径原文</a>
            <span>　·　</span>
            <a href={c.other_source} target="_blank" rel="noopener noreferrer">
              异文原文</a>
          </div>)}
        </section>}
      </>}
      {!chart.main_guest.heaven_eye_wenchang&&<section aria-label="太乙主客待校勘" className="taiyi-v64-pending">
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
      </section>}
      {chart.dingji_v67&&<section className="taiyi-v67-dingji"
          role="group" aria-label="V67 定计目及大参将真实计算">
        <h3>定计 · 六合旋盘与逐宫求算</h3>
        <p>岁支 <strong>{chart.dingji_v67.year_branch}</strong>，
          六合神 <strong>{chart.dingji_v67.harmony_branch}</strong>
          加岁支；文昌在天盘 {chart.dingji_v67.wenchang_sky_direction}，
          下临地盘 <strong>{chart.dingji_v67.dingji_ground_direction}
          · {chart.dingji_v67.dingji_ground_god}</strong>，即定计目。</p>
        <div className="taiyi-v67-totals">
          {chart.dingji_v67.status==='computed'?<>
            <span><small>定计得算</small><strong>{chart.dingji_v67.count}</strong></span>
            <span><small>定计大将</small><strong>{chart.dingji_v67.main_general} 宫</strong></span>
            <span><small>定计参将</small><strong>{chart.dingji_v67.assistant_general} 宫</strong></span>
          </>:<p>定计待校勘：{chart.dingji_v67.reason||
              '该定计目与太乙同宫，保守口径不擅自给出算数。'}</p>}
        </div>
        {chart.dingji_v67.status==='computed'&&<div role="group"
            aria-label="定计逐宫加算明细" className="taiyi-v67-steps">
          {chart.dingji_v67.trace.map((x,i)=><span key={i}
            className={x.added>0?'counted':''}>
            {x.direction} {x.god} +{x.added}
          </span>)}
        </div>}
        <details className="taiyi-v67-rotated">
          <summary>查看十六神天地盘旋转的完整依据</summary>
          <div role="group" aria-label="定计十六神旋盘证据">
            {chart.dingji_v67.rotated_sixteen.map((x,i)=><span key={i}>
              地{x.ground} / 天{x.heaven}
              {x.is_year_ground?' · 太岁':''}
              {x.is_dingji_eye?' · 定计目':''}
            </span>)}
          </div>
        </details>
        <p>当前同宫口径：{chart.dingji_v67.rule==='conservative'?
          '谨慎待算（不强断）':'《武备志》遇同宫取本宫宫数'}。
          非同宫课沿用逐宫累算，完整路径由后端记录。</p>
        <a href={chart.dingji_v67.sources.annual_dingji}
           target="_blank" rel="noopener noreferrer">查看《太乙指津》定计原典</a>
      </section>}
      {chart.middle_five_states&&<section className="taiyi-v67-middle"
          role="group" aria-label="V67 中五将不出及太乙不入中宫">
        <h3>中五宫 · 大参将的特殊落位</h3>
        <p>太乙本体不进入中五，但主客、定计大将或参将算得五时仍可落中五，
          不会私自移往八宫。</p>
        {chart.middle_five_states.case_count>0?
          <div className="taiyi-v67-middle-items">
            {chart.middle_five_states.cases.map((x,i)=><span key={i}>
              {x.side} {x.kind}：中五不出
            </span>)}
          </div>:<p>本年没有计算值落中五的主客或定计大参将。</p>}
        <p>“中五不出”是古籍排盘中的术语，不代表现实情况的预测。</p>
      </section>}
      <p className="academy-caution">V67 为古典岁计结构推演，不包含月计、日计、时计或现代事件预测。
        不同太乙历元传承不能混用；同宫主客异派口径并列，不将未核准的主客将数字充当默认排盘结论。</p>
      <a href={chart.sources.historical_1624} target="_blank" rel="noopener noreferrer">
        《古今图书集成》1624 年原始年局案例</a>
      <span className="taiyi-v64-source-sep"> · </span>
      <a href={chart.sources.historical_1561} target="_blank" rel="noopener noreferrer">
        《太乙金钥匙》1561 年年局案例</a>
    </div>}
  </section>
}
