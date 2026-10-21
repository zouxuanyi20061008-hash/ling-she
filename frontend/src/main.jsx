import React,{useEffect,useState} from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ArtsHub,{ARTS} from './ArtsHub.jsx'
import SixYaoStage from './SixYaoStage.jsx'
import KnowledgeStage from './KnowledgeStage.jsx'
import StudyHall from './StudyHall.jsx'
import './style.css'

const VALID_ROUTES=new Set(['home','choose',...ARTS.map(a=>a.id)])
function routeFromUrl(){
  const route=window.location.hash.slice(1)
  return VALID_ROUTES.has(route)?route:'home'
}

function Academy(){
  const [mode,setMode]=useState(routeFromUrl)
  const [studyOpen,setStudyOpen]=useState(false)
  const [personalApiKey,setPersonalApiKey]=useState('')
  const [aiModel,setAiModel]=useState('deepseek-chat')
  const [aiAccessCode,setAiAccessCode]=useState('')
  const [activeGroup,setActiveGroup]=useState('全部')
  const [choosePage,setChoosePage]=useState(0)
  const config={personalApiKey,setPersonalApiKey,aiModel,setAiModel,aiAccessCode,setAiAccessCode}

  useEffect(()=>{
    function syncBrowserHistory(){
      setMode(routeFromUrl())
      setStudyOpen(false)
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
    setStudyOpen(false)
    window.scrollTo({top:0,behavior:'instant'})
  }

  function goBackTo(target){
    if(window.history.state?.academyRoute===mode&&window.history.state?.from===target){
      window.history.back()
    }else{
      navigate(target,true)
    }
  }

  return <>
    {(mode==='home'||mode==='choose')?
      <ArtsHub screen={mode}
        onStart={()=>navigate('choose')}
        onBack={()=>goBackTo('home')}
        onSelect={next=>navigate(next)}
        onStudy={()=>setStudyOpen(true)}
        activeGroup={activeGroup} setActiveGroup={setActiveGroup}
        page={choosePage} setPage={setChoosePage}/>:
      mode==='meihua'?
      <App onBack={()=>goBackTo('choose')} onOpenStudy={()=>setStudyOpen(true)} apiConfig={config}/>:
      mode==='liuyao'?
      <SixYaoStage onBack={()=>goBackTo('choose')} onStudy={()=>setStudyOpen(true)} apiConfig={config}/>:
      <KnowledgeStage mode={mode} onBack={()=>goBackTo('choose')} onStudy={()=>setStudyOpen(true)}/>}
    {studyOpen&&<StudyHall onClose={()=>setStudyOpen(false)}
      apiKey={personalApiKey} setApiKey={setPersonalApiKey}
      aiModel={aiModel} setAiModel={setAiModel}
      accessCode={aiAccessCode} setAccessCode={setAiAccessCode}/>}
  </>
}

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><Academy/></React.StrictMode>)
