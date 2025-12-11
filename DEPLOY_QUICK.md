# 🚀 快速部署指南

## 你遇到的錯誤

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'express'
```

**原因**: 遠端伺服器上沒有安裝 npm 套件（`node_modules` 目錄）

## ✅ 解決方案（在遠端 Debian VM 上執行）

### 方法 1: 最簡單（如果檔案已經在伺服器上）

```bash
# 1. 確認你在專案目錄
cd /root/electronic-music

# 2. 安裝依賴
npm install

# 3. 啟動伺服器
npm start
```

就這樣！應該就能運行了。

### 方法 2: 如果還沒有檔案在伺服器上

#### 選項 A: 從 GitHub Clone

```bash
# 先在本地推送到 GitHub
# 在你的 Mac 上:
git add .
git commit -m "Complete board music game"
git push origin main

# 然後在遠端伺服器上:
cd /root
git clone https://github.com/你的帳號/electronic-music.git
cd electronic-music
npm install
npm start
```

#### 選項 B: 直接上傳

在**本地 Mac** 執行：

```bash
# 1. 打包（排除 node_modules）
tar -czf ~/board-music.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  .

# 2. 上傳到伺服器（替換成你的 IP）
scp ~/board-music.tar.gz root@你的伺服器IP:/root/

# 3. SSH 到伺服器
ssh root@你的伺服器IP
```

在**遠端伺服器**執行：

```bash
# 1. 解壓縮
mkdir -p /root/electronic-music
tar -xzf /root/board-music.tar.gz -C /root/electronic-music

# 2. 進入目錄
cd /root/electronic-music

# 3. 安裝依賴
npm install

# 4. 啟動
npm start
```

## 🎯 啟動成功的標誌

你應該會看到：

```
🎮 Board Music Game Server running on http://localhost:3000
🔌 Hardware: Simulated Mode
```

然後開啟瀏覽器訪問：
```
http://你的伺服器IP:3000
```

## ⚠️ 常見問題

### 問題 1: Node.js 版本太舊

```bash
# 檢查版本
node --version

# 如果小於 v18，需要升級
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
```

### 問題 2: Port 3000 被佔用

```bash
# 使用不同 port
PORT=8080 npm start

# 或找出並關閉佔用的程式
lsof -i :3000
kill -9 <PID>
```

### 問題 3: 無法從外部訪問

```bash
# 檢查防火牆
ufw allow 3000

# 或使用 iptables
iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

## 🔧 背景運行（不要關閉終端機）

### 方式 1: 使用 nohup

```bash
nohup npm start > output.log 2>&1 &
```

### 方式 2: 使用 PM2（推薦）

```bash
# 安裝 PM2
npm install -g pm2

# 啟動
pm2 start src/server/index.js --name board-music

# 查看狀態
pm2 list

# 查看日誌
pm2 logs

# 停止
pm2 stop board-music
```

## 📝 完整步驟範例

假設你的伺服器 IP 是 `192.168.1.100`：

```bash
# === 在本地 Mac ===
cd ~/Documents/GitHub/electronic-music
tar -czf ~/board-music.tar.gz --exclude='node_modules' .
scp ~/board-music.tar.gz root@192.168.1.100:/root/

# === 在遠端伺服器 ===
ssh root@192.168.1.100

cd /root
mkdir electronic-music
tar -xzf board-music.tar.gz -C electronic-music
cd electronic-music
npm install
npm start
```

然後開啟瀏覽器訪問 `http://192.168.1.100:3000`

## 💡 一鍵部署腳本

儲存成 `quick-deploy.sh`：

```bash
#!/bin/bash
set -e

echo "🚀 快速部署板樂遊戲..."

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 請先安裝 Node.js >= 18"
    exit 1
fi

# 安裝依賴
echo "📦 安裝依賴..."
npm install

# 啟動
echo "🎮 啟動伺服器..."
npm start
```

使用：
```bash
chmod +x quick-deploy.sh
./quick-deploy.sh
```

## 🎉 成功了嗎？

如果看到遊戲畫面，恭喜你部署成功！🎮

如果還有問題，請參考詳細的 [DEPLOYMENT.md](DEPLOYMENT.md)
