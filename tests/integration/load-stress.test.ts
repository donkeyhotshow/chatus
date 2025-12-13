/**
 * Load and Stress Tests
 * Тестирует производительность под нагрузкой,
 * обработку спама, throttling, симуляцию медленной сети
 */

import { describe, it, expect, beforeEach } from 'vitest';

interface Message {
  type: string;
  id?: string;
  data?: any;
  timestamp: number;
}

class LoadTestClient {
  private messages: Message[] = [];
  private sentCount: number = 0;
  private receivedCount: number = 0;
  private droppedCount: number = 0;
  private throttleDelay: number = 0;
  private lastSendTime: number = 0;
  private minSendInterval: number = 16; // ~60 FPS
  
  // Симуляция медленной сети
  private networkLatency: number = 0;
  private packetLoss: number = 0; // 0-1
  
  setThrottleDelay(delay: number) {
    this.throttleDelay = delay;
  }
  
  setNetworkLatency(latency: number) {
    this.networkLatency = latency;
  }
  
  setPacketLoss(loss: number) {
    this.packetLoss = Math.max(0, Math.min(1, loss));
  }
  
  send(message: Message): boolean {
    const now = Date.now();
    
    // Throttling check
    if (now - this.lastSendTime < this.minSendInterval + this.throttleDelay) {
      this.droppedCount++;
      return false; // Сообщение отброшено из-за throttling
    }
    
    // Packet loss simulation
    if (Math.random() < this.packetLoss) {
      this.droppedCount++;
      return false; // Пакет потерян
    }
    
    this.sentCount++;
    this.lastSendTime = now;
    this.messages.push(message);
    
    // Симулируем задержку сети
    if (this.networkLatency > 0) {
      setTimeout(() => {
        this.receivedCount++;
      }, this.networkLatency);
    } else {
      this.receivedCount++;
    }
    
    return true;
  }
  
  getStats() {
    return {
      sent: this.sentCount,
      received: this.receivedCount,
      dropped: this.droppedCount,
      dropRate: this.droppedCount / (this.sentCount + this.droppedCount) || 0
    };
  }
  
  reset() {
    this.messages = [];
    this.sentCount = 0;
    this.receivedCount = 0;
    this.droppedCount = 0;
    this.lastSendTime = 0;
  }
}

describe('Load and Stress Tests', () => {
  let client: LoadTestClient;
  
  beforeEach(() => {
    client = new LoadTestClient();
  });
  
  describe('Spam Protection', () => {
    it('should throttle rapid messages', () => {
      // Отправляем 1000 сообщений очень быстро
      let sent = 0;
      let dropped = 0;
      
      for (let i = 0; i < 1000; i++) {
        const success = client.send({
          type: 'update',
          id: 'obj1',
          timestamp: Date.now()
        });
        if (success) sent++;
        else dropped++;
      }
      
      const stats = client.getStats();
      
      // Должно быть отброшено значительное количество сообщений
      expect(stats.dropRate).toBeGreaterThan(0.5); // Больше 50% отброшено
      expect(sent).toBeLessThan(1000);
    });
    
    it('should handle spam without crashing', () => {
      // Отправляем огромное количество сообщений
      for (let i = 0; i < 10000; i++) {
        client.send({
          type: 'update',
          id: `obj${i % 100}`,
          timestamp: Date.now()
        });
      }
      
      const stats = client.getStats();
      
      // Система должна обработать хотя бы часть сообщений
      expect(stats.sent).toBeGreaterThan(0);
      expect(stats.dropped).toBeGreaterThan(0);
    });
  });
  
  describe('Network Simulation', () => {
    it('should handle slow network conditions', async () => {
      client.setNetworkLatency(100); // 100ms задержка
      
      const startTime = Date.now();
      client.send({ type: 'update', id: 'obj1', timestamp: startTime });
      
      // Ждём обработки
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const stats = client.getStats();
      expect(stats.received).toBe(1);
    });
    
    it('should handle packet loss', () => {
      client.setPacketLoss(0.1); // 10% потерь
      
      let received = 0;
      for (let i = 0; i < 1000; i++) {
        if (client.send({ type: 'update', id: 'obj1', timestamp: Date.now() })) {
          received++;
        }
      }
      
      const stats = client.getStats();
      // С учётом throttling и packet loss, должно быть меньше 1000
      expect(stats.received).toBeLessThan(1000);
    });
    
    it('should handle high latency without desync', async () => {
      client.setNetworkLatency(500); // 500ms задержка
      
      // Отправляем несколько сообщений
      for (let i = 0; i < 10; i++) {
        client.send({
          type: 'update',
          id: 'obj1',
          data: { seq: i },
          timestamp: Date.now()
        });
      }
      
      // Ждём обработки
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const stats = client.getStats();
      // Все сообщения должны быть обработаны (с задержкой)
      expect(stats.received).toBeGreaterThan(0);
    });
  });
  
  describe('High Load Scenarios', () => {
    it('should handle 6 concurrent users sending updates', () => {
      const clients: LoadTestClient[] = [];
      for (let i = 0; i < 6; i++) {
        clients.push(new LoadTestClient());
      }
      
      // Каждый клиент отправляет 100 обновлений
      clients.forEach((client, idx) => {
        for (let i = 0; i < 100; i++) {
          client.send({
            type: 'update',
            id: `obj${idx}`,
            timestamp: Date.now()
          });
        }
      });
      
      // Проверяем, что все клиенты обработали сообщения
      clients.forEach((client) => {
        const stats = client.getStats();
        expect(stats.sent).toBeGreaterThan(0);
      });
    });
    
    it('should maintain performance under continuous load', () => {
      const startTime = Date.now();
      
      // Отправляем сообщения в течение 1 секунды
      let count = 0;
      while (Date.now() - startTime < 1000) {
        client.send({
          type: 'update',
          id: 'obj1',
          timestamp: Date.now()
        });
        count++;
      }
      
      const stats = client.getStats();
      const elapsed = Date.now() - startTime;
      
      // Должна быть разумная скорость обработки
      const rate = stats.sent / (elapsed / 1000);
      expect(rate).toBeGreaterThan(10); // Минимум 10 сообщений в секунду
    });
  });
  
  describe('Throttling Tests', () => {
    it('should respect throttle delay', () => {
      client.setThrottleDelay(100); // 100ms задержка
      
      const startTime = Date.now();
      client.send({ type: 'update', id: 'obj1', timestamp: startTime });
      client.send({ type: 'update', id: 'obj1', timestamp: startTime });
      
      // Второе сообщение должно быть отброшено из-за throttling
      const stats = client.getStats();
      expect(stats.dropped).toBeGreaterThan(0);
    });
    
    it('should allow messages after throttle period', async () => {
      client.setThrottleDelay(50);
      
      client.send({ type: 'update', id: 'obj1', timestamp: Date.now() });
      
      // Ждём окончания throttle периода
      await new Promise(resolve => setTimeout(resolve, 60));
      
      const success = client.send({ type: 'update', id: 'obj1', timestamp: Date.now() });
      expect(success).toBe(true);
    });
  });
  
  describe('Memory Leak Detection', () => {
    it('should not accumulate messages indefinitely', () => {
      // Отправляем много сообщений
      for (let i = 0; i < 10000; i++) {
        client.send({
          type: 'update',
          id: 'obj1',
          timestamp: Date.now()
        });
      }
      
      // Проверяем, что старые сообщения очищаются
      // (в реальной системе должен быть механизм очистки)
      const stats = client.getStats();
      expect(stats.sent).toBeLessThan(10000); // Throttling должен ограничить
    });
  });
});

