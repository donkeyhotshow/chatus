/**
 * Connection Manager - P0 Critical Fix
 *
 * Handles:
 * - Network status detection
 * - Slow connection detection (Slow 3G)
 * - Reconne exponential backoff
 * - Connection quality monitoring
 */

import { logger } from './logger';

export type ConnectionStatus = 'online' | 'offline' | 'slow' | 'reconnecting';

export interface ConnectionState {
  status: ConnectionStatus;
  isOnline: boolean;
  isSlow: boolean;
  lastOnlineAt: number | null;
  reconnectAttempts: number;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
}

type ConnectionListener = (state: ConnectionState) => void;

class ConnectionManager {
  private state: ConnectionState = {
    status: 'online',
    isOnline: true,
    isSlow: false,
    lastOnlineAt: Date.now(),
    reconnectAttempts: 0,
    effectiveType: null,
    downlink: null,
    rtt: null,
  };

  private listeners: Set<ConnectionListener> = new Set();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private readonly maxReconnectAttempts = 5;
  private readonly baseReconnectDelay = 1000;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init(): void {
    // Initial state
    this.state.isOnline = navigator.onLine;
    this.state.status = navigator.onLine ? 'online' : 'offline';

    // Network status listeners
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Network Information API (if available)
    this.setupNetworkInfoListener();

    // Periodic connection check
    this.startConnectionCheck();

    logger.debug('[ConnectionManager] Initialized', { isOnline: this.state.isOnline });
  }

  private handleOnline = (): void => {
    logger.info('[ConnectionManager] Network online');
    this.state.isOnline = true;
    this.state.lastOnlineAt = Date.now();
    this.state.status = 'reconnecting';
    this.notifyListeners();

    // Start reconnection process
    this.startReconnection();
  };

  private handleOffline = (): void => {
    logger.warn('[ConnectionManager] Network offline');
    this.state.isOnline = false;
    this.state.status = 'offline';
    this.state.reconnectAttempts = 0;
    this.stopReconnection();
    this.notifyListeners();
  };

  private setupNetworkInfoListener(): void {
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;

    if (connection) {
      const updateNetworkInfo = () => {
        this.state.effectiveType = connection.effectiveType || null;
        this.state.downlink = connection.downlink || null;
        this.state.rtt = connection.rtt || null;

        // Detect slow connection
        const isSlow = Boolean(
          connection.effectiveType === 'slow-2g' ||
          connection.effectiveType === '2g' ||
          (connection.rtt && connection.rtt > 500) ||
          (connection.downlink && connection.downlink < 0.5)
        );

        if (isSlow !== this.state.isSlow) {
          this.state.isSlow = isSlow;
          this.state.status = isSlow ? 'slow' : (this.state.isOnline ? 'online' : 'offline');
          logger.info('[ConnectionManager] Connection quality changed', {
            isSlow,
            effectiveType: connection.effectiveType
          });
          this.notifyListeners();
        }
      };

      connection.addEventListener('change', updateNetworkInfo);
      updateNetworkInfo();
    }
  }

  private startConnectionCheck(): void {
    // Check connection every 30 seconds
    setInterval(() => {
      this.checkConnection();
    }, 30000);
  }

  private async checkConnection(): Promise<void> {
    if (!this.state.isOnline) return;

    try {
      const start = Date.now();
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      const latency = Date.now() - start;

      if (response.ok) {
        // Update RTT if we don't have Network Information API
        if (!this.state.rtt) {
          this.state.rtt = latency;
        }

        // Check if connection is slow based on latency
        const isSlow = latency > 2000;
        if (isSlow !== this.state.isSlow) {
          this.state.isSlow = isSlow;
          this.state.status = isSlow ? 'slow' : 'online';
          this.notifyListeners();
        }
      }
    } catch {
      // Connection check failed - might be offline
      logger.debug('[ConnectionManager] Connection check failed');
    }
  }

  private startReconnection(): void {
    if (this.reconnectTimer) return;

    const attemptReconnect = async () => {
      if (!this.state.isOnline) {
        this.stopReconnection();
        return;
      }

      this.state.reconnectAttempts++;
      logger.info('[ConnectionManager] Reconnection attempt', {
        attempt: this.state.reconnectAttempts
      });

      try {
        // Try to reach the server
        const response = await fetch('/api/health', {
          method: 'HEAD',
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          // Successfully reconnected
          this.state.status = 'online';
          this.state.reconnectAttempts = 0;
          this.stopReconnection();
          logger.info('[ConnectionManager] Reconnected successfully');
          this.notifyListeners();
          return;
        }
      } catch {
        // Reconnection failed
      }

      // Schedule next attempt with exponential backoff
      if (this.state.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = this.baseReconnectDelay * Math.pow(2, this.state.reconnectAttempts - 1);
        this.reconnectTimer = setTimeout(attemptReconnect, delay);
      } else {
        // Max attempts reached
        logger.warn('[ConnectionManager] Max reconnection attempts reached');
        this.state.status = 'offline';
        this.stopReconnection();
        this.notifyListeners();
      }
    };

    attemptReconnect();
  }

  private stopReconnection(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  public subscribe(listener: ConnectionListener): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener(this.state);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  public getState(): ConnectionState {
    return { ...this.state };
  }

  public isOnline(): boolean {
    return this.state.isOnline;
  }

  public isSlow(): boolean {
    return this.state.isSlow;
  }

  public forceReconnect(): void {
    if (this.state.isOnline) {
      this.state.status = 'reconnecting';
      this.state.reconnectAttempts = 0;
      this.notifyListeners();
      this.startReconnection();
    }
  }

  public destroy(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.stopReconnection();
    this.listeners.clear();
  }
}

// Network Information API types
interface NetworkInformation extends EventTarget {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener(type: 'change', listener: () => void): void;
}

// Singleton instance
let connectionManager: ConnectionManager | null = null;

export function getConnectionManager(): ConnectionManager {
  if (!connectionManager && typeof window !== 'undefined') {
    connectionManager = new ConnectionManager();
  }
  return connectionManager!;
}

export function useConnectionState(): ConnectionState {
  return getConnectionManager()?.getState() || {
    status: 'online',
    isOnline: true,
    isSlow: false,
    lastOnlineAt: null,
    reconnectAttempts: 0,
    effectiveType: null,
    downlink: null,
    rtt: null,
  };
}
