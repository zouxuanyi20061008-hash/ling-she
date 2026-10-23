/** V32: descriptive counts, targeted review queues and consent-based batch exports.
 * No claimed prediction success rate, ranking, or independent validation. */
import {inspectCaseEvidence,exportCaseReviewCsv} from './case-review.js'

export const REVIEW_QUEUES=[
  {id:'all',label:'全部案例'},
  {id:'pending',label:'待审核'},
  {id:'missing_followup',label:'待补事实'},
  {id:'time_review',label:'时间需核'},
  {id:'missing_calendar',label:'日月缺项'},
  {id:'with_followup',label:'已有事后自述'},
]

export function reviewQueueMatch(entry,queue){
  const evidence=inspectCaseEvidence(entry?.case)
  switch(queue){
    case 'all':return true
    case 'pending':return entry?.status==='待审核'
    case 'missing_followup':return !evidence.has_followup
    case 'time_review':return evidence.needs_time_review
    case 'missing_calendar':return !evidence.has_calendar_params
    case 'with_followup':return evidence.has_followup
    default:throw new Error('未知复盘筛选类型')
  }
}

export function summarizeCaseInbox(entries){
  const items=Array.isArray(entries)?entries:[]
  const statuses={'待审核':0,'收录':0,'暂不收录':0}
  const categoryCounts=new Map()
  const outcomes={'基本吻合':0,'部分吻合':0,'未吻合':0,'尚无结果':0,'无法判断':0}
  const res={total:items.length,by_status:statuses,with_followup:0,
    missing_followup:0,needs_time_review:0,missing_calendar:0,
    case_with_unresolved:0,with_counter_notes:0,
    categories:[],reported_outcomes:outcomes,independently_verified:0,
    accuracy_calculated:false}
  for(const entry of items){
    if(Object.prototype.hasOwnProperty.call(statuses,entry.status))statuses[entry.status]++
    const c=entry.case||{}
    const quality=inspectCaseEvidence(c)
    if(quality.has_followup)res.with_followup++
    else res.missing_followup++
    if(quality.needs_time_review)res.needs_time_review++
    if(!quality.has_calendar_params)res.missing_calendar++
    if(c.human_review?.counter?.trim()||c.focus_selection?.counter?.trim()||entry.review_note?.trim())
      res.with_counter_notes++
    const category=typeof c.chosen_category==='string'&&c.chosen_category.trim()
      ?c.chosen_category.trim().slice(0,50):'未标记'
    categoryCounts.set(category,(categoryCounts.get(category)||0)+1)
    const seenOutcomes=new Set()
    for(const note of Array.isArray(c.feedback)?c.feedback:[]){
      if(Object.prototype.hasOwnProperty.call(outcomes,note?.result_type))
        seenOutcomes.add(note.result_type)
    }
    for(const name of seenOutcomes)outcomes[name]++
    if(seenOutcomes.has('尚无结果')||seenOutcomes.has('无法判断'))
      res.case_with_unresolved++
  }
  res.categories=[...categoryCounts].map(([name,count])=>({name,count}))
    .sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'zh-CN'))
    .slice(0,8)
  // "Reported outcomes" is number of cases mentioning each self-reported label.
  // One case can mention multiple labels, so labels are not mutually exclusive.
  return res
}

export function exportSelectedReviewCsv(entries,ids){
  const selected=new Set(ids)
  if(!selected.size)throw new Error('请先选择要导出的案例')
  const chosen=entries.filter(x=>selected.has(x.fingerprint))
  if(chosen.length!==selected.size)throw new Error('所选案例已经变化，请重新勾选')
  return exportCaseReviewCsv(chosen)
}

export function selectedReport(entries,ids){
  const selected=new Set(ids)
  return summarizeCaseInbox(entries.filter(x=>selected.has(x.fingerprint)))
}
