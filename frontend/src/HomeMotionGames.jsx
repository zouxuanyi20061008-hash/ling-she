import { Fragment, useState } from 'react'
import { coinLine } from './casting-lessons.js'
import { HomeChallengeGame, HomePick, useHomeChallenge } from './HomeChallenge.jsx'
import { CoinFaces } from './HomeMotionScenes.jsx'

const COIN_LEVELS = [
  {
    title:'翻出老阴', prompt:'点铜钱翻面，凑出 6 点老阴。每枚字面算 2，背面算 3。',
    initial:[2,2,3], answer:6,
    intro:'把三枚铜钱的点数加起来，就是这一爻。',
    hint:'三枚都翻成字面，点数就是 2 ＋ 2 ＋ 2。',
    retry:'再翻一翻。老阴要三枚都是字面。',
    success:'三个 2 是老阴。它本来是阴爻，变后成为阳爻。',
  },
  {
    title:'凑出静阴', prompt:'刚刚的老阴会变。现在翻出不会变的阴爻：8 点少阴。',
    initial:[2,2,2], answer:8,
    intro:'从 6 点出发，字面每翻成一个背面就多 1 点。',
    hint:'留一枚字面，把另外两枚翻到背面。',
    retry:'看看现在差几点，再决定把哪一枚翻过去。',
    success:'一枚字面、两枚背面凑成 8。少阴是静爻，前后都是阴。',
  },
  {
    title:'找出阳动爻', prompt:'桌上是 7 点少阳，阳爻保持不变。试着翻出会变的阳爻。',
    initial:[2,2,3], answer:9,
    intro:'少阳和老阳都是阳爻，只有老阳会变。',
    hint:'老阳是 9 点。想想三枚铜钱要各是多少。',
    retry:'继续翻。试试把三枚铜钱都翻到背面。',
    success:'三个 3 是老阳。它本来是阳爻，变后成为阴爻。',
  },
]

export function CoinGame(){
  const trial=useHomeChallenge('liuyao',COIN_LEVELS)
  return <CoinRound key={trial.index} trial={trial}/>
}

function CoinRound({trial}){
  const [faces,setFaces]=useState(()=>trial.completed
    ? trial.level.initial.map((_,index)=>index<trial.level.answer-6?3:2)
    : trial.level.initial)
  const line=coinLine(faces)
  const explanation=trial.solved?trial.level.success:trial.picked===null?trial.level.intro:trial.level.retry

  function flip(index){
    if(trial.solved||trial.completed)return
    const next=faces.map((face,position)=>position===index?5-face:face)
    setFaces(next)
    trial.choose(coinLine(next).sum)
  }

  return <HomeChallengeGame scene="liuyao" trial={trial} scenePicked={line.sum}
    summary="每掷三钱记一爻，六次由下往上成卦。6 老阴、9 老阳会变，7 少阳、8 少阴保持原样。"
    feedback={<><strong>{faces.join(' ＋ ')} ＝ {line.sum} · {line.label}</strong><span>{explanation}</span></>}>
    <div className="home-experience-grid home-coins" role="group" aria-label="翻动三枚练习铜钱">
      {faces.map((face,index)=><button type="button" className="home-coin-pick" data-academy-sound="coinTouch" key={index}
        aria-label={`第 ${index+1} 枚铜钱。${face===2?'字面 2':'背面 3'}。翻面`}
        aria-disabled={trial.solved||trial.completed||undefined} data-back={face===3||undefined} onClick={()=>flip(index)}>
        <CoinFaces/>
        <span className="home-coin-caption" aria-hidden="true">{face===2?'字面':'背面'} · {face}</span>
      </button>)}
    </div>
    <div className="home-coin-line-preview">
      <span><i data-yang={line.yang} aria-hidden="true"/>{line.yang?'阳爻':'阴爻'}</span>
      <small>{line.moving?'变为':'保持'}</small>
      <span><i data-yang={line.changedYang} aria-hidden="true"/>{line.changedYang?'阳爻':'阴爻'}</span>
    </div>
  </HomeChallengeGame>
}

