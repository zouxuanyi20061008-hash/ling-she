import HomeExperiences from './HomeExperiences.jsx'
import './academy-games.css'
import './academy-games-theme.css'

export default function AcademyGames({ onSelect, activeIndex, onIndexChange }) {
  return <div className="atlas-games">
    <HomeExperiences onSelect={onSelect} activeIndex={activeIndex} onIndexChange={onIndexChange} />
  </div>
}
