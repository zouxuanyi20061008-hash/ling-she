import './sixyao-joint-overview.css'

const POS=['初','二','三','四','五','上']
const STATUS={focus_not_selected:'尚未选取关注对象',hidden_focus:'所选六亲本卦不现',
 calendar_incomplete:'日月资料待核对',waiting_user_choice:'同类多现 · 请人工选择',
 structured_review_ready:'已整理合参资料 · 效力待核'}

function EvidenceDetails({row}){
  return <div className="six-joint-details">
    <div className="six-joint-evidence-row">
      <section><h5>生扶线索（非旺衰评分）</h5>
        {row.supporting.length?row.supporting.map((v,i)=>
          <p key={i}><b>{v.title}</b>：{v.detail}</p>):<p>暂无已确认的生扶标记</p>}
      </section>
      <section><h5>克制或限制条件</h5>
        {row.restraining.length?row.restraining.map((v,i)=>
          <p key={i}><b>{v.title}</b>：{v.detail}</p>):<p>暂无已确认的制约标记</p>}
      </section>
    </div>
    {row.incoming_movers.length>0&&<section><h5>其他本卦明动爻对本爻</h5>
      {row.incoming_movers.map(e=><p key={e.from_position}>
        {POS[e.from_position-1]}爻 {e.from_ganzhi} → {e.relation}
        {e.clash?' · 支冲':''}{e.combine?' · 六合':''}（仅关系成立，实效未决）
      </p>)}
    </section>}
    {row.moving&&<section><h5>本位动变（非跨位变爻）</h5>
      <p><b>化进退核查：</b>{row.self_change.progression_label||'待核'}
        {row.self_change.progression_source_status==='variant_edition'?' · 古籍版本差异':''}
        。只表示同位地支的进退转换，不能独立判断旺衰。
      </p>
      {row.self_change.progression_cautions?.map((x,i)=><p key={i}>· {x}</p>)}
      <p>{row.ganzhi} → {row.self_change.ganzhi}：
        {row.self_change.returning_term||'静态位置对照'}
        {row.self_change.returning_clash?' · 回头冲':''}
        {row.self_change.returning_combine?' · 回头合':''}；
        {row.self_change.transformed_void===true?'动化空条件':
          row.self_change.transformed_void===false?'变爻不逢空':'化空未核'}
      </p>
    </section>}
    {row.hidden_relatives.length>0&&<section><h5>本宫伏神 · 飞伏关系</h5>
      {row.hidden_relatives.map((f,i)=><p key={i}>{f.liuqin} {f.ganzhi} 伏于本爻：
        {f.relation}（是否可用仍待合参）</p>)}
    </section>}
    {row.cross_checks.length>0&&<section><h5>交叉核查</h5>
      {row.cross_checks.map((t,i)=><p key={i}>· {t}</p>)}
    </section>}
    {row.pending.length>0&&<section><h5>缺少输入</h5>
      {row.pending.map((t,i)=><p key={i}>· {t}</p>)}
    </section>}
  </div>
}

