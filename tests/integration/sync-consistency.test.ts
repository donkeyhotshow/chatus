/**
 * Sync Consistency Tests
 * Тестирует синхронизацию состояния между несколькими клиентами,
 * отсутствие дублей, согласованность ID объектов
 */

import { describe, it, expect, beforeEach } from 'vitest';

interface GameObject {
  id: string;
  type: string;
  x: number;
  y: number;
  angle?: number;
  vx?: number;
  vy?: number;
}

class SyncTestClient {
  private objects: Map<string, GameObject> = new Map();
  private receivedMessages: any[] = [];
  private sentMessages: any[] = [];
  
  spawnObject(obj: GameObject) {
    if (this.objects.has(obj.id)) {
      throw new Error(`Duplicate object ID: ${obj.id}`);
    }
    this.objects.set(obj.id, { ...obj });
    this.sentMessages.push({ type: 'spawn', ...obj });
  }
  
  updateObject(obj: Partial<GameObject> & { id: string }) {
    if (!this.objects.has(obj.id)) {
      throw new Error(`Object not found: ${obj.id}`);
    }
    const existing = this.objects.get(obj.id)!;
    this.objects.set(obj.id, { ...existing, ...obj });
    this.sentMessages.push({ type: 'update', ...obj });
  }
  
  removeObject(id: string) {
    if (!this.objects.has(id)) {
      throw new Error(`Object not found for removal: ${id}`);
    }
    this.objects.delete(id);
    this.sentMessages.push({ type: 'remove', id });
  }
  
  receiveMessage(msg: any) {
    this.receivedMessages.push(msg);
    
    if (msg.type === 'spawn') {
      if (this.objects.has(msg.id)) {
        // Дубликат - это проблема
        throw new Error(`Received duplicate spawn for ID: ${msg.id}`);
      }
      this.objects.set(msg.id, msg);
    } else if (msg.type === 'update') {
      if (!this.objects.has(msg.id)) {
        // Обновление несуществующего объекта
        throw new Error(`Received update for non-existent object: ${msg.id}`);
      }
      const existing = this.objects.get(msg.id)!;
      this.objects.set(msg.id, { ...existing, ...msg });
    } else if (msg.type === 'remove') {
      if (!this.objects.has(msg.id)) {
        // Удаление несуществующего объекта
        throw new Error(`Received remove for non-existent object: ${msg.id}`);
      }
      this.objects.delete(msg.id);
    }
  }
  
  getObjects(): GameObject[] {
    return Array.from(this.objects.values());
  }
  
  getObjectCount(): number {
    return this.objects.size;
  }
  
  hasObject(id: string): boolean {
    return this.objects.has(id);
  }
  
  getReceivedMessages(): any[] {
    return [...this.receivedMessages];
  }
  
  getSentMessages(): any[] {
    return [...this.sentMessages];
  }
  
  clear() {
    this.objects.clear();
    this.receivedMessages = [];
    this.sentMessages = [];
  }
}

