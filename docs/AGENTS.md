# AGENTS.md — LotteryTogether

> 每次开始新 Phase 前，必须重新阅读 `设计方案.md` 和本文件。

---

## 技术栈（已确认）

| 层级 | 选型 |
|------|------|
| 前端 | Vue 3.4+ / TypeScript / Vite |
| CSS | UnoCSS（原子化，`data-theme` 切换黑白主题） |
| 状态管理 | Pinia |
| 动画 | GSAP + Canvas/WebGL |
| 后端 | NestJS / TypeScript |
| 数据库 | SQLite + Redis |
| 实时通信 | WebSocket |
| 部署 | Nginx + 一键部署脚本 |

---

## 项目结构（规划）

```
LotteryTogether/
├── packages/
│   ├── client/          # Vue 3 前端（Vite）
│   └── server/          # NestJS 后端
├── docs/
│   ├── API.md
│   └── Specification.md
├── AGENTS.md
├── README.md
└── 设计方案.md
```

---

## 强制规则

1. **Phase 必须按顺序执行**：每个 Phase 完成（含测试通过）后才能进入下一个 Phase。禁止并行或跳 Phase。
2. **Todolist 只能引用 AGENTS.md**：`todowrite` 里的任务描述必须逐字摘抄自下方 Phase 任务列表，不允许自行编造或拆分任务。
3. **切换 Phase 前必须重新阅读**：`设计方案.md` 和 `AGENTS.md`，确保上下文不丢失。
4. **UI 组件必须同时实现桌面端/平板端/移动端三种布局**（断点：≥1024px / 768-1023px / <768px），否则视为未完成。
5. **每一个复杂交互控件必须附带 Tooltip**，内容参照设计方案中的 `[Tooltip]` 描述。
6. **黑白双主题必须同步实现**，不允许先做一个主题再补另一个。
7. **前后端类型共享**：共享类型定义放置在 `packages/shared/` 目录，前后端通过 workspace 引用，禁止各自重复定义。

---

## 开发 Phase 清单

### Phase 1：项目脚手架与基础设施

- [ ] 初始化 monorepo（pnpm workspace），创建 `packages/client`、`packages/server`、`packages/shared` 三个包
- [ ] client：Vite + Vue 3 + TypeScript + UnoCSS 项目初始化，配置 `data-theme` CSS Variables 主题系统
- [ ] client：配置路由（vue-router）、状态管理（Pinia）、路径别名
- [ ] client：创建全局布局组件（桌面左侧侧边栏 / 平板顶部汉堡菜单 / 移动端底部 Tab 导航）
- [ ] client：实现主题切换按钮与 `data-theme` 切换逻辑，支持 `prefers-color-scheme` 自动跟随
- [ ] server：NestJS 项目初始化，连接 SQLite 和 Redis，配置环境变量
- [ ] server：配置 TypeORM 或 Prisma，创建基础数据库迁移脚本
- [ ] shared：定义通用 TypeScript 类型（用户、活动、奖品基础类型）
- [ ] 配置 ESLint + Prettier +  lint-staged，前后端统一
- [ ] 编写 README.md（中英文双语，中文在前，每个语言单独章节，支持跳转 API.md 和 Specification.md）

### Phase 2：用户认证与账户系统

- [ ] server：用户模块 — 注册（邮箱/手机）、登录、JWT 签发与验证、刷新Token
- [ ] server：用户资料 CRUD、头像上传
- [ ] client：注册/登录页面（含表单校验、人机验证占位）
- [ ] client：个人中心页面 — 用户卡片、信息编辑、通知偏好设置
- [ ] client：认证中间件（路由守卫、Token 自动刷新、401 拦截跳转）

### Phase 3：核心数据模型与 CRUD API

- [ ] server：活动模型 — 名称、描述、封面、时间、模式（转盘/盲盒/纸条）、状态机
- [ ] server：奖品模型 — 名称、类型（实物/虚拟/积分/空奖）、库存、权重、图片
- [ ] server：抽奖记录模型 — 用户、活动、奖品、时间、状态（待领奖/已发货/已领取）
- [ ] server：所有模型完成数据库迁移并编写 seed 脚本
- [ ] shared：同步前后端共享类型定义
- [ ] client：API 层封装（axios 实例、拦截器、错误处理）

