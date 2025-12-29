"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
// ═══════════════════════════════════════════════════════════════
// ТИПЫ
// ═══════════════════════════════════════════════════════════════

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

export interface GameDimensions {
  width: number;
  height: number;
  scale: number;
  cellSize: number;
}

export interface UseGameResponsiveOptions {
  /** Базовая ширина игрового поля */
  baseWidth?: number;
  /** Базовая высота игрового поля */
  baseHeight?: number;
  /** Количество ячеек по горизонтали (для grid-based игр) */
  gridCols?: number;
  /** Количество ячеек по вертикали */
  gridRows?: number;
  /** Минимальный размер ячейки */
  minCellSize?: number;
  /** Максимальный размер ячейки */
  maxCellSize?: number;
  /** Отступы от краёв экрана */
  padding?: number;
  /** Учитывать ли нижнюю навигацию */
  accountForNav?: boolean;
  /** Высота нижней навигации */
  navHeight?: number;
  /** Предпочтительная ориентация */
  preferredOrientation?: Orientation;
}

export interface UseGameResponsiveReturn {
  /** Тип устройства */
  deviceType: DeviceType;
  /** Ориентация экрана */
  orientation: Orientation;
  /** Мобильное устройство? */
  isMobile: boolean;
  /** Планшет? */
  isTablet: boolean;
  /** Десктоп? */
  isDesktop: boolean;
  /** Портретная ориентация? */
  isPortrait: boolean;
  /** Ландшафтная ориентация? */
  isLandscape: boolean;
  /** Размеры игрового поля */
  dimensions: GameDimensions;
  /** Размер экрана */
  screenSize: { width: number; height: number };
  /** Поддерживает ли устройство touch */
  hasTouch: boolean;
  /** Показывать ли мобильные контролы */
  showMobileControls: boolean;
  /** Рекомендуемый размер шрифта */
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
  };
  /** Рекомендуемые отступы */
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
  };
  /** Нужно ли показать подсказку о повороте экрана */
  showRotateHint: boolean;
  /** Пересчитать размеры */
  recalculate: () => void;
}

// ═══════════════════════════════════════════════════════════════
// КОНСТАНТЫ
// ═══════════════════════════════════════════════════════════════

const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
};

const DEFAULT_OPTIONS: Required<UseGameResponsiveOptions> = {
  baseWidth: 800,
  baseHeight: 600,
  gridCols: 20,
  gridRows: 15,
  minCellSize: 16,
  maxCellSize: 50,
  padding: 16,
  accountForNav: true,
  navHeight: 64,
  preferredOrientation: 'landscape',
};

// ═══════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════

export function useGameResponsive(
  options: UseGameResponsiveOptions = {}
): UseGameResponsiveReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const [hasTouch, setHasTouch] = useState(false);

  // Определяем размеры экрана
  useEffect(() => {
    const updateSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Определяем touch support
    setHasTouch(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-expect-error - msMaxTouchPoints is IE-specific
      navigator.msMaxTouchPoints > 0
    );

    updateSize();
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', () => {
      // Задержка для корректного определения после поворота
      setTimeout(updateSize, 100);
    });

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
    };
  }, []);

  // Вычисляем тип устройства
  const deviceType = useMemo<DeviceType>(() => {
    if (screenSize.width === 0) return 'desktop';
    if (screenSize.width < BREAKPOINTS.mobile) return 'mobile';
    if (screenSize.width < BREAKPOINTS.tablet) return 'tablet';
    return 'desktop';
  }, [screenSize.width]);

  // Вычисляем ориентацию
  const orientation = useMemo<Orientation>(() => {
    if (screenSize.width === 0) return 'landscape';
    return screenSize.width > screenSize.height ? 'landscape' : 'portrait';
  }, [screenSize.width, screenSize.height]);

  // Вычисляем размеры игрового поля
  const dimensions = useMemo<GameDimensions>(() => {
    if (screenSize.width === 0) {
      return {
        width: opts.baseWidth,
        height: opts.baseHeight,
        scale: 1,
        cellSize: opts.baseWidth / opts.gridCols,
      };
    }

    const availableWidth = screenSize.width - opts.padding * 2;
    const availableHeight = screenSize.height - opts.padding * 2 -
      (opts.accountForNav && deviceType === 'mobile' ? opts.navHeight : 0);

    // Для grid-based игр
    if (opts.gridCols && opts.gridRows) {
      const cellByWidth = Math.floor(availableWidth / opts.gridCols);
      const cellByHeight = Math.floor(availableHeight / opts.gridRows);
      const cellSize = Math.min(
        Math.max(Math.min(cellByWidth, cellByHeight), opts.minCellSize),
        opts.maxCellSize
      );

      return {
        width: cellSize * opts.gridCols,
        height: cellSize * opts.gridRows,
        scale: cellSize / (opts.baseWidth / opts.gridCols),
        cellSize,
      };
    }

    // Для canvas-based игр
    const scaleX = availableWidth / opts.baseWidth;
    const scaleY = availableHeight / opts.baseHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    return {
      width: Math.floor(opts.baseWidth * scale),
      height: Math.floor(opts.baseHeight * scale),
      scale,
      cellSize: 0,
    };
  }, [screenSize, opts, deviceType]);

  // Размеры шрифтов
  const fontSize = useMemo(() => {
    const base = deviceType === 'mobile' ? 14 : deviceType === 'tablet' ? 15 : 16;
    return {
      xs: Math.round(base * 0.75),
      sm: Math.round(base * 0.875),
      base,
      lg: Math.round(base * 1.125),
      xl: Math.round(base * 1.25),
    };
  }, [deviceType]);

  // Отступы
  const spacing = useMemo(() => {
    const base = deviceType === 'mobile' ? 12 : deviceType === 'tablet' ? 14 : 16;
    return {
      xs: Math.round(base * 0.5),
      sm: Math.round(base * 0.75),
      md: base,
      lg: Math.round(base * 1.5),
    };
  }, [deviceType]);

  // Показывать ли подсказку о повороте
  const showRotateHint = useMemo(() => {
    if (deviceType !== 'mobile') return false;
    if (opts.preferredOrientation === 'portrait') return orientation === 'landscape';
    return orientation === 'portrait';
  }, [deviceType, orientation, opts.preferredOrientation]);

  // Показывать ли мобильные контролы
  const showMobileControls = useMemo(() => {
    return hasTouch && (deviceType === 'mobile' || deviceType === 'tablet');
  }, [hasTouch, deviceType]);

  const recalculate = useCallback(() => {
    setScreenSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  return {
    deviceType,
    orientation,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    dimensions,
    screenSize,
    hasTouch,
    showMobileControls,
    fontSize,
    spacing,
    showRotateHint,
    recalculate,
  };
}

export default useGameResponsive;
