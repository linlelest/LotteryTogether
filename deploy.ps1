<#
.SYNOPSIS
  LotteryTogether 部署与卸载脚本 | Deployment & Uninstall Script
.DESCRIPTION
  支持安装到 Nginx /lottery 子路径，以及完整卸载。
  Supports deployment under Nginx /lottery subpath and complete uninstall.
#>

#Requires -Version 5.1

chcp 65001 > $null
$ErrorActionPreference = "Stop"
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$dbPath = Join-Path $scriptPath "packages\server\data\lottery.db"
$bakDir = Join-Path $scriptPath "backups"

function Write-Bilingual($zh, $en) {
  $msg = if ($global:lang -eq "en") { $en } else { $zh }
  Write-Host $msg
}

function Show-Menu {
  Clear-Host
  Write-Host "========================================"
  Write-Host "   LotteryTogether"
  Write-Host "========================================"
  Write-Host ""
  Write-Bilingual "请选择操作 / Please select an action:" "Please select an action:"
  Write-Host "  [1] 安装 / 升级"
  Write-Host "  [2] 卸载"
  $choice = Read-Host "输入 1 或 2 / Enter 1 or 2"
  return $choice
}

# --- Language Selection ---
Clear-Host
Write-Host "================================"
Write-Host " LotteryTogether"
Write-Host "================================"
Write-Host ""
Write-Host "Please select language / 请选择语言:"
Write-Host "  [1] 中文"
Write-Host "  [2] English"
$langChoice = Read-Host "Enter 1 or 2 / 输入 1 或 2"
$global:lang = if ($langChoice -eq "2") { "en" } else { "zh" }

$action = Show-Menu

# Git clone if not in project directory
if (-not (Test-Path (Join-Path $scriptPath "package.json"))) {
  Write-Bilingual "`n未检测到项目文件，将自动下载源码包。" "`nProject not found. Will download source package."
  $dlUrl = "https://github.com/linlelest/LotteryTogether/archive/refs/heads/main.zip"
  $zipPath = Join-Path $scriptPath "lottery.zip"
  $extractDir = Join-Path $scriptPath "LotteryTogether-main"
  $targetDir = Join-Path $scriptPath "LotteryTogether"

  Write-Bilingual "[信息] 正在下载: $dlUrl" "[INFO] Downloading: $dlUrl"
  try {
    Invoke-WebRequest -Uri $dlUrl -OutFile $zipPath -UseBasicParsing
  } catch {
    Write-Bilingual "[错误] 下载失败，请手动下载并解压" "[ERROR] Download failed, please download manually"
    Read-Host "按 Enter 退出 / Press Enter to exit"
    exit 1
  }

  Write-Bilingual "[信息] 正在解压..." "[INFO] Extracting..."
  if (Test-Path $extractDir) { Remove-Item $extractDir -Recurse -Force }
  if (Test-Path $targetDir) { Remove-Item $targetDir -Recurse -Force }
  Expand-Archive -Path $zipPath -DestinationPath $scriptPath -Force
  Remove-Item $zipPath -Force

  Rename-Item -Path $extractDir -NewName "LotteryTogether"

  $scriptPath = $targetDir
  $dbPath = Join-Path $scriptPath "packages\server\data\lottery.db"
  Write-Bilingual "[信息] 源码已下载到: $scriptPath" "[INFO] Source downloaded to: $scriptPath"
}