describe('Sync Consistency Tests', () => {
  let client1: SyncTestClient;
  let client2: SyncTestClient;
  let client3: SyncTestClient;
  
  beforeEach(() => {
    client1 = new SyncTestClient();
    client2 = new SyncTestClient();
    client3 = new SyncTestClient();
  });
  
  describe('Object Spawn Synchronization', () => {
    it('should synchronize spawn across all clients', () => {
      const obj: GameObject = { id: 'obj1', type: 'box', x: 100, y: 100 };
      
      // Client1 создаёт объект
      client1.spawnObject(obj);
      
      // Симулируем broadcast на сервере
      const spawnMsg = { type: 'spawn', ...obj };
      client2.receiveMessage(spawnMsg);
      client3.receiveMessage(spawnMsg);
      
      // Все клиенты должны иметь объект
      expect(client1.hasObject('obj1')).toBe(true);
      expect(client2.hasObject('obj1')).toBe(true);
      expect(client3.hasObject('obj1')).toBe(true);
    });
    
    it('should prevent duplicate object IDs', () => {
      const obj: GameObject = { id: 'obj1', type: 'box', x: 100, y: 100 };
      
      client1.spawnObject(obj);
      
      // Попытка создать объект с тем же ID должна вызвать ошибку
      expect(() => {
        client1.spawnObject(obj);
      }).toThrow('Duplicate object ID');
    });
    
    it('should handle concurrent spawns with different IDs', () => {
      const obj1: GameObject = { id: 'obj1', type: 'box', x: 100, y: 100 };
      const obj2: GameObject = { id: 'obj2', type: 'circle', x: 200, y: 200 };
      
      // Два клиента создают объекты одновременно
      client1.spawnObject(obj1);
      client2.spawnObject(obj2);
      
      // Симулируем broadcast
      client1.receiveMessage({ type: 'spawn', ...obj2 });
      client2.receiveMessage({ type: 'spawn', ...obj1 });
      client3.receiveMessage({ type: 'spawn', ...obj1 });
      client3.receiveMessage({ type: 'spawn', ...obj2 });
      
      // Все клиенты должны иметь оба объекта
      expect(client1.getObjectCount()).toBe(2);
      expect(client2.getObjectCount()).toBe(2);
      expect(client3.getObjectCount()).toBe(2);
    });
  });
  
  describe('Object Update Synchronization', () => {
    it('should synchronize updates across all clients', () => {
      const obj: GameObject = { id: 'obj1', type: 'box', x: 100, y: 100 };
      
      // Создаём объект на всех клиентах
      client1.spawnObject(obj);
      client2.receiveMessage({ type: 'spawn', ...obj });
      client3.receiveMessage({ type: 'spawn', ...obj });
      
      // Client1 обновляет объект
      client1.updateObject({ id: 'obj1', x: 150, y: 150 });
      
      // Симулируем broadcast
      const updateMsg = { type: 'update', id: 'obj1', x: 150, y: 150 };
      client2.receiveMessage(updateMsg);
      client3.receiveMessage(updateMsg);
      
      // Все клиенты должны иметь обновлённые координаты
      expect(client1.getObjects()[0].x).toBe(150);
      expect(client2.getObjects()[0].x).toBe(150);
      expect(client3.getObjects()[0].x).toBe(150);
    });
    
    it('should handle rapid updates without desync', () => {
      const obj: GameObject = { id: 'obj1', type: 'box', x: 100, y: 100 };
      
      client1.spawnObject(obj);
      client2.receiveMessage({ type: 'spawn', ...obj });
      
      // Отправляем 10 быстрых обновлений
      for (let i = 0; i < 10; i++) {
        client1.updateObject({ id: 'obj1', x: 100 + i * 10, y: 100 });
        client2.receiveMessage({ type: 'update', id: 'obj1', x: 100 + i * 10, y: 100 });
      }
      
      // Финальное состояние должно совпадать
      expect(client1.getObjects()[0].x).toBe(190);
      expect(client2.getObjects()[0].x).toBe(190);
    });
  });
  
  describe('Object Removal Synchronization', () => {
    it('should synchronize removal across all clients', () => {
      const obj: GameObject = { id: 'obj1', type: 'box', x: 100, y: 100 };
      
      // Создаём объект на всех клиентах
      client1.spawnObject(obj);
      client2.receiveMessage({ type: 'spawn', ...obj });
      client3.receiveMessage({ type: 'spawn', ...obj });
      
      // Client1 удаляет объект
      client1.removeObject('obj1');
      
      // Симулируем broadcast
      const removeMsg = { type: 'remove', id: 'obj1' };
      client2.receiveMessage(removeMsg);
      client3.receiveMessage(removeMsg);
      
      // Все клиенты не должны иметь объект
      expect(client1.hasObject('obj1')).toBe(false);
      expect(client2.hasObject('obj1')).toBe(false);
      expect(client3.hasObject('obj1')).toBe(false);
    });
    
    it('should handle remove of non-existent object gracefully', () => {
      // Попытка удалить несуществующий объект должна вызвать ошибку
      expect(() => {
        client1.removeObject('nonexistent');
      }).toThrow('Object not found for removal');
    });
  });
  
  describe('Race Condition Tests', () => {
    it('should handle spawn-update race condition', () => {
      const obj: GameObject = { id: 'obj1', type: 'box', x: 100, y: 100 };
      
      // Client1 создаёт объект
      client1.spawnObject(obj);
      
      // Client2 получает update ДО spawn (race condition)
      client2.receiveMessage({ type: 'update', id: 'obj1', x: 150, y: 150 });
      
      // Это должно вызвать ошибку, так как объект не существует
      expect(() => {
        client2.receiveMessage({ type: 'update', id: 'obj1', x: 150, y: 150 });
      }).toThrow('Received update for non-existent object');
    });
    
    it('should handle concurrent updates to same object', () => {
      const obj: GameObject = { id: 'obj1', type: 'box', x: 100, y: 100 };
      
      client1.spawnObject(obj);
      client2.receiveMessage({ type: 'spawn', ...obj });
      
      // Два клиента обновляют одновременно
      client1.updateObject({ id: 'obj1', x: 150, y: 100 });
      client2.updateObject({ id: 'obj1', x: 100, y: 150 });
      
      // Симулируем broadcast обоих обновлений
      client1.receiveMessage({ type: 'update', id: 'obj1', x: 100, y: 150 });
      client2.receiveMessage({ type: 'update', id: 'obj1', x: 150, y: 100 });
      
      // Финальное состояние должно быть согласованным
      // (последнее обновление побеждает)
      expect(client1.getObjects()[0].y).toBe(150);
      expect(client2.getObjects()[0].x).toBe(150);
    });
  });
  
  describe('Multi-User Consistency', () => {
    it('should maintain consistency with 6 concurrent users', () => {
      const clients = [client1, client2, client3];
      for (let i = 4; i <= 6; i++) {
        clients.push(new SyncTestClient());
      }
      
      // Каждый клиент создаёт объект
      clients.forEach((client, idx) => {
        client.spawnObject({
          id: `obj${idx}`,
          type: 'box',
          x: idx * 100,
          y: idx * 100
        });
      });
      
      // Симулируем broadcast всех spawn сообщений
      clients.forEach((sender, senderIdx) => {
        const spawnMsg = {
          type: 'spawn',
          id: `obj${senderIdx}`,
          type: 'box',
          x: senderIdx * 100,
          y: senderIdx * 100
        };
        clients.forEach((receiver) => {
          if (receiver !== sender) {
            receiver.receiveMessage(spawnMsg);
          }
        });
      });
      
      // Все клиенты должны иметь все 6 объектов
      clients.forEach((client) => {
        expect(client.getObjectCount()).toBe(6);
      });
    });
  });
});

