import './home-motion-scenes.css'

const COIN_RIM_LAYERS = [-2, -1, 0, 1, 2]

export function CoinFaces(){
  return <span className="home-coin-display" aria-hidden="true">
    <span className="home-coin-object">
      {COIN_RIM_LAYERS.map(layer=><span key={layer} className="home-coin-edge" style={{'--home-rim-layer':layer}}/>)}
      <span className="home-coin-face home-coin-face--word">
        <span className="home-coin-cutout"/>
        <span className="home-coin-stamp home-coin-stamp--north">萬</span>
        <span className="home-coin-stamp home-coin-stamp--south">象</span>
        <span className="home-coin-stamp home-coin-stamp--east">通</span>
        <span className="home-coin-stamp home-coin-stamp--west">寶</span>
      </span>
      <span className="home-coin-face home-coin-face--reverse">
        <span className="home-coin-cutout"/>
        <span className="home-coin-mark home-coin-stamp--north"/>
        <span className="home-coin-mark home-coin-stamp--south"/>
        <span className="home-coin-mark home-coin-stamp--east"/>
        <span className="home-coin-mark home-coin-stamp--west"/>
      </span>
    </span>
  </span>
}
