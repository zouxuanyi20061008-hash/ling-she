import { useEffect, useRef, useState } from 'react'
import { playAcademySound } from './academySound.js'
import { PRACTICE_METHODS } from './practiceMethods.js'
import { FOUNDATION_CASES } from './learningCasesFoundations.js'
import { STAR_LAND_CASES } from './learningCasesStarLand.js'
import { REN_YI_CASES } from './learningCasesRenYi.js'
import './learning-routes.css'

const CASES = { ...FOUNDATION_CASES, ...STAR_LAND_CASES, ...REN_YI_CASES }
const MODES = ['guided', 'solo']
const KEY_PREFIX = 'lingshe.learning-cases.v1:'

function loadAttempts() {
  return Object.fromEntries(PRACTICE_METHODS.map(({id}) => {
    let stored
    try { stored = JSON.parse(localStorage.getItem(KEY_PREFIX + id)) } catch {}
    const attempts = Object.fromEntries(MODES.map((mode, index) => {
      const steps = CASES[id][index].steps
      const attempt = stored?.[mode]
      const valid = Array.isArray(attempt?.answers)
        && attempt.answers.length <= steps.length
        && attempt.answers.every((choice, step) => Number.isInteger(choice)
          && choice >= 0 && choice < steps[step].options.length
          && (mode === 'solo' || choice === steps[step].answer))
      return [mode, {answers: valid ? attempt.answers : [], passed: attempt?.passed === true}]
    }))
    return [id, attempts]
  }))
}

function optionLabel(option) {
  return typeof option === 'string' ? option : option.label
}

export default function LearningRoutes({activeIndex, onIndexChange}) {
  const [attempts, setAttempts] = useState(loadAttempts)
  const method = PRACTICE_METHODS[activeIndex]
  const passedCount = PRACTICE_METHODS.filter(({id}) => attempts[id].solo.passed).length

  function updateAttempt(mode, attempt) {
    const methodAttempts = {...attempts[method.id], [mode]: attempt}
    setAttempts({...attempts, [method.id]: methodAttempts})
    try { localStorage.setItem(KEY_PREFIX + method.id, JSON.stringify(methodAttempts)) } catch {}
  }

  return <section className="learning-routes" aria-label="八门完整演练">
    <div className="learning-route-directory">
      <select aria-label="选择要演练的术数" value={activeIndex}
        onChange={event => onIndexChange(Number(event.target.value))}>
        {PRACTICE_METHODS.map(({id, name}, index) => (
          <option key={id} value={index}>{name}{attempts[id].solo.passed ? ' · 已通过' : ''}</option>
        ))}
      </select>
    </div>
    <CaseSession key={method.id} scenarios={CASES[method.id]} attempts={attempts[method.id]} onUpdate={updateAttempt}/>
    <p className="learning-route-completion">独立通过 {passedCount}/{PRACTICE_METHODS.length} 门</p>
  </section>
}

