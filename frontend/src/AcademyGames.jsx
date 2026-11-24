import HomeExperiences from './HomeExperiences.jsx'
import './academy-games.css'
import './academy-games-theme.css'

export default function AcademyGames({ onBack, onSelect, activeIndex, onIndexChange }) {
  return <main className="atlas atlas-screen atlas-games" aria-labelledby="academy-games-title">
    <div className="academy-games-layout">
      <header className="academy-games-header">
        <button type="button" className="academy-games-back" onClick={onBack}>
          <span aria-hidden="true">←</span> 返回首页
        </button>
        <h1 id="academy-games-title">术数游学</h1>
      </header>
      <HomeExperiences onSelect={onSelect} activeIndex={activeIndex} onIndexChange={onIndexChange} />
    </div>
  </main>
}
