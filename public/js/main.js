/**
 * 主程式入口
 */

let currentChart = null;

// WebSocket 事件處理
window.wsClient.on('connectionChange', (connected) => {
  window.uiManager.updateConnectionStatus(connected);

  if (connected) {
    // 連線成功，請求歌曲列表
    loadChartList();
  }
});

window.wsClient.on('connected', (data) => {
  console.log('Server connected:', data);
  window.uiManager.updateHardwareStatus(data.hardwareAvailable);
});

window.wsClient.on('chartList', (data) => {
  window.uiManager.displaySongList(data.charts);
});

window.wsClient.on('gameStarted', (data) => {
  console.log('Game started:', data);
  currentChart = data.chart;
  window.game.start(data.chart);
});

window.wsClient.on('noteActive', (data) => {
  window.game.addActiveNote(data);
});

window.wsClient.on('noteJudge', (data) => {
  console.log('Judge:', data.judge);
  window.uiManager.updateScore(data.score);
  window.uiManager.showJudge(data.judge);

  // 移除已判定的音符
  window.game.removeNote(data.lane, data.time);
});

window.wsClient.on('gameEnd', (data) => {
  console.log('Game ended:', data);
  window.game.stop();
  window.uiManager.showResult(currentChart, data);
});

window.wsClient.on('gameStopped', () => {
  console.log('Game stopped');
  window.game.stop();
});

window.wsClient.on('error', (data) => {
  console.error('Server error:', data.message);
  alert('錯誤: ' + data.message);
});

/**
 * 載入歌曲列表
 */
function loadChartList() {
  fetch('/api/charts')
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        window.uiManager.displaySongList(data.charts);
      } else {
        console.error('Failed to load charts:', data.error);
      }
    })
    .catch(error => {
      console.error('Error loading charts:', error);
    });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Board Music Game initialized');

  // 如果已經連線，載入歌曲列表
  if (window.wsClient.isConnected()) {
    loadChartList();
  }
});

// 鍵盤提示
console.log(`
🎹 鍵盤控制：
  D - 軌道 1
  F - 軌道 2
  J - 軌道 3
  K - 軌道 4
`);
