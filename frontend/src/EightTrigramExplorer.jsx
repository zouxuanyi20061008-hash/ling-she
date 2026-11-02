import { useState } from 'react'
import { EIGHT_TRIGRAMS } from './casting-lessons.js'

export default function EightTrigramExplorer() {
  const [activeName, setActiveName] = useState('乾')
  const active = EIGHT_TRIGRAMS.find(item => item.name === activeName) || EIGHT_TRIGRAMS[0]

  function chooseRandom() {
    const next = EIGHT_TRIGRAMS[Math.floor(Math.random() * EIGHT_TRIGRAMS.length)]
    setActiveName(next.name)
  }

  return <section className="atlas-trigram-explorer" aria-label="八卦探象互动体验">
    <p className="atlas-trigram-instruction">点选一卦，查看它的自然之象、后天方位与五行</p>
    <div className="atlas-orbit" role="group" aria-label="选择八卦">
      <div className="atlas-orbit-ring outer"/>
      <div className="atlas-orbit-ring inner"/>
      {EIGHT_TRIGRAMS.map((trigram, index) => {
        const angle = index * Math.PI / 4 - Math.PI / 2
        const x = 50 + 42 * Math.cos(angle)
        const y = 50 + 42 * Math.sin(angle)
        return <button
          type="button"
          key={trigram.name}
          className="atlas-orbit-gua"
          style={{ '--orbit-x': x + '%', '--orbit-y': y + '%' }}
          aria-label={trigram.number + ' · ' + trigram.name + '卦：' + trigram.image + '，' + trigram.direction + '，五行属' + trigram.element}
          aria-pressed={active.name === trigram.name}
          onClick={() => setActiveName(trigram.name)}
          title={trigram.name + ' · ' + trigram.image}
        >{trigram.name}</button>
      })}
      <div className="atlas-yinyang" aria-hidden="true">
        <div className="atlas-taiji">
          <svg viewBox="0 0 100 100" width="100%">
            <circle cx="50" cy="50" r="49" fill="#d1bf94" stroke="#e6d4aa"/>
            <path d="M50 1A49 49 0 0 0 50 99 A24.5 24.5 0 0 1 50 50 A24.5 24.5 0 0 0 50 1Z" fill="#173d35"/>
            <circle cx="50" cy="25.5" r="7" fill="#173d35"/>
            <circle cx="50" cy="74.5" r="7" fill="#d1bf94"/>
          </svg>
        </div>
        <small>象 · 数 · 理</small>
      </div>
    </div>
    <div className="atlas-trigram-detail" aria-live="polite" aria-atomic="true">
      <div className="atlas-trigram-detail-head">
        <span className="atlas-trigram-detail-symbol" aria-hidden="true">{active.symbol}</span>
        <div className="atlas-trigram-detail-title">
          <small>当前所观 · 第 {active.number} 卦</small>
          <h3>{active.name} · {active.image}</h3>
        </div>
      </div>
      <p className="atlas-trigram-hint">{active.hint}</p>
      <div className="atlas-trigram-facts">
        <span>后天方位 · {active.direction}</span>
        <span>五行 · {active.element}</span>
      </div>
      <div className="atlas-trigram-footer">
        <small>仅作象意认识练习，不参与正式起卦。</small>
        <button type="button" aria-label="随机观象" onClick={chooseRandom}>随机观象 ↗</button>
      </div>
    </div>
  </section>
}
