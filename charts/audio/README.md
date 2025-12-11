# 音訊檔案目錄

這個目錄用來存放遊戲音樂檔案。

## 支援格式

- MP3（推薦）
- WAV
- OGG

## 如何添加音樂

### 方法 1: 使用自己的音樂

1. 將音樂檔案放到這個目錄
2. 在譜面 JSON 中設定 `audioFile` 欄位

範例：
```json
{
  "metadata": {
    "audioFile": "audio/my-song.mp3"
  }
}
```

### 方法 2: 使用線上音樂（免費資源）

可以從以下網站下載免費音樂：

- **YouTube Audio Library**: https://www.youtube.com/audiolibrary
- **Free Music Archive**: https://freemusicarchive.org/
- **Incompetech**: https://incompetech.com/music/
- **Bensound**: https://www.bensound.com/

### 方法 3: 暫時沒有音樂

如果暫時沒有音樂檔案：

1. 可以不設定 `audioFile`，遊戲仍然可以玩
2. 或者使用節拍器音效
3. 或者在瀏覽器另開分頁播放音樂

## 示範音樂

### 創建簡單的測試音訊

你可以使用線上工具生成簡單的節拍音效：

1. **Online Tone Generator**: https://onlinetonegenerator.com/
2. **Beepbox**: https://www.beepbox.co/
3. **TTS (文字轉語音)**: 可以生成倒數音效

### 或使用 Web Audio API 生成

在瀏覽器控制台執行：

```javascript
// 創建一個簡單的節拍音效
const audioContext = new AudioContext();
const oscillator = audioContext.createOscillator();
const gainNode = audioContext.createGain();

oscillator.connect(gainNode);
gainNode.connect(audioContext.destination);

oscillator.frequency.value = 440; // A4 音符
oscillator.type = 'sine';

gainNode.gain.value = 0.3;

oscillator.start();
setTimeout(() => oscillator.stop(), 200); // 播放 200ms
```

## 音樂同步

如果音樂和遊戲不同步，可以調整 `offset` 值：

```json
{
  "metadata": {
    "offset": 100  // 延遲 100ms 開始播放音樂
  }
}
```

- 正值 = 音樂延遲播放
- 負值 = 音樂提前播放

## 檔案大小建議

- 遊戲音樂建議 < 10 MB
- 可以使用 MP3 壓縮減小檔案大小
- 建議品質：128-192 kbps

## 版權注意

請確保你使用的音樂有合法授權：
- 使用自己創作的音樂
- 使用免費/開源音樂
- 取得適當的授權

## 目錄結構

```
charts/audio/
├── README.md          # 這個檔案
├── demo.mp3           # 示範音樂（需要自行添加）
└── your-song.mp3      # 你的音樂檔案
```

## 快速測試

如果想快速測試音樂功能，可以：

1. 下載任何一首 MP3
2. 重新命名為 `demo.mp3`
3. 放到這個目錄
4. 重新整理遊戲頁面

遊戲會自動載入音樂！
