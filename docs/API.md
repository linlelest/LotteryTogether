# API 文档 | API Documentation

> 中英文双语，一行中文一行英文
> Bilingual: one line Chinese, one line English

---

## 认证 | Authentication

`GET /api/auth/needs-setup`
- 检查是否需要首次设置（无管理员时）| Check if first-time setup is needed
- Response: `{ needsSetup: boolean }`

`POST /api/auth/register`
- 注册新用户（首注为管理员） | Register a new user (first user becomes admin)
- Body: `{ username, password, inviteCode? }`
- Response: `{ accessToken, refreshToken }`

`POST /api/auth/login`
- 登录 | Login
- Body: `{ username, password }`
- Response: `{ accessToken, refreshToken }`

`POST /api/auth/refresh`
- 刷新 Token | Refresh access token
- Header: `Authorization: Bearer <token>`
- Response: `{ accessToken, refreshToken }`

`GET /api/auth/invite-info`
- 获取邀请系统信息（开关状态 + 提示文案） | Get invite system info (enabled status + hint text)
- Response: `{ enabled: boolean, hint: string }`

---

## 用户 | Users

`GET /api/users/me`
- 获取当前用户信息 | Get current user profile
- Auth required

`PATCH /api/users/me`
- 更新个人信息 | Update profile
- Body: `{ username?, password? }`

`POST /api/users/avatar`
- 上传头像 | Upload avatar
- FormData: `file` (image, max 5MB)

---

## 活动 | Activities

`POST /api/activities`
- 创建活动 | Create activity
- Body: `{ name, description?, cover?, mode, isPublic?, requireLogin?, accessPassword?, blindBoxGridSize?, blindBoxOpenable?, paperQuestion?, paperPrizeCount?, paperDrawTrigger?, paperDrawTime?, paperDrawCount?, startTime?, endTime? }`

`GET /api/activities/by-code/:code`
- 通过抽奖编号查找活动 | Find activity by lottery code

`GET /api/activities/public`
- 公开活动列表（按参与人数排序） | Public activity list (sorted by participant count)
- Query: `page?, pageSize?, mode?, status?, search?`

`GET /api/activities`
- 全部活动列表（管理员） | All activities (admin only)
- Auth: admin required

`GET /api/activities/:id`
- 活动详情 | Activity detail

`PATCH /api/activities/:id`
- 更新活动 | Update activity

`PATCH /api/activities/:id/status`
- 切换活动状态 | Change activity status
- Body: `{ status }` — `draft|pending|active|paused|ended`

`DELETE /api/activities/:id`
- 删除活动 | Delete activity

`POST /api/activities/:id/force-end`
- 强制结束活动 | Force end activity
- Body: `{ reason }`

`POST /api/activities/:id/verify-password`
- 验证私密活动密码 | Verify private activity password
- Body: `{ password }`

---

## 奖品 | Prizes

`POST /api/prizes`
- 创建奖品 | Create prize

`GET /api/prizes/activity/:activityId`
- 按活动获取奖品列表 | Get prizes by activity

`PATCH /api/prizes/:id`
- 更新奖品 | Update prize

`DELETE /api/prizes/:id`
- 删除奖品 | Delete prize

`POST /api/prizes/bulk/:activityId`
- 批量创建奖品 | Bulk create prizes
- Body: `{ prizes: [{ name, type: 'virtual', stock, weight, description? }] }`

---

## 抽奖 | Draw

`POST /api/draw/:activityId`
- 执行抽奖 | Execute a draw
- Auth required
- Response: `{ prize: Prize | null, record: DrawRecord }`

`GET /api/draws/me`
- 我的抽奖记录 | My draw records

`GET /api/draws/activity/:activityId`
- 活动抽奖记录 | Activity draw records

`PATCH /api/draws/:id/status`
- 更新抽奖记录状态 | Update draw record status
- Body: `{ status }` — `pending|claimed`

---

