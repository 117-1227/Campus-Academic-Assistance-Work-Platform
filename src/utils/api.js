// ---- Real API (USE_MOCK=false 时生效) ----

async function request(path, options = {}) {
  // Strip method prefix if present, e.g. "POST /api/admin/login" → "/api/admin/login"
  let url = path.replace(/^[A-Z]+ /, '')

  // Replace :param segments with values from body
  // e.g. "/api/assistants/:id" + body.id="123" → "/api/assistants/123"
  if (options.body) {
    try {
      const bodyObj = JSON.parse(options.body)
      url = url.replace(/:(\w+)/g, (_, key) => bodyObj[key] ?? `:${key}`)
    } catch { /* not JSON, skip */ }
  }

  const headers = { 'Content-Type': 'application/json' }

  // Attach JWT token if present
  try {
    const token = localStorage.getItem('token')
    if (token) headers['Authorization'] = `Bearer ${token}`
  } catch { /* localStorage unavailable */ }

  const config = { ...options, headers: { ...headers, ...(options.headers || {}) } }
  const res = await fetch(url, config)

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || `请求失败 (${res.status})`)
  }
  // Unwrap backend envelope { ..., data: [...] } → return inner array
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && Array.isArray(data.data)) {
    return data.data
  }
  return data
}

// ---- Mock layer (USE_MOCK=true 时生效) ----

const USE_MOCK = false // 切换为 true 以启用 Mock 数据和路由

/* ========== Mock Data ========== */

let mockAssistants = [
  { id: '1', studentId: '2021001', name: '张三', hourlyRate: '15.00', position: '图书助理', status: '在岗', phone: '13800138001' },
  { id: '2', studentId: '2021002', name: '李四', hourlyRate: '12.00', position: '实验助理', status: '在岗', phone: '13800138002' },
  { id: '3', studentId: '2021003', name: '王五', hourlyRate: '18.00', position: '活动助理', status: '离岗', phone: '13800138003' },
  { id: '4', studentId: '2021004', name: '赵六', hourlyRate: '15.00', position: '课程助理', status: '在岗', phone: '13800138004' },
  { id: '5', studentId: '2021005', name: '孙七', hourlyRate: '20.00', position: '教务助理', status: '在岗', phone: '13800138005' },
]

let mockApprovals = [
  { id: '1', applicant: '张三', studentId: '2021001', applyDate: '2026-05-10', cardDate: '2026-05-08', reason: '忘记打卡', status: 'pending' },
  { id: '2', applicant: '李四', studentId: '2021002', applyDate: '2026-05-11', cardDate: '2026-05-09', reason: '系统故障', status: 'pending' },
  { id: '3', applicant: '王五', studentId: '2021003', applyDate: '2026-05-09', cardDate: '2026-05-07', reason: '外出开会', status: 'approved', rejectReason: '' },
  { id: '4', applicant: '赵六', studentId: '2021004', applyDate: '2026-05-08', cardDate: '2026-05-06', reason: '忘记带卡', status: 'rejected', rejectReason: '理由不充分' },
]

const mockWorkHours = {
  '2026-05': [
    { studentId: '2021001', name: '张三', totalHours: 48, workDays: 12, daily: [{ date: '2026-05-02', hours: 4, checkIn: '08:00', checkOut: '12:00' }, { date: '2026-05-03', hours: 4, checkIn: '08:05', checkOut: '11:55' }, { date: '2026-05-06', hours: 4, checkIn: '07:58', checkOut: '12:02' }] },
    { studentId: '2021002', name: '李四', totalHours: 36, workDays: 9, daily: [{ date: '2026-05-03', hours: 4, checkIn: '08:10', checkOut: '12:00' }] },
    { studentId: '2021003', name: '王五', totalHours: 20, workDays: 5, daily: [] },
    { studentId: '2021004', name: '赵六', totalHours: 44, workDays: 11, daily: [] },
    { studentId: '2021005', name: '孙七', totalHours: 32, workDays: 8, daily: [] },
  ],
}

let nextId = 6
function uid() { return String(nextId++) }

