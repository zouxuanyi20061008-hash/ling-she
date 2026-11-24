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

const StudyHall=React.lazy(()=>import('./StudyHall.jsx'))
const CaseExchangeCenter=React.lazy(()=>import('./CaseExchangeCenter.jsx'))
const CAST_ROUTES=new Set(ARTS.map(art=>art.id))
const VALID_ROUTES=new Set(['home','choose','learn','library','cases',...CAST_ROUTES])
const CAST_RESULT_SUFFIX='/result'
function routeFromUrl(){
  const route=window.location.hash.slice(1)
  const method=route.endsWith(CAST_RESULT_SUFFIX)?route.slice(0,-CAST_RESULT_SUFFIX.length):null
  if(CAST_ROUTES.has(method))return method
  return VALID_ROUTES.has(route)?route:'home'
}

function Academy(){
  const [mode,setMode]=useState(routeFromUrl)
  const [learnFrom,setLearnFrom]=useState('liuyao')
  const [personalApiKey,setPersonalApiKey]=useState('')
  const [aiModel,setAiModel]=useState('deepseek-flash')
  const [aiAccessCode,setAiAccessCode]=useState('')
  const [activeGroup,setActiveGroup]=useState('全部')
  const [choosePage,setChoosePage]=useState(0)
  const [homeExperience,setHomeExperience]=useState(0)
  const [experience,setExperience]=useState(null)
  const homeScroll=useRef(0)
  const chooseScroll=useRef(0)
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
    const module=['home','choose','library','meihua','liuyao'].includes(mode)?mode:'other'
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
      const next=routeFromUrl()
      pendingScroll.current=next==='home'?homeScroll.current:next==='choose'?chooseScroll.current:0
      setMode(next)
    }
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
    if(mode==='home')homeScroll.current=window.scrollY
    if(mode==='choose')chooseScroll.current=window.scrollY
    pendingScroll.current=replace&&next==='home'?homeScroll.current:replace&&next==='choose'?chooseScroll.current:0
    const state={academyRoute:next,from:mode}
    if(replace)window.history.replaceState(state,'','#'+next)
    else window.history.pushState(state,'','#'+next)
    setMode(next)
  }

  function goBackTo(target){
    if(!window.location.hash.endsWith(CAST_RESULT_SUFFIX)&&window.history.state?.academyRoute===mode&&window.history.state?.from===target){
      window.history.back()
    }else{
      navigate(target,true)
    }
  }

  function closeLibrary(){
    const from=window.history.state?.academyRoute==='library'?window.history.state?.from:null
    goBackTo(from && from!=='library'?from:'home')
  }

  function closeCast(){
    goBackTo(window.history.state?.from==='home'?'home':'choose')
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
        page={choosePage} setPage={setChoosePage}
        homeExperience={homeExperience} setHomeExperience={setHomeExperience}/>:
      mode==='library'?
      <React.Suspense fallback={<main className="academy-stage p-6" role="status">正在打开藏经阁…</main>}>
        <StudyHall onClose={closeLibrary} onPractice={()=>{setLearnFrom('liuyao');navigate('learn')}}
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
