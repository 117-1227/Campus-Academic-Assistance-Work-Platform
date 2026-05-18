# 校内学助工作平台 — 后台管理端

© 版权归青穹团队所有

---

## 项目简介

校内学生助理工作平台的后台管理系统，面向管理员提供学助信息管理、批量导入、打卡通知、在班看板、工时统计等功能。前端为 React 18 单页应用，后端为独立部署的 Node.js API 服务，数据格式统一为 JSON。

---

## 一、技术栈与依赖

### 运行时

| 依赖 | 版本 | 用途 |
|------|------|------|
| react | ^18.3.1 | UI 框架 |
| react-dom | ^18.3.1 | DOM 渲染 |
| xlsx | ^0.18.5 | Excel/CSV 前端解析（SheetJS，批量导入时使用） |

### 开发依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| vite | ^6.0.5 | 构建工具，开发服务器 |
| @vitejs/plugin-react | ^4.3.4 | Vite React 插件（JSX 转换 + HMR） |
| tailwindcss | ^3.4.17 | 原子化 CSS 框架 |
| postcss | ^8.4.49 | CSS 后处理 |
| autoprefixer | ^10.4.20 | 自动添加浏览器前缀 |

### 环境要求

| 依赖 | 最低版本 |
|------|----------|
| Node.js | >= 18 |
| npm | >= 9 |

---

## 二、快速开始

### 安装

```bash
cd CampusAide
npm install
```

### 启动开发服务器

```bash
npm run dev
```

浏览器访问 `http://localhost:5173`（Vite 默认端口）。

### 生产构建

```bash
npm run build          # 输出到 dist/
npm run preview        # 本地预览构建产物
```

---

## 三、项目结构

```
CampusAide/
├── index.html                       # HTML 入口
├── package.json                     # 依赖与脚本
├── vite.config.js                   # Vite 配置 + 开发代理
├── tailwind.config.js               # TailwindCSS 配置
├── postcss.config.js                # PostCSS 配置
├── src/
│   ├── main.jsx                     # 应用入口（ErrorBoundary + 全局异常拦截 + console.error 劫持）
│   ├── App.jsx                      # 根组件（登录态路由 + JWT 过期检测 + 401 回调 + 登出）
│   ├── index.css                    # 全局样式 + 8pt 设计 Token
│   │
│   ├── utils/
│   │   ├── api.js                   # HTTP 请求封装（自动附加 Bearer Token、401 拦截登出、请求/响应日志）
│   │   ├── config.js                # 运行时配置系统（localStorage 持久化、远程/本地服务器一键切换）
│   │   ├── logger.js                # 调试日志工具（带模块命名空间、时间戳、控制台彩色输出）
│   │   └── debugLog.js              # 统一错误收集器（内存环形缓冲、复制/下载、全局暴露）
│   │
│   ├── components/
│   │   ├── AdminShell.jsx           # 后台布局壳（侧栏导航 + 用户信息 + 服务器设置入口 + 退出确认）
│   │   ├── Modal.jsx                # 通用弹窗组件（支持标准/宽屏尺寸）
│   │   ├── Table.jsx                # 通用表格组件（支持多选、行点击展开）
│   │   ├── SettingsModal.jsx        # 服务器设置弹窗（远程/本地一键切换、即时生效）
│   │   └── DebugPanel.jsx           # 错误日志面板（浮标入口、侧边栏展示、一键复制全部错误）
│   │
│   └── pages/
│       ├── Login.jsx                # 管理员登录页
│       ├── Assistants.jsx           # 学助管理（CRUD / 批量导入 / 打卡通知 / 时间日志 / 重置密码 / 同步账户）
│       ├── WorkHours.jsx            # 工时查看（月度报表 + 单人汇总 + 每日打卡明细）
│       └── OnlineBoard.jsx          # 在班看板（实时在岗快照 + 五种状态区分 + 自动刷新）
│
└── dist/                            # 生产构建输出目录
```

> `Approvals.jsx` 文件保留但未挂载（对应后端审批接口当前未实现）。

---

## 四、功能模块

### 4.1 学助管理（Assistants）

| 功能 | 说明 |
|------|------|
| 学助列表 | 分页查询，支持按学号/姓名搜索、按上/下班状态过滤 |
| 添加学助 | 表单验证（学号 8-12 位、姓名 2-50 字符、手机号 11 位中国号码） |
| 编辑学助 | 支持修改姓名/手机/岗位等级/状态/备注，学号不可改 |
| 删除学助 | 单个删除 + 批量勾选删除，均有确认提示 |
| 批量导入 | 支持 CSV/Excel (.csv/.xlsx/.xls)，前端 xlsx 库解析列名自动映射，JSON 发往 `/api/assistants/import`（upsert 模式） |
| 重置密码 | 自动重置为学号后六位，强制下次修改 |
| 打卡通知 | 管理员向学助发送上班/下班打卡请求（`POST /api/admin/assistants/:id/shift-notice`），可查询通知响应状态 |
| 时间日志 | 查看/新增学助工时日志（日期 + 工时 + 备注） |
| 同步账户 | 调用 `/api/admin/sync-accounts` 清理孤立 Account 记录 |
| 自动刷新 | 每 5 秒轮询列表和统计数据，可开关 |

### 4.2 在班看板（OnlineBoard）

| 功能 | 说明 |
|------|------|
| 实时快照 | 调用 `/api/admin/attendance/online` 获取当前在班会话 |
| 统计卡片 | 当前在班 / 待确认 / 上午班 / 下午班 四张卡片 |
| 状态区分 | 进行中（绿脉冲）/ 待确认（琥珀脉冲）/ 已下班（灰）/ 系统收口（橙）/ 已纠正（蓝） |
| 自动刷新 | 每 30 秒轮询，可开关 |

