# LotteryTogether - 抽奖软件

## 项目简介

LotteryTogether 是一个功能丰富的前后端分离抽奖系统，支持普通抽奖和特殊转盘抽奖模式。系统采用 SQLite 数据库，无需邮箱注册，仅需用户名和密码即可使用。

## 主要功能

### 用户功能
- **注册登录**: 简单的用户名/密码认证系统
- **创建抽奖**: 
  - 设置抽奖名称、奖品列表（支持单独/批量添加）
  - 奖品权重设置
  - 选择抽奖模式（普通/特殊转盘）
  - 兑奖说明
  - 进入口令（可随机生成或公开）
  - 参与人数/开奖时间设置
  - 强制登录选项
- **分享链接**: 一键生成带口令的分享链接
- **个人中心**: 
  - 查看参与过的抽奖
  - 切换主题配色
  - 修改用户名/密码
- **主题切换**: 支持暗黑/浅色主题

### 特殊抽奖模式
- 每个人转转盘，系统记录所有随机结果
- 达到人数/时间后统一显示被随机到次数最多的用户
- 增强参与感和互动性

### 管理员功能
- **用户管理**: 
  - 查看所有用户
  - 封禁/解封用户
  - 发送通知给单个用户
- **公告管理**: 
  - 创建统一公告（支持 Markdown 编辑器）
  - 维护页面公告
- **系统设置**: 
  - 访问速率限制（每小时/分钟访问次数）
  - 一键关站功能
- **首次激活**: 系统首次运行必须激活管理员账号
- **强制改密**: 管理员首次登录强制更改用户名和密码

### 游客体验
- 输入口令进入抽奖
- 浏览公开抽奖列表
- 参与抽奖（根据设置是否需要登录）
- 转盘抽奖界面
- 开奖倒计时界面
- 中奖结果展示

## 技术栈

### 后端
- Python Flask
- SQLite 数据库
- JWT 认证
- RESTful API

### 前端
- HTML5/CSS3/JavaScript
- 响应式设计（适配电脑、平板、手机）
- Canvas 转盘绘制
- Markdown 编辑器
- 主题切换系统

## 快速开始

### 环境要求
- Python 3.8+
- Node.js (可选，用于前端构建)
- Nginx (生产环境部署)

### 安装步骤

1. 克隆项目
```bash
git clone https://github.com/linlelest/LotteryTogether.git 
cd LotteryTogether
cd lottery
```

2. 安装后端依赖
```bash
cd backend
pip install -r requirements.txt
```

3. 初始化数据库
```bash
python init_db.py
```

4. 启动后端服务
```bash
python app.py
```

5. 访问前端
打开浏览器访问 `http://localhost:5000`

### 默认管理员账号
- 用户名：`admin`
- 密码：`admin123`

**注意**: 首次登录后请立即修改管理员密码！

## 目录结构

```
lottery/
├── backend/
│   ├── app.py              # Flask 主应用
│   ├── models.py           # 数据库模型
│   ├── routes.py           # API 路由
│   ├── auth.py             # 认证模块
│   ├── utils.py            # 工具函数
│   ├── init_db.py          # 数据库初始化
│   └── requirements.txt    # Python 依赖
├── frontend/
│   ├── src/
│   │   ├── components/     # Vue 组件
│   │   ├── pages/          # 页面组件
│   │   ├── styles/         # 样式文件
│   │   └── utils/          # 工具函数
│   └── public/
│       └── index.html      # 入口文件
├── docs/
│   ├── README.md           # 本文档
│   └── DEPLOYMENT.md       # 部署指南
└── README.md               # 项目说明
```

## 功能详细说明

### 1. 抽奖创建流程
1. 用户登录后进入"创建抽奖"页面
2. 填写基本信息：名称、描述、兑奖说明
3. 添加奖品：可逐个添加或批量粘贴（一行一个）
4. 设置奖品权重（个数）
5. 选择抽奖模式：普通模式或特殊转盘模式
6. 设置参与条件：人数限制、开奖时间
7. 配置访问控制：生成口令或设为公开
8. 选择是否强制登录参与
9. 点击创建，生成分享链接