export default function SixYaoJointOverview({chart,onChooseFocus,onChoosePosition,busy=false}){
  const data=chart?.joint_overview
  if(!data||!Array.isArray(data.rows)||data.rows.length!==6)
    return <p className="six-joint-missing">合参证据尚未生成。请重新排盘并检查网络。</p>
  const lines=[...data.rows].reverse()
  const focusPositions=new Set(data.focus_positions||[])
  const hasFocus=Boolean(data.focus_category)
  return <section className="six-joint" aria-label="六爻用神与旺衰动变合参总览">
    <header className="six-joint-head">
      <div><small>六爻核心研判 · 结构化证据</small>
        <h3>先选关注对象，再核日月、动变、空破</h3></div>
      <span className="six-joint-status">{STATUS[data.status]||'待人工核对'}</span>
    </header>
    <div className="six-joint-date" role="status">
      <span><b>日辰：</b>{data.calendar.day_ganzhi||'未输入'}</span>
      <span><b>节令月：</b>{data.calendar.month_branch||'未输入'}</span>
      <span>{data.calendar.server_recomputed?'服务器历法库复算（边界需核）':
        '历法参数未经真实日期复核'}</span>
      {data.calendar.day_confirmed&&data.calendar.month_confirmed?
        <span>日月已填写 · 请再核换日与交节</span>:
        <span className="six-joint-alert">未完整输入日月，部分指标保持“未核”</span>}
    </div>
    <p className="six-joint-instruction">先选择所问事项对应的六亲或世应，再查看其本卦候选。<strong>本系统不会自动决定哪个用神有效。</strong></p>
    <div className="six-joint-choices" role="group" aria-label="选择六爻关注对象">
      {data.focus_choices.map(choice=><button type="button" key={choice.id}
        onClick={()=>onChooseFocus?.(choice.id)} disabled={busy}
        aria-pressed={data.focus_category===choice.id}
        title={choice.themes}>{choice.id}</button>)}
    </div>
    {hasFocus&&<div className="six-joint-focus">
      <h4>当前关注：{data.focus_category}</h4>
      {data.focus_positions.length>0?<div className="six-joint-pos-buttons">
        {data.focus_positions.map(p=><button type="button" key={p}
          disabled={busy}
          aria-pressed={data.selected_position===p}
          onClick={()=>onChoosePosition?.(p)}>
          {POS[p-1]}爻 {data.rows[p-1].ganzhi}
          {data.selected_position===p?' · 已由你选择': ' · 作为研习主爻'}
        </button>)}
        {data.requires_user_choice&&<p>同一类象有多处候选；请结合事情背景比较，不按动静或支持标记条数自动排名。</p>}
      </div>:<div className="six-joint-hidden">
        <p>本卦没有明现的 {data.focus_category}，不可伪造主爻。以下是本宫首卦同位安伏的参考位置：</p>
        {data.hidden_focus.map((item,i)=><p key={i}>
          {POS[item.position-1]}爻：{item.hidden_liuqin} {item.hidden_ganzhi}
          伏在 {item.flying_liuqin} {item.flying_ganzhi} 下 · {item.relation}
        </p>)}
        <p>飞伏位置可由装卦计算，是否适用仍需判断日月与具体所问之事。</p>
      </div>}
    </div>}
    <div className="six-joint-scroll" role="region" tabIndex={0}
      aria-label="六爻综合证据盘，手机可左右滚动">
      <table>
        <thead><tr><th>本爻</th><th>日辰生克冲合</th><th>月建生克冲合</th>
          <th>旬空 / 月破</th><th>本卦明动</th><th>生扶与制约</th><th>核查详情</th></tr></thead>
        <tbody>{lines.map(row=><tr key={row.position}
          className={(focusPositions.has(row.position)?'six-joint-focus-row ':'')+
            (row.selected_by_user?'six-joint-selected':'')}>
          <th scope="row">{POS[row.position-1]}爻 {row.ganzhi}
            <small>{row.liuqin} {row.role||''}</small></th>
          <td>{row.day.known?<>{row.day.relation}
            {row.day.clash?' · 日冲':''}
            {row.day.combine?' · 日合':''}</>:'日辰未核'}</td>
          <td>{row.month.known?<>{row.month.relation}
            {row.month.clash?' · 月冲':''}
            {row.month.combine?' · 月合':''}
            {row.season?' · '+row.season:''}</>:'节令月未核'}</td>
          <td>{row.original_void===null?'旬空未核':row.original_void?'本爻旬空':'不旬空'} ·
            {row.month_break===null?'月破未核':row.month_break?'逢月冲':'无月冲'}</td>
          <td>{row.moving?'本爻明动':'本爻安静'}
            {row.moving&&row.self_change.returning_term?
              ' · '+row.self_change.returning_term:''}
            {row.moving&&row.self_change.progression_kind!=='neither'?
              ' · '+row.self_change.progression_label:''}
            {row.incoming_movers.length?' · '+row.incoming_movers.length+'处明动作用来源':''}
          </td>
          <td>{row.has_opposing_indicators?'生扶与制约并见':
            row.supporting.length?'有生扶线索':
            row.restraining.length?'有限制条件':'暂无明确生克线索'}</td>
          <td><details><summary>逐项查看</summary><EvidenceDetails row={row}/></details></td>
        </tr>)}</tbody>
      </table>
    </div>
    <p className="six-joint-boundary">{data.boundary}
      这些栏目不代表完整旺衰、真假空或真实应期已经得出，也不因两个来源相反就将其计数抵消。</p>
  </section>
}
