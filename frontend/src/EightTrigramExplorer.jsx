import { useMemo, useState } from 'react'
import { EIGHT_TRIGRAMS, hexagramForLines } from './casting-lessons.js'
import HomeDiorama from './HomeDiorama.jsx'
import { HomeChallengeFeedback, HomeChallengeHeading, useHomeChallenge } from './HomeChallenge.jsx'

const levels = [
  {
    title: '看象寻卦',
    prompt: '哪一卦代表山？点一块卦牌。',
    intro: '点选卦牌会显示象意，猜错可以继续点。',
    hint: '山有稳固、止步的意象。找上面一条实线、下面两条断线的卦。',
    answer: '艮',
    success: '艮（gèn）为山。上爻是一条实线，下面是两条断线。看到艮，可以先想到山和「止」。',
    retry: '这块卦牌代表另一种自然景象。看一眼象意，再找代表山的卦。',
  },
  {
    title: '把风放在雷上',
    prompt: '选代表风的卦设为上卦，选代表雷的卦设为下卦，再检查。',
    intro: '两个三爻卦上下叠起来，就成了一个六爻卦。',
    hint: '巽（xùn）为风，震（zhèn）为雷。先把巽设为上卦，再把震设为下卦。',
    answer: '益',
    success: '巽上、震下合为风雷益。卦名里的「风雷」依次取自上卦、下卦，卦图的六爻仍从最下面读起。',
    retry: '按题目核对两格的象意和上下位置。改好后，再点「检查合卦」。',
  },
  {
    title: '上下互换有何不同',
    prompt: '这次把雷放在上面、风放在下面，看看换成了什么卦。',
    intro: '还是刚才的两种象，不过要将它们的上下位置互换。',
    hint: '选震设为上卦，选巽设为下卦。',
    answer: '恒',
    success: '震上、巽下合为雷风恒。和上一关用的是同两个三爻卦，位置一换，六爻排列和卦名都变了。',
    retry: '重新核对上下位置。雷要在上，风要在下。',
  },
]

export default function EightTrigramExplorer() {
  const trial = useHomeChallenge('meihua', levels)
  const [activeName, setActiveName] = useState(trial.completed ? '震' : '乾')
  const [rotationSteps, setRotationSteps] = useState(0)
  const [upperName, setUpperName] = useState(trial.completed ? '震' : '乾')
  const [lowerName, setLowerName] = useState(trial.completed ? '巽' : '坤')
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
  const composeMode = trial.index > 0 && !trial.completed

  function rotate(step) {
    setRotationSteps(current => (current + step + 8) % 8)
  }

  function chooseRandom() {
    const choices = EIGHT_TRIGRAMS.filter(trigram => trigram.name !== active.name)
    setActiveName(choices[Math.floor(Math.random() * choices.length)].name)
  }

  function selectTrigram(name) {
    setActiveName(name)
    if (trial.index === 0) trial.choose(name)
  }

  function restartExplorer() {
    setActiveName('乾')
    setRotationSteps(0)
    setUpperName('乾')
    setLowerName('坤')
  }

  const panel = <HomeChallengeFeedback trial={trial} onReplay={restartExplorer}
    check={composeMode ? () => trial.choose(composed.name) : undefined}
    summary="你已经会用象意认卦、叠出六爻卦，还试过上下换位会怎样改变卦象。" />

  const composition = <div className="atlas-composition">
    <div className="atlas-trigram-set-actions" role="group" aria-label="组合上下卦">
      <button type="button" aria-label={'将' + active.name + '卦设为上卦'}
        aria-pressed={upper.name === active.name} onClick={() => setUpperName(active.name)}>{composeMode && `${active.name} · `}设为上卦</button>
      <button type="button" aria-label={'将' + active.name + '卦设为下卦'}
        aria-pressed={lower.name === active.name} onClick={() => setLowerName(active.name)}>{composeMode && `${active.name} · `}设为下卦</button>
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
    {!composeMode && <p>六爻由下而上组合，此练习不参与正式起卦。</p>}
  </div>

  const exploreControls = <>
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
  </>

  return <section className="atlas-trigram-explorer" aria-label="八卦探象互动体验" data-compose={composeMode || undefined}>
    <header className="atlas-trigram-heading">
      <div>
        <h2>八卦探象</h2>
        {!composeMode && <p>点选卦象，查看象意</p>}
      </div>
      <button type="button" className="atlas-trigram-random" onClick={chooseRandom}>随机观象</button>
    </header>
    <HomeChallengeHeading trial={trial} />
    <HomeDiorama kind="meihua" picked={active.name} solved={trial.solved}>
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
            onClick={() => selectTrigram(trigram.name)}
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

    {composeMode && composition}
    {panel}

    {composeMode ? <details className="home-challenge-explore">
      <summary>查看象意与转动卦盘</summary>
      {exploreControls}
    </details> : exploreControls}
    {!composeMode && composition}
  </section>
}
