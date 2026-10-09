'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/features/shell/app-shell';
import { ConsoleDesk } from '@/features/console/console-desk';
import { api } from '@/lib/api';
import { useSniperSocket } from '@/lib/use-sniper-socket';

export default function DashboardPage() {
  const socket = useSniperSocket();
  const { setEngineState, applyHttpTimeSync } = socket;
  const [disarming, setDisarming] = useState(false);

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
      footerNote="صف‌شکن (SafShekan) - ترمینال سرخطی‌زن فوق‌سریع بورس تهران"
      onDisarm={() => {
        if (disarming) return;
        setDisarming(true);
        api.disarmSniper().finally(() => setDisarming(false));
      }}
    >
      <ConsoleDesk socket={socket} />
    </AppShell>
  );
}
