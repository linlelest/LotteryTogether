# LotteryTogether

一站式抽奖活动平台，支持转盘抽奖、盲盒抽奖、纸条协同抽奖三种核心模式。专为活动运营、品牌营销、社群互动设计，功能完整，可直接商用。

One-stop Lottery Activity Platform, featuring core modes of Wheel Draw, Blind Box Draw, and Collaborative Paper Strip Draw. Designed specifically for event operations, brand marketing, and community interaction, it offers complete functionality and is ready for commercial use.

> **文档导航/Docx Guide** | [API 文档/API Docx](docs/API.md) | [开发规范/Specification](docs/Specification.md) | [设计方案/Plan](docs/设计方案.md) | [Agents 指令/Agents Skill](docs/AGENTS.md)



---

## 目录

- [中文文档](#-chinese)
- [English Docs](#-english)

---

## 🇨🇳 Chinese

### 项目简介

LotteryTogether 是一个功能完整的在线抽奖平台，提供三种核心抽奖模式：

- **转盘抽奖** — Canvas 物理惯性旋转，支持自定义扇区与权重
- **盲盒抽奖** — 3×3/4×4 矩阵网格翻转动画，支持图鉴收集与保底机制
- **纸条抽奖** — 虚拟纸箱多人协同模式，支持填空题、定时/满人/手动开奖

配套完整的管理端用户管理、活动创建向导、风控配置、邀请码管理、公告管理、数据备份，以及用户端的分享传播、参与历史等功能。

### 技术栈

| 层级 | 选型 |
|------|------|
| 前端 | Vue 3.5+ / TypeScript / Vite 8 |
| CSS | UnoCSS（原子化，`data-theme` 切换黑白主题） |
| 状态管理 | Pinia |
| 动画 | GSAP + Canvas/WebGL |
| 后端 | NestJS 11 / TypeScript |
| 数据库 | SQLite + Redis |
| 实时通信 | WebSocket |
| 部署 | Nginx + 一键部署脚本 |

### 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发环境（前后端同时启动）
pnpm dev

# 前端：http://localhost:5173
# 后端：http://localhost:3000
```

### 可用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动前后端开发服务器 |
| `pnpm build` | 构建所有包 |
| `pnpm lint` | ESLint 检查 |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm format` | Prettier 代码格式化 |

### 服务端额外命令

```bash
cd packages/server
pnpm migration:run    # 运行数据库迁移
pnpm migration:generate  # 生成迁移文件
pnpm migration:revert    # 回滚迁移
```

### 数据库备份

管理后台 → 数据备份，可下载当前数据库文件、上传 .db 文件恢复数据。导入后服务端自动重启。

### 项目结构

```
LotteryTogether/
├── packages/
│   ├── client/          # Vue 3 前端
│   ├── server/          # NestJS 后端
│   └── shared/          # 前后端共享类型
├── docs/
│   ├── API.md           # API 文档
│   └── Specification.md # 开发规范
├── deploy.ps1           # Windows 一键部署脚本
├── deploy.sh            # Linux 一键部署脚本
├── AGENTS.md            # AI 辅助开发指令
└── 设计方案.md          # 完整设计方案
```

### 部署指南

**环境要求：** Node.js ≥ 22, pnpm ≥ 10

```bash
# 1. 克隆项目
git clone <repo-url>
cd LotteryTogether

# 2. 安装依赖
pnpm install

# 3. 构建
pnpm build

# 4. 运行数据库迁移
cd packages/server && pnpm migration:run

# 5. 一键部署脚本（选择中文/英文）
# Windows:
deploy.ps1
# Linux:
chmod +x deploy.sh && ./deploy.sh
```

### 环境变量说明

| 变量 | 默认值 | 说明 |
|------|--------|------|
| PORT | 3000 | 服务端端口 |
| DB_PATH | ./data/lottery.db | SQLite 数据库路径 |
| JWT_SECRET | dev-secret-change-in-production | JWT 签名密钥 |
| CORS_ORIGIN | http://localhost:5173 | 允许的跨域来源 |

完整变量列表见 [docs/Specification.md](docs/Specification.md#环境变量--environment-variables)。

### FAQ

**Q：如何创建第一个管理员账号？**
A：系统首次启动后，第一个注册的用户自动成为管理员。

**Q：如何关闭邀请码系统？**
A：管理员登录后台 → 邀请码管理 → 关闭「邀请码系统」开关。

**Q：数据库文件在哪里？**
A：默认在 `packages/server/data/lottery.db`，可通过 `DB_PATH` 环境变量修改。

**Q：如何生成迁移文件？**
A：`cd packages/server && pnpm migration:generate src/migrations/MigrationName`

**Q：前端端口是多少？**
A：开发环境 5173，生产环境通过 Nginx 部署。

**Q：支持哪些数据库？**
A：默认 SQLite，TypeORM 支持无缝切换到 PostgreSQL、MySQL 等。

---

## 🇬🇧 English

### Introduction

LotteryTogether is a full-featured online lucky draw platform with three core modes:

- **Wheel Spin** — Canvas-based physical inertia rotation with customizable sectors and weights
- **Blind Box** — 3×3/4×4 matrix grid with flip animations, collection gallery, and pity mechanics
- **Paper Slip** — Virtual paper box collaborative mode with fill-in questions, timed/count/manual draw

Comes with a complete admin panel for user management, activity creation wizard, risk control, invite codes, announcements, database backup, and user-facing sharing features and participation history.

### Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Vue 3.5+ / TypeScript / Vite 8 |
| CSS | UnoCSS (atomic, `data-theme` dark/light toggle) |
| State | Pinia |
| Animation | GSAP + Canvas/WebGL |
| Backend | NestJS 11 / TypeScript |
| Database | SQLite + Redis |
| Realtime | WebSocket |
| Deployment | Nginx + one-click setup script |

### Quick Start

```bash
# Install dependencies
pnpm install

# Start dev servers (frontend + backend)
pnpm dev

# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

### Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev servers |
| `pnpm build` | Build all packages |
| `pnpm lint` | ESLint check |
| `pnpm typecheck` | TypeScript type check |
| `pnpm format` | Prettier formatting |

### Server Commands

```bash
cd packages/server
pnpm migration:run       # Run database migrations
pnpm migration:generate  # Generate a migration file
pnpm migration:revert    # Revert last migration
```

### Database Backup

Admin panel → Data Backup. Download the current database file or upload a .db file to restore. The server restarts automatically after import.

### Project Structure

```
LotteryTogether/
├── packages/
│   ├── client/          # Vue 3 frontend
│   ├── server/          # NestJS backend
│   └── shared/          # Shared TypeScript types
├── docs/
│   ├── API.md           # API documentation
│   └── Specification.md # Development specification
├── deploy.ps1           # Windows one-click deployment
├── deploy.sh            # Linux one-click deployment
├── AGENTS.md            # AI assistant instructions
└── 设计方案.md          # Design documentation (Chinese)
```

### Deployment Guide

**Requirements:** Node.js ≥ 22, pnpm ≥ 10

```bash
# 1. Clone
git clone <repo-url>
cd LotteryTogether

# 2. Install
pnpm install

# 3. Build
pnpm build

# 4. Run database migrations
cd packages/server && pnpm migration:run

# 5. One-click deploy (choose Chinese/English):
# Windows:
deploy.ps1
# Linux:
chmod +x deploy.sh && ./deploy.sh
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| DB_PATH | ./data/lottery.db | SQLite file path |
| JWT_SECRET | dev-secret-change-in-production | JWT signing secret |
| CORS_ORIGIN | http://localhost:5173 | Allowed CORS origin |

Full list at [docs/Specification.md](docs/Specification.md#环境变量--environment-variables).

### FAQ

**Q: How to create the first admin account?**
A: The first user to register automatically becomes the system admin.

**Q: How to disable the invite system?**
A: Admin → Invite Codes → Toggle off "Invite System".

**Q: Where is the database file?**
A: Default at `packages/server/data/lottery.db`. Change with `DB_PATH` env.

**Q: How to generate migrations?**
A: `cd packages/server && pnpm migration:generate src/migrations/MigrationName`

**Q: What database is supported?**
A: SQLite by default. TypeORM supports PostgreSQL, MySQL, etc.

---

*For detailed API reference, see [docs/API.md](docs/API.md). For development guidelines, see [docs/Specification.md](docs/Specification.md).*
