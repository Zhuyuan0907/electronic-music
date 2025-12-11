# 板樂 (Board Music Game)

一個結合樹莓派硬體與網頁介面的下落式音樂遊戲。

## 專案特色

- 🎮 實體硬體互動：麵包板上的 LED 燈與按鈕
- 🌐 網頁即時同步：顯示硬體狀態與遊戲畫面
- 🎵 AI 友善譜面格式：易於 AI 生成譜面
- 🔌 模組化設計：可單獨在網頁或硬體上運行

## 系統架構

```
┌─────────────┐         WebSocket          ┌──────────────┐
│  Web Client │ ◄─────────────────────────► │ Node.js      │
│  (Browser)  │                             │ Server       │
└─────────────┘                             └──────┬───────┘
                                                   │
                                                   │ GPIO
                                                   ▼
                                            ┌──────────────┐
                                            │ Raspberry Pi │
                                            │ Hardware     │
                                            └──────────────┘
```

## 硬體配置

- **軌道數量**: 3-5 條
- **每條軌道**: 垂直排列的 LED 燈 + 底部按鈕
- **遊戲方式**: LED 燈從上往下亮，玩家在到達底部時按按鈕

## 安裝與執行

```bash
# 安裝依賴
npm install

# 開發模式（自動重啟）
npm run dev

# 正式執行
npm start
```

## 譜面格式

請參考 [charts/README.md](charts/README.md) 了解譜面格式規範。

## 目錄結構

```
.
├── src/
│   ├── server/          # Node.js 後端
│   ├── client/          # 網頁前端
│   └── hardware/        # 硬體控制邏輯
├── charts/              # 譜面檔案
└── public/              # 靜態資源
```

## 授權

MIT License