let mockSchedules = [
  { id: '1', assistantName: '张三', studentId: '2021001', date: '2026-05-02', shiftType: '早班', startTime: '08:00', endTime: '12:00', location: '图书馆A区' },
  { id: '2', assistantName: '李四', studentId: '2021002', date: '2026-05-02', shiftType: '午班', startTime: '13:00', endTime: '17:00', location: '实验楼B栋' },
  { id: '3', assistantName: '张三', studentId: '2021001', date: '2026-05-03', shiftType: '早班', startTime: '08:00', endTime: '12:00', location: '图书馆A区' },
  { id: '4', assistantName: '赵六', studentId: '2021004', date: '2026-05-03', shiftType: '晚班', startTime: '18:00', endTime: '22:00', location: '教学楼C座' },
  { id: '5', assistantName: '孙七', studentId: '2021005', date: '2026-05-04', shiftType: '早班', startTime: '08:00', endTime: '12:00', location: '教务大厅' },
]

let mockClockState = {
  '2021001': { clockedIn: true, lastCheckIn: new Date(Date.now() - 3600000 * 3).toISOString(), lastCheckOut: null, todayRecords: [{ checkIn: new Date(Date.now() - 3600000 * 3).toISOString(), checkOut: null, hours: 3 }] },
  '2021002': { clockedIn: false, lastCheckIn: null, lastCheckOut: new Date(Date.now() - 7200000).toISOString(), todayRecords: [{ checkIn: new Date(Date.now() - 3600000 * 5).toISOString(), checkOut: new Date(Date.now() - 7200000).toISOString(), hours: 3 }] },
}

function mockHandler(fn) {
  return (...args) =>
    new Promise((resolve, reject) =>
      setTimeout(() => {
        try { resolve(fn(...args)) } catch (e) { reject(e) }
      }, 300)
    )
}

/* ========== Mock Routes ========== */

