import { useState, useRef } from 'react'
import './book.css'

const pad = n => String(n).padStart(2, '0')
const localInput = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
function localIsoWithOffset(d) {
  const offset = -d.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const abs = Math.abs(offset)
  return `${localInput(d)}:00${sign}${pad(Math.floor(abs/60))}:${pad(abs%60)}`
}
const ApiUrl = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : `${window.location.protocol}//${window.location.hostname}:8000`)
const STRUCTURES = ['左右', '上下', '半包围', '全包围', '左中右', '上中下', '独体', '其他']
const initialManual = { structure: '其他', yangPart: '', yinPart: '', yang: '', yin: '' }

function followupQuestion(question) {
  if (/复合|分手|前任|挽回|和好/.test(question)) return '你们目前是断联、冷战，还是正在沟通中？双方是否有现实中的阻碍？'
  if (/感情|恋爱|婚姻|结婚|对象|喜欢|桃花|相亲|男友|女友/.test(question)) return '你们目前是什么关系、相处到哪个阶段，有没有已经发生的现实阻碍？'
  if (/(找|丢|不见|失物|寻找)/.test(question) && /(东西|物品|猫|狗|钥匙|手机|发簪|包|宠物)/.test(question)) return '最后一次确实见到它是在哪里、什么时候？你已经找过哪些地方？'
  if (/跳槽|工作|职业|事业|求职|面试|创业|升职|公司|老板/.test(question)) return '你现在的工作或机会处于什么阶段，眼前最大的现实阻碍是什么？'
  if (/考试|高考|学业|志愿|复读|录取|学校/.test(question)) return '目前的学习、成绩或录取情况是什么，眼前最需要解决的问题是什么？'
  if (/财运|投资|赚钱|生意|收入|买卖|借钱/.test(question)) return '你现在面对的是哪项具体收入或金钱决策？已有的事实和风险是什么？'
  if (/健康|生病|胸闷|症状|身体|失眠/.test(question)) return '你现在有哪些实际症状、持续多久、是否已接受医学评估？若有急症症状请先就医。'
  return '请补充这件事现在的真实处境、已经发生的情况，以及眼前最关键的阻碍是什么？'
}

function SixLines({ lines, moving }) {
  return <div className="six-lines" aria-label="六爻自下而上编号">
    {[...lines].map((bit, i) => ({bit,yao:i+1})).reverse().map(({bit,yao}) =>
      <div key={yao} className={'six-row' + (moving===yao?' moving':'')}>
        <span className="yao-num">{moving===yao?'动':yao}</span>
        <div className="six-strokes">
          {bit === 1 ? <span/> : <><span/><span/></>}
        </div>
      </div>
    )}
  </div>
}

function HexCard({ name, data, moving }) {
  return <article className="book-hex">
    <p className="kind">{name}</p>
    <h3>{data.full_name || data.name}</h3>
    <p className="trigrams">{data.upper.name}上 · {data.lower.name}下</p>
    <SixLines lines={data.lines_bottom_to_top} moving={moving}/>
    <p className="hex-keywords">{data.keywords}</p>
    <p className="hexmeaning">{data.meaning}</p>
  </article>
}

function PlumArt() {
  return <div className="book-cover-art" aria-hidden="true">
    <svg viewBox="0 0 430 270" preserveAspectRatio="xMidYMid slice">
      <defs><linearGradient id="mountain" x1="0" x2="1" y1="1" y2="0">
        <stop offset="0" stopColor="#496a60" stopOpacity=".18"/>
        <stop offset="1" stopColor="#496a60" stopOpacity=".01"/>
      </linearGradient></defs>
      <circle cx="322" cy="82" r="54" fill="#e2d7b8" opacity=".7"/>
      <path d="M20 252 Q98 180 143 212 L218 120 275 184 319 143 429 242 V270 H0Z" fill="url(#mountain)"/>
      <path d="M127 268 L250 100 322 203 355 185 430 262" fill="none" stroke="#9ea894" strokeOpacity=".3" strokeWidth="2"/>
      <path d="M428 -5 Q349 36 308 76 T224 134 M348 33 Q359 69 382 87 M290 88 Q270 57 245 55" fill="none" stroke="#806a51" strokeWidth="3.2" strokeLinecap="round"/>
      {[[315,74],[349,47],[388,90],[271,90],[254,58],[222,134],[335,22],[290,98],[365,78]].map(([x,y],i)=>
        <g key={i} transform={'translate('+x+' '+y+')'} opacity={.58+(i%3)*.12}>
          {[0,72,144,216,288].map(a=><ellipse key={a} cx="0" cy="-6" rx="4.5" ry="7.4" transform={'rotate('+a+')'} fill="#c68171" fillOpacity=".73"/>)}
          <circle r="3.5" fill="#c4aa66"/>
        </g>)}
      <path d="M14 206 Q95 193 164 212" fill="none" stroke="#708477" strokeOpacity=".25" strokeDasharray="3 7"/>
    </svg>
  </div>
}

