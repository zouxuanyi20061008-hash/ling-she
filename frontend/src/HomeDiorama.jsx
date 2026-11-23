export default function HomeDiorama({kind,picked,solved,scenery,children}){
  return <div className="home-diorama" data-scene={kind} data-pick={picked??undefined} data-solved={solved||undefined}>
    <div className="home-diorama-set" aria-hidden="true">{scenery}</div>
    <div className="home-diorama-controls">{children}</div>
  </div>
}
