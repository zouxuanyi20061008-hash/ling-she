import './liuyao-coins.css'

const FLIGHT_MS=820
const STAGGER_MS=38
const LANDING_HOLD_MS=64
const RIM_LAYERS=[-2,-1,0,1,2]

export const COIN_TOSS_MS=FLIGHT_MS+2*STAGGER_MS+LANDING_HOLD_MS

function CoinModel({value,target,index}){
  const face=value===3?180:0
  const landingFace=target===3?180:0
  const direction=index===1?-1:1
  const turns=direction*(index===2?1080:720)
  return <div className="liuyao-coin-place" style={{
    '--flight-time':`${FLIGHT_MS}ms`,
    '--flight-delay':`${index*STAGGER_MS}ms`,
    '--face-angle':`${face}deg`,
    '--flip-arc':`${turns*.7+face}deg`,
    '--flip-stop':`${turns+landingFace}deg`,
  }}>
    <div className="liuyao-coin-shadow" />
    <div className="liuyao-coin-flight">
      <div className="liuyao-coin-model" data-coin-value={value}>
        {RIM_LAYERS.map(layer=><span className="liuyao-coin-rim" key={layer} style={{'--rim-layer':layer}}/>)}
        <div className="liuyao-coin-face liuyao-coin-face--word">
          <span className="liuyao-coin-hole" />
          <span className="liuyao-coin-glyph north">萬</span><span className="liuyao-coin-glyph south">象</span>
          <span className="liuyao-coin-glyph east">通</span><span className="liuyao-coin-glyph west">寶</span>
        </div>
        <div className="liuyao-coin-face liuyao-coin-face--reverse">
          <span className="liuyao-coin-hole" />
          <span className="liuyao-coin-reverse-mark north" /><span className="liuyao-coin-reverse-mark south" />
          <span className="liuyao-coin-reverse-mark east" /><span className="liuyao-coin-reverse-mark west" />
        </div>
      </div>
    </div>
  </div>
}

export default function LiuyaoCoinTray({faces,landingFaces}){
  return <div className="liuyao-coin-tray" data-phase={landingFaces?'rolling':'settled'} aria-hidden="true">
    {faces.map((value,index)=><CoinModel key={index} index={index} value={value} target={landingFaces?.[index]??value}/>)}
  </div>
}
