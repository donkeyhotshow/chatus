"use client";

import { GameState, UserProfile, TDTower, TDEnemy } from "@/lib/types";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Castle, Heart, Coins, GitCommitHorizontal, Skull, ArrowLeft, TrendingUp, Users, Zap, Target } from "lucide-react";

type TowerDefenseProps = {
  onGameEnd: () => void;
  updateGameState: (newState: Partial<GameState>) => void;
  gameState: GameState;
  user: UserProfile;
  otherUser?: UserProfile;
};

const CELL_SIZE = 40;
const GRID_W = 15;
const GRID_H = 11;

// P1-001 FIX: Mobile-responsive cell size with better detection
function getCellSize(): number {
  if (typeof window === 'undefined') return CELL_SIZE;

  // Определяем мобильное устройство
  const isMobile = window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Get available width accounting for padding
  const containerPadding = 32; // 16px on each side
  const availableWidth = window.innerWidth - containerPadding;

  if (isMobile) {
    // На мобильных используем адаптивный размер сетки
    const maxWidth = Math.min(availableWidth, 400);
    const calculatedSize = Math.floor(maxWidth / GRID_W);
    return Math.max(calculatedSize, 18); // Минимум 18px для touch targets
  }

  const maxWidth = Math.min(availableWidth, 600);
  return Math.min(Math.floor(maxWidth / GRID_W), CELL_SIZE);
}

// Проверка поддержки WebGL/Canvas для мобильных
function checkCanvasSupport(): { supported: boolean; error?: string } {
  if (typeof window === 'undefined') return { supported: false, error: 'SSR' };

  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { supported: false, error: 'Canvas 2D not supported' };
    }

    // Проверяем базовые операции
    ctx.fillRect(0, 0, 1, 1);

    return { supported: true };
  } catch (error) {
    return { supported: false, error: String(error) };
  }
}

// Улучшенные спецификации башен (из твоего кода)
const TOWER_SPECS = {
  basic: { cost: 25, range: 120, damage: 10, fireRate: 1, color: "#22d3ee", upgradeCost: 15 },
  fast: { cost: 40, range: 100, damage: 8, fireRate: 2, color: "#a855f7", upgradeCost: 25 },
  heavy: { cost: 60, range: 160, damage: 25, fireRate: 0.5, color: "#f59e0b", upgradeCost: 40 },
};

// Улучшенные спецификации врагов (из твоего кода)
const ENEMY_SPECS = {
  basic: { health: 50, speed: 20, value: 5, color: "#ef4444" },
  fast: { health: 30, speed: 32, value: 8, color: "#f97316" },
  tank: { health: 150, speed: 12, value: 15, color: "#991b1b" },
};

// Дорожки (из твоего кода)
const PATHS_Y = [3, 5, 7]; // три дорожки

function isPath(_x: number, y: number): boolean {
  return PATHS_Y.includes(y);
}

