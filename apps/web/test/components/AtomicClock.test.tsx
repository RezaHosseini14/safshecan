import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AtomicClock } from '../../src/components/AtomicClock';

describe('AtomicClock Component Tests', () => {
  it('should render exact time digits and NTP badge', () => {
    const onSync = vi.fn().mockResolvedValue(undefined);
    const onOffset = vi.fn().mockResolvedValue(undefined);

    render(
      <AtomicClock
        exactTime="08:44:58"
        exactMs=".820"
        targetTime="08:45:00.000"
        timeSync={{
          synchronized: true,
          offsetMs: -14.2,
          rttMs: 18,
          source: 'NTP L1 DIRECT',
        }}
        onSyncNtp={onSync}
        onSetOffset={onOffset}
        leadTimeMs={18}
      />
    );

    expect(screen.getByText('08:44:58')).toBeInTheDocument();
    expect(screen.getByText('.820')).toBeInTheDocument();
    expect(screen.getByText('NTP L1 DIRECT')).toBeInTheDocument();
    expect(screen.getByText('-14.2ms')).toBeInTheDocument();
  });

  it('should trigger onSyncNtp when sync button is clicked', async () => {
    const onSync = vi.fn().mockResolvedValue(undefined);
    const onOffset = vi.fn().mockResolvedValue(undefined);

    render(
      <AtomicClock
        exactTime="08:44:58"
        exactMs=".820"
        targetTime="08:45:00.000"
        timeSync={{
          synchronized: true,
          offsetMs: -14.2,
          rttMs: 18,
          source: 'NTP L1 DIRECT',
        }}
        onSyncNtp={onSync}
        onSetOffset={onOffset}
        leadTimeMs={18}
      />
    );

    const syncBtn = screen.getByText('همگام‌سازی فوری');
    fireEvent.click(syncBtn);
    expect(onSync).toHaveBeenCalledTimes(1);
  });

  it('should call onSetOffset when manual adjustment button is clicked', () => {
    const onSync = vi.fn().mockResolvedValue(undefined);
    const onOffset = vi.fn().mockResolvedValue(undefined);

    render(
      <AtomicClock
        exactTime="08:44:58"
        exactMs=".820"
        targetTime="08:45:00.000"
        timeSync={{
          synchronized: true,
          offsetMs: -10,
          rttMs: 18,
          source: 'NTP L1 DIRECT',
        }}
        onSyncNtp={onSync}
        onSetOffset={onOffset}
        leadTimeMs={18}
      />
    );

    const plusOneBtn = screen.getByTitle('افزایش ۱ میلی‌ثانیه');
    fireEvent.click(plusOneBtn);
    // current -10 + 1 = -9
    expect(onOffset).toHaveBeenCalledWith(-9);
  });
});