function HoutianCompass({ ti, yong }) {
  const marks = [
    {name:'离',dir:'南',x:112,y:24},{name:'坤',dir:'西南',x:184,y:52},
    {name:'兑',dir:'西',x:207,y:112},{name:'乾',dir:'西北',x:184,y:176},
    {name:'坎',dir:'北',x:112,y:202},{name:'艮',dir:'东北',x:40,y:176},
    {name:'震',dir:'东',x:17,y:112},{name:'巽',dir:'东南',x:40,y:52}
  ]
  return <svg className="book-compass" viewBox="0 0 224 224" role="img" aria-label="后天八卦方位：上南下北，左东右西">
    <circle cx="112" cy="112" r="100" fill="#f0ead9" stroke="#b8a785" strokeWidth="1.2"/>
    <circle cx="112" cy="112" r="76" fill="none" stroke="#a99f8a" strokeDasharray="2 5"/>
    <circle cx="112" cy="112" r="44" fill="#e7ebdf" stroke="#a8b9aa" opacity=".92"/>
    <path d="M112 29V195M29 112H195M51 51L173 173M173 51L51 173" stroke="#bcb59f" strokeWidth=".65"/>
    <text x="112" y="107" fontSize="16" textAnchor="middle" fill="#254f43">后天</text>
    <text x="112" y="125" fontSize="10" textAnchor="middle" fill="#6f8270">八卦方位</text>
    {marks.map(m=>{
      const active=ti?.name===m.name||yong?.name===m.name
      return <g key={m.name}>
        <circle cx={m.x} cy={m.y} r="15" fill={active?'#2b6053':'#e6dcc5'} stroke={active?'#8c7550':'#cfc1a2'}/>
        <text x={m.x} y={m.y+4} textAnchor="middle" fontSize="15" fill={active?'#fff4de':'#58695a'}>{m.name}</text>
      </g>
    })}
  </svg>
}

function LayerReading({ chart, activeTab }) {
  const layer=chart.dual_layer || {}
  const xt=layer.xiantian || {}
  const ht=layer.houtian || {}
  if(activeTab==='xiantian') return <div className="book-philosophy">
    <div className="book-mini">
      <p className="mini-kicker">先天之数</p>
      <h3>{xt.upper_name || chart.ben_gua.upper.name} {xt.upper_number || chart.method_numbers.upper%8 || 8} · {xt.lower_name || chart.ben_gua.lower.name} {xt.lower_number || chart.method_numbers.lower%8 || 8}</h3>
      <p>乾一兑二离三震四巽五坎六艮七坤八。上、下卦由起卦取数而成，形成本卦的结构。</p>
    </div>
    <div className="book-mini">
      <p className="mini-kicker">体用之理</p>
      <h3>{chart.sheng_ke}</h3>
      <p>体为{chart.ti_gua.name}{chart.ti_gua.element}，用为{chart.yong_gua.name}{chart.yong_gua.element}。{chart.reading_guide?.relationship}</p>
    </div>
    <div className="book-mini" style={{gridColumn:'1 / -1'}}>
      <p className="mini-kicker">观其变化</p>
      <h3>{chart.ben_gua.full_name} → {chart.bian_gua.full_name}</h3>
      <p>本卦可联系「{chart.ben_gua.keywords}」，互卦「{chart.hu_gua.keywords}」提示内部牵连，变卦「{chart.bian_gua.keywords}」提示可讨论的变化方向。不能不看现实问题就判定结局。</p>
    </div>
  </div>
  if(activeTab==='houtian') return <div>
    <div className="book-houtian">
      <HoutianCompass ti={ht.ti} yong={ht.yong}/>
      <div className="book-context">
        <p><b>体卦 · {ht.ti?.name} · {ht.ti?.direction}</b></p>
        <p>{ht.ti?.themes}</p>
        <p>{ht.ti?.question}</p>
        <p style={{marginTop:14}}><b>用卦 · {ht.yong?.name} · {ht.yong?.direction}</b></p>
        <p>{ht.yong?.themes}</p>
        <p>{ht.yong?.question}</p>
      </div>
    </div>
    <div className="book-mini" style={{marginTop:12}}>
      <p className="mini-kicker">由方位入情境</p>
      <p>本卦上卦{ht.upper?.name}主{ht.upper?.themes}；下卦{ht.lower?.name}主{ht.lower?.themes}。结合眼前的真实处境，去核实与之有关的地点、人物或行动，而不是见某方位就断那边有吉凶。</p>
    </div>
    <p className="book-footnote">{ht.principle} 上南下北、左东右西，采用传统后天八卦方位图示。</p>
  </div>
  return <div>
    <BasicReading chart={chart}/>
    <details className="book-details">
      <summary>展开原始取数与笔画计算</summary>
      <NumberExplanation chart={chart}/>
    </details>
  </div>
}

