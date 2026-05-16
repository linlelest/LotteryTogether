#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_PATH="$SCRIPT_DIR/packages/server/data/lottery.db"
BAK_DIR="$SCRIPT_DIR/backups"

LANG="zh"

# ===== Functions =====

log() { echo -e "\033[1;32m$1\033[0m"; }
err() { echo -e "\033[1;31m$1\033[0m"; }

select_lang() {
  echo "========================================"
  echo "   LotteryTogether"
  echo "========================================"
  echo ""
  echo "Please select language / 请选择语言:"
  echo "  [1] 中文"
  echo "  [2] English"
  read -p "Enter 1 or 2 / 输入 1 或 2: " lc
  case $lc in
    1) LANG="zh";;
    2) LANG="en";;
    *) select_lang;;
  esac
}

show_menu() {
  echo ""
  if [ "$LANG" = "en" ]; then
    echo "Select action:"
    echo "  [1] Install / Upgrade"
    echo "  [2] Uninstall"
  else
    echo "请选择操作:"
    echo "  [1] 安装 / 升级"
    echo "  [2] 卸载"
  fi
  read -p "$( [ "$LANG" = "en" ] && echo 'Enter 1 or 2: ' || echo '输入 1 或 2: ' )" action
  return "$action"
}

do_install() {
  echo ""
  [ "$LANG" = "en" ] && log "[INFO] Starting deployment..." || log "[信息] 开始部署..."

  # Ask about Nginx first
  echo ""
  if [ "$LANG" = "en" ]; then
    echo "Use Nginx reverse proxy? (Access via http://your-ip/lottery)"
    echo "  [Y] Yes - auto-configure reverse proxy, WebSocket, static files"
    echo "  [N] No - deploy app only"
  else
    echo "是否使用 Nginx 反向代理？（通过 http://your-ip/lottery 访问）"
    echo "  [Y] 使用 - 自动配置反向代理、WebSocket、静态文件服务"
    echo "  [N] 不使用 - 仅部署应用"
  fi
  read -p "$([ "$LANG" = "en" ] && echo 'Enter Y or N: ' || echo '输入 Y 或 N: ')" install_nginx

  # Check prerequisites
  command -v node >/dev/null 2>&1 || {
    if [ "$LANG" = "en" ]; then
      log "Node.js not found, installing..."
    else
      log "未检测到 Node.js，正在安装..."
    fi
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - 2>/dev/null || true
    apt-get install -y nodejs 2>/dev/null || yum install -y nodejs 2>/dev/null || {
      err "Node.js install failed, please install manually"; exit 1;
    }
  }
  command -v pnpm >/dev/null 2>&1 || {
    if [ "$LANG" = "en" ]; then
      log "pnpm not found, installing..."
    else
      log "未检测到 pnpm，正在安装..."
    fi
    npm install -g pnpm 2>/dev/null || { err "pnpm install failed"; exit 1; }
  }
  # Check unzip
  command -v unzip >/dev/null 2>&1 || {
    apt-get install -y unzip 2>/dev/null || yum install -y unzip 2>/dev/null || {
      err "unzip not found, please install unzip"; exit 1;
    }
  }

  [ "$LANG" = "en" ] && log "[Step 1/4] Installing dependencies..." || log "[步骤 1/4] 安装依赖..."
  cd "$SCRIPT_DIR"
  pnpm install || { err "[ERROR] Install failed"; exit 1; }

  [ "$LANG" = "en" ] && log "[Step 2/4] Building project..." || log "[步骤 2/4] 构建项目..."
  pnpm build || { err "[ERROR] Build failed"; exit 1; }

  [ "$LANG" = "en" ] && log "[Step 3/4] Running migrations..." || log "[步骤 3/4] 数据库迁移..."
  cd "$SCRIPT_DIR/packages/server" && pnpm migration:run 2>/dev/null || true
  cd "$SCRIPT_DIR"

  # Install and configure Nginx if opted in
  if [ "$install_nginx" = "Y" ] || [ "$install_nginx" = "y" ]; then
    # Install Nginx if not present
    command -v nginx >/dev/null 2>&1 || {
      if [ "$LANG" = "en" ]; then
        log "Nginx not found, installing..."
      else
        log "未检测到 Nginx，正在安装..."
      fi
      apt-get install -y nginx 2>/dev/null || yum install -y nginx 2>/dev/null || {
        err "Nginx install failed"; exit 1;
      }
    }

    [ "$LANG" = "en" ] && log "Configuring Nginx..." || log "配置 Nginx..."
    NGINX_CONF="/etc/nginx/conf.d/lottery.conf"
    cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    server_name _;

    location /lottery {
        alias $SCRIPT_DIR/packages/client/dist;
        index index.html;
        try_files \$uri \$uri/ /lottery/index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    location /uploads {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
    }

    location /ws {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }
}
EOF

  [ "$LANG" = "en" ] && log "Config written to $NGINX_CONF" || log "配置已写入 $NGINX_CONF"
  nginx -t 2>/dev/null && { nginx -s reload 2>/dev/null || systemctl start nginx 2>/dev/null || service nginx start 2>/dev/null || true; }
  [ "$LANG" = "en" ] && log "Nginx started" || log "Nginx 已启动"
fi  # end Nginx install block

  echo ""
  [ "$LANG" = "en" ] && echo "========== Deployment Complete ==========" || echo "========== 部署完成 =========="
  [ "$LANG" = "en" ] && echo "Frontend: http://your-ip/lottery" || echo "前端: http://your-ip/lottery"
  [ "$LANG" = "en" ] && echo "Backend:  http://your-ip/api" || echo "后端: http://your-ip/api"
  [ "$LANG" = "en" ] && echo "Start:    pnpm dev" || echo "启动: pnpm dev"
}