function CaseSession({scenarios, attempts, onUpdate}) {
  const [mode, setMode] = useState(() => attempts.guided.passed || attempts.solo.answers.length ? 'solo' : 'guided')
  const [choice, setChoice] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [showHint, setShowHint] = useState(false)
  const [reviewIndex, setReviewIndex] = useState(null)
  const title = useRef(null)
  const previousScreen = useRef(null)
  const guided = mode === 'guided'
  const scenario = scenarios[guided ? 0 : 1]
  const {steps} = scenario
  const {answers, passed} = attempts[mode]
  const position = answers.length
  const complete = position === steps.length
  const review = complete && reviewIndex !== null
  const activeStep = review ? reviewIndex : position
  const step = steps[activeStep]
  const screen = `${mode}:${review ? 'review' : 'play'}:${activeStep}`

  useEffect(() => {
    if (previousScreen.current !== null && previousScreen.current !== screen) {
      title.current?.focus({preventScroll: true})
    }
    previousScreen.current = screen
  }, [screen])

  function resetStep() {
    setChoice(null)
    setFeedback(null)
    setShowHint(false)
  }

  function switchMode(next) {
    if (next === mode) return
    setMode(next)
    resetStep()
    setReviewIndex(null)
  }

  function submitStep() {
    if (choice === null) return
    if (guided && feedback !== 'correct') {
      const correct = choice === step.answer
      playAcademySound(correct ? 'success' : 'tap')
      setFeedback(correct ? 'correct' : 'retry')
      setShowHint(false)
      return
    }
    const next = [...answers, choice]
    const cleared = next.length === steps.length && next.every((answer, index) => answer === steps[index].answer)
    playAcademySound(!guided && cleared ? 'success' : 'tap')
    onUpdate(mode, {answers: next, passed: passed || cleared})
    resetStep()
  }

  function restart() {
    resetStep()
    setReviewIndex(null)
    onUpdate(mode, {answers: [], passed})
  }

  const checkCount = complete ? answers.filter((answer, index) => answer === steps[index].answer).length : 0
  const fullScore = checkCount === steps.length
  const endMessage = guided ? '跟做完成' : fullScore ? '独立实战通过' : '独立实战已交卷'
  const evidence = answers.slice(0, review ? reviewIndex : position).flatMap((answer, index) => {
    const previous = steps[index]
    if (previous.phase === '解盘') return []
    return [(guided || review) && answer === previous.answer && previous.record
      ? previous.record : optionLabel(previous.options[answer])]
  })
  const reviewAnswer = review ? answers[reviewIndex] : null
  const showPremise = !complete && position === 0 && feedback !== 'correct'
  const showNotes = (!complete || review) && feedback !== 'correct'

  return <>
    <div className="learning-route-modes" role="group" aria-label="演练方式">
      <button type="button" aria-pressed={guided} onClick={() => switchMode('guided')}>
        跟做一遍{attempts.guided.passed && <span aria-label="已完成">✓</span>}
      </button>
      <button type="button" aria-pressed={!guided} onClick={() => switchMode('solo')}>
        独立实战{attempts.solo.passed && <span aria-label="已通过">✓</span>}
      </button>
    </div>
    <article className="learning-case">
      <header className="learning-case-header">
        <h3>{scenario.title}</h3>
        <span>{complete ? (review ? '复盘' : '结果') : `${step.phase} · ${activeStep + 1}/${steps.length}`}</span>
      </header>
      {showPremise && <p className="learning-case-premise">{scenario.premise}</p>}
      {showNotes && (!showPremise || scenario.reference || evidence.length > 0) && (
        <div className="learning-case-notes">
          {(!showPremise || scenario.reference) && <details key={`data-${screen}`}>
            <summary>{showPremise ? '查资料' : '看题设'}</summary>
            {!showPremise && <p>{scenario.premise}</p>}
            {scenario.reference && <p>{scenario.reference}</p>}
          </details>}
          {evidence.length > 0 && <details key={`notes-${screen}`}>
            <summary>{guided || review ? '查看已排盘面' : '查看已填盘面'}</summary>
            <ol>{evidence.map((entry, index) => <li key={index}>{entry}</li>)}</ol>
          </details>}
        </div>
      )}
      {review ? <>
        <label className="learning-review-selector">
          查看步骤
          <select value={reviewIndex} onChange={event => setReviewIndex(Number(event.target.value))}>
            {steps.map(({phase, answer}, index) => (
              <option key={index} value={index}>{index + 1}. {phase} · {answers[index] === answer ? '正确' : '待巩固'}</option>
            ))}
          </select>
        </label>
        <h4 className="learning-case-question" tabIndex={-1} ref={title}>{step.prompt}</h4>
        {step.reference && <p className="learning-case-reference">{step.reference}</p>}
        <div className="learning-case-review">
          <p><strong>你的选择</strong> {optionLabel(step.options[reviewAnswer])}</p>
          {reviewAnswer !== step.answer && <p><strong>正确依据</strong> {optionLabel(step.options[step.answer])}</p>}
          <p>{step.why}</p>
        </div>
        <div className="learning-case-actions">
          <button type="button" onClick={() => setReviewIndex(null)}>回结果</button>
          {reviewIndex + 1 < steps.length && <button type="button" onClick={() => setReviewIndex(reviewIndex + 1)}>下一步讲解</button>}
        </div>
      </> : complete ? <>
        <h4 className="learning-case-question" tabIndex={-1} ref={title}>{endMessage}</h4>
        {!guided && <p className="learning-case-score">答对 <strong>{checkCount}/{steps.length}</strong> 步</p>}
        <p className="learning-case-takeaway">{scenario.takeaway}</p>
        <div className="learning-case-actions">
          <button type="button" onClick={() => setReviewIndex(guided || fullScore ? 0 : steps.findIndex((item, index) => item.answer !== answers[index]))}>逐步看讲解</button>
          {guided ? <button type="button" onClick={() => switchMode('solo')}>开始独立实战</button>
            : <button type="button" onClick={restart}>重做本题</button>}
        </div>
      </> : <>
        <h4 className="learning-case-question" tabIndex={-1} ref={title}>{step.prompt}</h4>
        {step.reference && !showHint && feedback !== 'correct' && <p className="learning-case-reference">{step.reference}</p>}
        {showHint && <p className="learning-case-reference">{step.hint}</p>}
        {feedback === 'correct' ? <p className="learning-case-record">
          <span aria-hidden="true">✓</span> {step.record || optionLabel(step.options[choice])}
        </p> : <div className="learning-case-options" role="group" aria-label="选择盘面或判断依据">
          {step.options.map((option, index) => <button type="button" key={index}
            aria-pressed={choice === index}
            onClick={() => {setChoice(index);setFeedback(null)}}>
            {optionLabel(option)}
          </button>)}
        </div>}
        {feedback && <p className="learning-case-feedback" data-result={feedback} role="status">
          {feedback === 'correct' ? step.why : '这一步还没对上。换一个选项，也可以先看提示。'}
        </p>}
        <div className="learning-case-actions">
          {guided && feedback !== 'correct' && <button type="button" aria-expanded={showHint}
            onClick={() => setShowHint(!showHint)}>{showHint ? '收起提示' : '看提示'}</button>}
          <button type="button" data-academy-sound="silent" disabled={choice === null} onClick={submitStep}>
            {guided
              ? feedback !== 'correct' ? '核对这步' : position + 1 < steps.length ? '下一步' : '完成跟做'
              : position + 1 < steps.length ? '确认并继续' : '交卷看结果'}
          </button>
        </div>
      </>}
    </article>
    {complete && guided && !review && <button className="learning-case-restart" type="button" onClick={restart}>再跟练一遍</button>}
  </>
}
