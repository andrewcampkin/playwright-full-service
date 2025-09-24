import WebSocket from 'ws';

export class WebSocketService {
  static wss = null;
  static clients = new Map();

  static async initialize() {
    const port = process.env.WEBSOCKET_PORT || 3003;
    
    this.wss = new WebSocket.Server({ 
      port,
      path: '/ws'
    });

    this.wss.on('connection', (ws, req) => {
      console.log('🔌 New WebSocket connection established');
      
      const clientId = this.generateClientId();
      this.clients.set(clientId, ws);
      
      ws.clientId = clientId;
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to test runner WebSocket',
        clientId
      }));

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
        this.clients.delete(clientId);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(clientId);
      });
    });

    console.log(`✅ WebSocket service running on port ${port}`);
  }

  static handleMessage(ws, data) {
    switch (data.type) {
      case 'subscribe':
        // Subscribe to specific test execution updates
        ws.subscriptions = ws.subscriptions || new Set();
        ws.subscriptions.add(data.executionId);
        ws.send(JSON.stringify({
          type: 'subscribed',
          executionId: data.executionId
        }));
        break;

      case 'unsubscribe':
        // Unsubscribe from test execution updates
        if (ws.subscriptions) {
          ws.subscriptions.delete(data.executionId);
        }
        ws.send(JSON.stringify({
          type: 'unsubscribed',
          executionId: data.executionId
        }));
        break;

      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type'
        }));
    }
  }

  static broadcastExecutionUpdate(executionId, update) {
    const message = JSON.stringify({
      type: 'execution_update',
      executionId,
      ...update
    });

    this.clients.forEach((ws, clientId) => {
      if (ws.subscriptions && ws.subscriptions.has(executionId)) {
        try {
          ws.send(message);
        } catch (error) {
          console.error(`Error sending to client ${clientId}:`, error);
          this.clients.delete(clientId);
        }
      }
    });
  }

  static broadcastTestStart(executionId, testCase) {
    this.broadcastExecutionUpdate(executionId, {
      status: 'Running',
      message: `Test execution started: ${testCase.name}`,
      timestamp: new Date().toISOString()
    });
  }

  static broadcastTestComplete(executionId, result) {
    this.broadcastExecutionUpdate(executionId, {
      status: result.status,
      message: `Test execution completed: ${result.status}`,
      results: result.results,
      executionLog: result.executionLog,
      timestamp: new Date().toISOString()
    });
  }

  static broadcastTestFail(executionId, error) {
    this.broadcastExecutionUpdate(executionId, {
      status: 'Failed',
      message: `Test execution failed: ${error.message}`,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }

  static generateClientId() {
    return Math.random().toString(36).substr(2, 9);
  }

  static getClientCount() {
    return this.clients.size;
  }

  static async shutdown() {
    console.log('🛑 Shutting down WebSocket service...');
    
    // Close all connections
    this.clients.forEach((ws) => {
      ws.close();
    });
    
    // Close the WebSocket server
    if (this.wss) {
      this.wss.close();
    }
    
    console.log('✅ WebSocket service shutdown complete');
  }
}
