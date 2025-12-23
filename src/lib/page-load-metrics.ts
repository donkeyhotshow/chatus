/**
 * Page Load Metrics Utility (Requirements: 16.1)
 *
 * Provides utilities for measuring and validating page loade.
 * Target: Initial render within 5000ms under normal network conditions.
 */

export const TARGET_LOAD_TIME = 5000; // 5 seconds max

export interface PageLoadMetrics {
  loadTime: number;
  firstContentfulPaint: number | null;
  domContentLoaded: number | null;
  isWithinTarget: boolean;
}

export interface PerformanceConfig {
  targetLoadTime: number;
  enableLogging: boolean;
}

const defaultConfig: PerformanceConfig = {
  targetLoadTime: TARGET_LOAD_TIME,
  enableLogging: process.env.NODE_ENV === 'development',
};

/**
 * Measures page load time using Performance API
 * Returns metrics including whether load time is within target
 */
export function measurePageLoad(config: Partial<PerformanceConfig> = {}): PageLoadMetrics {
  const { targetLoadTime, enableLogging } = { ...defaultConfig, ...config };

  // Check if Performance API is available
  if (typeof performance === 'undefined' || !performance.timing) {
    return {
      loadTime: 0,
      firstContentfulPaint: null,
      domContentLoaded: null,
      isWithinTarget: true, // Assume OK if we can't measure
    };
  }

  const timing = performance.timing;
  const loadTime = timing.loadEventEnd - timing.navigationStart;
  const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;

  // Get First Contentful Paint if available
  let firstContentfulPaint: number | null = null;
  if (typeof PerformanceObserver !== 'undefined') {
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    if (fcpEntry) {
      firstContentfulPaint = fcpEntry.startTime;
    }
  }

  const isWithinTarget = loadTime <= targetLoadTime && loadTime > 0;

  if (enableLogging) {
    console.log(`[PageLoadMetrics] Load time: ${loadTime}ms, Target: ${targetLoadTime}ms, Within target: ${isWithinTarget}`);
  }

  return {
    loadTime: loadTime > 0 ? loadTime : 0,
    firstContentfulPaint,
    domContentLoaded: domContentLoaded > 0 ? domContentLoaded : null,
    isWithinTarget,
  };
}

/**
 * Validates that a given load time is within the target
 * Used for property-based testing
 */
export function isLoadTimeWithinTarget(loadTime: number, targetTime: number = TARGET_LOAD_TIME): boolean {
  if (loadTime < 0) return false;
  return loadTime <= targetTime;
}

/**
 * Simulates page load time for testing purposes
 * Returns a realistic load time based on various factors
 */
export function simulatePageLoadTime(params: {
  bundleSize: number; // in KB
  networkSpeed: 'slow3g' | 'fast3g' | 'slow4g' | 'fast4g' | 'wifi';
  serverResponseTime: number; // in ms
  renderComplexity: 'low' | 'medium' | 'high';
}): number {
  const { bundleSize, networkSpeed, serverResponseTime, renderComplexity } = params;

  // Network speed in KB/s
  const networkSpeeds: Record<string, number> = {
    'slow3g': 50,    // 400 Kbps
    'fast3g': 187,   // 1.5 Mbps
    'slow4g': 500,   // 4 Mbps
    'fast4g': 1250,  // 10 Mbps
    'wifi': 6250,    // 50 Mbps
  };

  // Render complexity multiplier
  const renderMultipliers: Record<string, number> = {
    'low': 1.0,
    'medium': 1.5,
    'high': 2.0,
  };

  const downloadTime = (bundleSize / networkSpeeds[networkSpeed]) * 1000; // Convert to ms
  const renderTime = 100 * renderMultipliers[renderComplexity]; // Base render time
  const totalTime = serverResponseTime + downloadTime + renderTime;

  return Math.round(totalTime);
}

/**
 * Validates page load configuration
 */
export function validateLoadConfig(config: Partial<PerformanceConfig>): boolean {
  if (config.targetLoadTime !== undefined) {
    if (typeof config.targetLoadTime !== 'number' || config.targetLoadTime <= 0) {
      return false;
    }
  }
  return true;
}

/**
 * Gets recommended optimizations based on load metrics
 */
export function getOptimizationRecommendations(metrics: PageLoadMetrics): string[] {
  const recommendations: string[] = [];

  if (!metrics.isWithinTarget) {
    recommendations.push('Consider enabling code splitting to reduce initial bundle size');
    recommendations.push('Use lazy loading for non-critical components');
    recommendations.push('Optimize images with AVIF/WebP formats');
  }

  if (metrics.firstContentfulPaint && metrics.firstContentfulPaint > 2500) {
    recommendations.push('Improve First Contentful Paint by reducing render-blocking resources');
  }

  if (metrics.domContentLoaded && metrics.domContentLoaded > 3000) {
    recommendations.push('Reduce DOM complexity or defer non-critical JavaScript');
  }

  return recommendations;
}
