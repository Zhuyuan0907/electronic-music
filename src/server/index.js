import express from 'express';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import GameEngine from './gameEngine.js';
import ChartManager from './chartManager.js';
import HardwareController from '../hardware/controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../..');

// 初始化 Express
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// 遊戲管理器
const chartManager = new ChartManager(join(rootDir, 'charts'));
const hardwareController = new HardwareController();
let gameEngine = null;

// 靜態文件
app.use(express.static(join(rootDir, 'public')));
app.use('/charts', express.static(join(rootDir, 'charts')));

// API 路由
app.get('/api/charts', async (req, res) => {
  try {
    const charts = await chartManager.getChartList();
    res.json({ success: true, charts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/charts/:id', async (req, res) => {
  try {
    const chart = await chartManager.loadChart(req.params.id);
    res.json({ success: true, chart });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// WebSocket 連接處理
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      await handleMessage(ws, data);
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: error.message }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if (gameEngine) {
      gameEngine.stop();
      gameEngine = null;
    }
  });

  // 發送初始狀態
  ws.send(JSON.stringify({
    type: 'connected',
    hardwareAvailable: hardwareController.isAvailable()
  }));
});

// 訊息處理
async function handleMessage(ws, data) {
  switch (data.type) {
    case 'startGame':
      await startGame(ws, data.chartId);
      break;

    case 'stopGame':
      stopGame(ws);
      break;

    case 'buttonPress':
      if (gameEngine) {
        gameEngine.handleButtonPress(data.lane, data.time);
      }
      break;

    case 'getCharts':
      const charts = await chartManager.getChartList();
      ws.send(JSON.stringify({ type: 'chartList', charts }));
      break;

    default:
      ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
  }
}

// 開始遊戲
async function startGame(ws, chartId) {
  try {
    const chart = await chartManager.loadChart(chartId);

    gameEngine = new GameEngine(chart, hardwareController);

    // 遊戲事件監聽
    gameEngine.on('noteActive', (noteData) => {
      ws.send(JSON.stringify({ type: 'noteActive', data: noteData }));
    });

    gameEngine.on('noteJudge', (judgeData) => {
      ws.send(JSON.stringify({ type: 'noteJudge', data: judgeData }));
    });

    gameEngine.on('gameEnd', (scoreData) => {
      ws.send(JSON.stringify({ type: 'gameEnd', data: scoreData }));
    });

    gameEngine.start();

    ws.send(JSON.stringify({
      type: 'gameStarted',
      chart: {
        metadata: chart.metadata,
        gameConfig: chart.gameConfig
      }
    }));
  } catch (error) {
    ws.send(JSON.stringify({ type: 'error', message: error.message }));
  }
}

// 停止遊戲
function stopGame(ws) {
  if (gameEngine) {
    gameEngine.stop();
    gameEngine = null;
    ws.send(JSON.stringify({ type: 'gameStopped' }));
  }
}

// 啟動伺服器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🎮 Board Music Game Server running on http://localhost:${PORT}`);
  console.log(`🔌 Hardware: ${hardwareController.isAvailable() ? 'Available' : 'Simulated Mode'}`);
});

// 優雅關閉
let isShuttingDown = false;
process.on('SIGINT', () => {
  if (isShuttingDown) {
    console.log('\n⚠️  Force exit...');
    process.exit(1);
  }

  isShuttingDown = true;
  console.log('\n🛑 Shutting down server...');

  // 關閉所有 WebSocket 連線
  wss.clients.forEach(client => {
    client.close();
  });

  hardwareController.cleanup();

  // 設定超時，如果 5 秒內沒關閉就強制退出
  const timeout = setTimeout(() => {
    console.log('⚠️  Force closing...');
    process.exit(0);
  }, 5000);

  server.close(() => {
    clearTimeout(timeout);
    console.log('👋 Server closed');
    process.exit(0);
  });
});
