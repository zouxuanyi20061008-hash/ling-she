import {useId,useState,useRef} from 'react'
import {ARTS} from './ArtsHub.jsx'
import LiurenV58 from './LiurenV58.jsx'
import TaiyiV64 from './TaiyiV64.jsx'
import ZiweiV68 from './ZiweiV68.jsx'
import FengshuiV70 from './FengshuiV70.jsx'
import CastResultPanels,{CastResultPanel} from './CastResultPanels.jsx'
import {useCastPage,CastPageNav,CastPagePane} from './CastPage.jsx'
import CastLesson,{CastHint} from './CastLesson.jsx'
import './academy.css'
import './knowledge-mobile.css'
import './knowledge-cast-mobile.css'

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
const QIMEN_CAST_NOTES='真实九宫地盘、星门神盘保持不变；增加三奇入墓与古籍六甲式三奇得使，并单独列出另一种值使门同宫口径，绝不合并判定。'
const BAZI_CAST_NOTES='出生四柱按立春、十二节交接计算；大运可选传统规则或手动顺逆。也可另外选择任意北京时间，查看那一刻的流年、流月及整年十二节令月表。'

function qimenGuideSteps(chart,palaceNumber){
  const palace=chart.palaces.find(entry=>entry.number===palaceNumber)??chart.palaces[0]
  const steps=[{
    title:'先核对起局时刻',
    text:'在「定局摘要」对照节气、时柱和局数，确认这是刚才所选时间起出的盘。',
    layout:'sequence',
    items:[
      {label:'节气',value:chart.solar_term},
      {label:'时柱',value:chart.hour_ganzhi},
      {label:'局数',value:chart.ju_label,active:true},
    ],
  }]
  if(palace){
    const layers=[]
    if(chart.has_eight_spirits&&palace.actual_spirit)layers.push({label:'八神',value:palace.actual_spirit})
    if(chart.has_rotated_stars_and_gates){
      if(palace.actual_gate)layers.push({label:'八门',value:palace.actual_gate})
      const heaven=[palace.sky_stem,palace.actual_star].filter(Boolean).join(' · ')
      if(heaven)layers.push({label:'天盘',value:heaven,active:true})
    }
    layers.push({label:'地盘干',value:palace.earth_stem})
    const palaceName=`${palace.name}${palace.number}宫`
    steps.push({
      title:layers.length>1?`分层看${palaceName}`:`先看${palaceName}的地盘`,
      text:layers.length>1
        ?'从下往上读。回九宫盘可换宫对照。'
        :'先找本宫的地盘干。当前这格只列能从这一局核对到的盘层。',
      layout:layers.length>1?'layers':'sequence',
      items:layers,
    })
  }
  const duty=chart.duty_origin
  if(chart.has_rotated_stars_and_gates&&duty.rotated_star_display_palace&&duty.rotated_door_display_palace){
    steps.push({
      title:'回九宫盘找值符和值使',
      text:'按这里的盘面宫号去找值符星和值使门。要比较转宫前后，可在「定局摘要」对照。',
      layout:'sequence',
      items:[
        {label:`值符 · ${duty.origin_star}`,value:`${duty.rotated_star_display_palace}宫`},
        {label:`值使 · ${duty.origin_door}`,value:`${duty.rotated_door_display_palace}宫`},
      ],
    })
  }
  return steps
}

function baziGuideSteps(chart){
  const pillars=chart.pillars.map(pillar=>({label:pillar.label,value:pillar.ganzhi}))
  const steps=[{
    title:'先认年、月、日、时四柱',
    text:'每柱的第一字是天干，第二字是地支。可到「说明与出处」核对这次所用的出生时刻和节令。',
    layout:'pillars',
    items:pillars,
  },{
    title:'从日柱找日主',
    text:`日柱的第一个字「${chart.day_master}」是日主。回到「四柱」看其他三柱的天干十神，它们都以日主为参照。`,
    layout:'pillars',
    items:pillars.map((pillar,index)=>({...pillar,active:chart.pillars[index].kind==='day'})),
  }]
  if(chart.luck||chart.flow){
    steps.push({
      title:'接着看已选择的时间范围',
      text:chart.luck&&chart.flow
        ?'到「十年大运」看每步的时间范围，再到「流年流月」核对你选的那一刻。'
        :chart.luck?'到「十年大运」按起运时间看每一步。':'到「流年流月」核对所选时刻属于哪一节令月。',
      layout:'sequence',
      items:[
        chart.luck&&{label:'大运方向',value:chart.luck.direction},
        chart.flow&&{label:'所选流年',value:chart.flow.year.ganzhi},
        chart.flow&&{label:'所选流月',value:chart.flow.month.ganzhi,active:true},
      ].filter(Boolean),
    })
  }
  return steps
}

