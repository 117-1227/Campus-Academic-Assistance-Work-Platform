import { useState, useEffect, useCallback } from 'react'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { requestMock as request } from '../../utils/api'

export default function ApprovalProcess() {
  const [tab, setTab] = useState('pending')
  const [pendingList, setPendingList] = useState([])
  const [historyList, setHistoryList] = useState([])
  const [loading, setLoading] = useState(false)
  const [rejectModal, setRejectModal] = useState({ open: false, item: null })
  const [rejectReason, setRejectReason] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [pending, history] = await Promise.all([
      request('GET /api/teacher/approvals?status=pending'),
      request('GET /api/teacher/approvals?status=all'),
    ])
    setPendingList(pending)
    setHistoryList(history.filter((a) => a.status !== 'pending'))
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const approvedCount = historyList.filter((a) => a.status === 'approved').length
  const rejectedCount = historyList.filter((a) => a.status === 'rejected').length

  async function approve(item) {
    if (!confirm(`确认通过 ${item.applicant} (${item.studentId}) 的补卡申请？`)) return
    await request(`POST /api/teacher/approvals/${item.id}/approve`, { method: 'POST', body: '{}' })
    await fetchData()
  }

  function openRejectModal(item) {
    setRejectModal({ open: true, item })
    setRejectReason('')
  }

  async function confirmReject() {
    const item = rejectModal.item
    if (!rejectReason.trim()) { alert('请填写拒绝理由'); return }
    await request(`POST /api/teacher/approvals/${item.id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason: rejectReason.trim() }),
    })
    setRejectModal({ open: false, item: null })
    setRejectReason('')
    await fetchData()
  }

  const pendingColumns = [
    { key: 'applicant', title: '申请人' },
    { key: 'studentId', title: '学号' },
    { key: 'applyDate', title: '申请日期' },
    { key: 'cardDate', title: '补卡日期' },
    { key: 'reason', title: '理由' },
    {
      key: 'actions', title: '操作', width: '180px',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => approve(row)}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            通过
          </button>
          <button onClick={() => openRejectModal(row)}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            拒绝
          </button>
        </div>
      ),
    },
  ]

  const historyColumns = [
    { key: 'applicant', title: '申请人' },
    { key: 'studentId', title: '学号' },
    { key: 'applyDate', title: '申请日期' },
    { key: 'cardDate', title: '补卡日期' },
    { key: 'reason', title: '理由' },
    {
      key: 'status', title: '审批结果', width: '160px',
      render: (v, row) => (
        <div>
          {v === 'approved' ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              已通过
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              已拒绝
            </span>
          )}
          {v === 'rejected' && row.rejectReason && <p className="text-xs text-gray-400 mt-1 leading-body">原因：{row.rejectReason}</p>}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="card-8pt">
          <p className="stat-label text-gray-500">待审批</p>
          <p className="stat-number text-amber-600">{pendingList.length}</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">待处理的补卡申请</p>
        </div>
        <div className="card-8pt">
          <p className="stat-label text-gray-500">已处理</p>
          <p className="stat-number text-gray-900">{historyList.length}</p>
          <p className="text-xs text-gray-400 mt-1 leading-body">通过 {approvedCount} &middot; 拒绝 {rejectedCount}</p>
        </div>
      </div>

      <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setTab('pending')}
          className={'px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 ' + (tab === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
        >
          待审批
          {pendingList.length > 0 && <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 text-xs font-semibold text-white bg-amber-500 rounded-full px-1.5">{pendingList.length}</span>}
        </button>
        <button onClick={() => setTab('history')}
          className={'px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 ' + (tab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
        >
          已审批
        </button>
      </div>

      {loading && <p className="text-xs text-gray-400">加载中...</p>}

      {tab === 'pending'
        ? <Table columns={pendingColumns} data={pendingList} emptyText="暂无待审批申请" />
        : <Table columns={historyColumns} data={historyList} emptyText="暂无审批记录" />
      }

      <Modal isOpen={rejectModal.open} onClose={() => setRejectModal({ open: false, item: null })} title="拒绝补卡申请"
        footer={
          <>
            <button onClick={() => setRejectModal({ open: false, item: null })} className="btn-8pt text-gray-700 bg-white border border-gray-300 hover:bg-gray-50">取消</button>
            <button onClick={confirmReject} className="btn-8pt text-white bg-red-600 hover:bg-red-700">确认拒绝</button>
          </>
        }
      >
        {rejectModal.item && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-semibold">
                {rejectModal.item.applicant?.charAt(0)}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900 leading-title">{rejectModal.item.applicant}</p>
                <p className="text-xs text-gray-500 leading-body">{rejectModal.item.studentId} &middot; 补卡 {rejectModal.item.cardDate}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">拒绝理由</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} placeholder="请填写拒绝理由..."
                className="w-full px-3 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none transition-shadow placeholder:text-gray-400"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
