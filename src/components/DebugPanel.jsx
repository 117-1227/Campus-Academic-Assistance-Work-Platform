import { useState, useEffect } from 'react'
import { getAll, clear as clearLogs, format } from '../utils/debugLog'

const LEVEL_COLOR = {
  error: 'border-red-300 bg-red-50 text-red-800',
  warn: 'border-amber-300 bg-amber-50 text-amber-800',
}

const LEVEL_DOT = {
  error: 'bg-red-500',
  warn: 'bg-amber-500',
}

export default function DebugPanel() {
  const [open, setOpen] = useState(false)
  const [logs, setLogs] = useState([])
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (!open) return
    const timer = setInterval(() => setLogs(getAll()), 2000)
    setLogs(getAll())
    return () => clearInterval(timer)
  }, [open])

  function handleCopy() {
    const text = format()
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleClear() {
    clearLogs()
    setLogs([])
  }

  const count = logs.length

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={
          'fixed bottom-5 right-5 z-40 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg transition-all ' +
          (count > 0
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-800')
        }
        title="调试日志"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        {count > 0 && (
          <span className="bg-white text-red-600 text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Side panel */}
      {open && (
        <div className="fixed inset-y-0 right-0 z-50 w-[480px] bg-white shadow-2xl border-l border-gray-200 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold text-gray-900">错误日志</h3>
              <span className="text-xs text-gray-400">{count} 条</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                {copied ? '已复制' : '复制全部'}
              </button>
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                清空
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <p className="text-sm">暂无错误记录</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {[...logs].reverse().map((entry, i) => (
                  <div key={i} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                    <div
                      className={`rounded-lg border p-3 cursor-pointer ${LEVEL_COLOR[entry.level] || LEVEL_COLOR.error}`}
                      onClick={() => setExpanded(expanded === i ? null : i)}
                    >
                      <div className="flex items-start gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${LEVEL_DOT[entry.level] || LEVEL_DOT.error}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-xs mb-0.5 opacity-70">
                            <span>{entry.timestamp?.slice(11, 19)}</span>
                            <span className="font-medium">{entry.module}</span>
                            <span className="uppercase">{entry.level}</span>
                          </div>
                          <p className="text-sm break-all">{entry.message}</p>
                          {expanded === i && entry.detail && (
                            <pre className="mt-2 text-xs opacity-60 whitespace-pre-wrap break-all">{entry.detail}</pre>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
