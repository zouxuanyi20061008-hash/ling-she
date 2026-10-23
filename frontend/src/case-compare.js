/** V33: descriptive case-to-case and condition-to-condition research.
 * Groups are based on contributors' records, not independently validated events.
 * No p-values, divination accuracy, causal inference, or automatic rule "confirmation".
 */
import {inspectCaseEvidence} from './case-review.js'

export const COMPARE_DIMENSIONS=[
  {id:'ben_gua',label:'本卦'},
  {id:'bian_gua',label:'变卦'},
  {id:'month_branch',label:'月建'},
  {id:'day_ganzhi',label:'日辰干支'},
  {id:'moving_count',label:'动爻数量'},
  {id:'moving_lines',label:'动爻位置组合'},
  {id:'selected_position',label:'研习主爻'},
  {id:'chosen_category',label:'研习类别'},
]
const allowed=new Set(COMPARE_DIMENSIONS.map(x=>x.id))
const reported=['基本吻合','部分吻合','未吻合','尚无结果','无法判断']
function movingIndices(c){
  const n=c?.original_numbers
  if(!Array.isArray(n)||n.length!==6)return null
  if(n.some(x=>!Number.isInteger(x)||![6,7,8,9].includes(x)))return null
  return n.flatMap((x,i)=>x===6||x===9?[i+1]:[])
}
export function conditionValue(caseRecord,dimension){
  if(!allowed.has(dimension))throw new Error('不支持这种对照条件')
  const c=caseRecord?.case||caseRecord||{}
  if(dimension==='moving_count'||dimension==='moving_lines'){
    const pos=movingIndices(c)
    if(!pos)return '未记录'
    if(dimension==='moving_count')return pos.length+'爻'
    return pos.length?pos.map(n=>'第'+n+'爻').join('、'):'无动爻'
  }
  if(dimension==='selected_position'){
    const n=c.selected_position
    return Number.isInteger(n)&&n>=1&&n<=6?'第'+n+'爻':'未记录'
  }
  const value=c[dimension]
  return typeof value==='string'&&value.trim()?value.trim().slice(0,100):'未记录'
}
function evidenceCounts(rows){
  const result={total:rows.length,with_followup:0,missing_followup:0,
    time_needs_review:0,calendar_missing:0,unresolved_cases:0,
    self_reports:Object.fromEntries(reported.map(x=>[x,0])),
    independently_verified:0,accuracy_calculated:false}
  for(const row of rows){
    const evidence=inspectCaseEvidence(row.case)
    if(evidence.has_followup)result.with_followup++
    else result.missing_followup++
    if(evidence.needs_time_review)result.time_needs_review++
    if(!evidence.has_calendar_params)result.calendar_missing++
    const kinds=new Set((Array.isArray(row.case?.feedback)?row.case.feedback:[])
      .map(f=>f?.result_type).filter(x=>reported.includes(x)))
    for(const label of kinds)result.self_reports[label]++
    if(kinds.has('尚无结果')||kinds.has('无法判断'))result.unresolved_cases++
  }
  return result
}
export function conditionGroups(entries,dimension){
  if(!allowed.has(dimension))throw new Error('不支持这种对照条件')
  const map=new Map()
  for(const row of entries||[]){
    const value=conditionValue(row.case,dimension)
    if(!map.has(value))map.set(value,[])
    map.get(value).push(row)
  }
  return [...map].map(([value,rows])=>({value,...evidenceCounts(rows)}))
    .sort((a,b)=>b.total-a.total||a.value.localeCompare(b.value,'zh-CN'))
}
export function conditionContrast(entries,dimension,value){
  if(!allowed.has(dimension))throw new Error('不支持这种对照条件')
  if(typeof value!=='string'||value.length>100)throw new Error('对照条件值无效')
  const selected=[],others=[]
  for(const row of entries||[]){
    (conditionValue(row.case,dimension)===value?selected:others).push(row)
  }
  return {dimension,value,matching:evidenceCounts(selected),other:evidenceCounts(others),
    matchedIds:selected.map(x=>x.fingerprint),
    description:'按单一卦象条件划分，不控制其他背景差异；自述标签有重叠，不能推导准确率或因果关系。',
    caution:selected.length<5||others.length<5?
      '对照组或其他组不足5份，当前只能整理材料，不能判断规则是否成立。':
      '即使分组样本较多，也需要事前规则、统一记录标准、独立事实核查和反例评估。'}
}
const pairFields=[
  ['本卦','ben_gua'],['变卦','bian_gua'],['日辰干支','day_ganzhi'],
  ['月建','month_branch'],['研习类别','chosen_category'],
]
export function compareCasePair(entries,ids){
  if(!Array.isArray(ids)||ids.length!==2||ids[0]===ids[1])
    throw new Error('请选择两份不同的案例进行对照')
  const found=ids.map(id=>entries.find(x=>x.fingerprint===id))
  if(found.some(x=>!x))throw new Error('所选案例不在当前收案簿中')
  const [a,b]=found
  const rows=pairFields.map(([label,key])=>({label,
    a:conditionValue(a.case,key),b:conditionValue(b.case,key)}))
  for(const [label,id] of [['动爻数量','moving_count'],['动爻位置组合','moving_lines'],
    ['研习主爻','selected_position']]){
    rows.push({label,a:conditionValue(a.case,id),b:conditionValue(b.case,id)})
  }
  const ea=inspectCaseEvidence(a.case),eb=inspectCaseEvidence(b.case)
  rows.push({label:'证据准备状态',a:ea.status,b:eb.status})
  rows.push({label:'审核状态',a:a.status||'未记录',b:b.status||'未记录'})
  return {cases:[{id:a.fingerprint,ben:a.case.ben_gua||'未知本卦',before:a.case.before||'',
      notes:a.review_note||'',feedback:a.case.feedback||[]},
    {id:b.fingerprint,ben:b.case.ben_gua||'未知本卦',before:b.case.before||'',
      notes:b.review_note||'',feedback:b.case.feedback||[]}],
    rows:rows.map(row=>({...row,equal:row.a===row.b})),
    warning:'相同卦象和动爻不意味着问题背景等价；比较结果仅供人工研究，不代表验证了预测规律。'}
}
