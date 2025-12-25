/**
 * WebSocketRetryController - Manages WebSocket connections with retry logic
 *
 * Implements exponential backoff for connection retries as specified in
 * Requirements 8.1, 8.2, 8.3 (BUG-007)
 */

export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number;
  /** Base delay in milliseconds for exponential backoff (default: 1000) */
  baseDelay: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelay: number;
  /** Connection timeout in milliseconds (default: 5000) */
  connectionTimeout: number;
}

export interface ConnectionResult {
  success: boolean;
  socket?: WebSocket;
  error?: Error;
  attempts: number;
}

export interface RetryState {
  attempt: number;
  lastDelay: number;
  isConnecting: boolean;
  lastError?: Error;
}

/**
 * Deuration for retry controller
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  connectionTimeout: 5000,
};

/**
 * Calculate delay for a given attempt using exponential backoff
 * Formula: min(baseDelay * 2^attempt, maxDelay)
 */
export function calculateExponentialBackoff(
  attempt: number,
  baseDelay: number,
  maxDelay: number
): number {
  if (attempt < 0 || !Number.isFinite(attempt)) {
    return baseDelay;
  }
  if (baseDelay <= 0 || !Number.isFinite(baseDelay)) {
    return DEFAULT_RETRY_CONFIG.baseDelay;
  }
  if (maxDelay <= 0 || !Number.isFinite(maxDelay)) {
    return baseDelay;
  }

  const delay = baseDelay * Math.pow(2, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * Validate retry configuration
 */
export function validateRetryConfig(config: Partial<RetryConfig>): RetryConfig {
  return {
    maxRetries: Math.max(0, Math.min(config.maxRetries ?? DEFAULT_RETRY_CONFIG.maxRetries, 10)),
    baseDelay: Math.max(100, config.baseDelay ?? DEFAULT_RETRY_CONFIG.baseDelay),
    maxDelay: Math.max(1000, config.maxDelay ?? DEFAULT_RETRY_CONFIG.maxDelay),
    connectionTimeout: Math.max(1000, config.connectionTimeout ?? DEFAULT_RETRY_CONFIG.connectionTimeout),
  };
}

/**
 * Check if a URL is a valid WebSocket URL
 */
export function isValidWebSocketUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'ws:' || parsed.protocol === 'wss:';
  } catch {
    return false;
  }
}

/**
 * WebSocketRetryController class
 * Manages WebSocket connections with automatic retry and exponential backoff
 */
export class WebSocketRetryController {
  private config: RetryConfig;
  private state: RetryState;
  private currentSocket: WebSocket | null = null;
  private abortController: AbortController | null = null;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = validateRetryConfig(config);
    this.state = {
      attempt: 0,
      lastDelay: 0,
      isConnecting: false,
    };
  }

  /**
   * Attempt to connect to a WebSocket URL with retry logic
   */
  async connect(url: string): Promise<ConnectionResult> {
    if (!isValidWebSocketUrl(url)) {
      return {
        success: false,
        error: new Error('Invalid WebSocket URL'),
        attempts: 0,
      };
    }

    if (this.state.isConnecting) {
      return {
        success: false,
        error: new Error('Connection already in progress'),
        attempts: this.state.attempt,
      };
    }

    this.state.isConnecting = true;
    this.state.attempt = 0;
    this.abortController = new AbortController();

    try {
      while (this.state.attempt <= this.config.maxRetries) {
        if (this.abortController.signal.aborted) {
          throw new Error('Connection aborted');
        }

        // Wait for backoff delay (except on first attempt)
        if (this.state.attempt > 0) {
          const delay = calculateExponentialBackoff(
            this.state.attempt - 1,
            this.config.baseDelay,
            this.config.maxDelay
          );
          this.state.lastDelay = delay;
          await this.delay(delay);
        }

        try {
          const socket = await this.attemptConnection(url);
          this.currentSocket = socket;
          this.state.isConnecting = false;
          return {
            success: true,
            socket,
            attempts: this.state.attempt + 1,
          };
        } catch (error) {
          this.state.lastError = error instanceof Error ? error : new Error(String(error));
          this.state.attempt++;
        }
      }

      // All retries exhausted
      this.state.isConnecting = false;
      return {
        success: false,
        error: this.state.lastError || new Error('Max retries exceeded'),
        attempts: this.state.attempt,
      };
    } catch (error) {
      this.state.isConnecting = false;
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        attempts: this.state.attempt,
      };
    }
  }

  /**
   * Attempt a single WebSocket connection with timeout
   */
  private attemptConnection(url: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, this.config.connectionTimeout);

      try {
        const socket = new WebSocket(url);

        socket.onopen = () => {
          clearTimeout(timeoutId);
          resolve(socket);
        };

        socket.onerror = () => {
          clearTimeout(timeoutId);
          reject(new Error('WebSocket connection failed'));
        };

        socket.onclose = (event) => {
          if (!event.wasClean) {
            clearTimeout(timeoutId);
            reject(new Error(`Connection closed: ${event.code}`));
          }
        };
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Delay helper for backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current retry count
   */
  getRetryCount(): number {
    return this.state.attempt;
  }

  /**
   * Get current state
   */
  getState(): Readonly<RetryState> {
    return { ...this.state };
  }

  /**
   * Get configuration
   */
  getConfig(): Readonly<RetryConfig> {
    return { ...this.config };
  }

  /**
   * Check if currently connecting
   */
  isConnecting(): boolean {
    return this.state.isConnecting;
  }

  /**
   * Abort current connection attempt
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    if (this.currentSocket) {
      this.currentSocket.close();
      this.currentSocket = null;
    }
    this.state.isConnecting = false;
  }

  /**
   * Reset the controller state
   */
  reset(): void {
    this.abort();
    this.state = {
      attempt: 0,
      lastDelay: 0,
      isConnecting: false,
    };
  }

  /**
   * Close current connection
   */
  close(): void {
    if (this.currentSocket) {
      this.currentSocket.close();
      this.currentSocket = null;
    }
  }
}

/**
 * Factory function to create a WebSocketRetryController
 */
export function createWebSocketRetryController(
  config: Partial<RetryConfig> = {}
): WebSocketRetryController {
  return new WebSocketRetryController(config);
}

/**
 * Calculate all delays for a given configuration
 * Useful for testing and visualization
 */
export function calculateAllDelays(config: Partial<RetryConfig> = {}): number[] {
  const validConfig = validateRetryConfig(config);
  const delays: number[] = [];

  for (let i = 0; i < validConfig.maxRetries; i++) {
    delays.push(calculateExponentialBackoff(i, validConfig.baseDelay, validConfig.maxDelay));
  }

  return delays;
}
