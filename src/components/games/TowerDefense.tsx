"use client";

import { GameState, UserProfile, TDTower, TDEnemy } from "@/lib/types";
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Castle, Heart, Coins, GitCommitHorizontal, Skull, TrendingUp, Users, Zap, Target } from "lucide-react";
import GameLayout from "./GameLayout";
import { PremiumCard, PremiumCardContent, PremiumCardHeader, PremiumCardTitle } from "../ui/premium-card";
import { PremiumButton } from "../ui/premium-button";

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

const TOWER_SPECS = {
  basic: { cost: 25, range: 120, damage: 10, fireRate: 1, color: "#22d3ee", upgradeCost: 15 },
  fast: { cost: 40, range: 100, damage: 8, fireRate: 2, color: "#a855f7", upgradeCost: 25 },
  heavy: { cost: 60, range: 160, damage: 25, fireRate: 0.5, color: "#f59e0b", upgradeCost: 40 },
};

const ENEMY_SPECS = {
  basic: { health: 50, speed: 20, value: 5, color: "#ef4444" },
  fast: { health: 30, speed: 32, value: 8, color: "#f97316" },
  tank: { health: 150, speed: 12, value: 15, color: "#991b1b" },
};

const PATHS_Y = [3, 5, 7];
function isPath(_x: number, y: number): boolean { return PATHS_Y.includes(y); }

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
  const [localEnemies, setLocalEnemies] = useState<TDEnemy[]>(tdEnemies);
  const [localTowers, setLocalTowers] = useState<TDTower[]>(tdTowers);
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(tdSelectedTower || null);
  const [towerTypeToBuild, setTowerTypeToBuild] = useState<'basic' | 'fast' | 'heavy'>('basic');
  const [spawning, setSpawning] = useState(false);

  useEffect(() => {
    setLocalEnemies(tdEnemies);
    setLocalTowers(tdTowers);
    setSelectedTowerId(tdSelectedTower || null);
  }, [tdEnemies, tdTowers, tdSelectedTower]);

  const updateScore = useCallback((points: number) => {
    const currentScore = (tdScores[user.id] || 0) + points;
    updateGameState({ tdScores: { ...tdScores, [user.id]: currentScore } });
  }, [tdScores, user.id, updateGameState]);

  const renderGame = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, deltaTime: number) => {
    const currentCellSize = width / GRID_W;

    // Update Enemies
    const updatedEnemies = localEnemies.map(enemy => {
      const newX = enemy.position.x + enemy.speed * deltaTime;
      if (newX >= width) {
        const newBaseHealth = Math.max(0, tdBaseHealth - 1);
        updateGameState({ tdBaseHealth: newBaseHealth, tdEnemies: localEnemies.filter(e => e.id !== enemy.id) });
        if (newBaseHealth <= 0) updateGameState({ tdStatus: 'game-over-loss' });
        return null;
      }
      return { ...enemy, position: { ...enemy.position, x: newX } };
    }).filter((e): e is TDEnemy => e !== null);

    // Update Towers
    let totalResourcesGained = 0;
    let totalScoreGained = 0;
    const updatedTowers = localTowers.map(tower => {
      const newTower = { ...tower };
      newTower.lastFired = Math.max(0, newTower.lastFired - deltaTime);
      if (newTower.lastFired <= 0) {
        let target: TDEnemy | null = null;
        let minDist = Infinity;
        for (const enemy of updatedEnemies) {
          const dx = enemy.position.x - tower.x;
          const dy = enemy.position.y - tower.y;
          const dist = Math.hypot(dx, dy);
          if (dist < tower.range && dist < minDist) { minDist = dist; target = enemy; }
        }
        if (target) {
          target.health -= tower.damage;
          newTower.lastFired = 1 / tower.fireRate;
          if (target.health <= 0) {
            totalResourcesGained += target.value;
            totalScoreGained += target.value;
            const idx = updatedEnemies.indexOf(target);
            if (idx > -1) updatedEnemies.splice(idx, 1);
          }
        }
      }
      return newTower;
    });

    if (totalResourcesGained > 0) {
      updateScore(totalScoreGained);
      updateGameState({ tdResources: tdResources + totalResourcesGained, tdEnemies: updatedEnemies });
    }

    // Draw
    ctx.clearRect(0, 0, width, height);
    for (let x = 0; x < GRID_W; x++) {
      for (let y = 0; y < GRID_H; y++) {
        ctx.fillStyle = isPath(x, y) ? '#262626' : '#14532d';
        ctx.fillRect(x * currentCellSize, y * currentCellSize, currentCellSize - 1, currentCellSize - 1);
      }
    }

    updatedTowers.forEach(tower => {
      const spec = TOWER_SPECS[tower.type];
      if (selectedTowerId === tower.id) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.fillStyle = spec.color;
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, currentCellSize * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.font = `${currentCellSize * 0.25}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(`L${tower.level}`, tower.x, tower.y + currentCellSize * 0.1);
    });

    updatedEnemies.forEach(enemy => {
      const spec = ENEMY_SPECS[enemy.type];
      ctx.fillStyle = spec.color;
      ctx.beginPath();
      ctx.arc(enemy.position.x, enemy.position.y, currentCellSize * 0.2, 0, Math.PI * 2);
      ctx.fill();
      const barW = currentCellSize * 0.5;
      const barH = 3;
      const pct = enemy.health / enemy.maxHealth;
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(enemy.position.x - barW / 2, enemy.position.y - currentCellSize * 0.4, barW, barH);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(enemy.position.x - barW / 2, enemy.position.y - currentCellSize * 0.4, barW * pct, barH);
    });

    setLocalEnemies(updatedEnemies);
    setLocalTowers(updatedTowers);
  }, [localEnemies, localTowers, selectedTowerId, tdBaseHealth, tdResources, updateGameState, updateScore]);

  useEffect(() => {
    if (tdStatus !== 'in-progress' || !canvasRef.current) return;
    const loop = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) renderGame(ctx, canvas.width, canvas.height, Math.min(dt, 0.1));
      }
      animationRef.current = requestAnimationFrame(loop);
    };
    animationRef.current = requestAnimationFrame(loop);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [tdStatus, renderGame]);

  const handleBuildTower = useCallback((x: number, y: number, cellSize: number) => {
    if (tdStatus !== 'waiting' && tdStatus !== 'in-progress') return;
    if (isPath(x, y)) return;
    if (tdTowers.some(t => Math.floor(t.x / cellSize) === x && Math.floor(t.y / cellSize) === y)) return;
    const spec = TOWER_SPECS[towerTypeToBuild];
    if (tdResources < spec.cost) return;
    const newTower: TDTower = {
      id: `tower_${x}_${y}_${Date.now()}`,
      x: x * cellSize + cellSize / 2,
      y: y * cellSize + cellSize / 2,
      type: towerTypeToBuild,
      level: 1,
      cost: spec.cost,
      range: spec.range * (cellSize / CELL_SIZE),
      damage: spec.damage,
      fireRate: spec.fireRate,
      lastFired: 0,
      ownerId: user.id,
    };
    updateGameState({ tdTowers: [...tdTowers, newTower], tdResources: tdResources - spec.cost });
  }, [tdStatus, tdTowers, tdResources, towerTypeToBuild, user.id, updateGameState]);

  const handleUpgradeTower = useCallback(() => {
    if (!selectedTowerId) return;
    const tower = tdTowers?.find(t => t.id === selectedTowerId);
    if (!tower) return;
    const spec = TOWER_SPECS[tower.type];
    const cost = spec.upgradeCost * tower.level;
    if (tdResources < cost) return;
    const upgraded: TDTower = {
      ...tower,
      level: tower.level + 1,
      damage: Math.floor(tower.damage * 1.5),
      fireRate: Math.min(tower.fireRate * 1.2, 5),
      range: tower.range * 1.1,
    };
    updateGameState({ tdTowers: tdTowers.map(t => t.id === selectedTowerId ? upgraded : t), tdResources: tdResources - cost });
  }, [selectedTowerId, tdTowers, tdResources, updateGameState]);

  const handleStartWave = useCallback((cellSize: number) => {
    if (tdStatus !== 'waiting' || spawning) return;
    const nextWave = tdWave + 1;
    setSpawning(true);
    updateGameState({ tdWave: nextWave, tdStatus: 'in-progress' });
    let spawned = 0;
    const count = 5 + nextWave * 2;
    const mult = 1 + nextWave * 0.2;
    const interval = setInterval(() => {
      const lane = PATHS_Y[Math.floor(Math.random() * PATHS_Y.length)] ?? 0;
      let type: 'basic' | 'fast' | 'tank' = 'basic';
      if (nextWave > 3 && Math.random() < 0.3) type = Math.random() < 0.5 ? 'fast' : 'tank';
      const spec = ENEMY_SPECS[type];
      const hp = Math.floor(spec.health * mult);
      const enemy: TDEnemy = {
        id: `enemy_${nextWave}_${spawned}_${Date.now()}`,
        type, health: hp, maxHealth: hp,
        speed: spec.speed * (cellSize / CELL_SIZE),
        pathIndex: 0,
        position: { x: 0, y: lane * cellSize + cellSize / 2 },
        value: spec.value,
      };
      updateGameState({ tdEnemies: [...localEnemies, enemy] });
      spawned++;
      if (spawned >= count) { clearInterval(interval); setSpawning(false); }
    }, 1500);
  }, [tdStatus, tdWave, spawning, localEnemies, updateGameState]);

  useEffect(() => {
    if (tdStatus === 'in-progress' && localEnemies.length === 0 && !spawning && tdWave > 0) {
      updateGameState({ tdStatus: 'waiting' });
    }
  }, [tdStatus, localEnemies.length, spawning, tdWave, updateGameState]);

  const selectedTower = selectedTowerId ? tdTowers.find(t => t.id === selectedTowerId) : null;
  const selectedSpec = selectedTower ? TOWER_SPECS[selectedTower.type] : null;

  return (
    <GameLayout
      title="Tower Defense"
      icon={<Castle className="w-5 h-5 text-blue-400" />}
      onExit={onGameEnd}
      score={tdScores[user.id] || 0}
      gameTime={tdWave}
      playerCount={1}
      responsiveOptions={{ gridCols: GRID_W, gridRows: GRID_H, maxCellSize: 40, padding: 16, accountForNav: true }}
      preferredOrientation="landscape"
    >
      {({ dimensions }) => (
        <div className="flex flex-col items-center gap-4 w-full h-full p-4 overflow-auto">
          <div className="flex justify-between w-full max-w-4xl px-4 py-2 bg-black/40 rounded-xl border border-white/10">
            <div className="flex items-center gap-2"><Heart className="text-red-500 w-4 h-4" /><span className="font-bold text-white">{tdBaseHealth}</span></div>
            <div className="flex items-center gap-2"><Coins className="text-yellow-500 w-4 h-4" /><span className="font-bold text-white">{tdResources}</span></div>
            <div className="flex items-center gap-2"><GitCommitHorizontal className="text-blue-400 w-4 h-4" /><span className="font-bold text-white">{tdWave}</span></div>
            <div className="flex items-center gap-2"><Skull className="text-purple-400 w-4 h-4" /><span className="font-bold text-white">{tdScores[user.id] || 0}</span></div>
          </div>

          <div className="flex gap-2 flex-wrap justify-center">
            {(['basic', 'fast', 'heavy'] as const).map(type => (
              <PremiumButton
                key={type}
                variant={towerTypeToBuild === type ? "default" : "secondary"}
                size="sm"
                onClick={() => setTowerTypeToBuild(type)}
                disabled={tdResources < TOWER_SPECS[type].cost}
                className="text-xs"
              >
                {type === 'basic' ? 'Базовая' : type === 'fast' ? 'Быстрая' : 'Тяжелая'} ({TOWER_SPECS[type].cost})
              </PremiumButton>
            ))}
          </div>

          <div className="relative bg-black/50 border-2 border-white/10 rounded-xl overflow-hidden shadow-2xl">
            <canvas
              ref={canvasRef}
              width={dimensions.width}
              height={dimensions.height}
              onClick={(e) => {
                const rect = canvasRef.current?.getBoundingClientRect();
                if (!rect) return;
                const x = Math.floor((e.clientX - rect.left) / dimensions.cellSize);
                const y = Math.floor((e.clientY - rect.top) / dimensions.cellSize);
                const tower = tdTowers.find(t => Math.floor(t.x / dimensions.cellSize) === x && Math.floor(t.y / dimensions.cellSize) === y);
                if (tower) { setSelectedTowerId(tower.id); updateGameState({ tdSelectedTower: tower.id }); }
                else { handleBuildTower(x, y, dimensions.cellSize); setSelectedTowerId(null); updateGameState({ tdSelectedTower: null }); }
              }}
              className="cursor-crosshair"
            />
          </div>

          {selectedTower && selectedSpec && (
            <PremiumCard variant="glass" className="w-full max-w-md">
              <PremiumCardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white">Ур. {selectedTower.level} {selectedTower.type}</h3>
                  <p className="text-xs text-white/40">Урон: {selectedTower.damage} | Скорость: {selectedTower.fireRate.toFixed(1)}</p>
                </div>
                <PremiumButton onClick={handleUpgradeTower} disabled={tdResources < selectedSpec.upgradeCost * selectedTower.level} size="sm">
                  Улучшить ({selectedSpec.upgradeCost * selectedTower.level})
                </PremiumButton>
              </PremiumCardContent>
            </PremiumCard>
          )}

          {tdStatus === 'waiting' && (
            <PremiumButton onClick={() => handleStartWave(dimensions.cellSize)} disabled={spawning} className="w-full max-w-md" glow>
              <Zap className="w-4 h-4 mr-2" /> {spawning ? 'Спавн...' : `Начать волну ${tdWave + 1}`}
            </PremiumButton>
          )}
        </div>
      )}
    </GameLayout>
  );
}