### 4.3 工时查看（WorkHours）

| 功能 | 说明 |
|------|------|
| 月度报表 | 按月查询全员工时 + 估算薪资，顶部统计卡 |
| 单人汇总 | 点击行展开每日打卡明细（班次/签到/签退/工时/状态） |
| 异常标记 | 含异常日期标橙色标签 |

### 4.4 全局能力

| 功能 | 说明 |
|------|------|
| 服务器切换 | 侧边栏"系统设置" → 远程/本地一键切换，无需重启 |
| 错误日志 | 右下角浮标显示错误数量，点击打开面板，可一键复制全部错误 |
| 登出确认 | 退出登录弹确认框，调 `/api/admin/logout` 通知服务端撤销 session |
| Token 管理 | JWT 过期自动弹提示，401 响应自动登出 |

---

## 五、API 对接

### 5.1 运行时服务器切换

无需修改 `vite.config.js`。在界面侧边栏点击 **系统设置**，选择远程或本地服务器，保存后立即生效。

- **远程服务器**：默认 `http://192.168.10.100:3000`（后端在别人机器）
- **本地服务器**：默认 `http://localhost:3000`（后端在自己机器）
- **留空**：开发模式走 Vite 代理，生产模式走同源

### 5.2 已对接的 API 端点

**管理员认证：**

| 方法 | 路径 | 使用位置 |
|------|------|----------|
| POST | `/api/admin/login` | Login.jsx |
| POST | `/api/admin/logout` | App.jsx（退出时） |
| GET | `/api/admin/profile` | 暂未调用 |

**学助管理：**

| 方法 | 路径 | 使用位置 |
|------|------|----------|
| GET | `/api/assistants` | Assistants.jsx（列表） |
| GET | `/api/assistants/:id` | 暂未调用 |
| GET | `/api/assistants/stats` | Assistants.jsx（统计） |
| POST | `/api/assistants` | Assistants.jsx（添加） |
| PUT | `/api/assistants/:id` | Assistants.jsx（编辑） |
| DELETE | `/api/assistants/:id` | Assistants.jsx（删除） |
| POST | `/api/assistants/:id/reset-password` | Assistants.jsx（重置密码） |
| POST | `/api/assistants/import` | Assistants.jsx（批量导入） |

**时间日志：**

| 方法 | 路径 | 使用位置 |
|------|------|----------|
| GET | `/api/assistants/:assistantId/timelogs` | Assistants.jsx（日志列表） |
| POST | `/api/assistants/:assistantId/timelogs` | Assistants.jsx（新增日志） |

**管理端考勤：**

| 方法 | 路径 | 使用位置 |
|------|------|----------|
| GET | `/api/admin/attendance/online` | OnlineBoard.jsx |
| GET | `/api/admin/attendance/report` | WorkHours.jsx（工时报表） |
| GET | `/api/admin/attendance/assistants/:id/summary` | WorkHours.jsx（单人汇总） |

**打卡通知：**

| 方法 | 路径 | 使用位置 |
|------|------|----------|
| POST | `/api/admin/assistants/:id/shift-notice` | Assistants.jsx（发送通知） |
| GET | `/api/admin/assistants/:id/shift-notice` | Assistants.jsx（查询状态） |

**运维：**

| 方法 | 路径 | 使用位置 |
|------|------|----------|
| POST | `/api/admin/sync-accounts` | Assistants.jsx |

### 5.3 鉴权

所有受保护接口统一携带 `Authorization: Bearer <admin_token>`，由 `api.js` 自动从 localStorage 读取并附加。Token 过期后自动跳回登录页。

---

## 六、调试与运维

### 开启调试日志

浏览器控制台执行：`localStorage.setItem("debug", "1")` 后刷新页面。

开启后所有 API 请求/响应会以彩色格式输出到控制台，包含方法、URL、耗时、状态码。

### 错误日志面板

页面右下角浮标显示当前错误数量，点击打开侧边面板。面板内展示所有 warn/error 级别日志（含时间、模块、消息、堆栈）。点击 **复制全部** 可一键复制粘贴反馈。

后端返回 401 时自动清除本地 token 并跳转登录页。

### 错误收集覆盖

| 层级 | 方式 |
|------|------|
| HTTP 错误 | api.js 中 `request()` 自动捕获 |
| 全局异常 | `window.onerror` + `unhandledrejection` |
| 第三方库 | `console.error` 劫持 |
| React 渲染 | ErrorBoundary 组件兜底 |

---

## 七、注意事项

- 批量导入 Excel 时前端解析后以 JSON 发往 `/api/assistants/import`（upsert 模式），不依赖后端 `/import-file` 路由
- 列名自动映射：`学号→studentId`、`姓名→name`、`手机号→phone`、`岗位等级→positionLevel`
- 学号格式要求 **10 位数字**（以后端验证规则为准）
- `PUT /api/assistants/:id` 中 `studentId` 不可修改，前端编辑时自动排除
- 时间日志字段为 `remark`（非 `notes`），对齐后端接口规范
- Token 过期由两部分保障：前端每 30 秒检查 JWT `exp` + 后端 401 响应触发登出
- 打卡通知推荐使用 `POST /api/admin/assistants/:id/shift-notice`，直接修改 `isOnShift` 的 `/status` 接口已标记为不推荐
- 生产构建时不走 Vite 代理，务必在系统设置中配置正确的服务器地址
