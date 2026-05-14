import { useState, useEffect, useCallback } from 'react'
import Table from '../components/Table'
import Modal from '../components/Modal'
import { requestMock as request } from '../utils/api'

const INITIAL_FORM = { studentId: '', name: '', level: '一级岗', phone: '' }

// hourlyRate: string → level
function toLevel(rate) {
  const n = parseFloat(rate)
  return n >= 15 ? '一级岗' : '二级岗'
}

// status: backend value → display (在岗/离岗)
function toStatus(s) {
  if (!s) return '未知'
  if (s === '在岗' || s === '离岗') return s
  if (s === 'active' || s === '1' || s === true) return '在岗'
  if (s === 'inactive' || s === '0' || s === false) return '离岗'
  return s
}

// level → hourlyRate for form submission
function levelToRate(level) {
  return level === '一级岗' ? 15 : 12
}

export default function Assistants() {
  const [assistants, setAssistants] = useState([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const raw = await request('GET /api/assistants')
    setAssistants(Array.isArray(raw) ? raw : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = assistants.filter((a) => {
    const q = search.toLowerCase()
    return (a.studentId || '').toLowerCase().includes(q) || (a.name || '').toLowerCase().includes(q)
  })

  const activeList = assistants.filter((a) => toStatus(a.status) === '在岗')
  const inactiveList = assistants.filter((a) => toStatus(a.status) === '离岗')
  const level1List = assistants.filter((a) => toLevel(a.hourlyRate) === '一级岗' && toStatus(a.status) === '在岗')

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
      level: toLevel(row.hourlyRate),
      phone: row.phone || '',
    })
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      studentId: form.studentId,
      name: form.name,
      hourlyRate: String(levelToRate(form.level)),
      phone: form.phone,
    }
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
  }

  async function resetPassword(row) {
    if (!confirm(`确认将 ${row.name} 的密码重置为 123456？`)) return
    await request(`POST /api/assistants/${row.id}/reset-password`, { method: 'POST', body: '{}' })
    alert('密码已重置为 123456')
  }

  async function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('请上传 .xlsx 或 .xls 格式的文件')
      return
    }
    const result = await request('POST /api/assistants/import', {
      method: 'POST',
      body: JSON.stringify({ filename: file.name }),
    })
    alert(`导入成功，新增 ${result.count} 名学生`)
    await fetchData()
    e.target.value = ''
  }

  function handleSelect(row, checked) {
    setSelected((prev) =>
      checked ? [...prev, row.id] : prev.filter((id) => id !== row.id)
    )
  }

  function handleSelectAll(checked) {
    setSelected(checked ? filtered.map((r) => r.id) : [])
  }

  async function handleBatchDelete() {
    if (selected.length === 0) return
    if (!confirm(`确认删除选中的 ${selected.length} 名学助？此操作不可撤销。`)) return
    await request('POST /api/assistants/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ ids: selected }),
    })
    setSelected([])
    await fetchData()
  }

  function updateField(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const columns = [
    { key: 'studentId', title: '学号' },
    { key: 'name', title: '姓名' },
    {
      key: 'hourlyRate',
      title: '岗位等级',
      width: '112px',
      render: (v) => {
        const lv = toLevel(v)
        return (
          <span
            className={
              'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ' +
              (lv === '一级岗'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-amber-50 text-amber-700 border-amber-200')
            }
          >
            {lv}
          </span>
        )
      },
    },
    {
      key: 'status',
      title: '状态',
      width: '96px',
      render: (v) => {
        const s = toStatus(v)
        return (
          <span
            className={
              'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ' +
              (s === '在岗'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-gray-50 text-gray-500 border border-gray-200')
            }
          >
            <span className={'w-2 h-2 rounded-full ' + (s === '在岗' ? 'bg-emerald-500' : 'bg-gray-400')} />
            {s}
          </span>
        )
      },
    },
    { key: 'phone', title: '手机' },
    {
      key: 'actions',
      title: '操作',
      width: '176px',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEditModal(row)}
            className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            编辑
          </button>
          <button
            onClick={() => resetPassword(row)}
            className="px-3 py-1 text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            重置密码
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* ---- Stats Cards: grid gap-4(16), card p-6(24) ---- */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-8pt">
          <p className="stat-label text-gray-500">学助总数</p>
          <p className="stat-number text-gray-900">{assistants.length}</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">
            在岗 {activeList.length} &middot; 离岗 {inactiveList.length}
          </p>
        </div>
        <div className="card-8pt">
          <p className="stat-label text-gray-500">在岗人数</p>
          <p className="stat-number text-emerald-600">{activeList.length}</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">
            占比 {assistants.length > 0 ? Math.round((activeList.length / assistants.length) * 100) : 0}%
          </p>
        </div>
        <div className="card-8pt">
          <p className="stat-label text-gray-500">岗位分布</p>
          <p className="stat-number text-gray-900">
            <span className="text-indigo-600">{level1List.length}</span>
            <span className="text-gray-300 mx-1">/</span>
            <span className="text-amber-600">{activeList.length - level1List.length}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1 leading-body">一级岗 / 二级岗（在岗）</p>
        </div>
      </div>

      {/* ---- Toolbar: gap-3(12) ---- */}
      <div className="flex items-center gap-3">
        {/* Search: h-10(40), icon w-4(16) at left-3(12), text pl-8(32) pr-3(12) */}
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"
          >
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

        {/* Add button: h-10(40) px-4(16) icon w-4(16) gap-2(8) */}
        <button
          onClick={openAddModal}
          className="btn-8pt text-white bg-[#0f172a] hover:bg-[#1e293b]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          添加学助
        </button>

        {/* Batch delete: h-10(40) px-4(16) */}
        {selected.length > 0 && (
          <button
            onClick={handleBatchDelete}
            className="btn-8pt text-red-600 bg-white border border-red-200 hover:bg-red-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            删除 {selected.length}
          </button>
        )}

        {/* Import: h-10(40) px-4(16) icon w-4(16) gap-2(8) */}
        <label className="btn-8pt text-gray-700 bg-white border border-gray-300 hover:bg-gray-50">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          批量导入
          <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
        </label>

        {loading && <span className="text-xs text-gray-400">加载中...</span>}
      </div>

      {/* ---- Table ---- */}
      <Table
        columns={columns}
        data={filtered}
        selectable
        selected={selected}
        onSelect={handleSelect}
        onSelectAll={handleSelectAll}
      />

      {/* ---- Add/Edit Modal ---- */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? '编辑学助信息' : '添加学助'}
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="btn-8pt text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              form="assistant-form"
              type="submit"
              className="btn-8pt text-white bg-[#0f172a] hover:bg-[#1e293b]"
            >
              {editing ? '保存修改' : '确认添加'}
            </button>
          </>
        }
      >
        <form id="assistant-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">学号</label>
              <input
                required value={form.studentId} onChange={updateField('studentId')} disabled={!!editing}
                maxLength={10} pattern="\d{10}" title="学号必须为10位数字"
                inputMode="numeric"
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-400 transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
              <input
                required value={form.name} onChange={updateField('name')}
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">岗位等级</label>
              <select
                value={form.level} onChange={updateField('level')}
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow bg-white"
              >
                <option value="一级岗">一级岗（15元/h）</option>
                <option value="二级岗">二级岗（12元/h）</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">手机</label>
              <input
                required value={form.phone} onChange={updateField('phone')}
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
