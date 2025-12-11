import { EventEmitter } from 'events';

class GameEngine extends EventEmitter {
  constructor(chart, hardwareController) {
    super();
    this.chart = chart;
    this.hardware = hardwareController;
    this.isRunning = false;
    this.startTime = null;
    this.currentNoteIndex = 0;
    this.activeNotes = new Map(); // lane -> note
    this.score = {
      perfect: 0,
      great: 0,
      good: 0,
      miss: 0,
      combo: 0,
      maxCombo: 0,
      totalScore: 0
    };

    // 判定視窗（毫秒）
    this.judgeWindows = {
      perfect: 50,   // ±50ms
      great: 100,    // ±100ms
      good: 150,     // ±150ms
      miss: 200      // ±200ms
    };

    // 音符顯示提前時間（毫秒）
    this.noteLeadTime = 2000; // 音符提前 2 秒開始顯示
  }

  /**
   * 開始遊戲
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = Date.now();
    this.currentNoteIndex = 0;
    this.activeNotes.clear();

    console.log(`🎮 Game started: ${this.chart.metadata.title}`);
    this.gameLoop();
  }

  /**
   * 停止遊戲
   */
  stop() {
    this.isRunning = false;
    this.hardware.clearAllLEDs();
    console.log('🛑 Game stopped');
  }

  /**
   * 遊戲主循環
   */
  gameLoop() {
    if (!this.isRunning) return;

    const currentTime = Date.now() - this.startTime;

    // 檢查是否有新音符需要激活
    this.activateNotes(currentTime);

    // 更新 LED 顯示
    this.updateLEDs(currentTime);

    // 檢查遺漏的音符
    this.checkMissedNotes(currentTime);

    // 檢查遊戲是否結束
    if (this.isGameEnded(currentTime)) {
      this.endGame();
      return;
    }

    // 繼續循環（約 60 FPS）
    setTimeout(() => this.gameLoop(), 16);
  }

  /**
   * 激活新的音符
   */
  activateNotes(currentTime) {
    while (this.currentNoteIndex < this.chart.notes.length) {
      const note = this.chart.notes[this.currentNoteIndex];

      // 檢查音符是否應該開始顯示
      if (note.time - currentTime <= this.noteLeadTime) {
        this.activeNotes.set(`${note.time}-${note.lane}`, {
          ...note,
          activated: true,
          judged: false
        });

        // 發送音符激活事件
        this.emit('noteActive', {
          time: note.time,
          lane: note.lane,
          type: note.type,
          currentTime
        });

        this.currentNoteIndex++;
      } else {
        break;
      }
    }
  }

  /**
   * 更新 LED 顯示
   */
  updateLEDs(currentTime) {
    const lanes = this.chart.gameConfig.lanes || 4;
    const ledStates = new Array(lanes).fill(null).map(() => []);

    for (const [key, note] of this.activeNotes) {
      if (note.judged) continue;

      // 計算音符位置（0 = 頂部，1 = 底部）
      const timeUntilHit = note.time - currentTime;
      const progress = 1 - (timeUntilHit / this.noteLeadTime);

      // 假設每條軌道有 5 個 LED
      const ledCount = 5;
      const ledIndex = Math.floor(progress * ledCount);

      if (ledIndex >= 0 && ledIndex < ledCount) {
        ledStates[note.lane][ledIndex] = true;
      }
    }

    // 更新硬體 LED
    this.hardware.updateLEDs(ledStates);
  }

  /**
   * 處理按鈕按壓
   */
  handleButtonPress(lane, pressTime = null) {
    const currentTime = pressTime || (Date.now() - this.startTime);

    // 尋找最接近的未判定音符
    let closestNote = null;
    let minTimeDiff = Infinity;
    let closestKey = null;

    for (const [key, note] of this.activeNotes) {
      if (note.lane === lane && !note.judged) {
        const timeDiff = Math.abs(note.time - currentTime);
        if (timeDiff < minTimeDiff) {
          minTimeDiff = timeDiff;
          closestNote = note;
          closestKey = key;
        }
      }
    }

    // 判定
    if (closestNote) {
      const judge = this.judgeNote(minTimeDiff);

      if (judge !== 'miss') {
        closestNote.judged = true;
        this.updateScore(judge);

        this.emit('noteJudge', {
          lane,
          judge,
          timeDiff: minTimeDiff,
          score: this.score
        });

        console.log(`${judge.toUpperCase()} - Lane ${lane} (${minTimeDiff}ms)`);
      }
    }
  }

  /**
   * 判定音符
   */
  judgeNote(timeDiff) {
    if (timeDiff <= this.judgeWindows.perfect) return 'perfect';
    if (timeDiff <= this.judgeWindows.great) return 'great';
    if (timeDiff <= this.judgeWindows.good) return 'good';
    if (timeDiff <= this.judgeWindows.miss) return 'bad';
    return 'miss';
  }

  /**
   * 檢查遺漏的音符
   */
  checkMissedNotes(currentTime) {
    const toRemove = [];

    for (const [key, note] of this.activeNotes) {
      if (note.judged) {
        toRemove.push(key);
        continue;
      }

      // 音符已經過判定視窗
      if (currentTime - note.time > this.judgeWindows.miss) {
        note.judged = true;
        this.updateScore('miss');

        this.emit('noteJudge', {
          lane: note.lane,
          judge: 'miss',
          timeDiff: currentTime - note.time,
          score: this.score
        });

        toRemove.push(key);
        console.log(`MISS - Lane ${note.lane}`);
      }
    }

    // 移除已判定的音符
    for (const key of toRemove) {
      this.activeNotes.delete(key);
    }
  }

  /**
   * 更新分數
   */
  updateScore(judge) {
    switch (judge) {
      case 'perfect':
        this.score.perfect++;
        this.score.combo++;
        this.score.totalScore += 1000;
        break;
      case 'great':
        this.score.great++;
        this.score.combo++;
        this.score.totalScore += 500;
        break;
      case 'good':
        this.score.good++;
        this.score.combo++;
        this.score.totalScore += 200;
        break;
      case 'bad':
      case 'miss':
        this.score.miss++;
        this.score.combo = 0;
        break;
    }

    if (this.score.combo > this.score.maxCombo) {
      this.score.maxCombo = this.score.combo;
    }
  }

  /**
   * 檢查遊戲是否結束
   */
  isGameEnded(currentTime) {
    return currentTime > this.chart.metadata.duration;
  }

  /**
   * 結束遊戲
   */
  endGame() {
    this.isRunning = false;
    this.hardware.clearAllLEDs();

    // 計算最終成績
    const totalNotes = this.chart.notes.length;
    const accuracy = totalNotes > 0
      ? ((this.score.perfect + this.score.great * 0.8 + this.score.good * 0.5) / totalNotes) * 100
      : 0;

    const finalScore = {
      ...this.score,
      accuracy: accuracy.toFixed(2),
      totalNotes
    };

    this.emit('gameEnd', finalScore);
    console.log('🎉 Game ended:', finalScore);
  }
}

export default GameEngine;
