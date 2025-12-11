# 部署指南

## 部署到遠端 Debian VM

### 方法 1：使用 Git Clone（推薦）

如果你的專案已經推送到 GitHub：

```bash
# 在遠端伺服器上執行

# 1. Clone 專案
git clone https://github.com/your-username/electronic-music.git
cd electronic-music

# 2. 安裝依賴
npm install

# 3. 啟動伺服器
npm start
```

### 方法 2：使用 SCP 上傳

如果還沒推送到 GitHub，可以直接從本地上傳：

```bash
# 在本地 Mac 上執行

# 1. 打包專案（排除 node_modules）
tar -czf electronic-music.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.DS_Store' \
  .

# 2. 上傳到遠端伺服器
scp electronic-music.tar.gz root@your-server-ip:/root/

# 3. SSH 到遠端伺服器
ssh root@your-server-ip

# 4. 解壓縮
cd /root
tar -xzf electronic-music.tar.gz -C electronic-music
cd electronic-music

# 5. 安裝依賴
npm install

# 6. 啟動伺服器
npm start
```

### 方法 3：使用 rsync（更快速）

```bash
# 在本地 Mac 上執行

rsync -avz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.DS_Store' \
  ./ root@your-server-ip:/root/electronic-music/

# SSH 到伺服器
ssh root@your-server-ip

# 在遠端伺服器上
cd /root/electronic-music
npm install
npm start
```

## 遠端伺服器需求

### 1. 安裝 Node.js

```bash
# 檢查 Node.js 版本
node --version

# 如果沒有安裝或版本過舊（需要 >= 18）
# 安裝 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 驗證安裝
node --version
npm --version
```

### 2. 安裝 Git（如果使用方法 1）

```bash
apt-get update
apt-get install -y git
```

## 在遠端伺服器上運行

### 啟動方式

```bash
# 方式 1: 直接運行（終端關閉後程式會停止）
npm start

# 方式 2: 使用 nohup（背景運行）
nohup npm start > output.log 2>&1 &

# 方式 3: 使用 pm2（推薦用於生產環境）
npm install -g pm2
pm2 start src/server/index.js --name board-music
pm2 logs board-music
pm2 stop board-music
pm2 restart board-music
```

### 設定防火牆

如果伺服器有防火牆，需要開放 port 3000：

```bash
# UFW (Ubuntu/Debian)
ufw allow 3000

# iptables
iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

### 訪問遊戲

開啟瀏覽器，訪問：
```
http://your-server-ip:3000
```

## 常見問題排除

### 問題 1: "Cannot find package 'express'"

**原因**: 沒有安裝依賴

**解決**:
```bash
npm install
```

### 問題 2: "EADDRINUSE: address already in use"

**原因**: Port 3000 已被佔用

**解決方式 1**: 使用不同的 port
```bash
PORT=8080 npm start
```

**解決方式 2**: 找出並關閉佔用的程式
```bash
# 找出佔用 port 3000 的程式
lsof -i :3000
# 或
netstat -tulpn | grep 3000

# 關閉該程式
kill -9 <PID>
```

### 問題 3: 權限錯誤

```bash
# 給予執行權限
chmod +x src/server/index.js

# 或使用 sudo
sudo npm start
```

### 問題 4: 無法從外部訪問

**檢查清單**:
1. 伺服器是否正在運行？
   ```bash
   curl http://localhost:3000
   ```

2. 防火牆是否開放？
   ```bash
   ufw status
   ```

3. 使用正確的 IP？
   ```bash
   # 查看伺服器 IP
   ip addr show
   # 或
   hostname -I
   ```

## 生產環境建議

### 1. 使用環境變數

建立 `.env` 檔案：
```bash
PORT=3000
NODE_ENV=production
```

修改啟動方式：
```bash
npm install dotenv
```

在 `src/server/index.js` 開頭加入：
```javascript
import dotenv from 'dotenv';
dotenv.config();
```

### 2. 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. 設定 HTTPS（使用 Let's Encrypt）

```bash
apt-get install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

### 4. 使用 PM2 自動重啟

```bash
# 安裝 PM2
npm install -g pm2

# 啟動應用
pm2 start src/server/index.js --name board-music

# 設定開機自動啟動
pm2 startup
pm2 save

# 查看狀態
pm2 list
pm2 logs board-music
```

## 效能優化

### 1. 啟用 gzip 壓縮

在 `src/server/index.js` 加入：
```javascript
import compression from 'compression';
app.use(compression());
```

安裝：
```bash
npm install compression
```

### 2. 靜態資源快取

```javascript
app.use(express.static(join(rootDir, 'public'), {
  maxAge: '1d'
}));
```

### 3. 限制請求大小

```javascript
app.use(express.json({ limit: '1mb' }));
```

## 監控與日誌

### 使用 PM2 監控

```bash
# 即時監控
pm2 monit

# 查看日誌
pm2 logs board-music

# 清除日誌
pm2 flush
```

### 自訂日誌

在 `src/server/index.js` 加入：
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 備份

### 定期備份資料

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup"

# 備份專案
tar -czf $BACKUP_DIR/electronic-music-$DATE.tar.gz \
  /root/electronic-music

# 只保留最近 7 天的備份
find $BACKUP_DIR -name "electronic-music-*.tar.gz" -mtime +7 -delete
```

設定 cron 定期執行：
```bash
# 每天凌晨 2 點備份
0 2 * * * /root/backup.sh
```

## 更新應用

```bash
# 拉取最新程式碼
git pull origin main

# 安裝新依賴
npm install

# 重啟服務
pm2 restart board-music
```

## 檢查清單

部署前確認：
- [ ] Node.js >= 18 已安裝
- [ ] npm 已安裝
- [ ] 專案檔案已上傳
- [ ] `npm install` 已執行
- [ ] Port 3000 可訪問
- [ ] 防火牆已設定

部署後確認：
- [ ] 伺服器正常啟動
- [ ] 網頁可以開啟
- [ ] WebSocket 連線正常
- [ ] 可以選歌並遊玩
- [ ] 遊戲結束顯示結果

## 快速部署腳本

建立 `deploy.sh`：

```bash
#!/bin/bash

echo "🚀 開始部署..."

# 1. 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安裝"
    exit 1
fi

# 2. 安裝依賴
echo "📦 安裝依賴..."
npm install

# 3. 停止舊的程式（如果有）
pm2 stop board-music 2>/dev/null || true

# 4. 啟動新程式
echo "🎮 啟動服務..."
pm2 start src/server/index.js --name board-music

# 5. 顯示狀態
pm2 list

echo "✅ 部署完成！"
echo "🌐 訪問 http://$(hostname -I | awk '{print $1}'):3000"
```

使用：
```bash
chmod +x deploy.sh
./deploy.sh
```
