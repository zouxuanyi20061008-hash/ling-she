export function focusTaiyiResultOnMobile(result){
  if(!result||!window.matchMedia?.('(max-width: 650px)').matches)return
  result.focus({preventScroll:true})
  result.scrollIntoView?.({block:'start'})
}
