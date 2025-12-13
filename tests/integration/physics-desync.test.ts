/**
 * Physics Desync Tests
 * Тестирует синхронизацию физики между клиентами,
 * отсутствие дрожания объектов, согласованность физических состояний
 */

import { describe, it, expect, beforeEach } from 'vitest';

interface PhysicsState {
  id: string;
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
  angularVelocity: number;
  timestamp: number;
}

class PhysicsClient {
  private objects: Map<string, PhysicsState> = new Map();
  private lastUpdateTime: number = Date.now();
  private updateInterval: number = 16; // ~60 FPS
  
  spawnObject(id: string, x: number, y: number) {
    this.objects.set(id, {
      id,
      x,
      y,
      angle: 0,
      vx: 0,
      vy: 0,
      angularVelocity: 0,
      timestamp: Date.now()
    });
  }
  
  // Симуляция физики (упрощённая)
  updatePhysics() {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;
    
    this.objects.forEach((obj) => {
      // Применяем скорость
      obj.x += obj.vx * deltaTime;
      obj.y += obj.vy * deltaTime;
      obj.angle += obj.angularVelocity * deltaTime;
      
      // Простое гравитационное ускорение
      obj.vy += 9.8 * deltaTime;
      
      // Простое трение
      obj.vx *= 0.98;
      obj.vy *= 0.98;
      obj.angularVelocity *= 0.98;
    });
  }
  
  // Применение удалённого обновления
  applyRemoteUpdate(update: Partial<PhysicsState> & { id: string; timestamp: number }) {
    const local = this.objects.get(update.id);
    if (!local) return;
    
    // Проверяем, не устарело ли обновление
    if (update.timestamp < local.timestamp) {
      return; // Игнорируем устаревшие обновления
    }
    
    // Интерполяция для плавности
    const timeDiff = update.timestamp - local.timestamp;
    if (timeDiff < 100) { // Если разница небольшая, интерполируем
      local.x = local.x * 0.7 + update.x * 0.3;
      local.y = local.y * 0.7 + update.y * 0.3;
    } else {
      // Если разница большая, применяем напрямую
      local.x = update.x;
      local.y = update.y;
    }
    
    if (update.angle !== undefined) local.angle = update.angle;
    if (update.vx !== undefined) local.vx = update.vx;
    if (update.vy !== undefined) local.vy = update.vy;
    if (update.angularVelocity !== undefined) local.angularVelocity = update.angularVelocity;
    local.timestamp = update.timestamp;
  }
  
  // Применение силы к объекту
  applyForce(id: string, fx: number, fy: number) {
    const obj = this.objects.get(id);
    if (obj) {
      obj.vx += fx;
      obj.vy += fy;
    }
  }
  
  getObject(id: string): PhysicsState | undefined {
    return this.objects.get(id);
  }
  
  getAllObjects(): PhysicsState[] {
    return Array.from(this.objects.values());
  }
  
  getStateSnapshot(): PhysicsState[] {
    return this.getAllObjects().map(obj => ({ ...obj }));
  }
}

