import React,{useEffect,useLayoutEffect,useRef,useState} from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ArtsHub,{ARTS} from './ArtsHub.jsx'
import SixYaoStage from './SixYaoStage.jsx'
import KnowledgeStage from './KnowledgeStage.jsx'
import './library.css'
import LearnCastingStage from './LearnCastingStage.jsx'
import './style.css'
import './theme-refresh.css'
import './academy-art.css'
import './casting-art.css'
import './academy-interface.css'
import './mobile-quiet.css'
import './mobile-quiet-home.css'
import './mobile-quiet-cast.css'
import './mobile-quiet-library.css'
import {isPackagedApp} from './api-url.js'
import {listenForAcademySounds} from './academySound.js'

const StudyHall=React.lazy(()=>import('./StudyHall.jsx'))
const CaseExchangeCenter=React.lazy(()=>import('./CaseExchangeCenter.jsx'))
const CAST_ROUTES=new Set(ARTS.map(art=>art.id))
const TRIAL_ROUTE='library/trial'
const TRIAL_CASE_ROUTE='library/trial/case'
const VALID_ROUTES=new Set(['home','choose','learn','library',TRIAL_ROUTE,TRIAL_CASE_ROUTE,'cases',...CAST_ROUTES])
const CAST_RESULT_SUFFIX='/result'
const canonicalRoute=route=>route==='games'?TRIAL_ROUTE:route
const isTrialRoute=route=>route===TRIAL_ROUTE||route===TRIAL_CASE_ROUTE
const isLibraryRoute=route=>route==='library'||isTrialRoute(route)
function routeFromUrl(){
  const route=canonicalRoute(window.location.hash.slice(1))
  const method=route.endsWith(CAST_RESULT_SUFFIX)?route.slice(0,-CAST_RESULT_SUFFIX.length):null
  if(CAST_ROUTES.has(method))return method
  return VALID_ROUTES.has(route)?route:'home'
}

