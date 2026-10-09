'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { LogEntry, ServerBroadcastMessage, ShotResult, SniperState, TimeSyncStatus } from '@saf-shekan/core';
import type { LiveQuote } from '@/lib/api';

function splitClock(value: string): { time: string; ms: string } {
  const [time, fraction = '000'] = value.split('.');
  return { time: time || '00:00:00', ms: `.${fraction.padEnd(3, '0').slice(0, 3)}` };
}

export function useSniperSocket() {
  const [connected, setConnected] = useState(false);
  const [engineState, setEngineState] = useState<SniperState>('IDLE');
  const [exactTime, setExactTime] = useState('00:00:00');
  const [exactMs, setExactMs] = useState('.000');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [shots, setShots] = useState<ShotResult[]>([]);
  const [timeSync, setTimeSync] = useState<TimeSyncStatus | null>(null);
  const [quotesBySymbol, setQuotesBySymbol] = useState<Record<string, LiveQuote>>({});

  const timeSyncRef = useRef<TimeSyncStatus | null>(null);
  const lastTickRef = useRef(0);

  useEffect(() => {
    timeSyncRef.current = timeSync;
  }, [timeSync]);

  const clearLogs = useCallback(() => setLogs([]), []);
  const addLog = useCallback((entry: Omit<LogEntry, 'id'>) => {
    setLogs((prev) => [
      { ...entry, id: `${Date.now()}-${prev.length}` },
      ...prev.slice(0, 199),
    ]);
  }, []);

  useEffect(() => {
    let unmounted = false;
    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      socket = new WebSocket(`${protocol}//${window.location.host}/ws`);
      socket.onopen = () => {
        if (!unmounted) setConnected(true);
      };
      socket.onclose = () => {
        if (unmounted) return;
        setConnected(false);
        retry = setTimeout(connect, 2000);
      };
      socket.onerror = () => {
        if (!unmounted) setConnected(false);
      };
      socket.onmessage = (event) => {
        if (unmounted) return;
        let message: ServerBroadcastMessage;
        try {
          message = JSON.parse(String(event.data)) as ServerBroadcastMessage;
        } catch {
          return;
        }
        if (message.type === 'CLOCK_TICK') {
          const tick = message.data as {
            currentExactTime?: string;
            state?: SniperState;
          };
          lastTickRef.current = Date.now();
          if (tick.currentExactTime) {
            const parts = splitClock(tick.currentExactTime);
            setExactTime(parts.time);
            setExactMs(parts.ms);
          }
          if (tick.state) setEngineState(tick.state);
        } else if (message.type === 'STATE_CHANGE') {
          const data = message.data as { state?: SniperState } | SniperState;
          const next = typeof data === 'string' ? data : data.state;
          if (next) setEngineState(next);
        } else if (message.type === 'ORDER_SHOT') {
          setShots((prev) => [message.data as ShotResult, ...prev]);
        } else if (message.type === 'SHOT_LOG') {
          const data = message.data as { level?: LogEntry['level']; text?: string };
          setLogs((prev) => [
            {
              id: `${Date.now()}-${prev.length}`,
              time: new Date().toLocaleTimeString('fa-IR', { hour12: false }),
              level: data.level || 'info',
              text: data.text || '',
            },
            ...prev.slice(0, 199),
          ]);
        } else if (message.type === 'TIME_SYNC') {
          setTimeSync(message.data as TimeSyncStatus);
        } else if (message.type === 'SNIPER_SUMMARY') {
          const data = message.data as { results?: ShotResult[] };
          if (data.results) setShots(data.results);
        } else if (message.type === 'QUOTE_UPDATE') {
          const quote = message.data as LiveQuote;
          if (quote?.symbol) {
            setQuotesBySymbol((prev) => ({ ...prev, [quote.symbol]: quote }));
          }
        }
      };
    };

    connect();
    const clock = setInterval(() => {
      if (unmounted) return;
      if (lastTickRef.current !== 0 && Date.now() - lastTickRef.current < 1500) return;
      const offset = timeSyncRef.current?.offsetMs ?? 0;
      const date = new Date(Date.now() + offset);
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      const ss = String(date.getSeconds()).padStart(2, '0');
      const ms = String(date.getMilliseconds()).padStart(3, '0');
      setExactTime(`${hh}:${mm}:${ss}`);
      setExactMs(`.${ms}`);
    }, 50);

    return () => {
      unmounted = true;
      clearInterval(clock);
      if (retry) clearTimeout(retry);
      socket?.close();
    };
  }, []);

  return {
    connected,
    engineState,
    setEngineState,
    exactTime,
    exactMs,
    logs,
    shots,
    timeSync,
    setTimeSync,
    quotesBySymbol,
    clearLogs,
    addLog,
  };
}
