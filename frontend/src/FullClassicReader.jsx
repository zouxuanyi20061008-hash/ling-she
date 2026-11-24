import {useEffect,useMemo,useRef,useState} from 'react'

const editions=import.meta.glob('./classics/*.json',{import:'default'})
const license='https://creativecommons.org/licenses/by-sa/4.0/'
const embeddedImages=typeof __PACKAGED_CLASSIC_IMAGES__==='undefined'?{}:__PACKAGED_CLASSIC_IMAGES__
const illustrationUrls=new Map()

function classicImageUrl(path){
  const relative=path.replace(/^\.?\//,'')
  if(!relative.startsWith('classics/'))return path
  if(!Object.hasOwn(embeddedImages,relative))return import.meta.env.BASE_URL+relative
  if(!illustrationUrls.has(relative)){
    const bytes=Uint8Array.from(atob(embeddedImages[relative]),char=>char.charCodeAt(0))
    illustrationUrls.set(relative,URL.createObjectURL(new Blob([bytes],{type:'image/webp'})))
  }
  return illustrationUrls.get(relative)
}

async function openBook(method){
  if(method==='zhouyi'){
    const {ZHOUYI_APPENDICES}=await import('./zhouyiAppendices.js')
    return {title:'周易',edition:'易传单篇 · 通行本',volumes:ZHOUYI_APPENDICES}
  }
  const load=editions[`./classics/${method}.json`]
  if(!load)throw new Error('找不到此书')
  return load()
}

function ClassicTable({rows}){
  return <div className="library-classic-table" role="region" aria-label="原典表格" tabIndex={0}>
    <table><tbody>{rows.map((row,index)=><tr key={index}>
      {row.map((cell,column)=><td key={column}>{cell}</td>)}
    </tr>)}</tbody></table>
  </div>
}

function ClassicPassage({section}){
  const blocks=section.blocks??[
    ...(section.paragraphs??[]).map(text=>({type:'paragraph',text})),
    ...(section.tables??[]).map(rows=>({type:'table',rows})),
    ...(section.images??[]).map(image=>({type:'image',...image})),
  ]
  return <div className="library-classic-text" aria-label="原文">
    {blocks.map((block,index)=>{
      if(block.type==='table')return <ClassicTable rows={block.rows} key={index}/>
      if(block.type==='pre')return <pre className="library-classic-diagram" key={index}>{block.text}</pre>
      if(block.type==='image'){
        const src=classicImageUrl(block.src)
        return <figure key={index}>
          <a href={src} target="_blank" rel="noopener noreferrer" aria-label={`放大查看${block.alt}`}>
            <img src={src} alt={block.alt} loading="lazy"/>
          </a>
          {block.caption&&<figcaption>{block.caption}</figcaption>}
        </figure>
      }
      return <p key={index}>{block.text}</p>
    })}
  </div>
}

export default function FullClassicReader({method,page,onPage,onExit,onAlternate,alternateLabel}){
  const [book,setBook]=useState(null)
  const [attempt,setAttempt]=useState(0)
  const [failed,setFailed]=useState(false)
  const swipe=useRef(null)
  useEffect(()=>{
    let active=true
    openBook(method).then(
      edition=>{if(active)setBook(edition)},
      ()=>{if(active)setFailed(true)},
    )
    return ()=>{active=false}
  },[method,attempt])

  const pages=useMemo(()=>book?.volumes.flatMap((volume,volumeIndex)=>
    volume.sections.map((section,sectionIndex)=>({volume,volumeIndex,section,sectionIndex})))??[],[book])
  const current=pages[page]?page:0
  const item=pages[current]

  function step(delta){
    const next=current+delta
    if(next>=0&&next<pages.length)onPage(next)
  }
  function startSwipe(event){
    if(event.touches.length!==1||event.target.closest('button, a, select, .library-classic-table, .library-classic-diagram'))return
    const touch=event.touches[0]
    swipe.current={x:touch.clientX,y:touch.clientY}
  }
  function finishSwipe(event){
    const start=swipe.current
    swipe.current=null
    const touch=event.changedTouches[0]
    if(!start||!touch)return
    const dx=touch.clientX-start.x,dy=touch.clientY-start.y
    if(Math.abs(dx)>=80&&Math.abs(dx)>Math.abs(dy)*1.6)step(dx<0?1:-1)
  }
  function readKeys(event){
    if(event.altKey||event.ctrlKey||event.metaKey||event.target.closest('a, button, select, .library-classic-table, .library-classic-diagram'))return
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
      event.preventDefault()
      step(event.key==='ArrowLeft'?-1:1)
    }
  }

  if(failed)return <div className="library-page-paper">
    <p role="alert">暂时打不开这部典籍。</p>
    <button className="library-action" type="button" onClick={()=>{setFailed(false);setAttempt(value=>value+1)}}>重新打开</button>
  </div>
  if(!item)return <p className="library-page-paper" role="status">正在载入原典…</p>

  const {volume,volumeIndex,section,sectionIndex}=item
  const source=section.source??volume.source??book.source
  const facsimile=section.facsimile??volume.facsimile??book.facsimile
  const heading=section.heading||volume.title
  const volumeStart=current-sectionIndex
  const volumeLabel=method==='zhouyi'?'选择易传':'选择卷次'
  const total=pages.length

  return <section className="library-reading-screen library-full-classic" aria-label={`《${book.title}》原文阅读`}
    onTouchStart={startSwipe} onTouchCancel={()=>{swipe.current=null}} onTouchEnd={finishSwipe}
    onKeyDown={readKeys} tabIndex={-1}>
    <div className="library-classic-heading">
      <strong>《{book.title}》</strong><span>{book.edition}</span>
      {onAlternate&&<button type="button" onClick={onAlternate}>{alternateLabel}</button>}
    </div>
    <div className="library-classic-menus">
      <label>{volumeLabel}
        <select value={volumeIndex} onChange={event=>{
          const volumeIndex=Number(event.target.value)
          onPage(pages.findIndex(entry=>entry.volumeIndex===volumeIndex))
        }}>
          {book.volumes.map((entry,index)=><option value={index} key={entry.id}>{entry.title}</option>)}
        </select>
      </label>
      <label>选择篇章
        <select value={sectionIndex} onChange={event=>onPage(volumeStart+Number(event.target.value))}>
          {volume.sections.map((entry,index)=><option value={index} key={index}>{entry.heading||`第 ${index+1} 节`}</option>)}
        </select>
      </label>
    </div>
    <nav className="library-reader-quick" aria-label="藏经阁快速翻篇">
      <button type="button" disabled={current===0} onClick={()=>step(-1)}>← 上一篇</button>
      <span>第 {current+1} 篇 / 共 {total} 篇</span>
      {current===total-1?<button type="button" className="library-reader-quick-next" onClick={onExit}>返回目录 ↑</button>:
        <button type="button" className="library-reader-quick-next" onClick={()=>step(1)}>下一篇 →</button>}
    </nav>
    <article className="library-page-paper">
      <div className="library-paper-line"><span>原典正文</span><span>{volume.title}</span></div>
      <h2>{heading}</h2>
      {section.note&&<p className="library-classic-note">{section.note}</p>}
      <ClassicPassage section={section}/>
      <div className="library-source library-classic-source">
        <span>{volume.note??book.note??'古籍转录据所标底本。'}<br/>
          {book.attribution??'转录整理来源为维基文库。'}
          {' '}<a className="library-source-license" href={license} target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>
        </span>
        <div>
          {source&&<a href={source} target="_blank" rel="noopener noreferrer">核对原典 ↗</a>}
          {facsimile&&<a href={facsimile} target="_blank" rel="noopener noreferrer">查看影印 ↗</a>}
        </div>
      </div>
    </article>
    <nav className="library-page-controls" aria-label="正文翻页">
      <button type="button" className="library-prev" disabled={current===0} onClick={()=>step(-1)}>← 上一篇</button>
      <span className="library-page-count">{current+1} / {total}</span>
      {current===total-1?<button type="button" className="library-next" onClick={onExit}>返回目录 ↗</button>:
        <button type="button" className="library-next" onClick={()=>step(1)}>下一篇 →</button>}
    </nav>
  </section>
}
