import { useState, useEffect, useCallback, useRef } from 'react'
import { requestMock as request } from '../../utils/api'

function fmtTime(date) {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function fmtShort(d) {
  if (!d) return '--:--'
  return new Date(d).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export default function ClockInOut() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [now, setNow] = useState(new Date())
  const timerRef = useRef(null)

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    const data = await request('GET /api/student/clock-status')
    setStatus(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  // Real-time clock
  useEffect(() => {
    timerRef.current = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  async function handleClockIn() {
    setActionLoading(true)
    await request('POST /api/student/clock-in', { method: 'POST', body: '{}' })
    setActionLoading(false)
    await fetchStatus()
  }

  async function handleClockOut() {
    setActionLoading(true)
    await request('POST /api/student/clock-out', { method: 'POST', body: '{}' })
    setActionLoading(false)
    await fetchStatus()
  }

  if (loading && !status) {
    return <p className="text-xs text-gray-400">加载中...</p>
  }

  const today = now.toISOString().slice(0, 10)
  const clockedIn = status?.clockedIn
  const records = status?.todayRecords || []

  return (
    <div className="space-y-6 max-w-lg">
      {/* Clock display */}
      <div className="card-8pt text-center">
        <p className="text-xs text-gray-500 mb-2">{today}</p>
        <p className="text-[2rem] font-semibold text-gray-900 tabular-nums leading-title tracking-tight">
          {fmtTime(now)}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {now.toLocaleDateString('zh-CN', { weekday: 'long' })}
        </p>
      </div>

      {/* Status + Action */}
      <div className="card-8pt">
        {/* Status indicator */}
        <div className="flex items-center gap-3 mb-6">
          <span className={'w-3 h-3 rounded-full ' + (clockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300')} />
          <span className={'text-sm font-semibold ' + (clockedIn ? 'text-emerald-700' : 'text-gray-500')}>
            {clockedIn ? '已签到' : '未签到'}
          </span>
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-0.5">签到时间</p>
            <p className="text-sm font-medium text-gray-900 tabular-nums">{fmtShort(status?.lastCheckIn)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-0.5">签退时间</p>
            <p className="text-sm font-medium text-gray-900 tabular-nums">{fmtShort(status?.lastCheckOut)}</p>
          </div>
        </div>

        {/* Action buttons */}
        {clockedIn ? (
          <button
            onClick={handleClockOut}
            disabled={actionLoading}
            className="w-full h-16 inline-flex items-center justify-center gap-2 px-6 text-base font-semibold text-white bg-amber-600 rounded-xl hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            {actionLoading ? '处理中...' : '签退'}
          </button>
        ) : (
          <button
            onClick={handleClockIn}
            disabled={actionLoading}
            className="w-full h-16 inline-flex items-center justify-center gap-2 px-6 text-base font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {actionLoading ? '处理中...' : '签到'}
          </button>
        )}
      </div>

      {/* Today's records */}
      {records.length > 0 && (
        <div className="card-8pt">
          <h4 className="text-sm font-semibold text-gray-900 mb-4 leading-title">今日记录</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wide">签到</th>
                <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wide">签退</th>
                <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wide">工时</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map((r, i) => (
                <tr key={i}>
                  <td className="py-3 text-gray-700 tabular-nums">{fmtShort(r.checkIn)}</td>
                  <td className="py-3 text-gray-700 tabular-nums">{fmtShort(r.checkOut)}</td>
                  <td className="py-3 text-gray-900 font-medium tabular-nums">{r.hours}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