### Phase 4：管理端（B端）— 仪表盘与活动管理

- [ ] client：管理端路由与布局（独立于C端的侧边栏导航）
- [ ] client：仪表盘页面 — KPI 卡片（总活动数、参与人次、中奖率）、实时图表（折线图+饼图）
- [ ] client：活动创建分步向导 — Step 1 基础信息（名称、描述富文本、时间设置）
- [ ] client：活动创建分步向导 — Step 2 抽奖模式与概率规则（模式选择切换动态表单、权重配置、抽奖次数限制）
- [ ] client：活动创建分步向导 — Step 3 风控与安全（参与限制、人机验证配置、频率控制阈值）
- [ ] client：活动创建分步向导 — Step 4 奖品与发放（奖品池管理、库存、发货管理、数据导出）
- [ ] client：活动列表页 — 筛选、搜索、编辑、删除、状态切换
- [ ] client：纸条抽奖专属管理面板（纸条审核队列、开奖控制台、协同数据展示）
- [ ] server：活动 CRUD API、奖品 CRUD API、活动状态管理
- [ ] server：风控配置 API、数据导出 API（后台任务）

### 特殊Phase4.2：系统管理员部分

#### 用户管理模块
- [ ] client：用户列表页面 — 列表展示（用户名、邮箱、注册时间、状态）、筛选（按状态、时间）、搜索（用户名/邮箱）、封禁/解封操作
- [ ] client：封禁操作弹窗 — 表单包含封禁理由输入、IP黑名单开关、封禁天数输入（-1为永久）、全站通告开关
- [ ] client：删除操作弹窗 — 必须输入删除理由、选择是否同时封禁IP及天数、是否全站通告
- [ ] client：IP黑名单管理页面 — 列表展示（IP、封禁原因、封禁时间、解封时间/永久）、手动解封操作
- [ ] server：用户列表查询API（支持筛选、分页、搜索）
- [ ] server：用户封禁/解封API — 包含IP黑名单记录、封禁日志、全站通告推送
- [ ] server：用户删除API — 记录删除理由、可选执行IP封禁、可选触发全站通告
- [ ] server：IP黑名单管理API — 增删改查、封禁有效期校验、访问拦截中间件

#### 公告管理模块
- [ ] client：公告列表页面 — 列表展示（标题、创建时间、状态、置顶标识）、拖拽排序功能、增删改查操作
- [ ] client：公告编辑器页面 — 集成工具栏+MD编辑器、表单字段（标题、内容、是否强制阅读、是否显示不再提示、是否置顶）
- [ ] client：公告排序调整界面 — 可视化拖拽排序、实时保存顺序
- [ ] server：公告CRUD API — 支持创建、编辑、删除、查询
- [ ] server：公告排序API — 更新公告显示顺序、持久化排序数据
- [ ] server：公告状态管理API — 支持强制阅读开关、不再提示按钮控制、置顶状态切换
- [ ] server：公告推送与读取API — 用户端公告拉取、已读状态记录、强制公告拦截逻辑


### Phase 5：用户端（C端）— 落地页与活动浏览

- [ ] client：首页 — Hero 区域（标题+副标题+CTA）、热门活动网格卡片、新手指南折叠面板
- [ ] client：搜索框（模糊匹配、历史记录清除）+ 标签过滤器（按模式/状态多选筛选）
- [ ] client：活动卡片组件（封面、标题、剩余奖品、参与人数、进度条、Hover 详情）
- [ ] client：活动详情页（展示规则、奖品列表、参与条件）
- [ ] client：底部版权与合规声明
- [ ] client：移动端 — 底部 Tab 导航（首页/发现/我的）适配
- [ ] server：活动搜索与筛选 API（全文搜索、分页、缓存）

### Phase 6：抽奖执行页（核心玩法）

