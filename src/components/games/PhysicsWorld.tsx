"use client";

import { useEffect, useRef, useState } from "react";
import * as Matter from "matter-js";
import { Square, Circle, MousePointer2, Eraser, RefreshCw, ArrowLeft } from "lucide-react";
import { UserProfile } from "@/lib/types";
import { useChatService } from "@/hooks/useChatService";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const THEME = {
  background: "#0d0d0d",
  walls: "#222222",
  objects: "#ffffff",
};

interface PhysicsWorldProps {
  roomId: string;
  user: UserProfile;
  onGameEnd: () => void;
}

export default function PhysicsWorld({ roomId, user, onGameEnd }: PhysicsWorldProps) {
  const { service } = useChatService(roomId, user);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);

  const [selectedTool, setSelectedTool] = useState<'box' | 'circle' | 'drag' | 'erase'>('box');
  const [mouseConstraint, setMouseConstraint] = useState<Matter.MouseConstraint | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    try {
      const Engine = Matter.Engine,
        Render = Matter.Render,
        Runner = Matter.Runner,
        Bodies = Matter.Bodies,
        Composite = Matter.Composite,
        Mouse = Matter.Mouse,
        MouseConstraint = Matter.MouseConstraint;

      const engine = Engine.create();
      engineRef.current = engine;
      engine.gravity.y = 0.8;

      const render = Render.create({
        element: containerRef.current,
        canvas: canvasRef.current,
        engine: engine,
        options: {
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
          background: THEME.background,
          wireframes: false,
          pixelRatio: window.devicePixelRatio
        }
      });
      renderRef.current = render;

      const w = render.options.width!;
      const h = render.options.height!;
      const wallOpts = {
        isStatic: true,
        render: { fillStyle: THEME.walls }
      };
      const wallThickness = 100;

      const ground = Bodies.rectangle(w / 2, h + wallThickness / 2, w + wallThickness, wallThickness, wallOpts);
      const leftWall = Bodies.rectangle(0 - wallThickness / 2, h / 2, wallThickness, h * 2, wallOpts);
      const rightWall = Bodies.rectangle(w + wallThickness / 2, h / 2, wallThickness, h * 2, wallOpts);

      Composite.add(engine.world, [ground, leftWall, rightWall]);

      const mouse = Mouse.create(render.canvas);
      const mc = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
          stiffness: 0.2,
          render: { visible: false }
        }
      });
      setMouseConstraint(mc);
      Composite.add(engine.world, mc);
      render.mouse = mouse;

      Render.run(render);
      const runner = Runner.create();
      runnerRef.current = runner;
      Runner.run(runner, engine);

      const handleResize = () => {
        const render = renderRef.current;
        const container = containerRef.current;
        if (!render || !container || !render.canvas) return;

        const oldW = render.options.width!;
        const oldH = render.options.height!;
        const newW = container.clientWidth;
        const newH = container.clientHeight;

        render.canvas.width = newW;
        render.canvas.height = newH;
        render.options.width = newW;
        render.options.height = newH;
        Render.setPixelRatio(render, window.devicePixelRatio);

        // Update walls
        const scaleX = newW / oldW;
        const scaleY = newH / oldH;

        Matter.Body.setPosition(ground, { x: newW / 2, y: newH + wallThickness / 2 });
        Matter.Body.scale(ground, scaleX, 1);

        Matter.Body.setPosition(rightWall, { x: newW + wallThickness / 2, y: newH / 2 });
        Matter.Body.scale(rightWall, 1, scaleY);

        Matter.Body.setPosition(leftWall, { x: 0 - wallThickness / 2, y: newH / 2 });
        Matter.Body.scale(leftWall, 1, scaleY);
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (renderRef.current) Render.stop(renderRef.current);
        if (runnerRef.current) Runner.stop(runnerRef.current);
        if (engineRef.current) Engine.clear(engineRef.current);
        if (renderRef.current?.canvas) renderRef.current.canvas.remove();
      };
    } catch (error) {
      console.error('Failed to initialize Physics World:', error);
      setError(true);
    }
  }, []);


  useEffect(() => {
    if (mouseConstraint) {
      mouseConstraint.collisionFilter.mask = selectedTool === 'drag' ? 0xFFFFFFFF : 0x0000;
    }
  }, [selectedTool, mouseConstraint]);


  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!engineRef.current || !canvasRef.current || selectedTool === 'drag') return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedTool === 'box') {
      const size = 30 + Math.random() * 30;
      const box = Matter.Bodies.rectangle(x, y, size, size, {
        restitution: 0.5,
        render: { fillStyle: THEME.objects, strokeStyle: '#cccccc', lineWidth: 1 }
      });
      Matter.Composite.add(engineRef.current.world, box);
    }
    else if (selectedTool === 'circle') {
      const size = 15 + Math.random() * 20;
      const circle = Matter.Bodies.circle(x, y, size, {
        restitution: 0.7,
        friction: 0.1,
        render: { fillStyle: THEME.objects, strokeStyle: '#cccccc', lineWidth: 1 }
      });
      Matter.Composite.add(engineRef.current.world, circle);
    }
    else if (selectedTool === 'erase') {
      const bodies = Matter.Query.point(engineRef.current.world.bodies, { x, y });
      const dynamicBodies = bodies.filter(b => !b.isStatic);
      if (dynamicBodies.length > 0) {
        Matter.Composite.remove(engineRef.current.world, dynamicBodies[0]);
      }
    }
  };

  const clearWorld = () => {
    if (!engineRef.current) return;
    const all = Matter.Composite.allBodies(engineRef.current.world);
    const dynamic = all.filter(b => !b.isStatic);
    Matter.Composite.remove(engineRef.current.world, dynamic);
    service?.sendSystemMessage(`${user.name} cleared the physics sandbox.`);
  };

  const getCursor = () => {
    switch (selectedTool) {
      case 'drag': return 'grab';
      case 'erase': return 'crosshair';
      default: return 'copy';
    }
  }

  const tools = [
    { id: 'box' as const, icon: Square, label: 'Box' },
    { id: 'circle' as const, icon: Circle, label: 'Ball' },
    { id: 'drag' as const, icon: MousePointer2, label: 'Drag' },
    { id: 'erase' as const, icon: Eraser, label: 'Erase' },
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-neutral-950 select-none">
        <div className="p-2 border-b border-white/5 flex items-center gap-1 shrink-0 bg-neutral-950 z-10">

          <Button onClick={onGameEnd} variant="ghost" size="sm" className="text-neutral-400 hover:text-white hover:bg-white/10">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="w-[1px] h-6 bg-white/10 mx-2"></div>

          {tools.map((tool) => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTool(tool.id)}
                  className={`
                    flex items-center gap-2 transition-all
                    ${selectedTool === tool.id
                      ? 'bg-white text-black hover:bg-white/90 hover:text-black'
                      : 'text-neutral-400 hover:text-white hover:bg-white/10'}
                  `}
                >
                  <tool.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tool.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{tool.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}

          <div className="flex-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={clearWorld}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-neutral-400 hover:text-red-500 hover:bg-red-500/10"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Clear World</p>
            </TooltipContent>
          </Tooltip>

        </div>
        <div ref={containerRef} className="flex-1 relative overflow-hidden" style={{ cursor: getCursor() }}>
          {error ? (
            <div className="flex flex-col items-center justify-center h-full text-white text-center p-4">
              <h3 className="text-lg font-semibold mb-2">Physics Engine Failed to Load</h3>
              <p className="text-sm text-neutral-400 mb-4">There was an error initializing the physics simulation.</p>
              <Button onClick={() => window.location.reload()} variant="default">
                Reload Page
              </Button>
            </div>
          ) : (
            <>
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="absolute inset-0 w-full h-full touch-none block"
              />
              <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none opacity-20">
                <span className="text-[9px] font-mono text-white uppercase tracking-[0.2em]">Physics Sandbox</span>
              </div>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