function BasicReading({ chart }) {
  const guide = chart.reading_guide || {}
  const ben = chart.ben_gua
  const hu = chart.hu_gua
  const bian = chart.bian_gua
  return <section className="mt-5 rounded-3xl bg-white/85 border border-[#cad4c8] p-5 md:p-7">
    <div className="flex flex-wrap justify-between items-end gap-3">
      <div>
        <p className="text-xs tracking-widest text-moss">无需 AI · 免费基础解卦</p>
        <h3 className="font-serif text-2xl mt-2">从体用、互变读懂卦意</h3>
      </div>
      <span className="text-xs text-moss bg-pale rounded-full px-3 py-2">六十四卦基础象义</span>
    </div>
    <div className="mt-6 space-y-5 text-sm leading-8 text-ink/90">
      <div>
        <h4 className="font-medium text-base">体用定基调 · {chart.sheng_ke}</h4>
        <p className="mt-1">体为{chart.ti_gua.name}{chart.ti_gua.element}，用为{chart.yong_gua.name}{chart.yong_gua.element}。{guide.relationship}</p>
      </div>
      <div>
        <h4 className="font-medium text-base">本卦 · {ben.full_name || ben.name}</h4>
        <p className="mt-1">此卦主要可从「{ben.keywords}」观察眼前局面。{ben.meaning}</p>
      </div>
      <div>
        <h4 className="font-medium text-base">互卦 · {hu.full_name || hu.name}</h4>
        <p className="mt-1">事情内部的关系与牵连，可参考「{hu.keywords}」之象。{hu.meaning}</p>
      </div>
      <div>
        <h4 className="font-medium text-base">变卦 · {bian.full_name || bian.name}</h4>
        <p className="mt-1">变化方向可参考「{bian.keywords}」。{bian.meaning}</p>
      </div>
      <div>
        <h4 className="font-medium text-base">动爻 · 第 {chart.dong_yao} 爻</h4>
        <p className="mt-1">{guide.moving_position}</p>
        {chart.moving_line_text
          ? <p className="mt-1 text-moss">已核对的爻辞：{chart.moving_line_text}</p>
          : <p className="mt-1 text-moss">这一动爻的经文尚未校勘收录，暂不凭空引用爻辞。</p>}
      </div>
      <div className="rounded-xl bg-pale/60 p-4 text-moss">
        <p>后天方位参照：体卦{chart.ti_gua.name}对应{chart.ti_gua.direction}，用卦{chart.yong_gua.name}对应{chart.yong_gua.direction}。这些是传统象征方位，不能直接当成现实中的吉方或寻找地点。</p>
      </div>
    </div>
    <p className="mt-5 text-xs leading-6 text-moss/90">这些内容来自固定的六十四卦象义与排盘规则，不依赖 AI，也不是针对你的经历作出的确定预测。具体断事仍需结合你真正所问的事情及现实环境。</p>
  </section>
}

function NumberExplanation({ chart }) {
  const origin = chart.origin
  const upper = chart.method_numbers.upper
  const lower = chart.method_numbers.lower
  const isCharacter = origin.method?.startsWith('hanzi')
  const isPair = origin.method === 'hanzi-pair'
  const isObservation = origin.method === 'observation-confirmed'
  const upLabel = isPair ? '前字 · 上卦' : isObservation ? '自定第一数 · 上卦' : isCharacter ? '阳部 · 上卦' : '第一数 · 上卦'
  const downLabel = isPair ? '后字 · 下卦' : isObservation ? '自定第二数 · 下卦' : isCharacter ? '阴部 · 下卦' : '第二数 / 时辰 · 下卦'
  return <div className="mt-5 rounded-2xl border border-[#cad4c8] bg-white/80 p-5 md:p-7">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-serif text-2xl">阴阳取数 · 可核对的计算过程</h3>
      <span className="rounded-full bg-pale px-3 py-1 text-xs text-moss">{origin.structure || '数字起卦'}</span>
    </div>
    <p className="mt-2 text-sm leading-6 text-moss">{origin.yin_yang_rule || '阳数作上卦，阴数作下卦'}。{origin.ids && `原始 IDS：${origin.ids}`}</p>
    {origin.observation && <p className="mt-2 text-sm text-moss">起卦契机：{origin.observation}</p>}
    {origin.observation_reason && <p className="mt-2 text-sm text-moss">取数依据：{origin.observation_reason}</p>}
    <div className="mt-5 grid gap-3 md:grid-cols-2">
      <div className="rounded-xl bg-[#f0f1e8] px-5 py-5">
        <p className="text-xs tracking-widest text-moss">☀ {upLabel}</p>
        <div className="mt-3 flex items-baseline gap-3 flex-wrap">
          <strong className="font-serif text-4xl">{origin.yang_part || String(upper)}</strong>
          <span className="text-lg">{upper} {isCharacter ? '画' : ''}</span>
        </div>
        <p className="mt-2 text-sm text-moss">{upper} % 8 = {upper % 8}（{upper % 8 === 0 ? '余0按8' : `取${upper % 8}`}）→ <b>{chart.ben_gua.upper.name}卦</b></p>
      </div>
      <div className="rounded-xl bg-[#e9efed] px-5 py-5">
        <p className="text-xs tracking-widest text-moss">☾ {downLabel}</p>
        <div className="mt-3 flex items-baseline gap-3 flex-wrap">
          <strong className="font-serif text-4xl">{origin.yin_part || String(lower)}</strong>
          <span className="text-lg">{lower} {isCharacter && origin.structure !== '独体' ? '画' : (isCharacter ? '数' : '')}</span>
        </div>
        <p className="mt-2 text-sm text-moss">{lower} % 8 = {lower % 8}（{lower % 8 === 0 ? '余0按8' : `取${lower % 8}`}）→ <b>{chart.ben_gua.lower.name}卦</b></p>
      </div>
    </div>
    <div className="mt-4 rounded-xl border border-[#d4dbd0] p-4 text-sm leading-7">
      <b>动爻依据：</b>{origin.moving_basis || '两数之和'} = {chart.method_numbers.moving}，
      余 6 得 <b>第 {chart.dong_yao} 爻</b>（余 0 记作 6）。
      {origin.structure === '独体' && <p className="text-moss">独体字特别规则：动爻只取整字总画数，不把默认阴数或时辰数相加。</p>}
      <p className="mt-2 text-moss">数据来源：{origin.source || origin.method}。{origin.stroke_policy && `笔画口径：${origin.stroke_policy}。`}</p>
      {origin.stroke_reference_total_candidates?.length > 1 &&
        <p className="text-moss">原始数据存在不同字形笔画候选：{origin.stroke_reference_total_candidates.join(' / ')} 画，当前拆字选择 {origin.total_strokes} 画。</p>}
      {origin.method === 'hanzi-manual' && <p className="text-amber-700">本次阳/阴部件及笔画由用户确认，并非由数据库自动验证。</p>}
    </div>
  </div>
}