### 2. 特殊转盘模式
- 每个参与者转动转盘获得随机结果
- 系统后台记录所有结果
- 达到设定人数或时间后自动开奖
- 统计被随机到次数最多的用户为中奖者
- 所有参与者同时看到结果，增强互动性

### 3. 管理员后台
- **仪表盘**: 系统概览、统计数据
- **用户管理**: 列表展示、搜索、封禁/解封
- **公告管理**: Markdown 编辑器、预览功能
- **系统设置**: 速率限制、维护模式开关
- **通知系统**: 向单个用户发送消息

### 4. 响应式设计
- 移动端优先设计
- 自适应电脑、平板、手机屏幕
- 触摸友好的转盘交互
- 优化的移动端导航

## API 接口

### 认证相关
- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录
- `POST /api/logout` - 用户登出
- `PUT /api/user/profile` - 更新用户信息

### 抽奖相关
- `GET /api/lotteries` - 获取抽奖列表
- `POST /api/lotteries` - 创建抽奖
- `GET /api/lotteries/<id>` - 获取抽奖详情
- `PUT /api/lotteries/<id>` - 更新抽奖
- `DELETE /api/lotteries/<id>` - 删除抽奖
- `POST /api/lotteries/<id>/join` - 参与抽奖
- `POST /api/lotteries/<id>/spin` - 转盘抽奖
- `GET /api/lotteries/<id>/results` - 获取开奖结果

### 管理员相关
- `GET /api/admin/users` - 获取所有用户
- `PUT /api/admin/users/<id>/ban` - 封禁用户
- `PUT /api/admin/users/<id>/unban` - 解封用户
- `POST /api/admin/notifications` - 发送通知
- `POST /api/admin/announcements` - 创建公告
- `PUT /api/admin/settings` - 更新系统设置

## 安全特性

- JWT Token 认证
- 密码加密存储（bcrypt）
- SQL 注入防护
- XSS 攻击防护
- 访问速率限制
- 管理员权限隔离

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 联系方式

GitHub: https://github.com/linlelest/LotteryTogether

---

# LotteryTogether - Lottery Software

## Project Overview

LotteryTogether is a feature-rich full-stack lottery system supporting both regular and special spinner lottery modes. The system uses SQLite database and requires only username and password for registration, no email needed.

## Key Features

### User Features
- **Registration & Login**: Simple username/password authentication
- **Create Lottery**: 
  - Set lottery name, prize list (single/batch addition supported)
  - Prize weight configuration
  - Lottery mode selection (regular/special spinner)
  - Prize redemption instructions
  - Access code (randomly generated or public)
  - Participant limit/draw time settings
  - Mandatory login option for participants
- **Share Links**: One-click generation of shareable links with access codes
- **User Center**: 
  - View participated lotteries
  - Theme switching
  - Change username/password
- **Theme Toggle**: Dark/Light mode support

### Special Spinner Mode
- Each participant spins the wheel to get random results
- System records all results in the background
- Automatically draws when reaching set participant count or time
- User with most frequent random result wins
- All participants see results simultaneously for enhanced interaction

### Admin Features
- **User Management**: 
  - View all users
  - Ban/Unban users
  - Send notifications to individual users
- **Announcement Management**: 
  - Create unified announcements (Markdown editor supported)
  - Maintenance page announcements
- **System Settings**: 
  - Rate limiting (requests per hour/minute)
  - One-click site shutdown
- **Initial Activation**: Admin account must be activated on first run
- **Forced Password Change**: Admin must change credentials on first login

### Guest Experience
- Enter access code to join lottery
- Browse public lottery list
- Participate in lotteries (based on login requirements)
- Spinner wheel interface
- Countdown timer for draw results
- Winner announcement display

