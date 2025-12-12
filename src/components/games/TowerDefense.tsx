"use client";

import { GameState, UserProfile, TDTower, TDEnemy, TDGrid } from "@/lib/types";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Castle, Heart, Coins, GitCommitHorizontal, Skull, ArrowLeft, TrendingUp, Users, Zap } from "lucide-react";

type TowerDefenseProps = {
  onGameEnd: () => void;
  updateGameState: (newState: Partial<GameState>) => void;
  gameState: GameState;
  user: UserProfile;
  otherUser?: UserProfile;
};

const CELL_SIZE = 40;

const TOWER_SPECS = {
  basic: { cost: 25, range: 3 * CELL_SIZE, damage: 10, fireRate: 1, color: "#22d3ee", upgradeCost: 15 },
  fast: { cost: 40, range: 2.5 * CELL_SIZE, damage: 8, fireRate: 2, color: "#a855f7", upgradeCost: 25 },
  heavy: { cost: 60, range: 4 * CELL_SIZE, damage: 25, fireRate: 0.5, color: "#f59e0b", upgradeCost: 40 },
};

const ENEMY_SPECS = {
  basic: { health: 50, speed: CELL_SIZE / 2, value: 5, color: "#ef4444" },
  fast: { health: 30, speed: CELL_SIZE * 0.8, value: 8, color: "#f97316" },
  tank: { health: 150, speed: CELL_SIZE * 0.3, value: 15, color: "#991b1b" },
};