function ManualDialog({ problem, draft, setDraft, error, onClose, onConfirm, busy }) {
  const update = (key, value) => setDraft(old => ({ ...old, [key]: value }))
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17231e]/65 p-4" role="presentation">
    <section role="dialog" aria-modal="true" aria-labelledby="manual-title"
      className="book-modal w-full max-w-xl max-h-[90vh] overflow-y-auto px-6 py-6 md:px-8">
      <div className="flex justify-between gap-4 items-start">
        <div>
          <p className="text-xs tracking-widest text-moss">人工确认 · 阴阳归类</p>
          <h2 id="manual-title" className="font-serif text-2xl mt-2">请确定阳部与阴部笔画</h2>
        </div>
        <button type="button" aria-label="关闭弹窗" onClick={onClose} className="text-2xl text-moss p-1">×</button>
      </div>
      {problem && <div className="mt-5 rounded-xl bg-[#f6efe7] p-4 text-sm text-[#835534] leading-6">
        <b>无法安全自动拆分：</b>{problem.message}
        {problem.ids && <p className="mt-1">数据库字形：{problem.ids}</p>}
        <p>系统不会猜测笔画，请检查原字后手动输入。</p>
      </div>}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="sm:col-span-2 text-sm text-moss">汉字结构
          <select className="field mt-2" value={draft.structure} onChange={e => update('structure', e.target.value)}>
            {STRUCTURES.map(s => <option value={s} key={s}>{s}</option>)}
          </select>
        </label>
        <label className="text-sm text-moss">阳部名称（左 / 上 / 外）
          <input className="field mt-2" maxLength={30} placeholder="例：辶、艹" value={draft.yangPart} onChange={e => update('yangPart', e.target.value)}/>
        </label>
        <label className="text-sm text-moss">阴部名称（右 / 下 / 内）
          <input className="field mt-2" maxLength={30} placeholder="例：米、化" value={draft.yinPart} onChange={e => update('yinPart', e.target.value)}/>
        </label>
        <label className="text-sm text-moss"><b>阳部笔画数 → 上卦</b>
          <input autoFocus className="field mt-2" type="number" min="1" max="100" step="1" value={draft.yang} onChange={e => update('yang', e.target.value)}/>
        </label>
        <label className="text-sm text-moss"><b>阴部笔画数 → 下卦</b>
          <input className="field mt-2" type="number" min="1" max="100" step="1" value={draft.yin} onChange={e => update('yin', e.target.value)}/>
        </label>
      </div>
      <p className="mt-4 text-xs text-moss leading-6">若选「独体」，阳部填写整字笔画，阴部填 1 或所选时辰数；动爻仅使用整字笔画。其他结构动爻取阳、阴笔画之和。</p>
      {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
      <div className="flex flex-wrap gap-3 mt-6">
        <button type="button" onClick={onConfirm} disabled={busy} className="rounded-xl bg-moss text-white px-6 py-3 disabled:opacity-50">确认阴阳并继续排盘</button>
        <button type="button" onClick={onClose} className="rounded-xl border border-moss/50 text-moss px-5 py-3">取消</button>
      </div>
    </section>
  </div>
}

