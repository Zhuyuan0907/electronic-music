# 快速開始

## 專案簡介

「板樂」是一個結合樹莓派硬體與網頁的下落式音樂遊戲。這份文件將幫助你快速啟動專案。

## 系統需求

- Node.js >= 18.0
- npm >= 9.0
- （可選）樹莓派 3B+ 或更新版本
- （可選）麵包板、LED、按鈕等硬體元件

## 安裝步驟

### 1. 安裝依賴

```bash
npm install
```

### 2. 啟動伺服器

開發模式（自動重啟）：
```bash
npm run dev
```

正式模式：
```bash
npm start
```

### 3. 開啟瀏覽器

訪問 `http://localhost:3000`

## 功能測試

### 測試選歌功能

1. 啟動伺服器後，開啟瀏覽器
2. 你應該會看到兩首範例歌曲：
   - Demo Song (EASY)
   - Digital Dreams (HARD)
3. 點擊任一歌曲卡片開始遊戲

### 測試遊戲功能

遊戲控制（鍵盤）：
- `D` 鍵：第 1 軌道
- `F` 鍵：第 2 軌道
- `J` 鍵：第 3 軌道
- `K` 鍵：第 4 軌道

提示：音符從上往下落，當到達底部紅線時按對應按鍵！

## 創建自己的譜面

### 方法 1: 手動編寫

1. 複製 [charts/examples/demo-easy.json](charts/examples/demo-easy.json)
2. 修改 metadata 和 notes 陣列
3. 儲存到 `charts/examples/` 目錄
4. 重新整理網頁即可看到新歌曲

### 方法 2: 使用 AI 生成

請參考 [charts/AI_GENERATION_GUIDE.md](charts/AI_GENERATION_GUIDE.md)

#### 範例 Prompt（給 ChatGPT/Claude）：

```
請根據以下資訊生成一個音樂遊戲譜面（JSON 格式）：

歌曲資訊：
- 標題: "夜空中最亮的星"
- 藝術家: "逃跑計劃"
- BPM: 80
- 長度: 240 秒
- 難度: NORMAL
- Level: 5

請使用 4 條軌道，音符應該跟隨歌曲的節奏。

請依照這個格式輸出：
[貼上 charts/schema.json 內容]
```

## 硬體整合

### 在樹莓派上運行

1. 將專案複製到樹莓派
2. 安裝 GPIO 函式庫：
   ```bash
   npm install onoff
   ```
3. 修改 `src/hardware/controller.js`，啟用 GPIO 功能
4. 連接硬體（參考 [src/hardware/README.md](src/hardware/README.md)）
5. 使用 root 權限或加入 gpio 群組後執行

### 硬體配置

請參考 [src/hardware/README.md](src/hardware/README.md) 了解：
- GPIO 引腳配置
- LED 接線方式
- 按鈕接線方式
- 測試方法

## 專案結構

```
.
├── src/
│   ├── server/           # Node.js 後端
│   │   ├── index.js      # 主伺服器
│   │   ├── gameEngine.js # 遊戲邏輯
│   │   └── chartManager.js # 譜面管理
│   └── hardware/         # 硬體控制
│       ├── controller.js # GPIO 控制器
│       └── README.md     # 硬體說明
├── public/               # 前端靜態檔案
│   ├── index.html        # 主頁面
│   ├── css/              # 樣式
│   └── js/               # 前端 JavaScript
│       ├── websocket.js  # WebSocket 通訊
│       ├── game.js       # 遊戲渲染
│       ├── ui.js         # UI 管理
│       └── main.js       # 主程式
├── charts/               # 譜面檔案
│   ├── schema.json       # JSON Schema
│   ├── README.md         # 譜面格式說明
│   ├── AI_GENERATION_GUIDE.md # AI 生成指南
│   └── examples/         # 範例譜面
└── package.json          # 專案設定
```

## 常見問題

### Q: 為什麼看不到歌曲列表？

A: 檢查：
1. 伺服器是否正常啟動
2. 瀏覽器 Console 是否有錯誤訊息
3. `charts/examples/` 目錄是否有 `.json` 檔案

### Q: 按鍵沒有反應？

A: 確認：
1. 遊戲是否已開始（不是在選歌畫面）
2. 使用 D、F、J、K 鍵
3. 檢查瀏覽器 Console 的錯誤訊息

### Q: 如何調整遊戲難度？

A: 編輯譜面的 `gameConfig.noteSpeed`：
- 1.0 = 正常速度
- 1.5 = 1.5 倍速（更難）
- 0.8 = 0.8 倍速（更簡單）

### Q: 可以添加音訊檔案嗎？

A: 目前版本沒有音訊播放功能，主要聚焦在遊戲機制。
未來可以擴展添加 Web Audio API 支援。

## 下一步

1. **創建更多譜面**：使用 AI 或手動創建
2. **調整遊戲參數**：修改判定視窗、速度等
3. **自訂外觀**：編輯 `public/css/style.css`
4. **硬體整合**：在樹莓派上測試實體控制

## 貢獻

歡迎提交 Issue 或 Pull Request！

## 授權

MIT License

## 聯絡方式

有問題請開 Issue 討論。
