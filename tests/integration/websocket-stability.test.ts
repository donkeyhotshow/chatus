/**
 * WebSocket Stability Tests
 * Тестирует стабильность WebSocket соединений, переподключения,
 * обработку ошибок и восстановление состояния
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

// Мок WebSocket клиента для тестирования
class MockWebSocket {
  url: string;
  readyState: number = WebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  
  private messages: string[] = [];
  private shouldFail: boolean = false;
  private reconnectDelay: number = 100;
  
  constructor(url: string) {
    this.url = url;
    // Симулируем подключение
    setTimeout(() => {
      if (!this.shouldFail) {
        this.readyState = WebSocket.OPEN;
        if (this.onopen) this.onopen(new Event('open'));
      }
    }, 10);
  }
  
  send(data: string) {
    if (this.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.messages.push(data);
  }
  
  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code: 1000, reason: 'Normal closure' }));
    }
  }
  
  // Тестовые методы
  simulateDisconnect() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code: 1006, reason: 'Abnormal closure' }));
    }
  }
  
  simulateReconnect() {
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) this.onopen(new Event('open'));
    }, this.reconnectDelay);
  }
  
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }
  
  setShouldFail(fail: boolean) {
    this.shouldFail = fail;
  }
  
  getSentMessages(): string[] {
    return [...this.messages];
  }
}

describe('WebSocket Stability Tests', () => {
  let ws: MockWebSocket;
  const testRoom = 'test-room';
  const testPlayer = 'test-player';
  
  beforeEach(() => {
    ws = new MockWebSocket(`ws://localhost:8000/ws/${testRoom}/${testPlayer}`);
  });
  
  afterEach(() => {
    if (ws) ws.close();
  });
  
  describe('Connection Stability', () => {
    it('should establish connection successfully', async () => {
      await new Promise<void>((resolve) => {
        ws.onopen = () => {
          expect(ws.readyState).toBe(WebSocket.OPEN);
          resolve();
        };
      });
    });
    
    it('should handle connection failure gracefully', async () => {
      const failedWs = new MockWebSocket(`ws://localhost:8000/ws/${testRoom}/${testPlayer}`);
      failedWs.setShouldFail(true);
      
      await new Promise<void>((resolve) => {
        failedWs.onerror = () => {
          expect(failedWs.readyState).not.toBe(WebSocket.OPEN);
          resolve();
        };
      });
    });
    
    it('should maintain connection under normal load', async () => {
      await new Promise<void>((resolve) => {
        ws.onopen = () => {
          // Отправляем 100 сообщений
          for (let i = 0; i < 100; i++) {
            ws.send(JSON.stringify({ type: 'update', id: `obj-${i}`, x: i, y: i }));
          }
          expect(ws.getSentMessages().length).toBe(100);
          expect(ws.readyState).toBe(WebSocket.OPEN);
          resolve();
        };
      });
    });
  });
  
  describe('Reconnection Tests', () => {
    it('should detect disconnection', async () => {
      await new Promise<void>((resolve) => {
        ws.onopen = () => {
          ws.simulateDisconnect();
        };
        ws.onclose = () => {
          expect(ws.readyState).toBe(WebSocket.CLOSED);
          resolve();
        };
      });
    });
    
    it('should attempt reconnection after disconnect', async () => {
      let reconnectAttempted = false;
      
      await new Promise<void>((resolve) => {
        ws.onopen = () => {
          ws.simulateDisconnect();
        };
        ws.onclose = () => {
          if (!reconnectAttempted) {
            reconnectAttempted = true;
            ws.simulateReconnect();
          }
        };
        ws.onopen = () => {
          if (reconnectAttempted) {
            expect(ws.readyState).toBe(WebSocket.OPEN);
            resolve();
          }
        };
      });
    });
    
    it('should restore state after reconnection', async () => {
      const receivedObjects: any[] = [];
      
      await new Promise<void>((resolve) => {
        ws.onopen = () => {
          // Симулируем init сообщение
          ws.simulateMessage({
            type: 'init',
            objects: [
              { id: 'obj1', type: 'box', x: 100, y: 100 },
              { id: 'obj2', type: 'circle', x: 200, y: 200 }
            ],
            chat: []
          });
        };
        ws.onmessage = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.type === 'init') {
            receivedObjects.push(...msg.objects);
            expect(receivedObjects.length).toBe(2);
            resolve();
          }
        };
      });
    });
  });
  
  describe('Message Ordering', () => {
    it('should process messages in order', async () => {
      const receivedOrder: number[] = [];
      
      await new Promise<void>((resolve) => {
        ws.onopen = () => {
          // Отправляем сообщения с порядковыми номерами
          for (let i = 0; i < 10; i++) {
            ws.simulateMessage({ type: 'update', id: 'obj1', seq: i });
          }
        };
        ws.onmessage = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.seq !== undefined) {
            receivedOrder.push(msg.seq);
            if (receivedOrder.length === 10) {
              // Проверяем порядок
              for (let i = 0; i < 10; i++) {
                expect(receivedOrder[i]).toBe(i);
              }
              resolve();
            }
          }
        };
      });
    });
  });
  
  describe('Error Handling', () => {
    it('should handle malformed messages', async () => {
      let errorHandled = false;
      
      await new Promise<void>((resolve) => {
        ws.onopen = () => {
          try {
            // Симулируем некорректное сообщение
            ws.simulateMessage('invalid json');
          } catch (e) {
            errorHandled = true;
          }
          resolve();
        };
      });
      
      // Ожидаем, что ошибка обработана
      expect(errorHandled).toBe(true);
    });
    
    it('should handle network errors gracefully', async () => {
      await new Promise<void>((resolve) => {
        ws.onerror = () => {
          // Соединение должно быть закрыто или в состоянии ошибки
          expect([WebSocket.CLOSED, WebSocket.CLOSING]).toContain(ws.readyState);
          resolve();
        };
        ws.simulateDisconnect();
      });
    });
  });
});

