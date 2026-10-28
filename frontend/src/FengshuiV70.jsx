import {useState} from 'react'
import './fengshui-v70.css'

export default function FengshuiV70(){
  const [bearing,setBearing]=useState('0')
  const [role,setRole]=useState('facing')
  const [north,setNorth]=useState('true_north')
  const [declination,setDeclination]=useState('')
  const [chart,setChart]=useState(null)
  const [selectedMountain,setSelectedMountain]=useState(null)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  async function calculate(event){
    event.preventDefault()
    setError('');setChart(null);setSelectedMountain(null)
    const angle=Number(bearing)
    if(bearing.trim()===''||!Number.isFinite(angle)||angle<0||angle>360){
      setError('方位角只能填写 0°～360° 的有限数字。')
      return
    }
    const input={bearing_degrees:angle,bearing_role:role,north_reference:north}
    if(north==='magnetic_north'){
      if(declination.trim()===''||!Number.isFinite(Number(declination))||
        Number(declination)<-180||Number(declination)>180){
        setError('磁北模式必须输入已核实的磁偏角：东偏为正、西偏为负。')
        return
      }
      input.magnetic_declination_degrees=Number(declination)
    }
    setBusy(true)
    try{
      const response=await fetch('/api/fengshui/cast',{method:'POST',
        headers:{'Content-Type':'application/json'},body:JSON.stringify(input)})
      const result=await response.json()
      if(!response.ok)throw new Error(typeof result.detail==='string'?
        result.detail:'参数未通过方位计算校验。')
      setChart(result)
      setSelectedMountain(result.facing.mountain)
    }catch(e){setError(e?.message||'二十四山计算失败，请核对输入。')}
    finally{setBusy(false)}
  }
  const picked=chart?.twenty_four_mountains?.find(x=>x.mountain===selectedMountain)
  return <section className="fengshui-v70" aria-label="V70 堪舆二十四山真实计算">
    <header>
      <small>V70 · 堪舆风水 / 二十四山坐向计算</small>
      <h2>定针观方位 · 二十四山与九宫</h2>
      <p>按罗盘角度实际换算坐向、二十四山和后天八卦九宫。输入方位角从正北
        顺时针测量，0°为北、90°为东、180°为南、270°为西。
        只做明确的几何换算，不声称已经实地测定房屋坐向。</p>
    </header>
    <form onSubmit={calculate} className="fengshui-v70-form">
      <label>量得方位角（0°～360°）
        <input type="number" aria-label="堪舆方位角" min="0" max="360"
          step="any" required value={bearing} onChange={e=>setBearing(e.target.value)}/>
      </label>
      <label>当前输入的方向
        <select aria-label="堪舆输入坐向" value={role}
          onChange={e=>{setRole(e.target.value);setChart(null)}}>
          <option value="facing">朝向（向）</option>
          <option value="sitting">坐向（坐）</option>
        </select>
      </label>
      <label>角度参考基准
        <select aria-label="堪舆北向基准" value={north}
          onChange={e=>{setNorth(e.target.value);setChart(null)}}>
          <option value="true_north">真北（已经校正）</option>
          <option value="magnetic_north">磁北（需自行提供磁偏角）</option>
        </select>
      </label>
      {north==='magnetic_north'&&<label>当地磁偏角（东偏正，西偏负）
        <input type="number" aria-label="堪舆磁偏角" min="-180" max="180"
          step="any" required value={declination}
          onChange={e=>setDeclination(e.target.value)}
          placeholder="例如：+5 或 -6"/>
        <small>网站不自动查询磁偏角。请确认测量地点和日期后填写。</small>
      </label>}
      <button type="submit" disabled={busy}>{busy?'正在计算…':'计算二十四山坐向'}</button>
    </form>
    {error&&<p className="fengshui-v70-error" role="alert">{error}</p>}
    {chart&&<div className="fengshui-v70-result">
      <section className="fengshui-v70-summary" aria-label="堪舆计算结果">
        <small>当前坐向 · {chart.version}</small>
        <h3>{chart.axis_label}</h3>
        <div className="fengshui-v70-axis">
          <article>
            <span>坐山 · {chart.sitting.degrees}°</span>
            <strong>{chart.sitting.mountain}山 · {chart.sitting.trigram}{chart.sitting.palace_number}宫</strong>
            <small>{chart.sitting.direction} · {chart.sitting.element}</small>
          </article>
          <article>
            <span>朝向 · {chart.facing.degrees}°</span>
            <strong>{chart.facing.mountain}向 · {chart.facing.trigram}{chart.facing.palace_number}宫</strong>
            <small>{chart.facing.direction} · {chart.facing.element}</small>
          </article>
        </div>
        <p>输入 {chart.input.bearing_degrees}°（{chart.input.bearing_role==='facing'?'朝向':'坐山'}）；
          {chart.input.north_reference==='true_north'?'真北角度':'磁北角度（手输磁偏角 '+chart.input.magnetic_declination_degrees+'°）'}；
          换算真北角 {chart.true_bearing_degrees}°。</p>
        {chart.near_boundary&&<p className="fengshui-v70-warning" role="status">
          <strong>临近二十四山界</strong>：当前只按区间暂归本山，请复测，不得当作确定立向。
        </p>}
      </section>
      <h3>后天九宫坐向定位</h3>
      <div className="fengshui-v70-palace-grid" role="group"
        aria-label="V70 堪舆后天九宫">
        {chart.nine_palaces.map(p=><article key={p.number}
          className={['fengshui-v70-cell',p.is_sitting?'sitting':'',
            p.is_facing?'facing':'',p.is_center?'center':''].filter(Boolean).join(' ')}>
          <small>{p.direction}</small>
          <strong>{p.trigram}{p.number}宫</strong>
          <span>{p.mountains?.join(' · ')||'中宫'}</span>
          <b>{p.is_sitting?'坐山所在宫':p.is_facing?'朝向所在宫':p.is_center?'中五无山':''}</b>
        </article>)}
      </div>
      <p className="fengshui-v70-note">九宫排法：上南下北、左东右西；中宫五不对应二十四山。
        此盘是后天固定方位图，不是飞星盘。</p>
      <h3>二十四山 · 各山中心与区间</h3>
      <div className="fengshui-v70-mountains" role="group" aria-label="V70 二十四山逐山核对">
        {chart.twenty_four_mountains.map(m=><button key={m.mountain} type="button"
          className={[selectedMountain===m.mountain?'selected':'',
            chart.facing.mountain===m.mountain?'facing':'',
            chart.sitting.mountain===m.mountain?'sitting':''].join(' ')}
          onClick={()=>setSelectedMountain(m.mountain)}
          aria-pressed={selectedMountain===m.mountain}>
          <strong>{m.mountain}</strong><small>{m.center_degrees}°</small>
        </button>)}
      </div>
      {picked&&<section className="fengshui-v70-picked" aria-label="当前选中二十四山">
        <h3>{picked.mountain}山 · {picked.trigram}{picked.palace_number}宫</h3>
        <p>中心 {picked.center_degrees}° · 起点 {picked.start_degrees}°
          · 终点 {picked.end_degrees}°（跨零度时以环形区间理解）。</p>
        <p>对向：{picked.opposite_mountain} · {picked.direction}
          · 五行{picked.element}。本区间起点归本山，终点归下一山。</p>
      </section>}
      <section className="fengshui-v70-rules" aria-label="堪舆计算约定与局限">
        <h3>计算口径与未实现项目</h3>
        <p>{chart.compass_convention.mountain_intervals}；
          {chart.compass_convention.magnetic_declination}。</p>
        {chart.warnings.map((w,i)=><p key={i} className="fengshui-v70-warning">{w}</p>)}
        <p>暂未实现：{chart.not_implemented.join('、')}。</p>
        <a href={chart.sources.mountain_chart} target="_blank" rel="noopener noreferrer">
          查阅二十四山角度对照资料 ↗
        </a>
      </section>
    </div>}
  </section>
}
