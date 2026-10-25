import React,{useEffect,useState} from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ArtsHub,{ARTS} from './ArtsHub.jsx'
import SixYaoStage from './SixYaoStage.jsx'
import KnowledgeStage from './KnowledgeStage.jsx'
import StudyHall from './StudyHall.jsx'
import CaseExchangeCenter from './CaseExchangeCenter.jsx'
import LearnCastingStage from './LearnCastingStage.jsx'
import './style.css'
import './theme-refresh.css'

const VALID_ROUTES=new Set(['home','choose','learn','library','cases',...ARTS.map(a=>a.id)])
function routeFromUrl(){
  const route=window.location.hash.slice(1)
  return VALID_ROUTES.has(route)?route:'home'
}

function Academy(){
  const [mode,setMode]=useState(routeFromUrl)
  const [personalApiKey,setPersonalApiKey]=useState('')
  const [aiModel,setAiModel]=useState('deepseek-chat')
  const [aiAccessCode,setAiAccessCode]=useState('')
  const [activeGroup,setActiveGroup]=useState('全部')
  const [choosePage,setChoosePage]=useState(0)
  const [experience,setExperience]=useState(null)
  const config={personalApiKey,setPersonalApiKey,aiModel,setAiModel,aiAccessCode,setAiAccessCode}

  useEffect(()=>{
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
      setMode(routeFromUrl())
      window.scrollTo({top:0,behavior:'instant'})
    }
    window.addEventListener('popstate',syncBrowserHistory)
    window.addEventListener('hashchange',syncBrowserHistory)
    return ()=>{
      window.removeEventListener('popstate',syncBrowserHistory)
      window.removeEventListener('hashchange',syncBrowserHistory)
    }
  },[])

  function navigate(next,replace=false){
    if(!VALID_ROUTES.has(next))return
    if(mode!==next){
      const state={academyRoute:next,from:mode}
      if(replace)window.history.replaceState(state,'','#'+next)
      else window.history.pushState(state,'','#'+next)
      setMode(next)
    }
    window.scrollTo({top:0,behavior:'instant'})
  }

  function goBackTo(target){
    if(window.history.state?.academyRoute===mode&&window.history.state?.from===target){
      window.history.back()
    }else{
      navigate(target,true)
    }
  }

  function closeLibrary(){
    const from=window.history.state?.academyRoute==='library'?window.history.state?.from:null
    goBackTo(from && from!=='library'?from:'home')
  }

  return <>
    {experience&&<div className="experience-visitor-banner">
      <span>{experience.role==='admin'?'站长管理模式':'受邀体验 · '+experience.label}</span>
      <small>{experience.role==='guest'?'体验记录仅用于书院改进，案例须自愿提交':'可进入后台审核案例'}</small>
      {experience.role==='admin'&&<a href="/admin">管理后台 ↗</a>}
      <button type="button" onClick={logoutExperience}>退出体验</button>
    </div>}
    {mode==='choose'&&<div className="case-exchange-quick-entry">
      <button type="button" onClick={()=>navigate('cases')}>已有研究案例？进入案例交换中心 ↗</button>
    </div>}
    {mode==='learn'?<LearnCastingStage onBack={()=>goBackTo('choose')}
      onPractice={next=>navigate(next)}/>:
    mode==='cases'?<CaseExchangeCenter onClose={()=>navigate('choose')}/>:
    (mode==='home'||mode==='choose')?
      <ArtsHub screen={mode}
        onStart={()=>navigate('choose')}
        onBack={()=>goBackTo('home')}
        onSelect={next=>navigate(next)}
        onStudy={()=>navigate('library')} onLearn={()=>navigate('learn')}
        activeGroup={activeGroup} setActiveGroup={setActiveGroup}
        page={choosePage} setPage={setChoosePage}/>:
      mode==='library'?
      <StudyHall onClose={closeLibrary} onPractice={()=>navigate('learn')}
        apiKey={personalApiKey} setApiKey={setPersonalApiKey}
        aiModel={aiModel} setAiModel={setAiModel}
        accessCode={aiAccessCode} setAccessCode={setAiAccessCode}/>:
      mode==='meihua'?
      <App onBack={()=>goBackTo('choose')} onOpenStudy={()=>navigate('library')} onLearn={()=>navigate('learn')} apiConfig={config}/>:
      mode==='liuyao'?
      <SixYaoStage onBack={()=>goBackTo('choose')} onStudy={()=>navigate('library')} onLearn={()=>navigate('learn')} apiConfig={config}/>:
      <KnowledgeStage mode={mode} onBack={()=>goBackTo('choose')} onStudy={()=>navigate('library')}/>}
  </>
}

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><Academy/></React.StrictMode>)
