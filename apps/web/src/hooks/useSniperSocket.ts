'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SniperState, ShotResult, LogEntry, TimeSyncStatus, WebSocketMessage } from '../types';

interface UseSniperSocketOptions {
  onClockTick?: (data: { currentExactTime: string; timestampMs: number; state: SniperState; targetTime: string }) => void;
  onStateChange?: (state: SniperState) => void;
  onShotResult?: (shot: ShotResult) => void;
  onShotLog?: (log: LogEntry) => void;
  onTimeSync?: (status: TimeSyncStatus) => void;
}

export function useSniperSocket(options: UseSniperSocketOptions = {}) {
  const [connected, setConnected] = useState<boolean>(false);
  const [engineState, setEngineState] = useState<SniperState>('IDLE');
  const [exactTime, setExactTime] = useState<string>('00:00:00');
  const [exactMs, setExactMs] = useState<string>('.000');
  const [targetTime, setTargetTime] = useState<string>('08:45:00.000');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [shots, setShots] = useState<ShotResult[]>([]);
  const [timeSync, setTimeSync] = useState<TimeSyncStatus | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const addLog = useCallback((entry: Omit<LogEntry, 'id'>) => {
    const newLog: LogEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 199)]);
  }, []);

  useEffect(() => {
    let isUnmounted = false;

    function connect() {
      if (typeof window === 'undefined') return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // In dev mode when running on port 3000, target 3880 directly or relative in prod
      const host =
        window.location.port === '3000'
          ? `${window.location.hostname}:3880`
          : window.location.host;

      const wsUrl = `${protocol}//${host}/ws`;

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (isUnmounted) return;
          setConnected(true);
        };

        ws.onclose = () => {
          if (isUnmounted) return;
          setConnected(false);
          reconnectTimeoutRef.current = setTimeout(connect, 2000);
        };

        ws.onerror = () => {
          if (isUnmounted) return;
          setConnected(false);
        };

        ws.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const message: WebSocketMessage = JSON.parse(event.data);

            switch (message.type) {
              case 'CLOCK_TICK': {
                const tick = message.data;
                if (tick.currentExactTime) {
                  const parts = tick.currentExactTime.split('.');
                  setExactTime(parts[0] || '00:00:00');
                  setExactMs(`.${parts[1] || '000'}`);
                }
                if (tick.state) {
                  setEngineState(tick.state);
                }
                if (tick.targetTime) {
                  setTargetTime(tick.targetTime);
                }
                optionsRef.current.onClockTick?.(tick);
                break;
              }

              case 'STATE_CHANGE': {
                const newState = message.data.state || message.data;
                setEngineState(newState);
                if (message.data.timeSync) {
                  setTimeSync(message.data.timeSync);
                }
                optionsRef.current.onStateChange?.(newState);
                break;
              }

              case 'ORDER_SHOT': {
                const shot: ShotResult = message.data;
                setShots((prev) => [shot, ...prev]);
                optionsRef.current.onShotResult?.(shot);
                break;
              }

              case 'SHOT_LOG': {
                const logData = message.data;
                const newLog: LogEntry = {
                  id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                  time: new Date().toLocaleTimeString('fa-IR', { hour12: false }),
                  level: logData.level || 'info',
                  text: logData.text || '',
                  shot: logData.shot,
                };
                setLogs((prev) => [newLog, ...prev.slice(0, 199)]);
                optionsRef.current.onShotLog?.(newLog);
                break;
              }

              case 'TIME_SYNC': {
                setTimeSync(message.data);
                optionsRef.current.onTimeSync?.(message.data);
                break;
              }

              case 'SNIPER_SUMMARY': {
                if (message.data?.results) {
                  setShots(message.data.results);
                }
                break;
              }
            }
          } catch {
            // ignore malformed ws messages
          }
        };
      } catch {
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  return {
    connected,
    engineState,
    exactTime,
    exactMs,
    targetTime,
    logs,
    shots,
    timeSync,
    setEngineState,
    setShots,
    setTimeSync,
    clearLogs,
    addLog,
  };
}
