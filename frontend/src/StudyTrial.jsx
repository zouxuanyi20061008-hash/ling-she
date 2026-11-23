import { useEffect, useRef, useState } from 'react'
import { EIGHT_TRIGRAMS } from './casting-lessons.js'

const ROUND_SIZE=5
const ANSWER_KEYS=['甲','乙','丙','丁']
const INSTRUCTIONS={choice:'选一张答案卡',board:'点一个格子',order:'按顺序点卡片，再核对'}

function TrialChallenge({challenge,lesson,onGrade,onRetry,onLesson,onAdvance,advanceLabel}){
  const [selection,setSelection]=useState([])
  const [result,setResult]=useState(null)
  const explanation=useRef(null)
  const ordered=challenge.type==='order'
  const board=challenge.type==='board'
  const answered=result!==null

  function grade(selected){
    const right=ordered
      ? challenge.answer.every((option,index)=>option===selected[index])
      : challenge.answer===selected[0]
    setSelection(selected)
    setResult(right)
    onGrade(right)
  }

  useEffect(()=>{
    if(answered)explanation.current?.scrollIntoView?.({block:'nearest',behavior:'instant'})
  },[answered])

  return <>
    <p className="library-trial-instructions">{INSTRUCTIONS[challenge.type]}</p>
    <h2>{challenge.question}</h2>
    {challenge.context&&<p className="library-trial-context">{challenge.context}</p>}
    {ordered&&<ol className="library-trial-order" aria-label="已选顺序" aria-live="polite">
      {challenge.options.map((_,step)=><li key={step}><span>{step+1}</span>{challenge.options[selection[step]]??'待选'}</li>)}
    </ol>}
    <div className={'library-quiz-options'+(board?' library-trial-board':'')}
      role="group" aria-label={board?'答题盘':ordered?'顺序卡片':'答案卡片'}
      style={board?{'--trial-columns':challenge.columns??3}:undefined}>
      {challenge.options.map((option,i)=>{
        const place=selection.indexOf(i)
        const correct=answered&&!ordered&&i===challenge.answer
        const wrong=answered&&!ordered&&place!==-1&&!correct
        const trigram=board&&EIGHT_TRIGRAMS.find(({symbol})=>option.startsWith(symbol))
        return <button type="button" key={option} disabled={answered||(ordered&&place!==-1)}
          className={correct?'right':wrong?'wrong':place!==-1?'picked':''}
          aria-label={trigram?option:undefined}
          onClick={()=>ordered?setSelection(current=>current.includes(i)?current:[...current,i]):grade([i])}>
          {!board&&<span className="library-answer-key" aria-hidden="true">{ordered?(place===-1?'＋':place+1):ANSWER_KEYS[i]??i+1}</span>}
          <span className="library-answer-copy">
            {trigram?<><span className="library-trial-trigram" aria-hidden="true">
              {[...trigram.lines].reverse().map((yang,line)=><i key={line} data-yin={!yang}/>)}</span>
              {option.slice(trigram.symbol.length).trim()}</>:option}
            {correct&&<small className="library-answer-state">{place===-1?'正确答案':'答对了'}</small>}
            {wrong&&<small className="library-answer-state">你选了这项</small>}
          </span>
        </button>
      })}
    </div>
    {ordered&&!answered&&<div className="library-trial-order-actions">
      <button type="button" className="library-action secondary" disabled={!selection.length}
        onClick={()=>setSelection(current=>current.slice(0,-1))}>撤回一步</button>
      <button type="button" className="library-action" disabled={selection.length!==challenge.options.length}
        onClick={()=>grade(selection)}>核对顺序</button>
    </div>}
    {!answered&&challenge.hint&&<details className="library-trial-hint">
      <summary>给我一点提示</summary><p>{challenge.hint}</p>
    </details>}
    {answered&&<div ref={explanation} className="library-quiz-explanation" data-correct={result} role="status">
      <b>{result?'答对了！':'看看这一题的解法'}</b>
      {ordered&&!result&&<ol className="library-trial-solution">
        {challenge.answer.map(i=><li key={i}>{challenge.options[i]}</li>)}
      </ol>}
      <p>{challenge.why}</p>
    </div>}
    {answered&&<details className="library-trial-hint">
      <summary>回顾本课 · {lesson.title}</summary>
      {lesson.paragraphs.map(p=><p key={p}>{p}</p>)}
      <button type="button" className="library-action secondary" onClick={onLesson}>打开本课</button>
    </details>}
    <div className="library-quiz-actions library-trial-actions">
      {answered&&<button type="button" className="library-action secondary" onClick={onRetry}>
        {result?'再玩一次':'再试一次'}
      </button>}
      {advanceLabel&&<button type="button" className="library-action" disabled={!answered} onClick={onAdvance}>{advanceLabel}</button>}
      {!advanceLabel&&<button type="button" className="library-action secondary" onClick={onLesson}>回到本课</button>}
    </div>
  </>
}

