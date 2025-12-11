# 譜面格式說明

## 設計理念

這個譜面格式專為 **AI 生成** 而設計，具有以下特點：

1. **簡單直觀**: JSON 格式，易於解析和生成
2. **時間精確**: 使用毫秒為單位，支援精確的音符時間
3. **可擴展**: 支援未來新增功能（長按、滑動等）
4. **語義清晰**: 欄位命名清楚，AI 容易理解

## 格式規範

### Chart 檔案結構

```json
{
  "metadata": {
    "title": "歌曲名稱",
    "artist": "藝術家",
    "charter": "譜師名稱（可填 AI）",
    "difficulty": "EASY|NORMAL|HARD|EXPERT",
    "level": 1-15,
    "bpm": 120,
    "offset": 0,
    "duration": 180000,
    "audioFile": "audio/song.mp3",
    "previewStart": 30000,
    "createdAt": "2025-12-11T00:00:00Z",
    "description": "譜面描述"
  },
  "gameConfig": {
    "lanes": 4,
    "noteSpeed": 1.0,
    "judgeOffset": 0
  },
  "notes": [
    {
      "time": 1000,
      "lane": 0,
      "type": "tap",
      "duration": 0
    }
  ],
  "timing": [
    {
      "time": 0,
      "bpm": 120
    }
  ]
}
```

## 欄位說明

### metadata（元資料）

| 欄位 | 類型 | 說明 | 必填 |
|------|------|------|------|
| `title` | string | 歌曲名稱 | ✅ |
| `artist` | string | 藝術家 | ✅ |
| `charter` | string | 譜師（AI 可填 "AI Generated"） | ✅ |
| `difficulty` | string | 難度等級 | ✅ |
| `level` | number | 難度數值 (1-15) | ✅ |
| `bpm` | number | 每分鐘節拍數 | ✅ |
| `offset` | number | 音訊偏移（毫秒） | ❌ |
| `duration` | number | 歌曲長度（毫秒） | ✅ |
| `audioFile` | string | 音訊檔案路徑 | ✅ |
| `previewStart` | number | 預覽起始時間（毫秒） | ❌ |
| `createdAt` | string | 建立時間 (ISO 8601) | ❌ |
| `description` | string | 譜面描述 | ❌ |

### gameConfig（遊戲配置）

| 欄位 | 類型 | 說明 | 預設值 |
|------|------|------|--------|
| `lanes` | number | 軌道數量 (3-5) | 4 |
| `noteSpeed` | number | 音符速度倍率 | 1.0 |
| `judgeOffset` | number | 判定偏移（毫秒） | 0 |

### notes（音符陣列）

每個音符物件包含：

| 欄位 | 類型 | 說明 | 值範圍 |
|------|------|------|--------|
| `time` | number | 音符時間（毫秒） | >= 0 |
| `lane` | number | 軌道編號 | 0 ~ (lanes-1) |
| `type` | string | 音符類型 | "tap", "hold", "slide" |
| `duration` | number | 持續時間（毫秒，僅 hold 使用） | >= 0 |

**音符類型說明：**
- `tap`: 單點音符（基本款）
- `hold`: 長按音符（未來實作）
- `slide`: 滑動音符（未來實作）

### timing（變速點陣列）

支援 BPM 變化（可選）：

| 欄位 | 類型 | 說明 |
|------|------|------|
| `time` | number | 變速時間點（毫秒） |
| `bpm` | number | 新的 BPM 值 |

## AI 生成指南

### 給 AI 的提示詞範例

```
請根據以下資訊生成一個音樂遊戲譜面（JSON 格式）：

歌曲資訊：
- 標題：[歌名]
- BPM：[節拍數]
- 長度：[秒數]
- 難度：[EASY/NORMAL/HARD/EXPERT]

規則：
1. 使用 4 條軌道（lane: 0-3）
2. 音符在強拍和重音處
3. 難度越高，音符密度越大
4. 避免過於困難的連打（單手物理極限：16分音符）
5. 保持良好的節奏感

請輸出符合以下 JSON Schema 的譜面：
[貼上 schema.json 內容]
```

### 生成建議

1. **簡單難度 (EASY)**:
   - 主要在強拍（每拍第一下）
   - 單軌道為主，少量雙押
   - BPM 120 時，最小間隔 >= 500ms

2. **普通難度 (NORMAL)**:
   - 強拍 + 部分弱拍
   - 適量雙押
   - 最小間隔 >= 250ms

3. **困難難度 (HARD)**:
   - 所有拍點都可能有音符
   - 頻繁雙押和三押
   - 最小間隔 >= 125ms

4. **專家難度 (EXPERT)**:
   - 高密度音符
   - 複雜節奏型
   - 最小間隔 >= 62.5ms（16分音符）

## JSON Schema

完整的 Schema 定義請參考 [schema.json](schema.json)

## 範例譜面

請參考 [examples/](examples/) 目錄中的範例檔案。