- [ ] client：转盘抽奖 — Canvas 转盘绘制（直径 400px，扇区映射奖品）、GSAP 物理惯性旋转动画、旋转按钮冷却期逻辑
- [ ] client：转盘抽奖 — 右侧控制面板（参与次数、规则摘要、分享按钮）、底部开奖日志
- [ ] client：转盘抽奖 — 概率公示弹窗（权重展示、历史中奖分布图）
- [ ] client：盲盒抽奖 — 3×3/4×4 矩阵网格、翻转+粒子动画、连开动画、图鉴系统
- [ ] client：盲盒抽奖 — 掉落预告（保底计数、下一发必出高亮提示）
- [ ] client：纸条抽奖 — 虚拟纸箱（3D 透视容器）、纸条输入区（200 字限、敏感词拦截）、投递动画
- [ ] client：纸条抽奖 — 纸条墙展示、实时广播面板（已入箱数量、抽取进度、中奖内容脱敏）
- [ ] server：抽奖核心逻辑 — 概率计算（固定/动态权重/保底/防重复）、并发锁（Redis 分布式锁）
- [ ] server：抽奖次数管理 — 每日上限/总上限扣减、分享加成逻辑
- [ ] server：抽奖记录写入、库存原子扣减
- [ ] server：纸条抽奖 — 纸条提交、审核队列、开奖执行（转盘/随机/时间轴模式）、结果公示

### Phase 7：分享与社交传播

- [ ] client：分享页 — 海报预览（含二维码+活动标题+发起人信息）、社交分享按钮矩阵
- [ ] client：海报生成器（动态二维码嵌入、活动封面、个人头像、长按保存）
- [ ] client：复制短链（Toast 提示 + 来源追踪参数）
- [ ] client：邀请排行榜（TOP10、每日重置、Hover 明细、受邀人列表）
- [ ] server：短链生成与解析 API、渠道追踪与点击统计
- [ ] server：邀请关系记录（每成功邀请1人+1次机会）、防刷验证

### Phase 8：实时通信与协同

- [ ] server：WebSocket 网关 — 连接认证、房间管理、心跳保活
- [ ] server：实时推送 — 参与人数变更、开奖结果广播、纸条入箱通知
- [ ] client：WebSocket 客户端封装（自动重连、状态同步、乐观更新）
- [ ] client：仪表盘实时图表（WebSocket 推送每3秒刷新）
- [ ] client：纸条协同 — 多人实时投递动画、发起人开奖控制台同步

### Phase 9：打磨与优化

- [ ] client：CSS Variables 双主题完善 — 全局组件在黑白主题下的视觉一致性审查
- [ ] client：响应式适配审查 — 桌面/平板/移动端三种布局全覆盖，触摸热区 ≥44×44px
- [ ] client：动画与微交互 — Tooltip 系统（Hover 300ms/长按 500ms）、过渡动画、加载骨架屏
- [ ] client：无障碍 — 所有 Tooltip 绑定 `aria-describedby`、屏幕阅读器支持、键盘导航
- [ ] client：PWA — Service Worker 缓存核心页面、抽奖记录本地持久化、断网可参与
- [ ] client：首屏性能 — 路由懒加载、图片 WebP/AVIF、关键 CSS 内联，LCP ≤1.2s
- [ ] server：接口限流、异常告警（IP聚集、高频请求检测）、操作审计日志

### Phase 10：测试、部署与文档

- [ ] server：单元测试（Jest）— 抽奖概率算法、库存扣减原子性、并发锁
- [ ] server：E2E 测试 — 核心业务流（创建活动→参与抽奖→中奖→发货）
- [ ] client：组件测试（Vitest + Vue Test Utils）— 核心组件覆盖
- [ ] 编写 API.md（中英文双语，一行中文一行英文）
- [ ] 编写 Specification.md（详细开发路径、技术决策说明、中英文双语）
- [ ] 完善 README.md — 补充部署指南、环境变量说明、FAQ
- [ ] 一键部署脚本（Windows + Linux，一键完成完整部署，启动时先选择 中文/英文）
- [ ] CI 流水线配置（lint → typecheck → test → build）