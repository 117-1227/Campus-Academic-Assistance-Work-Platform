import { useState, useEffect, useCallback } from 'react'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { requestMock as request } from '../../utils/api'

const SHIFT_TYPES = ['早班', '午班', '晚班']
const INITIAL_FORM = { assistantName: '', studentId: '', date: '', shiftType: '早班', startTime: '08:00', endTime: '12:00', location: '' }

export default function ScheduleManagement() {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [month, setMonth] = useState(currentMonth)
  const [schedules, setSchedules] = useState([])
  const [assistants, setAssistants] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [schedList, asstList] = await Promise.all([
      request(`GET /api/teacher/schedules?month=${month}`),
      request('GET /api/teacher/assistants'),
    ])
    setSchedules(Array.isArray(schedList) ? schedList : [])
    setAssistants(Array.isArray(asstList) ? asstList : [])
    setLoading(false)
  }, [month])

  useEffect(() => { fetchData() }, [fetchData])

  const activeAssts = assistants.filter((a) => a.status === '在岗')
  const uniqueAssts = [...new Set(schedules.map((s) => s.studentId))].length
  const totalShifts = schedules.length

  function openAddModal() {
    setEditing(null)
    setForm(INITIAL_FORM)
    setModalOpen(true)
  }

  function openEditModal(row) {
    setEditing(row)
    setForm({
      assistantName: row.assistantName,
      studentId: row.studentId,
      date: row.date,
      shiftType: row.shiftType,
      startTime: row.startTime,
      endTime: row.endTime,
      location: row.location,
    })
    setModalOpen(true)
  }

  function handleSelectAssistant(e) {
    const sid = e.target.value
    const a = assistants.find((x) => x.studentId === sid)
    setForm((prev) => ({
      ...prev,
      studentId: sid,
      assistantName: a ? a.name : '',
    }))
  }

  function updateField(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (editing) {
      await request('PUT /api/teacher/schedules/:id', {
        method: 'PUT',
        body: JSON.stringify({ id: editing.id, ...form }),
      })
    } else {
      await request('POST /api/teacher/schedules', {
        method: 'POST',
        body: JSON.stringify(form),
      })
    }
    setModalOpen(false)
    await fetchData()
  }

  async function handleDelete(row) {
    if (!confirm(`确认删除 ${row.assistantName} (${row.date} ${row.shiftType}) 的排班？`)) return
    await request(`DELETE /api/teacher/schedules/${row.id}`, { method: 'DELETE' })
    await fetchData()
  }

  const columns = [
    { key: 'assistantName', title: '学助' },
    { key: 'studentId', title: '学号' },
    { key: 'date', title: '日期' },
    { key: 'shiftType', title: '班次', width: '96px',
      render: (v) => (
        <span className={
          'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ' +
          (v === '早班' ? 'bg-blue-50 text-blue-700 border-blue-200' :
           v === '午班' ? 'bg-amber-50 text-amber-700 border-amber-200' :
           'bg-indigo-50 text-indigo-700 border-indigo-200')
        }>{v}</span>
      ),
    },
    { key: 'startTime', title: '开始', width: '80px' },
    { key: 'endTime', title: '结束', width: '80px' },
    { key: 'location', title: '地点' },
    {
      key: 'actions', title: '操作', width: '128px',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEditModal(row)} className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">编辑</button>
          <button onClick={() => handleDelete(row)} className="px-3 py-1 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors">删除</button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-8pt">
          <p className="stat-label text-gray-500">本月班次</p>
          <p className="stat-number text-indigo-600">{totalShifts}</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">已安排的总班次</p>
        </div>
        <div className="card-8pt">
          <p className="stat-label text-gray-500">参与学助</p>
          <p className="stat-number text-gray-900">{uniqueAssts}</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">共 {activeAssts.length} 人在岗</p>
        </div>
        <div className="card-8pt">
          <p className="stat-label text-gray-500">当月月份</p>
          <p className="stat-number text-gray-900">{month.split('-')[1]}月</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">{month.split('-')[0]} 年</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="h-10 text-sm bg-white border border-gray-300 rounded-lg pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
          />
        </div>
        <button onClick={openAddModal} className="btn-8pt text-white bg-[#1e1b4b] hover:bg-[#312e81]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          添加排班
        </button>
        {loading && <span className="text-xs text-gray-400">加载中...</span>}
      </div>

      <Table columns={columns} data={schedules} />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? '编辑排班' : '添加排班'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-8pt text-gray-700 bg-white border border-gray-300 hover:bg-gray-50">取消</button>
            <button form="schedule-form" type="submit" className="btn-8pt text-white bg-[#1e1b4b] hover:bg-[#312e81]">
              {editing ? '保存修改' : '确认添加'}
            </button>
          </>
        }
      >
        <form id="schedule-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">选择学助</label>
            <select value={form.studentId} onChange={handleSelectAssistant} required
              className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            >
              <option value="">请选择学助</option>
              {activeAssts.map((a) => (
                <option key={a.studentId} value={a.studentId}>{a.name} ({a.studentId})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">日期</label>
              <input type="date" required value={form.date} onChange={updateField('date')}
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">班次</label>
              <select value={form.shiftType} onChange={updateField('shiftType')}
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                {SHIFT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">开始时间</label>
              <input type="time" required value={form.startTime} onChange={updateField('startTime')}
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">结束时间</label>
              <input type="time" required value={form.endTime} onChange={updateField('endTime')}
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">地点</label>
            <input required value={form.location} onChange={updateField('location')} placeholder="如：图书馆A区"
              className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
