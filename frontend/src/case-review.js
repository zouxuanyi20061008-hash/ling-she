/** V28: Evidence-quality hints for manually contributed cases (not accuracy scores). */
const OUTCOME_TYPES = new Set(['基本吻合','部分吻合','未吻合'])
const NO_RESULT_TYPES = new Set(['尚无结果','无法判断'])

function dateMillis(value){
  if(typeof value!=='string'||!value.trim())return null
  const parsed=Date.parse(value)
  return Number.isFinite(parsed)?parsed:null
}
export function inspectCaseEvidence(record){
  const c=record?.case||record||{}
  const observations=Array.isArray(c.feedback)?c.feedback:[]
  const originalAt=dateMillis(c.created_at)
  const notices=[]
  const tags=[]
  const completeCalendar=Boolean(c.day_ganzhi&&c.month_branch)
  const timeUnknown=!originalAt
  const usable=observations.filter(x=>OUTCOME_TYPES.has(x?.result_type)&&typeof x.observations==='string'&&x.observations.trim().length>=2)
  const unresolved=observations.some(x=>NO_RESULT_TYPES.has(x?.result_type))
  const conflicts=originalAt!==null && observations.some(x=>{
    const at=dateMillis(x?.recorded_at)
    return at!==null && at+60_000<originalAt
  })
  const missingFollowup=usable.length===0
  if(!completeCalendar)notices.push('日辰或月建信息缺失，无法完整复核节令条件')
  else notices.push('已提供日月干支，但不是经第三方确认的权威历法凭证')
  if(timeUnknown)notices.push('事前封存时间缺失或格式无法解析，应核对是否确在事前')
  if(conflicts)notices.push('有后续观察记录时间早于事前封存时间，请核实设备时间和记录顺序')
  if(missingFollowup)notices.push('尚无足够具体、可对照的后续事实；不可当作已经应验的案例')
  if(unresolved)notices.push('包含“尚无结果”或“无法判断”的记录，应保留未决状态')
  if(typeof c.before!=='string'||c.before.trim().length<12)
    notices.push('事前研判过于简短，可能难以与事后事实独立对照')
  if(!c.human_review)notices.push('未附个人四栏研判；这可能是主动保护隐私，并非错误')
  if(conflicts)tags.push('时间顺序需核查')
  if(missingFollowup)tags.push('待补后续')
  else tags.push('已有事后自述')
  if(!completeCalendar)tags.push('日月待补')
  if(timeUnknown)tags.push('封存时间待核')
  const status=conflicts?'需核对记录顺序':missingFollowup?'待补后续事实':'可供人工复核'
  return {
    status,tags,notices,
    has_calendar_params:completeCalendar,
    has_followup:!missingFollowup,
    needs_time_review:conflicts||timeUnknown,
    independently_verified:false,
    divination_accuracy_calculated:false,
    questions:[
      '事前陈述是否能在不知道结果时独立理解？',
      '事后资料来自当事人陈述、截图还是可外部核实的记录？',
      '是否存在其他解释、未吻合的部分或遗漏的样本？'
    ]
  }
}

/** CSV escaping for spreadsheets, including formula injection in case text. */
export function csvCell(value){
  let v=value==null?'':String(value)
  // Spreadsheet formulas can start after invisible whitespace/control characters.
  if(/^[\s\x00-\x1f]*[=+\-@]/u.test(v))v="'"+v
  return '"'+v.replace(/"/g,'""')+'"'
}
export function exportCaseReviewCsv(entries){
  const header=['案例ID','审核状态','证据准备情况','本卦','变卦','事前封存时间','日辰','月建',
    '后续观察条数','是否有可对照的后续事实','先后时间需核','复盘审核备注','事前陈述']
  const lines=[header.map(csvCell).join(',')]
  for(const item of entries){
    const c=item.case||{}
    const review=inspectCaseEvidence(c)
    lines.push([
      item.fingerprint||'',item.status||'',review.status,c.ben_gua||'',c.bian_gua||'',
      c.created_at||'',c.day_ganzhi||'',c.month_branch||'',Array.isArray(c.feedback)?c.feedback.length:0,
      review.has_followup?'有':'无',review.needs_time_review?'是':'否',
      item.review_note||'',c.before||''
    ].map(csvCell).join(','))
  }
  return '\ufeff'+lines.join('\r\n')+'\r\n'
}
