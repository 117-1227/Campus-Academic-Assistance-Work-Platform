import { useState } from 'react'
import AssistantsList from '../pages/teacher/AssistantsList'
import WorkHoursStats from '../pages/teacher/WorkHoursStats'
import ApprovalProcess from '../pages/teacher/ApprovalProcess'
import ScheduleManagement from '../pages/teacher/ScheduleManagement'
import Modal from './Modal'

const PAGES = [
  {
    key: 'assistantsList',
    label: '学助列表',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    key: 'workHoursStats',
    label: '工时统计',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'approvalProcess',
    label: '审批补卡',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    key: 'scheduleMgmt',
    label: '排班管理',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
      </svg>
    ),
  },
]

const TITLES = {
  assistantsList: '学助列表',
  workHoursStats: '工时统计',
  approvalProcess: '审批补卡',
  scheduleMgmt: '排班管理',
}

export default function TeacherShell({ auth, onLogout, remainMs, formatRemain, expiredModal }) {
  const [currentPage, setCurrentPage] = useState('assistantsList')

  const renderPage = () => {
    switch (currentPage) {
      case 'assistantsList': return <AssistantsList />
      case 'workHoursStats': return <WorkHoursStats />
      case 'approvalProcess': return <ApprovalProcess />
      case 'scheduleMgmt': return <ScheduleManagement />
      default: return <AssistantsList />
    }
  }

  return (
    <div className="flex h-screen bg-[#f3f4f6]">
      {/* Sidebar */}
      <aside className="w-60 bg-[#1e1b4b] text-white flex flex-col shrink-0">
        <div className="px-6 py-6 border-b border-white/[0.08]">
          <span className="text-base font-semibold tracking-tight text-white leading-title">
            校内学助工作平台
          </span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {PAGES.map((page) => {
            const active = currentPage === page.key
            return (
              <button
                key={page.key}
                onClick={() => setCurrentPage(page.key)}
                className={
                  'w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-all duration-150 ' +
                  (active
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.04]')
                }
              >
                <span className={active ? 'text-indigo-300' : 'text-slate-400'}>{page.icon}</span>
                <span>{page.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="px-6 py-4 border-t border-white/[0.08] space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm font-semibold text-indigo-300 shrink-0">
              {auth.user?.username?.charAt(0).toUpperCase() || 'T'}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white font-medium leading-title truncate">
                {auth.user?.username || 'teacher'}
              </p>
              <p className="text-xs text-slate-400 leading-body">教师</p>
            </div>
            <button
              onClick={onLogout}
              className="ml-auto p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
              title="退出登录"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 leading-body">v1.0</p>
            {remainMs > 0 && (
              <p className="text-xs text-slate-500 leading-body">剩余 {formatRemain(remainMs)}</p>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 shrink-0">
          <div className="max-w-[1200px] mx-auto px-6 py-4">
            <h1 className="page-title text-gray-900">{TITLES[currentPage]}</h1>
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          <div className="max-w-[1200px] mx-auto px-6 py-8">
            {renderPage()}
          </div>
        </div>
      </main>

      <Modal
        isOpen={expiredModal}
        onClose={() => {}}
        title="登录已过期"
        footer={
          <button onClick={onLogout} className="btn-8pt text-white bg-[#0f172a] hover:bg-[#1e293b]">
            重新登录
          </button>
        }
      >
        <div className="space-y-4">
          <svg className="w-12 h-12 mx-auto text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-gray-600 text-center">您的登录会话已过期，请重新登录以继续使用。</p>
        </div>
      </Modal>
    </div>
  )
}
