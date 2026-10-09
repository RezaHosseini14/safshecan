'use client';

import { useEffect } from 'react';
import { AppShell } from '@/features/shell/app-shell';
import { ReportsDesk } from '@/features/reports/reports-desk';
import { api } from '@/lib/api';
import { useSniperSocket } from '@/lib/use-sniper-socket';

export default function ReportsPage() {
  const socket = useSniperSocket();
  const { setEngineState, setTimeSync } = socket;

  useEffect(() => {
    api.getStatus().then((res) => {
      if (res.state) setEngineState(res.state);
      if (res.timeSync) setTimeSync(res.timeSync);
    }).catch(() => undefined);
  }, [setEngineState, setTimeSync]);

  return (
    <AppShell
      engineState={socket.engineState}
      timeSync={socket.timeSync}
      connected={socket.connected}
      footerNote="صف‌شکن — کارنامه و آرشیو شلیک‌ها"
      onDisarm={() => {
        void api.disarmSniper();
      }}
    >
      <ReportsDesk liveShots={socket.shots} />
    </AppShell>
  );
}
