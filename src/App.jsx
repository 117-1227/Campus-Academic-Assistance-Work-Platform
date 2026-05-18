import { useState, useCallback, useEffect } from 'react'
import Login from './pages/Login'
import AdminShell from './components/AdminShell'

function getStoredAuth() {
  try {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    if (token && user) return { token, user }
  } catch { /* corrupted */ }
  return null
}

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch { return null }
}

function getTokenExp(token) {
  const p = parseJwt(token)
  return p?.exp ? p.exp * 1000 : null
}

export function formatRemain(ms) {
  if (ms <= 0) return '已过期'
  const m = Math.floor(ms / 60000)
  if (m < 60) return `${m} 分钟`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm > 0 ? `${h} 小时 ${rm} 分钟` : `${h} 小时`
}

export default function App() {
  const [auth, setAuth] = useState(getStoredAuth)
  const [expiredModal, setExpiredModal] = useState(false)
  const [remainMs, setRemainMs] = useState(0)

  const handleLogin = useCallback((token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setAuth({ token, user })
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setAuth(null)
    setExpiredModal(false)
  }, [])

  // Check token expiry periodically
  useEffect(() => {
    if (!auth?.token) return
    function check() {
      const exp = getTokenExp(auth.token)
      if (!exp) return
      const now = Date.now()
      const remain = exp - now
      setRemainMs(remain > 0 ? remain : 0)
      if (now >= exp) setExpiredModal(true)
    }
    check()
    const timer = setInterval(check, 30000)
    return () => clearInterval(timer)
  }, [auth])

  // ---- Login gate ----
  if (!auth) {
    return <Login onLogin={handleLogin} />
  }

  // ---- Dashboard (admin only for now) ----
  return <AdminShell auth={auth} onLogout={handleLogout} remainMs={remainMs} formatRemain={formatRemain} expiredModal={expiredModal} />
}
