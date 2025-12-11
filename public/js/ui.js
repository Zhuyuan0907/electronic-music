/**
 * UI 管理
 */

class UIManager {
  constructor() {
    this.screens = {
      menu: document.getElementById('menu-screen'),
      game: document.getElementById('game-screen'),
      result: document.getElementById('result-screen')
    };

    this.elements = {
      // 狀態列
      connectionStatus: document.getElementById('connection-status'),
      hardwareStatus: document.getElementById('hardware-status'),

      // 歌曲列表
      songList: document.getElementById('song-list'),

      // 遊戲畫面
      currentSongTitle: document.getElementById('current-song-title'),
      currentSongArtist: document.getElementById('current-song-artist'),
      scoreValue: document.getElementById('score-value'),
      comboValue: document.getElementById('combo-value'),
      judgeDisplay: document.getElementById('judge-display'),

      // 結果畫面
      resultSongTitle: document.getElementById('result-song-title'),
      resultSongArtist: document.getElementById('result-song-artist'),
      resultTotalScore: document.getElementById('result-total-score'),
      resultAccuracy: document.getElementById('result-accuracy'),
      resultMaxCombo: document.getElementById('result-max-combo'),
      resultPerfect: document.getElementById('result-perfect'),
      resultGreat: document.getElementById('result-great'),
      resultGood: document.getElementById('result-good'),
      resultMiss: document.getElementById('result-miss')
    };

    this.setupEventListeners();
  }

  /**
   * 設定事件監聽
   */
  setupEventListeners() {
    // 返回按鈕
    document.getElementById('back-button').addEventListener('click', () => {
      this.showScreen('menu');
      if (window.game) {
        window.wsClient.send({ type: 'stopGame' });
      }
    });

    document.getElementById('result-back-button').addEventListener('click', () => {
      this.showScreen('menu');
    });
  }

  /**
   * 切換畫面
   */
  showScreen(screenName) {
    for (const [name, screen] of Object.entries(this.screens)) {
      screen.classList.toggle('active', name === screenName);
    }
  }

  /**
   * 更新連線狀態
   */
  updateConnectionStatus(connected) {
    const status = this.elements.connectionStatus;
    status.classList.toggle('connected', connected);
    status.classList.toggle('disconnected', !connected);
    status.querySelector('.status-text').textContent = connected ? '已連線' : '未連線';
  }

  /**
   * 更新硬體狀態
   */
  updateHardwareStatus(available) {
    const status = this.elements.hardwareStatus;
    status.querySelector('.status-text').textContent = available
      ? '硬體: 已連接'
      : '硬體: 模擬模式';
  }

  /**
   * 顯示歌曲列表
   */
  displaySongList(charts) {
    const songList = this.elements.songList;
    songList.innerHTML = '';

    if (charts.length === 0) {
      songList.innerHTML = '<div class="loading">沒有可用的歌曲</div>';
      return;
    }

    charts.forEach(chart => {
      const card = document.createElement('div');
      card.className = 'song-card';
      card.innerHTML = `
        <h3 class="song-card-title">${chart.title}</h3>
        <p class="song-card-artist">${chart.artist}</p>
        <div class="song-card-info">
          <span class="difficulty ${chart.difficulty}">${chart.difficulty}</span>
          <span class="level">Lv. ${chart.level}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        this.startGame(chart);
      });

      songList.appendChild(card);
    });
  }

  /**
   * 開始遊戲
   */
  startGame(chart) {
    this.elements.currentSongTitle.textContent = chart.title;
    this.elements.currentSongArtist.textContent = chart.artist;
    this.elements.scoreValue.textContent = '0';
    this.elements.comboValue.textContent = '0';

    this.showScreen('game');

    // 通知伺服器開始遊戲
    window.wsClient.send({
      type: 'startGame',
      chartId: chart.id
    });
  }

  /**
   * 更新分數顯示
   */
  updateScore(score) {
    this.elements.scoreValue.textContent = score.totalScore.toLocaleString();
    this.elements.comboValue.textContent = score.combo;

    // Combo 動畫
    if (score.combo > 0) {
      this.elements.comboValue.style.transform = 'scale(1.2)';
      setTimeout(() => {
        this.elements.comboValue.style.transform = 'scale(1)';
      }, 100);
    }
  }

  /**
   * 顯示判定
   */
  showJudge(judge) {
    const display = this.elements.judgeDisplay;

    const judgeText = document.createElement('div');
    judgeText.className = `judge-text ${judge}`;
    judgeText.textContent = judge.toUpperCase();

    display.appendChild(judgeText);

    // 0.5 秒後移除
    setTimeout(() => {
      judgeText.remove();
    }, 500);
  }

  /**
   * 顯示結果畫面
   */
  showResult(chart, score) {
    this.elements.resultSongTitle.textContent = chart.metadata.title;
    this.elements.resultSongArtist.textContent = chart.metadata.artist;
    this.elements.resultTotalScore.textContent = score.totalScore.toLocaleString();
    this.elements.resultAccuracy.textContent = score.accuracy + '%';
    this.elements.resultMaxCombo.textContent = score.maxCombo;
    this.elements.resultPerfect.textContent = score.perfect;
    this.elements.resultGreat.textContent = score.great;
    this.elements.resultGood.textContent = score.good;
    this.elements.resultMiss.textContent = score.miss;

    this.showScreen('result');
  }
}

// 創建全域實例
window.uiManager = new UIManager();
