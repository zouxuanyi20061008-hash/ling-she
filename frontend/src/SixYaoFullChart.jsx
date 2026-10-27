import './sixyao-fullchart.css'

const POS=['初','二','三','四','五','上']
const NAMES={6:'老阴 · 动',7:'少阳 · 静',8:'少阴 · 静',9:'老阳 · 动'}

function Stroke({bit,moving}){
  return <span className={'six-full-stroke '+(moving?'is-moving':'')}
    aria-label={bit?'阳爻':'阴爻'}>{bit?<i/>:<><i/><i/></>}</span>
}

export default function SixYaoFullChart({chart}){
  const ben=chart?.najia_lines
  const bian=chart?.bian_najia_lines
  const palace=chart?.eight_palaces?.ben
  if(!Array.isArray(ben)||ben.length!==6||!Array.isArray(bian)||bian.length!==6||!palace){
    return <p className="six-full-missing" role="status">完整纳甲盘面未能读取，无法显示六爻装卦表。请检查服务器返回的排盘数据。</p>
  }
  const day=chart.calendar?.day
  const month=chart.calendar?.month
  const proven=chart.calendar_provenance?.source==='server_recomputed_calendar'
  const changed=chart.dong_yao||[]
  const progresses=chart.progression_review?.rows||[]
  return <section className="six-full-chart" aria-label="六爻完整装卦总览">
    <header className="six-full-head">
      <div><small>六爻排盘 · 一页看全盘</small><h3>本卦、之卦与六亲纳甲总览</h3></div>
      <span className="six-full-seal">{palace.palace}宫 · {palace.stage}</span>
    </header>
    <div className="six-full-summary">
      <div><small>本卦</small><strong>{chart.ben_gua?.full_name||chart.ben_gua?.name||'待核'}</strong></div>
      <div><small>之卦</small><strong>{chart.bian_gua?.full_name||chart.bian_gua?.name||'待核'}</strong></div>
      <div><small>世 / 应</small><strong>{POS[palace.shi_position-1]}爻 / {POS[palace.ying_position-1]}爻</strong></div>
      <div><small>动爻</small><strong>{changed.length?changed.map(p=>POS[p-1]+'爻').join('、'):'无动爻'}</strong></div>
    </div>
    <div className="six-full-calendar" role="status">
      <span><b>日辰：</b>{day?.ganzhi||'未提供'}</span>
      <span><b>节令月建：</b>{month?.branch?month.branch+'月':'未提供'}</span>
      <span><b>旬空：</b>{day?.xunkong?.join('、')||'须先核实日辰'}</span>
      <span><b>日月来源：</b>{proven?'服务器中国历法库重算，边界仍需核对':day||month?'手动录入，未自动核对':'未核对'}</span>
    </div>
    <p className="six-full-scrollhint">完整装卦表 · 从上爻到初爻显示；手机可左右滚动查看全部字段。</p>
    <div className="six-full-scroll" role="region" tabIndex={0} aria-label="六爻纳甲全表，横向滚动查看">
      <table>
        <thead><tr>
          <th scope="col">爻位</th><th scope="col">六神</th>
          <th scope="col">本卦爻象</th><th scope="col">六亲</th>
          <th scope="col">纳甲干支 · 五行</th><th scope="col">世应</th>
          <th scope="col">变爻纳甲 · 六亲</th><th scope="col">动化进退</th><th scope="col">空破与月建</th>
        </tr></thead>
        <tbody>{[5,4,3,2,1,0].map(i=>{
          const row=ben[i],other=bian[i],number=chart.lines?.[i]?.number
          const progress=progresses[i]
          const moving=changed.includes(i+1)
          const flags=[]
          if(day&&row.is_xunkong===true)flags.push('旬空')
          if(month&&row.is_yuechong===true)flags.push('月冲')
          if(month&&row.is_yuejian===true)flags.push('临月建')
          if(month&&row.month_relation)flags.push(row.month_relation)
          return <tr key={i+1} className={moving?'six-full-moving':''}>
            <th scope="row">{POS[i]}爻 {moving&&<small>动</small>}</th>
            <td>{row.liushen||'日辰未核'}</td>
            <td><Stroke bit={chart.ben_gua?.lines_bottom_to_top?.[i]} moving={moving}/>
              <small>{NAMES[number]||'爻态待核'}</small></td>
            <td><strong>{row.liuqin||'—'}</strong></td>
            <td>{row.ganzhi||'—'} · {row.element||'—'}</td>
            <td>{row.role||'—'}</td>
            <td>{moving?<><strong>{other.ganzhi||'—'}</strong> · {other.liuqin||'—'}
              <small>本位动变</small></>:<span>{other.ganzhi||'—'}<small>静爻对照</small></span>}</td>
            <td>{moving?(progress?.label||'进退神待核'):'静爻不论化进退'}
              {progress?.source_status==='variant_edition'&&<small>古籍版本差异</small>}</td>
            <td>{flags.length?flags.join(' · '):day||month?'当前没有已列特殊标记':'待核日辰与月建'}</td>
          </tr>
        })}</tbody>
      </table>
    </div>
    {chart.progression_review&&<p className="six-full-progressions">
      动爻进退：化进 {chart.progression_review.primary_advances.length} 爻、
      化退 {chart.progression_review.primary_retreats.length} 爻；
      {chart.progression_review.edition_variants.length?
        '另有 '+chart.progression_review.edition_variants.length+' 处古籍异本组合需校勘。':
        '未见异本补列组合。'}
      <a href={chart.progression_review.source} target="_blank" rel="noopener noreferrer">查阅《增删卜易》进退神章 ↗</a>
    </p>}
    <p className="six-full-caution">此处先完整呈现计算结果。六神、旬空依已输入的日辰推导，月建关系依节令月支推导；若日月未核对，对应项目明确留空。纳甲、世应和五行关系本身不等于已完成用神取舍、旺衰及应期判断。</p>
  </section>
}
