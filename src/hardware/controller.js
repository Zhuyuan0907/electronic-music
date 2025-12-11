/**
 * 硬體控制器
 * 在樹莓派上運行時控制 GPIO，否則使用模擬模式
 */

class HardwareController {
  constructor() {
    this.simulatedMode = true;
    this.gpio = null;
    this.ledPins = [];
    this.buttonPins = [];

    this.initializeHardware();
  }

  /**
   * 初始化硬體
   */
  initializeHardware() {
    try {
      // 嘗試載入 GPIO 函式庫（只在樹莓派上有效）
      // 使用動態 import 避免在非樹莓派環境報錯
      this.tryLoadGPIO();
    } catch (error) {
      console.log('⚠️  GPIO not available, running in simulated mode');
      this.simulatedMode = true;
    }
  }

  /**
   * 嘗試載入 GPIO 函式庫
   */
  async tryLoadGPIO() {
    try {
      // 當在樹莓派上時，可以使用 'onoff' 或 'pigpio' 套件
      // npm install onoff
      // const { Gpio } = await import('onoff');
      // this.setupGPIO(Gpio);

      // 目前使用模擬模式
      throw new Error('GPIO library not loaded');
    } catch (error) {
      this.simulatedMode = true;
    }
  }

  /**
   * 設定 GPIO（當在樹莓派上運行時）
   */
  setupGPIO(Gpio) {
    // GPIO 引腳配置（範例）
    // 假設 4 條軌道，每條 5 個 LED，共 20 個 LED
    // 加上 4 個按鈕
    const config = {
      lanes: 4,
      ledsPerLane: 5,
      ledPinStart: 2,    // 從 GPIO 2 開始
      buttonPins: [26, 27, 22, 23]  // 4 個按鈕的 GPIO 編號
    };

    // 初始化 LED 引腳（輸出）
    this.ledPins = [];
    for (let lane = 0; lane < config.lanes; lane++) {
      const laneLeds = [];
      for (let led = 0; led < config.ledsPerLane; led++) {
        const pinNumber = config.ledPinStart + (lane * config.ledsPerLane) + led;
        laneLeds.push(new Gpio(pinNumber, 'out'));
      }
      this.ledPins.push(laneLeds);
    }

    // 初始化按鈕引腳（輸入，上拉電阻）
    this.buttonPins = config.buttonPins.map((pin, index) => {
      const button = new Gpio(pin, 'in', 'rising', { debounceTimeout: 10 });

      // 按鈕按下事件
      button.watch((err, value) => {
        if (err) {
          console.error(`Button ${index} error:`, err);
          return;
        }
        if (value === 1) {
          this.handleButtonPress(index);
        }
      });

      return button;
    });

    this.simulatedMode = false;
    console.log('✅ GPIO initialized successfully');
  }

  /**
   * 更新 LED 顯示
   * @param {Array} ledStates - 二維陣列 [lane][ledIndex] = boolean
   */
  updateLEDs(ledStates) {
    if (this.simulatedMode) {
      // 模擬模式：輸出到終端機
      this.displaySimulatedLEDs(ledStates);
      return;
    }

    // 實際硬體模式
    for (let lane = 0; lane < ledStates.length; lane++) {
      const laneLeds = ledStates[lane];
      for (let led = 0; led < laneLeds.length; led++) {
        const shouldBeOn = laneLeds[led] || false;
        if (this.ledPins[lane] && this.ledPins[lane][led]) {
          this.ledPins[lane][led].writeSync(shouldBeOn ? 1 : 0);
        }
      }
    }
  }

  /**
   * 顯示模擬 LED（終端機輸出）
   */
  displaySimulatedLEDs(ledStates) {
    // 在開發模式下，可以在終端機顯示 LED 狀態
    // 這裡簡化處理，實際可以用更美觀的方式顯示
    if (process.env.DEBUG_LEDS) {
      const display = ledStates.map((lane, laneIdx) => {
        const leds = lane.map(state => state ? '●' : '○').join(' ');
        return `Lane ${laneIdx}: ${leds}`;
      }).join(' | ');

      // 使用 \r 覆蓋當前行
      process.stdout.write('\r' + display + '     ');
    }
  }

  /**
   * 清除所有 LED
   */
  clearAllLEDs() {
    if (this.simulatedMode) {
      if (process.env.DEBUG_LEDS) {
        process.stdout.write('\r' + ' '.repeat(100) + '\r');
      }
      return;
    }

    for (const laneLeds of this.ledPins) {
      for (const led of laneLeds) {
        led.writeSync(0);
      }
    }
  }

  /**
   * 處理按鈕按壓（由 GPIO 中斷觸發）
   */
  handleButtonPress(lane) {
    // 這個方法會由 GPIO 事件觸發
    // 實際處理由 GameEngine 負責
    console.log(`Button pressed: Lane ${lane}`);
  }

  /**
   * 檢查硬體是否可用
   */
  isAvailable() {
    return !this.simulatedMode;
  }

  /**
   * 清理資源
   */
  cleanup() {
    if (this.simulatedMode) return;

    // 清除所有 LED
    this.clearAllLEDs();

    // 釋放 GPIO 資源
    for (const laneLeds of this.ledPins) {
      for (const led of laneLeds) {
        led.unexport();
      }
    }

    for (const button of this.buttonPins) {
      button.unexport();
    }

    console.log('🧹 Hardware cleaned up');
  }
}

export default HardwareController;
