import React,{useState} from 'react'
import {parseSharedCase,importToInbox,markInboxCase,removeInboxCase,
  readCaseInbox,INBOX_KEY,MAX_INBOX} from './case-exchange.js'

function downloadJson(data,name){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'})
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a');a.href=url;a.download=name
  document.body.appendChild(a);a.click();a.remove()
  setTimeout(()=>URL.revokeObjectURL(url),1000)
}
function formatTime(iso){
  if(!iso)return '时间未提供'
  const date=new Date(iso)
  return Number.isNaN(date.getTime())?'时间格式未确认':
    date.toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})+'（北京时间）'
}
export default function CaseExchangeCenter({onClose}){
  const [entries,setEntries]=useState(readCaseInbox)
  const [candidate,setCandidate]=useState(null)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [filter,setFilter]=useState('全部')
  const [expanded,setExpanded]=useState('')
  async function chooseFile(e){
    const file=e.target.files?.[0]
    e.target.value=''
    setCandidate(null);setError('');setNotice('')
    if(!file)return
    if(file.size>60000){setError('文件超过60KB：只支持单份案例分享包，不接受整个书院数据备份。');return}
    try{
      const raw=await file.text()
      const parsed=parseSharedCase(raw)
      if(entries.some(x=>x.fingerprint===parsed.source_key)){
        setError('这份案例已在本机收案簿，不能覆盖已收记录。')
        return
      }
      setCandidate({raw,data:parsed.case,source:parsed.source_key})
    }catch(err){setError(err.message||'无法识别文件，请使用书院导出的案例分享包。')}
  }
  function approveImport(){
    if(!candidate)return
    try{
      const next=importToInbox(candidate.raw)
      setEntries(next);setCandidate(null);setError('')
      setNotice('已收入本机待审核列表，未发送到任何服务器。')
    }catch(err){setError(err.message||'无法写入本机存储，请检查浏览器权限。')}
  }
  function statusChange(id,status){
    try{setEntries(markInboxCase(id,status));setNotice('审核状态已保存在本机。')}
    catch(err){setError(err.message||'保存失败')}
  }
  function remove(id){
    if(!window.confirm('确认从本机收案簿删除这份案例？删除后无法在本站恢复。'))return
    try{setEntries(removeInboxCase(id));setNotice('已从本机收案簿删除。')}
    catch(err){setError(err.message||'删除失败')}
  }
  function backup(){
    try{
      downloadJson({format:'wanxiang-case-inbox-backup-v1',version:1,
          exported_at:new Date().toISOString(),records:entries},
        '万象书院-本机收案簿备份.json')
      setNotice('已导出本机完整收案簿备份，文件可能包含朋友的研究笔记，请妥善保管。')
    }catch{setError('备份下载失败，请检查浏览器下载权限。')}
  }
  const shown=entries.filter(x=>filter==='全部'||x.status===filter)
  const counts={total:entries.length,pending:entries.filter(x=>x.status==='待审核').length,
    approved:entries.filter(x=>x.status==='收录').length,
    unfinished:entries.filter(x=>!x.case.feedback?.length).length}
  return <main className="academy-case-exchange" aria-label="万象书院本机案例收集与研究">
    <div className="case-exchange-top"><span>万象书院 · V27 案例共建</span>
      <button type="button" onClick={onClose}>返回书院</button></div>
    <h1>本机案例交换中心</h1>
    <p>朋友从六爻「案例复盘」导出匿名化分享包，再通过微信等方式把 <b>JSON 文件</b>发给你。你在这里导入、审核和备份，不需要体验码或管理员后台。</p>
    <p className="case-exchange-note"><strong>这是当前浏览器的本机收案台，不是需要密码的云端管理员后台。</strong>
      文件及审核状态只在这台设备保存；换设备不会同步，清除浏览器数据可能丢失。不要把他人的隐私或敏感案例导入共用设备。</p>
    <div className="case-exchange-stats">
      <div><strong>{counts.total}</strong><span>本机案例</span></div>
      <div><strong>{counts.pending}</strong><span>待审核</span></div>
      <div><strong>{counts.approved}</strong><span>已收录</span></div>
      <div><strong>{counts.unfinished}</strong><span>暂无后续观察</span></div>
    </div>
    <section className="case-exchange-import">
      <h2>导入朋友自愿分享的案例</h2>
      <p>只接受书院新版「导出匿名化分享包」生成的单份 JSON；导入前会预览内容，防止未经检查直接收录。</p>
      <label className="case-exchange-upload">选择一份 JSON 分享包
        <input aria-label="选择一份 JSON 分享包" type="file" accept=".json,application/json" onChange={chooseFile}/>
      </label>
      {candidate&&<div className="case-exchange-preview">
        <h3>导入前预览（暂未保存）</h3>
        <p>本卦 <b>{candidate.data.ben_gua||'未记录'}</b> → {candidate.data.bian_gua||'未记录'}</p>
        <p>事前原话：</p><blockquote>{candidate.data.before}</blockquote>
        <p>后续观察 {candidate.data.feedback.length} 条 ·
          {candidate.data.human_review?'附人工研判草稿':'不含人工研判草稿'} ·
          {candidate.data.focus_selection?'附取用理由':'不含取用理由'}</p>
        <button type="button" onClick={approveImport}>确认导入本机待审核</button>
        <button type="button" className="light" onClick={()=>setCandidate(null)}>取消</button>
      </div>}
    </section>
    {error&&<p className="case-exchange-error" role="alert">{error}</p>}
    {notice&&<p className="case-exchange-success" role="status">{notice}</p>}
    <section className="case-exchange-cases">
      <div className="case-exchange-section-head"><h2>案例审核簿</h2>
        <button type="button" onClick={backup} disabled={!entries.length}>导出全部本机备份</button></div>
      <div className="case-exchange-filters" role="group" aria-label="案例审核状态筛选">
        {['全部','待审核','收录','暂不收录'].map(status=>
          <button type="button" key={status} aria-pressed={filter===status}
            onClick={()=>setFilter(status)}>{status}</button>)}
      </div>
      <p className="case-exchange-counter">显示 {shown.length} / {entries.length} 份，当前最多保留 {MAX_INBOX} 份。</p>
      {shown.length===0?<p>暂无对应案例。你可以把分享入口发给朋友，请他们先封存事前研究，再自行导出分享包。</p>:
      shown.map((x,i)=><article className="case-exchange-item" key={x.fingerprint}>
        <div className="case-exchange-item-head">
          <div><strong>{x.case.ben_gua||'未知本卦'} → {x.case.bian_gua||'未知变卦'}</strong>
            <small>{formatTime(x.case.created_at)} · {x.status}</small></div>
          <button type="button" onClick={()=>setExpanded(expanded===x.fingerprint?'':x.fingerprint)}>
            {expanded===x.fingerprint?'收起内容':'展开研判与反馈'}</button>
        </div>
        {expanded===x.fingerprint&&<div className="case-exchange-item-body">
          <p><b>事前研判：</b>{x.case.before}</p>
          <p><b>六爻原数：</b>{x.case.original_numbers.join('、')}；
            <b> 日月：</b>{x.case.day_ganzhi||'未核'} / {x.case.month_branch||'未核'}</p>
          {x.case.human_review&&<details><summary>查看分享的人工研判草稿</summary>
            {Object.entries(x.case.human_review).map(([key,value])=><p key={key}>{key}：{value||'未填写'}</p>)}
          </details>}
          {x.case.focus_selection&&<details><summary>查看分享的择用依据</summary>
            <p>选择理由：{x.case.focus_selection.reason}</p>
            <p>相反证据：{x.case.focus_selection.counter}</p>
          </details>}
          <h3>事后追记（仅为自述，需审阅）</h3>
          {!x.case.feedback.length&&<p>暂无后续观察。</p>}
          {x.case.feedback.map((f,j)=><p key={j}>{formatTime(f.recorded_at)} ·
            {f.result_type}：{f.observations}</p>)}
          <p className="case-exchange-caution">请检查是否包含个人隐私、事实缺失或事后改写。自述吻合不等于已经验证预测有效。</p>
        </div>}
        <div className="case-exchange-review-actions">
          <button type="button" onClick={()=>statusChange(x.fingerprint,'收录')}>收录</button>
          <button type="button" onClick={()=>statusChange(x.fingerprint,'暂不收录')}>暂不收录</button>
          <button type="button" onClick={()=>statusChange(x.fingerprint,'待审核')}>待审核</button>
          <button type="button" className="light" onClick={()=>remove(x.fingerprint)}>删除本机</button>
        </div>
      </article>)}
    </section>
  </main>
}
