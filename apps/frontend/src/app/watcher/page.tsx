'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AppShell } from '@/features/shell/app-shell';
import { WatcherDesk } from '@/features/watcher/watcher-desk';
import { api } from '@/lib/api';
import { useSniperSocket } from '@/lib/use-sniper-socket';

export default function WatcherPage() {
  const t = useTranslations('shell');
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
      footerNote={t('footerWatcher')}
      onDisarm={() => {
        void api.disarmSniper();
      }}
    >
      <WatcherDesk quotesBySymbol={socket.quotesBySymbol} />
    </AppShell>
  );
}