export default function StudyTrial({name,lessons,trials,start,mode,onSelect,onRound,onLesson,onExit}){
  const single=mode==='single'
  const count=single?1:Math.min(ROUND_SIZE,trials.length-start)
  const [offset,setOffset]=useState(0)
  const [attempt,setAttempt]=useState(0)
  const [firstAnswers,setFirstAnswers]=useState({})
  const [finished,setFinished]=useState(false)
  const index=start+offset
  const challenge=trials[index]
  const lessonIndex=challenge.lessonIndex
  const last=offset===count-1
  const correct=Object.values(firstAnswers).filter(Boolean).length
  const firstMiss=Object.keys(firstAnswers).find(key=>!firstAnswers[key])

  function next(){
    if(last)setFinished(true)
    else{setOffset(current=>current+1);setAttempt(0)}
    window.scrollTo({top:0,behavior:'instant'})
  }

  function retry(){
    setAttempt(current=>current+1)
    window.scrollTo({top:0,behavior:'instant'})
  }

  function replayRound(){
    setOffset(0);setAttempt(0);setFirstAnswers({});setFinished(false)
    window.scrollTo({top:0,behavior:'instant'})
  }

  return <section className="library-quiz-screen">
    <div className="library-book-head library-study-head">
      <span className="library-eyebrow">试炼 · {name}</span>
      <div className="library-chapter-menu">
        <label htmlFor="library-trial-select">选择题目</label>
        <select id="library-trial-select" value={index} onChange={event=>onSelect(Number(event.target.value))}>
          <optgroup label="随课试炼">
            {lessons.map((lesson,i)=><option value={i} key={lesson.id}>{i+1}. {lesson.title}</option>)}
          </optgroup>
          {trials.length>lessons.length&&<optgroup label="进阶加练">
            {trials.slice(lessons.length).map((trial,i)=><option key={trial.question} value={lessons.length+i}>
              {i+1}. {trial.question}
            </option>)}
          </optgroup>}
        </select>
      </div>
    </div>
    {finished?<article className="library-quiz-paper library-quiz-finish" aria-live="polite">
      <span className="library-finish-seal" aria-hidden="true">成</span>
      <h2>本轮完成</h2>
      <p>首次答对 {correct} / {count} 题</p>
      <div className="library-quiz-actions">
        {start+count<trials.length&&<button type="button" className="library-action" onClick={()=>onRound(start+count)}>继续下一轮 →</button>}
        {firstMiss!==undefined&&<button type="button" className="library-action secondary"
          onClick={()=>onLesson(trials[firstMiss].lessonIndex)}>回看第一道错题的课</button>}
        <button type="button" className="library-action secondary" onClick={replayRound}>重玩本轮</button>
        <button type="button" className="library-action secondary" onClick={onExit}>试炼目录</button>
      </div>
    </article>:<article className="library-quiz-paper library-trial-paper">
      <div className="library-trial-topline">
        <span>{single?(challenge.bonus?'进阶加练':'本课试炼'):`本轮第 ${offset+1} 题，共 ${count} 题`}</span>
        {!single&&<div className="library-trial-progress" role="progressbar" aria-label="本轮进度"
          aria-valuemin={0} aria-valuemax={count} aria-valuenow={offset+1}>
          {Array.from({length:count},(_,i)=><span key={i} data-state={i<offset?'done':i===offset?'current':'waiting'}/>)}
        </div>}
      </div>
      <TrialChallenge key={`${index}-${attempt}`} challenge={challenge} lesson={lessons[lessonIndex]}
        onGrade={right=>setFirstAnswers(current=>Object.hasOwn(current,index)?current:{...current,[index]:right})}
        onLesson={()=>onLesson(lessonIndex)} onRetry={retry}
        onAdvance={single?()=>onLesson(lessonIndex+1):next}
        advanceLabel={single?(lessonIndex+1<lessons.length?'学习下一课 →':null):last?'看看本轮成绩 →':'下一题 →'}/>
      {single&&lessonIndex+1<lessons.length&&<button type="button" className="library-trial-lesson-link"
        onClick={()=>onLesson(lessonIndex)}>回到本课</button>}
    </article>}
  </section>
}