## 纸条抽奖 | Paper Slips

`POST /api/paper-slips`
- 提交纸条 | Submit a paper slip
- Body: `{ activityId, content }` (content max 200 chars)

`GET /api/paper-slips/:activityId/status`
- 获取纸条开奖状态（总数量/触发方式/倒计时）| Get paper draw status (total count / trigger type / countdown)

`GET /api/paper-slips/:activityId`
- 获取活动纸条列表 | Get paper slips by activity

`DELETE /api/paper-slips/:id`
- 删除纸条（创建者专用）| Delete a paper slip (creator only)

`POST /api/paper-slips/:activityId/draw`
- 从纸条箱开奖 | Draw from paper box
- Body: `{ mode: 'random' | 'timeline' }`

---

## 短链与邀请 | Short Links & Invites

`POST /api/short-links`
- 生成短链 | Generate short link
- Body: `{ targetUrl, activityId? }`

`GET /api/short-links/:code`
- 解析短链（记录点击） | Resolve short link (tracks click)

`GET /api/invite/leaderboard`
- 邀请排行榜 | Invite leaderboard
- Query: `activityId?`

`GET /api/invite/my`
- 我的邀请记录 | My invite records

`GET /api/invite/count`
- 我的邀请数量 | My invite count

---

## 管理后台 | Admin

`GET /api/admin/users` — 用户列表 | User list
`POST /api/admin/users/:id/ban` — 封禁用户 | Ban user
`POST /api/admin/users/:id/unban` — 解封 | Unban
`DELETE /api/admin/users/:id` — 删除用户 | Delete user
`GET /api/admin/ip-blacklist` — IP黑名单 | IP blacklist
`PATCH /api/admin/ip-blacklist/:id` — 更新黑名单记录 | Update IP record
`DELETE /api/admin/ip-blacklist/:id` — 解封IP | Unban IP
`GET /api/admin/invite-codes` — 邀请码列表 | Invite codes
`POST /api/admin/invite-codes/generate` — 生成邀请码 | Generate codes
`POST /api/admin/invite-codes/assign` — 分配邀请码 | Assign codes
`GET /api/admin/announcements` — 公告列表 | Announcements
`POST /api/admin/announcements` — 创建公告 | Create announcement
`PATCH /api/admin/announcements/:id` — 更新公告 | Update announcement
`DELETE /api/admin/announcements/:id` — 删除公告 | Delete announcement
`POST /api/admin/announcements/sort` — 排序公告 | Sort announcements
`GET /api/admin/backup/download` — 下载数据库 | Download database
`POST /api/admin/backup/import` — 导入数据库 | Import database (multipart .db file)

---

## 公告（用户端）| Announcements (User)

`GET /api/announcements` — 获取公告列表 | Get announcements
`POST /api/announcements/:id/read` — 标记已读 | Mark as read

---

## 文件上传 | File Upload

`POST /api/upload`
- 上传图片（封面/奖品图片） | Upload image (cover / prize image)
- FormData: `file` (image, max 5MB)
- Response: `{ url: string }`

---

## WebSocket | WebSocket

- 端点 | Endpoint: `/ws`
- 认证 | Auth: `{ auth: { token } }`
- 事件 | Events:
  - `join-activity` / `leave-activity` — 加入/离开活动房间 | Join/leave activity room
  - `ping` / `pong` — 心跳 | Heartbeat
  - `participant-count` — 参与人数变更 | Participant count change
  - `draw-result` — 开奖结果广播 | Draw result broadcast
  - `paper-slip` — 纸条入箱通知 | Paper slip notification
  - `dashboard-update` — 仪表盘实时数据 | Dashboard real-time data

---

## 通用响应格式 | Common Response Format

```json
{
  "id": 1,
  "name": "...",
  "...": "..."
}
```

错误时 | On error:
```json
{
  "message": "Error description",
  "error": "Bad Request",
  "statusCode": 400
}
```