const LIUREN_LEVELS = [
  // 前两关取同一例盘的不同宫位（甲子日，卯将加子时）。
  {
    title:'接上中传', prompt:'初传是申。找到地盘的申，选它正上方的天盘字。',
    columns:[['午','酉'],['申','亥'],['卯','午']], known:['申',null,null], revealed:['申','亥',null],
    choices:['午','亥','卯'], answer:'亥', pickLabel:'选择中传',
    intro:'下排是地盘，上排是天盘。先在下排找位置。',
    hint:'先找到「地盘」那排的申，再顺着这一列向上看。',
    retry:'从下排申字往上看，两字要在同一列。',
    success:'得到中传亥。地盘申上方是天盘亥，所以下一步要回地盘找亥。',
  },
  {
    title:'接完末传', prompt:'刚接到中传亥。现在回到地盘的亥，找出末传。',
    columns:[['申','亥'],['亥','寅'],['辰','未']], known:['申','亥',null], revealed:['申','亥','寅'],
    choices:['未','申','寅'], answer:'寅', pickLabel:'选择末传',
    intro:'每次接到的字，是下一步要在地盘找的位置。',
    hint:'刚才在上排看到亥，现在要到下排再找一次亥。',
    retry:'回到下排的亥，再看同一列上面的字。',
    success:'地盘亥上方是天盘寅，所以末传是寅。三传接成申、亥、寅。',
  },
  // 第三关换盘（己丑日，寅将加子时）。
  {
    title:'独立串起三传', prompt:'换一张例盘，给定初传卯。自己接两次，选出完整顺序。',
    columns:[['巳','未'],['未','酉'],['卯','巳']], known:['卯',null,null], revealed:['卯','巳','未'],
    choices:['卯、未、酉','卯、巳、未','卯、巳、酉'], answer:'卯、巳、未', pickLabel:'选择完整三传',
    intro:'先从卯读出中传，再拿中传当新的地盘位置。',
    hint:'先在地盘找到卯。读出上面的字，再到地盘找这个字。',
    retry:'每一步都从地盘往上读。先确定第二个字，再接第三个。',
    success:'卯上见巳，巳上见未，完整三传是卯、巳、未。',
  },
]
const TRANSMISSION_NAMES=['初传','中传','末传']

export function LiurenGame(){
  const trial=useHomeChallenge('liuren',LIUREN_LEVELS)
  const { level, solved, completed, picked, choose }=trial
  const transmissions=solved||completed?level.revealed:level.known

  return <HomeChallengeGame scene="liuren" trial={trial}
    summary="给定初传后，找它在地盘上方的字作中传。把中传放回地盘再向上查，就读出了末传。">
    <div className="home-liuren-chain" role="group" aria-label="本关三传顺序">
      {transmissions.map((branch,index)=><Fragment key={TRANSMISSION_NAMES[index]}>
        {index>0&&<span aria-hidden="true" data-linked={Boolean(branch)||undefined}>→</span>}
        <span data-revealed={Boolean(branch)||undefined}>
          <small>{TRANSMISSION_NAMES[index]}</small><b>{branch||'？'}</b>
        </span>
      </Fragment>)}
    </div>
    <table className="home-liuren-plate" aria-label="本关天地盘摘录">
      <tbody>
        <tr><th scope="row">天盘</th>{level.columns.map(([ground,sky])=><td key={ground}>{sky}</td>)}</tr>
        <tr><th scope="row">地盘</th>{level.columns.map(([ground])=><td key={ground}>{ground}</td>)}</tr>
      </tbody>
    </table>
    <div className="home-experience-grid home-option-three" role="group" aria-label={level.pickLabel}>
      {level.choices.map(choice=><HomePick key={choice} label={choice} value={choice} answer={level.answer} picked={picked} onPick={choose}>
        <strong data-sequence={choice.includes('、')||undefined}>{choice.replaceAll('、','→')}</strong>
      </HomePick>)}
    </div>
  </HomeChallengeGame>
}

