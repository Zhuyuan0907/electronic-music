# 快速參考卡

## 🚀 立即開始

```bash
# 1. 安裝依賴
npm install

# 2. 啟動伺服器
npm start

# 3. 開啟瀏覽器
# http://localhost:3000
```

## 🎮 遊戲操作

| 按鍵 | 功能 |
|------|------|
| `D` | 軌道 1 |
| `F` | 軌道 2 |
| `J` | 軌道 3 |
| `K` | 軌道 4 |

## 📁 重要檔案

| 檔案 | 說明 |
|------|------|
| [README.md](README.md) | 專案介紹 |
| [GETTING_STARTED.md](GETTING_STARTED.md) | 詳細教學 |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | 完整總結 |
| [charts/AI_GENERATION_GUIDE.md](charts/AI_GENERATION_GUIDE.md) | AI 生成指南 |

## 🎵 新增歌曲

### 方法 1: 複製範例
```bash
cp charts/examples/demo-easy.json charts/examples/my-song.json
# 編輯 my-song.json
```

### 方法 2: 使用 AI

提示詞範本：
```
請生成一個音樂遊戲譜面 JSON：
- 歌名: "你的歌名"
- BPM: 120
- 長度: 60 秒
- 難度: NORMAL

格式請參考：
[貼上 charts/schema.json 內容]
```

## 🔧 常用指令

```bash
# 開發模式（自動重啟）
npm run dev

# 正式模式
npm start

# 除錯 LED（終端機顯示）
DEBUG_LEDS=1 npm start
```

## 📊 判定標準

| 判定 | 時間差 | 分數 |
|------|--------|------|
| PERFECT | ±50ms | 1000 |
| GREAT | ±100ms | 500 |
| GOOD | ±150ms | 200 |
| MISS | >150ms | 0 |

## 🎨 自訂設定

### 修改遊戲速度
編輯譜面的 `gameConfig.noteSpeed`:
- `1.0` = 正常
- `1.5` = 快速
- `0.5` = 慢速

### 修改判定視窗
編輯 [src/server/gameEngine.js](src/server/gameEngine.js):
```javascript
this.judgeWindows = {
  perfect: 50,   // 改這裡
  great: 100,
  good: 150
};
```

### 修改外觀顏色
編輯 [public/css/style.css](public/css/style.css):
```css
:root {
  --accent-primary: #e94560;  /* 主色調 */
  --accent-secondary: #00d4ff; /* 次色調 */
}
```

## 🔌 硬體整合

### GPIO 引腳（樹莓派）

**LED 引腳**: GPIO 2-26（參考 [src/hardware/README.md](src/hardware/README.md)）

**按鈕引腳**:
- 軌道 0: GPIO 26
- 軌道 1: GPIO 27
- 軌道 2: GPIO 22
- 軌道 3: GPIO 23

### 啟用硬體模式
1. 安裝: `npm install onoff`
2. 編輯 `src/hardware/controller.js`
3. 取消註解 GPIO 載入代碼

## 🐛 除錯技巧

### 檢查伺服器
```bash
# 查看伺服器 log
npm start

# 應該看到:
# 🎮 Board Music Game Server running on http://localhost:3000
# 🔌 Hardware: Simulated Mode
```

### 檢查瀏覽器
按 `F12` 打開開發者工具：
- **Console**: 查看錯誤訊息
- **Network**: 檢查 WebSocket 連線
- **Application**: 查看連線狀態

### 常見問題

**Q: 看不到歌曲？**
- 檢查 `charts/examples/` 有 `.json` 檔案
- 重新整理網頁

**Q: 按鍵沒反應？**
- 確認已進入遊戲畫面
- 使用 D/F/J/K 鍵

**Q: 連線失敗？**
- 確認伺服器已啟動
- 檢查埠號 3000 是否被佔用

## 📦 專案結構速查

```
electronic-music/
├── src/
│   ├── server/         # 後端邏輯
│   └── hardware/       # GPIO 控制
├── public/             # 前端靜態檔案
│   ├── index.html
│   ├── css/
│   └── js/
├── charts/             # 譜面檔案
│   └── examples/       # 放譜面這裡
├── package.json        # 依賴設定
└── README.md          # 說明文件
```

## 🎯 下一步建議

1. ✅ 測試遊戲：玩玩看兩首範例歌曲
2. ✅ 創建譜面：使用 AI 生成新譜面
3. ✅ 自訂外觀：修改顏色和樣式
4. ⏭️ 硬體整合：在樹莓派上測試

## 💡 實用連結

- [JSON Schema 驗證器](https://www.jsonschemavalidator.net/)
- [BPM 計算器](https://www.all8.com/tools/bpm.htm)
- [樹莓派 GPIO 參考](https://pinout.xyz/)

## 📞 需要幫助？

查看詳細文檔：
- [GETTING_STARTED.md](GETTING_STARTED.md) - 完整教學
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - 專案總覽
- [charts/README.md](charts/README.md) - 譜面格式

---

**祝你玩得開心！** 🎮🎵
