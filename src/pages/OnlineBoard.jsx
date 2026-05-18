import { useState, useEffect, useCallback, useRef } from 'react'
import Table from '../components/Table'
import { request } from '../utils/api'

const SHIFT_LABEL = { morning: '上午班', afternoon: '下午班', evening: '晚班', other: '其他' }
const STATUS_LABEL = { open: '进行中', pending_confirm: '待确认', closed: '已下班', auto_closed: '系统收口', corrected: '已纠正' }

function formatMinutes(m) {
  if (m == null) return '—'
  const h = Math.floor(m / 60)
  const min = m % 60
  return h > 0 ? `${h}h ${min}m` : `${min}m`
}

export default function OnlineBoard() {
  const [sessions, setSessions] = useState([])
  const [serverTime, setServerTime] = useState(null)
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const timerRef = useRef(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await request('GET /api/admin/attendance/online')
      setSessions(Array.isArray(result.data) ? result.data : [])
      if (result.serverTime) setServerTime(result.serverTime)
    } catch { /* handled by request */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    if (autoRefresh) {
      timerRef.current = setInterval(fetchData, 30000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [fetchData, autoRefresh])

  function toggleAutoRefresh() {
    setAutoRefresh((prev) => {
      if (prev && timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      return !prev
    })
  }

  const openCount = sessions.filter((s) => s.status === 'open').length
  const pendingCount = sessions.filter((s) => s.status === 'pending_confirm').length
  const morningCount = sessions.filter((s) => s.shiftType === 'morning').length
  const afternoonCount = sessions.filter((s) => s.shiftType === 'afternoon').length

  const columns = [
    { key: 'name', title: '姓名' },
    { key: 'studentId', title: '学号' },
    {
      key: 'position',
      title: '岗位',
      width: '96px',
      render: (v) => (
        <span className={
          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ' +
          (v === '一级岗' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200')
        }>{v || '—'}</span>
      ),
    },
    {
      key: 'shiftLabel',
      title: '班次',
      width: '96px',
      render: (v, row) => {
        const label = v || SHIFT_LABEL[row.shiftType] || '—'
        return <span className="text-sm text-gray-700">{label}</span>
      },
    },
    {
      key: 'startTime',
      title: '签到时间',
      width: '96px',
      render: (v) => {
        if (!v) return <span className="text-gray-400">—</span>
        const d = new Date(v)
        return <span className="tabular-nums text-sm text-gray-700">{String(d.getHours()).padStart(2, '0')}:{String(d.getMinutes()).padStart(2, '0')}</span>
      },
    },
    {
      key: 'onlineMinutes',
      title: '在岗时长',
      width: '96px',
      render: (v) => <span className="font-semibold text-indigo-600 tabular-nums">{formatMinutes(v)}</span>,
    },
    {
      key: 'status',
      title: '状态',
      width: '96px',
      render: (v) => {
        const isOpen = v === 'open'
        return (
          <span className={
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ' +
            (isOpen ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200')
          }>
            <span className={'w-1.5 h-1.5 rounded-full ' + (isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500')} />
            {STATUS_LABEL[v] || v}
          </span>
        )
      },
    },
  ]

  const serverTimeStr = serverTime ? new Date(serverTime).toLocaleTimeString('zh-CN', { hour12: false }) : '—'

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-5">
        <div className="card-8pt">
          <p className="stat-label text-gray-500">当前在班</p>
          <p className="stat-number text-emerald-600">{openCount}</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">进行中会话</p>
        </div>
        <div className="card-8pt">
          <p className="stat-label text-gray-500">待确认</p>
          <p className="stat-number text-amber-600">{pendingCount}</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">需处理签退</p>
        </div>
        <div className="card-8pt">
          <p className="stat-label text-gray-500">上午班</p>
          <p className="stat-number text-blue-600">{morningCount}</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">当前在岗</p>
        </div>
        <div className="card-8pt">
          <p className="stat-label text-gray-500">下午班</p>
          <p className="stat-number text-indigo-600">{afternoonCount}</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">当前在岗</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          {loading && <span className="text-xs text-gray-400">刷新中...</span>}
          <span className="text-xs text-gray-400">服务器时间 {serverTimeStr}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" checked={autoRefresh} onChange={toggleAutoRefresh} className="rounded" />
            自动刷新（30s）
          </label>
          <button onClick={fetchData} className="btn-8pt text-gray-700 bg-white border border-gray-300 hover:bg-gray-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            立即刷新
          </button>
        </div>
      </div>

      {/* Table */}
      <Table columns={columns} data={sessions} emptyText="当前没有在班人员" />
    </div>
  )
}