if ($action -eq "2") {
  # ========== UNINSTALL ==========
  Write-Bilingual "`n[信息] 开始卸载 LotteryTogether..." "[INFO] Starting uninstall of LotteryTogether..."
  Write-Bilingual "`n是否保留数据库文件？" "`nKeep the database file?"
  Write-Bilingual "  [Y] 保留 (Keep)" "  [Y] Keep"
  Write-Bilingual "  [N] 删除 (Delete)" "  [N] Delete"
  $keepDb = (Read-Host "输入 Y 或 N / Enter Y or N").ToUpper()
  if ($keepDb -ne "N") { $keepDb = "Y" }

  if ($keepDb -eq "Y" -and (Test-Path $dbPath)) {
    if (-not (Test-Path $bakDir)) { New-Item -ItemType Directory -Path $bakDir -Force | Out-Null }
    $bakFile = Join-Path $bakDir ("lottery-backup-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".db")
    Copy-Item $dbPath $bakFile -Force
    Write-Bilingual "[信息] 数据库已备份至: $bakFile" "[INFO] Database backed up to: $bakFile"
  }

  Write-Bilingual "[步骤 1/3] 停止相关进程..." "[Step 1/3] Stopping processes..."
  Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -eq "" } | Stop-Process -Force -ErrorAction SilentlyContinue

  $nginxConf = "C:\nginx\conf\lottery.conf"
  if (Test-Path $nginxConf) {
    Remove-Item $nginxConf -Force
    Write-Bilingual "[信息] 已删除 Nginx 配置" "[INFO] Nginx config removed"
  }

  Write-Bilingual "[步骤 2/3] 删除项目文件..." "[Step 2/3] Removing project files..."
  Get-ChildItem $scriptPath -Exclude "backups", "node_modules" -Directory | ForEach-Object {
    if ($_.Name -ne "backups") {
      Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }
  }
  Get-ChildItem $scriptPath -File | Where-Object { $_.Name -ne "deploy.ps1" } | Remove-Item -Force -ErrorAction SilentlyContinue

  if ($keepDb -eq "N" -and (Test-Path $dbPath)) {
    Remove-Item $dbPath -Force -ErrorAction SilentlyContinue
    Write-Bilingual "[信息] 数据库已删除" "[INFO] Database deleted"
  }

  Write-Bilingual "[步骤 3/3] 清理完成" "[Step 3/3] Cleanup complete"
  Write-Bilingual "`n========== 卸载完成 ==========" "`n========== Uninstall Complete =========="
  if ($keepDb -eq "Y" -and (Test-Path $bakFile)) {
    Write-Bilingual "数据库备份路径: $bakFile" "Database backup path: $bakFile"
  }
  Read-Host "按 Enter 退出 / Press Enter to exit"
  exit 0
}

# ========== INSTALL ==========
Write-Bilingual "`n[信息] 开始部署 LotteryTogether..." "`n[INFO] Starting deployment of LotteryTogether..."

# Ask about Nginx first
Write-Bilingual "`n是否使用 Nginx 反向代理？（通过 http://your-ip/lottery 访问）" "`nUse Nginx reverse proxy? (Access via http://your-ip/lottery)"
Write-Bilingual "  [Y] 使用 - 自动配置反向代理、WebSocket、静态文件服务" "  [Y] Yes - auto-configure reverse proxy, WebSocket, static files"
Write-Bilingual "  [N] 不使用 - 仅部署应用" "  [N] No - deploy app only"
$installNginx = (Read-Host "输入 Y 或 N / Enter Y or N").ToUpper()
if ($installNginx -ne "N") { $installNginx = "Y" }

