const MAX_ENTRIES = 200

const logs = []

export function add(entry) {
  logs.push({ timestamp: new Date().toISOString(), ...entry })
  if (logs.length > MAX_ENTRIES) logs.shift()
}

export function getAll() {
  return [...logs]
}

export function clear() {
  logs.length = 0
}

export function download() {
  const text = format()
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `debug-${new Date().toISOString().slice(0, 10)}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export function format() {
  if (logs.length === 0) return '(无错误记录)'
  return logs.map((e) =>
    `[${e.timestamp}] [${e.level.toUpperCase()}] ${e.module}: ${e.message}${e.detail ? '\n' + e.detail : ''}`
  ).join('\n')
}

export function getCount() {
  return logs.length
}

// 暴露全局方便调试
if (typeof window !== 'undefined') {
  window.__debugLog = { getAll, clear, download, format, getCount }
}
