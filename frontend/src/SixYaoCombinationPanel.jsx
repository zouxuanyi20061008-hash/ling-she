import './sixyao-combinations.css'

const POS=['初','二','三','四','五','上']
function PositionList({positions=[]}){return <>{positions.map(n=>POS[n-1]+'爻').join('、')||'无'}</>}
function TriadRow({entry,type}){
  return <li>
    <b>{entry.element}局（{entry.branches.join('·')}）</b>
    {' · '}
    {type==='original'?<>本卦 <PositionList positions={entry.positions}/>，
      明动 <PositionList positions={entry.moving_positions}/></>:
    <>内外卦双动 <PositionList positions={entry.positions}/>，
      本位第{entry.changed_position}爻化出 {entry.changed_branch}</>}
    <small>{type==='original'&&entry.kind==='static_three_branches'?
      '三支俱见但全静：不能据此断已经成局':
      '三支组合候选：是否真正成局尚待结合日月空破判断'}</small>
    {entry.calendar_warnings?.length>0&&
      <small>待核：{entry.calendar_warnings.join('；')}</small>}
  </li>
}
export default function SixYaoCombinationPanel({chart}){
  const data=chart?.hexagram_combinations
  if(!data)return <p className="six-combo-unavailable">三合六合结构尚未生成，请检查排盘数据。</p>
  return <section className="six-combo" aria-label="六爻六合六冲与三合局分析">
    <header><div>
      <small>六爻核心排盘 · V39 卦类与三合</small>
      <h3>六合、六冲与三合候选</h3>
    </div><a href={data.reference} target="_blank" rel="noopener noreferrer">
      参考《增删卜易》六合章 ↗
    </a></header>
    <div className="six-combo-types">
      <article>
        <span>本卦 · {data.ben.name}</span><strong>{data.ben.label}</strong>
        <small>三对上下爻位的地支结构</small>
      </article>
      <article>
        <span>之卦 · {data.bian.name}</span><strong>{data.bian.label}</strong>
        <small>变卦结构仅作参照，不让静爻冒作发动</small>
      </article>
    </div>
    <p className="six-combo-pair-explainer">本卦三对支：{data.ben.pair_evidence.map(item=>
      <span key={item.positions.join('-')}>{item.positions.join('、')}爻：
        {item.branches.join('—')}
        {item.is_six_he?'（合）':item.is_six_chong?'（冲）':'（其他）'}</span>)}
    </p>
    {chart.sanhe_focus_review&&<div className="six-combo-focus-review"
      aria-label="三合局与用神日月合参">
      <h4>V40 · 三合局与用神、日月合参</h4>
      <p>{chart.sanhe_focus_review.status==='no_focus'?
        '还没有选择用神。请在下方合参总览选择六亲或世应，再来核对三合关系。':
        chart.sanhe_focus_review.status==='hidden_focus'?
        '当前关注的六亲在本卦不现，先核飞伏与日月，不把三合局直接当成可用用神。':
        '当前关注：'+chart.sanhe_focus_review.focus_category+'，候选爻位 '+
        chart.sanhe_focus_review.focus_positions.join('、')+
        '。下面仅按每处本卦候选分别核对，不自动择优。'}</p>
      {chart.sanhe_focus_review.rows.length>0?<details>
        <summary>展开三合局与用神的逐组核查（{chart.sanhe_focus_review.rows.length} 组）</summary>
        <div className="six-combo-focus-list">
          {chart.sanhe_focus_review.rows.map(item=><article key={item.candidate_key}>
            <strong>{item.source_label} · {item.element}局 · {item.branches.join('·')}</strong>
            <p>涉及：<PositionList positions={item.positions}/>
              {item.missing_branch?'，尚缺 '+item.missing_branch:''}
              {item.selected_position_is_member===true?' · 包含你选择的研习主爻':
                item.selected_position_is_member===false?' · 未包含你选择的研习主爻':''}</p>
            {item.focus_members.length>0?item.focus_members.map(f=><p key={f.position}>
              {f.position}爻 {f.ganzhi}（{f.liuqin}{f.role?' · '+f.role:''}）：
              {f.five_element_relation} · {f.is_pattern_member?'位于当前组合':'不在当前组合'}
              {f.is_selected_by_user?' · 用户选定':''}
            </p>):<p>没有明现用神，需先核飞伏。</p>}
            <p>日辰：{item.season.day_known?
              (item.season.day_branch_in_pattern?'日支见组合支 · ':'日支不在组合支 · ')+
              item.season.day_element_relation:'尚未核实'}；
              月建：{item.season.month_known?
                (item.season.month_branch_in_pattern?'月支见组合支 · ':'月支不在组合支 · ')+
                item.season.month_element_relation:'尚未核实'}</p>
            {item.season.original_void_positions?.length>0&&<p>
              旬空涉及：<PositionList positions={item.season.original_void_positions}/>
            </p>}
            {item.season.original_month_clash_positions?.length>0&&<p>
              月冲涉及：<PositionList positions={item.season.original_month_clash_positions}/>
            </p>}
            <small>本处关系可核算；是否真正合局、合化后是否作用于用神、旺衰及应期均未判定。</small>
          </article>)}
        </div>
      </details>:<p>当前盘未识别三合候选，不代表吉凶结论。</p>}
    </div>}
    <div className="six-combo-stats" aria-label="三合候选数量">
      <div><b>{data.counts.visible}</b><span>原卦三支俱见</span></div>
      <div><b>{data.counts.mixed}</b><span>初三／四六动变候选</span></div>
      <div><b>{data.counts.waiting}</b><span>虚三待用</span></div>
    </div>
    {data.counts.visible+data.counts.mixed+data.counts.waiting?
      <div className="six-combo-groups">
        {data.original_triad_candidates.length>0&&<details>
          <summary>原卦三支俱见 · {data.original_triad_candidates.length} 组</summary>
          <ul>{data.original_triad_candidates.map((e,i)=>
            <TriadRow entry={e} type="original" key={'a'+i}/>)}</ul>
        </details>}
        {data.moving_transformed_candidates.length>0&&<details>
          <summary>本位动变凑齐三支 · {data.moving_transformed_candidates.length} 组</summary>
          <ul>{data.moving_transformed_candidates.map((e,i)=>
            <TriadRow entry={e} type="mixed" key={'b'+i}/>)}</ul>
        </details>}
        {data.missing_branch_candidates.length>0&&<details>
          <summary>虚三待用：两动尚缺一支 · {data.missing_branch_candidates.length} 组</summary>
          <ul>{data.missing_branch_candidates.map((e,i)=><li key={'c'+i}>
            <b>{e.element}局</b>，<PositionList positions={e.positions}/>明动，
            已见 {e.present_branches.join('、')}，尚缺 {e.missing_branch}。
            <small>仅提示缺支，不推测什么时候补齐。</small>
          </li>)}</ul>
        </details>}
      </div>:
      <p className="six-combo-none">当前盘面未检出本模块定义的三合候选。没有候选不等于吉凶判断。</p>}
    <p className="six-combo-warning">{data.scope} 卦类六合不等于单独的动爻六合；三合候选也不代表实际合化、旺衰、应期已确定。</p>
  </section>
}
