import {useId} from 'react'
import './beginner-reading.css'

export default function BeginnerReading({
  title='快速读懂这盘', question, takeaway, reasons=[], next, actionLabel, onAction,
}){
  const titleId=useId()
  return <section className="beginner-reading" aria-labelledby={titleId}>
    <header>
      <h3 className="beginner-reading-title" id={titleId}>{title}</h3>
      <p className="beginner-reading-takeaway">{takeaway}</p>
      {question&&(question.length>48
        ? <details className="beginner-reading-original">
            <summary>查看原问题</summary>
            <p className="beginner-reading-question">{question}</p>
          </details>
        : <p className="beginner-reading-question"><strong>你问</strong> {question}</p>)}
    </header>
    {reasons.length>0&&<div className="beginner-reading-reasons">
      <h4>为什么这样看</h4>
      <ul>{reasons.map(reason=><li key={reason}>{reason}</li>)}</ul>
    </div>}
    {next&&<p className="beginner-reading-next"><strong>下一步</strong> {next}</p>}
    {actionLabel&&onAction&&<button type="button" className="beginner-reading-action" onClick={onAction}>{actionLabel}</button>}
  </section>
}
