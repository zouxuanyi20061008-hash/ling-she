import { createContext, useContext, useEffect, useState } from 'react'
import HomeDiorama from './HomeDiorama.jsx'
import './home-challenge.css'

const PROGRESS_KEY = 'lingshe.home-challenges.v1'
const ProgressContext = createContext(null)

export function HomeChallengeProvider({ children }) {
  const [progress, setProgress] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY))
      return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
    } catch {
      // The challenges remain playable when browser storage is unavailable.
    }
  }, [progress])

  return <ProgressContext.Provider value={{ progress, setProgress }}>{children}</ProgressContext.Provider>
}

export function useHomeChallengeProgress() {
  return useContext(ProgressContext).progress
}

export function useHomeChallenge(id, levels) {
  const { progress, setProgress } = useContext(ProgressContext)
  const total = levels.length
  const saved = progress[id]?.checkpoint
  const checkpoint = Number.isInteger(saved) ? Math.max(0, Math.min(saved, total)) : 0
  const completed = checkpoint === total
  const index = Math.min(checkpoint, total - 1)
  const level = levels[index]
  const [attempt, setAttempt] = useState(null)
  const [hintShown, setHintShown] = useState(false)
  const picked = completed ? level.answer : attempt
  const solved = completed || picked === level.answer

  function goTo(next) {
    setAttempt(null)
    setHintShown(false)
    setProgress(current => ({
      ...current,
      [id]: { checkpoint: next, cleared: next === total || current[id]?.cleared === true },
    }))
  }

  return {
    index, total, level, picked, solved, completed, hintShown,
    choose(value) {
      if (!completed) setAttempt(previous => previous === level.answer ? previous : value)
    },
    toggleHint() { setHintShown(visible => !visible) },
    advance() { if (solved && !completed) goTo(checkpoint + 1) },
    reset() { goTo(0) },
  }
}

export function HomeChallengeHeading({ trial }) {
  const { completed, index, total, level } = trial
  return <div className="home-challenge-heading">
    <div className="home-challenge-title">
      <h3 className="home-experience-play" tabIndex={-1}>{completed ? '挑战通关' : level.title}</h3>
      <span className="home-challenge-progress" data-completed={completed || undefined}>
        <span>{completed ? `已完成 ${total} 关` : `第 ${index + 1} / ${total} 关`}</span>
        <span className="home-challenge-marks" aria-hidden="true">
          {Array.from({ length: total }, (_, position) => <i key={position}
            data-cleared={completed || position < index || undefined}
            data-current={!completed && position === index || undefined} />)}
        </span>
      </span>
    </div>
    {!completed && <p className="home-experience-prompt">{level.prompt}</p>}
  </div>
}

export function HomeChallengeFeedback({ trial, summary, feedback, check, onReplay }) {
  const { completed, solved, picked, level, hintShown, index, total } = trial
  const state = completed ? 'complete' : solved ? 'correct' : picked === null ? 'ready' : 'retry'
  const explanation = solved ? level.success : picked === null ? level.intro : level.retry

  function startRound(event, update) {
    const heading = event.currentTarget.closest('.home-experience-page')?.querySelector('.home-experience-play')
    const keyboard = event.detail === 0
    update()
    if (!heading) return
    requestAnimationFrame(() => {
      if (!heading.isConnected) return
      if (keyboard) heading.focus({ preventScroll: true })
      if (heading.getBoundingClientRect().top < 12) heading.scrollIntoView?.({ block: 'start', behavior: 'instant' })
    })
  }

  return <div className="home-challenge-panel" data-state={state}>
    <div className="home-experience-feedback" role="status" aria-atomic="true">
      {completed ? <><strong>通关了</strong><span>{summary}</span></> : <>
        {feedback ?? explanation}
        {hintShown && !solved && <span className="home-challenge-hint"><strong>提示　</strong>{level.hint}</span>}
      </>}
    </div>
    <div className="home-challenge-actions">
      {completed ? <button type="button" data-primary onClick={event => startRound(event, () => { trial.reset(); onReplay?.() })}>再玩一次</button>
        : solved ? <button type="button" data-primary onClick={index + 1 === total ? trial.advance : event => startRound(event, trial.advance)}>{index + 1 === total ? '完成挑战' : '下一关'}</button>
          : <>
            <button type="button" aria-expanded={hintShown} onClick={trial.toggleHint}>{hintShown ? '收起提示' : '看提示'}</button>
            {check && <button type="button" data-primary onClick={check}>检查合卦</button>}
          </>}
    </div>
  </div>
}

export function HomeChallengeGame({ scene, trial, summary, scenery, scenePicked, sceneSolved, feedback, children }) {
  return <>
    <HomeChallengeHeading trial={trial} />
    <HomeDiorama kind={scene} picked={scenePicked ?? trial.picked} solved={sceneSolved ?? trial.solved} scenery={scenery}>
      {children}
    </HomeDiorama>
    <HomeChallengeFeedback trial={trial} summary={summary} feedback={feedback} />
  </>
}

export function HomePick({ label, value, answer, picked, onPick, children, style, disabled }) {
  const selected = picked === value
  return <button type="button" className="home-experience-pick" style={style} disabled={disabled}
    aria-label={label} aria-pressed={selected} data-correct={selected && value === answer || undefined}
    onClick={() => onPick(value)}>{children}</button>
}
