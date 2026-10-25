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
    imported_at:new Date().toISOString(),status:'待审核',review_note:'',
    case:obj.case}
}
export function readCaseInbox(storage=window.localStorage){
  try{
    const records=JSON.parse(storage.getItem(INBOX_KEY)||'[]')
    if(!Array.isArray(records))return []
    return records.filter(x=>x&&typeof x.fingerprint==='string'
      &&x.case&&Array.isArray(x.case.original_numbers)).slice(0,MAX_INBOX)
      .map(x=>({...x,review_note:typeof x.review_note==='string'?x.review_note.slice(0,600):''}))
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
/** Bulk moderation does not change contributors' sealed words or reviewer notes.
 * Deliberately no bulk "收录": every accepted case needs manual examination. */
export function markInboxCases(ids,status,storage=window.localStorage){
  if(!['待审核','暂不收录'].includes(status))
    throw new Error('批量操作只允许重置待审核或暂不收录；逐个审阅后才能收录')
  if(!Array.isArray(ids)||ids.length<1||ids.length>MAX_INBOX
    ||ids.some(x=>typeof x!=='string')||new Set(ids).size!==ids.length)
    throw new Error('请选择有效且不重复的案例')
  const old=readCaseInbox(storage)
  const selected=new Set(ids)
  if(old.filter(x=>selected.has(x.fingerprint)).length!==selected.size)
    throw new Error('部分所选案例已经不存在，请重新选择')
  const updated=old.map(x=>selected.has(x.fingerprint)?{...x,status}:x)
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

/** A researcher's own observations never modify the contributor's sealed content. */
export function updateInboxReviewNote(fingerprint,note,storage=window.localStorage){
  if(typeof note!=='string'||note.length>600)throw new Error('审核备注最多600字')
  const cases=readCaseInbox(storage)
  if(!cases.some(x=>x.fingerprint===fingerprint))throw new Error('案例不存在')
  const updated=cases.map(x=>x.fingerprint===fingerprint?{...x,review_note:note}:x)
  storage.setItem(INBOX_KEY,JSON.stringify(updated))
  return updated
}
export function removeInboxCase(fingerprint,storage=window.localStorage){
  const next=readCaseInbox(storage).filter(x=>x.fingerprint!==fingerprint)
  storage.setItem(INBOX_KEY,JSON.stringify(next))
  return next
}

/** V34: portable, private, versioned backups. No implicit cloud upload. */
export const BACKUP_FORMAT_V2='wanxiang-case-inbox-backup-v2'
export const BACKUP_MAX_CHARS=2000000

function normalizeInboxBackupRecord(item){
  if(!item||typeof item!=='object'||Array.isArray(item)||
     typeof item.fingerprint!=='string'||!item.fingerprint||
     item.fingerprint.length>120)throw new Error('备份中有无效案例编号')
  if(!['待审核','收录','暂不收录'].includes(item.status))
    throw new Error('备份中有非法审核状态')
  if(item.review_note!=null&&(typeof item.review_note!=='string'||item.review_note.length>600))
    throw new Error('备份中的审核备注不合法或超过600字')
  return {
    fingerprint:item.fingerprint,
    imported_at:scalar(item.imported_at,60),
    status:item.status,
    review_note:item.review_note||'',
    case:sanitizeSharedCase(item.case,{includeResearch:true})
  }
}
function validateBackupRecords(items){
  if(!Array.isArray(items)||items.length>MAX_INBOX)
    throw new Error('收案簿备份数量无效：每份最多40个案例')
  const seen=new Set()
  return items.map(item=>{
    const normalized=normalizeInboxBackupRecord(item)
    if(seen.has(normalized.fingerprint))throw new Error('备份中有重复案例编号')
    seen.add(normalized.fingerprint)
    return normalized
  })
}
export function createInboxBackup(entries,exportedAt=new Date().toISOString()){
  const records=validateBackupRecords(entries)
  return {format:BACKUP_FORMAT_V2,version:2,
    exported_at:scalar(exportedAt,60),
    manifest:{total:records.length,
      pending:records.filter(x=>x.status==='待审核').length,
      approved:records.filter(x=>x.status==='收录').length,
      excluded:records.filter(x=>x.status==='暂不收录').length,
      note:'私人案例文件，未加密；仅可在本人设备间手动传递。'},
    records}
}
function decodeInboxBackup(raw){
  if(typeof raw!=='string'||raw.length>BACKUP_MAX_CHARS)
    throw new Error('备份文件过大或无效（最多2MB）')
  let backup
  try{backup=JSON.parse(raw)}catch{throw new Error('无法解析备份 JSON 文件')}
  if(!backup||typeof backup!=='object'||Array.isArray(backup)||
     !((backup.format==='wanxiang-case-inbox-backup-v1'&&backup.version===1)||
       (backup.format===BACKUP_FORMAT_V2&&backup.version===2)))
    throw new Error('不是支持的万象书院本机案例簿备份（V27 或 V34）')
  const records=validateBackupRecords(backup.records)
  // Displayed manifest is always derived from validated records; never trust file counts.
  return {version:backup.version,exported_at:scalar(backup.exported_at,60),records}
}
function readExistingForMerge(storage){
  const raw=storage.getItem(INBOX_KEY)
  if(raw==null)return []
  let obj
  try{obj=JSON.parse(raw)}catch{throw new Error('当前设备的案例簿损坏，已暂停合并以保护原始数据')}
  if(!Array.isArray(obj)||obj.length>MAX_INBOX)
    throw new Error('当前设备收案簿格式异常，已暂停合并')
  // Refuse to rewrite existing records if the stored list contains malformed data.
  return validateBackupRecords(obj)
}
function compareBackup(raw,storage){
  const backup=decodeInboxBackup(raw)
  const existing=readExistingForMerge(storage)
  const current=new Map(existing.map(x=>[x.fingerprint,x]))
  const fresh=[],conflicts=[]
  let duplicates=0
  for(const record of backup.records){
    const old=current.get(record.fingerprint)
    if(!old){fresh.push(record);continue}
    duplicates++
    if(JSON.stringify(old.case)!==JSON.stringify(record.case))
      conflicts.push(record.fingerprint)
  }
  return {backup,existing,fresh,conflicts,duplicates}
}
/** Check compatibility, conflict and capacity without writing to localStorage. */
export function previewInboxBackup(raw,storage=window.localStorage){
  const {backup,existing,fresh,conflicts,duplicates}=compareBackup(raw,storage)
  const overLimit=existing.length+fresh.length>MAX_INBOX
  return {version:backup.version,exported_at:backup.exported_at,
    total:backup.records.length,existing:existing.length,
    added:fresh.length,duplicates,conflicts:conflicts.length,
    conflicted_ids:conflicts.slice(0,10),overLimit,canRestore:!overLimit,
    pending:backup.records.filter(x=>x.status==='待审核').length,
    approved:backup.records.filter(x=>x.status==='收录').length,
    excluded:backup.records.filter(x=>x.status==='暂不收录').length}
}
/** Merge missing records only, preserving every existing case and review decision.
 * All file and capacity checks finish before one localStorage write. */
export function restoreInboxBackup(raw,storage=window.localStorage){
  const {backup,existing,fresh,conflicts,duplicates}=compareBackup(raw,storage)
  if(existing.length+fresh.length>MAX_INBOX)
    throw new Error('合并后超过40份限制，未修改本机收案簿；请先导出备份并整理')
  const next=[...existing,...fresh]
  storage.setItem(INBOX_KEY,JSON.stringify(next))
  return {entries:next,added:fresh.length,duplicates,conflicts:conflicts.length,
    original_version:backup.version}
}
