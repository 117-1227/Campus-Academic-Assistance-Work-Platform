import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import logger from './utils/logger'
import { add as addDebugLog } from './utils/debugLog'

const log = logger('Global')

// 全局未捕获异常（防 HMR 重复注册）
if (!window.__globalErrorsPatched) {
  window.__globalErrorsPatched = true
  window.addEventListener('error', (e) => {
    log.error('未捕获异常', { message: e.message, filename: e.filename, lineno: e.lineno, colno: e.colno })
  })
  window.addEventListener('unhandledrejection', (e) => {
    log.error('未处理的 Promise 拒绝', { reason: e.reason?.message || e.reason })
  })
}

// 拦截所有 console.error（第三方库、React 内部错误也能抓到），仅挂一次
if (!window.__consolePatched) {
  window.__consolePatched = true
  const _consoleError = console.error.bind(console)
  console.error = function (...args) {
    _consoleError(...args)
    // 过滤 React dev 模式的 createRoot 重复警告，避免污染日志
    const firstArg = args[0]
    if (typeof firstArg === 'string' && firstArg.includes('createRoot')) return
    const msg = args.map((a) => (a instanceof Error ? a.message : typeof a === 'object' ? JSON.stringify(a).slice(0, 300) : String(a).slice(0, 300))).join(' ')
    addDebugLog({ level: 'error', module: 'Console', message: msg, detail: args[0] instanceof Error ? args[0].stack : '' })
  }
}

// React Error Boundary — 捕获渲染崩溃
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    log.error('React 渲染崩溃', { message: error.message, componentStack: info.componentStack })
  }
  render() {
    if (this.state.error) {
      return React.createElement('div', {
        style: { padding: 40, textAlign: 'center', fontFamily: 'Arial' }
      },
        React.createElement('h2', { style: { color: '#ef4444', marginBottom: 16 } }, '页面发生错误'),
        React.createElement('pre', { style: { color: '#6b7280', fontSize: 14, whiteSpace: 'pre-wrap' } }, this.state.error.message),
        React.createElement('button', {
          onClick: () => { this.setState({ error: null }); window.location.reload() },
          style: { marginTop: 20, padding: '8px 20px', cursor: 'pointer' }
        }, '刷新页面')
      )
    }
    return this.props.children
  }
}

// 开启调试日志提示
try {
  if (localStorage.getItem('debug') === '1') {
    console.log(
      '%c[调试日志已开启]%c 关闭方式：在浏览器控制台执行 %clocalStorage.removeItem("debug")%c 后刷新',
      'color: #10b981; font-weight: bold', '', 'color: #f59e0b', ''
    )
  } else {
    console.log(
      '%c[调试日志已关闭]%c 开启方式：在浏览器控制台执行 %clocalStorage.setItem("debug", "1")%c 后刷新',
      'color: #6b7280', '', 'color: #3b82f6', ''
    )
  }
} catch { /* ignore */ }

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
