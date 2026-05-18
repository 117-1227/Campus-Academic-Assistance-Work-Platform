# 校内学助工作平台 — 后台管理端

© 版权归青穹团队所有

## 项目简介

校内学生助理工作平台的后台管理系统，面向管理员提供学助信息管理、工时统计查看、考勤审批等功能。项目采用前后端分离架构，前端为 React 单页应用，后端为独立部署的 Node.js API 服务。

---

## 一、本地前端（CampusAide）

### 环境要求

| 依赖 | 版本要求 |
|------|----------|
| Node.js | >= 18 |
| npm | >= 9 |

### 首次部署 — 安装依赖

```bash
# 1. 克隆或拷贝项目到本地
cd CampusAide

# 2. 安装前端依赖
npm install
```

> `npm install` 会自动安装以下核心依赖：
> - `react` / `react-dom` — UI 框架（v18）
> - `xlsx` — Excel/CSV 文件前端解析（SheetJS）
> - `vite` — 构建工具（v6）
> - `tailwindcss` / `postcss` / `autoprefixer` — 样式方案

### 启动开发服务器

```bash
npm run dev
```

浏览器访问 `http://localhost:3000`。

### 生产构建

```bash
npm run build          # 输出到 dist/ 目录
npm run preview        # 本地预览构建产物
```

### 项目目录结构

```
CampusAide/
├── index.html
├── package.json
├── vite.config.js              # Vite 配置 + API 代理地址
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.jsx                # 应用入口
│   ├── App.jsx                 # 根组件（登录态路由）
│   ├── index.css               # 全局样式 + 8pt 设计 Token
│   ├── utils/
│   │   └── api.js              # HTTP 请求封装（含 Mock 开关）
│   ├── components/
│   │   ├── AdminShell.jsx      # 后台布局壳（侧栏导航 + 主区域）
│   │   ├── Modal.jsx           # 通用弹窗组件
│   │   └── Table.jsx           # 通用表格组件（支持勾选/点击行）
│   └── pages/
│       ├── Login.jsx           # 管理员登录页
│       ├── Assistants.jsx      # 学助管理（CRUD / 导入 / 上下班 / 同步）
│       ├── WorkHours.jsx       # 工时查看（报表 + 每日打卡明细）
│       └── Approvals.jsx       # 考勤审批（待审 / 已审）
└── public/
```

### 无后端模式（Mock）

前端内置 Mock 数据层，无需后端即可独立运行和调试 UI：

```js
// 打开 src/utils/api.js，修改第 41 行：
const USE_MOCK = true   // true = Mock 模式，false = 对接真实后端
```

Mock 模式默认登录账号：`admin` / `123456`

---

## 二、后端 API 服务（attendance-node）

### 环境要求

| 依赖 | 版本要求 |
|------|----------|
| Node.js | >= 18 |
| npm | >= 9 |
| PostgreSQL | >= 14 |

### 首次部署 — 安装依赖

```bash
# 进入后端项目目录
cd attendance-node

# 安装后端依赖
npm install
```

> `npm install` 会自动安装以下核心依赖：
> - `express` — Web 框架
> - `jsonwebtoken` — JWT 鉴权
> - `multer` — 文件上传中间件
> - `xlsx` — Excel 文件解析
> - `pg` / `sequelize` — PostgreSQL 数据库驱动/ORM

### 环境变量配置

在 `attendance-node` 根目录创建 `.env` 文件：

```bash
DATABASE_URL=postgresql://用户名:密码@localhost:5432/attendance
JWT_SECRET=自行设定的密钥字符串
JWT_EXPIRES_IN=168h
PORT=3000
```

### 启动后端服务

```bash
# 开发模式（nodemon 热重载）
npm run dev

# 生产模式
npm start
```

后端启动后监听 `http://localhost:3000`。

### 后端目录结构

```
attendance-node/
├── src/
│   ├── app.js                  # Express 应用入口
│   ├── routes/
│   │   └── assistantRoutes.js  # 学助管理路由
│   ├── controllers/
│   │   └── assistantController.js  # 业务逻辑
│   ├── common/
│   │   └── utils/
│   │       ├── validators.js   # 字段校验
│   │       └── excelParser.js  # Excel/CSV 解析
│   └── scripts/
│       └── syncOrphanAccounts.js  # 孤立账户清理脚本
└── .env                        # 环境变量（需自行创建）
```

---

## 三、前后端对接

### 配置代理地址

前端开发服务器通过 Vite 代理将 `/api` 请求转发到后端。修改 `vite.config.js`：

```js
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://192.168.10.100:3000',  // ← 改为你的后端地址
      changeOrigin: true,
    },
  },
},
```

- 后端和前端在同一台机器：target 填 `http://localhost:3000`
- 后端在另一台机器：target 填 `http://<后端IP>:3000`

### 切换真实后端

确认后端已启动且代理地址正确后：

```js
// src/utils/api.js
const USE_MOCK = false  // ← 切换为真实后端模式
```

刷新页面，用后端配置的管理员账号密码登录即可。

---

## 四、完整 API 接口清单

前端对接的后端接口如下，确保后端均已实现：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/admin/login` | 管理员登录 |
| GET | `/api/admin/profile` | 获取管理员信息 |
| GET | `/api/assistants` | 学助列表（支持搜索/分页） |
| POST | `/api/assistants` | 添加学助 |
| PUT | `/api/assistants/:id` | 更新学助信息 |
| DELETE | `/api/assistants/:id` | 删除学助 |
| POST | `/api/assistants/:id/reset-password` | 重置学助密码（自动取学号后六位） |
| POST | `/api/assistants/:id/status` | 设置上下班状态（`isOnShift`） |
| POST | `/api/assistants/import` | JSON 批量导入学助 |
| GET | `/api/assistants/stats` | 学助统计数据 |
| POST | `/api/admin/sync-accounts` | 同步清理孤立账户 |
| GET | `/api/admin/attendance/report` | 全员工时报表 |
| GET | `/api/admin/attendance/assistants/:id/summary` | 单个学助工时汇总 |

---

## 五、功能模块

| 模块 | 功能说明 |
|------|----------|
| 学助管理 | 添加/编辑/删除学助；Excel 批量导入（前端解析）；上下班状态切换；数据同步到账户表 |
| 工时查看 | 按月查看全员工时 + 预估薪资；点击行展开每日打卡明细（班次/签到/签退/工时/状态） |
| 考勤审批 | 待审批/已审批列表切换；审批通过/驳回操作 |

---

## 六、新电脑快速部署一览

```bash
# ---- 1. 前端 ----
cd CampusAide
npm install
# 修改 vite.config.js 中的 proxy.target 指向实际后端地址
# 确认 src/utils/api.js 中 USE_MOCK = false
npm run dev

# ---- 2. 后端（如需要） ----
cd attendance-node
npm install
# 创建 .env 文件，配置 DATABASE_URL / JWT_SECRET / PORT
npm run dev
```

---

## 七、注意事项

- 批量导入 Excel 文件时，前端解析后以 JSON 发送到 `POST /api/assistants/import`，不再依赖后端 `/import-file` 路由
- 列名自动映射：`学号→studentId`、`姓名→name`、`手机号→phone`、`岗位等级→positionLevel`
- 学号格式要求 **10 位数字**（以后端验证规则为准）
- `PUT /api/assistants/:id` 中 `studentId` 不可修改
- Token 过期时间由后端 `JWT_EXPIRES_IN` 决定，过期后需重新登录
