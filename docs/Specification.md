# 开发规范 | Development Specification

> 中英文双语，一行中文一行英文
> Bilingual: one line Chinese, one line English

---

## 开发路径 | Development Path

Phase 1 — 项目脚手架与基础设施 | Project scaffolding & infrastructure
- pnpm workspace monorepo, Vue 3 + Vite + UnoCSS + NestJS + TypeORM + SQLite
- 全局布局（桌面侧边栏/平板汉堡菜单/移动端Tab导航）| Global layout (desktop sidebar / tablet hamburger / mobile tab nav)
- 黑白双主题 CSS Variables | Dark/light theme via CSS Variables
- ESLint + Prettier + lint-staged

Phase 2 — 用户认证与账户系统 | Authentication & account system
- 用户名+密码+邀请码注册 | Username + password + invite code registration
- JWT 签发与验证 | JWT sign/verify
- 注册/登录页面 + 个人中心 | Register/login pages + profile

Phase 3 — 核心数据模型与 CRUD API | Core data models & CRUD API
- Activity / Prize / DrawRecord 实体 | Entities
- 活动状态机（draft→pending→active→paused→ended）| Activity state machine
- 前后端共享类型 | Shared types between frontend/backend

Phase 4 — 管理端（B端）| Admin panel
- 独立管理端布局 | Independent admin layout
- 用户管理（封禁/解封/删除/IP黑名单）| User management (ban/unban/delete/IP blacklist)
- 活动创建分步向导（4步）| 4-step activity creation wizard
- 活动列表页（筛选/搜索/状态切换）| Activity list (filter/search/status)
- 公告管理（CRUD/排序/编辑器/MD）| Announcement management (CRUD/sort/editor/MD)

Phase 5 — 用户端（C端）| User-facing landing page
- Hero 区域 + 活动网格 + 搜索 | Hero + activity grid + search
- 活动卡片组件 + 详情页 | Activity card + detail page
- 底部版权声明 | Footer copyright

Phase 6 — 抽奖执行页（核心玩法）| Lottery execution (core gameplay)
- 转盘抽奖（Canvas + GSAP）| Wheel of fortune (Canvas + GSAP)
- 盲盒抽奖（网格翻转 + 图鉴 + 可配置数量）| Blind box (grid flip + collection + configurable size)
- 纸条抽奖（填空题 + 定时/满人/手动三种开奖）| Paper slip (fill-in question + timed/count/manual draw)
- 加权随机算法 + 事务性库存扣减 | Weighted random + transactional stock decrement

Phase 7 — 分享与社交传播 | Sharing & social
- 分享页（二维码/海报/社交按钮）| Share page (QR/poster/social buttons)
- 短链生成与追踪 | Short link generation & tracking
- 邀请排行榜 | Invite leaderboard

Phase 8 — 实时通信 | Real-time communication
- WebSocket 网关（认证/房间/心跳）| WebSocket gateway (auth/rooms/heartbeat)
- 实时推送（参与人数/开奖/纸条）| Real-time push (participants/draws/slips)

Phase 9 — 打磨与优化 | Polish & optimization
- 主题一致性审查 | Theme consistency review
- 响应式适配审查 | Responsive layout review
- Tooltip + 骨架屏 + 无障碍 | Tooltip + skeleton + a11y
- PWA + 首屏性能 | PWA + initial load performance
- Server 限流 + 审计日志 | Server rate limiting + audit log

Phase 10 — 测试、部署与文档 | Testing, deployment & documentation
- 单元测试 + E2E 测试 + 组件测试 | Unit + E2E + component tests
- API 文档 + 开发规范 | API docs + spec docs
- 一键部署脚本（Windows + Linux）| One-click deploy script (Windows + Linux)
- CI 流水线 | CI pipeline

---

## 技术决策说明 | Technical Decisions

### 为什么选 Vue 3 而非 React？| Why Vue 3 over React?
Vue 3 的组合式 API 与 Pinia 的组合使得状态管理更直观，适合中小型项目快速迭代。Vue 的单文件组件（SFC）更好管理模板、样式、逻辑。

### 为什么选 UnoCSS 而非 Tailwind？| Why UnoCSS over Tailwind?
UnoCSS 按需生成原子化 CSS，零运行时，构建产物体积更小。配合预设（presetUno、presetAttributify）与 Tailwind 兼容且更灵活。

### 为什么选 NestJS？| Why NestJS?
NestJS 提供模块化架构、依赖注入、守卫/拦截器/中间件体系，与 Angular 类似的 DI 模式适合大型项目。TypeScript 原生支持，与前端统一语言。

### 为什么选 TypeORM + SQLite？| Why TypeORM + SQLite?
TypeORM 支持 SQLite、PostgreSQL 等多数据库，迁移脚本成熟。SQLite 零配置、文件级存储，适合中小型项目，生产可切换至 PostgreSQL。

### 为什么选黑白双主题而非多色主题？| Why only dark/light instead of multi-color?
设计方案中明确了极简科技风格，仅使用黑白灰+青绿色。双主题减少设计复杂性，确保视觉一致性。

### 为什么 WebSocket 选 Socket.IO？| Why Socket.IO over raw WebSocket?
Socket.IO 内置自动重连、房间管理、心跳保活、跨浏览器兼容性，减少轮子。

---

## 项目规范 | Project Conventions

- 命名：实体/服务/控制器 PascalCase，方法/变量 camelCase，DTOs PascalCase
- 共享类型：`packages/shared/src/index.ts`，前后端通过 workspace 引用
- 路由：前端 `/path`，后端 `/api/resource`
- 布局：桌面 ≥1024px，平板 768-1023px，移动端 <768px
- 状态管理：Pinia Composition API
- HTTP 请求：axios 实例 + token 拦截器 + 401 自动刷新
- 数据库迁移：`migration:run` / `migration:generate` / `migration:revert`

---

## 环境变量 | Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| NODE_ENV | development | Environment |
| DB_PATH | ./data/lottery.db | SQLite file path |
| REDIS_HOST | 127.0.0.1 | Redis host |
| REDIS_PORT | 6379 | Redis port |
| CORS_ORIGIN | http://localhost:5173 | Allowed CORS origin |
| JWT_SECRET | dev-secret-change-in-production | JWT signing secret |
| JWT_EXPIRES_IN | 7d | Access token expiry |
| JWT_REFRESH_EXPIRES_IN | 30d | Refresh token expiry |
