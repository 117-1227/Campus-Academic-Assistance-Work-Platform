import { useState, useEffect, useCallback } from 'react'
import Table from '../components/Table'
import { requestMock as request } from '../utils/api'

function monthToRange(monthStr) {
  if (!monthStr) return { from: '', to: '' }
  const [y, m] = monthStr.split('-')
  const lastDay = new Date(+y, +m, 0).getDate()
  return {
    from: `${y}-${m}-01`,
    to: `${y}-${m}-${String(lastDay).padStart(2, '0')}`,
  }
}

const SHIFT_LABEL = { morning: '上午班', afternoon: '下午班', evening: '晚班', other: '其他' }
const STATUS_LABEL = { open: '进行中', closed: '已下班', auto_closed: '系统收口', pending_confirm: '待确认', corrected: '已纠正' }

function formatTime(t) {
  if (!t) return '—'
  const d = new Date(t)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatHours(h) {
  if (h == null) return '—'
  return Number(h).toFixed(1) + 'h'
}

export default function WorkHours() {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [month, setMonth] = useState(currentMonth)
  const [data, setData] = useState([])
  const [expandedRow, setExpandedRow] = useState(null)
  const [dailyDetail, setDailyDetail] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    if (!month) return
    setLoading(true)
    const { from, to } = monthToRange(month)
    const result = await request(`GET /api/admin/attendance/report?from=${from}&to=${to}&limit=200`)
    const list = Array.isArray(result.data) ? result.data : Array.isArray(result) ? result : []
    setData(list)
    setExpandedRow(null)
    setDailyDetail(null)
    setLoading(false)
  }, [month])

  useEffect(() => { fetchData() }, [fetchData])

  async function toggleDetail(row) {
    if (expandedRow === row.id) {
      setExpandedRow(null)
      setDailyDetail(null)
      return
    }
    setExpandedRow(row.id)
    setDailyDetail(null)
    const { from, to } = monthToRange(month)
    const detail = await request(`GET /api/admin/attendance/assistants/${row.id}/summary?from=${from}&to=${to}`)
    setDailyDetail(detail)
  }

  const totalHours = data.reduce((sum, r) => sum + (Number(r.totalHours) || 0), 0)
  const totalWage = data.reduce((sum, r) => sum + (Number(r.estimatedWage) || 0), 0)
  const avgHours = data.length > 0 ? (totalHours / data.length).toFixed(1) : '0'

  const columns = [
    { key: 'studentId', title: '学号' },
    { key: 'name', title: '姓名' },
    {
      key: 'totalHours',
      title: '总工时',
      render: (v) => <span className="font-semibold text-gray-900 tabular-nums">{formatHours(v)}</span>,
    },
    {
      key: 'estimatedWage',
      title: '估算薪资',
      render: (v) => <span className="tabular-nums">{v != null ? '¥' + Number(v).toFixed(2) : '—'}</span>,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-5">
        <div className="card-8pt">
          <p className="stat-label text-gray-500">本月总工时</p>
          <p className="stat-number text-indigo-600">{totalHours.toFixed(1)}h</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">
            {data.length} 人参与
          </p>
        </div>
        <div className="card-8pt">
          <p className="stat-label text-gray-500">预估总薪资</p>
          <p className="stat-number text-emerald-600">¥{totalWage.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">
            人均 {avgHours}h
          </p>
        </div>
        <div className="card-8pt">
          <p className="stat-label text-gray-500">当月月份</p>
          <p className="stat-number text-gray-900 tabular-nums">{month.split('-')[1]}月</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">
            {month.split('-')[0]} 年
          </p>
        </div>
      </div>

      {/* Month picker */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-10 text-sm bg-white border border-gray-300 rounded-lg pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
          />
        </div>
        {loading && <span className="text-xs text-gray-400">加载中...</span>}
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={data}
        onRowClick={toggleDetail}
      />

      {/* Daily detail panel */}
      {expandedRow && dailyDetail && (
        <div className="card-8pt">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold">
              {(dailyDetail.assistant?.name || '?').charAt(0)}
            </span>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">{dailyDetail.assistant?.name || '—'}</h4>
              <p className="text-xs text-gray-500">{dailyDetail.assistant?.studentId || expandedRow}</p>
            </div>
            <div className="ml-auto flex items-center gap-6">
              <span className="text-xs text-gray-500">总工时 <strong className="text-gray-900">{formatHours(dailyDetail.totalHours)}</strong></span>
              <span className="text-xs text-gray-500">薪资 <strong className="text-emerald-600">{dailyDetail.estimatedWage != null ? '¥' + Number(dailyDetail.estimatedWage).toFixed(2) : '—'}</strong></span>
            </div>
          </div>

          {dailyDetail.byDate && dailyDetail.byDate.length > 0 ? (
            dailyDetail.byDate.map((day) => (
              <div key={day.date} className="mb-4 last:mb-0">
                <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-semibold text-gray-700">{day.date}</span>
                  <span className="text-xs text-gray-500">{day.hours}h</span>
                  {day.hasAnomalies && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">含异常</span>
                  )}
                  <span className="ml-auto text-xs text-gray-400">{day.sessions?.length || 0} 条打卡</span>
                </div>
                {day.sessions && day.sessions.length > 0 && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left">
                        <th className="pb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">班次</th>
                        <th className="pb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">签到</th>
                        <th className="pb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">签退</th>
                        <th className="pb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">工时</th>
                        <th className="pb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {day.sessions.map((s, i) => (
                        <tr key={i}>
                          <td className="py-3 text-gray-700">{SHIFT_LABEL[s.shiftType] || s.shiftType || '—'}</td>
                          <td className="py-3 text-gray-600 tabular-nums">{formatTime(s.startTime)}</td>
                          <td className="py-3 text-gray-600 tabular-nums">{formatTime(s.endTime)}</td>
                          <td className="py-3 text-gray-900 font-medium tabular-nums">
                            {s.durationMinutes != null ? (s.durationMinutes / 60).toFixed(1) + 'h' : '—'}
                          </td>
                          <td className="py-3">
                            <span className={
                              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ' +
                              (s.status === 'closed' || s.status === 'corrected'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : s.status === 'auto_closed' || s.status === 'pending_confirm'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200')
                            }>
                              {STATUS_LABEL[s.status] || s.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">本月暂无打卡记录</p>
          )}
        </div>
      )}
    </div>
  )
}
