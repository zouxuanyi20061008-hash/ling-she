import { Children, cloneElement, useId, useLayoutEffect, useRef, useState } from 'react'
import { useCompactCastLayout } from './CastPage.jsx'
import './cast-result-panels.css'

export function focusCastResultOnMobile(result) {
  if (!result || !window.matchMedia?.('(max-width: 650px)').matches) return
  result.focus({ preventScroll: true })
  result.scrollIntoView?.({ block: 'start' })
}

function ResultSelect({ label, panels, selected, select, controls }) {
  const groups = new Map()
  for (const panel of panels) {
    const { group } = panel.props
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group).push(panel)
  }

  return <label className="cast-result-select">
    <span>{label}</span>
    <select value={selected} aria-controls={controls} onChange={event => select(event.target.value)}>
      {Array.from(groups, ([group, choices]) => {
        const options = choices.map(({ props }) =>
          <option key={props.value} value={props.value}>{props.label}</option>)
        return group ? <optgroup key={group} label={group}>{options}</optgroup> : options
      })}
    </select>
  </label>
}

export function CastResultPanel({ label, id, active, panelRef, children }) {
  return <div className="cast-result-panel" id={id} role="group" aria-label={label}
    data-active={active} ref={panelRef}>
    {children}
  </div>
}

export default function CastResultPanels({ label, variant = 'buttons', defaultValue, value, onValueChange, children }) {
  const compact = useCompactCastLayout()
  const panels = Children.toArray(children).filter(panel => compact || !panel.props.mobileOnly)
  const id = useId()
  const [selection, setSelection] = useState(defaultValue)
  const selected = panels.find(panel => panel.props.value === (value ?? selection))?.props.value ?? panels[0]?.props.value
  const previous = useRef(selected)
  const navigation = useRef(null)
  const selectedPanel = useRef(null)
  const scrollOnSelection = useRef(false)

  function select(value) {
    if (value === selected) return
    scrollOnSelection.current = true
    if (onValueChange) onValueChange(value)
    else setSelection(value)
  }

  useLayoutEffect(() => {
    if (previous.current === selected) return
    const priorPanel = document.getElementById(`${id}-${previous.current}`)
    previous.current = selected
    if (compact) {
      if (priorPanel?.contains(document.activeElement)) {
        navigation.current?.querySelector('select, button[aria-pressed="true"]')?.focus({ preventScroll: true })
      }
      window.scrollTo({ top: 0, behavior: 'instant' })
    } else if (scrollOnSelection.current) selectedPanel.current?.scrollIntoView?.({ block: 'start', behavior: 'instant' })
    scrollOnSelection.current = false
  }, [compact, id, selected])

  if (!panels.length) return null
  if (panels.length === 1) return cloneElement(panels[0], { active: true })

  return <>
    <div className="cast-result-navigation" ref={navigation}>
      {variant === 'select'
        ? <ResultSelect label={label} panels={panels} selected={selected} select={select} controls={`${id}-${selected}`} />
        : <div className="cast-result-buttons" role="group" aria-label={label}
            style={{ '--cast-result-button-count': panels.length }}>
            {panels.map(({ props }) => <button key={props.value} type="button"
              aria-pressed={props.value === selected} aria-controls={`${id}-${props.value}`}
              onClick={event => {
                event.currentTarget.focus({ preventScroll: true })
                select(props.value)
              }}>
              {props.label}
            </button>)}
          </div>}
    </div>
    {panels.map(panel => cloneElement(panel, {
      id: `${id}-${panel.props.value}`,
      active: panel.props.value === selected,
      panelRef: panel.props.value === selected ? selectedPanel : null,
    }))}
  </>
}
