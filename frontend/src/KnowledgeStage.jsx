import {useState} from 'react'
import {ARTS} from './ArtsHub.jsx'
import './academy.css'

const PALACES=[
  {n:4,name:'巽',dir:'东南',desc:'风行而入，往来与逐渐渗透'},
  {n:9,name:'离',dir:'南',desc:'火与明亮，消息与辨识'},
  {n:2,name:'坤',dir:'西南',desc:'大地承载、合作与基础'},
  {n:3,name:'震',dir:'东',desc:'震动、行动与变化'},
  {n:5,name:'中',dir:'中央',desc:'中宫，九宫之枢纽'},
  {n:7,name:'兑',dir:'西',desc:'言语、喜悦与交往'},
  {n:8,name:'艮',dir:'东北',desc:'停顿、边界与门户'},
  {n:1,name:'坎',dir:'北',desc:'流动、险与审慎'},
  {n:6,name:'乾',dir:'西北',desc:'刚健、秩序与担当'}
]
const DOORS=[
  ['休门','休养、停息'],['生门','生发、经营'],['伤门','损伤、冲突'],
  ['杜门','阻隔、隐藏'],['景门','光明、文采'],['死门','停止、终了'],
  ['惊门','惊扰、消息'],['开门','开启、通达']
]
const STEMS=[['甲','木'],['乙','木'],['丙','火'],['丁','火'],['戊','土'],['己','土'],['庚','金'],['辛','金'],['壬','水'],['癸','水']]
const BRANCHES=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']
const PILLARS=['年柱','月柱','日柱','时柱']
export default function KnowledgeStage({mode,onBack,onStudy}) {
  const art=ARTS.find(a=>a.id===mode)||ARTS[2]
  const isQimen=mode==='qimen',isBazi=mode==='bazi'
  const [palaceNum,setPalaceNum]=useState(4)
  const [door,setDoor]=useState(0)
  const [qimenDate,setQimenDate]=useState(()=>
    new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date()))
  const [qimenClock,setQimenClock]=useState(()=>
    new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',
      hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date()))
  const [qimenBoundary,setQimenBoundary]=useState('zi_hour')
  const [qimenChart,setQimenChart]=useState(null)
  const [qimenBusy,setQimenBusy]=useState(false)
  const [qimenError,setQimenError]=useState('')
  async function castActualQimen(event){
    event.preventDefault()
    if(!qimenDate||!qimenClock)return
    setQimenBusy(true)
    setQimenError('')
    setQimenChart(null)
    try{
      const response=await fetch('/api/qimen/cast',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({solar_date:qimenDate,clock:qimenClock,day_boundary:qimenBoundary})
      })
      const body=await response.json()
      if(!response.ok)throw new Error(typeof body.detail==='string'?body.detail:'请核实日期与时辰')
      setQimenChart(body)
    }catch(error){
      setQimenError(error.message||'奇门定局失败，请核实输入')
    }finally{setQimenBusy(false)}
  }
  const [stem,setStem]=useState([0,0,0,0])
  const [branch,setBranch]=useState([0,0,0,0])
  const [activePillar,setActivePillar]=useState(0)
  const palace=PALACES.find(a=>a.n===palaceNum)
  return <main className={"academy-stage academy-stage--"+mode+" academy-knowledge-mode"}>
    <div className="academy-container">
      <header className="academy-stage-nav"><button onClick={onBack}>← 返回万象书院</button><b>{art.group} · {art.name}</b><button onClick={onStudy}>藏经阁 ◎</button></header>
      <section className="academy-stage-banner"><div>
        <small className="method-theme-identity">{({qimen:"玄夜九宫 · 星轨阵图",bazi:"赤金四柱 · 干支命简",liuren:"沧海六壬 · 天地盘式",taiyi:"青穹太乙 · 九宫行数",ziwei:"紫夜星垣 · 十二宫曜",fengshui:"苍山堪舆 · 山水形势"})[mode]}</small>
        <p>{isQimen?'时家奇门 · 先算十八局与地盘':isBazi?'干支四柱 · 入门认识命盘':'古典文献 · 入门导览'}</p>
        <h1>{art.title}</h1><span>{art.brief}　{art.detail}。<br/>{isQimen?'V53 已补81组十干克应、三遁复合格局和注明流派的暗干飞宫试算；完整断课仍待校勘。':isBazi?'这里是互动教学演示，不会伪装成真实完整排盘。':'本门目前提供学馆入口，待逐条核实古籍规则后再补排盘。'}</span>
      </div><div className="academy-stage-glyph">{art.symbol}</div></section>
      <div className="academy-knowledge-status"><span>本门研习方式</span><b>{isQimen?'V53 十干克应 · 暗干参考盘':isBazi?'四柱命简 · 干支辨识':mode==='fengshui'?'山水堪舆 · 空间观察':'古籍导览 · 按章研习'}</b><small>{isQimen?'81组天地干对照 · 三遁复合条件 · 暗干标明流派':isBazi?'互动结构教学 · 不冒充完整实盘':'独立主题 · 后续按本门术法逐步完善'}</small></div>
      {isQimen&&<section className="qimen-v50">
        <header><small>V53 · 时家奇门 / 拆补法</small><h2>北京时间定局 · 九宫星门转盘</h2>
          <p>九宫四层继续保留，新增十干克应、三遁复合条件；暗干是单独注明流派的飞宫试算，不与实际天盘干混淆。</p>
        </header>
        <form onSubmit={castActualQimen} className="qimen-v50-form">
          <label>公历日期（中国时间）
            <input aria-label="奇门公历日期" type="date" value={qimenDate}
              onChange={e=>setQimenDate(e.target.value)} required min="1901-01-01" max="2099-12-31"/>
          </label>
          <label>北京时间
            <input aria-label="奇门北京时间" type="time" value={qimenClock}
              onChange={e=>setQimenClock(e.target.value)} required/>
          </label>
          <label>换日约定
            <select aria-label="奇门换日规则" value={qimenBoundary}
              onChange={e=>setQimenBoundary(e.target.value)}>
              <option value="zi_hour">子初 23:00 换日</option>
              <option value="midnight">午夜 00:00 换日</option>
            </select>
          </label>
          <button type="submit" disabled={qimenBusy}>{qimenBusy?'正在计算…':'按所选时间起局'}</button>
        </form>
        {qimenError&&<p role="alert" className="academy-caution">{qimenError}</p>}
        {qimenChart&&<div className="qimen-v50-result">
          <div className="qimen-v50-summary">
            <strong>{qimenChart.ju_label} · {qimenChart.yuan}</strong>
            <span>节气：{qimenChart.solar_term} · 日柱 {qimenChart.day_ganzhi} · 时柱 {qimenChart.hour_ganzhi}</span>
            <span>五日符头 {qimenChart.day_fu_tou} · 旬首 {qimenChart.duty_origin.time_xun}
              （遁{qimenChart.duty_origin.concealed_stem}）</span>
            <span>值符原始本宫：{qimenChart.duty_origin.origin_star} ·
              {qimenChart.duty_origin.earth_origin_palace}宫；
              值使本宫：{qimenChart.duty_origin.origin_door}</span>
            {qimenChart.has_rotated_stars_and_gates&&<>
              <span>{`值符${qimenChart.duty_origin.origin_star}：原${qimenChart.duty_origin.earth_origin_palace}宫 → ${qimenChart.duty_origin.rotated_star_palace}宫`}
                {qimenChart.duty_origin.rotated_star_palace!==qimenChart.duty_origin.rotated_star_display_palace?
                  '（寄坤二展示）':''}</span>
              <span>{`值使${qimenChart.duty_origin.origin_door}：原${qimenChart.duty_origin.earth_origin_palace}宫 → ${qimenChart.duty_origin.rotated_door_palace}宫`}
                {qimenChart.duty_origin.rotated_door_palace!==qimenChart.duty_origin.rotated_door_display_palace?
                  '（寄坤二展示）':''}</span>
            </>}
            {qimenChart.hour_markers&&<>
              <span>时旬空：{qimenChart.hour_markers.void_branches.join('、')}（{qimenChart.hour_markers.void_palaces.join('、')}宫）</span>
              <span>时支{qimenChart.hour_markers.horse_time_branch} · 马星{qimenChart.hour_markers.horse_branch}（{qimenChart.hour_markers.horse_palace}宫）</span>
              <span>八神：{qimenChart.spirit_plate?.direction}，自值符星{qimenChart.spirit_plate?.chief_star_display_palace}宫起</span>
            </>}
            {qimenChart.dark_stem_plate&&<span>V53 暗干：{qimenChart.dark_stem_plate.method}；
              {qimenChart.dark_stem_plate.origin_reason}，从{qimenChart.dark_stem_plate.origin_logical_palace}宫起；
              尚缺同流派完整古籍例盘独立校验。</span>}
          </div>
          <div className="academy-nine qimen-v50-nine" role="group"
            aria-label={qimenChart.has_rotated_stars_and_gates?'V51 奇门九宫星门转盘':'V50 奇门九宫真实地盘'}>
            {qimenChart.palaces.map(p=><button type="button" key={p.number}
              className={palaceNum===p.number?'active':''}
              onClick={()=>setPalaceNum(p.number)}>
              <small>{p.name}宫 · {p.number}</small>
              {qimenChart.has_eight_spirits&&<small className="qimen-v52-spirit">{p.actual_spirit||'中宫无神'}</small>}
              {qimenChart.has_rotated_stars_and_gates?
                <><strong>{p.actual_star||'中宫'}</strong><b>{p.actual_gate||'无独立八门'}</b>
                  <small>地{p.earth_stem} · 天{p.sky_stem}
                    {p.attached_center_stem?' · 寄'+p.attached_center_stem:''}</small>
                  {qimenChart.has_ten_stem_lookup&&<small className="qimen-v53-stems">
                    暗{p.dark_stem} · {p.ten_stem_response?.title||'克应未命名/中宫'}</small>}
                  {qimenChart.has_hourly_void_and_horse&&<small className="qimen-v52-marks">
                    {[p.hour_horse?'马':'',p.has_hour_void?'空'+p.hour_xunkong_branches_here.join(''):'',
                      ...(p.structural_tags||[])].filter(Boolean).join(' · ')}</small>}</>:
                <><strong>{p.earth_stem}</strong><b>地盘</b></>}
            </button>)}
          </div>
          <div className="qimen-v50-palace">
            {qimenChart.palaces.filter(p=>p.number===palaceNum).map(p=>
              <p key={p.number}><b>{p.name}{p.number}宫</b> · 地盘 {p.earth_stem}。
                {qimenChart.has_rotated_stars_and_gates?
                  <>天盘 {p.sky_stem}，实际九星 {p.actual_star||'中五无独立转宫星'}，
                    实际八门 {p.actual_gate||'中五不安八门'}。
                    {p.star_from_palace&&<> 九星来源{p.star_from_palace===7?'兑':p.star_from_palace===2?'坤':'第'}{p.star_from_palace}宫，
                      八门来源{p.gate_from_palace}宫；</>}
                    {p.attached_center_star&&<> {p.attached_center_star}随天芮寄，中宫干{p.attached_center_stem}。</>}
                    {qimenChart.has_eight_spirits?
                      <>八神 {p.actual_spirit||'中五不安八神'}；
                        {p.has_hour_void?<>时旬空 {p.hour_xunkong_branches_here.join('、')}；</>:'本宫无时旬空；'}
                        {p.hour_horse?<>时支马星 {p.horse_branch_here}；</>:'本宫无时支马星；'}
                        {p.door_palace_relation?<>门宫五行 {p.door_palace_relation}；</>:null}
                        {p.structural_tags?.length?
                          <>结构条件：{p.structural_tags.join('、')}。</>:'未出现当前核验的结构条件。'}
                        仅标记结构，不作吉凶结论。</>:'八神尚待完成。'}
                    {qimenChart.has_ten_stem_lookup&&<>
                      十干克应：{p.ten_stem_response?
                        <>{p.ten_stem_response.sky_stem}加{p.ten_stem_response.earth_stem} ·
                          {p.ten_stem_response.title||'古籍未题独立专名'}</>:
                        '中五不另设实际转宫十干克应'}；
                      暗干（飞宫法试算）{p.dark_stem}。
                      {p.classical_patterns?.length?
                        <>复合格局候选：{p.classical_patterns.map(x=>x.title+'（'+x.evidence+'）').join('、')}。</>:
                        '本宫未见已支持的复合格局条件。'}
                      格名只说明传统结构，不能直接下吉凶结论。
                    </>}</>:</>:
                  <>{p.original_star}、{p.original_door||'中宫不安八门'}为固定本宫出处，
                    <strong>不是</strong>此时天盘星门的实际落宫。</>}</p>)}
          </div>
          {qimenChart.input_provenance?.warnings?.map((w,i)=>
            <p key={i} className="academy-caution">{w}</p>)}
          <p className="academy-caution">{qimenChart.has_ten_stem_lookup?
            'V53 81组十干克应格名已对照原典，天遁地遁人遁需多条件同宫；暗干飞宫法只采用明确变体，缺少同流派独立整盘例证，不等于完成所有奇门断课。':
            qimenChart.has_eight_spirits?
            'V52 地盘、天盘九星、八门、八神、时旬空与马星及基础结构条件已实现；暗干、完整奇仪格局和用神裁决尚未实现，不可据单项标签断吉凶。':
            qimenChart.has_rotated_stars_and_gates?
            'V51 天盘九星、八门已按时辰实际转宫，但八神、旬空、马星和格局尚未完成；不是全部层次齐备的完整奇门时盘。':
            '当前只有 V50 地盘，九星、八门与八神尚未完成。不是完整奇门时盘。'}
            不提供据此判定的吉凶、择时或方位。</p>
          <a href={qimenChart.reference} target="_blank" rel="noopener noreferrer">原典：《奇门遁甲元灵经》卷一</a>
        </div>}
      </section>}
      {isQimen?<section className="academy-learning-layout">
        <div className="academy-learning-surface">
          <span>洛书九宫 · 上南下北</span>
          <div className="academy-nine" role="group" aria-label="后天九宫方位教学图">
            {PALACES.map(p=><button key={p.n} className={palaceNum===p.n?'active':''} onClick={()=>setPalaceNum(p.n)}>
              <small>{p.dir}</small><strong>{p.n}</strong><b>{p.name}宫</b>
            </button>)}
          </div>
          <p>点击宫位探索后天方位与固定九宫数。真正奇门时盘中的八门、九星、值符值使并不永远停在一个宫位。</p>
        </div>
        <article className="academy-learning-panel">
          <span>九宫探索 · 第 {palace.n} 宫</span><h2>{palace.name}宫 · {palace.dir}</h2>
          <p>{palace.desc}</p>
          <hr/><h3>认识八门</h3>
          <div className="academy-small-picker">{DOORS.map((d,i)=><button key={d[0]} className={door===i?'selected':''} onClick={()=>setDoor(i)}>{d[0]}</button>)}</div>
          <blockquote>{DOORS[door][0]}常被联系到{DOORS[door][1]}等传统象义。</blockquote>
          <p className="academy-caution">此区仅为固定九宫文化教学图；上方 V51 才是按时辰起出的九星与八门盘。此处的八门是原始名称索引，不等于这一时刻的落宫。</p>
        </article>
      </section>:isBazi?<section className="academy-learning-layout">
        <div className="academy-learning-surface">
          <span>年、月、日、时，各有一干一支</span>
          <div className="academy-pillars">{PILLARS.map((p,i)=><button key={p} className={activePillar===i?'active':''} onClick={()=>setActivePillar(i)}>
            <small>{p}</small><strong>{STEMS[stem[i]][0]}</strong><strong>{BRANCHES[branch[i]]}</strong>
          </button>)}</div>
          <p>上面是可以自选干支的结构示意，不代表真实出生八字。排真实四柱需要正确处理干支历、节气、时区、跨日和流派差异。</p>
        </div>
        <article className="academy-learning-panel">
          <span>教学自选 · {PILLARS[activePillar]}</span><h2>十天干 · 十二地支</h2>
          <h3>选择天干</h3><div className="academy-small-picker">{STEMS.map(([name,element],i)=><button key={name} className={stem[activePillar]===i?'selected':''} onClick={()=>setStem(a=>a.map((v,j)=>j===activePillar?i:v))}>{name}<small>{element}</small></button>)}</div>
          <h3>选择地支</h3><div className="academy-small-picker">{BRANCHES.map((name,i)=><button key={name} className={branch[activePillar]===i?'selected':''} onClick={()=>setBranch(a=>a.map((v,j)=>j===activePillar?i:v))}>{name}</button>)}</div>
          <p className="academy-caution">这里只帮助理解“四柱八字”由八个干支字组成，不依据出生信息自动生成虚假的完整命盘。</p>
        </article>
      </section>:<section className="academy-prelude">
        <span>{art.symbol}</span>
        <div><h2>这门古术，先从读懂它开始。</h2><p>各门术数对历法、象数、盘式有各自的规范。我们会分别校勘，不为了凑齐菜单就给出没有依据的排盘。</p>
          <button className="academy-primary" onClick={onStudy}>去藏经阁查典籍与学习入口 ↗</button></div>
      </section>}
      <footer className="academy-bottom">读古籍、学规则、观环境 · 未完成的排盘功能明确标注，不虚构计算结果</footer>
    </div>
  </main>
}