const mockRoutes = {
  // -- Auth --
  'POST /api/admin/login': mockHandler((body) => {
    if (!body || !body.username || !body.password) {
      throw new Error('用户名和密码为必填项')
    }
    const credentials = {
      admin:   { role: 'admin',   id: 'mock-admin-001' },
      teacher: { role: 'teacher', id: 'mock-teacher-001' },
      student: { role: 'student', id: 'mock-student-001', studentId: '2021001' },
    }
    const cred = credentials[body.username]
    if (cred && body.password === '123456') {
      return {
        status: 'success',
        id: cred.id,
        username: body.username,
        role: cred.role,
        studentId: cred.studentId,
        token: `mock-jwt-token-${body.username}-2026`,
      }
    }
    throw new Error('用户名或密码无效')
  }),

  'GET /api/admin/profile': mockHandler(() => ({
    status: 'success',
    id: 'mock-admin-001',
    username: 'admin',
    role: 'admin',
  })),

  // -- Assistants --
  'GET /api/assistants': mockHandler(() => [...mockAssistants]),

  'POST /api/assistants': mockHandler((body) => {
    const newOne = { id: uid(), ...body, status: body.status || '在岗' }
    mockAssistants.push(newOne)
    return newOne
  }),

  'PUT /api/assistants/:id': mockHandler((id, body) => {
    const idx = mockAssistants.findIndex((a) => a.id === id)
    if (idx !== -1) Object.assign(mockAssistants[idx], body)
    return mockAssistants[idx]
  }),

  'POST /api/assistants/:id/reset-password': mockHandler(() => ({
    success: true, message: '密码已重置为 123456',
  })),

  'POST /api/assistants/batch-delete': mockHandler((body) => {
    const ids = body?.ids || []
    mockAssistants = mockAssistants.filter((a) => !ids.includes(a.id))
    return { success: true, deleted: ids.length }
  }),

  'POST /api/assistants/import': mockHandler(() => {
    const imported = [
      { id: uid(), studentId: '2021006', name: '周八', hourlyRate: '12.00', position: '课程助理', status: '在岗', phone: '13800138006' },
      { id: uid(), studentId: '2021007', name: '吴九', hourlyRate: '15.00', position: '图书助理', status: '在岗', phone: '13800138007' },
    ]
    mockAssistants.push(...imported)
    return { success: true, count: 2 }
  }),

  // -- Work Hours --
  'GET /api/work-hours': mockHandler((query) => {
    const month = query?.month || '2026-05'
    return mockWorkHours[month] || []
  }),

  'GET /api/work-hours/:studentId': mockHandler((studentId, query) => {
    const month = query?.month || '2026-05'
    const list = mockWorkHours[month] || []
    const found = list.find((s) => s.studentId === studentId)
    return found || { studentId, name: '', totalHours: 0, workDays: 0, daily: [] }
  }),

  // -- Approvals --
  'GET /api/approvals': mockHandler((query) => {
    const status = query?.status || 'pending'
    if (status === 'all') return [...mockApprovals]
    return mockApprovals.filter((a) => a.status === status)
  }),

  'POST /api/approvals/:id/approve': mockHandler((id) => {
    const item = mockApprovals.find((a) => a.id === id)
    if (item) item.status = 'approved'
    return { success: true }
  }),

  'POST /api/approvals/:id/reject': mockHandler((id, body) => {
    const item = mockApprovals.find((a) => a.id === id)
    if (item) { item.status = 'rejected'; item.rejectReason = body?.reason || '' }
    return { success: true }
  }),

  // ============ Teacher Routes ============

  'GET /api/teacher/assistants': mockHandler(() => [...mockAssistants]),

  'GET /api/teacher/work-hours': mockHandler((query) => {
    const month = query?.month || '2026-05'
    return mockWorkHours[month] || []
  }),

  'GET /api/teacher/work-hours/:studentId': mockHandler((studentId, query) => {
    const month = query?.month || '2026-05'
    const list = mockWorkHours[month] || []
    const found = list.find((s) => s.studentId === studentId)
    return found || { studentId, name: '', totalHours: 0, workDays: 0, daily: [] }
  }),

  'GET /api/teacher/approvals': mockHandler((query) => {
    const status = query?.status || 'pending'
    if (status === 'all') return [...mockApprovals]
    return mockApprovals.filter((a) => a.status === status)
  }),

  'POST /api/teacher/approvals/:id/approve': mockHandler((id) => {
    const item = mockApprovals.find((a) => a.id === id)
    if (item) item.status = 'approved'
    return { success: true }
  }),

  'POST /api/teacher/approvals/:id/reject': mockHandler((id, body) => {
    const item = mockApprovals.find((a) => a.id === id)
    if (item) { item.status = 'rejected'; item.rejectReason = body?.reason || '' }
    return { success: true }
  }),

  'GET /api/teacher/schedules': mockHandler((query) => {
    const month = query?.month || '2026-05'
    return mockSchedules.filter((s) => s.date.startsWith(month))
  }),

  'POST /api/teacher/schedules': mockHandler((body) => {
    const item = { id: uid(), ...body }
    mockSchedules.push(item)
    return item
  }),

  'PUT /api/teacher/schedules/:id': mockHandler((id, body) => {
    const idx = mockSchedules.findIndex((s) => s.id === id)
    if (idx !== -1) Object.assign(mockSchedules[idx], body)
    return mockSchedules[idx]
  }),

  'DELETE /api/teacher/schedules/:id': mockHandler((id) => {
    mockSchedules = mockSchedules.filter((s) => s.id !== id)
    return { success: true }
  }),

  // ============ Student Routes ============

  'GET /api/student/profile': mockHandler(() => {
    const sid = '2021001' // hardcoded for mock student
    const a = mockAssistants.find((x) => x.studentId === sid)
    return a || { studentId: sid, name: '', position: '', hourlyRate: '', status: '', phone: '', joinDate: '' }
  }),

  'GET /api/student/work-hours': mockHandler((query) => {
    const sid = '2021001'
    const month = query?.month || '2026-05'
    const list = mockWorkHours[month] || []
    const found = list.find((s) => s.studentId === sid)
    return found || { studentId: sid, name: '', totalHours: 0, workDays: 0, daily: [] }
  }),

  'GET /api/student/approvals': mockHandler(() => {
    return mockApprovals.filter((a) => a.studentId === '2021001')
  }),

  'POST /api/student/approvals': mockHandler((body) => {
    const item = {
      id: uid(),
      applicant: '张三',
      studentId: '2021001',
      applyDate: new Date().toISOString().slice(0, 10),
      cardDate: body.cardDate,
      reason: body.reason,
      status: 'pending',
    }
    mockApprovals.push(item)
    return item
  }),

  'GET /api/student/clock-status': mockHandler(() => {
    const state = mockClockState['2021001'] || { clockedIn: false, todayRecords: [] }
    // Update running hours
    if (state.clockedIn && state.todayRecords.length > 0) {
      const last = state.todayRecords[state.todayRecords.length - 1]
      if (last && last.checkOut === null) {
        last.hours = Math.round((Date.now() - new Date(last.checkIn).getTime()) / 3600000 * 10) / 10
      }
    }
    return { ...state, date: new Date().toISOString().slice(0, 10) }
  }),

  'POST /api/student/clock-in': mockHandler(() => {
    const now = new Date().toISOString()
    mockClockState['2021001'] = {
      clockedIn: true,
      lastCheckIn: now,
      lastCheckOut: null,
      todayRecords: [...(mockClockState['2021001']?.todayRecords || []), { checkIn: now, checkOut: null, hours: 0 }],
    }
    return { success: true, checkInTime: now }
  }),

  'POST /api/student/clock-out': mockHandler(() => {
    const now = new Date().toISOString()
    const state = mockClockState['2021001']
    if (state && state.clockedIn) {
      state.clockedIn = false
      state.lastCheckOut = now
      const last = state.todayRecords[state.todayRecords.length - 1]
      if (last && last.checkOut === null) {
        last.checkOut = now
        last.hours = Math.round((new Date(now).getTime() - new Date(last.checkIn).getTime()) / 3600000 * 10) / 10
      }
    }
    return { success: true, checkOutTime: now }
  }),
}