// 夏至至冬至的相对时计阴遁八宫顺序，与太乙工坊的时计一致。
const YIN_HOUR_PALACES=['巽九宫','坎八宫','坤七宫','兑六宫','震四宫','艮三宫','离二宫','乾一宫']
const TAIYI_LEVELS = [
  {
    title:'点时辰，看太乙换宫', prompt:'夏至从巽九宫起。点到第几个时辰，太乙会第一次换宫？',
    hours:[1,2,3,4], answer:4,
    intro:'交夏至的时辰算第 1 时辰。点下面的时辰观察位置。',
    hint:'同一宫待满三个时辰。试试第三个之后的时辰。',
    retry:'珠子还在起点。再点后一个时辰观察。',
    success:'前三个时辰都在巽九宫，第 4 时辰来到坎八宫。',
  },
  {
    title:'数出下一次换宫', prompt:'太乙第 4 时辰进入坎八宫。接着数到哪一时辰才会再换宫？',
    hours:[4,5,6,7], answer:7,
    intro:'到新宫的第一个时辰，也算这个宫的第一时。',
    hint:'第 4、5、6 时辰正好是三个。下一时辰该去哪里？',
    retry:'还在坎八宫。从进入这里的第 4 时辰开始重新数。',
    success:'坎八宫停第 4、5、6 时辰，第 7 时辰顺次到坤七宫。',
  },
  {
    title:'走完八宫一整圈', prompt:'每宫三个时辰，阴遁共走八宫。哪一时辰回到夏至起点？',
    hours:[22,23,24,25], answer:25,
    intro:'最后一站是乾一宫。看到珠子回巽九宫，就开始了新一圈。',
    hint:'8 × 3 ＝ 24。第 24 时辰仍算在这一圈。',
    retry:'珠子还在这一圈的最后一宫。数完第 24 时辰再走一步。',
    success:'第 24 时辰结束第一圈，第 25 时辰回到巽九宫。',
  },
]

function yinHourPalace(hour){
  return YIN_HOUR_PALACES[Math.floor(((hour-1)%24)/3)]
}

export function TaiyiGame(){
  const trial=useHomeChallenge('taiyi',TAIYI_LEVELS)
  const { level, picked, solved, completed, choose }=trial
  const hour=picked??(completed?level.answer:level.hours[0])
  const palace=yinHourPalace(hour)
  const firstPalace=yinHourPalace(level.hours[0])
  const nextPalace=yinHourPalace(level.answer)
  const explanation=solved?level.success:picked===null?level.intro:level.retry

  return <HomeChallengeGame scene="taiyi" trial={trial} scenePicked={hour}
    summary="太乙时计从交夏至的时辰起算，按阴遁次序每三时换一宫，走八宫后从头再来。"
    feedback={<><strong>第 {hour} 时辰 · {palace}</strong><span>{explanation}</span></>}>
    <div className="home-taiyi-plates" aria-hidden="true" data-palace-step={palace===nextPalace?'next':undefined}>
      <span data-palace-active={palace===firstPalace||undefined}>{firstPalace}</span><span>→</span>
      <span data-palace-active={palace===nextPalace||undefined}>{nextPalace}</span>
    </div>
    <div className="home-experience-grid home-option-four" role="group" aria-label="选择夏至起相对时辰">
      {level.hours.map(number=><HomePick key={number} label={`第 ${number} 时辰`} value={number}
        answer={level.answer} picked={hour} onPick={choose}>
        <strong>{number}</strong><small>时辰</small>
      </HomePick>)}
    </div>
  </HomeChallengeGame>
}
