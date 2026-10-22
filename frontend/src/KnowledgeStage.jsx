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
  const [stem,setStem]=useState([0,0,0,0])
  const [branch,setBranch]=useState([0,0,0,0])
  const [activePillar,setActivePillar]=useState(0)
  const palace=PALACES.find(a=>a.n===palaceNum)
  return <main className={"academy-stage academy-stage--"+mode+" academy-knowledge-mode"}>
    <div className="academy-container">
      <header className="academy-stage-nav"><button onClick={onBack}>← 返回万象书院</button><b>{art.group} · {art.name}</b><button onClick={onStudy}>藏经阁 ◎</button></header>
      <section className="academy-stage-banner"><div>
        <small className="method-theme-identity">{({qimen:"玄夜九宫 · 星轨阵图",bazi:"赤金四柱 · 干支命简",liuren:"沧海六壬 · 天地盘式",taiyi:"青穹太乙 · 九宫行数",ziwei:"紫夜星垣 · 十二宫曜",fengshui:"苍山堪舆 · 山水形势"})[mode]}</small>
        <p>{isQimen?'时空九宫 · 学习如何认盘':isBazi?'干支四柱 · 入门认识命盘':'古典文献 · 入门导览'}</p>
        <h1>{art.title}</h1><span>{art.brief}　{art.detail}。<br/>{isQimen||isBazi?'这里是互动教学演示，不会伪装成真实完整排盘。':'本门目前提供学馆入口，待逐条核实古籍规则后再补排盘。'}</span>
      </div><div className="academy-stage-glyph">{art.symbol}</div></section>
      <div className="academy-knowledge-status"><span>本门研习方式</span><b>{isQimen?'九宫阵盘 · 宫位探索':isBazi?'四柱命简 · 干支辨识':mode==='fengshui'?'山水堪舆 · 空间观察':'古籍导览 · 按章研习'}</b><small>{isQimen||isBazi?'互动结构教学 · 不冒充完整实盘':'独立主题 · 后续按本门术法逐步完善'}</small></div>
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
          <p className="academy-caution">这只是教学九宫图，没有计算节气、阴阳遁、局数、八门九星真实落宫，因此不是奇门遁甲的实时局盘。</p>
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
