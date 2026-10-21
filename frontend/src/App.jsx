import { useState } from 'react'

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
  return <div className="flex flex-col gap-2 items-center py-5" aria-label="六爻，自上而下展示">
    {[...lines].map((bit, i) => ({ bit, yao: i + 1 })).reverse().map(({ bit, yao }) =>
      <div key={yao} className={`flex items-center gap-3 ${moving === yao ? 'text-amber-700' : 'text-ink'}`}>
        <div className="w-6 text-right text-xs">{moving === yao ? '动' : ''}</div>
        <div className="w-24 flex items-center gap-2 h-3">
          {bit === 1
            ? <div className="h-2 bg-current w-full rounded-sm" />
            : <><div className="h-2 bg-current w-1/2 rounded-sm"/><div className="h-2 bg-current w-1/2 rounded-sm"/></>}
        </div>
        <div className="w-6 text-xs">{yao}</div>
      </div>
    )}
  </div>
}

function HexCard({ name, data, moving }) {
  return <div className="rounded-2xl border border-[#d4dbd0] bg-white/70 px-3 py-5 text-center shadow-sm">
    <div className="text-xs tracking-[0.25em] text-moss/70">{name}</div>
    <h3 className="mt-2 font-serif text-2xl leading-snug text-ink">{data.full_name || data.name}</h3>
    {data.keywords && <p className="mt-2 text-sm font-medium text-moss">{data.keywords}</p>}
    <p className="mt-1 text-sm text-moss">{data.upper.name}上 · {data.lower.name}下</p>
    <SixLines lines={data.lines_bottom_to_top} moving={moving} />
    <p className="text-xs text-moss">{data.upper.element} / {data.lower.element}</p>
    {data.meaning && <div className="mt-4 border-t border-[#e3e7df] pt-4 text-left">
      <p className="text-xs tracking-widest text-moss mb-2">卦象大意</p>
      <p className="text-sm leading-7 text-ink/85">{data.meaning}</p>
    </div>}
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
      className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-rice px-6 py-6 shadow-2xl md:px-8">
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
    if (!confirmedContext) setChart(null)
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

  return <main className="min-h-screen bg-rice text-ink">
    <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_80%_10%,rgba(130,153,125,.16),transparent_55%)]" />
    <div className="relative max-w-5xl mx-auto px-5 py-10 md:py-16">
      <header className="flex flex-wrap justify-between items-start gap-4 border-b border-[#cad4c8] pb-7">
        <div>
          <p className="text-xs tracking-[.4em] text-moss">MEIHUA · YISHU</p>
          <h1 className="font-serif mt-3 text-4xl md:text-5xl">梅花 · 以象观心</h1>
          <p className="mt-3 text-sm text-moss">阴阳取数 · 代码排盘 · 借卦照心</p>
        </div>
        <div className="rounded-full border border-moss/30 px-4 py-2 text-xs text-moss">外阳内阴 · 不凭空猜数</div>
      </header>
      <section className="mt-8 rounded-3xl border border-[#d4dbd0] bg-white/70 p-5 md:p-8 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="block mb-2 text-sm text-moss">你想问什么</span>
            <textarea className="field h-24 resize-y" maxLength={1000} placeholder="把你现在真正想问的事情写在这里…" value={question} onChange={e => { setQuestion(e.target.value); setBackgroundAsked(false); setBackground(""); clearResult() }}/>
          </label>
          <label><span className="block mb-2 text-sm text-moss">你想用什么起卦？</span>
            <textarea rows={2} maxLength={500} className="field resize-y" value={value} onChange={e => { setValue(e.target.value); setManualOverride(null); setObservationOverride(null); setBackgroundAsked(false); setBackground(""); clearResult() }} placeholder="明、迷茫、3、3,6，或写下看到听到的事情…" />
            <span className="mt-2 block text-xs leading-5 text-moss/80">字、数字、声音、事物、偶然见闻，都可以作为起卦契机。</span>
          </label>
          <label><span className="block mb-2 text-sm text-moss">起卦时间（可以手动修改）</span>
            <input className="field" type="datetime-local" value={dateValue} onChange={e => { setDateValue(e.target.value); setManualOverride(null); setObservationOverride(null); setBackgroundAsked(false); setBackground(""); clearResult() }}/>
          </label>
          <label className="md:col-span-2 text-sm text-moss">独体字阴数方案
            <select value={independentYin} onChange={e => { setIndependentYin(e.target.value); setManualOverride(null); setObservationOverride(null); setBackgroundAsked(false); setBackground(""); clearResult() }} className="field mt-2 md:max-w-lg">
              <option value="one">默认取 1（推荐）</option>
              <option value="hour">取所选时辰数（子=1，亥=12）</option>
            </select>
          </label>
        </div>
        <details className="mt-5 text-sm text-moss"><summary className="cursor-pointer select-none">AI 解卦访问码（站长设置后才需要）</summary><input type="password" autoComplete="off" className="field mt-2 md:max-w-lg" placeholder="可选，不保存在网站中" value={aiAccessCode} onChange={e => setAiAccessCode(e.target.value)}/></details>
        <div className="flex flex-wrap gap-3 mt-6 items-center">
          <button className="rounded-xl bg-moss text-white py-3 px-7 disabled:opacity-40" onClick={() => submit(false)} disabled={busy || !question.trim() || !value.trim()}>仅排盘</button>
          <button className="rounded-xl border border-moss text-moss py-3 px-7 disabled:opacity-40" onClick={() => submit(true)} disabled={busy || !question.trim() || !value.trim()}>排盘 + AI 解读</button>
          {[...value.trim()].length === 1 && /[\u3400-\u9fff]/u.test(value.trim()) &&
            <button className="text-sm text-moss px-2 py-2 underline underline-offset-4" type="button" onClick={() => openManual(null, false)} disabled={busy}>手动确认拆字</button>}
          <button className="text-sm text-moss px-2 py-2 underline underline-offset-4" type="button" onClick={() => openObservation(null, false)} disabled={busy || !value.trim()}>自定取数</button>
          <button className="text-sm text-moss px-2 py-2" type="button" onClick={() => { setDateValue(localInput(new Date())); setManualOverride(null); clearResult() }}>刷新为当前时间</button>
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
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 text-red-700 p-4">{error}</p>}
      </section>
      {chart && <section className="mt-8">
        <div className="flex flex-wrap justify-between gap-4 items-end mb-5">
          <div><p className="text-xs tracking-widest text-moss">排盘结果</p><h2 className="font-serif text-2xl mt-2">由规则精确推导</h2></div>
          <div className="text-sm text-moss">动爻：第 {chart.dong_yao} 爻 · 体：{chart.ti_gua.name}{chart.ti_gua.element} · 用：{chart.yong_gua.name}{chart.yong_gua.element}</div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <HexCard name="本卦" data={chart.ben_gua} moving={chart.dong_yao} />
          <HexCard name="互卦" data={chart.hu_gua} />
          <HexCard name="变卦" data={chart.bian_gua} />
        </div>
        <BasicReading chart={chart}/>
        <NumberExplanation chart={chart}/>
        <div className="mt-4 rounded-xl bg-pale p-5 text-moss"><b>体用：</b>{chart.sheng_ke}（体：{chart.ti_gua.name}/{chart.ti_gua.element}，用：{chart.yong_gua.name}/{chart.yong_gua.element}）</div>
      </section>}
      {interpretation && <section className="mt-8 bg-white/80 rounded-3xl p-6 md:p-8 border border-[#d4dbd0]">
        <h2 className="font-serif text-2xl">卦象解读</h2><div className="mt-5 whitespace-pre-wrap leading-8 text-ink/85">{interpretation}</div>
      </section>}
      <footer className="mt-12 text-xs text-moss/80 leading-6 border-t border-[#cad4c8] pt-6">本工具以传统文化为启发提供反思与决策参考，不作确定性预测，不替代专业意见。</footer>
    </div>
    {manualOpen && <ManualDialog problem={manualProblem} draft={manualDraft} setDraft={setManualDraft}
      error={manualError} onClose={() => setManualOpen(false)} onConfirm={confirmManual} busy={busy}/>}
    {observationOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17231e]/65 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="observation-title" className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-rice p-6 shadow-2xl md:p-8">
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
      <section role="dialog" aria-modal="true" aria-labelledby="bg-title" className="w-full max-w-xl rounded-3xl bg-rice p-6 shadow-2xl md:p-8 max-h-[90vh] overflow-y-auto">
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