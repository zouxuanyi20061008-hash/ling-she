const apiBase = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '')

export const isPackagedApp = import.meta.env.VITE_PACKAGED_APP === '1'

export function apiUrl(path) {
  return apiBase + path
}
