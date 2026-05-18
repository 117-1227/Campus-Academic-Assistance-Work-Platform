import { add as addDebugLog } from './debugLog'

const STYLES = {
  debug: 'color: #6b7280',
  info: 'color: #3b82f6',
  warn: 'color: #f59e0b; font-weight: bold',
  error: 'color: #ef4444; font-weight: bold',
  success: 'color: #10b981',
  label: 'color: #8b5cf6; font-weight: bold',
}

function enabled() {
  try {
    return localStorage.getItem('debug') === '1'
  } catch {
    return import.meta.env.DEV
  }
}

function timestamp() {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false, fractionalSecondDigits: 3 })
}

function summarize(args) {
  return args.map((a) => {
    if (a instanceof Error) return a.message
    if (typeof a === 'object') {
      try { return JSON.stringify(a).slice(0, 500) } catch { return String(a).slice(0, 500) }
    }
    return String(a).slice(0, 500)
  }).join(' ')
}

function logger(namespace) {
  const fmt = (level, args) => [`%c[${timestamp()}] %c${namespace}%c ${level}`, STYLES.debug, STYLES.label, STYLES[level], ...args]

  return {
    debug(...args) {
      if (!enabled()) return
      console.log(...fmt('debug', args))
    },
    info(...args) {
      if (!enabled()) return
      console.info(...fmt('info', args))
    },
    warn(...args) {
      if (!enabled()) return
      console.warn(...fmt('warn', args))
      addDebugLog({ level: 'warn', module: namespace, message: summarize(args) })
    },
    error(...args) {
      console.error(...fmt('error', args))
      addDebugLog({ level: 'error', module: namespace, message: summarize(args), detail: args[0] instanceof Error ? args[0].stack : '' })
    },
    success(...args) {
      if (!enabled()) return
      console.log(...fmt('success', args))
    },
  }
}

export default logger
