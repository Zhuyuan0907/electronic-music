import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

class ChartManager {
  constructor(chartsDir) {
    this.chartsDir = chartsDir;
  }

  /**
   * 獲取所有可用的譜面列表
   */
  async getChartList() {
    try {
      const charts = [];
      const examplesDir = join(this.chartsDir, 'examples');
      const files = await readdir(examplesDir);

      for (const file of files) {
        if (file.endsWith('.json') && !file.includes('schema')) {
          const chartPath = join(examplesDir, file);
          const content = await readFile(chartPath, 'utf-8');
          const chart = JSON.parse(content);

          charts.push({
            id: file.replace('.json', ''),
            title: chart.metadata.title,
            artist: chart.metadata.artist,
            difficulty: chart.metadata.difficulty,
            level: chart.metadata.level,
            duration: chart.metadata.duration,
            bpm: chart.metadata.bpm
          });
        }
      }

      return charts;
    } catch (error) {
      console.error('Error loading chart list:', error);
      return [];
    }
  }

  /**
   * 載入指定的譜面
   */
  async loadChart(chartId) {
    const chartPath = join(this.chartsDir, 'examples', `${chartId}.json`);

    try {
      const content = await readFile(chartPath, 'utf-8');
      const chart = JSON.parse(content);

      // 驗證譜面格式
      this.validateChart(chart);

      // 排序音符（確保按時間順序）
      chart.notes.sort((a, b) => a.time - b.time);

      return chart;
    } catch (error) {
      throw new Error(`Failed to load chart: ${error.message}`);
    }
  }

  /**
   * 驗證譜面格式
   */
  validateChart(chart) {
    // 必要欄位檢查
    if (!chart.metadata || !chart.gameConfig || !chart.notes) {
      throw new Error('Invalid chart format: missing required fields');
    }

    // 元資料驗證
    const required = ['title', 'artist', 'difficulty', 'level', 'bpm', 'duration'];
    for (const field of required) {
      if (!chart.metadata[field]) {
        throw new Error(`Missing required metadata field: ${field}`);
      }
    }

    // 遊戲配置驗證
    const lanes = chart.gameConfig.lanes || 4;
    if (lanes < 3 || lanes > 5) {
      throw new Error('Invalid lane count: must be between 3 and 5');
    }

    // 音符驗證
    if (!Array.isArray(chart.notes)) {
      throw new Error('Notes must be an array');
    }

    for (const note of chart.notes) {
      if (typeof note.time !== 'number' || note.time < 0) {
        throw new Error('Invalid note time');
      }
      if (typeof note.lane !== 'number' || note.lane < 0 || note.lane >= lanes) {
        throw new Error(`Invalid lane number: ${note.lane}`);
      }
      if (!['tap', 'hold', 'slide'].includes(note.type)) {
        throw new Error(`Invalid note type: ${note.type}`);
      }
    }

    return true;
  }
}

export default ChartManager;
