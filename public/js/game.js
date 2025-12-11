/**
 * 遊戲渲染引擎（Canvas）
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

    // 遊戲配置
    this.config = {
      lanes: 4,
      noteSpeed: 1.0,
      noteHeight: 20,
      laneWidth: 100,
      judgeLineY: 0.85, // 判定線位置（畫面的 85%）
      noteLeadTime: 2000 // 音符提前顯示時間（毫秒）
    };

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
  }

  /**
   * 調整 Canvas 大小
   */
  resizeCanvas() {
    const container = this.canvas.parentElement;
    this.canvas.width = Math.min(800, container.clientWidth - 40);
    this.canvas.height = Math.min(600, container.clientHeight - 200);

    this.config.laneWidth = this.canvas.width / this.config.lanes;
    this.config.judgeLineY = this.canvas.height * 0.85;
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
  }

  /**
   * 開始遊戲
   */
  start(chart) {
    this.chart = chart;
    this.config.lanes = chart.gameConfig.lanes || 4;
    this.config.noteSpeed = chart.gameConfig.noteSpeed || 1.0;
    this.notes = [...chart.notes];
    this.activeNotes = [];
    this.isPlaying = true;
    this.startTime = Date.now();

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
    this.clear();
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

    this.clear();
    this.drawLanes();
    this.drawJudgeLine();
    this.drawNotes(currentTime);
    this.drawLanePress();

    this.animationId = requestAnimationFrame(() => this.render());
  }

  /**
   * 清空畫布
   */
  clear() {
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 繪製軌道
   */
  drawLanes() {
    const { lanes, laneWidth } = this.config;

    for (let i = 0; i < lanes; i++) {
      const x = i * laneWidth;

      // 軌道背景
      this.ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.05)';
      this.ctx.fillRect(x, 0, laneWidth, this.canvas.height);

      // 軌道邊界
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
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
   * 繪製音符
   */
  drawNotes(currentTime) {
    const { laneWidth, noteHeight, judgeLineY, noteLeadTime, noteSpeed } = this.config;

    this.activeNotes.forEach(note => {
      // 計算音符位置
      const timeUntilHit = note.time - currentTime;
      const progress = 1 - (timeUntilHit / (noteLeadTime / noteSpeed));

      if (progress < 0 || progress > 1.2) return; // 不在可見範圍

      const y = judgeLineY * progress;
      const x = note.lane * laneWidth;

      // 繪製音符
      this.drawNote(x, y, laneWidth, noteHeight, note.type);
    });
  }

  /**
   * 繪製單個音符
   */
  drawNote(x, y, width, height, type) {
    const padding = 8;

    // 音符陰影
    this.ctx.shadowColor = 'rgba(0, 212, 255, 0.5)';
    this.ctx.shadowBlur = 15;

    // 音符漸變
    const gradient = this.ctx.createLinearGradient(x + padding, y - height / 2, x + width - padding, y + height / 2);
    gradient.addColorStop(0, '#00d4ff');
    gradient.addColorStop(1, '#0099cc');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x + padding, y - height / 2, width - padding * 2, height);

    // 音符邊框
    this.ctx.strokeStyle = '#00ffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x + padding, y - height / 2, width - padding * 2, height);

    // 重置陰影
    this.ctx.shadowBlur = 0;
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
