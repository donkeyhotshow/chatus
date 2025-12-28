'use client';

import { useEffect, useCallback } from 'react';

interface WebVitalsMetric {
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

type ReportCallback = (metric: WebVitalsMetric) => void;

// Thresholds based on Google's Core Web Vitals
const thresholds = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  FID: { good: 100, poor: 300 },
  INP: { good: 200, poor: 500 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
};

function getRating(name: WebVitalsMetric['name'], value: number): WebVitalsMetric['rating'] {
  const threshold = thresholds[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

export function useWebVitals(onReport?: ReportCallback) {
  const reportMetric = useCallback((metric: WebVitalsMetric) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const color = metric.rating === 'good' ? '🟢' : metric.rating === 'needs-improvement' ? '🟡' : '🔴';
      console.log(`${color} ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
    }

    onReport?.(metric);
  }, [onReport]);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Dynamic import web-vitals for better tree-shaking
    import('web-vitals').then(({ onCLS, onFCP, onFID, onINP, onLCP, onTTFB }) => {
      const handleMetric = (metric: { name: string; value: number; delta: number; id: string }) => {
        const name = metric.name as WebVitalsMetric['name'];
        reportMetric({
          name,
          value: metric.value,
          rating: getRating(name, metric.value),
          delta: metric.delta,
          id: metric.id,
        });
      };

      onCLS(handleMetric);
      onFCP(handleMetric);
      onFID(handleMetric);
      onINP(handleMetric);
      onLCP(handleMetric);
      onTTFB(handleMetric);
    }).catch(() => {
      // web-vitals not available, skip
    });
  }, [reportMetric]);
}

// Utility to send metrics to analytics
export function sendToAnalytics(metric: WebVitalsMetric) {
  // Send to your analytics service
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }
}
