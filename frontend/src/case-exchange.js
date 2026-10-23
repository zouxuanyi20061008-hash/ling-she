/** V27: voluntary, privacy-first case exchange without login or server uploads. */
export const INBOX_KEY='wanxiang-case-exchange-inbox-v1'
export const MAX_INBOX=40
const FORMAT='wanxiang-sixyao-case-v1'
const RESULT_TYPES=['部分吻合','基本吻合','未吻合','尚无结果','无法判断']

function text(value,max=1600){
  return typeof value==='string'?value.slice(0,max):''
}
function scalar(value,max=100){
  return value==null?'':text(value,max)
}
function requireNumbers(value){
  if(!Array.isArray(value)||value.length!==6||value.some(x=>!Number.isInteger(x)||x<6||x>9))
    throw new Error('六爻原数必须为六个 6/7/8/9')
  return [...value]
}
function safeFeedback(value){
  if(!Array.isArray(value)||value.length>20)throw new Error('事后追记条数无效')
  return value.map(f=>{
    if(!f||typeof f!=='object'||Array.isArray(f))throw new Error('事后追记内容无效')
    if(typeof f.observations!=='string'||f.observations.length>1600)
      throw new Error('事后观察内容过长或无效')
    if(typeof f.result_type!=='string'||!RESULT_TYPES.includes(f.result_type))
      throw new Error('事后归类无效')
    return {recorded_at:scalar(f.recorded_at,60),result_type:f.result_type,
      observations:f.observations,note:'分享者自行陈述，未经独立核实'}
  })
}
function safeOptionalNotes(notes){
  if(notes==null)return null
  if(!notes||typeof notes!=='object'||Array.isArray(notes))throw new Error('研判笔记格式错误')
  const kept={}
  for(const key of ['hypothesis','support','counter','verification']){
    if(notes[key]!=null&&typeof notes[key]!=='string')throw new Error('研判笔记格式错误')
    kept[key]=text(notes[key],1400)
  }
  return kept
}
function safeChoice(choice){
  if(choice==null)return null
  if(!choice||typeof choice!=='object'||Array.isArray(choice))throw new Error('选择依据格式错误')
  const pos=choice.position
  if(pos!=null&&(!Number.isInteger(pos)||pos<1||pos>6))throw new Error('研习主爻位置不合法')
  return {position:pos||null,reason:text(choice.reason,1200),
    counter:text(choice.counter,1200),context:text(choice.context,1200)}
}
export function sanitizeSharedCase(value,{includeResearch=false}={}){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('案例对象格式错误')
  const original_numbers=requireNumbers(value.original_numbers)
  if(typeof value.before!=='string'||!value.before.trim()||value.before.length>1500)
    throw new Error('缺少完整且有效的事前研判')
  const feedback=safeFeedback(value.feedback||[])
  const selected=value.selected_position
  if(selected!=null&&(!Number.isInteger(selected)||selected<1||selected>6))
    throw new Error('主爻位置无效')
  return {
    original_numbers,
    ben_gua:scalar(value.ben_gua,100),
    bian_gua:scalar(value.bian_gua,100),
    day_ganzhi:scalar(value.day_ganzhi,24),
    month_branch:scalar(value.month_branch,24),
    chosen_category:scalar(value.chosen_category,50),
    selected_position:selected??null,
    created_at:scalar(value.created_at,60),
    before:value.before,
    feedback,
    human_review:includeResearch?safeOptionalNotes(value.human_review):null,
    focus_selection:includeResearch?safeChoice(value.focus_selection):null,
  }
}
export function shareCaseFromArchive(item,{includeResearch=false}={}){
  if(!item?.snapshot)throw new Error('请选择一份已封存案例')
  const snapshot=item.snapshot
  const pack=sanitizeSharedCase({
    original_numbers:snapshot.original_numbers,
    ben_gua:snapshot.ben_gua,bian_gua:snapshot.bian_gua,
    day_ganzhi:snapshot.day_ganzhi,month_branch:snapshot.month_branch,
    chosen_category:snapshot.chosen_category,
    selected_position:snapshot.selected_position,
    created_at:item.created_at,before:item.before,feedback:item.feedback,
    human_review:snapshot.human_review?.fields,
    focus_selection:snapshot.focus_selection
  },{includeResearch})
  // The source record's local id is used only to identify repeat deliveries.
  // The full personal question and any AI credentials are never included.
  const sourceKey=String(item.id||'').slice(0,120)
  return {format:FORMAT,version:1,
    shared_at:new Date().toISOString(),
    source_key:sourceKey,
    consent:'由分享者主动导出、交给收件人审核的研究材料',
    case:pack}
}
export function parseSharedCase(raw){
  if(typeof raw!=='string'||raw.length>60000)throw new Error('文件太大或格式无效（最多60KB）')
  let obj
  try{obj=JSON.parse(raw)}catch{throw new Error('不是有效的 JSON 文件')}
  if(!obj||typeof obj!=='object'||Array.isArray(obj)
    ||obj.format!==FORMAT||obj.version!==1)throw new Error('不是万象书院 V27 案例分享文件')
  if(typeof obj.source_key!=='string'||obj.source_key.length<1||obj.source_key.length>120)
    throw new Error('案例来源编号缺失')
  if(obj.consent!=='由分享者主动导出、交给收件人审核的研究材料')
    throw new Error('缺少自愿分享说明')
  const data=sanitizeSharedCase(obj.case,{includeResearch:true})
  return {format:FORMAT,version:1,
    shared_at:scalar(obj.shared_at,60),source_key:obj.source_key,
    consent:obj.consent,case:data}
}
function inboxRecord(obj){
  return {fingerprint:obj.source_key,
    imported_at:new Date().toISOString(),status:'待审核',
    case:obj.case}
}
export function readCaseInbox(storage=window.localStorage){
  try{
    const records=JSON.parse(storage.getItem(INBOX_KEY)||'[]')
    if(!Array.isArray(records))return []
    return records.filter(x=>x&&typeof x.fingerprint==='string'
      &&x.case&&Array.isArray(x.case.original_numbers)).slice(0,MAX_INBOX)
  }catch{return []}
}
export function importToInbox(raw,storage=window.localStorage){
  const incoming=parseSharedCase(raw)
  const records=readCaseInbox(storage)
  if(records.some(x=>x.fingerprint===incoming.source_key))
    throw new Error('这份案例已经导入，不会覆盖原有事前记录')
  if(records.length>=MAX_INBOX)
    throw new Error('收案簿已满，请先导出备份并清理，再导入新案例')
  const updated=[inboxRecord(incoming),...records]
  storage.setItem(INBOX_KEY,JSON.stringify(updated))
  return updated
}
export function markInboxCase(fingerprint,status,storage=window.localStorage){
  if(!['待审核','收录','暂不收录'].includes(status))throw new Error('审核状态无效')
  const records=readCaseInbox(storage)
  if(!records.some(x=>x.fingerprint===fingerprint))throw new Error('未找到案例')
  const updated=records.map(x=>x.fingerprint===fingerprint?{...x,status}:x)
  storage.setItem(INBOX_KEY,JSON.stringify(updated))
  return updated
}
export function removeInboxCase(fingerprint,storage=window.localStorage){
  const next=readCaseInbox(storage).filter(x=>x.fingerprint!==fingerprint)
  storage.setItem(INBOX_KEY,JSON.stringify(next))
  return next
}
