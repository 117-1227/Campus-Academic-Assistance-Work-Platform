import { useState, useEffect, useCallback } from 'react'
import Table from '../../components/Table'
import { requestMock as request } from '../../utils/api'

function toLevel(rate) {
  const n = parseFloat(rate)
  return n >= 15 ? '一级岗' : '二级岗'
}

export default function AssistantsList() {
  const [assistants, setAssistants] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const raw = await request('GET /api/teacher/assistants')
    setAssistants(Array.isArray(raw) ? raw : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = assistants.filter((a) => {
    const q = search.toLowerCase()
    return (a.studentId || '').toLowerCase().includes(q) || (a.name || '').toLowerCase().includes(q)
  })

  const activeList = assistants.filter((a) => a.status === '在岗')
  const inactiveList = assistants.filter((a) => a.status === '离岗')

  const columns = [
    { key: 'studentId', title: '学号' },
    { key: 'name', title: '姓名' },
    {
      key: 'position',
      title: '岗位',
    },
    {
      key: 'hourlyRate',
      title: '等级',
      width: '112px',
      render: (v) => {
        const lv = toLevel(v)
        return (
          <span className={
            'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ' +
            (lv === '一级岗'
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
              : 'bg-amber-50 text-amber-700 border-amber-200')
          }>
            {lv}
          </span>
        )
      },
    },
    {
      key: 'status',
      title: '状态',
      width: '96px',
      render: (v) => (
        <span className={
          'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ' +
          (v === '在岗'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-gray-50 text-gray-500 border border-gray-200')
        }>
          <span className={'w-2 h-2 rounded-full ' + (v === '在岗' ? 'bg-emerald-500' : 'bg-gray-400')} />
          {v}
        </span>
      ),
    },
    { key: 'phone', title: '手机' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-8pt">
          <p className="stat-label text-gray-500">学助总数</p>
          <p className="stat-number text-gray-900">{assistants.length}</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">在岗 {activeList.length} &middot; 离岗 {inactiveList.length}</p>
        </div>
        <div className="card-8pt">
          <p className="stat-label text-gray-500">在岗人数</p>
          <p className="stat-number text-emerald-600">{activeList.length}</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">
            占比 {assistants.length > 0 ? Math.round((activeList.length / assistants.length) * 100) : 0}%
          </p>
        </div>
        <div className="card-8pt">
          <p className="stat-label text-gray-500">离岗人数</p>
          <p className="stat-number text-gray-400">{inactiveList.length}</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">暂不参与排班</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="搜索学号或姓名..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 text-sm bg-white border border-gray-300 rounded-lg pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow placeholder:text-gray-400"
          />
        </div>
        {loading && <span className="text-xs text-gray-400">加载中...</span>}
      </div>

      <Table columns={columns} data={filtered} />
    </div>
  )
}
