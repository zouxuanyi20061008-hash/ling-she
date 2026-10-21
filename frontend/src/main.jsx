import React,{useState} from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ArtsHub from './ArtsHub.jsx'
import SixYaoStage from './SixYaoStage.jsx'
import KnowledgeStage from './KnowledgeStage.jsx'
import StudyHall from './StudyHall.jsx'
import './style.css'

function Academy(){
  const [mode,setMode]=useState('home')
  const [studyOpen,setStudyOpen]=useState(false)
  const [personalApiKey,setPersonalApiKey]=useState('')
  const [aiModel,setAiModel]=useState('deepseek-chat')
  const [aiAccessCode,setAiAccessCode]=useState('')
  const config={personalApiKey,setPersonalApiKey,aiModel,setAiModel,aiAccessCode,setAiAccessCode}
  function navigate(next){
    setMode(next);setStudyOpen(false)
    window.scrollTo({top:0,behavior:'instant'})
  }
  return <>
    {mode==='home'?
      <ArtsHub onSelect={navigate} onStudy={()=>setStudyOpen(true)}/>:
      mode==='meihua'?
      <App onBack={()=>navigate('home')} onOpenStudy={()=>setStudyOpen(true)} apiConfig={config}/>:
      mode==='liuyao'?
      <SixYaoStage onBack={()=>navigate('home')} onStudy={()=>setStudyOpen(true)} apiConfig={config}/>:
      <KnowledgeStage mode={mode} onBack={()=>navigate('home')} onStudy={()=>setStudyOpen(true)}/>}
    {studyOpen && <StudyHall onClose={()=>setStudyOpen(false)}
      apiKey={personalApiKey} setApiKey={setPersonalApiKey}
      aiModel={aiModel} setAiModel={setAiModel}
      accessCode={aiAccessCode} setAccessCode={setAiAccessCode}/>}
  </>
}
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><Academy/></React.StrictMode>)
