'use client';

import { useEffect } from 'react';
import { AppShell } from '@/features/shell/app-shell';
import { ReportsDesk } from '@/features/reports/reports-desk';
import { api } from '@/lib/api';
import { useSniperSocket } from '@/lib/use-sniper-socket';

export default function ReportsPage() {
  const socket = useSniperSocket();
  const { setEngineState, applyHttpTimeSync } = socket;

  useEffect(() => {
    api.getStatus().then((res) => {
      if (res.state) setEngineState(res.state);
      if (res.timeSync) applyHttpTimeSync(res.timeSync);
    }).catch(() => undefined);
  }, [setEngineState, applyHttpTimeSync]);

  return (
    <AppShell
      engineState={socket.engineState}
      timeSync={socket.timeSync}
      connected={socket.connected}
      footerNote="صف‌شکن (SafShekan) - آرشیو معاملات و آمار میلی‌ثانیه‌ای"
      footerAside="TSE High-Frequency Execution Logs"
      onDisarm={() => {
        void api.disarmSniper();
      }}
    >
      <ReportsDesk liveShots={socket.shots} />
    </AppShell>
  );
}
