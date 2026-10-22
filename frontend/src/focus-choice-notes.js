/** V26：用户自己的用神候选选择理由，按起卦依据存于本机。 */
const PREFIX='wanxiang-liuyao-focus-choice-v26:'
export const REASON_FIELDS=['reason','counter','context']
export function choiceIdentity(chart){
  return JSON.stringify([
    chart.lines.map(line=>line.number),
    chart.calendar.day?.ganzhi??null,
    chart.calendar.month?.branch??null,
    chart.focus?.category??null,
    chart.calendar_provenance?.beijing_time??null,
    chart.calendar_provenance?.day_boundary??null
  ])
}
export function choiceKey(chart){
  const input=choiceIdentity(chart)
  let hash=2166136261
  for(let i=0;i<input.length;i++)hash=Math.imul(hash^input.charCodeAt(i),16777619)>>>0
  return PREFIX+hash.toString(16).padStart(8,'0')
}
export function readChoices(chart,storage=window.localStorage){
  try{
    const data=JSON.parse(storage.getItem(choiceKey(chart))||'null')
    if(data?.identity!==choiceIdentity(chart)||data?.version!=='V26')return {}
    const out={}
    for(const [key,item] of Object.entries(data.records||{})){
      if(!/^[1-6]$/.test(key)||!item||typeof item!=='object')continue
      const fields={}
      for(const field of REASON_FIELDS){
        fields[field]=typeof item[field]==='string'?item[field].slice(0,1200):''
      }
      out[key]={...fields,updated_at:item.updated_at||null}
    }
    return out
  }catch{return {}}
}
export function readSelectedChoice(chart,storage=window.localStorage){
  const selected=chart.focus_decision?.selected_position
  if(!selected||!chart.focus_decision.candidates?.some(x=>x.position===selected))return null
  const record=readChoices(chart,storage)[String(selected)]
  return record&&REASON_FIELDS.some(name=>record[name].trim())?
    {position:selected,ganzhi:chart.najia_lines?.[selected-1]?.ganzhi||null,
     category:chart.focus?.category||null,...record}:null
}
export function saveChoice(chart,position,fields,storage=window.localStorage){
  if(!Number.isInteger(position)||!chart.focus_decision?.candidates?.some(x=>x.position===position)){
    throw new Error('必须由用户选择本卦已存在的用神候选爻')
  }
  const old=readChoices(chart,storage)
  const safe={}
  for(const field of REASON_FIELDS)safe[field]=String(fields[field]||'').slice(0,1200)
  if(REASON_FIELDS.some(key=>safe[key].trim())){
    old[String(position)]={...safe,updated_at:new Date().toISOString()}
  }else delete old[String(position)]
  if(!Object.keys(old).length){
    storage.removeItem(choiceKey(chart))
    return null
  }
  const payload={version:'V26',identity:choiceIdentity(chart),records:old}
  storage.setItem(choiceKey(chart),JSON.stringify(payload))
  return old[String(position)]||null
}
