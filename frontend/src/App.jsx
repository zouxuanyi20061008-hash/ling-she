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
    <h3 className="mt-2 font-serif text-2xl text-ink">{data.name}</h3>
    <p className="mt-1 text-sm text-moss">{data.upper.name}上 · {data.lower.name}下</p>
    <SixLines lines={data.lines_bottom_to_top} moving={moving} />
    <p className="text-xs text-moss">{data.upper.element} / {data.lower.element}</p>
  </div>
}

function NumberExplanation({ chart }) {
  const origin = chart.origin
  const upper = chart.method_numbers.upper
  const lower = chart.method_numbers.lower
  const isCharacter = origin.method?.startsWith('hanzi')
  const upLabel = isCharacter ? '阳部 · 上卦' : '第一数 · 上卦'
  const downLabel = isCharacter ? '阴部 · 下卦' : '第二数 / 时辰 · 下卦'
  return <div className="mt-5 rounded-2xl border border-[#cad4c8] bg-white/80 p-5 md:p-7">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-serif text-2xl">阴阳取数 · 可核对的计算过程</h3>
      <span className="rounded-full bg-pale px-3 py-1 text-xs text-moss">{origin.structure || '数字起卦'}</span>
    </div>
    <p className="mt-2 text-sm leading-6 text-moss">{origin.yin_yang_rule || '阳数作上卦，阴数作下卦'}。{origin.ids && `原始 IDS：${origin.ids}`}</p>
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
  const [question, setQuestion] = useState('最近是否适合开始一个新项目？')
  const [value, setValue] = useState('明')
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
  async function submit(withAi, override = manualOverride) {
    setBusy(true)
    setError('')
    setInterpretation('')
    setChart(null)
    const datetime = new Date(dateValue)
    if (Number.isNaN(datetime.getTime())) {
      setError('请输入有效日期和时间'); setBusy(false); return
    }
    const req = { question, value, time_iso: localIsoWithOffset(datetime), independent_yin: independentYin }
    if (override) {
      req.manual_first = override.yang
      req.manual_second = override.yin
      req.manual_structure = override.structure
      req.manual_yang_part = override.yangPart
      req.manual_yin_part = override.yinPart
    }
    try {
      const response = await fetch(`${ApiUrl}${withAi ? '/api/interpret' : '/api/cast'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(withAi && aiAccessCode ? { 'X-AI-Access-Code': aiAccessCode } : {}) }, body: JSON.stringify(req)
      })
      const data = await response.json()
      if (!response.ok) {
        const detail = data.detail
        if (detail?.code === 'MANUAL_REQUIRED') {
          openManual(detail, withAi)
          return
        }
        throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail || '请求失败'))
      }
      setChart(withAi ? data.chart : data)
      if (withAi) setInterpretation(data.interpretation)
    } catch (e) {
      setError(e.message || '网络错误')
    } finally { setBusy(false) }
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
    setManualOpen(false)
    submit(pendingAi, override)
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
            <span className="block mb-2 text-sm text-moss">你想探讨的问题</span>
            <textarea className="field h-24 resize-y" maxLength={1000} value={question} onChange={e => setQuestion(e.target.value)}/>
          </label>
          <label><span className="block mb-2 text-sm text-moss">起卦输入（单字 / 一个数字 / 两个数字）</span>
            <input className="field" value={value} onChange={e => { setValue(e.target.value); setManualOverride(null); clearResult() }} placeholder="明 / 迷 / 王 / 3 / 3,6" />
          </label>
          <label><span className="block mb-2 text-sm text-moss">起卦时间（可以手动修改）</span>
            <input className="field" type="datetime-local" value={dateValue} onChange={e => { setDateValue(e.target.value); setManualOverride(null); clearResult() }}/>
          </label>
          <label className="md:col-span-2 text-sm text-moss">独体字阴数方案
            <select value={independentYin} onChange={e => { setIndependentYin(e.target.value); setManualOverride(null); clearResult() }} className="field mt-2 md:max-w-lg">
              <option value="one">默认取 1（推荐）</option>
              <option value="hour">取所选时辰数（子=1，亥=12）</option>
            </select>
          </label>
        </div>
        <details className="mt-5 text-sm text-moss"><summary className="cursor-pointer select-none">AI 解卦访问码（站长设置后才需要）</summary><input type="password" autoComplete="off" className="field mt-2 md:max-w-lg" placeholder="可选，不保存在网站中" value={aiAccessCode} onChange={e => setAiAccessCode(e.target.value)}/></details>
        <div className="flex flex-wrap gap-3 mt-6 items-center">
          <button className="rounded-xl bg-moss text-white py-3 px-7 disabled:opacity-40" onClick={() => submit(false)} disabled={busy || !question.trim() || !value.trim()}>仅排盘</button>
          <button className="rounded-xl border border-moss text-moss py-3 px-7 disabled:opacity-40" onClick={() => submit(true)} disabled={busy || !question.trim() || !value.trim()}>排盘 + AI 解读</button>
          <button className="text-sm text-moss px-2 py-2 underline underline-offset-4" type="button" onClick={() => openManual(null, false)} disabled={busy}>手动确认拆字</button>
          <button className="text-sm text-moss px-2 py-2" type="button" onClick={() => { setDateValue(localInput(new Date())); setManualOverride(null); clearResult() }}>刷新为当前时间</button>
        </div>
        {manualOverride && <p className="mt-3 text-sm text-amber-800">当前使用人工确认：阳 {manualOverride.yang} 画，阴 {manualOverride.yin} 画。
          <button className="ml-2 underline" type="button" onClick={() => { setManualOverride(null); clearResult() }}>恢复自动拆字</button></p>}
        <p className="text-xs leading-6 text-moss/80 mt-5">
          左右：左阳右阴；上下：上阳下阴；包围：外阳内阴；独体：整字为阳、1 或时辰为阴。结构与笔画不能可靠确认时，自动弹窗要求人工输入。
          本工具采用简体常用笔画口径，辶与艹均按 3 画。
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
  </main>
}