/* ========== Mock Router ========== */

function stripQuery(str) {
  const idx = str.indexOf('?')
  return idx === -1 ? str : str.slice(0, idx)
}

function extractQuery(str) {
  const idx = str.indexOf('?')
  if (idx === -1) return undefined
  const params = {}
  for (const pair of str.slice(idx + 1).split('&')) {
    const [k, v] = pair.split('=')
    params[decodeURIComponent(k)] = decodeURIComponent(v || '')
  }
  return params
}

async function mockRequest(path, options = {}) {
  const method = options.method || 'GET'
  const body = options.body ? JSON.parse(options.body) : undefined
  const query = extractQuery(path)

  // Exact match (strip query for key lookup)
  const plainPath = stripQuery(path)
  if (mockRoutes[plainPath]) {
    // Extract :param values from body or the clean path, pass before body
    const routeParts = plainPath.split('/')
    const cleanPath = stripQuery(path.replace(/^[A-Z]+ /, ''))
    const pathParts = cleanPath.split('/')
    const params = []
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) params.push(pathParts[i] || (body && body[routeParts[i].slice(1)]))
    }
    const args = [...params, body || query || undefined].filter(v => v !== undefined)
    return mockRoutes[plainPath](...args)
  }

  // Pattern match with :id
  for (const [routeKey, handler] of Object.entries(mockRoutes)) {
    const spaceIdx = routeKey.indexOf(' ')
    const routeMethod = routeKey.slice(0, spaceIdx)
    const routePath = routeKey.slice(spaceIdx + 1)
    if (routeMethod !== method) continue

    const routeParts = routePath.split('/')
    const cleanPath = stripQuery(plainPath.replace(/^[A-Z]+ /, ''))
    const pathParts = cleanPath.split('/')
    if (routeParts.length !== pathParts.length) continue

    const params = []
    let match = true
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        params.push(pathParts[i])
      } else if (routeParts[i] !== pathParts[i]) {
        match = false
        break
      }
    }
    if (match) {
      // Pass params, then body OR query (whichever is present)
      return handler(...params, body || query || undefined)
    }
  }

  throw new Error(`Mock route not found: ${method} ${plainPath}`)
}

export const requestMock = USE_MOCK ? mockRequest : request
