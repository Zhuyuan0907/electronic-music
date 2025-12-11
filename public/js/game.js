/**
 * 遊戲渲染引擎（Canvas + 音樂）
 */

class GameRenderer {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.chart = null;
    this.isPlaying = false;
    this.startTime = null;
    this.notes = [];
    this.activeNotes = [];
    this.animationId = null;
    this.audio = null; // 音樂播放器

    // 遊戲配置
    this.config = {
      lanes: 4,
      noteSpeed: 1.0,
      ledsPerLane: 5, // 每條軌道有 5 個 LED
      laneWidth: 120,
      judgeLineY: 0.85, // 判定線位置（畫面的 85%）
      noteLeadTime: 2000 // 音符提前顯示時間（毫秒）
    };

    // LED 狀態（模擬硬體）
    this.ledStates = [];

    // 鍵盤映射
    this.keyMap = {
      'KeyD': 0, // 軌道 0
      'KeyF': 1, // 軌道 1
      'KeyJ': 2, // 軌道 2
      'KeyK': 3  // 軌道 3
    };

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.setupKeyboard();

    console.log('🎮 Game renderer initialized');
    console.log('Canvas size:', this.canvas.width, 'x', this.canvas.height);
  }

  /**
   * 調整 Canvas 大小
   */
  resizeCanvas() {
    const container = this.canvas.parentElement;
    this.canvas.width = Math.min(800, container.clientWidth - 40);
    this.canvas.height = 600; // 固定高度，避免計算問題

    this.config.laneWidth = this.canvas.width / this.config.lanes;
    this.config.judgeLineY = this.canvas.height * 0.85;

    // 繪製初始畫面
    if (!this.isPlaying) {
      this.drawInitialScreen();
    }
  }

  /**
   * 繪製初始畫面（遊戲開始前）
   */
  drawInitialScreen() {
    this.clear();
    this.drawBreadboard();

    // 初始化所有 LED 為熄滅狀態
    this.ledStates = Array(this.config.lanes).fill(null).map(() =>
      Array(this.config.ledsPerLane).fill(false)
    );

    this.drawLEDs();
    this.drawButtons();
    this.drawLanes();

    // 顯示提示文字
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('準備開始...', this.canvas.width / 2, this.canvas.height / 2);

    ctx.font = '16px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('使用 D F J K 鍵遊玩', this.canvas.width / 2, this.canvas.height / 2 + 40);
  }

  /**
   * 設定鍵盤控制
   */
  setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (!this.isPlaying) return;

      const lane = this.keyMap[e.code];
      if (lane !== undefined) {
        this.handleInput(lane);
        this.showLanePress(lane);
      }
    });

    // 滑鼠點擊支援
    this.canvas.addEventListener('click', (e) => {
      if (!this.isPlaying) return;

      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 計算點擊的是哪個軌道
      const lane = Math.floor(x / this.config.laneWidth);
      if (lane >= 0 && lane < this.config.lanes) {
        this.handleInput(lane);
        this.showLanePress(lane);
      }
    });
  }

  /**
   * 開始遊戲
   */
  start(chart) {
    console.log('🎮 Starting game with chart:', chart.metadata.title);

    this.chart = chart;
    this.config.lanes = chart.gameConfig.lanes || 4;
    this.config.noteSpeed = chart.gameConfig.noteSpeed || 1.0;
    this.notes = [...chart.notes];
    this.activeNotes = [];
    this.isPlaying = true;
    this.startTime = Date.now();

    // 初始化 LED 狀態
    this.ledStates = Array(this.config.lanes).fill(null).map(() =>
      Array(this.config.ledsPerLane).fill(false)
    );

    console.log('LED states initialized:', this.ledStates.length, 'lanes');
    console.log('Total notes:', this.notes.length);

    // 嘗試播放音樂（如果有音訊檔案）
    this.playAudio();

    this.resizeCanvas();
    this.render();
  }

  /**
   * 停止遊戲
   */
  stop() {
    this.isPlaying = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    // 停止音樂
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.clear();
  }

  /**
   * 播放音樂
   */
  playAudio() {
    if (!this.chart.metadata.audioFile) return;

    try {
      this.audio = new Audio(`/charts/${this.chart.metadata.audioFile}`);
      this.audio.volume = 0.5; // 音量 50%

      // 延遲播放以同步遊戲開始
      const offset = this.chart.metadata.offset || 0;
      setTimeout(() => {
        if (this.isPlaying && this.audio) {
          this.audio.play().catch(err => {
            console.warn('音訊播放失敗（可能需要使用者互動）:', err);
          });
        }
      }, Math.max(0, -offset));
    } catch (error) {
      console.warn('無法載入音訊檔案:', error);
    }
  }

  /**
   * 處理輸入
   */
  handleInput(lane) {
    const currentTime = Date.now() - this.startTime;

    // 通知伺服器
    window.wsClient.send({
      type: 'buttonPress',
      lane: lane,
      time: currentTime
    });
  }

  /**
   * 顯示軌道按壓效果
   */
  showLanePress(lane) {
    // 視覺回饋會在 render 中處理
    this.lanePressTime = this.lanePressTime || {};
    this.lanePressTime[lane] = Date.now();
  }

  /**
   * 添加活躍音符
   */
  addActiveNote(noteData) {
    this.activeNotes.push({
      time: noteData.time,
      lane: noteData.lane,
      type: noteData.type,
      active: true
    });
  }

  /**
   * 移除音符
   */
  removeNote(lane, time) {
    this.activeNotes = this.activeNotes.filter(
      note => !(note.lane === lane && note.time === time)
    );
  }

  /**
   * 主渲染循環
   */
  render() {
    if (!this.isPlaying) return;

    const currentTime = Date.now() - this.startTime;

    // 更新 LED 狀態
    this.updateLEDStates(currentTime);

    // 繪製
    this.clear();
    this.drawBreadboard(); // 麵包板背景
    this.drawLEDs(); // LED 燈
    this.drawButtons(); // 按鈕
    this.drawLanes(); // 軌道線（淡化）
    this.drawJudgeLine(); // 判定線
    this.drawNotes(currentTime); // 音符
    this.drawLanePress(); // 按壓效果

    this.animationId = requestAnimationFrame(() => this.render());
  }

  /**
   * 更新 LED 狀態（模擬硬體）
   */
  updateLEDStates(currentTime) {
    const { lanes, ledsPerLane, noteLeadTime, noteSpeed, judgeLineY } = this.config;

    // 重置所有 LED
    this.ledStates = Array(lanes).fill(null).map(() =>
      Array(ledsPerLane).fill(false)
    );

    // 根據活躍音符點亮 LED
    this.activeNotes.forEach(note => {
      const timeUntilHit = note.time - currentTime;
      const progress = 1 - (timeUntilHit / (noteLeadTime / noteSpeed));

      if (progress >= 0 && progress <= 1) {
        // 計算應該亮哪個 LED（從上到下）
        const ledIndex = Math.floor(progress * ledsPerLane);
        if (ledIndex >= 0 && ledIndex < ledsPerLane) {
          this.ledStates[note.lane][ledIndex] = true;
        }
      }
    });
  }

  /**
   * 清空畫布
   */
  clear() {
    // 深色背景
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 繪製麵包板背景
   */
  drawBreadboard() {
    const { lanes, laneWidth } = this.config;

    // 麵包板底板（淺咖啡色）
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#2a2520');
    gradient.addColorStop(1, '#1f1b18');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 麵包板孔洞紋理（簡化版）
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    const holeSize = 3;
    const holeSpacing = 20;

    for (let y = 20; y < this.canvas.height; y += holeSpacing) {
      for (let x = 20; x < this.canvas.width; x += holeSpacing) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, holeSize, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  /**
   * 繪製 LED 燈（模擬實體硬體）
   */
  drawLEDs() {
    const { lanes, ledsPerLane, laneWidth } = this.config;
    const ledRadius = 12; // LED 半徑
    const ledSpacing = (this.canvas.height * 0.75) / (ledsPerLane + 1);

    // 確保 ledStates 已初始化
    if (!this.ledStates || this.ledStates.length === 0) {
      this.ledStates = Array(lanes).fill(null).map(() =>
        Array(ledsPerLane).fill(false)
      );
    }

    for (let lane = 0; lane < lanes; lane++) {
      const centerX = lane * laneWidth + laneWidth / 2;

      for (let led = 0; led < ledsPerLane; led++) {
        const y = ledSpacing * (led + 1);
        const isOn = this.ledStates[lane] && this.ledStates[lane][led];

        this.drawLED(centerX, y, ledRadius, isOn);
      }
    }
  }

  /**
   * 繪製單個 LED
   */
  drawLED(x, y, radius, isOn) {
    const ctx = this.ctx;

    if (isOn) {
      // LED 發光效果
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.5);
      gradient.addColorStop(0, 'rgba(0, 212, 255, 0.8)');
      gradient.addColorStop(0.4, 'rgba(0, 212, 255, 0.4)');
      gradient.addColorStop(0.7, 'rgba(0, 212, 255, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // LED 本體（亮）
      const ledGradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
      ledGradient.addColorStop(0, '#ffffff');
      ledGradient.addColorStop(0.3, '#00ffff');
      ledGradient.addColorStop(0.7, '#00d4ff');
      ledGradient.addColorStop(1, '#0088cc');

      ctx.fillStyle = ledGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // 高光
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(x - radius * 0.4, y - radius * 0.4, radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // LED 本體（暗）
      const offGradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
      offGradient.addColorStop(0, '#334455');
      offGradient.addColorStop(1, '#112233');

      ctx.fillStyle = offGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // 邊框
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // LED 腳位（兩條小線）
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 2;

    // 左腳
    ctx.beginPath();
    ctx.moveTo(x - radius * 0.5, y + radius);
    ctx.lineTo(x - radius * 0.5, y + radius + 8);
    ctx.stroke();

    // 右腳
    ctx.beginPath();
    ctx.moveTo(x + radius * 0.5, y + radius);
    ctx.lineTo(x + radius * 0.5, y + radius + 8);
    ctx.stroke();
  }

  /**
   * 繪製按鈕（在底部）
   */
  drawButtons() {
    const { lanes, laneWidth, judgeLineY } = this.config;
    const buttonRadius = 20;
    const buttonY = judgeLineY + 40;

    for (let lane = 0; lane < lanes; lane++) {
      const centerX = lane * laneWidth + laneWidth / 2;
      const isPressed = this.lanePressTime && this.lanePressTime[lane] &&
                       (Date.now() - this.lanePressTime[lane] < 200);

      this.drawButton(centerX, buttonY, buttonRadius, isPressed, lane);
    }
  }

  /**
   * 繪製單個按鈕
   */
  drawButton(x, y, radius, isPressed, lane) {
    const ctx = this.ctx;
    const depth = isPressed ? 2 : 5;

    // 按鈕陰影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, radius, 0, Math.PI * 2);
    ctx.fill();

    // 按鈕本體
    const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    if (isPressed) {
      gradient.addColorStop(0, '#ff6b6b');
      gradient.addColorStop(1, '#cc0000');
    } else {
      gradient.addColorStop(0, '#ff4444');
      gradient.addColorStop(1, '#aa0000');
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y - (isPressed ? 0 : depth), radius, 0, Math.PI * 2);
    ctx.fill();

    // 按鈕邊框
    ctx.strokeStyle = '#660000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 高光
    if (!isPressed) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(x - radius * 0.4, y - depth - radius * 0.4, radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 按鈕標籤
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const keys = ['D', 'F', 'J', 'K'];
    ctx.fillText(keys[lane], x, y - (isPressed ? 0 : depth));
  }

  /**
   * 繪製軌道（淡化，主要靠 LED）
   */
  drawLanes() {
    const { lanes, laneWidth } = this.config;

    for (let i = 0; i < lanes; i++) {
      const x = i * laneWidth;

      // 軌道邊界（很淡）
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
  }

  /**
   * 繪製判定線
   */
  drawJudgeLine() {
    const y = this.config.judgeLineY;

    // 發光效果
    const gradient = this.ctx.createLinearGradient(0, y - 20, 0, y + 20);
    gradient.addColorStop(0, 'rgba(233, 69, 96, 0)');
    gradient.addColorStop(0.5, 'rgba(233, 69, 96, 0.8)');
    gradient.addColorStop(1, 'rgba(233, 69, 96, 0)');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, y - 20, this.canvas.width, 40);

    // 判定線
    this.ctx.strokeStyle = '#e94560';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(0, y);
    this.ctx.lineTo(this.canvas.width, y);
    this.ctx.stroke();
  }

  /**
   * 繪製音符軌跡（輔助視覺，主要看 LED）
   */
  drawNotes(currentTime) {
    // 音符現在主要由 LED 燈顯示
    // 這裡只保留簡單的軌跡線作為輔助
  }

  /**
   * 繪製軌道按壓效果
   */
  drawLanePress() {
    if (!this.lanePressTime) return;

    const now = Date.now();
    const { laneWidth, judgeLineY } = this.config;

    for (const [lane, pressTime] of Object.entries(this.lanePressTime)) {
      const elapsed = now - pressTime;
      if (elapsed > 200) {
        delete this.lanePressTime[lane];
        continue;
      }

      const opacity = 1 - (elapsed / 200);
      const x = parseInt(lane) * laneWidth;

      this.ctx.fillStyle = `rgba(233, 69, 96, ${opacity * 0.3})`;
      this.ctx.fillRect(x, judgeLineY - 30, laneWidth, 60);
    }
  }
}

// 創建全域實例
window.game = new GameRenderer();
