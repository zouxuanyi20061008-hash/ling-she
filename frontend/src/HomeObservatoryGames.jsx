import { HomeChallengeGame, HomePick, useHomeChallenge } from './HomeChallenge.jsx'

const qimenPalaces = [
  ['巽', 4, '死门'], ['离', 9, '惊门'], ['坤', 2, '开门'],
  ['震', 3, '景门'], ['中', 5, '无门'], ['兑', 7, '休门'],
  ['艮', 8, '杜门'], ['坎', 1, '伤门'], ['乾', 6, '生门'],
]

const qimenLevels = [
  {
    title: '九宫寻门',
    prompt: '这张例盘的值使是惊门。点出它所在的宫。',
    intro: '八门写在格内，九宫图上方是南。',
    hint: '先看每格的门名，再读同一格上面的宫名和编号。',
    answer: 9,
    success: '找到了。惊门在离九宫，这一局的值使就是它。值使指出本局从哪一门开始看。',
    retry: '看看格内的门名，找写着「惊门」的一格。',
  },
  {
    title: '穿过盘心找北方',
    prompt: '离九在正南。点出与它隔着中五正对的正北宫。',
    intro: '记住这张盘的方向，上南、下北、左东、右西。',
    hint: '从最上方正中往下穿过中五，看看最下方正中是哪一宫。',
    answer: 1,
    success: '正北是坎一宫，和正南的离九隔着中五。这张例盘的坎一宫里是伤门。',
    retry: '正北在盘的下方，两宫要和中央的中五排成一条直线。',
  },
  {
    title: '从方位读到门',
    prompt: '现在只给你方位。点出西北一格，看看本局哪一道门落在那里。',
    intro: '先确定方向，再看这一格里的宫名和门名。',
    hint: '右边是西，下边是北。从右下角找。',
    answer: 6,
    success: '西北是乾六宫，这局落的是生门。九宫的方位固定，八门的落宫随起局而变。',
    retry: '西北要同时靠右、靠下。回到盘角看看。',
  },
]

const ziweiPalaces = [
  ['巳', '财帛'], ['午', '子女'], ['未', '夫妻'], ['申', '兄弟'],
  ['辰', '疾厄'], ['酉', '命宫'], ['卯', '迁移'], ['戌', '父母'],
  ['寅', '交友'], ['丑', '官禄'], ['子', '田宅'], ['亥', '福德'],
]

const ziweiLevels = [
  {
    title: '点出命宫的对宫',
    prompt: '这张例盘的命宫在酉。点出与它正对的一格。',
    intro: '深边格标出命宫。对宫在方盘的正对面。',
    hint: '从「酉 · 命宫」穿过盘心，看看左侧靠下的格子。',
    answer: '卯',
    origin: '酉',
    axis: 'rising',
    success: '找到了。酉的对宫是卯。这张盘的卯位是迁移宫，可和命宫一起对照外出的主题。',
    retry: '从「酉 · 命宫」横穿盘心，看看另一侧是哪一格。',
  },
  {
    title: '带着问题找宫位',
    prompt: '想从例盘里看工作、职责和发挥能力的主题，要先找哪一宫？',
    intro: '这一关从宫名找主题。每一格的大字就是宫名。',
    hint: '在下方这一排找「官禄」。',
    answer: '丑',
    success: '丑位是官禄宫。先靠宫名找到工作与职责的主题，再看宫内星曜的组合。',
    retry: '宫名提供主题线索。想想「官禄」和工作、职分的关系。',
  },
  {
    title: '再连一条对宫线',
    prompt: '这次从「辰 · 疾厄」出发，点出隔着盘心正对它的一格。',
    intro: '沿用第一关的方法，从有描边的起点穿过盘心。',
    hint: '辰在左侧靠上，顺着盘心找右侧靠下的宫位。',
    answer: '戌',
    origin: '辰',
    axis: 'falling',
    success: '辰和戌互为对宫。在这张例盘里，这条线把疾厄宫和父母宫连起来。',
    retry: '从左侧靠上的辰出发，正对面的宫在右侧靠下。',
  },
]

export function QimenGame() {
  const trial = useHomeChallenge('qimen', qimenLevels)
  const picked = trial.completed ? trial.level.answer : trial.picked

  return <HomeChallengeGame scene="qimen" trial={trial} summary="你已经能在九宫定位方位，读出宫名和落在其中的门。">
    <div className="home-experience-grid home-qimen-grid" role="group" aria-label="奇门例盘九宫">
      {qimenPalaces.map(([name, number, gate]) => (
        <HomePick key={number} label={`${name}${number}宫 · ${gate}`} value={number}
          answer={trial.level.answer} picked={picked} onPick={trial.choose} disabled={trial.completed}>
          <small>{name}{number}</small><strong>{gate}</strong>
        </HomePick>
      ))}
    </div>
  </HomeChallengeGame>
}

export function ZiweiGame() {
  const trial = useHomeChallenge('ziwei', ziweiLevels)
  const picked = trial.completed ? trial.level.answer : trial.picked

  return <HomeChallengeGame scene="ziwei" trial={trial} summary="你已经会用宫名找主题，也能从盘上找到与它相对的宫位。">
    <div className="home-experience-grid home-ziwei-grid" role="group" aria-label="紫微例盘十二宫"
      data-axis={trial.level.axis}>
      {ziweiPalaces.map(([branch, name]) => (
        <HomePick key={branch} label={`${branch} · ${name}`} value={branch}
          answer={trial.level.answer} picked={picked} onPick={trial.choose} disabled={trial.completed}>
          <small data-origin={branch === trial.level.origin || undefined}>{branch}</small><strong>{name}</strong>
        </HomePick>
      ))}
      <span className="home-ziwei-center" aria-hidden="true">紫微<br/>十二宫</span>
    </div>
  </HomeChallengeGame>
}
