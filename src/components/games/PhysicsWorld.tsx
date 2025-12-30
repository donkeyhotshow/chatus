"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as Matter from "matter-js";
import { Square, Circle, MousePointer2, Eraser, RefreshCw } from "lucide-react";
import { UserProfile } from "@/lib/types";
import { useChatService } from "@/hooks/useChatService";
import GameLayout from "./GameLayout";
import { PremiumButton } from "../ui/premium-button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const THEME = { background: "#0d0d0d", walls: "#222222", objects: "#ffffff" };

interface PhysicsWorldProps {
  roomId: string;
  user: UserProfile;
  onGameEnd: () => void;
}

export default function PhysicsWorld({ roomId, user, onGameEnd }: PhysicsWorldProps) {
  const { service } = useChatService(roomId, user);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);

  const [selectedTool, setSelectedTool] = useState<'box' | 'circle' | 'drag' | 'erase'>('box');
  const [mouseConstraint, setMouseConstraint] = useState<Matter.MouseConstraint | null>(null);
  const [error, setError] = useState(false);

  const initPhysics = useCallback((canvas: HTMLCanvasElement, width: number, height: number) => {
    try {
      const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint } = Matter;
      const engine = Engine.create();
      engineRef.current = engine;
      engine.gravity.y = 0.8;

      const render = Render.create({
        canvas,
        engine,
        options: { width, height, background: THEME.background, wireframes: false, pixelRatio: window.devicePixelRatio }
      });
      renderRef.current = render;

      const wallThickness = 100;
      const wallOpts = { isStatic: true, render: { fillStyle: THEME.walls } };
      const ground = Bodies.rectangle(width / 2, height + wallThickness / 2, width + wallThickness, wallThickness, wallOpts);
      const leftWall = Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 2, wallOpts);
      const rightWall = Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 2, wallOpts);
      Composite.add(engine.world, [ground, leftWall, rightWall]);

      const mouse = Mouse.create(canvas);
      const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
      setMouseConstraint(mc);
      Composite.add(engine.world, mc);
      render.mouse = mouse;

      Render.run(render);
      const runner = Runner.create();
      runnerRef.current = runner;
      Runner.run(runner, engine);
    } catch (e) { setError(true); }
  }, []);

  useEffect(() => {
    if (mouseConstraint) mouseConstraint.collisionFilter.mask = selectedTool === 'drag' ? 0xFFFFFFFF : 0x0000;
  }, [selectedTool, mouseConstraint]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!engineRef.current || !canvasRef.current || selectedTool === 'drag') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { Bodies, Composite, Query } = Matter;
    if (selectedTool === 'box') {
      const size = 30 + Math.random() * 30;
      Composite.add(engineRef.current.world, Bodies.rectangle(x, y, size, size, { restitution: 0.5, render: { fillStyle: THEME.objects, strokeStyle: '#ccc', lineWidth: 1 } }));
    } else if (selectedTool === 'circle') {
      const size = 15 + Math.random() * 20;
      Composite.add(engineRef.current.world, Bodies.circle(x, y, size, { restitution: 0.7, friction: 0.1, render: { fillStyle: THEME.objects, strokeStyle: '#ccc', lineWidth: 1 } }));
    } else if (selectedTool === 'erase') {
      const bodies = Query.point(engineRef.current.world.bodies, { x, y }).filter(b => !b.isStatic);
      if (bodies.length > 0) Composite.remove(engineRef.current.world, bodies[0]);
    }
  };

  const clearWorld = () => {
    if (!engineRef.current) return;
    const dynamic = Matter.Composite.allBodies(engineRef.current.world).filter(b => !b.isStatic);
    Matter.Composite.remove(engineRef.current.world, dynamic);
    service?.sendSystemMessage(`${user.name} очистил песочницу.`);
  };

  const tools: { id: 'box' | 'circle' | 'drag' | 'erase', icon: any, label: string }[] = [
    { id: 'box', icon: Square, label: 'Куб' },
    { id: 'circle', icon: Circle, label: 'Шар' },
    { id: 'drag', icon: MousePointer2, label: 'Тянуть' },
    { id: 'erase', icon: Eraser, label: 'Стереть' },
  ];

  return (
    <GameLayout
      title="Physics Sandbox"
      icon={<RefreshCw className="w-5 h-5 text-emerald-400" />}
      onExit={onGameEnd}
      score={0}
      gameTime={0}
      playerCount={1}
      responsiveOptions={{ gridCols: 20, gridRows: 15, maxCellSize: 50, padding: 0, accountForNav: true }}
    >
      {({ dimensions }) => {
        useEffect(() => {
          if (canvasRef.current && !renderRef.current) initPhysics(canvasRef.current, dimensions.width, dimensions.height);
        }, [dimensions, initPhysics]);

        return (
          <TooltipProvider>
            <div className="flex flex-col h-full w-full bg-neutral-950">
              <div className="p-2 border-b border-white/5 flex items-center gap-1 shrink-0 bg-neutral-950/50 backdrop-blur-md z-10">
                {tools.map((tool) => (
                  <Tooltip key={tool.id}>
                    <TooltipTrigger asChild>
                      <PremiumButton
                        variant={selectedTool === tool.id ? "default" : "secondary"}
                        size="sm"
                        onClick={() => setSelectedTool(tool.id)}
                        className="h-9 px-3"
                      >
                        <tool.icon className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">{tool.label}</span>
                      </PremiumButton>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>{tool.label}</p></TooltipContent>
                  </Tooltip>
                ))}
                <div className="flex-1" />
                <PremiumButton onClick={clearWorld} variant="secondary" size="icon" className="h-9 w-9 text-red-400 hover:text-red-500"><RefreshCw className="w-4 h-4" /></PremiumButton>
              </div>
              <div className="flex-1 relative overflow-hidden" style={{ cursor: selectedTool === 'drag' ? 'grab' : 'crosshair' }}>
                {error ? (
                  <div className="flex flex-col items-center justify-center h-full text-white p-4">
                    <p className="mb-4">Ошибка загрузки физики</p>
                    <PremiumButton onClick={() => window.location.reload()}>Перезагрузить</PremiumButton>
                  </div>
                ) : (
                  <canvas ref={canvasRef} onClick={handleCanvasClick} className="absolute inset-0 w-full h-full touch-none block" />
                )}
              </div>
            </div>
          </TooltipProvider>
        );
      }}
    </GameLayout>
  );
}
