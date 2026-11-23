import './home-cabinet-scenes.css'

export function CabinetSet({kind}){
  if(kind==='bazi'){
    return <div className="cabinet-bazi-tray">
      <span className="cabinet-tray-floor"/>
      <span className="cabinet-tray-pin top-start"/>
      <span className="cabinet-tray-pin top-end"/>
      <span className="cabinet-tray-pin bottom-start"/>
      <span className="cabinet-tray-pin bottom-end"/>
    </div>
  }

  if(kind==='fengshui'){
    return <div className="cabinet-luopan-block">
      <span className="cabinet-luopan-rim">
        <span className="cabinet-luopan-scale"/>
        <span className="cabinet-luopan-inner"/>
        <span className="cabinet-luopan-needle"/>
        <span className="cabinet-luopan-pin"/>
      </span>
    </div>
  }

  return null
}
