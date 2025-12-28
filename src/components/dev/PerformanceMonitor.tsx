/**
 * Этап 8: Performance Monitor Component
 * Отображаероизводительности в dev режиме
 */

'use client';

import { useState, useEffect } from 'react';
import { getCoreWebVitals, getMemoryUsage, observeLongTasks } from '@/lib/bundle-analyzer';
import { PERFORMANCE_THRESHOLDS } from '@/lib/performance-config';

interface Metrics {
  fps: number;
  memory: { used: number; total: number; percent: number } | null;
  lcp: number | null;
  cls: number | null;
  longTasks: number;
}

export function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<Metrics>({
    fps: 60,
    memory: null,
    lcp: null,
    cls: null,
    longTasks: 0,
  });

  // FPS counter
  useEffect(() => {
    if (!isVisible) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        setMetrics(prev => ({ ...prev, fps: frameCount }));
        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(animationId);
  }, [isVisible]);

  // Memory & Web Vitals
  useEffect(() => {
    if (!isVisible) return;

    const updateMetrics = async () => {
      const memory = getMemoryUsage();
      const vitals = await getCoreWebVitals();

      setMetrics(prev => ({
        ...prev,
        memory,
        lcp: vitals.lcp,
        cls: vitals.cls,
      }));
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 2000);
    return () => clearInterval(interval);
  }, [isVisible]);

  // Long Tasks observer
  useEffect(() => {
    if (!isVisible) return;

    return observeLongTasks(() => {
      setMetrics(prev => ({ ...prev, longTasks: prev.longTasks + 1 }));
    });
  }, [isVisible]);

  // Toggle with keyboard shortcut (Ctrl+Shift+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;
  if (!isVisible) return null;

  const getStatusColor = (value: number | null, threshold: number, inverse = false) => {
    if (value === null) return 'text-gray-400';
    const isGood = inverse ? value < threshold : value > threshold;
    return isGood ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-black/90 text-white text-xs font-mono p-3 rounded-lg shadow-xl border border-white/10 min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-violet-400 font-semibold">⚡ Performance</span>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="space-y-1">
        {/* FPS */}
        <div className="flex justify-between">
          <span className="text-gray-400">FPS:</span>
          <span className={getStatusColor(metrics.fps, 50)}>
            {metrics.fps}
          </span>
        </div>

        {/* Memory */}
        {metrics.memory && (
          <div className="flex justify-between">
            <span className="text-gray-400">Memory:</span>
            <span className={getStatusColor(100 - metrics.memory.percent, 20)}>
              {(metrics.memory.used / 1024 / 1024).toFixed(0)}MB
              <span className="text-gray-500"> / {(metrics.memory.total / 1024 / 1024).toFixed(0)}MB</span>
            </span>
          </div>
        )}

        {/* LCP */}
        <div className="flex justify-between">
          <span className="text-gray-400">LCP:</span>
          <span className={getStatusColor(metrics.lcp, PERFORMANCE_THRESHOLDS.lcp, true)}>
            {metrics.lcp ? `${metrics.lcp.toFixed(0)}ms` : '—'}
          </span>
        </div>

        {/* CLS */}
        <div className="flex justify-between">
          <span className="text-gray-400">CLS:</span>
          <span className={getStatusColor(metrics.cls, PERFORMANCE_THRESHOLDS.cls, true)}>
            {metrics.cls !== null ? metrics.cls.toFixed(3) : '—'}
          </span>
        </div>

        {/* Long Tasks */}
        <div className="flex justify-between">
          <span className="text-gray-400">Long Tasks:</span>
          <span className={metrics.longTasks > 5 ? 'text-red-400' : 'text-green-400'}>
            {metrics.longTasks}
          </span>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-white/10 text-gray-500 text-[10px]">
        Ctrl+Shift+P to toggle
      </div>
    </div>
  );
}
