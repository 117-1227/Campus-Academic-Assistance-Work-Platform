import { useState, useEffect, useCallback } from 'react'
import Table from '../components/Table'
import Modal from '../components/Modal'
import { requestMock as request } from '../utils/api'

const INITIAL_FORM = { studentId: '', name: '', positionLevel: '一级岗', phone: '' }

function statusLabel(s) {
  if (s === 'active') return '在岗'
  if (s === 'inactive') return '离岗'
  return s || '-'
}

export default function Assistants() {
  const [assistants, setAssistants] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState([])
  // Stats
  const [stats, setStats] = useState({ total: 0, active: 0, onDuty: 0 })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '100' })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    const raw = await request(`GET /api/assistants?${params.toString()}`)
    setAssistants(Array.isArray(raw.data) ? raw.data : Array.isArray(raw) ? raw : [])
    setLoading(false)
  }, [search, statusFilter])

  const fetchStats = useCallback(async () => {
    const s = await request('GET /api/assistants/stats')
    if (s) setStats(s)
  }, [])

  useEffect(() => { fetchData(); fetchStats() }, [fetchData, fetchStats])

  const filtered = assistants // server-side filtering via query params

  const activeList = assistants.filter((a) => a.status === 'active')

  function openAddModal() {
    setEditing(null)
    setForm(INITIAL_FORM)
    setModalOpen(true)
  }

  function openEditModal(row) {
    setEditing(row)
    setForm({
      studentId: row.studentId || '',
      name: row.name || '',
      positionLevel: row.position || row.positionLevel || '二级岗',
      phone: row.phone || '',
    })
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = { ...form }
    if (editing) {
      await request('PUT /api/assistants/:id', {
        method: 'PUT',
        body: JSON.stringify({ id: editing.id, ...payload }),
      })
    } else {
      await request('POST /api/assistants', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    setModalOpen(false)
    await fetchData()
    await fetchStats()
  }

  async function handleDelete(row) {
    if (!confirm(`确认删除 ${row.name} (${row.studentId})？此操作不可撤销。`)) return
    await request(`DELETE /api/assistants/${row.id}`, { method: 'DELETE' })
    await fetchData()
    await fetchStats()
  }

  async function toggleOnDuty(row) {
    const newVal = !row.isOnDuty
    await request(`POST /api/assistants/:id/status`, {
      method: 'POST',
      body: JSON.stringify({ id: row.id, isOnDuty: newVal }),
    })
    await fetchData()
    await fetchStats()
  }

  async function resetPassword(row) {
    if (!confirm(`确认将 ${row.name} 的密码重置为 123456？`)) return
    await request(`POST /api/assistants/:id/reset-password`, { method: 'POST', body: '{}' })
    alert('密码已重置为 123456')
  }

  async function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('请上传 .csv / .xlsx / .xls 格式的文件')
      return
    }
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mode', 'upsert')
    const result = await request('POST /api/assistants/import-file', {
      method: 'POST',
      body: formData,
      headers: {}, // let browser set Content-Type for multipart
    })
    alert(result.message || `导入完成`)
    await fetchData()
    await fetchStats()
    e.target.value = ''
  }

  function handleSelect(row, checked) {
    setSelected((prev) => checked ? [...prev, row.id] : prev.filter((id) => id !== row.id))
  }

  function handleSelectAll(checked) {
    setSelected(checked ? filtered.map((r) => r.id) : [])
  }

  async function handleBatchDelete() {
    if (selected.length === 0) return
    if (!confirm(`确认删除选中的 ${selected.length} 名学助？此操作不可撤销。`)) return
    await Promise.all(selected.map((id) =>
      request(`DELETE /api/assistants/${id}`, { method: 'DELETE' }).catch(() => {})
    ))
    setSelected([])
    await fetchData()
    await fetchStats()
  }

  function updateField(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const columns = [
    { key: 'studentId', title: '学号' },
    { key: 'name', title: '姓名' },
    {
      key: 'position',
      title: '岗位等级',
      width: '112px',
      render: (v, row) => {
        const lv = v || row.positionLevel // backend returns 'position'
        if (!lv) return <span className="text-xs text-gray-400">-</span>
        return (
          <span className={
            'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ' +
            (lv === '一级岗' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200')
          }>{lv}</span>
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
          (v === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-50 text-gray-500 border border-gray-200')
        }>
          <span className={'w-2 h-2 rounded-full ' + (v === 'active' ? 'bg-emerald-500' : 'bg-gray-400')} />
          {statusLabel(v)}
        </span>
      ),
    },
    { key: 'phone', title: '手机' },
    {
      key: 'isOnDuty',
      title: '上/下班',
      width: '96px',
      render: (_, row) => (
        <button
          onClick={() => toggleOnDuty(row)}
          className={
            'px-3 py-1 text-xs font-medium rounded-md transition-colors ' +
            (row.isOnDuty
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100')
          }
        >
          {row.isOnDuty ? '上班' : '下班'}
        </button>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '192px',
      render: (_, row) => (
        <div className="flex items-center">
          <button onClick={() => openEditModal(row)} className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">编辑</button>
          <button onClick={() => resetPassword(row)} className="px-3 py-1 text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">重置密码</button>
          <button onClick={() => handleDelete(row)} className="ml-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="删除">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-8pt">
          <p className="stat-label text-gray-500">学助总数</p>
          <p className="stat-number text-gray-900">{stats.total || assistants.length}</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">
            在岗 {stats.active || activeList.length} 人
          </p>
        </div>
        <div className="card-8pt">
          <p className="stat-label text-gray-500">上班人数</p>
          <p className="stat-number text-emerald-600">{stats.onDuty || assistants.filter((a) => a.isOnDuty).length}</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">
            占比 {assistants.length > 0 ? Math.round(((stats.onDuty || assistants.filter((a) => a.isOnDuty).length) / assistants.length) * 100) : 0}%
          </p>
        </div>
        <div className="card-8pt">
          <p className="stat-label text-gray-500">离岗人数</p>
          <p className="stat-number text-gray-400">{assistants.filter((a) => a.status === 'inactive').length}</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">暂不参与排班</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input type="text" placeholder="搜索学号或姓名..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 text-sm bg-white border border-gray-300 rounded-lg pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow placeholder:text-gray-400"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
          <option value="">全部状态</option>
          <option value="active">在岗</option>
          <option value="inactive">离岗</option>
        </select>

        <button onClick={openAddModal} className="btn-8pt text-white bg-[#0f172a] hover:bg-[#1e293b]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          添加学助
        </button>

        {selected.length > 0 && (
          <button onClick={handleBatchDelete} className="btn-8pt text-red-600 bg-white border border-red-200 hover:bg-red-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
            删除所选 {selected.length} 项
          </button>
        )}

        <label className="btn-8pt text-gray-700 bg-white border border-gray-300 hover:bg-gray-50">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
          批量导入
          <input type="file" accept=".csv,.xlsx,.xls" onChange={handleImport} className="hidden" />
        </label>

        {loading && <span className="text-xs text-gray-400">加载中...</span>}
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={filtered}
        selectable
        selected={selected}
        onSelect={handleSelect}
        onSelectAll={handleSelectAll}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? '编辑学助信息' : '添加学助'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-8pt text-gray-700 bg-white border border-gray-300 hover:bg-gray-50">取消</button>
            <button form="assistant-form" type="submit" className="btn-8pt text-white bg-[#0f172a] hover:bg-[#1e293b]">{editing ? '保存修改' : '确认添加'}</button>
          </>
        }
      >
        <form id="assistant-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">学号</label>
              <input required value={form.studentId} onChange={updateField('studentId')} disabled={!!editing}
                maxLength={12} pattern="[\w\d]{8,12}" title="学号必须为8-12位字母或数字" inputMode="text"
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-400 transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
              <input required value={form.name} onChange={updateField('name')}
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">岗位等级</label>
              <select value={form.positionLevel} onChange={updateField('positionLevel')}
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow bg-white">
                <option value="一级岗">一级岗</option>
                <option value="二级岗">二级岗</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">手机</label>
              <input required value={form.phone} onChange={updateField('phone')}
                maxLength={11} pattern="1[0-9]{10}" title="请输入有效的11位中国手机号" inputMode="numeric" autoComplete="tel"
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
