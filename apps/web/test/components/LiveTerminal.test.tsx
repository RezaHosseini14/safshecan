import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LiveTerminal, hasPersian, renderTerminalText } from '@/components/LiveTerminal';
import { LogEntry, ShotResult } from '@/types';

describe('LiveTerminal & Font Switching Tests', () => {
  it('correctly identifies Persian and non-Persian text', () => {
    expect(hasPersian('ربات مسلح شد')).toBe(true);
    expect(hasPersian('شلیک #1')).toBe(true);
    expect(hasPersian('فزر')).toBe(true);
    expect(hasPersian('HTTP 200 OK')).toBe(false);
    expect(hasPersian('[NTP] offset -14ms')).toBe(false);
    expect(hasPersian('123456')).toBe(false);
  });

  it('renders purely non-Persian text in font-mono', () => {
    const { container } = render(<>{renderTerminalText('[NTP] OFFSET: -14.2ms | RTT: 15ms')}</>);
    const monoSpan = container.querySelector('.font-mono');
    const yekanSpan = container.querySelector('.font-yekan');

    expect(monoSpan).toBeInTheDocument();
    expect(monoSpan?.textContent).toBe('[NTP] OFFSET: -14.2ms | RTT: 15ms');
    expect(yekanSpan).toBeNull();
  });

  it('renders purely Persian text in font-yekan', () => {
    const text = 'ربات مسلح شد. پیش‌گرمایش سوکت‌ها قبل از زمان بازگشایی شروع خواهد شد.';
    const { container } = render(<>{renderTerminalText(text)}</>);
    const yekanSpan = container.querySelector('.font-yekan');

    expect(yekanSpan).toBeInTheDocument();
    expect(yekanSpan?.textContent).toBe(text);
  });

  it('renders mixed text with font-yekan for Persian and font-mono for non-Persian', () => {
    const mixed = '[شلیک آزمایشی] کد 200 | تاخیر: 18ms | کد رهگیری: 849204';
    const { container } = render(<>{renderTerminalText(mixed)}</>);

    const yekanSpans = container.querySelectorAll('.font-yekan');
    const monoSpans = container.querySelectorAll('.font-mono');

    expect(yekanSpans.length).toBeGreaterThan(0);
    expect(monoSpans.length).toBeGreaterThan(0);

    const yekanTexts = Array.from(yekanSpans).map((s) => s.textContent);
    expect(yekanTexts).toContain('شلیک آزمایشی');
    expect(yekanTexts).toContain('کد');
    expect(yekanTexts).toContain('تاخیر:');
    expect(yekanTexts).toContain('کد رهگیری:');

    const monoTexts = Array.from(monoSpans).map((s) => s.textContent);
    expect(monoTexts).toContain('[');
    expect(monoTexts.some((t) => t?.includes('200'))).toBe(true);
    expect(monoTexts.some((t) => t?.includes('18ms'))).toBe(true);
    expect(monoTexts.some((t) => t?.includes('849204'))).toBe(true);
  });

  it('renders LiveTerminal component with logs, empty state and shot cards correctly', () => {
    const onClearLogs = vi.fn();
    const mockLogs: LogEntry[] = [
      {
        id: '1',
        time: '08:45:00',
        level: 'info',
        text: 'ربات مسلح شد.',
      },
      {
        id: '2',
        time: '08:45:01',
        level: 'success',
        text: '[شلیک آزمایشی] کد 200 | تاخیر: 18ms | کد رهگیری: TRK-9901',
      },
      {
        id: '3',
        time: '08:45:02',
        level: 'error',
        text: '[ERR_CONNECTION_REFUSED] Connection timed out after 3000ms',
      },
    ];

    const mockShots: ShotResult[] = [
      {
        shotIndex: 1,
        timestamp: Date.now(),
        success: true,
        httpStatus: 200,
        latencyMs: 14,
        trackingCode: 'TRK-100',
      },
    ];

    const { rerender } = render(
      <LiveTerminal logs={mockLogs} shots={mockShots} onClearLogs={onClearLogs} />
    );

    // Terminal header
    expect(screen.getByText('ترمینال زنده وقایع و شلیک‌ها')).toBeInTheDocument();

    // Shot Card
    expect(screen.getByText('شلیک')).toHaveClass('font-yekan');
    expect(screen.getByText('#1')).toHaveClass('font-mono');
    expect(screen.getByText('14ms')).toHaveClass('font-mono');
    expect(screen.getByText(/HTTP 200/)).toHaveClass('font-mono');
    expect(screen.getByText('کد:')).toHaveClass('font-yekan');
    expect(screen.getByText('TRK-100')).toHaveClass('font-mono');

    // Logs
    expect(screen.getByText('ربات مسلح شد.')).toHaveClass('font-yekan');
    expect(screen.getByText('[ERR_CONNECTION_REFUSED] Connection timed out after 3000ms')).toHaveClass('font-mono');

    // Clear logs button click
    const clearButton = screen.getByTitle('پاک‌سازی ترمینال');
    fireEvent.click(clearButton);
    expect(onClearLogs).toHaveBeenCalledTimes(1);

    // Empty state
    rerender(<LiveTerminal logs={[]} shots={[]} onClearLogs={onClearLogs} />);
    const emptyMsg = screen.getByText(/در انتظار رویداد جدید/);
    expect(emptyMsg).toBeInTheDocument();
    expect(emptyMsg).toHaveClass('font-yekan');
  });
});
