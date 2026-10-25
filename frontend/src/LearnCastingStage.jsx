import {useState} from 'react'
import {EIGHT_TRIGRAMS,coinLine,analyzeSixCoins,meihuaTwoNumbers,trainingCoinExplanation} from './casting-lessons.js'
import './casting-lessons.css'

const SIX=['初','二','三','四','五','上']

function LinesDiagram({lines,moving=[]}){
  return <div className="learn-line-stack" aria-label="六爻从下往上编号，图从上向下显示">
    {[0,1,2,3,4,5].reverse().map(i=>{
      const yang=lines?.[i]===1
      return <div className={'learn-line-row '+(moving.includes(i+1)?'is-moving':'')} key={i}>
        <span className="learn-line-pos">{SIX[i]}爻</span>
        <span className={'learn-line-symbol '+(yang?'is-yang':'is-yin')}>
          {yang?<i/>:<><i/><i/></>}</span>
        <small>{moving.includes(i+1)?'动爻':yang?'阳':'阴'}</small>
      </div>
    })}
  </div>
}
function TrigramBits({bits}){
  return <span className="learn-tri-bits" aria-label={'初爻至三爻：'+bits.map(x=>x?'阳':'阴').join('、')}>
    {[...bits].reverse().map((bit,i)=><span key={i} className={'learn-tri-row '+(bit?'yang':'yin')}>{bit?<i/>:<><i/><i/></>}</span>)}
  </span>
}