export default function App() {
  const [question, setQuestion] = useState('')
  const [value, setValue] = useState('')
  const [dateValue, setDateValue] = useState(() => localInput(new Date()))
  const [independentYin, setIndependentYin] = useState('one')
  const [chart, setChart] = useState(null)
  const [interpretation, setInterpretation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [manualOverride, setManualOverride] = useState(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualProblem, setManualProblem] = useState(null)
  const [manualDraft, setManualDraft] = useState(initialManual)
  const [manualError, setManualError] = useState('')
  const [pendingAi, setPendingAi] = useState(false)
  const [aiAccessCode, setAiAccessCode] = useState('')
  const [background, setBackground] = useState('')
  const [backgroundAsked, setBackgroundAsked] = useState(false)
  const [backgroundOpen, setBackgroundOpen] = useState(false)
  const [backgroundError, setBackgroundError] = useState('')
  const [observationOpen, setObservationOpen] = useState(false)
  const [observationProblem, setObservationProblem] = useState(null)
  const [observationDraft, setObservationDraft] = useState({ first: '', second: '', reason: '' })
  const [observationOverride, setObservationOverride] = useState(null)
  const [observationError, setObservationError] = useState('')
  const [page, setPage] = useState(0)
  const [turnDirection, setTurnDirection] = useState('next')
  const [turnVersion, setTurnVersion] = useState(0)
  const [readingTab, setReadingTab] = useState('xiantian')
  const touchOrigin = useRef(null)

  function goPage(target) {
    const next = Math.max(0, Math.min(2, target))
    if (next > 0 && !chart && page !== 0) return
    if (next === page) return
    setTurnDirection(next > page ? 'next' : 'prev')
    setTurnVersion(i => i + 1)
    setPage(next)
    if (typeof window !== 'undefined') window.scrollTo({top:0,behavior:'instant'})
  }
  function handleTouchStart(e) {
    if (e.target.closest?.('textarea, input, select, button, a, summary')) return
    touchOrigin.current={x:e.touches[0].clientX,y:e.touches[0].clientY}
  }
  function handleTouchEnd(e) {
    const origin=touchOrigin.current
    touchOrigin.current=null
    if (!origin || page===0 || !e.changedTouches?.length) return
    const dx=e.changedTouches[0].clientX-origin.x
    const dy=e.changedTouches[0].clientY-origin.y
    if(Math.abs(dx)>90 && Math.abs(dx)>Math.abs(dy)*1.65) {
      if (dx<0 && page===1) goPage(2)
      if (dx>0 && page===2) goPage(1)
    }
  }

  function clearResult() {
    setChart(null)
    setInterpretation('')
    setError('')
  }
  function openManual(problem = null, withAi = false) {
    const suggested = problem?.structure
    const structure = STRUCTURES.includes(suggested) ? suggested : '其他'
    setManualDraft({ ...initialManual, structure })
    setManualProblem(problem)
    setManualError('')
    setPendingAi(withAi)
    setManualOpen(true)
  }
  function openObservation(problem = null, withAi = false) {
    setObservationProblem(problem)
    setObservationDraft(observationOverride ? {
      first: String(observationOverride.first),
      second: String(observationOverride.second),
      reason: observationOverride.reason
    } : { first: '', second: '', reason: '' })
    setObservationError('')
    setPendingAi(withAi)
    setObservationOpen(true)
  }
  async function submit(withAi, override = manualOverride, confirmedContext = false, numbers = observationOverride) {
    setBusy(true)
    setError('')
    setInterpretation('')
    if (!confirmedContext && !withAi) setChart(null)
    const datetime = new Date(dateValue)
    if (Number.isNaN(datetime.getTime())) {
      setError('请输入有效日期和时间'); setBusy(false); return
    }
    const askBackground = withAi && !confirmedContext && !(backgroundAsked && background.trim())
    const requestInterpretation = withAi && !askBackground
    const req = {
      question, value, time_iso: localIsoWithOffset(datetime), independent_yin: independentYin,
      background: requestInterpretation ? background.trim() : null,
      background_confirmed: requestInterpretation
    }
    if (numbers) {
      req.observation_first = numbers.first
      req.observation_second = numbers.second
      req.observation_reason = numbers.reason
    }
    if (override) {
      req.manual_first = override.yang
      req.manual_second = override.yin
      req.manual_structure = override.structure
      req.manual_yang_part = override.yangPart
      req.manual_yin_part = override.yinPart
    }
    try {
      const response = await fetch(`${ApiUrl}${requestInterpretation ? '/api/interpret' : '/api/cast'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(requestInterpretation && aiAccessCode ? { 'X-AI-Access-Code': aiAccessCode } : {}) }, body: JSON.stringify(req)
      })
      const data = await response.json()
      if (!response.ok) {
        const detail = data.detail
        if (detail?.code === 'NUMBERS_REQUIRED') {
          openObservation(detail, withAi)
          return
        }
        if (detail?.code === 'MANUAL_REQUIRED') {
          openManual(detail, withAi)
          return
        }
        throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail || '请求失败'))
      }
      setChart(requestInterpretation ? data.chart : data)
      if (page===0) setReadingTab('xiantian')
      if (requestInterpretation) goPage(2)
      else goPage(1)
      if (askBackground) {
        setBackgroundError('')
        setBackgroundOpen(true)
      }
      if (requestInterpretation) setInterpretation(data.interpretation)
    } catch (e) {
      setError(e.message || '网络错误')
    } finally { setBusy(false) }
  }

  function confirmObservation() {
    const first = Number(observationDraft.first)
    const second = Number(observationDraft.second)
    if (!/^\d+$/.test(observationDraft.first.trim()) || !/^\d+$/.test(observationDraft.second.trim()) ||
        !Number.isSafeInteger(first) || !Number.isSafeInteger(second) ||
        first < 1 || second < 1 || first > 99999999 || second > 99999999) {
      setObservationError('请填写两个正整数（每个在 1～99999999 范围内）。')
      return
    }
    if (observationDraft.reason.trim().length < 4) {
      setObservationError('请简单说明这两个数是从什么现象或文字得来的。')
      return
    }
    const next = { first, second, reason: observationDraft.reason.trim() }
    setObservationOverride(next)
    setManualOverride(null)
    setObservationOpen(false)
    submit(pendingAi, null, false, next)
  }

  function confirmManual() {
    const yang = Number(manualDraft.yang)
    const yin = Number(manualDraft.yin)
    if (!manualDraft.yang.trim() || !manualDraft.yin.trim() ||
        !Number.isInteger(yang) || !Number.isInteger(yin) ||
        yang < 1 || yin < 1 || yang > 100 || yin > 100) {
      setManualError('请将阳部、阴部笔画分别填写为 1～100 的正整数。')
      return
    }
    if (!value.trim() || [...value.trim()].length !== 1 || /^[0-9]$/.test(value.trim())) {
      setManualError('人工拆字只适用于输入一个汉字。')
      return
    }
    const override = { ...manualDraft, yang, yin }
    setManualOverride(override)
    setObservationOverride(null)
    setManualOpen(false)
    submit(pendingAi, override, false, null)
  }

  return <main className="book-app">
    <div className="book-frame">
      <header className="book-top">
        <div className="book-brand">
          <div className="book-brand-icon" aria-hidden="true">梅</div>
          <div>
            <div className="book-name">梅花心易</div>
            <div className="book-edition">以象观心 · 观境察势</div>
          </div>
        </div>
        <div className="book-serial">心易手卷 · 卷一</div>
      </header>
      <nav className="book-steps" aria-label="排卦步骤">
        {['问事','观卦','明理'].map((label,i)=>
          <button key={label} type="button" className={'book-step '+(page===i?'active':page>i?'passed':'')}
            aria-current={page===i?'step':undefined} disabled={i>0&&!chart}
            onClick={()=>goPage(i)}><span>0{i+1}</span> {label}</button>
        )}
      </nav>
      <div key={'leaf-'+page+'-'+turnVersion} className={'book-leaf '+turnDirection}
        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {page===0 && <section className="book-page">
        <div className="book-cover">
          <PlumArt/>
          <div className="book-kicker">心念所至 · 万物皆可起卦</div>
          <h1 className="book-h1">一念起，<br/>万象生。</h1>
          <p className="book-intro">先天观其理，后天察其境。认真问事，循象而思，不执一卦定人生。</p>
          <div className="book-seal" aria-hidden="true">心易</div>
        </div>
        <div className="book-inputs">
          <label className="wide">
            <span className="book-label">你想问什么</span>
            <textarea className="field h-24 resize-y" maxLength={1000} placeholder="把你现在真正想问的事情写在这里…" value={question} onChange={e => { setQuestion(e.target.value); setBackgroundAsked(false); setBackground(""); clearResult() }}/>
          </label>
          <label><span className="book-label">你想用什么起卦？</span>
            <textarea rows={2} maxLength={500} className="field resize-y" value={value} onChange={e => { setValue(e.target.value); setManualOverride(null); setObservationOverride(null); setBackgroundAsked(false); setBackground(""); clearResult() }} placeholder="明、迷茫、3、3,6，或写下看到听到的事情…" />
            <span className="mt-2 block text-xs leading-5 text-moss/80">字、数字、声音、事物、偶然见闻，都可以作为起卦契机。</span>
          </label>
          <label><span className="book-label">起卦时间 · 可手动修改</span>
            <input className="field" type="datetime-local" value={dateValue} onChange={e => { setDateValue(e.target.value); setManualOverride(null); setObservationOverride(null); setBackgroundAsked(false); setBackground(""); clearResult() }}/>
          </label>
          <label className="wide text-sm text-moss">独体字阴数方案
            <select value={independentYin} onChange={e => { setIndependentYin(e.target.value); setManualOverride(null); setObservationOverride(null); setBackgroundAsked(false); setBackground(""); clearResult() }} className="field mt-2 md:max-w-lg">
              <option value="one">默认取 1（推荐）</option>
              <option value="hour">取所选时辰数（子=1，亥=12）</option>
            </select>
          </label>
        </div>
        <details className="mt-4 text-sm text-moss"><summary className="cursor-pointer select-none">AI 解卦访问码（站长设置后才需要）</summary><input type="password" autoComplete="off" className="field mt-2 md:max-w-lg" placeholder="可选，不保存在网站中" value={aiAccessCode} onChange={e => setAiAccessCode(e.target.value)}/></details>
        <div className="book-aux mt-6">
          <button className="book-main-action" onClick={() => submit(false)} disabled={busy || !question.trim() || !value.trim()}>仅排盘</button>
          <button className="book-second-action" onClick={() => submit(true)} disabled={busy || !question.trim() || !value.trim()}>排盘 + AI 解读</button>
          {[...value.trim()].length === 1 && /[\u3400-\u9fff]/u.test(value.trim()) &&
            <button className="book-minor" type="button" onClick={() => openManual(null, false)} disabled={busy}>手动确认拆字</button>}
          <button className="book-minor" type="button" onClick={() => openObservation(null, false)} disabled={busy || !value.trim()}>自定取数</button>
          <button className="book-minor" type="button" onClick={() => { setDateValue(localInput(new Date())); setManualOverride(null); clearResult() }}>刷新为当前时间</button>
        </div>
        {manualOverride && <p className="mt-3 text-sm text-amber-800">当前使用人工确认：阳 {manualOverride.yang} 画，阴 {manualOverride.yin} 画。
          <button className="ml-2 underline" type="button" onClick={() => { setManualOverride(null); clearResult() }}>恢复自动拆字</button></p>}
        {observationOverride && <p className="mt-3 text-sm text-amber-800">当前按自定取数：上卦 {observationOverride.first}，下卦 {observationOverride.second}；依据：{observationOverride.reason}。
          <button className="ml-2 underline" type="button" onClick={() => { setObservationOverride(null); clearResult() }}>取消自定取数</button></p>}
        <p className="text-xs leading-6 text-moss/80 mt-5">
          起卦不限制触发形式，取数却必须有依据。单字按我们制定的阴阳拆字规则；两字按前字、后字整字笔画；纯数字按数字法。
          其他见闻和较长文字可「自定取数」，系统保留原始描述及取数依据，不让 AI 猜数字。
        </p>
        {busy && <p className="mt-4 text-moss">正在请求服务器…</p>}
        {error && <p role="alert" className="book-alert mt-4">{error}</p>}
        <div className="book-page-footer">
          <p className="book-page-mark">第一折 · 起念问事</p>
          <p className="book-small">排盘成功后自动翻至下一页 →</p>
        </div>
      </section>}
      
      {page===1 && chart && <section className="book-page" aria-label="观卦">
        <p className="book-kicker">第二折 · 卦成观象</p>
        <h2 className="book-h1" style={{fontSize:'clamp(26px,4vw,39px)'}}>三卦相参，察其变化。</h2>
        <p className="book-intro">六爻自下而上排，赤色为动爻。这里先把卦象摆明白，至下一页再观先天之理、后天之境。</p>
        <div className="book-charts">
          <HexCard name="本卦" data={chart.ben_gua} moving={chart.dong_yao}/>
          <HexCard name="互卦" data={chart.hu_gua}/>
          <HexCard name="变卦" data={chart.bian_gua}/>
        </div>
        <div className="book-summary">
          <div><p>体 · {chart.ti_gua.name}{chart.ti_gua.element}　用 · {chart.yong_gua.name}{chart.yong_gua.element}</p>
            <p>第 {chart.dong_yao} 爻动 · {chart.sheng_ke}</p></div>
          <span className="tag">体用定基调</span>
        </div>
        <div className="book-page-footer">
          <span className="book-page-mark">第二折 · 由象入理</span>
          <div className="book-pagenav">
            <button className="book-second-action" onClick={()=>goPage(0)}>← 修改所问</button>
            <button className="book-main-action" onClick={()=>goPage(2)}>翻页看解读 →</button>
          </div>
        </div>
      </section>}
      {page===2 && chart && <section className="book-page" aria-label="观境明理">
        <p className="book-kicker">第三折 · 先天与后天</p>
        <h2 className="book-h1" style={{fontSize:'clamp(27px,4vw,40px)'}}>先天定理，后天定事。</h2>
        <p className="book-intro">从{chart.ben_gua.full_name}出发，先以体用审关系，再以方位与类象追问具体情境，最终回到现实。</p>
        <div className="book-tabs" role="tablist" aria-label="选择易理视角">
          {[['xiantian','先天 · 观理'],['houtian','后天 · 察境'],['detail','完整卦解']].map(([id,label])=>
            <button key={id} type="button" role="tab" aria-selected={readingTab===id}
              className={'book-tab '+(readingTab===id?'active':'')} onClick={()=>setReadingTab(id)}>{label}</button>)}
        </div>
        <LayerReading chart={chart} activeTab={readingTab}/>
        <p className="book-footnote">{chart.dual_layer?.boundary}</p>
        <section className="book-ai">
          <h3>以卦问事 · 深入解读</h3>
          <p>免费易理解读已在上方呈现。要结合你当下的真实处境分析，可再补充一次背景后调用 AI；若尚未配置模型密钥，仍可阅读完整基础卦解。</p>
          <details className="my-3 text-sm text-moss">
            <summary>AI 访问码（站长设置后才需要）</summary>
            <input type="password" autoComplete="off" className="field mt-2" value={aiAccessCode}
              onChange={e=>setAiAccessCode(e.target.value)} placeholder="如未设置访问码，可留空"/>
          </details>
          <button className="book-main-action" disabled={busy} onClick={()=>{
            if(!backgroundAsked || !background.trim()) {setBackgroundOpen(true);return}
            submit(true,manualOverride,true,observationOverride)
          }}>{busy?'正在解读…':'结合现实背景 · 深入断事'}</button>
          {error && <p role="alert" className="book-alert mt-4">{error}</p>}
          {interpretation && <div className="book-generated">{interpretation}</div>}
        </section>
        <div className="book-page-footer">
          <span className="book-page-mark">第三折 · 自此观境察势</span>
          <div className="book-pagenav">
            <button className="book-second-action" onClick={()=>goPage(1)}>← 再看卦象</button>
            <button className="book-main-action" onClick={()=>goPage(0)}>重新起卦 ↻</button>
          </div>
        </div>
      </section>}
      </div>
      <footer className="book-epilogue">梅花心易 · 心念起卦，观境察势　｜　传统卦象仅作文化研究与反思参考，不作确定性预测</footer>
    </div>
    {manualOpen && <ManualDialog problem={manualProblem} draft={manualDraft} setDraft={setManualDraft}
      error={manualError} onClose={() => setManualOpen(false)} onConfirm={confirmManual} busy={busy}/>}
    {observationOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17231e]/65 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="observation-title" className="book-modal w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 md:p-8">
        <p className="text-xs tracking-widest text-moss">心易 · 万物皆可起卦</p>
        <h2 id="observation-title" className="mt-2 font-serif text-2xl">确认这次怎样取数</h2>
        <p className="mt-3 text-sm leading-7 text-moss">{observationProblem?.message || '用什么起卦由你决定，但要留下取数依据。自定数只是一种明确约定，不冒充所有情境都有唯一古法。'}</p>
        <p className="mt-3 text-sm text-ink">起卦契机：<b>{value}</b></p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <label className="text-sm text-moss">上卦取数
            <input className="field mt-2" inputMode="numeric" type="number" min="1" max="99999999" value={observationDraft.first} onChange={e => setObservationDraft(d => ({...d, first:e.target.value}))} placeholder="例如 3"/>
          </label>
          <label className="text-sm text-moss">下卦取数
            <input className="field mt-2" inputMode="numeric" type="number" min="1" max="99999999" value={observationDraft.second} onChange={e => setObservationDraft(d => ({...d, second:e.target.value}))} placeholder="例如 5"/>
          </label>
        </div>
        <label className="block mt-4 text-sm text-moss">这两个数从何而来？
          <textarea className="field mt-2 h-24 resize-y" maxLength={300} value={observationDraft.reason} onChange={e => setObservationDraft(d => ({...d, reason:e.target.value}))} placeholder="例如：窗外传来三声鸟叫，随后看见五个窗格，所以取3和5"/>
        </label>
        <p className="text-xs leading-6 mt-3 text-moss">这两个数按先天八卦序数分别取上、下卦，动爻按两数之和取余六。其他取数法可以以后扩展，不会自动乱套。</p>
        {observationError && <p className="mt-3 text-sm text-red-700" role="alert">{observationError}</p>}
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className="rounded-xl bg-moss text-white px-6 py-3" onClick={confirmObservation}>确认取数并排盘</button>
          <button type="button" className="rounded-xl border border-moss/50 text-moss px-5 py-3" onClick={() => setObservationOpen(false)}>取消</button>
        </div>
      </section>
    </div>}
    {backgroundOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17231e]/65 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="bg-title" className="book-modal w-full max-w-xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        <p className="text-xs tracking-widest text-moss">观境察势 · 只追问一次</p>
        <h2 id="bg-title" className="mt-2 font-serif text-2xl">卦已排好，请补充现实背景</h2>
        <p className="mt-3 text-sm text-moss">排盘不受影响。只有补充了背景，AI 才进入具体断事。若有起卦时亲眼见到的外应，可以一并说明；没有则不必填写。</p>
        <label className="block mt-5 text-moss text-sm">
          <span className="block mb-3 font-medium text-ink">{followupQuestion(question)}</span>
          <textarea autoFocus maxLength={1200} className="field h-36 resize-y" placeholder="描述你确定知道的现状；不清楚的可以说明不知道" value={background} onChange={e => setBackground(e.target.value)}/>
        </label>
        {backgroundError && <p className="text-red-700 text-sm mt-2" role="alert">{backgroundError}</p>}
        <div className="flex gap-3 flex-wrap mt-5">
          <button type="button" disabled={busy} className="rounded-xl bg-moss text-white px-6 py-3 disabled:opacity-50" onClick={() => {
            if (background.trim().length < 2) { setBackgroundError('请补充当前情况；也可以说明哪些情况暂时不清楚。'); return }
            setBackgroundOpen(false)
            setBackgroundAsked(true)
            submit(true, manualOverride, true)
          }}>确认背景，开始解读</button>
          <button type="button" className="rounded-xl border border-moss/50 text-moss px-5 py-3" onClick={() => setBackgroundOpen(false)}>暂不解卦</button>
        </div>
        <p className="text-xs text-moss/75 mt-4">背景由求测者提供，未经系统核实。不会因为卦象与陈述不符就认定有人说谎。</p>
      </section>
    </div>}
  </main>
}