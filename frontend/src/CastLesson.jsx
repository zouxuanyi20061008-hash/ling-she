import { useId, useState } from 'react'
import './cast-lesson.css'

export function CastHint({children}) {
  return <p className="cast-coach-hint"><strong>提示</strong><span>{children}</span></p>
}

function LessonScene({layout='sequence', items}) {
  if(!items?.length)return null
  return <ul className={`cast-lesson-scene cast-lesson-scene--${layout}`} aria-label="本步对应的盘面"
    style={{'--lesson-columns':Math.min(items.length,4)}}>
    {items.map(({label,value,active},i)=><li key={`${label}-${i}`} data-highlight={active?'true':undefined}>
      <span>{label}</span><strong>{value}</strong>
    </li>)}
  </ul>
}

export default function CastLesson({title, steps, collapsed=false}) {
  const [index,setIndex]=useState(0)
  const titleId=useId()
  if(!steps.length)return null
  const current=Math.min(index,steps.length-1)
  const step=steps[current]
  const last=current===steps.length-1
  const lesson=<section className="cast-lesson" aria-labelledby={titleId}>
    <header className="cast-lesson-header">
      <h3 id={titleId}>{title}</h3>
      {steps.length>1&&<span aria-label={`第 ${current+1} 步，共 ${steps.length} 步`}>{current+1} / {steps.length}</span>}
    </header>
    <div className="cast-lesson-step" aria-live="polite" aria-atomic="true">
      <h4>{step.title}</h4>
      <p>{step.text}</p>
    </div>
    {steps.length>1&&<nav className="cast-lesson-controls" aria-label={`${title}步骤`}>
      <button type="button" disabled={current===0} onClick={()=>setIndex(current-1)}>← 上一步</button>
      <button type="button" onClick={()=>setIndex(last?0:current+1)}>{last?'从头再看 ↻':'下一步 →'}</button>
    </nav>}
    {step.visual}
    <LessonScene layout={step.layout} items={step.items}/>
  </section>

  return collapsed?<details className="cast-lesson-fold">
    <summary>{title}</summary>
    {lesson}
  </details>:lesson
}
