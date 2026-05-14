import { useState, useEffect, useCallback } from 'react'
import { requestMock as request } from '../../utils/api'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const data = await request('GET /api/student/profile')
    setProfile(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading || !profile) {
    return <p className="text-xs text-gray-400">加载中...</p>
  }

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="card-8pt">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-2xl font-semibold text-emerald-600 shrink-0">
            {profile.name?.charAt(0) || '?'}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 leading-title">{profile.name}</h2>
            <p className="text-sm text-gray-500 leading-body">{profile.studentId}</p>
          </div>
          <span className={
            'ml-auto inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ' +
            (profile.status === 'active'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-gray-50 text-gray-500 border-gray-200')
          }>
            <span className={'w-2 h-2 rounded-full ' + (profile.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400')} />
            {profile.status === 'active' ? '在岗' : '离岗'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">岗位</p>
            <p className="text-sm font-medium text-gray-900">{profile.position || '-'}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">岗位等级</p>
            <span className={
              'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ' +
              ((profile.position || profile.positionLevel) === '一级岗'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-amber-50 text-amber-700 border-amber-200')
            }>{profile.position || profile.positionLevel || '-'}</span>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">上班状态</p>
            <p className="text-sm font-medium text-gray-900">{profile.isOnDuty ? '上班' : '下班'}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">手机</p>
            <p className="text-sm font-medium text-gray-900">{profile.phone || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
