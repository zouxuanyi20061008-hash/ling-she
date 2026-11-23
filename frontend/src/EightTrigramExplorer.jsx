import { useMemo, useState } from 'react'
import { EIGHT_TRIGRAMS, hexagramForLines } from './casting-lessons.js'
import HomeDiorama from './HomeDiorama.jsx'

export default function EightTrigramExplorer() {
  const [activeName, setActiveName] = useState('乾')
  const [rotationSteps, setRotationSteps] = useState(0)
  const [upperName, setUpperName] = useState('乾')
  const [lowerName, setLowerName] = useState('坤')
  const active = EIGHT_TRIGRAMS.find(item => item.name === activeName) || EIGHT_TRIGRAMS[0]
  const upper = EIGHT_TRIGRAMS.find(item => item.name === upperName) || EIGHT_TRIGRAMS[0]
  const lower = EIGHT_TRIGRAMS.find(item => item.name === lowerName) || EIGHT_TRIGRAMS[7]
  const rotationDegrees = rotationSteps * 45
  const composed = useMemo(
    () => hexagramForLines([...lower.lines, ...upper.lines]),
    [lower, upper]
  )
  const lineDescription = composed.lines
    .map((bit, index) => '第' + (index + 1) + '爻' + (bit ? '阳' : '阴'))
    .join('、')

  function rotate(step) {
    setRotationSteps(current => (current + step + 8) % 8)
  }

  function chooseRandom() {
    const choices = EIGHT_TRIGRAMS.filter(trigram => trigram.name !== active.name)
    setActiveName(choices[Math.floor(Math.random() * choices.length)].name)
  }

  return <section className="atlas-trigram-explorer" aria-label="八卦探象互动体验">
    <header className="atlas-trigram-heading">
      <div>
        <h2>八卦探象</h2>
        <p>点选卦象，查看象意</p>
      </div>
      <button type="button" className="atlas-trigram-random" onClick={chooseRandom}>随机观象</button>
    </header>
    <HomeDiorama kind="meihua" picked={active.name}>
      <div className="atlas-orbit" role="group" aria-label="选择八卦" data-rotation={rotationDegrees}>
        <div className="atlas-orbit-plinth" aria-hidden="true">
          <div className="atlas-orbit-foundation"/>
          <div className="atlas-orbit-engraving"><div className="atlas-orbit-ring outer"/><div className="atlas-orbit-ring inner"/></div>
        </div>
        {EIGHT_TRIGRAMS.map((trigram, index) => {
          const angle = index * Math.PI / 4 - Math.PI / 2 + rotationDegrees * Math.PI / 180
          const x = 50 + 41 * Math.cos(angle)
          const y = 49 + 41 * Math.sin(angle)
          return <button
            type="button"
            key={trigram.name}
            className="atlas-orbit-gua"
            style={{ '--orbit-x': x + '%', '--orbit-y': y + '%' }}
            aria-label={trigram.number + ' · ' + trigram.name + '卦：' + trigram.image + '，' + trigram.direction + '，五行属' + trigram.element}
            aria-pressed={active.name === trigram.name}
            onClick={() => setActiveName(trigram.name)}
            title={trigram.name + ' · ' + trigram.image}
          >
            <span className="atlas-orbit-glyph" aria-hidden="true">
              {trigram.lines.slice().reverse().map((line,position)=>
                <span key={position} data-yang={line===1||undefined}/>)}
            </span>
            <span>{trigram.name}</span>
          </button>
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
        </div>
      </div>
    </HomeDiorama>

    <div className="atlas-trigram-detail" role="status">
      <span className="atlas-trigram-detail-symbol" aria-hidden="true">{active.symbol}</span>
      <div>
        <h3>{active.name} · {active.image}</h3>
        <p className="atlas-trigram-hint">{active.hint}</p>
        <div className="atlas-trigram-facts">
          <span>后天方位 · {active.direction}</span>
          <span>五行 · {active.element}</span>
        </div>
      </div>
    </div>

    <div className="atlas-trigram-toolbar" role="group" aria-label="旋转八卦环">
      <button type="button" onClick={() => rotate(-1)} aria-label="逆时针旋转45度">↶ 逆时针</button>
      <button type="button" onClick={() => rotate(1)} aria-label="顺时针旋转45度">顺时针 ↷</button>
      <button type="button" onClick={() => setRotationSteps(0)} aria-label="恢复八卦环默认方位">复位</button>
    </div>

    <div className="atlas-composition">
      <div className="atlas-trigram-set-actions" role="group" aria-label="组合上下卦">
        <button type="button" aria-label={'将' + active.name + '卦设为上卦'}
          aria-pressed={upper.name === active.name} onClick={() => setUpperName(active.name)}>设为上卦</button>
        <button type="button" aria-label={'将' + active.name + '卦设为下卦'}
          aria-pressed={lower.name === active.name} onClick={() => setLowerName(active.name)}>设为下卦</button>
      </div>
      <div className="atlas-composition-result">
        <div role="status" className="atlas-composition-text">
          <div><span>上卦 {upper.name}</span><span>下卦 {lower.name}</span></div>
          <strong>{upper.image}{lower.image} · {composed.name}</strong>
        </div>
        <div className="atlas-composition-lines" role="img" aria-label={'六爻卦形：自下而上' + lineDescription}>
          {composed.lines.slice().reverse().map((bit, index) =>
            <span key={index} className={'atlas-composition-line ' + (bit ? 'yang' : 'yin')}/>
          )}
        </div>
      </div>
      <p>六爻由下而上组合，此练习不参与正式起卦。</p>
    </div>
  </section>
}
