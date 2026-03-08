/**
 * useWebSocket Hook
 *
 * React hook for WebSocket connection management
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { WSMessage, WSMessageType } from '@/lib/collaboration/types';

interface UseWebSocketOptions {
  url?: string;
  onMessage?: (message: WSMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  reconnect?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = 'ws://localhost:3002',
    onMessage,
    onConnect,
    onDisconnect,
    reconnect = true,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    wsRef.current = new WebSocket(url);

    wsRef.current.onopen = () => {
      setIsConnected(true);
      setError(null);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      onConnect?.();
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
      if (reconnect) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      }
      onDisconnect?.();
    };

    wsRef.current.onerror = (e) => {
      setError(e);
    };

    wsRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WSMessage;
        onMessage?.(message);
      } catch {
        console.error('Failed to parse WebSocket message');
      }
    };
  }, [url, onMessage, onConnect, onDisconnect, reconnect]);

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, []);

  const send = useCallback((type: WSMessageType, payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: WSMessage = {
        type,
        payload,
        timestamp: new Date(),
        senderId: 'client',
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  return {
    isConnected,
    send,
    error,
  };
}
