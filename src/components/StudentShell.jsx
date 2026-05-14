import { useState } from 'react'
import Profile from '../pages/student/Profile'
import WorkHoursRecord from '../pages/student/WorkHoursRecord'
import AttendanceCorrection from '../pages/student/AttendanceCorrection'
import ClockInOut from '../pages/student/ClockInOut'
import Modal from './Modal'

const PAGES = [
  {
    key: 'profile',
    label: '个人档案',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    key: 'workHoursRecord',
    label: '工时记录',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'attendanceCorrection',
    label: '补卡申请',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    key: 'clockInOut',
    label: '打卡签到',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

const TITLES = {
  profile: '个人档案',
  workHoursRecord: '工时记录',
  attendanceCorrection: '补卡申请',
  clockInOut: '打卡签到',
}

export default function StudentShell({ auth, onLogout, remainMs, formatRemain, expiredModal }) {
  const [currentPage, setCurrentPage] = useState('clockInOut')

  const renderPage = () => {
    switch (currentPage) {
      case 'profile': return <Profile />
      case 'workHoursRecord': return <WorkHoursRecord />
      case 'attendanceCorrection': return <AttendanceCorrection />
      case 'clockInOut': return <ClockInOut />
      default: return <ClockInOut />
    }
  }

  return (
    <div className="flex h-screen bg-[#f3f4f6]">
      {/* Sidebar */}
      <aside className="w-60 bg-[#022c22] text-white flex flex-col shrink-0">
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
                <span className={active ? 'text-emerald-300' : 'text-slate-400'}>{page.icon}</span>
                <span>{page.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="px-6 py-4 border-t border-white/[0.08] space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm font-semibold text-emerald-300 shrink-0">
              {auth.user?.username?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white font-medium leading-title truncate">
                {auth.user?.username || 'student'}
              </p>
              <p className="text-xs text-slate-400 leading-body">学生</p>
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
          <button onClick={onLogout} className="btn-8pt text-white bg-[#0f172a] hover:bg-[#1e293b]">重新登录</button>
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