export default function LearnCastingStage({onBack,onPractice,initialMethod='liuyao'}){
  const [method,setMethod]=useState(initialMethod==='meihua'?'meihua':'liuyao')
  const [faces,setFaces]=useState([2,3,2])
  const [numbers,setNumbers]=useState([])
  const [upper,setUpper]=useState('3')
  const [lower,setLower]=useState('6')
  const [plum,setPlum]=useState(null)
  const [plumError,setPlumError]=useState('')
  const [openTrigram,setOpenTrigram]=useState(0)
  const [showAnswer,setShowAnswer]=useState(false)
  const line=coinLine(faces)
  const six=analyzeSixCoins(numbers)
  const selected=EIGHT_TRIGRAMS.find(x=>x.number===openTrigram)||EIGHT_TRIGRAMS[0]
  function recordCoin(){
    if(numbers.length>=6)return
    setNumbers(old=>[...old,line.sum])
    setShowAnswer(false)
  }
  function castPlum(){
    try{
      if(!/^[0-9]+$/.test(upper.trim())||!/^[0-9]+$/.test(lower.trim()))
        throw Error('请输入两个正整数，不要填写文字或小数')
      const chart=meihuaTwoNumbers(Number(upper),Number(lower))
      setPlum(chart);setPlumError('');setShowAnswer(false)
    }catch(err){setPlumError(err.message);setPlum(null)}
  }
  return <main className="learn-casting-page" aria-label="万象书院起卦基础实操课">
    <div className="learn-casting-shell">
      <header className="learn-casting-nav">
        <button type="button" onClick={onBack}>← 返回择术</button>
        <span>万象书院 · 基础实操</span>
        <button type="button" onClick={()=>onPractice(method)}>前往正式{method==='liuyao'?'六爻':'梅花'}排盘 →</button>
      </header>
      <section className="learn-casting-hero">
        <small>零基础第一课 · 动手才会算</small>
        <h1>从一爻开始，学会亲手起卦。</h1>
        <p>先认识阴阳与八卦，再自己计算六爻或梅花的取数过程。<strong>每一步都能看到由什么规则得出什么结果</strong>，不需要 AI，也不需要提供私人卦问。</p>
      </section>
      <section className="learn-casting-basics" aria-label="阴阳与爻位基础">
        <h2>第一课 · 什么是爻与卦？</h2>
        <div className="learn-casting-foundations">
          <article><span className="learn-basic-glyph">━━━━</span><h3>阳爻</h3><p>一条完整的横线。读六爻时，从最下面的初爻开始往上排列。</p></article>
          <article><span className="learn-basic-glyph">━━　━━</span><h3>阴爻</h3><p>中间断开的两段。三爻组成一个经卦，上下两个经卦组成六爻重卦。</p></article>
          <article><span className="learn-basic-glyph">☯</span><h3>阴阳变化</h3><p>六爻摇钱时，6 老阴和 9 老阳是动爻；7 少阳和 8 少阴是静爻。</p></article>
        </div>
        <p className="learn-casting-source">学习提醒：梅花易数偏重象数取卦与体用；六爻纳甲另有世应、六亲、纳甲与日月等体系。两种方法不能随意混用。</p>
      </section>
      <section className="learn-casting-course" aria-label="选择起卦方式">
        <h2>第二课 · 亲手练一次</h2>
        <div className="learn-casting-tabs" role="tablist" aria-label="起卦实操方法">
          <button type="button" role="tab" aria-selected={method==='liuyao'}
            onClick={()=>setMethod('liuyao')}>六爻 · 三钱六掷</button>
          <button type="button" role="tab" aria-selected={method==='meihua'}
            onClick={()=>setMethod('meihua')}>梅花 · 两数起卦</button>
        </div>
        {method==='liuyao'?<div className="learn-casting-practice">
          <div className="learn-casting-instructions">
            <h3>把三枚铜钱当作一道算术题</h3>
            <p>选三枚钱各自的字面或背面，<strong>字=2、背=3</strong>。三枚相加得到 6、7、8、9。选好后点击“记下这一爻”，总共记六次。</p>
            <p>第 1 次记在最下面（初爻），第 6 次记在最上面（上爻）。练习中的硬币由你手动指定，并非随机摇卦。</p>
            <div className="learn-three-coins" role="group" aria-label="三枚铜钱选择字背">
              {faces.map((face,i)=><button key={i} type="button"
                aria-label={'第'+(i+1)+'枚钱币：'+(face===2?'字':'背')+'，点击切换'}
                aria-pressed={face===3} onClick={()=>setFaces(old=>old.map((v,j)=>i===j?(v===2?3:2):v))}>
                <span className="learn-coin-round">{face===2?'字':'背'}</span>
                <small>第{i+1}枚 · {face}分</small>
              </button>)}
            </div>
            <div className="learn-line-result" aria-live="polite">
              <b>{faces.join(' + ')} = {line.sum} · {line.label}</b>
              <p>{line.yang?'阳爻（不断）':'阴爻（中断）'} · {line.moving?'老爻，会改变阴阳':'少爻，保持原本阴阳'}</p>
            </div>
            <div className="learn-casting-actions">
              <button type="button" disabled={numbers.length>=6} onClick={recordCoin}>
                记下第 {Math.min(6,numbers.length+1)} 爻（从下往上）</button>
              <button type="button" disabled={!numbers.length} className="quiet"
                onClick={()=>{setNumbers(old=>old.slice(0,-1));setShowAnswer(false)}}>撤回最后一爻</button>
              <button type="button" className="quiet" onClick={()=>{setNumbers([]);setFaces([2,3,2]);setShowAnswer(false)}}>重新练习</button>
            </div>
            <p className="learn-casting-tip">记忆口诀：三字=6 老阴，两字一背=7 少阳，一字两背=8 少阴，三背=9 老阳。</p>
          </div>
          <div className="learn-casting-worked">
            <h3>你的卦：已完成 {numbers.length} / 6 爻</h3>
            <div className="learn-recorded-lines">
              {[0,1,2,3,4,5].reverse().map(i=><div key={i} className="learn-recorded-line">
                <span>{SIX[i]}爻</span><strong>{numbers[i]??'待记'}</strong>
                <span>{numbers[i]!=null?trainingCoinExplanation(numbers[i]):'—'}</span>
              </div>)}
            </div>
            {six.complete?<div className="learn-casting-finished" role="status">
              <h4>六爻齐备，读出本卦与之卦</h4>
              <div className="learn-two-hex">
                <div><b>本卦 · {six.original.name}</b><LinesDiagram lines={six.original.lines} moving={six.movingPositions}/>
                  <p>{six.original.upper.name}上 · {six.original.lower.name}下</p></div>
                <div><b>之卦 · {six.changed.name}</b><LinesDiagram lines={six.changed.lines}/>
                  <p>{six.changed.upper.name}上 · {six.changed.lower.name}下</p></div>
              </div>
              <p>动爻位置：{six.movingPositions.length?six.movingPositions.map(i=>SIX[i-1]+'爻').join('、'):'没有动爻，本卦与之卦相同'}。</p>
              <button type="button" onClick={()=>onPractice('liuyao')}>到正式六爻工坊排盘、安世应六亲 →</button>
            </div>:<p className="learn-casting-tip">还差 {6-numbers.length} 爻。练习时可以反复切换三枚钱的字、背，亲自记成一卦。</p>}
          </div>
        </div>:
        <div className="learn-casting-practice">
          <div className="learn-casting-instructions">
            <h3>梅花数字法：两组数字取上下卦</h3>
            <p>这一课采用书院当前的明确约定：第一数为上卦，第二数为下卦；两数之和确定动爻。其他梅花起卦法可能采用不同约定。</p>
            <p><strong>除以 8 取八卦，余 0 当作 8；两数相加除以 6 取动爻，余 0 当作 6。</strong>动爻从最下面数起。</p>
            <div className="learn-plum-inputs">
              <label>第一数 · 上卦
                <input type="number" min="1" max="99999999" step="1" value={upper}
                  onChange={e=>{setUpper(e.target.value);setPlum(null);setShowAnswer(false)}}/>
              </label>
              <label>第二数 · 下卦
                <input type="number" min="1" max="99999999" step="1" value={lower}
                  onChange={e=>{setLower(e.target.value);setPlum(null);setShowAnswer(false)}}/>
              </label>
            </div>
            <div className="learn-casting-actions">
              <button type="button" onClick={castPlum}>一步步计算上下卦和动爻</button>
              <button type="button" className="quiet" onClick={()=>{setUpper('3');setLower('6');setPlum(null);setPlumError('')}}>加载示例 3、6</button>
            </div>
            {plumError&&<p className="learn-casting-error" role="alert">{plumError}</p>}
            <p className="learn-casting-tip">注意：这个练习计算卦象结构，不因数字自动推断现实中的吉凶或确定结果。</p>
          </div>
          <div className="learn-casting-worked">
            <h3>亲手推演 · 从数字到六爻</h3>
            {plum?<div className="learn-plum-steps" aria-live="polite">
              <p><b>① 上卦：</b>{plum.a} ÷ 8，余 {plum.upperRemainder} {plum.upperRemainder===0?'（按 8）':''} → {plum.upper.name} {plum.upper.symbol}</p>
              <p><b>② 下卦：</b>{plum.b} ÷ 8，余 {plum.lowerRemainder} {plum.lowerRemainder===0?'（按 8）':''} → {plum.lower.name} {plum.lower.symbol}</p>
              <p><b>③ 动爻：</b>（{plum.a}+{plum.b}）÷ 6，余 {plum.movingRemainder} {plum.movingRemainder===0?'（按 6）':''} → 第 {plum.moving} 爻</p>
              <p><b>④ 体用：</b>{plum.ti.name}为体，{plum.yong.name}为用（动爻所在三爻卦作“用”）。</p>
              <div className="learn-two-hex">
                <div><b>本卦 · {plum.original.name}</b><LinesDiagram lines={plum.original.lines} moving={[plum.moving]}/><p>{plum.upper.name}上 · {plum.lower.name}下</p></div>
                <div><b>变卦 · {plum.changed.name}</b><LinesDiagram lines={plum.changed.lines}/><p>只改变第 {plum.moving} 爻的阴阳</p></div>
              </div>
              <button type="button" onClick={()=>onPractice('meihua')}>到梅花工坊，用自己的数字正式起卦 →</button>
            </div>:<div className="learn-casting-prompt">
              <p>试试输入 3 和 6：你预测上卦会是离还是坎？动爻在第几爻？</p>
              <button type="button" className="quiet" onClick={()=>setShowAnswer(v=>!v)}>
                {showAnswer?'收起提示':'查看推演提示'}</button>
              {showAnswer&&<p>3 对应离，6 对应坎；3+6=9，除以 6 余 3，动的是第三爻。点击计算核对本卦和变卦。</p>}
            </div>}
          </div>
        </div>}
      </section>
      <section className="learn-casting-trigrams" aria-label="先天八卦形态速查">
        <h2>第三课 · 八卦究竟怎么认？</h2>
        <p>下面是先天八卦数字排序；每个八卦有三条爻，<b>读的时候从最下面的初爻向上看</b>。五行、方位为传统类象的入门参考。</p>
        <div className="learn-trigram-layout">
          <div className="learn-trigram-options" role="group" aria-label="选择八卦查看爻形">
            {EIGHT_TRIGRAMS.map(t=><button type="button" key={t.number}
              aria-pressed={openTrigram===t.number} onClick={()=>setOpenTrigram(t.number)}>
              <strong>{t.symbol}</strong><span>{t.number} · {t.name}</span>
            </button>)}
          </div>
          <article className="learn-trigram-detail">
            <span>第 {selected.number} 卦 · {selected.name}为{selected.image}</span>
            <div className="learn-trigram-art"><TrigramBits bits={selected.lines}/><strong>{selected.symbol}</strong></div>
            <h3>{selected.name} · {selected.image}</h3>
            <p><b>五行：</b>{selected.element} · <b>后天方位：</b>{selected.direction}</p>
            <p><b>入门类象：</b>{selected.hint}</p>
            <p>爻形由下到上：{selected.lines.map(x=>x?'阳':'阴').join('、')}。</p>
          </article>
        </div>
      </section>
      <footer className="learn-casting-footer">
        <p>教学中的卦象是可复核的传统符号与规则练习，不是对现实事件的确定预测。你可以先动手学会，再回到原典和完整盘面逐步研究。</p>
        <button type="button" onClick={onBack}>← 返回书院选一门术数</button>
      </footer>
    </div>
  </main>
}