## Technology Stack

### Backend
- Python Flask
- SQLite Database
- JWT Authentication
- RESTful API

### Frontend
- HTML5/CSS3/JavaScript
- Responsive Design (Desktop, Tablet, Mobile)
- Canvas-based Spinner Wheel
- Markdown Editor
- Theme Switching System

## Quick Start

### Requirements
- Python 3.8+
- Node.js (optional, for frontend build)
- Nginx (production deployment)

### Installation Steps

1. Clone the repository
```bash
git clone https://github.com/linlelest/LotteryTogether.git 
cd LotteryTogether
cd lottery
```

2. Install backend dependencies
```bash
cd backend
pip install -r requirements.txt
```

3. Initialize database
```bash
python init_db.py
```

4. Start backend server
```bash
python app.py
```

5. Access the frontend
Open browser and visit `http://localhost:5000`

### Default Admin Credentials
- Username: `admin`
- Password: `admin123`

**Note**: Please change the admin password immediately after first login!

## Directory Structure

```
lottery/
├── backend/
│   ├── app.py              # Flask main application
│   ├── models.py           # Database models
│   ├── routes.py           # API routes
│   ├── auth.py             # Authentication module
│   ├── utils.py            # Utility functions
│   ├── init_db.py          # Database initialization
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/     # Vue components
│   │   ├── pages/          # Page components
│   │   ├── styles/         # Style files
│   │   └── utils/          # Utility functions
│   └── public/
│       └── index.html      # Entry file
├── docs/
│   ├── README.md           # This document
│   └── DEPLOYMENT.md       # Deployment guide
└── README.md               # Project overview
```

## Detailed Feature Description

### 1. Lottery Creation Flow
1. User logs in and navigates to "Create Lottery" page
2. Fill in basic info: name, description, redemption instructions
3. Add prizes: individually or batch paste (one per line)
4. Set prize weights (quantities)
5. Select lottery mode: regular or special spinner
6. Configure participation conditions: participant limit, draw time
7. Set access control: generate code or make public
8. Choose whether mandatory login is required
9. Click create, generate share link

### 2. Special Spinner Mode
- Each participant spins the wheel for random results
- System records all results in background
- Automatic draw when reaching set count or time
- User with most frequent result wins
- All participants see results simultaneously

### 3. Admin Dashboard
- **Dashboard**: System overview, statistics
- **User Management**: List view, search, ban/unban
- **Announcement Management**: Markdown editor, preview
- **System Settings**: Rate limiting, maintenance mode toggle
- **Notification System**: Send messages to individual users

### 4. Responsive Design
- Mobile-first approach
- Adaptive to desktop, tablet, mobile screens
- Touch-friendly spinner interaction
- Optimized mobile navigation

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `PUT /api/user/profile` - Update user profile

### Lottery
- `GET /api/lotteries` - Get lottery list
- `POST /api/lotteries` - Create lottery
- `GET /api/lotteries/<id>` - Get lottery details
- `PUT /api/lotteries/<id>` - Update lottery
- `DELETE /api/lotteries/<id>` - Delete lottery
- `POST /api/lotteries/<id>/join` - Join lottery
- `POST /api/lotteries/<id>/spin` - Spin the wheel
- `GET /api/lotteries/<id>/results` - Get draw results

### Admin
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/<id>/ban` - Ban user
- `PUT /api/admin/users/<id>/unban` - Unban user
- `POST /api/admin/notifications` - Send notification
- `POST /api/admin/announcements` - Create announcement
- `PUT /api/admin/settings` - Update system settings

## Security Features

- JWT Token authentication
- Encrypted password storage (bcrypt)
- SQL injection protection
- XSS attack prevention
- Rate limiting
- Admin privilege isolation

## Contributing

Issues and Pull Requests are welcome!

## License

MIT License

## Contact

GitHub: https://github.com/linlelest/LotteryTogether
