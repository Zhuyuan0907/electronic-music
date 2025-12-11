# 硬體配置說明

## GPIO 引腳配置

### LED 引腳（輸出）

假設使用 4 條軌道，每條 5 個 LED：

| 軌道 | LED 位置 | GPIO 引腳 | 物理引腳 |
|------|---------|-----------|---------|
| 0 | LED 0 (頂部) | GPIO 2 | Pin 3 |
| 0 | LED 1 | GPIO 3 | Pin 5 |
| 0 | LED 2 | GPIO 4 | Pin 7 |
| 0 | LED 3 | GPIO 17 | Pin 11 |
| 0 | LED 4 (底部) | GPIO 27 | Pin 13 |
| 1 | LED 0 | GPIO 22 | Pin 15 |
| 1 | LED 1 | GPIO 10 | Pin 19 |
| 1 | LED 2 | GPIO 9 | Pin 21 |
| 1 | LED 3 | GPIO 11 | Pin 23 |
| 1 | LED 4 | GPIO 5 | Pin 29 |
| 2 | LED 0 | GPIO 6 | Pin 31 |
| 2 | LED 1 | GPIO 13 | Pin 33 |
| 2 | LED 2 | GPIO 19 | Pin 35 |
| 2 | LED 3 | GPIO 26 | Pin 37 |
| 2 | LED 4 | GPIO 14 | Pin 8 |
| 3 | LED 0 | GPIO 15 | Pin 10 |
| 3 | LED 1 | GPIO 18 | Pin 12 |
| 3 | LED 2 | GPIO 23 | Pin 16 |
| 3 | LED 3 | GPIO 24 | Pin 18 |
| 3 | LED 4 | GPIO 25 | Pin 22 |

### 按鈕引腳（輸入，上拉）

| 軌道 | GPIO 引腳 | 物理引腳 |
|------|-----------|---------|
| 0 | GPIO 26 | Pin 37 |
| 1 | GPIO 27 | Pin 13 |
| 2 | GPIO 22 | Pin 15 |
| 3 | GPIO 23 | Pin 16 |

## 硬體接線

### LED 接線
- 每個 LED 需要一個限流電阻（約 220Ω - 330Ω）
- LED 陽極（長腳）→ 電阻 → GPIO 引腳
- LED 陰極（短腳）→ GND

### 按鈕接線
- 按鈕一端 → GPIO 引腳（已設定內部上拉電阻）
- 按鈕另一端 → GND
- 按下時 GPIO 讀到 LOW (0)
- 鬆開時 GPIO 讀到 HIGH (1)

## 安裝 GPIO 函式庫

在樹莓派上執行：

```bash
npm install onoff
```

或使用 pigpio（更精確的時序控制）：

```bash
npm install pigpio
```

## 啟用硬體模式

修改 [controller.js](controller.js) 的 `tryLoadGPIO()` 方法，取消註解對應的程式碼：

```javascript
async tryLoadGPIO() {
  try {
    const { Gpio } = await import('onoff');
    this.setupGPIO(Gpio);
  } catch (error) {
    this.simulatedMode = true;
  }
}
```

## 測試硬體

可以建立一個測試腳本來驗證 LED 和按鈕：

```javascript
import HardwareController from './controller.js';

const hw = new HardwareController();

// 測試 LED（跑馬燈）
async function testLEDs() {
  for (let lane = 0; lane < 4; lane++) {
    for (let led = 0; led < 5; led++) {
      const state = Array(4).fill(null).map(() => Array(5).fill(false));
      state[lane][led] = true;
      hw.updateLEDs(state);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  hw.clearAllLEDs();
}

testLEDs();
```

## 注意事項

1. **電流限制**: 樹莓派 GPIO 每個引腳最大輸出 16mA，請確保使用適當的限流電阻
2. **總電流**: 所有 GPIO 引腳總電流不超過 50mA
3. **電壓**: GPIO 輸出為 3.3V，請使用 3.3V LED 或適當的電阻
4. **靜電保護**: 操作時注意靜電防護
5. **權限**: 可能需要 root 權限或將使用者加入 `gpio` 群組

## 模擬模式

在沒有硬體的環境（如開發機器），系統會自動進入模擬模式。

啟用除錯輸出：

```bash
DEBUG_LEDS=1 npm start
```

這會在終端機顯示 LED 狀態。