export function TowerDefense({ onGameEnd, updateGameState, gameState, user, otherUser }: TowerDefenseProps) {
  const { 
    tdGrid, 
    tdTowers, 
    tdEnemies, 
    tdWave, 
    tdBaseHealth, 
    tdResources, 
    tdStatus, 
    tdPaths,
    tdScores,
    tdSelectedTower,
    hostId 
  } = gameState;
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [localEnemies, setLocalEnemies] = useState<TDEnemy[]>([]);
  const [localTowers, setLocalTowers] = useState<TDTower[]>([]);
  const [projectiles, setProjectiles] = useState<{id: string, from: {x:number, y:number}, to: {x:number, y:number}, duration: number, start: number, damage: number}[]>([]);
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(tdSelectedTower || null);
  const [towerTypeToBuild, setTowerTypeToBuild] = useState<'basic' | 'fast' | 'heavy'>('basic');
  const waveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Синхронизация удаленного состояния с локальным
  useEffect(() => {
    setLocalEnemies(tdEnemies || []);
    setLocalTowers(tdTowers || []);
    setSelectedTowerId(tdSelectedTower || null);
  }, [tdEnemies, tdTowers, tdSelectedTower]);

  // Обновление очков при убийстве врагов
  const updateScore = useCallback((points: number) => {
    const currentScore = (tdScores?.[user.id] || 0) + points;
    updateGameState({
      tdScores: { ...tdScores, [user.id]: currentScore }
    });
  }, [tdScores, user.id, updateGameState]);

  // Основной игровой цикл
  useEffect(() => {
    if (tdStatus !== 'in-progress' || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    let lastTime = performance.now();

    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // --- ОБНОВЛЕНИЕ ВРАГОВ ---
      let enemiesReachedBase = 0;
      let updatedEnemies = localEnemies.map(enemy => {
        if (!tdPaths || tdPaths.length === 0) return enemy;
        
        const path = tdPaths[enemy.pathId || 0];
        if (enemy.pathIndex >= path.length - 1) {
          // Враг достиг базы
          enemiesReachedBase++;
          return null;
        }

        const targetPos = path[enemy.pathIndex + 1];
        const dx = targetPos.x - enemy.position.x;
        const dy = targetPos.y - enemy.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const moveDist = enemy.speed * deltaTime * 60; // Нормализация скорости

        if (dist < moveDist) {
          return { ...enemy, pathIndex: enemy.pathIndex + 1, position: targetPos };
        } else {
          const newX = enemy.position.x + (dx / dist) * moveDist;
          const newY = enemy.position.y + (dy / dist) * moveDist;
          return { ...enemy, position: { x: newX, y: newY } };
        }
      }).filter((e): e is TDEnemy => e !== null);

      // Обработка врагов, достигших базы
      if (enemiesReachedBase > 0) {
        const newBaseHealth = Math.max(0, (tdBaseHealth || 0) - enemiesReachedBase);
        updateGameState({ 
          tdBaseHealth: newBaseHealth,
          tdEnemies: updatedEnemies
        });
        if (newBaseHealth <= 0) {
          updateGameState({ tdStatus: 'game-over-loss' });
        }
      }

      // --- ОБНОВЛЕНИЕ БАШЕН И СНАРЯДОВ ---
      let newProjectiles: typeof projectiles = [];
      const updatedTowers = localTowers.map(tower => {
        const timeSinceFired = currentTime - tower.lastFired;
        const fireInterval = 1000 / tower.fireRate;
        
        if (timeSinceFired >= fireInterval) {
          let target: TDEnemy | null = null;
          let closestDist = tower.range;

          for (const enemy of updatedEnemies) {
            const towerX = tower.x * CELL_SIZE + CELL_SIZE / 2;
            const towerY = tower.y * CELL_SIZE + CELL_SIZE / 2;
            const dx = towerX - enemy.position.x;
            const dy = towerY - enemy.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < closestDist) {
              closestDist = dist;
              target = enemy;
            }
          }

          if (target) {
            const towerX = tower.x * CELL_SIZE + CELL_SIZE / 2;
            const towerY = tower.y * CELL_SIZE + CELL_SIZE / 2;
            newProjectiles.push({
              id: `proj_${currentTime}_${tower.id}`,
              from: { x: towerX, y: towerY },
              to: { x: target.position.x, y: target.position.y },
              duration: 200,
              start: currentTime,
              damage: tower.damage,
            });
            return { ...tower, lastFired: currentTime };
          }
        }
        return tower;
      });

      // --- ОБРАБОТКА СНАРЯДОВ ---
      const activeProjectiles = projectiles.filter(p => currentTime < p.start + p.duration);
      const newActiveProjectiles: typeof projectiles = [];
      const enemyHealthMap = new Map<string, { enemy: TDEnemy; health: number }>();
      
      // Инициализируем карту здоровья
      updatedEnemies.forEach(enemy => {
        enemyHealthMap.set(enemy.id, { enemy, health: enemy.health });
      });
      
      activeProjectiles.forEach(proj => {
        let hit = false;
        for (const [enemyId, data] of enemyHealthMap.entries()) {
          const dx = data.enemy.position.x - proj.to.x;
          const dy = data.enemy.position.y - proj.to.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 15 && !hit) {
            hit = true;
            const newHealth = data.health - proj.damage;
            enemyHealthMap.set(enemyId, { ...data, health: newHealth });
            break;
          }
        }
        
        if (!hit) {
          newActiveProjectiles.push(proj);
        }
      });
      
      // Обновляем врагов с новым здоровьем и собираем награды
      let totalResourcesGained = 0;
      let totalScoreGained = 0;
      updatedEnemies = [];
      
      for (const [enemyId, data] of enemyHealthMap.entries()) {
        if (data.health <= 0) {
          // Враг убит
          totalResourcesGained += data.enemy.value;
          totalScoreGained += data.enemy.value;
        } else {
          // Враг выжил
          updatedEnemies.push({ ...data.enemy, health: data.health });
        }
      }
      
      // Обновляем ресурсы и очки
      if (totalResourcesGained > 0 || totalScoreGained > 0) {
        updateScore(totalScoreGained);
        updateGameState({
          tdResources: (tdResources || 0) + totalResourcesGained
        });
      }

      // --- ОТРИСОВКА ---
      // Сетка и дорожки
      tdGrid?.forEach(node => {
        ctx.fillStyle = node.isPath ? '#404040' : '#166534';
        ctx.fillRect(node.x * CELL_SIZE, node.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = '#262626';
        ctx.strokeRect(node.x * CELL_SIZE, node.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      });

      // Дорожки (визуализация)
      if (tdPaths) {
        tdPaths.forEach((path, pathIdx) => {
          ctx.strokeStyle = pathIdx === 0 ? '#3b82f6' : pathIdx === 1 ? '#8b5cf6' : '#ec4899';
          ctx.lineWidth = 3;
          ctx.beginPath();
          if (path.length > 0) {
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
              ctx.lineTo(path[i].x, path[i].y);
            }
          }
          ctx.stroke();
        });
      }

      // Башни
      updatedTowers.forEach(tower => {
        const towerX = tower.x * CELL_SIZE + CELL_SIZE / 2;
        const towerY = tower.y * CELL_SIZE + CELL_SIZE / 2;
        const spec = TOWER_SPECS[tower.type];
        
        // Выделение выбранной башни
        if (selectedTowerId === tower.id) {
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(towerX, towerY, tower.range, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = spec.color;
        ctx.beginPath();
        ctx.arc(towerX, towerY, CELL_SIZE / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Уровень башни
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`L${tower.level}`, towerX, towerY + 3);
      });

      // Враги
      updatedEnemies.forEach(enemy => {
        const spec = ENEMY_SPECS[enemy.type];
        ctx.fillStyle = spec.color;
        ctx.beginPath();
        ctx.arc(enemy.position.x, enemy.position.y, CELL_SIZE / 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Полоса здоровья
        const barWidth = 30;
        const barHeight = 4;
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(enemy.position.x - barWidth / 2, enemy.position.y - 20, barWidth, barHeight);
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(enemy.position.x - barWidth / 2, enemy.position.y - 20, (enemy.health / enemy.maxHealth) * barWidth, barHeight);
      });

      // Снаряды
      [...newActiveProjectiles, ...newProjectiles].forEach(p => {
        const progress = Math.min(1, (currentTime - p.start) / p.duration);
        const x = p.from.x + (p.to.x - p.from.x) * progress;
        const y = p.from.y + (p.to.y - p.from.y) * progress;
        
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      setLocalEnemies(updatedEnemies);
      setLocalTowers(updatedTowers);
      setProjectiles([...newActiveProjectiles, ...newProjectiles]);

      // Синхронизация состояния (только если есть изменения)
      const enemiesChanged = updatedEnemies.length !== (tdEnemies?.length || 0) ||
        updatedEnemies.some((e, i) => {
          const oldEnemy = tdEnemies?.[i];
          return !oldEnemy || e.id !== oldEnemy.id || e.health !== oldEnemy.health || 
                 e.position.x !== oldEnemy.position.x || e.position.y !== oldEnemy.position.y;
        });
      
      if (enemiesChanged && enemiesReachedBase === 0) {
        updateGameState({
          tdEnemies: updatedEnemies
        });
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [tdStatus, localEnemies, localTowers, projectiles, tdGrid, tdPaths, selectedTowerId, tdEnemies, tdTowers, tdBaseHealth, tdResources, updateGameState, updateScore]);

  // Построение башни
  const handleBuildTower = (x: number, y: number) => {
    if (tdStatus !== 'waiting' && tdStatus !== 'in-progress') return;
    const node = tdGrid?.find(n => n.x === x && n.y === y);
    if (!node || node.isPath) return;
    
    // Проверка, нет ли уже башни на этой клетке
    if (tdTowers?.some(t => t.x === x && t.y === y)) return;

    const towerSpec = TOWER_SPECS[towerTypeToBuild];
    if ((tdResources || 0) < towerSpec.cost) return;

    const newTower: TDTower = {
      id: `tower_${x}_${y}_${Date.now()}`,
      x,
      y,
      type: towerTypeToBuild,
      level: 1,
      cost: towerSpec.cost,
      range: towerSpec.range,
      damage: towerSpec.damage,
      fireRate: towerSpec.fireRate,
      lastFired: 0,
      ownerId: user.id,
    };
    
    updateGameState({
      tdTowers: [...(tdTowers || []), newTower],
      tdResources: (tdResources || 0) - towerSpec.cost
    });
  };

  // Апгрейд башни
  const handleUpgradeTower = useCallback(() => {
    if (!selectedTowerId) return;
    const tower = tdTowers?.find(t => t.id === selectedTowerId);
    if (!tower) return;
    
    const spec = TOWER_SPECS[tower.type];
    const upgradeCost = spec.upgradeCost * tower.level;
    
    if ((tdResources || 0) < upgradeCost) return;

    const upgradedTower: TDTower = {
      ...tower,
      level: tower.level + 1,
      damage: Math.floor(tower.damage * 1.5),
      fireRate: Math.min(tower.fireRate * 1.2, 5), // Максимум 5 выстрелов в секунду
      range: tower.range * 1.1,
    };

    updateGameState({
      tdTowers: (tdTowers || []).map(t => t.id === selectedTowerId ? upgradedTower : t),
      tdResources: (tdResources || 0) - upgradeCost
    });
  }, [selectedTowerId, tdTowers, tdResources, updateGameState]);

  // Выбор башни
  const handleSelectTower = (x: number, y: number) => {
    const tower = tdTowers?.find(t => t.x === x && t.y === y);
    if (tower) {
      setSelectedTowerId(tower.id);
      updateGameState({ tdSelectedTower: tower.id });
    } else {
      setSelectedTowerId(null);
      updateGameState({ tdSelectedTower: null });
    }
  };

  // Запуск волны
  const handleStartWave = () => {
    if (tdStatus !== 'waiting') return;
    const nextWave = (tdWave || 0) + 1;
    const enemiesToSpawn: TDEnemy[] = [];
    
    if (!tdPaths || tdPaths.length === 0) return;

    const enemyHealthBase = 50;
    const enemyCount = 5 + nextWave * 2;
    const waveMultiplier = 1 + nextWave * 0.2;

    for (let i = 0; i < enemyCount; i++) {
      const pathId = Math.floor(Math.random() * tdPaths.length);
      const path = tdPaths[pathId];
      if (path.length === 0) continue;
      
      const startPos = path[0];
      
      // Тип врага зависит от волны
      let enemyType: 'basic' | 'fast' | 'tank' = 'basic';
      if (nextWave > 3 && Math.random() < 0.3) {
        enemyType = Math.random() < 0.5 ? 'fast' : 'tank';
      } else if (nextWave > 5 && Math.random() < 0.5) {
        enemyType = Math.random() < 0.3 ? 'fast' : 'tank';
      }
      
      const spec = ENEMY_SPECS[enemyType];
      const health = Math.floor(spec.health * waveMultiplier);

      enemiesToSpawn.push({
        id: `enemy_${nextWave}_${i}_${Date.now()}`,
        type: enemyType,
        health,
        maxHealth: health,
        speed: spec.speed,
        pathIndex: 0,
        position: { x: startPos.x - (i * CELL_SIZE * 0.5), y: startPos.y },
        value: spec.value,
        pathId,
      });
    }
    
    updateGameState({ 
      tdWave: nextWave, 
      tdEnemies: enemiesToSpawn, 
      tdStatus: 'in-progress' 
    });
  };

  // Автоматический спавн врагов во время волны
  useEffect(() => {
    if (tdStatus !== 'in-progress' || !tdPaths || tdPaths.length === 0) {
      if (waveTimerRef.current) {
        clearInterval(waveTimerRef.current);
        waveTimerRef.current = null;
      }
      return;
    }

    // Проверяем, остались ли враги
    if ((tdEnemies?.length || 0) === 0 && (tdWave || 0) > 0) {
      // Волна завершена
      updateGameState({ tdStatus: 'waiting' });
      if (waveTimerRef.current) {
        clearInterval(waveTimerRef.current);
        waveTimerRef.current = null;
      }
      return;
    }

    // Автоматический спавн каждые 3 секунды во время волны
    if (!waveTimerRef.current) {
      waveTimerRef.current = setInterval(() => {
        if (tdStatus !== 'in-progress' || !tdPaths) return;
        
        const pathId = Math.floor(Math.random() * tdPaths.length);
        const path = tdPaths[pathId];
        if (path.length === 0) return;
        
        const startPos = path[0];
        const wave = tdWave || 1;
        const waveMultiplier = 1 + wave * 0.2;
        
        let enemyType: 'basic' | 'fast' | 'tank' = 'basic';
        if (wave > 3 && Math.random() < 0.3) {
          enemyType = Math.random() < 0.5 ? 'fast' : 'tank';
        }
        
        const spec = ENEMY_SPECS[enemyType];
        const health = Math.floor(spec.health * waveMultiplier);

        const newEnemy: TDEnemy = {
          id: `enemy_auto_${Date.now()}_${Math.random()}`,
          type: enemyType,
          health,
          maxHealth: health,
          speed: spec.speed,
          pathIndex: 0,
          position: startPos,
          value: spec.value,
          pathId,
        };

        updateGameState({
          tdEnemies: [...(tdEnemies || []), newEnemy]
        });
      }, 3000);
    }

    return () => {
      if (waveTimerRef.current) {
        clearInterval(waveTimerRef.current);
        waveTimerRef.current = null;
      }
    };
  }, [tdStatus, tdPaths, tdEnemies, tdWave, updateGameState]);

  // Интерактивная сетка
  const renderGridForInteraction = () => {
    if (!tdGrid) return null;
    const gridWidth = Math.max(...tdGrid.map(n => n.x)) + 1;
    return (
      <div className="absolute inset-0 grid" style={{gridTemplateColumns: `repeat(${gridWidth}, minmax(0, 1fr))`}}>
        {tdGrid.map(node => (
          <div
            key={node.id}
            onClick={() => {
              const tower = tdTowers?.find(t => t.x === node.x && t.y === node.y);
              if (tower) {
                handleSelectTower(node.x, node.y);
              } else {
                handleBuildTower(node.x, node.y);
              }
            }}
            className={`
              w-full h-full border border-transparent 
              ${!node.isPath && 'cursor-pointer hover:bg-green-500/20'}
            `}
          />
        ))}
      </div>
    );
  };

  const selectedTower = selectedTowerId ? tdTowers?.find(t => t.id === selectedTowerId) : null;
  const selectedSpec = selectedTower ? TOWER_SPECS[selectedTower.type] : null;

  // Leaderboard
  const leaderboardEntries = tdScores ? Object.entries(tdScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5) : [];

  let statusText = "";
  if (tdStatus === 'waiting') statusText = `Ожидание волны ${(tdWave || 0) + 1}...`;
  if (tdStatus === 'in-progress') statusText = `Волна ${(tdWave || 0)} в процессе...`;
  if (tdStatus === 'game-over-win') statusText = "Победа! База защищена!";
  if (tdStatus === 'game-over-loss') statusText = "Игра окончена! База пала.";

  const gridWidthPx = tdGrid ? (Math.max(...tdGrid.map(n => n.x)) + 1) * CELL_SIZE : 0;
  const gridHeightPx = tdGrid ? (Math.max(...tdGrid.map(n => n.y)) + 1) * CELL_SIZE : 0;

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 gap-4">
      <Card className="bg-neutral-950/80 border-white/10 backdrop-blur-sm w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center justify-center gap-2">
            <Castle /> Tower Defense
          </CardTitle>
          <CardDescription className="text-neutral-400">{statusText}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {/* Статистика */}
          <div className="flex justify-between w-full text-white px-2">
            <div className="flex items-center gap-2">
              <Heart className="text-red-500" /> 
              <span className="font-bold">{tdBaseHealth || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="text-yellow-500" /> 
              <span className="font-bold">{tdResources || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <GitCommitHorizontal className="text-blue-400" /> 
              <span className="font-bold">{tdWave || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Skull className="text-purple-400" /> 
              <span className="font-bold">{tdScores?.[user.id] || 0}</span>
            </div>
          </div>

          {/* Выбор типа башни */}
          <div className="flex gap-2 w-full justify-center">
            {(['basic', 'fast', 'heavy'] as const).map(type => (
              <Button
                key={type}
                variant={towerTypeToBuild === type ? "default" : "outline"}
                size="sm"
                onClick={() => setTowerTypeToBuild(type)}
                className="text-xs"
              >
                {type === 'basic' && '⚡ Базовая'}
                {type === 'fast' && '🚀 Быстрая'}
                {type === 'heavy' && '💪 Тяжелая'}
                <span className="ml-1 text-yellow-400">({TOWER_SPECS[type].cost})</span>
              </Button>
            ))}
          </div>

          {/* Игровое поле */}
          <div className="relative bg-black/50 border-2 border-white/20" style={{ width: gridWidthPx, height: gridHeightPx }}>
            <canvas ref={canvasRef} width={gridWidthPx} height={gridHeightPx} />
            {renderGridForInteraction()}
          </div>

          {/* Панель апгрейда башни */}
          {selectedTower && selectedSpec && (
            <Card className="w-full bg-neutral-900/50 border-white/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white mb-2">
                      Башня {selectedTower.type} (Уровень {selectedTower.level})
                    </h3>
                    <div className="text-sm text-neutral-400 space-y-1">
                      <div>Урон: {selectedTower.damage}</div>
                      <div>Скорость: {selectedTower.fireRate.toFixed(1)}/с</div>
                      <div>Дальность: {Math.round(selectedTower.range / CELL_SIZE)}</div>
                    </div>
                  </div>
                  <Button
                    onClick={handleUpgradeTower}
                    disabled={(tdResources || 0) < selectedSpec.upgradeCost * selectedTower.level}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Улучшить ({selectedSpec.upgradeCost * selectedTower.level})
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Leaderboard */}
          {leaderboardEntries.length > 0 && (
            <Card className="w-full bg-neutral-900/50 border-white/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" /> Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leaderboardEntries.map(([userId, score], idx) => {
                    const player = userId === user.id ? user : otherUser;
                    return (
                      <div key={userId} className="flex items-center justify-between p-2 bg-neutral-800/50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-yellow-400">#{idx + 1}</span>
                          <span className="text-white">{player?.name || 'Игрок'}</span>
                        </div>
                        <span className="font-bold text-purple-400">{score}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 p-4">
          {tdStatus === 'waiting' && (
            <Button onClick={handleStartWave} className="w-full bg-white text-black hover:bg-neutral-200">
              <Zap className="mr-2 h-4 w-4" />
              Начать волну {(tdWave || 0) + 1}
            </Button>
          )}
          {(tdStatus === 'game-over-win' || tdStatus === 'game-over-loss') && (
            <Button onClick={onGameEnd} className="w-full bg-white text-black hover:bg-neutral-200">
              Играть снова
            </Button>
          )}
          <Button onClick={onGameEnd} variant="ghost" size="sm" className="w-full text-neutral-400 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад в лобби
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
