import { useState, useEffect, useCallback } from 'react'
import Table from '../../components/Table'
import { requestMock as request } from '../../utils/api'

export default function AttendanceCorrection() {
  const [tab, setTab] = useState('submit') // 'submit' | 'history'
  const [approvals, setApprovals] = useState([])
  const [cardDate, setCardDate] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const fetchApprovals = useCallback(async () => {
    setLoading(true)
    const data = await request('GET /api/student/approvals')
    setApprovals(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchApprovals() }, [fetchApprovals])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!cardDate || !reason.trim()) { alert('请填写补卡日期和理由'); return }
    setSubmitting(true)
    setSuccessMsg('')
    await request('POST /api/student/approvals', {
      method: 'POST',
      body: JSON.stringify({ cardDate, reason: reason.trim() }),
    })
    setCardDate('')
    setReason('')
    setSubmitting(false)
    setSuccessMsg('补卡申请已提交，请等待审批')
    await fetchApprovals()
  }

  const historyColumns = [
    { key: 'applyDate', title: '申请日期' },
    { key: 'cardDate', title: '补卡日期' },
    { key: 'reason', title: '理由' },
    {
      key: 'status', title: '状态', width: '140px',
      render: (v, row) => (
        <div>
          {v === 'pending' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> 待审批
            </span>
          )}
          {v === 'approved' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">已通过</span>
          )}
          {v === 'rejected' && (
            <div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">已拒绝</span>
              {row.rejectReason && <p className="text-xs text-gray-400 mt-1">原因：{row.rejectReason}</p>}
            </div>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setTab('submit')}
          className={'px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 ' + (tab === 'submit' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
        >
          提交申请
        </button>
        <button onClick={() => setTab('history')}
          className={'px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 ' + (tab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
        >
          我的申请
          {approvals.length > 0 && <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 text-xs font-semibold text-white bg-emerald-500 rounded-full px-1.5">{approvals.length}</span>}
        </button>
      </div>

      {tab === 'submit' ? (
        <div className="card-8pt max-w-lg">
          <h4 className="text-base font-semibold text-gray-900 mb-4 leading-title">提交补卡申请</h4>
          {successMsg && (
            <p className="text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg mb-4">{successMsg}</p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">补卡日期</label>
              <input type="date" required value={cardDate} onChange={(e) => setCardDate(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">申请理由</label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4}
                placeholder="请说明补卡原因..."
                className="w-full px-3 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition-shadow placeholder:text-gray-400"
              />
            </div>
            <button type="submit" disabled={submitting}
              className="btn-8pt text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50"
            >
              {submitting ? '提交中...' : '提交申请'}
            </button>
          </form>
        </div>
      ) : (
        <>
          {loading && <p className="text-xs text-gray-400">加载中...</p>}
          <Table columns={historyColumns} data={approvals} emptyText="暂无补卡申请" />
        </>
      )}
    </div>
  )
}
