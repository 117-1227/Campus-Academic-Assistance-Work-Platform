async function request(path, options = {}) {
  let url = path.replace(/^[A-Z]+ /, '')

  const headers = { 'Content-Type': 'application/json' }

  try {
    const token = localStorage.getItem('token')
    if (token) headers['Authorization'] = `Bearer ${token}`
  } catch { /* localStorage unavailable */ }

  const isFormData = options.body instanceof FormData
  if (isFormData) delete headers['Content-Type']

  const config = { ...options, headers: { ...headers, ...(options.headers || {}) } }
  const res = await fetch(url, config)

  const text = await res.text().catch(() => '')
  let data = {}
  try { data = JSON.parse(text) } catch { data.message = text.slice(0, 500) || `请求失败 (${res.status})` }
  if (!res.ok) {
    const msg = data.message || `请求失败 (${res.status})`
    const detail = data.errors?.length ? ': ' + data.errors.join('; ') : ''
    throw new Error(msg + detail)
  }
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && Array.isArray(data.data)) {
    return data.data
  }
  return data
}

export { request }