export function TowerDefense({ onGameEnd, updateGameState, gameState, user, otherUser }: TowerDefenseProps) {
  const {
    tdTowers = [],
    tdEnemies = [],
    tdWave = 0,
    tdBaseHealth = 20,
    tdResources = 100,
    tdStatus = 'waiting',
    tdScores = {},
    tdSelectedTower
  } = gameState;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(performance.now());
  const [cellSize, setCellSize] = useState(CELL_SIZE);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);

  // Check canvas support on mount
  useEffect(() => {
    const { supported, error } = checkCanvasSupport();
    if (!supported) {
      setCanvasError(error || 'Canvas not supported');
    } else {
      setIsCanvasReady(true);
    }
  }, []);

  // Update cell size on resize for mobile responsiveness
  useEffect(() => {
    const updateCellSize = () => {
      const newSize = getCellSize();
      setCellSize(newSize);

      // Обновляем размер canvas
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = GRID_W * newSize;
        canvas.height = GRID_H * newSize;
      }
    };

    updateCellSize();
    window.addEventListener('resize', updateCellSize);
    window.addEventListener('orientationchange', () => {
      // Задержка для корректного определения размеров после поворота
      setTimeout(updateCellSize, 100);
    });

    return () => {
      window.removeEventListener('resize', updateCellSize);
      window.removeEventListener('orientationchange', updateCellSize);
    };
  }, []);
  // const _waveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Локальное состояние для плавной анимации
  const [localEnemies, setLocalEnemies] = useState<TDEnemy[]>(tdEnemies);
  const [localTowers, setLocalTowers] = useState<TDTower[]>(tdTowers);
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(tdSelectedTower || null);
  const [towerTypeToBuild, setTowerTypeToBuild] = useState<'basic' | 'fast' | 'heavy'>('basic');
  const [spawning, setSpawning] = useState(false);

  // Синхронизация удаленного состояния с локальным
  useEffect(() => {
    setLocalEnemies(tdEnemies);
    setLocalTowers(tdTowers);
    setSelectedTowerId(tdSelectedTower || null);
  }, [tdEnemies, tdTowers, tdSelectedTower]);

  // Обновление очков при убийстве врагов
  const updateScore = useCallback((points: number) => {
    const currentScore = (tdScores[user.id] || 0) + points;
    updateGameState({
      tdScores: { ...tdScores, [user.id]: currentScore }
    });
  }, [tdScores, user.id, updateGameState]);

  // Основной игровой цикл (улучшенная версия)
  useEffect(() => {
    if (tdStatus !== 'in-progress' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      // --- ОБНОВЛЕНИЕ ВРАГОВ ---
      const updatedEnemies = localEnemies.map(enemy => {
        const newX = enemy.position.x + enemy.speed * deltaTime;

        // Проверка достижения базы
        if (newX >= canvas.width) {
          // Враг достиг базы - обновляем здоровье базы
          const newBaseHealth = Math.max(0, tdBaseHealth - 1);
          updateGameState({
            tdBaseHealth: newBaseHealth,
            tdEnemies: localEnemies.filter(e => e.id !== enemy.id)
          });

          if (newBaseHealth <= 0) {
            updateGameState({ tdStatus: 'game-over-loss' });
          }
          return null;
        }

        return { ...enemy, position: { ...enemy.position, x: newX } };
      }).filter((e): e is TDEnemy => e !== null);

      // --- ОБНОВЛЕНИЕ БАШЕН И СТРЕЛЬБА ---
      let totalResourcesGained = 0;
      let totalScoreGained = 0;

      const updatedTowers = localTowers.map(tower => {
        const newTower = { ...tower };
        newTower.lastFired = Math.max(0, newTower.lastFired - deltaTime);

        if (newTower.lastFired <= 0) {
          // Поиск цели
          let target: TDEnemy | null = null;
          let minDist = Infinity;

          for (const enemy of updatedEnemies) {
            const dx = enemy.position.x - tower.x;
            const dy = enemy.position.y - tower.y;
            const dist = Math.hypot(dx, dy);

            if (dist < tower.range && dist < minDist) {
              minDist = dist;
              target = enemy;
            }
          }

          if (target) {
            // Стрельба
            target.health -= tower.damage;
            newTower.lastFired = 1 / tower.fireRate;

            // Проверка убийства врага
            if (target.health <= 0) {
              totalResourcesGained += target.value;
              totalScoreGained += target.value;
              const enemyIndex = updatedEnemies.indexOf(target);
              if (enemyIndex > -1) {
                updatedEnemies.splice(enemyIndex, 1);
              }
            }
          }
        }

        return newTower;
      });

      // Обновляем ресурсы и очки если есть изменения
      if (totalResourcesGained > 0) {
        updateScore(totalScoreGained);
        updateGameState({
          tdResources: tdResources + totalResourcesGained,
          tdEnemies: updatedEnemies
        });
      }

      // --- ОТРИСОВКА ---
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Сетка - используем динамический cellSize
      const currentCellSize = canvas.width / GRID_W;
      for (let x = 0; x < GRID_W; x++) {
        for (let y = 0; y < GRID_H; y++) {
          ctx.fillStyle = isPath(x, y) ? '#555' : '#1a3';
          ctx.fillRect(x * currentCellSize, y * currentCellSize, currentCellSize - 1, currentCellSize - 1);
        }
      }

      // Башни
      updatedTowers.forEach(tower => {
        const spec = TOWER_SPECS[tower.type];

        // Дальность выбранной башни
        if (selectedTowerId === tower.id) {
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Башня
        ctx.fillStyle = spec.color;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, 12, 0, Math.PI * 2);
        ctx.fill();

        // Уровень
        ctx.fillStyle = 'white';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`L${tower.level}`, tower.x, tower.y + 3);
      });

      // Враги
      updatedEnemies.forEach(enemy => {
        const spec = ENEMY_SPECS[enemy.type];

        // Враг
        ctx.fillStyle = spec.color;
        ctx.beginPath();
        ctx.arc(enemy.position.x, enemy.position.y, 8, 0, Math.PI * 2);
        ctx.fill();

        // Полоса здоровья
        const barWidth = 20;
        const barHeight = 3;
        const healthPercent = enemy.health / enemy.maxHealth;

        ctx.fillStyle = '#dc2626';
        ctx.fillRect(enemy.position.x - barWidth / 2, enemy.position.y - 15, barWidth, barHeight);
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(enemy.position.x - barWidth / 2, enemy.position.y - 15, barWidth * healthPercent, barHeight);
      });

      setLocalEnemies(updatedEnemies);
      setLocalTowers(updatedTowers);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [tdStatus, localEnemies, localTowers, selectedTowerId, tdBaseHealth, tdResources, updateGameState, updateScore]);

  // Построение башни (улучшенная версия)
  const handleBuildTower = useCallback((x: number, y: number) => {
    if (tdStatus !== 'waiting' && tdStatus !== 'in-progress') return;
    if (isPath(x, y)) return;

    // Проверка, нет ли уже башни на этой клетке - используем cellSize
    if (tdTowers.some(t => Math.floor(t.x / cellSize) === x && Math.floor(t.y / cellSize) === y)) return;

    const towerSpec = TOWER_SPECS[towerTypeToBuild];
    if (tdResources < towerSpec.cost) return;

    const newTower: TDTower = {
      id: `tower_${x}_${y}_${Date.now()}`,
      x: x * cellSize + cellSize / 2,
      y: y * cellSize + cellSize / 2,
      type: towerTypeToBuild,
      level: 1,
      cost: towerSpec.cost,
      range: towerSpec.range * (cellSize / CELL_SIZE), // Scale range with cell size
      damage: towerSpec.damage,
      fireRate: towerSpec.fireRate,
      lastFired: 0,
      ownerId: user.id,
    };

    updateGameState({
      tdTowers: [...tdTowers, newTower],
      tdResources: tdResources - towerSpec.cost
    });
  }, [tdStatus, tdTowers, tdResources, towerTypeToBuild, user.id, updateGameState, cellSize]);

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

  // Обработчик кликов по Canvas
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Учитываем масштабирование canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX / cellSize);
    const y = Math.floor((e.clientY - rect.top) * scaleY / cellSize);

    // Проверяем, есть ли башня на этой клетке
    const tower = tdTowers.find(t =>
      Math.floor(t.x / cellSize) === x && Math.floor(t.y / cellSize) === y
    );

    if (tower) {
      // Выбираем башню
      setSelectedTowerId(tower.id);
      updateGameState({ tdSelectedTower: tower.id });
    } else {
      // Строим новую башню
      handleBuildTower(x, y);
      setSelectedTowerId(null);
      updateGameState({ tdSelectedTower: null });
    }
  }, [tdTowers, handleBuildTower, updateGameState, cellSize]);

  // Запуск волны (улучшенная версия)
  const handleStartWave = useCallback(() => {
    if (tdStatus !== 'waiting' || spawning) return;

    const nextWave = tdWave + 1;
    setSpawning(true);

    const enemyCount = 5 + nextWave * 2;
    const waveMultiplier = 1 + nextWave * 0.2;

    updateGameState({
      tdWave: nextWave,
      tdStatus: 'in-progress'
    });

    // Спавн врагов с интервалом
    let spawned = 0;
    const spawnInterval = setInterval(() => {
      const lane = PATHS_Y[Math.floor(Math.random() * PATHS_Y.length)] ?? 0;

      // Определяем тип врага
      let enemyType: 'basic' | 'fast' | 'tank' = 'basic';
      if (nextWave > 3 && Math.random() < 0.3) {
        enemyType = Math.random() < 0.5 ? 'fast' : 'tank';
      } else if (nextWave > 6 && Math.random() < 0.25) {
        enemyType = 'tank';
      }

      const spec = ENEMY_SPECS[enemyType];
      const health = Math.floor(spec.health * waveMultiplier);

      const newEnemy: TDEnemy = {
        id: `enemy_${nextWave}_${spawned}_${Date.now()}`,
        type: enemyType,
        health,
        maxHealth: health,
        speed: spec.speed * (cellSize / CELL_SIZE), // Scale speed with cell size
        pathIndex: 0,
        position: { x: 0, y: lane * cellSize + cellSize / 2 },
        value: spec.value,
      };

      updateGameState({
        tdEnemies: [...localEnemies, newEnemy]
      });

      spawned++;
      if (spawned >= enemyCount) {
        clearInterval(spawnInterval);
        setSpawning(false);
      }
    }, 2000); // Спавн каждые 2 секунды

  }, [tdStatus, tdWave, spawning, localEnemies, updateGameState]);

  // Проверка завершения волны
  useEffect(() => {
    if (tdStatus === 'in-progress' && localEnemies.length === 0 && !spawning && tdWave > 0) {
      // Волна завершена
      updateGameState({ tdStatus: 'waiting' });
    }
  }, [tdStatus, localEnemies.length, spawning, tdWave, updateGameState]);

  const selectedTower = selectedTowerId ? tdTowers.find(t => t.id === selectedTowerId) : null;
  const selectedSpec = selectedTower ? TOWER_SPECS[selectedTower.type] : null;

  // Leaderboard
  const leaderboardEntries = Object.entries(tdScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  let statusText = "";
  if (tdStatus === 'waiting') statusText = `Ожидание волны ${tdWave + 1}...`;
  if (tdStatus === 'in-progress') statusText = `Волна ${tdWave} в процессе...`;
  if (tdStatus === 'game-over-win') statusText = "Победа! База защищена!";
  if (tdStatus === 'game-over-loss') statusText = "Игра окончена! База пала.";

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 gap-4">
      <Card className="bg-neutral-950/80 border-white/10 backdrop-blur-sm w-full max-w-4xl">
        <CardHeader className="relative">
          <Button
            onClick={onGameEnd}
            variant="ghost"
            size="sm"
            className="absolute top-4 left-4 text-neutral-400 hover:text-white z-10"
            title="Назад в лобби"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
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
              <span className="font-bold">{tdBaseHealth}</span>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="text-yellow-500" />
              <span className="font-bold">{tdResources}</span>
            </div>
            <div className="flex items-center gap-2">
              <GitCommitHorizontal className="text-blue-400" />
              <span className="font-bold">{tdWave}</span>
            </div>
            <div className="flex items-center gap-2">
              <Skull className="text-purple-400" />
              <span className="font-bold">{tdScores[user.id] || 0}</span>
            </div>
          </div>

          {/* Выбор типа башни */}
          <div className="flex gap-2 w-full justify-center">
            {(['basic', 'fast', 'heavy'] as const).map(type => (
              <Button
                key={type}
                variant={towerTypeToBuild === type ? "primary" : "outline"}
                size="sm"
                onClick={() => setTowerTypeToBuild(type)}
                className="text-xs"
                disabled={tdResources < TOWER_SPECS[type].cost}
              >
                {type === 'basic' && <Target className="w-3 h-3 mr-1" />}
                {type === 'fast' && <Zap className="w-3 h-3 mr-1" />}
                {type === 'heavy' && <Castle className="w-3 h-3 mr-1" />}
                {type === 'basic' && 'Базовая'}
                {type === 'fast' && 'Быстрая'}
                {type === 'heavy' && 'Тяжелая'}
                <span className="ml-1 text-yellow-400">({TOWER_SPECS[type].cost})</span>
              </Button>
            ))}
          </div>

          {/* Игровое поле */}
          {canvasError ? (
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-6 text-center">
              <p className="text-red-400 mb-2">Не удалось загрузить игру</p>
              <p className="text-sm text-neutral-400">{canvasError}</p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
                className="mt-4"
              >
                Перезагрузить
              </Button>
            </div>
          ) : !isCanvasReady ? (
            <div className="bg-neutral-900/50 border border-white/10 rounded-lg p-6 text-center">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-neutral-400">Загрузка игры...</p>
            </div>
          ) : (
            <div className="relative bg-black/50 border-2 border-white/20 overflow-hidden rounded-lg">
              <canvas
                ref={canvasRef}
                width={GRID_W * cellSize}
                height={GRID_H * cellSize}
                onClick={handleCanvasClick}
                onTouchStart={(e) => {
                  // Предотвращаем зум на мобильных
                  e.preventDefault();
                }}
                onTouchEnd={(e) => {
                  // Обрабатываем touch как click
                  const touch = e.changedTouches[0];
                  if (touch && canvasRef.current) {
                    const rect = canvasRef.current.getBoundingClientRect();
                    const x = Math.floor((touch.clientX - rect.left) / cellSize);
                    const y = Math.floor((touch.clientY - rect.top) / cellSize);

                    const tower = tdTowers.find(t =>
                      Math.floor(t.x / cellSize) === x && Math.floor(t.y / cellSize) === y
                    );

                    if (tower) {
                      setSelectedTowerId(tower.id);
                      updateGameState({ tdSelectedTower: tower.id });
                    } else {
                      handleBuildTower(x, y);
                      setSelectedTowerId(null);
                      updateGameState({ tdSelectedTower: null });
                    }
                  }
                }}
                className="cursor-pointer touch-none select-none"
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  imageRendering: 'pixelated',
                  WebkitTapHighlightColor: 'transparent'
                }}
              />
            </div>
          )}

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
            <Button
              onClick={handleStartWave}
              className="w-full bg-white text-black hover:bg-neutral-200"
              disabled={spawning}
            >
              <Zap className="mr-2 h-4 w-4" />
              {spawning ? 'Спавн врагов...' : `Начать волну ${tdWave + 1}`}
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