do_uninstall() {
  echo ""
  [ "$LANG" = "en" ] && log "[INFO] Starting uninstall..." || log "[信息] 开始卸载..."

  if [ "$LANG" = "en" ]; then
    read -p "Keep the database file? (Y/n): " keep_db
  else
    read -p "是否保留数据库文件？(Y/n): " keep_db
  fi
  keep_db="${keep_db:-Y}"

  # Backup
  if [[ "$keep_db" =~ ^[Yy]$ ]] && [ -f "$DB_PATH" ]; then
    mkdir -p "$BAK_DIR"
    BAK_FILE="$BAK_DIR/lottery-backup-$(date +%Y%m%d-%H%M%S).db"
    cp "$DB_PATH" "$BAK_FILE"
    [ "$LANG" = "en" ] && log "Database backed up to: $BAK_FILE" || log "数据库已备份至: $BAK_FILE"
  fi

  # Stop processes
  [ "$LANG" = "en" ] && log "[Step 1/3] Stopping processes..." || log "[步骤 1/3] 停止进程..."
  pkill -f "node.*lottery" 2>/dev/null || true

  # Remove nginx config
  rm -f /etc/nginx/conf.d/lottery.conf 2>/dev/null
  rm -f /etc/nginx/conf.d/lottery.conf.bak 2>/dev/null

  # Remove project files
  [ "$LANG" = "en" ] && log "[Step 2/3] Removing files..." || log "[步骤 2/3] 删除文件..."
  cd "$SCRIPT_DIR"
  for item in packages docs node_modules deploy.sh README.md AGENTS.md; do
    rm -rf "$item" 2>/dev/null || true
  done

  if [[ "$keep_db" =~ ^[Nn]$ ]] && [ -f "$DB_PATH" ]; then
    rm -f "$DB_PATH"
    [ "$LANG" = "en" ] && log "Database deleted" || log "数据库已删除"
  fi

  [ "$LANG" = "en" ] && log "[Step 3/3] Cleanup complete" || log "[步骤 3/3] 清理完成"
  echo ""
  [ "$LANG" = "en" ] && echo "========== Uninstall Complete ==========" || echo "========== 卸载完成 =========="
  if [[ "$keep_db" =~ ^[Yy]$ ]] && [ -f "$BAK_FILE" ]; then
    [ "$LANG" = "en" ] && echo "Backup path: $BAK_FILE" || echo "备份路径: $BAK_FILE"
  fi
}

# ===== Main =====
select_lang
echo ""
if [ "$LANG" = "en" ]; then
  echo "Select action:"
  echo "  [1] Install / Upgrade"
  echo "  [2] Uninstall"
else
  echo "请选择操作:"
  echo "  [1] 安装 / 升级"
  echo "  [2] 卸载"
fi
read -p "$([ "$LANG" = "en" ] && echo 'Enter 1 or 2: ' || echo '输入 1 或 2: ')" action

# Download zip if not in project directory
if [ ! -f "$SCRIPT_DIR/package.json" ]; then
  echo ""
  if [ "$LANG" = "en" ]; then
    echo "Project not found. Downloading source package..."
  else
    echo "未检测到项目文件，正在下载源码包..."
  fi
  DL_URL="https://github.com/linlelest/LotteryTogether/archive/refs/heads/main.zip"
  ZIP_PATH="$SCRIPT_DIR/lottery.zip"
  EXTRACT_DIR="$SCRIPT_DIR/LotteryTogether-main"
  TARGET_DIR="$SCRIPT_DIR/LotteryTogether"

  if command -v curl &>/dev/null; then
    curl -L -o "$ZIP_PATH" "$DL_URL"
  elif command -v wget &>/dev/null; then
    wget -O "$ZIP_PATH" "$DL_URL"
  else
    err "curl or wget required to download"
    exit 1
  fi

  unzip -o "$ZIP_PATH" -d "$SCRIPT_DIR" 2>/dev/null
  rm -f "$ZIP_PATH"
  [ -d "$TARGET_DIR" ] && rm -rf "$TARGET_DIR"
  mv "$EXTRACT_DIR" "$TARGET_DIR" 2>/dev/null || true
  SCRIPT_DIR="$TARGET_DIR"
  DB_PATH="$SCRIPT_DIR/packages/server/data/lottery.db"
  if [ "$LANG" = "en" ]; then
    log "Source downloaded to: $SCRIPT_DIR"
  else
    log "源码已下载到: $SCRIPT_DIR"
  fi
fi

case $action in
  2) do_uninstall;;
  *) do_install;;
esac