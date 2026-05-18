const STORAGE_KEY = 'app_config'

const DEFAULTS = {
  remoteUrl: 'http://192.168.10.100:3000',
  localUrl: 'http://localhost:3000',
  useLocal: false, // false=远程, true=本地
}

let listeners = []

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }
  } catch {
    return { ...DEFAULTS }
  }
}

let config = load()

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)) } catch {}
  listeners.forEach((fn) => fn(config))
}

export function getAll() { return { ...config } }

export function setAll(partial) { config = { ...config, ...partial }; save() }

export function reset() { config = { ...DEFAULTS }; save() }

export function onChange(fn) {
  listeners.push(fn)
  return () => { listeners = listeners.filter((l) => l !== fn) }
}

export function getApiBase() {
  const url = config.useLocal ? config.localUrl : config.remoteUrl
  return url ? url.replace(/\/$/, '') : ''
}
