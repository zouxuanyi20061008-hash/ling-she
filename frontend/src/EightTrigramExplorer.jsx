import { useMemo, useState } from 'react'
import { EIGHT_TRIGRAMS, hexagramForLines } from './casting-lessons.js'

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
    const next = EIGHT_TRIGRAMS[Math.floor(Math.random() * EIGHT_TRIGRAMS.length)]
    setActiveName(next.name)
  }

  return <section className="atlas-trigram-explorer" aria-label="八卦探象互动体验">
    <p className="atlas-trigram-instruction">点选一卦，查看自然之象、后天方位与五行；也可旋转卦环、亲手组合上下卦</p>
    <div className="atlas-orbit" role="group" aria-label="选择八卦" data-rotation={rotationDegrees}>
      <div className="atlas-orbit-ring outer"/>
      <div className="atlas-orbit-ring inner"/>
      {EIGHT_TRIGRAMS.map((trigram, index) => {
        const angle = index * Math.PI / 4 - Math.PI / 2 + rotationDegrees * Math.PI / 180
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

    <div className="atlas-trigram-toolbar" role="group" aria-label="旋转八卦环">
      <button type="button" onClick={() => rotate(-1)} aria-label="逆时针旋转45度">↶ 逆时针</button>
      <button type="button" onClick={() => rotate(1)} aria-label="顺时针旋转45度">顺时针 ↷</button>
      <button type="button" onClick={() => setRotationSteps(0)} aria-label="恢复八卦环默认方位">复位</button>
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
      <div className="atlas-trigram-set">
        <p>将当前所选的 <b>{active.name}卦</b> 放入卦象结构：</p>
        <div className="atlas-trigram-set-actions">
          <button type="button" aria-label={'将' + active.name + '卦设为上卦'}
            aria-pressed={upper.name === active.name} onClick={() => setUpperName(active.name)}>设为上卦</button>
          <button type="button" aria-label={'将' + active.name + '卦设为下卦'}
            aria-pressed={lower.name === active.name} onClick={() => setLowerName(active.name)}>设为下卦</button>
        </div>
      </div>
      <div className="atlas-composition" aria-live="polite" aria-atomic="true">
        <div className="atlas-composition-heading">
          <small>上下卦组合 · 结构练习</small>
          <div><span>上卦 {upper.name} · {upper.image}</span><b>＋</b><span>下卦 {lower.name} · {lower.image}</span></div>
        </div>
        <div className="atlas-composition-result">
          <div>
            <small>组合所得</small>
            <strong>{upper.image}{lower.image} · {composed.name}</strong>
          </div>
          <div className="atlas-composition-lines" role="img" aria-label={'六爻卦形：自下而上' + lineDescription}>
            {composed.lines.slice().reverse().map((bit, index) =>
              <span key={index} className={'atlas-composition-line ' + (bit ? 'yang' : 'yin')}/>
            )}
          </div>
        </div>
        <p>六爻由下而上组合。此处只练习上下卦与卦名的对应，不参与正式起卦或吉凶判断。</p>
      </div>
      <div className="atlas-trigram-footer">
        <small>八卦象意认识练习，不代替正式排盘。</small>
        <button type="button" aria-label="随机观象" onClick={chooseRandom}>随机观象 ↗</button>
      </div>
    </div>
  </section>
}
