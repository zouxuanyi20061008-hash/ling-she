import { CabinetSet } from './HomeCabinetScenes.jsx'
import { HomeChallengeGame, HomePick, useHomeChallenge } from './HomeChallenge.jsx'

const baziPillars = [
  { name: '年', stem: '己', branch: '卯', element: '土' },
  { name: '月', stem: '辛', branch: '未', element: '金' },
  { name: '日', stem: '甲', branch: '戌', element: '木' },
  { name: '时', stem: '壬', branch: '申', element: '水' },
]

const baziLevels = [
  {
    title: '从八字里找日主',
    prompt: '日主是日柱的天干。点出它是哪一个字。',
    intro: '每柱上格是天干，下格是地支。',
    hint: '找到标着「日柱」的竹简，选上面的字。',
    answer: '甲',
    success: '甲是日主。它在日柱的上格，五行属木。接下来就可以用这个甲木作参照来读其他天干。',
    retry: '先找「日柱」这一列，再看看这一列的上格。',
  },
  {
    title: '从月柱里找月令',
    prompt: '再看节气月份。八字用月柱的地支表示月令，点出这个字。',
    intro: '还是同一张例盘，这一关从月柱读。',
    hint: '找到「月柱」，地支是竹简下面那个字。',
    answer: '未',
    success: '月柱是辛未。未在下格，所以这组八字的月令是未。看其他例盘时，也可以从月柱下格找月令。',
    retry: '找「月柱」这一列。题目要找的是地支，请看下格。',
  },
  {
    title: '找能生甲木的天干',
    prompt: '日主是甲木。看上排的五行，点出能生甲木的天干。',
    intro: '上排每个天干下面标出了它的五行。',
    hint: '五行里水生木，找上排标着「水」的天干。',
    answer: '壬',
    success: '壬是时柱天干，属水。水生木，所以壬和甲是相生关系。这是用日主作参照的一种读法。',
    retry: '试着找上排的水。五行相生里，水能生木。',
    showElements: true,
  },
]

const compassPoints = [
  ['北', 0], ['东北', 45], ['东', 90], ['东南', 135],
  ['南', 180], ['西南', 225], ['西', 270], ['西北', 315],
]

const fengshuiLevels = [
  {
    title: '罗盘找坐山',
    prompt: '这处朝正东。点出它背靠的方向。',
    intro: '往前看是朝向，反过来背靠的方向叫坐山。',
    hint: '从铜色的「东」穿过罗盘中心，找对面的方向。',
    answer: '西',
    success: '朝向是东 90°，坐山在正对面的西 270°。坐和向相差 180°，刚好是半圈。',
    retry: '坐山与朝向正对。沿着罗盘横线找「东」的另一端。',
    origin: '东',
  },
  {
    title: '认出刻度上的斜向',
    prompt: '朝向的读数为 135°。在罗盘上点出这个方向。',
    intro: '铜色牌标出读数起点，从正北 0° 顺时针读。',
    hint: '135° 在东 90° 和南 180° 的正中间。',
    answer: '东南',
    success: '135° 是东南。八个方向每格相差 45°，从正北顺时针数三格，正好落在东南。',
    retry: '先找到东 90° 和南 180°，再看看两者之间的牌。',
    origin: '北',
    diagonal: true,
  },
  {
    title: '给西南向找坐山',
    prompt: '这次门朝西南。点出与它正对的坐山。',
    intro: '斜向也一样。穿过罗盘中心找对面。',
    hint: '从铜色的西南 225° 转半圈，得到 45°。',
    answer: '东北',
    success: '西南 225° 的对面是东北 45°。这一组坐向可以写作「坐东北，向西南」。',
    retry: '从左下角的西南出发，穿过盘心，看看右上角。',
    origin: '西南',
    diagonal: true,
  },
]

export function BaziGame(){
  const trial = useHomeChallenge('bazi', baziLevels)
  const { level, picked, choose } = trial

  return <HomeChallengeGame scene="bazi" trial={trial} scenery={<CabinetSet kind="bazi"/>}
    summary="你能从四柱里找到日主和月令，也会用五行相生来比较两个天干了。">
    <div className="home-experience-grid home-bazi-grid" role="group" aria-label="四柱例盘八个字">
      {baziPillars.map(({ name, stem, branch, element })=><div key={name} className="home-bazi-pillar">
        <span>{name}柱</span>
        <HomePick label={`${name}柱天干 ${stem}${level.showElements ? `，属${element}` : ''}`} value={stem}
          answer={level.answer} picked={picked} onPick={choose}>
          <strong>{stem}</strong>{level.showElements && <small>{element}</small>}
        </HomePick>
        <HomePick label={`${name}柱地支 ${branch}`} value={branch} answer={level.answer} picked={picked} onPick={choose}>
          <strong>{branch}</strong>
        </HomePick>
      </div>)}
    </div>
  </HomeChallengeGame>
}

export function FengshuiGame(){
  const trial = useHomeChallenge('fengshui', fengshuiLevels)
  const { level, picked, choose } = trial
  const points = level.diagonal ? compassPoints : compassPoints.filter(([, degrees])=>degrees % 90 === 0)

  return <HomeChallengeGame scene="fengshui" trial={trial} scenePicked={picked ?? level.origin}
    scenery={<CabinetSet kind="fengshui"/>} summary="你已经会按刻度找方向，也能从正向和斜向找到对面的坐山。">
    <div className="home-compass" data-diagonal={level.diagonal || undefined}
      role="group" aria-label={level.diagonal ? '罗盘八个方向' : '罗盘四个方向'}>
      {points.map(([name, degrees])=><HomePick key={name} label={`${name} ${degrees}度`} value={name}
        style={{gridArea:`direction-${degrees}`}} answer={level.answer} picked={picked} onPick={choose}>
        <strong data-origin={name === level.origin || undefined}>{name}</strong><small>{degrees}°</small>
      </HomePick>)}
    </div>
  </HomeChallengeGame>
}
