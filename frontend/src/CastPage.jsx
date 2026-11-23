import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import './cast-page.css'

const COMPACT_CAST_QUERY = '(max-width: 650px)'

function subscribeToCompactLayout(onChange) {
  const query = window.matchMedia?.(COMPACT_CAST_QUERY)
  query?.addEventListener?.('change', onChange)
  return () => query?.removeEventListener?.('change', onChange)
}

function isCompactLayout() {
  return Boolean(window.matchMedia?.(COMPACT_CAST_QUERY)?.matches)
}

export function useCompactCastLayout() {
  return useSyncExternalStore(subscribeToCompactLayout, isCompactLayout, () => false)
}

export function useCastPage(method, hasResult, { enabled = true } = {}) {
  const compact = useCompactCastLayout()
  const [requestedPage, setRequestedPage] = useState('form')
  const navigationAvailable = useRef(false)
  const formHash = `#${method}`
  const resultHash = `${formHash}/result`
  const page = compact && enabled && hasResult ? requestedPage : 'form'

  useEffect(() => {
    if (!enabled) return
    if (!compact) {
      if (!hasResult && window.location.hash === resultHash) {
        window.history.replaceState(window.history.state, '', formHash)
      }
      return
    }
    function restorePage() {
      if (window.location.hash === resultHash) {
        setRequestedPage(hasResult ? 'result' : 'form')
        if (!hasResult) window.history.replaceState(window.history.state, '', formHash)
      } else if (window.location.hash === formHash) {
        setRequestedPage('form')
      }
    }

    restorePage()
    window.addEventListener('popstate', restorePage)
    window.addEventListener('hashchange', restorePage)
    return () => {
      window.removeEventListener('popstate', restorePage)
      window.removeEventListener('hashchange', restorePage)
    }
  }, [compact, enabled, formHash, hasResult, resultHash])

  useLayoutEffect(() => {
    navigationAvailable.current = compact && enabled
    return () => { navigationAvailable.current = false }
  }, [compact, enabled])

  useLayoutEffect(() => {
    if (compact && enabled) window.scrollTo({ top: 0, behavior: 'instant' })
  }, [compact, enabled, page])

  function showResult() {
    if (!navigationAvailable.current) return
    setRequestedPage('result')
    if (window.location.hash === formHash) {
      window.history.pushState({ ...window.history.state, castInput: method }, '', resultHash)
    }
  }

  function showForm() {
    if (!navigationAvailable.current) return
    setRequestedPage('form')
    if (window.location.hash === resultHash) {
      if (window.history.state?.castInput === method) window.history.back()
      else window.history.replaceState(window.history.state, '', formHash)
    }
  }

  return { page, compact, showForm, showResult }
}

export function CastPageNav({ title, hasResult, page, showForm, showResult }) {
  const nav = useRef(null)
  const previousPage = useRef(page)
  useLayoutEffect(() => {
    if (previousPage.current !== page) {
      previousPage.current = page
      nav.current?.querySelector('[aria-current="page"]')?.focus({ preventScroll: true })
    }
  }, [page])

  return <nav className="cast-page-nav" aria-label={`${title}排盘页面`} ref={nav}>
    <button type="button" data-cast-page="form" aria-current={page === 'form' ? 'page' : undefined}
      onClick={showForm}>{page === 'result' ? '← 返回排盘' : '排盘参数'}</button>
    <button type="button" data-cast-page="result" aria-current={page === 'result' ? 'page' : undefined}
      disabled={!hasResult} onClick={showResult}>排盘结果</button>
  </nav>
}

export function CastPagePane({ name, page, compact, children }) {
  return <div className="cast-page-pane" data-cast-pane={name} hidden={compact && page !== name}>
    {children}
  </div>
}