function Academy(){
  useEffect(listenForAcademySounds,[])
  const [mode,setMode]=useState(routeFromUrl)
  const [learnFrom,setLearnFrom]=useState('liuyao')
  const [personalApiKey,setPersonalApiKey]=useState('')
  const [aiModel,setAiModel]=useState('deepseek-flash')
  const [aiAccessCode,setAiAccessCode]=useState('')
  const [activeGroup,setActiveGroup]=useState('全部')
  const [choosePage,setChoosePage]=useState(0)
  const [trialExperience,setTrialExperience]=useState(0)
  const [trialPanel,setTrialPanel]=useState(()=>routeFromUrl()===TRIAL_CASE_ROUTE?'cases':'practice')
  const [experience,setExperience]=useState(null)
  const scrollPositions=useRef({home:0,choose:0,[TRIAL_ROUTE]:0})
  const pendingScroll=useRef(null)
  const config={personalApiKey,setPersonalApiKey,aiModel,setAiModel,aiAccessCode,setAiAccessCode}

  useEffect(()=>{
    if(isPackagedApp)return
    fetch('/api/experience/session',{credentials:'same-origin'})
      .then(r=>r.ok?r.json():null)
      .then(data=>setExperience(data?.authenticated?data:null))
      .catch(()=>setExperience(null))
  },[])
  useEffect(()=>{
    if(experience?.role!=='guest'||!experience.analytics)return
    const section=isLibraryRoute(mode)?'library':mode
    const module=['home','choose','library','meihua','liuyao'].includes(section)?section:'other'
    fetch('/api/experience/event',{
      method:'POST',credentials:'same-origin',
      headers:{'Content-Type':'application/json','X-Experience-Csrf':experience.csrf},
      body:JSON.stringify({module})
    }).catch(()=>{})
  },[experience,mode])
  async function logoutExperience(){
    if(!experience)return
    try{await fetch('/api/experience/logout',{
      method:'POST',credentials:'same-origin',
      headers:{'X-Experience-Csrf':experience.csrf}
    })}catch{}
    window.location.assign('/invite')
  }
  useEffect(()=>{
    function syncBrowserHistory(){
      if(window.location.hash==='#games'){
        window.history.replaceState({...window.history.state,academyRoute:TRIAL_ROUTE},'','#'+TRIAL_ROUTE)
        setTrialPanel('practice')
      }
      const next=routeFromUrl()
      if(next===TRIAL_CASE_ROUTE)setTrialPanel('cases')
      if(next===TRIAL_ROUTE)setTrialPanel(panel=>panel==='cases'?'practice':panel)
      pendingScroll.current=scrollPositions.current[next]??0
      setMode(next)
    }
    if(window.location.hash==='#games')syncBrowserHistory()
    window.addEventListener('popstate',syncBrowserHistory)
    window.addEventListener('hashchange',syncBrowserHistory)
    return ()=>{
      window.removeEventListener('popstate',syncBrowserHistory)
      window.removeEventListener('hashchange',syncBrowserHistory)
    }
  },[])

  useLayoutEffect(()=>{
    const top=pendingScroll.current
    if(top===null)return
    pendingScroll.current=null
    window.scrollTo({top,behavior:'instant'})
  },[mode])

  function navigate(next,replace=false){
    if(!VALID_ROUTES.has(next))return
    if(mode===next)return
    if(Object.hasOwn(scrollPositions.current,mode))scrollPositions.current[mode]=window.scrollY
    pendingScroll.current=replace?(scrollPositions.current[next]??0):0
    const state={academyRoute:next,from:mode}
    if(replace)window.history.replaceState(state,'','#'+next)
    else window.history.pushState(state,'','#'+next)
    setMode(next)
  }

  function goBackTo(target){
    const entry=window.history.state
    if(!window.location.hash.endsWith(CAST_RESULT_SUFFIX)&&canonicalRoute(entry?.academyRoute)===mode&&canonicalRoute(entry?.from)===target){
      window.history.back()
    }else{
      navigate(target,true)
    }
  }

  function changeTrialRoute(open,panel=trialPanel){
    const next=open?(panel==='cases'?TRIAL_CASE_ROUTE:TRIAL_ROUTE):'library'
    if(mode===next)return
    // Library subpages share one browser entry and keep its return destination.
    window.history.replaceState({...window.history.state,academyRoute:next},'','#'+next)
    setMode(next)
  }

  function changeTrialPanel(panel){
    setTrialPanel(panel)
    if(isTrialRoute(mode))changeTrialRoute(true,panel)
  }

  function closeLibrary(){
    const entry=window.history.state
    const from=canonicalRoute(entry?.academyRoute)===mode?canonicalRoute(entry?.from):null
    goBackTo(from&&!isLibraryRoute(from)?from:'home')
  }

  function closeCast(){
    const entry=window.history.state
    if(canonicalRoute(entry?.from)===TRIAL_ROUTE){
      if(entry.academyRoute===mode&&entry.castInput===mode){
        // The history entry after the workshop form may have been restored as a form.
        window.history.go(-2)
      }else{
        goBackTo(TRIAL_ROUTE)
      }
      return
    }
    goBackTo(entry?.from==='home'?'home':'choose')
  }

  return <>
    {experience&&<div className="experience-visitor-banner">
      <span>{experience.role==='admin'?'站长管理模式':'受邀体验 · '+experience.label}</span>
      <small>{experience.role==='guest'?'体验记录仅用于书院改进，案例须自愿提交':'可进入后台审核案例'}</small>
      {experience.role==='admin'&&<a href="/admin">管理后台 ↗</a>}
      <button type="button" onClick={logoutExperience}>退出体验</button>
    </div>}
    {mode==='learn'?<LearnCastingStage initialMethod={learnFrom} onBack={()=>goBackTo('choose')}
      onPractice={next=>navigate(next)}/>:
    mode==='cases'?<React.Suspense fallback={<main className="academy-stage p-6" role="status">正在打开收案中心…</main>}>
      <CaseExchangeCenter onClose={()=>goBackTo('choose')}/>
    </React.Suspense>:
    (mode==='home'||mode==='choose')?
      <ArtsHub screen={mode}
        onStart={()=>navigate('choose')}
        onBack={()=>goBackTo('home')}
        onSelect={next=>navigate(next)}
        onStudy={()=>navigate('library')} onLearn={()=>{setLearnFrom('liuyao');navigate('learn')}}
        onCases={()=>navigate('cases')}
        activeGroup={activeGroup} setActiveGroup={setActiveGroup}
        page={choosePage} setPage={setChoosePage}/>:
      isLibraryRoute(mode)?
      <React.Suspense fallback={<main className="academy-stage p-6" role="status">正在打开藏经阁…</main>}>
        <StudyHall onClose={closeLibrary} onPractice={()=>{setLearnFrom('liuyao');navigate('learn')}}
          trialRoute={isTrialRoute(mode)} onTrialRouteChange={changeTrialRoute}
          trialExperienceIndex={trialExperience} onTrialExperienceChange={setTrialExperience} onTrialWorkshop={method=>navigate(method)}
          trialPanel={trialPanel} onTrialPanelChange={changeTrialPanel}
          apiKey={personalApiKey} setApiKey={setPersonalApiKey}
          aiModel={aiModel} setAiModel={setAiModel}
          accessCode={aiAccessCode} setAccessCode={setAiAccessCode}/>
      </React.Suspense>:
      mode==='meihua'?
      <App onBack={closeCast} onOpenStudy={()=>navigate('library')} onLearn={()=>{setLearnFrom('meihua');navigate('learn')}} apiConfig={config}/>:
      mode==='liuyao'?
      <SixYaoStage onBack={closeCast} onStudy={()=>navigate('library')} onLearn={()=>{setLearnFrom('liuyao');navigate('learn')}} apiConfig={config}/>:
      <KnowledgeStage mode={mode} onBack={closeCast} onStudy={()=>navigate('library')}/>}
  </>
}

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><Academy/></React.StrictMode>)
