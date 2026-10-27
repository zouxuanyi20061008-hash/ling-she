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