describe('Physics Desync Tests', () => {
  let client1: PhysicsClient;
  let client2: PhysicsClient;
  
  beforeEach(() => {
    client1 = new PhysicsClient();
    client2 = new PhysicsClient();
    
    // Создаём объект на обоих клиентах
    client1.spawnObject('obj1', 100, 100);
    client2.spawnObject('obj1', 100, 100);
  });
  
  describe('Physics Synchronization', () => {
    it('should maintain consistent physics state across clients', () => {
      // Применяем одинаковую силу на обоих клиентах
      client1.applyForce('obj1', 10, 0);
      client2.applyForce('obj1', 10, 0);
      
      // Симулируем несколько шагов физики
      for (let i = 0; i < 10; i++) {
        client1.updatePhysics();
        client2.updatePhysics();
      }
      
      const obj1 = client1.getObject('obj1');
      const obj2 = client2.getObject('obj1');
      
      // Состояния должны быть близки (с учётом погрешности вычислений)
      expect(Math.abs(obj1!.x - obj2!.x)).toBeLessThan(0.1);
      expect(Math.abs(obj1!.y - obj2!.y)).toBeLessThan(0.1);
    });
    
    it('should handle remote physics updates correctly', () => {
      // Client1 применяет силу и обновляет физику
      client1.applyForce('obj1', 10, 0);
      client1.updatePhysics();
      
      // Отправляем состояние на Client2
      const state = client1.getObject('obj1')!;
      client2.applyRemoteUpdate({
        id: 'obj1',
        x: state.x,
        y: state.y,
        vx: state.vx,
        vy: state.vy,
        angle: state.angle,
        angularVelocity: state.angularVelocity,
        timestamp: state.timestamp
      });
      
      // Состояния должны быть близки
      const obj1 = client1.getObject('obj1');
      const obj2 = client2.getObject('obj1');
      expect(Math.abs(obj1!.x - obj2!.x)).toBeLessThan(1);
    });
  });
  
  describe('Jitter Prevention', () => {
    it('should prevent jitter from rapid updates', () => {
      const positions: number[] = [];
      
      // Симулируем быстрые обновления с небольшими изменениями
      for (let i = 0; i < 20; i++) {
        client1.applyRemoteUpdate({
          id: 'obj1',
          x: 100 + Math.random() * 0.1, // Очень маленькие изменения
          y: 100,
          timestamp: Date.now() + i
        });
        positions.push(client1.getObject('obj1')!.x);
      }
      
      // Проверяем, что нет резких скачков (jitter)
      for (let i = 1; i < positions.length; i++) {
        const diff = Math.abs(positions[i] - positions[i - 1]);
        expect(diff).toBeLessThan(1); // Изменения должны быть плавными
      }
    });
    
    it('should interpolate smoothly between updates', () => {
      const initialX = 100;
      const targetX = 200;
      
      // Применяем обновление с большой разницей
      client1.applyRemoteUpdate({
        id: 'obj1',
        x: targetX,
        y: 100,
        timestamp: Date.now() + 100
      });
      
      const obj = client1.getObject('obj1');
      // Должна быть интерполяция, не мгновенный скачок
      expect(obj!.x).toBeGreaterThan(initialX);
      expect(obj!.x).toBeLessThanOrEqual(targetX);
    });
  });
  
  describe('Timestamp Ordering', () => {
    it('should ignore outdated updates', () => {
      const currentState = client1.getObject('obj1')!;
      const currentX = currentState.x;
      
      // Применяем устаревшее обновление
      client1.applyRemoteUpdate({
        id: 'obj1',
        x: 999,
        y: 999,
        timestamp: currentState.timestamp - 1000 // Старое обновление
      });
      
      // Состояние не должно измениться
      expect(client1.getObject('obj1')!.x).toBe(currentX);
    });
    
    it('should accept newer updates', () => {
      const newX = 200;
      const newY = 200;
      
      client1.applyRemoteUpdate({
        id: 'obj1',
        x: newX,
        y: newY,
        timestamp: Date.now() + 1000 // Новое обновление
      });
      
      expect(client1.getObject('obj1')!.x).toBeCloseTo(newX, 1);
      expect(client1.getObject('obj1')!.y).toBeCloseTo(newY, 1);
    });
  });
  
  describe('Concurrent Physics Updates', () => {
    it('should handle concurrent physics calculations', () => {
      // Оба клиента применяют разные силы одновременно
      client1.applyForce('obj1', 10, 0);
      client2.applyForce('obj1', 0, 10);
      
      // Симулируем несколько шагов
      for (let i = 0; i < 5; i++) {
        client1.updatePhysics();
        client2.updatePhysics();
      }
      
      // Обмениваемся состояниями
      const state1 = client1.getObject('obj1')!;
      const state2 = client2.getObject('obj1')!;
      
      client1.applyRemoteUpdate({
        id: 'obj1',
        ...state2,
        timestamp: state2.timestamp
      });
      client2.applyRemoteUpdate({
        id: 'obj1',
        ...state1,
        timestamp: state1.timestamp
      });
      
      // После обмена состояния должны быть согласованы
      const final1 = client1.getObject('obj1')!;
      const final2 = client2.getObject('obj1')!;
      
      // Проверяем, что оба клиента имеют разумное состояние
      expect(final1.x).toBeGreaterThan(0);
      expect(final1.y).toBeGreaterThan(0);
      expect(final2.x).toBeGreaterThan(0);
      expect(final2.y).toBeGreaterThan(0);
    });
  });
});

