/** V25 本机人工研判：按排盘条件隔离草稿，不访问服务器。 */
export const WORKBOOK_FIELDS=['hypothesis','support','counter','verification']
const PREFIX='wanxiang-liuyao-review-v25:'

export function reviewIdentity(chart){
  return JSON.stringify([
    chart.lines.map(x=>x.number),
    chart.calendar.day?.ganzhi??null,
    chart.calendar.month?.branch??null,
    chart.focus?.category??null,
    chart.focus_decision?.selected_position??null,
    chart.calendar_provenance?.beijing_time??null,
    chart.calendar_provenance?.day_boundary??null
  ])
}
export function workbookKey(chart){
  const input=reviewIdentity(chart)
  let hash=2166136261
  for(let i=0;i<input.length;i++)hash=Math.imul(hash^input.charCodeAt(i),16777619)>>>0
  return PREFIX+hash.toString(16).padStart(8,'0')
}
export function readWorkbook(chart,storage=window.localStorage){
  const identity=reviewIdentity(chart)
  try{
    const saved=JSON.parse(storage.getItem(workbookKey(chart))||'null')
    if(saved?.identity!==identity||saved?.version!=='V25')return null
    const fields={}
    for(const key of WORKBOOK_FIELDS)
      fields[key]=typeof saved.fields?.[key]==='string'?saved.fields[key].slice(0,1400):''
    return {version:'V25',identity,fields,recorded_at:saved.recorded_at}
  }catch{return null}
}
export function saveWorkbook(chart,fields,storage=window.localStorage){
  const safe={}
  for(const key of WORKBOOK_FIELDS)safe[key]=String(fields[key]||'').slice(0,1400)
  if(!WORKBOOK_FIELDS.some(k=>safe[k].trim())){
    storage.removeItem(workbookKey(chart))
    return null
  }
  const result={version:'V25',identity:reviewIdentity(chart),fields:safe,recorded_at:new Date().toISOString()}
  storage.setItem(workbookKey(chart),JSON.stringify(result))
  return result
}
export function removeWorkbook(chart,storage=window.localStorage){
  storage.removeItem(workbookKey(chart))
}
