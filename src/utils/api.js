// ---- Real API (USE_MOCK=false 时生效) ----

async function request(path, options = {}) {
  let url = path.replace(/^[A-Z]+ /, '')

  if (options.body && typeof options.body === 'string') {
    try {
      const bodyObj = JSON.parse(options.body)
      url = url.replace(/:(\w+)/g, (_, key) => bodyObj[key] ?? `:${key}`)
    } catch { /* not JSON */ }
  }

  const headers = { 'Content-Type': 'application/json' }

  try {
    const token = localStorage.getItem('token')
    if (token) headers['Authorization'] = `Bearer ${token}`
  } catch { /* localStorage unavailable */ }

  const isFormData = options.body instanceof FormData
  if (isFormData) delete headers['Content-Type']

  const config = { ...options, headers: { ...headers, ...(options.headers || {}) } }
  const res = await fetch(url, config)

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data.message || `请求失败 (${res.status})`
    const detail = data.errors?.length ? ': ' + data.errors.join('; ') : ''
    throw new Error(msg + detail)
  }
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && Array.isArray(data.data)) {
    return data.data
  }
  return data
}

// ---- Mock layer ----

const USE_MOCK = false 

/* ===== Mock Data ===== */

let mockAssistants = [
  { id: '1', studentId: '2021001', name: '张三', positionLevel: '一级岗', position: '图书助理', status: 'active', isOnDuty: true, phone: '13800138001', createdAt: '2026-03-01T08:00:00Z' },
  { id: '2', studentId: '2021002', name: '李四', positionLevel: '二级岗', position: '实验助理', status: 'active', isOnDuty: true, phone: '13800138002', createdAt: '2026-03-01T08:00:00Z' },
  { id: '3', studentId: '2021003', name: '王五', positionLevel: '一级岗', position: '活动助理', status: 'inactive', isOnDuty: false, phone: '13800138003', createdAt: '2026-02-15T08:00:00Z' },
  { id: '4', studentId: '2021004', name: '赵六', positionLevel: '二级岗', position: '课程助理', status: 'active', isOnDuty: false, phone: '13800138004', createdAt: '2026-03-01T08:00:00Z' },
  { id: '5', studentId: '2021005', name: '孙七', positionLevel: '一级岗', position: '教务助理', status: 'active', isOnDuty: true, phone: '13800138005', createdAt: '2026-04-01T08:00:00Z' },
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

function mockHandler(fn) {
  return (...args) =>
    new Promise((resolve, reject) =>
      setTimeout(() => {
        try { resolve(fn(...args)) } catch (e) { reject(e) }
      }, 300)
    )
}

/* ===== Mock Routes ===== */

const mockRoutes = {
  // Auth
  'POST /api/admin/login': mockHandler((body) => {
    if (!body || !body.username || !body.password) {
      throw new Error('用户名和密码为必填项')
    }
    if (body.username === 'admin' && body.password === '123456') {
      return {
        status: 'success',
        id: 'mock-admin-001',
        username: 'admin',
        role: 'admin',
        token: 'mock-jwt-token-admin-2026',
      }
    }
    throw new Error('用户名或密码无效')
  }),

  'GET /api/admin/profile': mockHandler(() => ({
    status: 'success', id: 'mock-admin-001', username: 'admin', role: 'admin',
  })),

  // Assistants
  'GET /api/assistants': mockHandler((query) => {
    let list = [...mockAssistants]
    if (query?.search) {
      const q = query.search.toLowerCase()
      list = list.filter((a) => (a.studentId||'').toLowerCase().includes(q) || (a.name||'').toLowerCase().includes(q) || (a.phone||'').includes(q))
    }
    if (query?.status === 'active') list = list.filter((a) => a.status === 'active')
    if (query?.status === 'inactive') list = list.filter((a) => a.status === 'inactive')
    const page = parseInt(query?.page) || 1
    const limit = parseInt(query?.limit) || 10
    const total = list.length
    const start = (page - 1) * limit
    const paged = list.slice(start, start + limit)
    return { data: paged, total, page, limit }
  }),

  'POST /api/assistants': mockHandler((body) => {
    if (mockAssistants.some((a) => a.studentId === body.studentId)) {
      throw new Error('学号已存在')
    }
    const newOne = {
      id: uid(), studentId: body.studentId, name: body.name,
      phone: body.phone || '', positionLevel: body.positionLevel || '二级岗',
      position: body.positionLevel === '一级岗' ? '教务助理' : '实验助理',
      status: 'active', isOnDuty: false, createdAt: new Date().toISOString(),
    }
    mockAssistants.push(newOne)
    return { status: 'success', data: newOne }
  }),

  'PUT /api/assistants/:id': mockHandler((id, body) => {
    const idx = mockAssistants.findIndex((a) => a.id === id)
    if (idx !== -1) Object.assign(mockAssistants[idx], body)
    return mockAssistants[idx]
  }),

  'DELETE /api/assistants/:id': mockHandler((id) => {
    mockAssistants = mockAssistants.filter((a) => a.id !== id)
    return { success: true }
  }),

  'POST /api/assistants/:id/reset-password': mockHandler(() => ({
    success: true, message: '密码已重置为 123456',
  })),

  'POST /api/assistants/:id/status': mockHandler((id, body) => {
    const item = mockAssistants.find((a) => a.id === id)
    if (item) item.isOnDuty = !!body.isOnDuty
    return item
  }),

  'GET /api/assistants/stats': mockHandler(() => ({
    total: mockAssistants.length,
    active: mockAssistants.filter((a) => a.status === 'active').length,
    inactive: mockAssistants.filter((a) => a.status === 'inactive').length,
    onDuty: mockAssistants.filter((a) => a.isOnDuty).length,
  })),

  'POST /api/assistants/import': mockHandler((body) => {
    const items = body?.data || []
    let created = 0, failed = 0, errors = []
    for (const item of items) {
      if (!item.studentId || !item.name) { failed++; errors.push({ studentId: item.studentId, name: item.name, reason: '缺少必填字段' }); continue }
      if (mockAssistants.some((a) => a.studentId === item.studentId)) { failed++; errors.push({ studentId: item.studentId, name: item.name, reason: '学号已存在' }); continue }
      mockAssistants.push({
        id: uid(), studentId: item.studentId, name: item.name, phone: item.phone || '',
        positionLevel: item.positionLevel || '二级岗', position: item.positionLevel === '一级岗' ? '教务助理' : '实验助理',
        status: 'active', isOnDuty: false, createdAt: new Date().toISOString(),
      })
      created++
    }
    return { summary: { total: items.length, created, updated: 0, skipped: 0, failed, success: created }, errors, message: `导入完成: 成功 ${created} 行，失败 ${failed} 行` }
  }),

  'POST /api/assistants/import-file': mockHandler(() => {
    return { summary: { total: 2, created: 2, updated: 0, skipped: 0, failed: 0, success: 2 }, errors: [], message: '导入完成: 成功 2 行，失败 0 行' }
  }),

  // Work Hours
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

  // Approvals
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
}

/* ===== Mock Router ===== */

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

  const plainPath = stripQuery(path)
  if (mockRoutes[plainPath]) {
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
      return handler(...params, body || query || undefined)
    }
  }

  throw new Error(`Mock route not found: ${method} ${plainPath}`)
}

export const requestMock = USE_MOCK ? mockRequest : request
