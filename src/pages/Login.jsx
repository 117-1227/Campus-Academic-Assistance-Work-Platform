import { useState } from 'react'
import { request } from '../utils/api'
import { getAll, setAll, reset } from '../utils/config'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const cfg = getAll()
  const [remoteUrl, setRemoteUrl] = useState(cfg.remoteUrl)
  const [localUrl, setLocalUrl] = useState(cfg.localUrl)
  const [useLocal, setUseLocal] = useState(cfg.useLocal)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码')
      return
    }

    setLoading(true)
    try {
      const result = await request('POST /api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim(), password }),
      })
      onLogin(result.token, { id: result.id, username: result.username, role: result.role })
    } catch (err) {
      setError(err.message || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  function handleSave() {
    setAll({ remoteUrl, localUrl, useLocal })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    reset()
    const c = getAll()
    setRemoteUrl(c.remoteUrl)
    setLocalUrl(c.localUrl)
    setUseLocal(c.useLocal)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const activeUrl = useLocal ? localUrl : remoteUrl
  const activeLabel = useLocal ? '本地' : '远程'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-lg p-8">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#0f172a] mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">后台管理端</h1>
        </div>

        {/* Form: space-y-4(16) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="username">
              用户名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              autoComplete="username"
              className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow placeholder:text-gray-400"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              autoComplete="current-password"
              className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow placeholder:text-gray-400"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Submit: h-10(40) w-full */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 inline-flex items-center justify-center gap-2 px-4 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                登录中...
              </>
            ) : (
              '登录'
            )}
          </button>
        </form>

        {/* Server settings toggle */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              服务器设置
            </span>
            <span className="text-xs text-gray-400">当前：{activeLabel} — {activeUrl || '代理模式'}</span>
            <svg className={`w-3.5 h-3.5 transition-transform ${showSettings ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {showSettings && (
            <div className="mt-4 space-y-4">
              {/* Remote server */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="env" checked={!useLocal} onChange={() => setUseLocal(false)} className="shrink-0" />
                  <span className="text-sm font-medium text-gray-700">远程服务器</span>
                </label>
                <input
                  type="text" value={remoteUrl}
                  onChange={(e) => { setRemoteUrl(e.target.value); setUseLocal(false) }}
                  placeholder="http://192.168.10.100:3000"
                  className="w-full h-9 mt-1.5 ml-6 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  style={{ width: 'calc(100% - 24px)' }}
                />
              </div>

              {/* Local server */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="env" checked={useLocal} onChange={() => setUseLocal(true)} className="shrink-0" />
                  <span className="text-sm font-medium text-gray-700">本地服务器</span>
                </label>
                <input
                  type="text" value={localUrl}
                  onChange={(e) => { setLocalUrl(e.target.value); setUseLocal(true) }}
                  placeholder="http://localhost:3000"
                  className="w-full h-9 mt-1.5 ml-6 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  style={{ width: 'calc(100% - 24px)' }}
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors mr-auto"
                >
                  恢复默认
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className={`text-xs px-4 py-1.5 rounded-lg font-medium transition-colors ${
                    saved
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-white bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {saved ? '已保存' : '保存设置'}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
