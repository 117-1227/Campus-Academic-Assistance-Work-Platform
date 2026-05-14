import { useState, useEffect, useCallback } from 'react'
import Table from '../../components/Table'
import { requestMock as request } from '../../utils/api'

export default function WorkHoursStats() {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [month, setMonth] = useState(currentMonth)
  const [data, setData] = useState([])
  const [expandedRow, setExpandedRow] = useState(null)
  const [dailyDetail, setDailyDetail] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    if (!month) return
    setLoading(true)
    const list = await request(`GET /api/teacher/work-hours?month=${month}`)
    setData(Array.isArray(list) ? list : [])
    setExpandedRow(null)
    setDailyDetail(null)
    setLoading(false)
  }, [month])

  useEffect(() => { fetchData() }, [fetchData])

  async function toggleDetail(row) {
    if (expandedRow === row.studentId) {
      setExpandedRow(null)
      setDailyDetail(null)
      return
    }
    setExpandedRow(row.studentId)
    setDailyDetail(null)
    const detail = await request(`GET /api/teacher/work-hours/${row.studentId}?month=${month}`)
    setDailyDetail(detail)
  }

  const totalHours = data.reduce((sum, r) => sum + (r.totalHours || 0), 0)
  const totalDays = data.reduce((sum, r) => sum + (r.workDays || 0), 0)
  const avgHours = data.length > 0 ? (totalHours / data.length).toFixed(1) : '0'

  const columns = [
    { key: 'studentId', title: '学号' },
    { key: 'name', title: '姓名' },
    { key: 'totalHours', title: '本月总工时', render: (v) => <span className="font-semibold text-gray-900 tabular-nums">{v}h</span> },
    { key: 'workDays', title: '出勤天数', render: (v) => <span className="tabular-nums">{v} 天</span> },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="card-8pt">
          <p className="stat-label text-gray-500">本月总工时</p>
          <p className="stat-number text-indigo-600">{totalHours}h</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">{data.length} 人参与</p>
        </div>
        <div className="card-8pt">
          <p className="stat-label text-gray-500">总出勤天数</p>
          <p className="stat-number text-gray-900">{totalDays}</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">人均 {avgHours}h</p>
        </div>
        <div className="card-8pt">
          <p className="stat-label text-gray-500">当月月份</p>
          <p className="stat-number text-gray-900">{month.split('-')[1]}月</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">{month.split('-')[0]} 年</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="h-10 text-sm bg-white border border-gray-300 rounded-lg pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
          />
        </div>
        {loading && <span className="text-xs text-gray-400">加载中...</span>}
      </div>

      <Table columns={columns} data={data} onRowClick={toggleDetail} />

      {expandedRow && dailyDetail && (
        <div className="card-8pt">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold">
              {dailyDetail.name?.charAt(0) || '?'}
            </span>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 leading-title">{dailyDetail.name}</h4>
              <p className="text-xs text-gray-500 leading-body">{expandedRow}</p>
            </div>
            <span className="ml-auto text-xs text-gray-400">每日打卡明细</span>
          </div>
          {dailyDetail.daily && dailyDetail.daily.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wide">日期</th>
                  <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wide">工时</th>
                  <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wide">签到</th>
                  <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wide">签退</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dailyDetail.daily.map((d) => (
                  <tr key={d.date}>
                    <td className="py-3 text-gray-700">{d.date}</td>
                    <td className="py-3 text-gray-900 font-medium tabular-nums">{d.hours}h</td>
                    <td className="py-3 text-gray-600">{d.checkIn}</td>
                    <td className="py-3 text-gray-600">{d.checkOut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">本月暂无打卡记录</p>
          )}
        </div>
      )}
    </div>
  )
}
