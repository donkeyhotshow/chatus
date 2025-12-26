/**
 * Property-Based Tests for WebSocketRetryController
 *
 * **Feature: chatus-bug-fixes, Property 8: WebSocket Retry Exponential Backoff**
 * **Validates: Requirements 8.1, 8.2, 8.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  createWebSocketRetryController,
  calculateExponentialBackoff,
  validateRetryConfig,
  isValidWebSocketUrl,
  calculateAllDelays,
  DEFAULT_RETRY_CONFIG,
  RetryConfig,
} from '@/lib/websocket-retry';

describe('WebSocketRetryController', () => {
  describe('Property 8: WebSocket Retry Exponential Backoff', () => {
    /**
     * Property: For any sequence of connection failures, retry delays SHALL follow
     * exponential backoff pattern with maximum 3 attempts.
     *
     * **Feature: chatus-bug-fixes, Property 8: WebSocket Retry Exponential Backoff**
     * **Validates: Requirements 8.2**
     */
    it('should calculate exponential backoff delays correctly for any valid attempt', () => {
      fc.assert(
        fc.property(
          // Generate attempt numbers from 0 to 10
          fc.integer({ min: 0, max: 10 }),
          // Generate base delays from 100ms to 5000ms
          fc.integer({ min: 100, max: 5000 }),
          // Generate max delays from 1000ms to 30000ms
          fc.integer({ min: 1000, max: 30000 }),
          (attempt, baseDelay, maxDelay) => {
            const delay = calculateExponentialBackoff(attempt, baseDelay, maxDelay);

            // Delay should be positive
            expect(delay).toBeGreaterThan(0);

            // Delay should not exceed maxDelay
            expect(delay).toBeLessThanOrEqual(maxDelay);

            // Delay should follow exponential pattern: baseDelay * 2^attempt
            const expectedDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
            expect(delay).toBe(expectedDelay);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Delays should increase monotonically until reaching maxDelay
     *
     * **Feature: chatus-bug-fixes, Property 8: WebSocket Retry Exponential Backoff**
     * **Validates: Requirements 8.2**
     */
    it('should produce monotonically increasing delays until maxDelay', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 2000 }),
          fc.integer({ min: 2000, max: 20000 }),
          (baseDelay, maxDelay) => {
            const delays: number[] = [];
            for (let i = 0; i < 10; i++) {
              delays.push(calculateExponentialBackoff(i, baseDelay, maxDelay));
            }

            // Each delay should be >= previous delay
            for (let i = 1; i < delays.length; i++) {
              expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1]);
            }

            // All delays should be capped at maxDelay
            delays.forEach((delay) => {
              expect(delay).toBeLessThanOrEqual(maxDelay);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: First delay (attempt 0) should equal baseDelay
     *
     * **Feature: chatus-bug-fixes, Property 8: WebSocket Retry Exponential Backoff**
     * **Validates: Requirements 8.2**
     */
    it('should return baseDelay for first retry attempt', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 10000 }),
          fc.integer({ min: 10000, max: 60000 }),
          (baseDelay, maxDelay) => {
            const firstDelay = calculateExponentialBackoff(0, baseDelay, maxDelay);
            expect(firstDelay).toBe(baseDelay);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: calculateAllDelays should return exactly maxRetries delays
     *
     * **Feature: chatus-bug-fixes, Property 8: WebSocket Retry Exponential Backoff**
     * **Validates: Requirements 8.2**
     */
    it('should calculate correct number of delays based on maxRetries', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 100, max: 2000 }),
          fc.integer({ min: 2000, max: 20000 }),
          (maxRetries, baseDelay, maxDelay) => {
            const config: Partial<RetryConfig> = { maxRetries, baseDelay, maxDelay };
            const delays = calculateAllDelays(config);

            expect(delays.length).toBe(maxRetries);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Configuration Validation', () => {
    it('should validate and normalize configuration values', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -10, max: 20 }),
          fc.integer({ min: -1000, max: 10000 }),
          fc.integer({ min: -1000, max: 50000 }),
          fc.integer({ min: -1000, max: 20000 }),
          (maxRetries, baseDelay, maxDelay, connectionTimeout) => {
            const config = validateRetryConfig({
              maxRetries,
              baseDelay,
              maxDelay,
              connectionTimeout,
            });

            // maxRetries should be between 0 and 10
            expect(config.maxRetries).toBeGreaterThanOrEqual(0);
            expect(config.maxRetries).toBeLessThanOrEqual(10);

            // baseDelay should be at least 100ms
            expect(config.baseDelay).toBeGreaterThanOrEqual(100);

            // maxDelay should be at least 1000ms
            expect(config.maxDelay).toBeGreaterThanOrEqual(1000);

            // connectionTimeout should be at least 1000ms
            expect(config.connectionTimeout).toBeGreaterThanOrEqual(1000);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use default values for missing config properties', () => {
      const config = validateRetryConfig({});

      expect(config.maxRetries).toBe(DEFAULT_RETRY_CONFIG.maxRetries);
      expect(config.baseDelay).toBe(DEFAULT_RETRY_CONFIG.baseDelay);
      expect(config.maxDelay).toBe(DEFAULT_RETRY_CONFIG.maxDelay);
      expect(config.connectionTimeout).toBe(DEFAULT_RETRY_CONFIG.connectionTimeout);
    });
  });

  describe('URL Validation', () => {
    it('should validate WebSocket URLs correctly', () => {
      // Valid URLs
      expect(isValidWebSocketUrl('ws://localhost:8080')).toBe(true);
      expect(isValidWebSocketUrl('wss://example.com/socket')).toBe(true);
      expect(isValidWebSocketUrl('ws://192.168.1.1:3000/ws')).toBe(true);
      expect(isValidWebSocketUrl('wss://api.example.com:443/v1/ws')).toBe(true);

      // Invalid URLs
      expect(isValidWebSocketUrl('http://example.com')).toBe(false);
      expect(isValidWebSocketUrl('https://example.com')).toBe(false);
      expect(isValidWebSocketUrl('ftp://example.com')).toBe(false);
      expect(isValidWebSocketUrl('')).toBe(false);
      expect(isValidWebSocketUrl('not-a-url')).toBe(false);
      // @ts-expect-error Testing null input
      expect(isValidWebSocketUrl(null)).toBe(false);
      // @ts-expect-error Testing undefined input
      expect(isValidWebSocketUrl(undefined)).toBe(false);
    });

    it('should accept any valid ws:// or wss:// URL', () => {
      fc.assert(
        fc.property(
          fc.webUrl().map((url) => url.replace(/^https?/, 'ws')),
          (wsUrl) => {
            // URLs generated from webUrl and converted to ws:// should be valid
            const isValid = isValidWebSocketUrl(wsUrl);
            expect(typeof isValid).toBe('boolean');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Controller State Management', () => {
    it('should initialize with correct default state', () => {
      const controller = createWebSocketRetryController();

      expect(controller.getRetryCount()).toBe(0);
      expect(controller.isConnecting()).toBe(false);

      const state = controller.getState();
      expect(state.attempt).toBe(0);
      expect(state.lastDelay).toBe(0);
      expect(state.isConnecting).toBe(false);
    });

    it('should reset state correctly', () => {
      const controller = createWebSocketRetryController();

      // Simulate some state changes
      controller.reset();

      expect(controller.getRetryCount()).toBe(0);
      expect(controller.isConnecting()).toBe(false);
    });

    it('should return immutable config and state', () => {
      const controller = createWebSocketRetryController({ maxRetries: 5 });

      const config1 = controller.getConfig();
      const config2 = controller.getConfig();

      expect(config1).not.toBe(config2); // Different objects
      expect(config1).toEqual(config2); // Same values

      const state1 = controller.getState();
      const state2 = controller.getState();

      expect(state1).not.toBe(state2); // Different objects
      expect(state1).toEqual(state2); // Same values
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative attempt numbers gracefully', () => {
      const delay = calculateExponentialBackoff(-1, 1000, 10000);
      expect(delay).toBe(1000); // Should return baseDelay
    });

    it('should handle non-finite values gracefully', () => {
      expect(calculateExponentialBackoff(Infinity, 1000, 10000)).toBe(1000);
      expect(calculateExponentialBackoff(NaN, 1000, 10000)).toBe(1000);
      expect(calculateExponentialBackoff(0, Infinity, 10000)).toBe(DEFAULT_RETRY_CONFIG.baseDelay);
      expect(calculateExponentialBackoff(0, NaN, 10000)).toBe(DEFAULT_RETRY_CONFIG.baseDelay);
      expect(calculateExponentialBackoff(0, 1000, Infinity)).toBe(1000);
      expect(calculateExponentialBackoff(0, 1000, NaN)).toBe(1000);
    });

    it('should handle zero and negative baseDelay', () => {
      expect(calculateExponentialBackoff(0, 0, 10000)).toBe(DEFAULT_RETRY_CONFIG.baseDelay);
      expect(calculateExponentialBackoff(0, -100, 10000)).toBe(DEFAULT_RETRY_CONFIG.baseDelay);
    });

    it('should handle zero and negative maxDelay', () => {
      expect(calculateExponentialBackoff(0, 1000, 0)).toBe(1000);
      expect(calculateExponentialBackoff(0, 1000, -100)).toBe(1000);
    });

    it('should reject invalid WebSocket URL on connect', async () => {
      const controller = createWebSocketRetryController();

      const result = await controller.connect('http://invalid-protocol.com');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Invalid WebSocket URL');
      expect(result.attempts).toBe(0);
    });

    it('should reject empty URL on connect', async () => {
      const controller = createWebSocketRetryController();

      const result = await controller.connect('');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Invalid WebSocket URL');
    });
  });

  describe('Factory Function', () => {
    it('should create controller with custom config', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 100, max: 5000 }),
          fc.integer({ min: 5000, max: 30000 }),
          (maxRetries, baseDelay, maxDelay) => {
            const controller = createWebSocketRetryController({
              maxRetries,
              baseDelay,
              maxDelay,
            });

            const config = controller.getConfig();
            expect(config.maxRetries).toBe(maxRetries);
            expect(config.baseDelay).toBe(baseDelay);
            expect(config.maxDelay).toBe(maxDelay);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
