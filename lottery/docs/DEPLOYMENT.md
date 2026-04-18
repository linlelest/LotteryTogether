# 部署指南 - LotteryTogether

## 在 Ubuntu/Debian 服务器上使用 Nginx 长期部署

本指南将详细介绍如何将 LotteryTogether 项目部署到 Ubuntu/Debian 服务器上，并通过 Nginx 提供反向代理服务，使项目可通过公网 IP/lottery 访问。

---

## 目录

1. [系统要求](#系统要求)
2. [安装依赖](#安装依赖)
3. [克隆项目](#克隆项目)
4. [配置后端](#配置后端)
5. [配置前端](#配置前端)
6. [安装和配置 Nginx](#安装和配置-nginx)
7. [配置 Systemd 服务](#配置-systemd-服务)
8. [防火墙设置](#防火墙设置)
9. [测试部署](#测试部署)
10. [常见问题](#常见问题)

---

## 系统要求

- Ubuntu 20.04+ / Debian 10+ 服务器
- 至少 512MB RAM
- 至少 5GB 可用磁盘空间
- 具有 sudo 权限的用户账户
- 公网 IP 地址

---

## 安装依赖

### 1. 更新系统包

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. 安装 Python 和 pip

```bash
sudo apt install -y python3 python3-pip python3-venv
```

### 3. 安装 Nginx

```bash
sudo apt install -y nginx
```

### 4. 安装 Git

```bash
sudo apt install -y git
```

### 5. 验证安装

```bash
python3 --version
pip3 --version
nginx -v
git --version
```

---

## 克隆项目

### 1. 创建应用目录

```bash
sudo mkdir -p /var/www/lottery
sudo chown -R $USER:$USER /var/www/lottery
cd /var/www/lottery
```

### 2. 克隆项目代码

```bash
git clone https://github.com/linlelest/LotteryTogether.git .
```

或者，如果你已经有本地代码：

```bash
# 使用 SCP 或 FTP 上传本地代码到服务器
# 然后解压到 /var/www/lottery 目录
```

---

## 配置后端

### 1. 创建 Python 虚拟环境

```bash
cd /var/www/lottery/backend
python3 -m venv venv
```

### 2. 激活虚拟环境

```bash
source venv/bin/activate
```

### 3. 安装 Python 依赖

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. 初始化数据库

```bash
python init_db.py
```

这将创建 SQLite 数据库文件并初始化默认管理员账号。

### 5. 创建配置文件

```bash
nano /var/www/lottery/backend/config.py
```

添加以下内容：

```python
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-here-change-in-production'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///lottery.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT 配置
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
    
    # 速率限制配置
    RATELIMIT_ENABLED = True
    RATELIMIT_DEFAULT = "100 per hour"
    
    # 生产环境设置
    DEBUG = False
```

### 6. 测试后端启动

```bash
# 确保还在虚拟环境中
python app.py
```

按 `Ctrl+C` 停止测试服务器。

---

## 配置前端

### 1. 配置前端静态文件

由于我们使用纯 HTML/CSS/JS，不需要构建步骤，只需确保所有文件在正确位置：

```bash
# 检查前端文件结构
ls -la /var/www/lottery/frontend/public/
```

### 2. 配置 API 地址

编辑前端配置文件，设置后端 API 地址：

```bash
nano /var/www/lottery/frontend/src/utils/config.js
```

添加以下内容：

```javascript
export const API_BASE_URL = '/api';
export const APP_NAME = 'LotteryTogether';
```

---

## 安装和配置 Nginx

### 1. 创建 Nginx 配置文件

```bash
sudo nano /etc/nginx/sites-available/lottery
```

添加以下配置：

```nginx
server {
    listen 80;
    server_name your_server_ip_or_domain;
    
    # 根目录设置为前端静态文件
    root /var/www/lottery/frontend/public;
    index index.html;
    
    # 日志文件
    access_log /var/log/nginx/lottery_access.log;
    error_log /var/log/nginx/lottery_error.log;
    
    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API 反向代理到 Flask 后端
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket 支持（如果需要）
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 主应用路由 - 所有其他请求返回 index.html (SPA 支持)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 2. 启用站点配置

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/lottery /etc/nginx/sites-enabled/lottery

# 删除默认配置（可选）
sudo rm /etc/nginx/sites-enabled/default
```

### 3. 测试 Nginx 配置

```bash
sudo nginx -t
```

如果显示 "syntax is ok" 和 "test is successful"，则配置正确。

### 4. 重启 Nginx

```bash
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 配置 Systemd 服务

### 1. 创建 Systemd 服务文件

```bash
sudo nano /etc/systemd/system/lottery.service
```

添加以下内容：

```ini
[Unit]
Description=LotteryTogether Flask Application
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/lottery/backend
Environment="PATH=/var/www/lottery/backend/venv/bin"
ExecStart=/var/www/lottery/backend/venv/bin/python app.py
Restart=always
RestartSec=10

# 环境变量（可选）
Environment="SECRET_KEY=your-secret-key-here"
Environment="JWT_SECRET_KEY=jwt-secret-key-here"

[Install]
WantedBy=multi-user.target
```

### 2. 设置目录权限

```bash
sudo chown -R www-data:www-data /var/www/lottery
sudo chmod -R 755 /var/www/lottery
```

### 3. 启动服务

```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启动 lottery 服务
sudo systemctl start lottery

# 设置开机自启
sudo systemctl enable lottery

# 查看服务状态
sudo systemctl status lottery
```

### 4. 查看服务日志

```bash
# 实时查看日志
sudo journalctl -u lottery -f

# 查看最近 100 行日志
sudo journalctl -u lottery -n 100
```

---

## 防火墙设置

### 1. 如果使用 UFW（Ubuntu 防火墙）

```bash
# 安装 UFW（如果未安装）
sudo apt install -y ufw

# 允许 SSH
sudo ufw allow ssh

# 允许 HTTP
sudo ufw allow http

# 允许 HTTPS（如果配置了 SSL）
sudo ufw allow https

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

### 2. 如果使用 firewalld（CentOS/RHEL）

```bash
# 安装 firewalld（如果未安装）
sudo yum install -y firewalld

# 启动 firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld

# 允许 HTTP 和 HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh

# 重新加载防火墙
sudo firewall-cmd --reload

# 查看状态
sudo firewall-cmd --list-all
```

---

## 测试部署

### 1. 检查服务状态

```bash
# 检查 Nginx
sudo systemctl status nginx

# 检查 Lottery 服务
sudo systemctl status lottery

# 检查端口监听
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :5000
```

### 2. 浏览器访问

在浏览器中访问：

```
http://your_server_ip/lottery
```

或者如果使用域名：

```
http://your-domain.com/lottery
```

### 3. 首次访问

1. 系统将提示你激活管理员账号
2. 使用默认凭据登录：
   - 用户名：`admin`
   - 密码：`admin123`
3. **立即修改管理员密码！**

### 4. 测试功能

- [ ] 注册新用户
- [ ] 创建抽奖
- [ ] 参与抽奖
- [ ] 管理员功能
- [ ] 主题切换
- [ ] 响应式设计（手机、平板）

---

## 常见问题

### 问题 1: Nginx 502 Bad Gateway

**原因**: Flask 后端未运行

**解决方案**:
```bash
sudo systemctl status lottery
sudo systemctl restart lottery
sudo journalctl -u lottery -n 50
```

### 问题 2: 权限错误

**原因**: 文件或目录权限不正确

**解决方案**:
```bash
sudo chown -R www-data:www-data /var/www/lottery
sudo chmod -R 755 /var/www/lottery
sudo chmod 644 /var/www/lottery/backend/*.py
```

### 问题 3: 数据库锁定

**原因**: SQLite 数据库被多个进程同时写入

**解决方案**:
```bash
# 确保只有一个 Flask 进程运行
sudo pkill -f "python app.py"
sudo systemctl restart lottery

# 检查数据库文件权限
sudo chown www-data:www-data /var/www/lottery/backend/lottery.db
sudo chmod 644 /var/www/lottery/backend/lottery.db
```

### 问题 4: 静态文件 404

**原因**: Nginx 配置错误或文件路径不正确

**解决方案**:
```bash
# 检查文件是否存在
ls -la /var/www/lottery/frontend/public/

# 检查 Nginx 配置
sudo nginx -t
sudo cat /etc/nginx/sites-available/lottery

# 重新加载 Nginx
sudo systemctl reload nginx
```

### 问题 5: CORS 错误

**原因**: 前后端跨域问题

**解决方案**:
确保 Flask 后端配置了 CORS：

```python
from flask_cors import CORS
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
```

### 问题 6: 内存不足

**原因**: 服务器内存较小

**解决方案**:
```bash
# 创建 swap 分区
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久生效
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 性能优化建议

### 1. 使用 Gunicorn 替代 Flask 开发服务器

```bash
# 安装 Gunicorn
pip install gunicorn

# 修改 systemd 服务文件
sudo nano /etc/systemd/system/lottery.service
```

更新 ExecStart 行：
```ini
ExecStart=/var/www/lottery/backend/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 app:app
```

### 2. 启用 Nginx 缓存

在 Nginx 配置中添加：
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m use_temp_path=off;

location /api {
    proxy_cache my_cache;
    proxy_cache_valid 200 10m;
    proxy_cache_valid 404 1m;
    # ... 其他配置
}
```

### 3. 启用 HTTPS（推荐）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 备份和恢复

### 1. 备份数据库

```bash
# 创建备份脚本
nano /var/www/lottery/backup.sh
```

内容：
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/lottery"
mkdir -p $BACKUP_DIR
cp /var/www/lottery/backend/lottery.db $BACKUP_DIR/lottery_$DATE.db
find $BACKUP_DIR -name "lottery_*.db" -mtime +30 -delete
echo "Backup completed: lottery_$DATE.db"
```

```bash
# 赋予执行权限
chmod +x /var/www/lottery/backup.sh

# 添加到 crontab（每天凌晨 2 点备份）
crontab -e
# 添加：0 2 * * * /var/www/lottery/backup.sh
```

### 2. 恢复数据库

```bash
# 停止服务
sudo systemctl stop lottery

# 恢复数据库
cp /var/backups/lottery/lottery_YYYYMMDD_HHMMSS.db /var/www/lottery/backend/lottery.db

# 设置权限
sudo chown www-data:www-data /var/www/lottery/backend/lottery.db

# 启动服务
sudo systemctl start lottery
```

---

## 监控和维护

### 1. 查看日志

```bash
# Nginx 访问日志
tail -f /var/log/nginx/lottery_access.log

# Nginx 错误日志
tail -f /var/log/nginx/lottery_error.log

# 应用日志
sudo journalctl -u lottery -f
```

### 2. 监控资源使用

```bash
# 查看内存使用
free -h

# 查看磁盘使用
df -h

# 查看 CPU 使用
top
```

### 3. 定期更新

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 更新 Python 依赖
cd /var/www/lottery/backend
source venv/bin/activate
pip install --upgrade -r requirements.txt

# 重启服务
sudo systemctl restart lottery
```

---

## 卸载

如果需要完全卸载：

```bash
# 停止服务
sudo systemctl stop lottery
sudo systemctl disable lottery
sudo rm /etc/systemd/system/lottery.service
sudo systemctl daemon-reload

# 移除 Nginx 配置
sudo rm /etc/nginx/sites-available/lottery
sudo rm /etc/nginx/sites-enabled/lottery
sudo systemctl reload nginx

# 删除应用目录
sudo rm -rf /var/www/lottery

# 删除备份（可选）
sudo rm -rf /var/backups/lottery
```

---

## 技术支持

如有问题，请提交 Issue 到 GitHub:
https://github.com/linlelest/LotteryTogether/issues

---

## 更新日志

- v1.0.0 - 初始部署指南
- 添加了 Gunicorn 配置说明
- 添加了 HTTPS 配置说明
- 添加了备份恢复流程

---

**祝您部署顺利！** 🎉
