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
        <h1>{art.title}</h1><span>{art.brief}　{art.detail}。<br/>{isQimen?'V50 已支持按北京时间计算阴阳遁、三元局数、九宫地盘及旬首值符值使本宫；天盘星门尚待实现。':isBazi?'这里是互动教学演示，不会伪装成真实完整排盘。':'本门目前提供学馆入口，待逐条核实古籍规则后再补排盘。'}</span>
      </div><div className="academy-stage-glyph">{art.symbol}</div></section>
      <div className="academy-knowledge-status"><span>本门研习方式</span><b>{isQimen?'V50 真正定局 · 九宫地盘':isBazi?'四柱命简 · 干支辨识':mode==='fengshui'?'山水堪舆 · 空间观察':'古籍导览 · 按章研习'}</b><small>{isQimen?'真实日期起局基础 · 天盘转布未完成':isBazi?'互动结构教学 · 不冒充完整实盘':'独立主题 · 后续按本门术法逐步完善'}</small></div>
      {isQimen&&<section className="qimen-v50">
        <header><small>V50 · 时家奇门 / 拆补法</small><h2>按北京时间定阴阳遁 · 起九宫地盘</h2>
          <p>输入真实公历日期与钟面时刻，以二十四节气及甲己日符头定局。九星、八门此版仅显示本宫出处，尚未随时辰转宫。</p>
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
          </div>
          <div className="academy-nine qimen-v50-nine" role="group" aria-label="V50 奇门九宫真实地盘">
            {qimenChart.palaces.map(p=><button type="button" key={p.number}
              className={palaceNum===p.number?'active':''}
              onClick={()=>setPalaceNum(p.number)}>
              <small>{p.name}宫 · {p.number}</small>
              <strong>{p.earth_stem}</strong>
              <b>地盘</b>
            </button>)}
          </div>
          <div className="qimen-v50-palace">
            {qimenChart.palaces.filter(p=>p.number===palaceNum).map(p=>
              <p key={p.number}><b>{p.name}{p.number}宫</b> · 地盘 {p.earth_stem}。
                {p.original_star}、{p.original_door||'中宫不安八门'}为固定本宫出处，
                <strong>不是</strong>此时天盘星门的实际落宫。</p>)}
          </div>
          {qimenChart.input_provenance?.warnings?.map((w,i)=>
            <p key={i} className="academy-caution">{w}</p>)}
          <p className="academy-caution">尚未转布天盘九星、八门及八神，不是完整奇门时盘；
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
          <p className="academy-caution">此区仍是固定九宫、八门文化教学图；上方 V50 已按实际日期算出地盘。天盘九星、八门与八神实际落宫仍待后续版本完成，不能以本宫索引冒充实盘。</p>
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
