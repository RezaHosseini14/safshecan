import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from '../../src/components/Header';
import * as tourModule from '../../src/lib/tour';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, id, className }: any) => (
    <a href={href} id={id} className={className}>
      {children}
    </a>
  ),
}));

// Mock tour function
vi.spyOn(tourModule, 'startSafshekanTour').mockImplementation(() => ({} as any));

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    resolvedTheme: 'dark',
    setTheme: vi.fn(),
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Header Component Tests', () => {
  it('should render brand logo, title, and nav links', () => {
    render(
      <Header
        engineState="IDLE"
        timeSync={{
          synchronized: true,
          offsetMs: -3.5,
          rttMs: 14,
          source: 'pool.ntp.org',
          lastSyncTime: new Date().toISOString(),
        }}
      />
    );

    expect(screen.getByText('صف‌شکن')).toBeInTheDocument();
    expect(screen.getByText('HFT')).toBeInTheDocument();
    expect(screen.getByText('داشبورد')).toBeInTheDocument();
    expect(screen.getByText('گزارش‌ها')).toBeInTheDocument();
  });

  it('should render telemetry values (NTP delta and ping)', () => {
    render(
      <Header
        engineState="IDLE"
        timeSync={{
          synchronized: true,
          offsetMs: -4.2,
          rttMs: 16,
          source: 'pool.ntp.org',
          lastSyncTime: new Date().toISOString(),
        }}
        pingMs={16}
      />
    );

    expect(screen.getByText('-4.2ms')).toBeInTheDocument();
    expect(screen.getByText('16ms')).toBeInTheDocument();
    expect(screen.getByText('آماده دریافت')).toBeInTheDocument();
  });

  it('should render armed state correctly', () => {
    render(
      <Header
        engineState="ARMED"
        timeSync={null}
        onEmergencyStop={vi.fn()}
      />
    );

    expect(screen.getByText('آماده‌باش (مسلح)')).toBeInTheDocument();
  });

  it('should trigger emergency stop callback when emergency button is clicked', () => {
    const onEmergencyStop = vi.fn();
    render(
      <Header
        engineState="ARMED"
        timeSync={null}
        onEmergencyStop={onEmergencyStop}
      />
    );

    const stopButton = screen.getByRole('button', { name: /توقف اضطراری/ });
    fireEvent.click(stopButton);
    expect(onEmergencyStop).toHaveBeenCalledTimes(1);
  });

  it('should trigger backtest modal callback when simulator button is clicked', () => {
    const onOpenBacktest = vi.fn();
    render(
      <Header
        engineState="IDLE"
        timeSync={null}
        onOpenBacktest={onOpenBacktest}
      />
    );

    const backtestBtn = screen.getByRole('button', { name: /شبیه‌ساز و بک‌تست معاملات/ });
    fireEvent.click(backtestBtn);
    expect(onOpenBacktest).toHaveBeenCalledTimes(1);
  });

  it('should trigger tour function when tour button is clicked', () => {
    render(
      <Header
        engineState="IDLE"
        timeSync={null}
      />
    );

    const tourBtn = screen.getByRole('button', { name: /تور راهنما/ });
    fireEvent.click(tourBtn);
    expect(tourModule.startSafshekanTour).toHaveBeenCalledTimes(1);
  });
});