$nodeVer = node --version 2>$null
if (-not $nodeVer) {
  Write-Bilingual "[信息] 未检测到 Node.js，正在下载..." "[INFO] Node.js not found, downloading..."
  $nodeUrl = "https://nodejs.org/dist/v22.14.0/node-v22.14.0-x64.msi"
  $nodeInstaller = Join-Path $env:TEMP "node-installer.msi"
  try {
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller -UseBasicParsing
    Start-Process msiexec.exe -ArgumentList "/i `"$nodeInstaller`" /quiet /norestart" -Wait
    Remove-Item $nodeInstaller -Force
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
  } catch {
    Write-Bilingual "[错误] Node.js 下载/安装失败，请手动安装 Node.js >= 22" "[ERROR] Node.js install failed, please install manually"
    Read-Host "按 Enter 退出 / Press Enter to exit"; exit 1
  }
  $nodeVer = node --version 2>$null
  if (-not $nodeVer) { Write-Bilingual "[错误] Node.js 安装后未生效，请手动安装" "[ERROR] Node.js not detected after install"; Read-Host "按 Enter 退出"; exit 1 }
  Write-Bilingual "[信息] Node.js $nodeVer 安装完成" "[INFO] Node.js $nodeVer installed"
}

$pnpmVer = pnpm --version 2>$null
if (-not $pnpmVer) {
  Write-Bilingual "[信息] 未检测到 pnpm，正在安装..." "[INFO] pnpm not found, installing..."
  npm install -g pnpm 2>$null
  $pnpmVer = pnpm --version 2>$null
  if (-not $pnpmVer) { Write-Bilingual "[错误] pnpm 安装失败，请手动安装" "[ERROR] pnpm install failed"; Read-Host "按 Enter 退出"; exit 1 }
  Write-Bilingual "[信息] pnpm $pnpmVer 安装完成" "[INFO] pnpm $pnpmVer installed"
}

# Ask about Nginx
Write-Bilingual "`n是否安装 Nginx 反向代理？（通过 Nginx 访问 http://your-ip/lottery）" "`nInstall Nginx reverse proxy? (Access via http://your-ip/lottery)"
Write-Bilingual "  [Y] 安装 - 自动配置反向代理、WebSocket、静态文件服务" "  [Y] Yes - auto-configure reverse proxy, WebSocket, static files"
Write-Bilingual "  [N] 不安装 - 仅部署应用，需自行配置" "  [N] No - deploy app only, configure manually"
$installNginx = (Read-Host "输入 Y 或 N / Enter Y or N").ToUpper()
if ($installNginx -ne "N") { $installNginx = "Y" }

if ($installNginx -eq "Y") {
  $nginxPath = "C:\nginx\nginx.exe"
  if (-not (Test-Path $nginxPath)) {
    Write-Bilingual "[信息] 正在下载 Nginx..." "[INFO] Downloading Nginx..."
    $nginxUrl = "https://nginx.org/download/nginx-1.26.2.zip"
    $nginxZip = Join-Path $env:TEMP "nginx.zip"
    try {
      Invoke-WebRequest -Uri $nginxUrl -OutFile $nginxZip -UseBasicParsing
      Expand-Archive -Path $nginxZip -DestinationPath "C:\" -Force
      Remove-Item $nginxZip -Force
      # Rename extracted folder
      $extracted = Get-ChildItem "C:\" -Directory | Where-Object { $_.Name -like "nginx-*" } | Select-Object -First 1
      if ($extracted -and -not (Test-Path "C:\nginx")) {
        Rename-Item $extracted.FullName "C:\nginx"
      }
    } catch {
      Write-Bilingual "[警告] Nginx 下载失败，请手动安装" "[WARN] Nginx download failed, please install manually"
      $installNginx = "N"
    }
  }
}

Write-Bilingual "[步骤 1/4] 安装依赖..." "[Step 1/4] Installing dependencies..."
Push-Location $scriptPath
pnpm install | Out-Host
if ($LASTEXITCODE -ne 0) {
  Write-Bilingual "[错误] 安装失败" "[ERROR] Installation failed"
  Read-Host "按 Enter 退出 / Press Enter to exit"
  exit 1
}

Write-Bilingual "[步骤 2/4] 构建项目..." "[Step 2/4] Building project..."
pnpm build | Out-Host
if ($LASTEXITCODE -ne 0) {
  Write-Bilingual "[错误] 构建失败" "[ERROR] Build failed"
  Read-Host "按 Enter 退出 / Press Enter to exit"
  exit 1
}

Write-Bilingual "[步骤 3/4] 数据库迁移..." "[Step 3/4] Running database migrations..."
Push-Location (Join-Path $scriptPath "packages\server")
pnpm migration:run 2>$null | Out-Null
Pop-Location

# Nginx (only if user opted in)
if ($installNginx -eq "Y") {
  Write-Bilingual "[步骤 4/4] 生成 Nginx 配置..." "[Step 4/4] Generating Nginx config..."
$nginxConfig = @"
server {
    listen 80;
    server_name _;

    location /lottery {
        alias $scriptPath\packages\client\dist;
        index index.html;
        try_files  `$uri `$uri/ /lottery/index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
    }

    location /uploads {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host `$host;
    }

    location /ws {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host `$host;
    }
}
"@

$nginxConfPath = "C:\nginx\conf\lottery.conf"
try {
  $nginxConfig | Out-File -FilePath $nginxConfPath -Encoding UTF8
  Write-Bilingual "[信息] Nginx 配置已生成: $nginxConfPath" "[INFO] Nginx config generated: $nginxConfPath"
  Write-Bilingual "[提示] 请确保 Nginx 已包含 lottery.conf，然后执行 nginx -s reload" "[TIP] Ensure your nginx.conf includes lottery.conf, then run nginx -s reload"
  # Start Nginx if installed
  if (Test-Path "C:\nginx\nginx.exe") {
    $nginxRunning = Get-Process -Name "nginx" -ErrorAction SilentlyContinue
    if (-not $nginxRunning) {
      Start-Process -FilePath "C:\nginx\nginx.exe" -WorkingDirectory "C:\nginx"
      Write-Bilingual "[信息] Nginx 已启动" "[INFO] Nginx started"
    }
  }
} catch {
  Write-Bilingual "[警告] 无法写入 Nginx 配置，请手动配置" "[WARN] Could not write Nginx config, please configure manually"
}
}

Pop-Location

Write-Bilingual "`n========== 部署完成 ==========" "`n========== Deployment Complete =========="
Write-Bilingual "前端访问: http://your-ip/lottery" "Frontend URL: http://your-ip/lottery"
Write-Bilingual "后端 API:  http://your-ip/api" "Backend API: http://your-ip/api"
Write-Bilingual "`n启动命令: pnpm dev" "Start command: pnpm dev"
Read-Host "按 Enter 退出 / Press Enter to exit"