import logger from './logger'
import { getApiBase } from './config'

const log = logger('API')

let onUnauthorized = null
export function setOnUnauthorized(fn) { onUnauthorized = fn }

async function request(path, options = {}) {
  let url = path.replace(/^[A-Z]+ /, '')
  const apiBase = getApiBase()
  if (apiBase) url = apiBase + url
  const method = (path.match(/^[A-Z]+/) || ['GET'])[0]

  const headers = {}

  try {
    const token = localStorage.getItem('token')
    if (token) headers['Authorization'] = `Bearer ${token}`
  } catch { /* localStorage unavailable */ }

  const isFormData = options.body instanceof FormData
  const hasBody = !!options.body

  if (hasBody && !isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  let bodySummary = ''
  if (hasBody && !isFormData && typeof options.body === 'string') {
    try { bodySummary = options.body.slice(0, 200) } catch { bodySummary = '[binary]' }
  } else if (isFormData) {
    bodySummary = '[FormData]'
  }

  log.debug(`${method} ${url}${bodySummary ? ' ' + bodySummary : ''}`)

  const start = performance.now()
  const config = { ...options, headers: { ...headers, ...(options.headers || {}) } }
  const res = await fetch(url, config)
  const elapsed = (performance.now() - start).toFixed(0)

  if (res.status === 401) {
    log.error(`${method} ${url} → 401 未授权，触发登出`)
    if (onUnauthorized) onUnauthorized()
    throw new Error('登录已过期，请重新登录')
  }

  const text = await res.text().catch(() => '')
  let data = {}
  try { data = JSON.parse(text) } catch { data = { message: text.slice(0, 500) || `请求失败 (${res.status})` } }

  if (!res.ok) {
    const msg = data.message || `请求失败 (${res.status})`
    const detail = data.errors?.length ? ': ' + data.errors.join('; ') : ''
    log.error(`${method} ${url} → ${res.status} (${elapsed}ms)`, msg + detail)
    throw new Error(msg + detail)
  }

  log.success(`${method} ${url} → ${res.status} (${elapsed}ms)`)
  if (Array.isArray(data)) return data
  return data
}

export { request }
