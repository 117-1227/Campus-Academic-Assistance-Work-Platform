import { useState } from 'react'
import Assistants from '../pages/Assistants'
import WorkHours from '../pages/WorkHours'
import OnlineBoard from '../pages/OnlineBoard'
import Modal from './Modal'
import SettingsModal from './SettingsModal'
import DebugPanel from './DebugPanel'

const PAGES = [
  {
    key: 'assistants',
    label: '学助管理',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    key: 'workHours',
    label: '工时查看',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'onlineBoard',
    label: '在班看板',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
      </svg>
    ),
  },
]

const TITLES = {
  assistants: '学助管理',
  workHours: '工时查看',
  onlineBoard: '在班看板',
}

export default function AdminShell({ auth, onLogout, remainMs, formatRemain, expiredModal }) {
  const [currentPage, setCurrentPage] = useState('assistants')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)

  const renderPage = () => {
    switch (currentPage) {
      case 'assistants': return <Assistants />
      case 'workHours': return <WorkHours />
      case 'onlineBoard': return <OnlineBoard />
      default: return <Assistants />
    }
  }

  return (
    <div className="flex h-screen bg-[#f3f4f6]">
      {/* ---- Sidebar: 256px (w-64) ---- */}
      <aside className="w-64 bg-[#0f172a] text-white flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/[0.08]">
          <span className="text-lg font-semibold tracking-tight text-white">
            校内学助工作平台
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-5 px-3 space-y-1">
          {PAGES.map((page) => {
            const active = currentPage === page.key
            return (
              <button
                key={page.key}
                onClick={() => setCurrentPage(page.key)}
                className={
                  'w-full flex items-center gap-3 px-4 py-3 text-[15px] rounded-lg transition-all duration-150 ' +
                  (active
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]')
                }
              >
                <span className={active ? 'text-indigo-400' : 'text-slate-500'}>{page.icon}</span>
                <span>{page.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-white/[0.08] space-y-3">
          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm font-semibold text-indigo-300 shrink-0">
              {auth.user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white font-medium leading-title truncate">
                {auth.user?.username || 'admin'}
              </p>
              <p className="text-xs text-slate-400 leading-body">管理员</p>
            </div>
            <button
              onClick={() => setLogoutConfirmOpen(true)}
              className="ml-auto p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
              title="退出登录"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>
          {/* Settings button */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            系统设置
          </button>

          {/* Version + session */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 leading-body">v1.0</p>
            {remainMs > 0 && (
              <p className="text-xs text-slate-500 leading-body">
                剩余 {formatRemain(remainMs)}
              </p>
            )}
          </div>
          <p className="text-xs text-slate-600/60 leading-body text-center border-t border-white/[0.06] pt-3 mt-1">
            © 版权归青穹团队所有
          </p>
        </div>
      </aside>

      {/* ---- Main ---- */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shrink-0">
          <div className="max-w-[1280px] mx-auto px-8 py-5">
            <h1 className="text-xl font-semibold text-gray-900">{TITLES[currentPage]}</h1>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-[1280px] mx-auto px-8 py-8">
            {renderPage()}
          </div>
        </div>
      </main>

      {/* Settings modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Logout confirmation modal */}
      <Modal
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        title="退出登录"
        footer={
          <>
            <button onClick={() => setLogoutConfirmOpen(false)} className="btn-8pt text-gray-700 bg-white border border-gray-300 hover:bg-gray-50">取消</button>
            <button
              onClick={() => { setLogoutConfirmOpen(false); onLogout() }}
              className="btn-8pt text-white bg-red-600 hover:bg-red-700"
            >
              确认退出
            </button>
          </>
        }
      >
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">确定要退出登录吗？</p>
            <p className="text-xs text-gray-500 mt-1">退出后需要重新输入用户名和密码</p>
          </div>
        </div>
      </Modal>

      {/* Debug panel */}
      <DebugPanel />

      {/* Session expired modal */}
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
          <p className="text-sm text-gray-600 text-center">
            您的登录会话已过期，请重新登录以继续使用。
          </p>
        </div>
      </Modal>
    </div>
  )
}