function BaziResultRows({rows,selectedIndex=0,label,rangeLabel,gridClass,renderRow}){
  const pageSize=4
  const [page,setPage]=useState(Math.floor(Math.max(0,selectedIndex)/pageSize))
  return <>
    {rows.length>pageSize&&<label className="bazi-v55-row-picker">{rangeLabel}
      <select value={page} onChange={e=>setPage(Number(e.target.value))}>
        {Array.from({length:Math.ceil(rows.length/pageSize)},(_,index)=><option key={index} value={index}>
          第 {index*pageSize+1}–{Math.min(rows.length,(index+1)*pageSize)} 项
        </option>)}
      </select>
    </label>}
    <div role="group" aria-label={label} className={gridClass}>
      {rows.map((row,index)=>renderRow(row,Math.floor(index/pageSize)===page))}
    </div>
  </>
}

export default function KnowledgeStage({mode,onBack,onStudy}) {
  const art=ARTS.find(a=>a.id===mode)||ARTS[2]
  const isQimen=mode==='qimen',isBazi=mode==='bazi',isLiuren=mode==='liuren',isTaiyi=mode==='taiyi',isZiwei=mode==='ziwei',isFengshui=mode==='fengshui'
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
  const [qimenResultPanel,setQimenResultPanel]=useState('plate')
  const qimenPage=useCastPage('qimen',!!qimenChart,{enabled:isQimen})
  const qimenRequest=useRef(0)
  const qimenPalaceBoard=useRef(null)
  const qimenPalaceDetail=useRef(null)
  function invalidateQimen(){
    qimenRequest.current+=1
    setQimenChart(null);setQimenBusy(false);setQimenError('')
  }
  async function castActualQimen(event){
    event.preventDefault()
    if(!qimenDate||!qimenClock)return
    const ticket=++qimenRequest.current
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
      if(ticket===qimenRequest.current){
        setQimenChart(body)
        setQimenResultPanel('plate')
        qimenPage.showResult()
      }
    }catch(error){
      if(ticket===qimenRequest.current)setQimenError(error.message||'奇门定局失败，请核实输入')
    }finally{
      if(ticket===qimenRequest.current)setQimenBusy(false)
    }
  }
  const [stem,setStem]=useState([0,0,0,0])
  const [branch,setBranch]=useState([0,0,0,0])
  const [activePillar,setActivePillar]=useState(0)
  const [baziDate,setBaziDate]=useState(()=>
    new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date()))
  const [baziClock,setBaziClock]=useState('12:00')
  const [baziBoundary,setBaziBoundary]=useState('midnight')
  const [baziLuckMode,setBaziLuckMode]=useState('none')
  const [baziOptionsOpen,setBaziOptionsOpen]=useState(false)
  const baziOptionsId=useId()
  const [baziFlowEnabled,setBaziFlowEnabled]=useState(false)
  const [baziFlowDate,setBaziFlowDate]=useState(()=>
    new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date()))
  const [baziFlowClock,setBaziFlowClock]=useState('12:00')
  const [baziChart,setBaziChart]=useState(null)
  const [baziBusy,setBaziBusy]=useState(false)
  const [baziError,setBaziError]=useState('')
  const baziPage=useCastPage('bazi',!!baziChart,{enabled:isBazi})
  const baziRequest=useRef(0)
  function invalidateBazi(){
    baziRequest.current+=1
    setBaziChart(null);setBaziBusy(false);setBaziError('')
  }
  function revealInvalidBaziFlow(event){
    if(!baziPage.compact||baziOptionsOpen)return
    // Native validation cannot focus a field inside the folded mobile options.
    event.preventDefault()
    const field=event.target
    const firstInvalid=Array.from(field.form.elements).find(control=>control.willValidate&&!control.validity.valid)
    if(firstInvalid!==field)return
    setBaziOptionsOpen(true)
    setBaziError(field.type==='date'
      ?'请填写有效的流年流月日期（1901—2099 年）。'
      :'请填写有效的流年流月北京时间。')
    window.requestAnimationFrame(()=>field.focus())
  }
  async function castActualBazi(event){
    event.preventDefault()
    if(!baziDate||!baziClock)return
    const ticket=++baziRequest.current
    setBaziBusy(true)
    setBaziError('')
    setBaziChart(null)
    try{
      const response=await fetch('/api/bazi/cast',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          solar_date:baziDate,clock:baziClock,day_boundary:baziBoundary,
          ...(baziLuckMode!=='none'?{luck_direction:baziLuckMode}:{}),
          ...(baziFlowEnabled?{flow_solar_date:baziFlowDate,flow_clock:baziFlowClock}:{})
        })
      })
      const body=await response.json()
      if(!response.ok)throw new Error(typeof body.detail==='string'?body.detail:'请核实出生日期与时间')
      if(ticket===baziRequest.current){
        setBaziChart(body)
        baziPage.showResult()
      }
    }catch(error){
      if(ticket===baziRequest.current)setBaziError(error.message||'四柱计算失败，请核实输入')
    }finally{
      if(ticket===baziRequest.current)setBaziBusy(false)
    }
  }
  const palace=PALACES.find(a=>a.n===palaceNum)
  const stageNotes=<>{art.brief}　{art.detail}。<br/>{isQimen?'V73 已对地盘、天盘九星、八门、八神做逐宫一致性审计，保留三奇双口径和未核验的暗干、流派及断课边界。':isBazi?'V57 新增按立春、十二节即时换算的流年流月整表，并可将选定时刻对应至十年大运；历史交节边界均可复核。':isLiuren?'V76 对反吟同深课核对原典适用范围：《探原》为戊辰、戊戌明示通则，《存验》只限戊辰日戌将辰时独立实占；其它同形盘不可套用单例。':isZiwei?'V69 已实算十二颗辅煞及生年四化，壬年化科分两套流派口径核验；流年四化、其余杂曜仍待实现。':isFengshui?'V71 以真实立春时刻定三元九运，按下卦法排运、山、向三星；兼向替卦、临近山界暂不出星盘。':'本门目前提供学馆入口，待逐条核实古籍规则后再补排盘。'}</>
  return <main className={"academy-stage academy-stage--"+mode+" academy-knowledge-mode"}>
    <div className="academy-container">
      <header className="academy-stage-nav"><button onClick={onBack}>← 返回万象书院</button><b>{art.group} · {art.name}</b><button onClick={onStudy}>藏经阁 ◎</button></header>
      <section className="academy-stage-banner"><div>
        <small className="method-theme-identity">{({qimen:"玄夜九宫 · 星轨阵图",bazi:"赤金四柱 · 干支命简",liuren:"沧海六壬 · 天地盘式",taiyi:"青穹太乙 · 九宫行数",ziwei:"紫夜星垣 · 十二宫曜",fengshui:"苍山堪舆 · 山水形势"})[mode]}</small>
        <p>{isQimen?'时家奇门 · 先算十八局与地盘':isBazi?'四柱八字 · 真实节令排盘':isLiuren?'大六壬 · 中气月将与四课':isTaiyi?'太乙神数 · 岁计与时计分别实算':isZiwei?'紫微斗数 · 北京时间与农历安星':isFengshui?'堪舆风水 · 二十四山与坐向实算':'古典文献 · 入门导览'}</p>
        <h1>{art.title}</h1>
        {isTaiyi?<details className="taiyi-stage-notes">
          <summary>查看太乙研习说明</summary>
          <span>{art.brief}　{art.detail}。<br/>
            V85 以《太乙金镜式经》阴遁第六纪壬子元27局独立验收主29客4及四将；气应派六纪天目只算三个纪首条件相位，缺现代历元证据时不选择真实大将。
          </span>
        </details>:<>
          <span className="academy-desktop-notes">{stageNotes}</span>
          <details className="academy-mobile-notes"><summary>研习说明</summary><span>{stageNotes}</span></details>
        </>}
      </div><div className="academy-stage-glyph">{art.symbol}</div></section>
      <div className="academy-knowledge-status"><span>本门研习方式</span><b>{isQimen?'V73 四层转盘 · 逐宫校核':isBazi?'V57 四柱大运 · 流年流月':isLiuren?'V76 反吟复等 · 原典范围校核':isTaiyi?'V85 阴遁独立例课 · V67 岁计':isZiwei?'V69 十四正曜 · 十二辅煞 · 生年四化':isFengshui?'V71 三元九运 · 玄空下卦':'古籍导览 · 按章研习'}</b><small>{isQimen?'值符值使 · 星门神一致性 · 未决流派显式保留':isBazi?'十二节令流月 · 交节流年 · 大运时段定位':isLiuren?'明示两日通则 · 单张实占严守时将 · 其余保留待判':isTaiyi?'阴遁315真例 · 六纪天目三相位 · 主客未决':isZiwei?'十二辅煞 · 生年四化 · 异文分栏' :isFengshui?'立春定运 · 玄空三盘 · 山界替卦保护':'独立主题 · 后续按本门术法逐步完善'}</small></div>
      {isLiuren&&<LiurenV58/>}
      {isTaiyi&&<TaiyiV64/>}
      {isZiwei&&<ZiweiV68/>}
      {isFengshui&&<FengshuiV70/>}
      {isQimen&&<section className="qimen-v50">
        <CastPageNav title="奇门遁甲" hasResult={!!qimenChart} {...qimenPage}/>
        <CastPagePane name="form" {...qimenPage}>
        <header className="knowledge-cast-heading"><small>V54 · 时家奇门 / 拆补法</small><h2>北京时间定局 · 九宫星门转盘</h2>
          <p className="knowledge-cast-intro">{QIMEN_CAST_NOTES}</p>
        </header>
        <form onSubmit={castActualQimen} className="qimen-v50-form">
          <label>公历日期（中国时间）
            <input aria-label="奇门公历日期" type="date" value={qimenDate}
              onChange={e=>{setQimenDate(e.target.value);invalidateQimen()}} required min="1901-01-01" max="2099-12-31"/>
          </label>
          <label>北京时间
            <input aria-label="奇门北京时间" type="time" value={qimenClock}
              onChange={e=>{setQimenClock(e.target.value);invalidateQimen()}} required/>
          </label>
          <label>换日约定
            <select aria-label="奇门换日规则" value={qimenBoundary}
              onChange={e=>{setQimenBoundary(e.target.value);invalidateQimen()}}>
              <option value="zi_hour">子初 23:00 换日</option>
              <option value="midnight">午夜 00:00 换日</option>
            </select>
          </label>
          <button type="submit" disabled={qimenBusy}>{qimenBusy?'正在计算…':'按所选时间起局'}</button>
        </form>
        {qimenError&&<p role="alert" className="academy-caution">{qimenError}</p>}
        <CastHint>填写要起局的北京时间。若是 23 点到午夜，先核对换日约定。</CastHint>
        <details className="knowledge-cast-notes"><summary>查看奇门排盘说明</summary><p>{QIMEN_CAST_NOTES}</p></details>
        </CastPagePane>
        <CastPagePane name="result" {...qimenPage}>
        {qimenChart&&<div className="qimen-v50-result">
          <CastResultPanels label="奇门结果分类" variant={qimenPage.compact?'select':'buttons'}
            value={qimenResultPanel} onValueChange={setQimenResultPanel}>
          <CastResultPanel value="summary" label="定局摘要">
          {qimenChart.input_provenance?.warnings?.map((w,i)=>
            <p key={i} className="academy-caution">{w}</p>)}
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
            {qimenChart.core_plate_audit&&<span>
              V73 核心四层一致性审计：{qimenChart.core_plate_audit.core_layers
                .map(layer=>layer.name+' '+layer.verified_positions+'/'+layer.expected_positions+'宫')
                .join('；')}；
              中五天禽随芮寄、值符星与值使门时序、时旬空马星均已交叉核对。
              这表示四层核心盘结构一致，绝不等于完整多流派断课。
            </span>}
            {qimenChart.wonder_rule_review&&<span>
              V54 三奇入墓：{qimenChart.wonder_rule_review.burial_positions.join('、')||'本盘未见'}；
              古籍六甲式三奇得使：{qimenChart.wonder_rule_review.classical_six_jia_positions.join('、')||'本盘未见'}；
              值使门同宫另一口径：{qimenChart.wonder_rule_review.chief_door_overlap_positions.join('、')||'本盘未见'}。
              分歧宫位：{qimenChart.wonder_rule_review.interpretation_disagreements.join('、')||'无'}。</span>}
          </div>
          </CastResultPanel>
          {qimenChart.core_plate_audit&&<CastResultPanel value="audit" label="整盘校核">
            <section className="qimen-v73-audit"
              aria-label="V73 奇门四层整盘交叉审计">
              <h3>V73 · 四层转盘完整性校核</h3>
              <p>经核对的核心层：
                {qimenChart.core_plate_audit.core_layers.map(x=>
                  x.name+'（'+x.verified_positions+'/'+x.expected_positions+'）').join('、')}。
                值符原宫{qimenChart.core_plate_audit.duty.chief_star_original}，
                星盘实落{qimenChart.core_plate_audit.duty.chief_star_logical}
                （显示{qimenChart.core_plate_audit.duty.chief_star_display}）宫；
                值使门第{qimenChart.core_plate_audit.duty.hourly_steps}步，
                实落{qimenChart.core_plate_audit.duty.chief_gate_logical}
                （显示{qimenChart.core_plate_audit.duty.chief_gate_display}）宫。</p>
              <p>尚待独立核验：{qimenChart.core_plate_audit.unverified_modules.join('、')}。
                保留已有盘式与流派边界，不自动断吉凶。</p>
              <a href={qimenChart.core_plate_audit.source.full_external_worked_chart}
                target="_blank" rel="noopener noreferrer">
                查阅完整九宫独立例盘依据
              </a>
            </section>
          </CastResultPanel>}
          <CastResultPanel value="plate" label="九宫盘">
          <p className="knowledge-board-cue">{qimenChart.ju_label} · {qimenChart.day_ganzhi}日 {qimenChart.hour_ganzhi}时 · 点宫位看细节</p>
          <div className="academy-nine qimen-v50-nine" role="group" ref={qimenPalaceBoard}
            aria-label={qimenChart.has_rotated_stars_and_gates?'V51 奇门九宫星门转盘':'V50 奇门九宫真实地盘'}>
            {qimenChart.palaces.map(p=><button type="button" key={p.number}
              className={palaceNum===p.number?'active':''}
              aria-pressed={palaceNum===p.number}
              onClick={()=>{
                setPalaceNum(p.number)
                if(qimenPage.compact){
                  setQimenResultPanel('palace')
                  window.requestAnimationFrame(()=>qimenPalaceDetail.current?.focus({preventScroll:true}))
                }
              }}>
              <small>{p.name}宫 · {p.number}</small>
              {qimenChart.has_eight_spirits&&<small className="qimen-v52-spirit">{p.actual_spirit||'中宫无神'}</small>}
              {qimenChart.has_rotated_stars_and_gates?
                <><span className="qimen-cell-star-door">
                    <strong>{p.actual_star||'中宫'}</strong>
                    <b>{p.actual_gate||(qimenPage.compact?'无八门':'无独立八门')}</b>
                  </span>
                  <small>地{p.earth_stem} · 天{p.sky_stem}
                    {p.attached_center_stem?' · 寄'+p.attached_center_stem:''}</small>
                  {qimenChart.has_ten_stem_lookup&&<small className="qimen-v53-stems">
                    暗{p.dark_stem} · {p.ten_stem_response?.title||'克应未命名/中宫'}</small>}
                  {p.wonder_rule_review?.candidates?.length>0&&
                    <small className="qimen-v54-wonder">
                      {p.wonder_rule_review.candidates.map(w=>w.title).join(' · ')}</small>}
                  {qimenChart.has_hourly_void_and_horse&&<small className="qimen-v52-marks">
                    {[p.hour_horse?'马':'',p.has_hour_void?'空'+p.hour_xunkong_branches_here.join(''):'',
                      ...(qimenPage.compact?[]:p.structural_tags||[])].filter(Boolean).join(' · ')}</small>}</>:
                <><strong>{p.earth_stem}</strong><b>地盘</b></>}
            </button>)}
          </div>
          </CastResultPanel>
          <CastResultPanel value="palace" label="宫位细节">
          <div className="qimen-v50-palace" ref={qimenPalaceDetail} tabIndex={-1}>
            <button type="button" className="knowledge-back-to-chart"
              onClick={()=>{
                setQimenResultPanel('plate')
                window.requestAnimationFrame(()=>qimenPalaceBoard.current?.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true}))
              }}>← 返回九宫盘</button>
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
                    </>}
                    {p.wonder_rule_review&&<>
                      V54 三奇入墓：{p.wonder_rule_review.burial?
                        '是，墓支'+p.wonder_rule_review.burial_grave_branch:'当前未见'}；
                      古籍六甲式三奇得使：{p.wonder_rule_review.classical_six_jia_de_shi?
                        '满足，遁'+p.wonder_rule_review.classical_six_jia_instrument:'当前未见'}；
                      值使门同宫另一口径：{p.wonder_rule_review.alternative_chief_door_overlap?
                        '相遇':'未相遇'}；
                      {p.wonder_rule_review.classical_and_alternative_disagree?
                        '两种口径对此宫判断不同，不应混为同一种格。':'两种口径目前未见分歧。'}
                      {p.wonder_rule_review.candidates.length>0?
                        <>依据：{p.wonder_rule_review.candidates.map(w=>w.evidence).join('；')}。</>:
                        '本宫未见新增三奇规则的结构条件。'}
                      只作结构参考，实际效力及应期未判定。
                    </>}</>:
                  <>{p.original_star}、{p.original_door||'中宫不安八门'}为固定本宫出处，
                    <strong>不是</strong>此时天盘星门的实际落宫。</>}</p>)}
          </div>
          </CastResultPanel>
          <CastResultPanel value="references" label="说明与原典">
          <p className="academy-caution">{qimenChart.wonder_rule_review?
            'V54 三奇入墓与古籍六甲式三奇得使已分别校验；值使门同宫属于其他解释口径，严格开休生值使门也单列。暗干尚未独立例盘核验，所有格名均不可直接推断吉凶。':
            qimenChart.has_ten_stem_lookup?
            'V53 81组十干克应格名已对照原典，天遁地遁人遁需多条件同宫；暗干飞宫法只采用明确变体，缺少同流派独立整盘例证，不等于完成所有奇门断课。':
            qimenChart.has_eight_spirits?
            'V52 地盘、天盘九星、八门、八神、时旬空与马星及基础结构条件已实现；暗干、完整奇仪格局和用神裁决尚未实现，不可据单项标签断吉凶。':
            qimenChart.has_rotated_stars_and_gates?
            'V51 天盘九星、八门已按时辰实际转宫，但八神、旬空、马星和格局尚未完成；不是全部层次齐备的完整奇门时盘。':
            '当前只有 V50 地盘，九星、八门与八神尚未完成。不是完整奇门时盘。'}
            不提供据此判定的吉凶、择时或方位。</p>
          <a className="qimen-v50-source" href={qimenChart.reference} target="_blank" rel="noopener noreferrer">原典：《奇门遁甲元灵经》卷一</a>
          </CastResultPanel>
          <CastResultPanel value="guide" label="跟着看">
            <CastLesson title="奇门九宫怎么读" collapsed={!qimenPage.compact}
              steps={qimenGuideSteps(qimenChart,palaceNum)}/>
          </CastResultPanel>
          </CastResultPanels>
        </div>}
        </CastPagePane>
      </section>}
      {isBazi&&<section className="bazi-v55" aria-label="V55 四柱八字真实排盘">
        <CastPageNav title="四柱八字" hasResult={!!baziChart} {...baziPage}/>
        <CastPagePane name="form" {...baziPage}>
        <header className="knowledge-cast-heading">
          <small>V57 · 节令四柱、大运与流年流月</small>
          <h2>输入出生时刻 · 计算真实四柱</h2>
          <p className="knowledge-cast-intro">{BAZI_CAST_NOTES}</p>
        </header>
        <form className="bazi-v55-form" onSubmit={castActualBazi}>
          <label>公历出生日期
            <input aria-label="八字公历出生日期" type="date" value={baziDate}
              onChange={e=>{setBaziDate(e.target.value);invalidateBazi()}} required
              min="1901-01-01" max="2099-12-31"/>
          </label>
          <label>北京时间（UTC+8）
            <input aria-label="八字北京时间" type="time" value={baziClock}
              onChange={e=>{setBaziClock(e.target.value);invalidateBazi()}} required/>
          </label>
          <label>换日约定
            <select aria-label="八字换日规则" value={baziBoundary}
              onChange={e=>{setBaziBoundary(e.target.value);invalidateBazi()}}>
              <option value="midnight">零点 00:00 换日</option>
              <option value="zi_hour">子初 23:00 换日</option>
            </select>
          </label>
          <button type="button" className="bazi-v55-options-toggle" aria-controls={baziOptionsId}
            aria-expanded={baziOptionsOpen} onClick={()=>setBaziOptionsOpen(open=>!open)}>
            大运与流年设置{baziLuckMode!=='none'||baziFlowEnabled?' · 已选':''}
          </button>
          <div id={baziOptionsId} className="bazi-v55-extra-options" data-open={baziOptionsOpen} onInvalid={revealInvalidBaziFlow}>
          <label>大运顺逆（可选，不推断性别）
            <select aria-label="大运顺逆规则" value={baziLuckMode}
              onChange={e=>{setBaziLuckMode(e.target.value);invalidateBazi()}}>
              <option value="none">不排大运（只看四柱）</option>
              <option value="traditional_male">传统男命规则（按年干阴阳）</option>
              <option value="traditional_female">传统女命规则（按年干阴阳）</option>
              <option value="forward">直接顺排（不填性别）</option>
              <option value="reverse">直接逆排（不填性别）</option>
            </select>
          </label>
          <label className="bazi-v57-flow-enable">
            <span>流年流月查看</span>
            <span><input aria-label="启用流年流月" type="checkbox"
              checked={baziFlowEnabled}
              onChange={e=>{setBaziFlowEnabled(e.target.checked);invalidateBazi()}}/> 额外查看指定时刻（可选）</span>
          </label>
          {baziFlowEnabled&&<>
            <label>流年流月公历日期
              <input aria-label="八字流年日期" type="date" value={baziFlowDate}
                onChange={e=>{setBaziFlowDate(e.target.value);invalidateBazi()}}
                min="1901-01-01" max="2099-12-31" required/>
            </label>
            <label>流年流月北京时间
              <input aria-label="八字流年北京时间" type="time" value={baziFlowClock}
                onChange={e=>{setBaziFlowClock(e.target.value);invalidateBazi()}} required/>
            </label>
          </>}
          </div>
          <button type="submit" disabled={baziBusy}>
            {baziBusy?'正在计算…':baziFlowEnabled?'排四柱 · 查流年流月':
              baziLuckMode==='none'?'按出生时间排四柱':'排四柱及十年大运'}
          </button>
        </form>
        {baziError&&<p role="alert" className="academy-caution">{baziError}</p>}
        <CastHint>用北京时间填写出生时刻。要查大运或流年，先展开「大运与流年设置」。</CastHint>
        <details className="knowledge-cast-notes"><summary>查看四柱排盘说明</summary><p>{BAZI_CAST_NOTES}</p></details>
        </CastPagePane>
        <CastPagePane name="result" {...baziPage}>
        {baziChart&&<div className="bazi-v55-result">
          <CastResultPanels label="八字结果分类">
          <CastResultPanel value="pillars" label="四柱">
          <p className="bazi-v55-day-master"><strong>日主 {baziChart.day_master} · {baziChart.day_master_element}</strong></p>
          <div role="group" aria-label="V55 真实八字四柱" className="bazi-v55-pillar-grid">
            {baziChart.pillars.map(p=><article key={p.kind}
              className={'bazi-v55-pillar bazi-v55-pillar--'+p.kind}>
              <small>{p.label}</small>
              <strong>{p.ganzhi}</strong>
              <span>{p.stem_element} · {p.branch_element}</span>
              <b>天干十神：{p.stem_ten_god}</b>
              <small>纳音：{p.na_yin||'待核对'}</small>
              <div className="bazi-v55-hidden">
                <em>地支藏干</em>
                {p.hidden_stems.map(h=><span key={h.stem}>
                  {h.stem} · {h.element} · {h.ten_god}
                </span>)}
              </div>
            </article>)}
          </div>
          </CastResultPanel>
          {baziChart.luck&&<CastResultPanel value="luck" label="十年大运">
          <section className="bazi-v56-luck" aria-label="V56 八步十年大运">
            <header><small>V56 · 时家节令起运</small>
              <h3>十年大运 · {baziChart.luck.direction}</h3>
              <p>所选口径：{baziChart.luck.mode_label}。传统男女命是历史排运算法的名称，也可直接指定顺逆，不推断身份。</p>
            </header>
            <div className="bazi-v55-meta">
              <span>原月柱：{baziChart.luck.month_ganzhi}；
                {baziChart.luck.reference_jie.position}：{baziChart.luck.reference_jie.name}，
                {baziChart.luck.reference_jie.beijing_time.replace('T',' ')}</span>
              <span>节令间隔：{baziChart.luck.interval_minutes} 分钟；
                折算 {baziChart.luck.start_offset.years} 年
                {baziChart.luck.start_offset.months} 月
                {baziChart.luck.start_offset.days} 日
                {baziChart.luck.start_offset.hours} 小时</span>
              <strong>推算起运时间：{baziChart.luck.start_at_beijing.replace('T',' ')}</strong>
              <small>三天折一年；下方年份不是周岁，也不代表实际事件的应期。</small>
            </div>
            <BaziResultRows rows={baziChart.luck.luck_decades} label="十年大运干支表"
              rangeLabel="选择大运范围" gridClass="bazi-v56-cycles" renderRow={(phase,visible)=><article key={phase.order}
                data-bazi-row-visible={visible}>
                <small>第 {phase.order} 步</small>
                <strong>{phase.ganzhi}</strong>
                <span>{phase.stem_element} · {phase.branch_element}</span>
                <b>十神：{phase.stem_ten_god}</b>
                <small>{phase.start_calendar_year}—{phase.end_calendar_year_exclusive}（末年为下一运起点）</small>
                <small>始于 {phase.begins_at_beijing.slice(0,16).replace('T',' ')}</small>
                <span>藏干：{phase.hidden_stems.map(h=>h.stem).join('、')}</span>
              </article>}/>
            <p className="academy-caution">大运只是传统干支时间结构，不代表个人健康、事业、婚姻或财富的预测；没有进行出生地真太阳时、流年和完整断课。</p>
          </section>
          </CastResultPanel>}
          {baziChart.flow&&<CastResultPanel value="flow" label="流年流月">
          <section className="bazi-v57-flow" aria-label="V57 真实流年流月">
            <header><small>V57 · 立春与十二节令时间窗</small>
              <h3>流年 {baziChart.flow.year.ganzhi} · 流月 {baziChart.flow.month.ganzhi}</h3>
              <p>查看时刻：{baziChart.flow.target_beijing_time.replace('T',' ')}；
                节令年度从 {baziChart.flow.year.begins_at_beijing.replace('T',' ')} 至下一立春交节前。</p>
            </header>
            <div className="bazi-v55-meta">
              <strong>流年：{baziChart.flow.year.ganzhi} · {baziChart.flow.year.stem_ten_god}</strong>
              <span>当前流月：{baziChart.flow.month.jie_name}起，
                {baziChart.flow.month.ganzhi} · {baziChart.flow.month.stem_ten_god}</span>
              <span>大运对应：{baziChart.flow.luck_at_target.label}</span>
              {baziChart.flow.near_jie&&<span>接近交节15分钟，请复核历书交节时刻。</span>}
            </div>
            <BaziResultRows rows={baziChart.flow.months} selectedIndex={baziChart.flow.months.findIndex(m=>m.selected)}
              label="十二节令流月表" rangeLabel="选择流月范围" gridClass="bazi-v57-months"
              renderRow={(m,visible)=><article key={m.order} data-bazi-row-visible={visible}
                className={m.selected?'selected':''}>
                <small>第 {m.order} 月 · {m.jie_name}起</small>
                <strong>{m.ganzhi}</strong>
                <b>{m.stem_ten_god}</b>
                <small>从 {m.begins_at_beijing.slice(0,16).replace('T',' ')}</small>
                <small>至 {m.ends_before_beijing.slice(0,16).replace('T',' ')}（不含）</small>
                <span>藏干 {m.hidden_stems.map(h=>h.stem).join('、')}</span>
              </article>}/>
            <p className="academy-caution">十二流月按真实节气“节”分割，不是农历月初或每月1日。大运对应只是时间包含关系，不判断财富、婚姻、健康、事业或事件应期。</p>
          </section>
          </CastResultPanel>}
          <CastResultPanel value="references" label="说明与出处">
          <div className="bazi-v55-meta">
            <span>北京时间：{baziChart.beijing_time.replace('T',' ')}</span>
            <span>换日：{baziChart.day_boundary_label}</span>
            <span>当前节令月支：{baziChart.solar_term_boundary.solar_month_branch}；
              上一节 {baziChart.solar_term_boundary.previous_jie.name}；
              下一节 {baziChart.solar_term_boundary.next_jie.name}</span>
          </div>
          {baziChart.warnings.map((w,i)=><p key={i} className="academy-caution">{w}</p>)}
          <p className="academy-caution">年柱依立春、月柱依交节；本盘使用北京时间而非出生地真太阳时。
            {baziChart.luck?'所选大运已经推算；':'未选择大运规则；'}{baziChart.flow?'流年和十二节令流月已按北京时间计算；':'流年流月未选择；'}完整命理分析尚未完成，十神仅说明传统五行结构。</p>
          <a className="bazi-v55-source" href={baziChart.source.independent_fixed_cases_reference}
            rel="noopener noreferrer" target="_blank">历法与固定例盘核验依据</a>
          </CastResultPanel>
          <CastResultPanel value="guide" label="跟着看">
            <CastLesson title="四柱先看哪里" collapsed={!baziPage.compact} steps={baziGuideSteps(baziChart)}/>
          </CastResultPanel>
          </CastResultPanels>
        </div>}
        </CastPagePane>
      </section>}
      {(isQimen||isBazi)?<details className="knowledge-cast-teaching"
        open={!(isQimen?qimenPage:baziPage).compact}
        data-cast-result={(isQimen?qimenPage:baziPage).page==='result'}>
        <summary>{isQimen?'查看九宫与八门教学图':'查看干支四柱教学图'}</summary>
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
      </section>:<section className="academy-learning-layout">
        <div className="academy-learning-surface">
          <span>年、月、日、时，各有一干一支</span>
          <div className="academy-pillars">{PILLARS.map((p,i)=><button key={p} className={activePillar===i?'active':''} onClick={()=>setActivePillar(i)}>
            <small>{p}</small><strong>{STEMS[stem[i]][0]}</strong><strong>{BRANCHES[branch[i]]}</strong>
          </button>)}</div>
          <p>下面仅是教学自选干支示意，不会改变上方已经算出的实际四柱。真实八字请以上方 V55 日期输入结果为准。</p>
        </div>
        <article className="academy-learning-panel">
          <span>教学自选 · {PILLARS[activePillar]}</span><h2>十天干 · 十二地支</h2>
          <h3>选择天干</h3><div className="academy-small-picker">{STEMS.map(([name,element],i)=><button key={name} className={stem[activePillar]===i?'selected':''} onClick={()=>setStem(a=>a.map((v,j)=>j===activePillar?i:v))}>{name}<small>{element}</small></button>)}</div>
          <h3>选择地支</h3><div className="academy-small-picker">{BRANCHES.map((name,i)=><button key={name} className={branch[activePillar]===i?'selected':''} onClick={()=>setBranch(a=>a.map((v,j)=>j===activePillar?i:v))}>{name}</button>)}</div>
          <p className="academy-caution">这里只帮助认识天干地支，不是上方 V55 出生时间排出的实盘；教学选择不会修改实际排盘。</p>
        </article>
      </section>}
      </details>:(isLiuren||isTaiyi||isFengshui)?null:<section className="academy-prelude">
        <span>{art.symbol}</span>
        <div><h2>这门古术，先从读懂它开始。</h2><p>各门术数对历法、象数、盘式有各自的规范。我们会分别校勘，不为了凑齐菜单就给出没有依据的排盘。</p>
          <button className="academy-primary" onClick={onStudy}>去藏经阁查典籍与学习入口 ↗</button></div>
      </section>}
      <footer className="academy-bottom">读古籍、学规则、观环境 · 未完成的排盘功能明确标注，不虚构计算结果</footer>
    </div>
  </main>
}
