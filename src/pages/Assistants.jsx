import { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import Table from '../components/Table'
import Modal from '../components/Modal'
import { request } from '../utils/api'

const INITIAL_FORM = { studentId: '', name: '', positionLevel: '一级岗', phone: '' }

export default function Assistants() {
  const [assistants, setAssistants] = useState([])
  const [search, setSearch] = useState('')
  const [shiftFilter, setShiftFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState([])
  // Stats
  const [stats, setStats] = useState({ total: 0, onShift: 0 })
  // Time logs
  const [timelogModal, setTimelogModal] = useState(null)
  const [timelogs, setTimelogs] = useState([])
  const [timelogLoading, setTimelogLoading] = useState(false)
  const [timelogForm, setTimelogForm] = useState({ date: new Date().toISOString().slice(0, 10), hours: '', notes: '' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '100' })
    if (search) params.set('search', search)
    const raw = await request(`GET /api/assistants?${params.toString()}`)
    setAssistants(Array.isArray(raw.data) ? raw.data : Array.isArray(raw) ? raw : [])
    setLoading(false)
  }, [search])

  const fetchStats = useCallback(async () => {
    const s = await request('GET /api/assistants/stats')
    if (s) setStats(s)
  }, [])

  useEffect(() => { fetchData(); fetchStats() }, [fetchData, fetchStats])

  const filtered = shiftFilter
    ? assistants.filter((a) => shiftFilter === 'true' ? a.isOnShift === true : !a.isOnShift)
    : assistants

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
    const payload = { ...form, position: form.positionLevel }
    if (editing) {
      await request(`PUT /api/assistants/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
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

  async function toggleOnShift(row) {
    const newVal = !row.isOnShift
    await request(`POST /api/assistants/${row.id}/status`, {
      method: 'POST',
      body: JSON.stringify({ isOnShift: newVal }),
    })
    await fetchData()
    await fetchStats()
  }

  async function resetPassword(row) {
    const newPwd = (row.studentId || '').slice(-6)
    if (!newPwd || newPwd.length < 6) { alert('学号不足6位，无法重置密码'); return }
    if (!confirm(`确认将 ${row.name} 的密码重置为学号后六位（${newPwd}）？`)) return
    const result = await request(`POST /api/assistants/${row.id}/reset-password`, { method: 'POST' })
    alert(result.message || `密码已重置为 ${newPwd}`)
  }

  // --- Time log functions ---
  async function fetchTimelogs(assistantId) {
    setTimelogLoading(true)
    try {
      const result = await request(`GET /api/assistants/${assistantId}/timelogs`)
      setTimelogs(Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : [])
    } catch { setTimelogs([]) }
    setTimelogLoading(false)
  }

  function openTimelogModal(row) {
    setTimelogModal(row)
    setTimelogs([])
    setTimelogForm({ date: new Date().toISOString().slice(0, 10), hours: '', notes: '' })
    fetchTimelogs(row.id)
  }

  function closeTimelogModal() {
    setTimelogModal(null)
    setTimelogs([])
  }

  async function addTimelog(e) {
    e.preventDefault()
    const { date, hours, notes } = timelogForm
    if (!date || !hours) { alert('请填写日期和工时'); return }
    await request(`POST /api/assistants/${timelogModal.id}/timelogs`, {
      method: 'POST',
      body: JSON.stringify({ date, hours: Number(hours), notes: notes.trim() }),
    })
    setTimelogForm({ date: new Date().toISOString().slice(0, 10), hours: '', notes: '' })
    fetchTimelogs(timelogModal.id)
  }

  async function handleSync() {
    if (!confirm('确认将当前所有学助数据同步到账户数据表？')) return
    setLoading(true)
    const result = await request('POST /api/admin/sync-accounts', { method: 'POST' })
    alert(result.message || '同步完成')
    setLoading(false)
  }

  const COLUMN_MAP = {
    '学号': 'studentId', 'studentId': 'studentId', 'student_id': 'studentId',
    '姓名': 'name', 'name': 'name',
    '手机号': 'phone', 'phone': 'phone', 'phone_number': 'phone',
    '岗位等级': 'positionLevel', 'positionLevel': 'positionLevel', 'position_level': 'positionLevel',
  }

  async function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('请上传 .csv / .xlsx / .xls 格式的文件')
      return
    }
    setLoading(true)
    try {
      // Parse file in browser
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' })

      if (!rawData.length) { alert('文件中没有数据'); setLoading(false); e.target.value = ''; return }

      // Map columns, fill defaults, filter out completely empty rows
      const mapped = rawData.map((row) => {
        const item = { studentId: '', name: '', phone: '', positionLevel: '二级岗' }
        for (const [key, val] of Object.entries(row)) {
          const mappedKey = COLUMN_MAP[key.trim()]
          if (mappedKey) item[mappedKey] = String(val).trim()
        }
        return item
      }).filter((item) => item.studentId || item.name)

      if (!mapped.length) { alert('未识别到有效数据，请检查列名'); setLoading(false); e.target.value = ''; return }

      // Send as JSON to import endpoint
      const payload = { data: mapped, mode: 'upsert' }
      console.log('导入数据:', payload)

      const token = localStorage.getItem('token')
      const rawRes = await fetch('/api/assistants/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token || ''}` },
        body: JSON.stringify(payload),
      })
      const rawText = await rawRes.text()
      console.log('后端原始响应:', rawRes.status, rawText.slice(0, 1000))

      if (!rawRes.ok) {
        let errMsg = `请求失败 (${rawRes.status})`
        try {
          const d = JSON.parse(rawText)
          errMsg = d.message || d.error || errMsg
          if (d.invalidRows?.length) {
            const details = d.invalidRows.slice(0, 5).map((r) => `${r.studentId || r.rowIndex}: ${r.reason}`).join('\n')
            errMsg += '\n' + details
            if (d.invalidRows.length > 5) errMsg += `\n... 等 ${d.invalidRows.length} 条`
          }
        } catch {}
        throw new Error(errMsg)
      }
      const result = JSON.parse(rawText)
      alert(result.message || `导入完成：${result.summary?.success || mapped.length} 条`)
      await fetchData()
      await fetchStats()
    } catch (err) {
      console.error('导入失败详情:', err)
      alert('导入失败: ' + (err.message || '解析错误'))
    } finally {
      setLoading(false)
      e.target.value = ''
    }
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
    { key: 'phone', title: '手机' },
    {
      key: 'isOnShift',
      title: '状态',
      width: '104px',
      render: (_, row) => (
        <span className={
          'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ' +
          (row.isOnShift
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-rose-50 text-rose-600 border-rose-200')
        }>
          {row.isOnShift ? '上班中' : '下班中'}
        </span>
      ),
    },
    {
      key: 'isOnShift-action',
      title: '上/下班',
      width: '96px',
      render: (_, row) => (
        <button
          onClick={() => toggleOnShift(row)}
          className={
            'px-3 py-1 text-xs font-medium rounded-md transition-colors ' +
            (row.isOnShift
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100')
          }
        >
          {row.isOnShift ? '上班' : '下班'}
        </button>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '120px',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEditModal(row)} className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">编辑</button>
          <button onClick={() => openTimelogModal(row)} className="px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors">日志</button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-5">
        <div className="card-8pt">
          <p className="stat-label text-gray-500">学助总数</p>
          <p className="stat-number text-gray-900">{stats.total || assistants.length}</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">
            上班 {stats.onShift || assistants.filter((a) => a.isOnShift).length} 人
          </p>
        </div>
        <div className="card-8pt">
          <p className="stat-label text-gray-500">上班人数</p>
          <p className="stat-number text-emerald-600">{stats.onShift || assistants.filter((a) => a.isOnShift).length}</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">
            占比 {assistants.length > 0 ? Math.round(((stats.onShift || assistants.filter((a) => a.isOnShift).length) / assistants.length) * 100) : 0}%
          </p>
        </div>
        <div className="card-8pt">
          <p className="stat-label text-gray-500">下班人数</p>
          <p className="stat-number text-gray-400">{assistants.filter((a) => !a.isOnShift).length}</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">未在班状态</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {/* Left: search + filter */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input type="text" placeholder="搜索学号或姓名..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 text-sm bg-white border border-gray-300 rounded-lg pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow placeholder:text-gray-400"
            />
          </div>
          <select value={shiftFilter} onChange={(e) => setShiftFilter(e.target.value)}
            className="h-10 px-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
            <option value="">全部班次</option>
            <option value="true">上班</option>
            <option value="false">下班</option>
          </select>
          {loading && <span className="text-xs text-gray-400 ml-2">加载中...</span>}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0">
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

          <label className="btn-8pt text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 cursor-pointer">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
            批量导入
            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleImport} className="hidden" />
          </label>

          <button onClick={handleSync} className="btn-8pt text-white bg-emerald-600 hover:bg-emerald-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            同步到账户表
          </button>
        </div>
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
          editing ? (
            <>
              <button onClick={() => { if (confirm(`确认删除 ${editing.name} (${editing.studentId})？此操作不可撤销。`)) { handleDelete(editing); setModalOpen(false) } }} className="btn-8pt text-red-600 bg-white border border-red-200 hover:bg-red-50 mr-auto">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                删除
              </button>
              <button onClick={() => { resetPassword(editing) }} className="btn-8pt text-gray-700 bg-white border border-gray-300 hover:bg-gray-50">重置密码</button>
              <button onClick={() => setModalOpen(false)} className="btn-8pt text-gray-700 bg-white border border-gray-300 hover:bg-gray-50">取消</button>
              <button form="assistant-form" type="submit" className="btn-8pt text-white bg-[#0f172a] hover:bg-[#1e293b]">保存修改</button>
            </>
          ) : (
            <>
              <button onClick={() => setModalOpen(false)} className="btn-8pt text-gray-700 bg-white border border-gray-300 hover:bg-gray-50">取消</button>
              <button form="assistant-form" type="submit" className="btn-8pt text-white bg-[#0f172a] hover:bg-[#1e293b]">确认添加</button>
            </>
          )
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

      {/* Time log Modal */}
      <Modal
        isOpen={!!timelogModal}
        onClose={closeTimelogModal}
        title={timelogModal ? `${timelogModal.name} (${timelogModal.studentId}) 工时日志` : '工时日志'}
        footer={
          <>
            <button onClick={closeTimelogModal} className="btn-8pt text-gray-700 bg-white border border-gray-300 hover:bg-gray-50">关闭</button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Add form */}
          <form onSubmit={addTimelog} className="flex items-end gap-3 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">日期</label>
              <input type="date" required value={timelogForm.date}
                onChange={(e) => setTimelogForm((p) => ({ ...p, date: e.target.value }))}
                className="h-9 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">工时 (h)</label>
              <input type="number" required value={timelogForm.hours}
                onChange={(e) => setTimelogForm((p) => ({ ...p, hours: e.target.value }))}
                min="0.5" max="24" step="0.5" placeholder="例如 2.5"
                className="w-24 h-9 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">备注</label>
              <input value={timelogForm.notes}
                onChange={(e) => setTimelogForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="可选备注"
                className="w-full h-9 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <button type="submit" className="btn-8pt text-white bg-indigo-600 hover:bg-indigo-700 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              添加
            </button>
          </form>

          {/* Log list */}
          {timelogLoading ? (
            <p className="text-sm text-gray-400 text-center py-8">加载中...</p>
          ) : timelogs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">暂无工时日志记录</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wide">日期</th>
                  <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wide">工时</th>
                  <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wide">创建时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {timelogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-3 text-gray-900 tabular-nums">{log.date || '—'}</td>
                    <td className="py-3">
                      <span className="font-semibold text-indigo-600 tabular-nums">{log.hours != null ? log.hours + 'h' : '—'}</span>
                    </td>
                    <td className="py-3 text-gray-500 text-xs">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString('zh-CN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>

    </div>
  )
}
