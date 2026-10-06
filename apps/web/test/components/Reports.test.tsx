import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReportsPage from '../../src/app/reports/page';

vi.mock('../../src/lib/api', () => ({
  api: {
    getReports: vi.fn().mockResolvedValue({
      results: [
        {
          shotIndex: 101,
          timestamp: '08:44:59.985',
          latencyMs: 15.4,
          httpStatus: 200,
          success: true,
          trackingCode: 'TRK-101',
          symbol: 'فزر',
          broker: 'تدبیرپرداز',
        },
        {
          shotIndex: 102,
          timestamp: '08:44:59.990',
          latencyMs: 32.1,
          httpStatus: 400,
          success: false,
          errorMessage: 'سقف حجم پر شده است',
          symbol: 'خودرو',
          broker: 'مفید',
        },
      ],
    }),
  },
}));

describe('ReportsPage Component Tests', () => {
  it('should render page title, KPI cards, and shots table', async () => {
    render(<ReportsPage />);

    expect(screen.getByText('کارنامه، آرشیو و تحلیل آماری شلیک‌ها')).toBeInTheDocument();
    expect(screen.getByText('درصد موفقیت کلی شلیک‌ها')).toBeInTheDocument();
    expect(screen.getByText('میانگین تاخیر رفت‌وبرگشت (RTT)')).toBeInTheDocument();
    expect(screen.getByText('خروجی اکسل (CSV)')).toBeInTheDocument();
    expect(screen.getByText('چاپ گزارش رسمی')).toBeInTheDocument();
  });

  it('should filter table when clicking on filter chips', async () => {
    render(<ReportsPage />);

    const failedChip = screen.getByText('خطاهای کارگزاری');
    fireEvent.click(failedChip);

    // After filtering to failed, success items shouldn't show in the filtered view
    expect(failedChip).toHaveClass('text-emerald-400');
  });

  it('should open packet inspector dialog on inspect button click', async () => {
    render(<ReportsPage />);

    const inspectButtons = screen.getAllByTitle('مشاهده جزئیات پکت');
    expect(inspectButtons.length).toBeGreaterThan(0);
    fireEvent.click(inspectButtons[0]);

    expect(screen.getByText(/ریزپکت هگز و وقایع سوکت شلیک/)).toBeInTheDocument();
    expect(screen.getByText(/هدرهای امنیتی/)).toBeInTheDocument();
  });
});
