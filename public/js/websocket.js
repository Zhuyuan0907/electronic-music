/**
 * WebSocket 連線管理
 */

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.reconnectInterval = 3000;
    this.messageHandlers = new Map();
    this.connect();
  }

  /**
   * 連接到伺服器
   */
  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('✅ Connected to server');
      this.connected = true;
      this.emit('connectionChange', true);
    };

    this.ws.onclose = () => {
      console.log('❌ Disconnected from server');
      this.connected = false;
      this.emit('connectionChange', false);

      // 自動重連
      setTimeout(() => this.connect(), this.reconnectInterval);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };
  }

  /**
   * 處理接收到的訊息
   */
  handleMessage(data) {
    const handlers = this.messageHandlers.get(data.type);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  /**
   * 註冊訊息處理器
   */
  on(messageType, handler) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType).push(handler);
  }

  /**
   * 取消註冊訊息處理器
   */
  off(messageType, handler) {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * 發送訊息
   */
  send(data) {
    if (this.connected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('Cannot send message: not connected');
    }
  }

  /**
   * 觸發事件
   */
  emit(eventName, data) {
    const handlers = this.messageHandlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  /**
   * 檢查連線狀態
   */
  isConnected() {
    return this.connected;
  }
}

// 創建全域實例
window.wsClient = new WebSocketClient();
