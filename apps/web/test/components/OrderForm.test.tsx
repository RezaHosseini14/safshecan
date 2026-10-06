import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OrderForm } from '../../src/components/OrderForm';
import { OrderConfig } from '../../src/types';

vi.mock('../../src/lib/api', () => ({
  api: {
    getSymbols: vi.fn().mockResolvedValue([
      { symbol: 'فزر', name: 'پویا زرکان', isin: 'IRO1FAZR0001', price: 25000, isIpo: false },
      { symbol: 'فولاد', name: 'فولاد مبارکه', isin: 'IRO1FOLD0001', price: 6000, isIpo: false },
      { symbol: 'زشک', name: 'تولیدی حسنانو', isin: 'IRO1ZSHK0001', price: 12000, pMax: 12840, isIpo: true },
    ]),
    getSymbolsStatus: vi.fn().mockResolvedValue({
      totalSymbols: 3,
      ipoCount: 1,
      lastSyncTime: '10:00:00',
      isSyncing: false,
      lastError: null,
    }),
    refreshSymbols: vi.fn().mockResolvedValue({
      success: true,
      totalSymbols: 3,
      ipoCount: 1,
      newIpos: [],
      message: 'بروزرسانی موفق',
    }),
  },
}));

describe('OrderForm Component Tests', () => {
  const mockOrderConfig: OrderConfig = {
    symbol: 'فزر',
    price: 25000,
    quantity: 500,
    brokerType: 'tadbir',
    isin: 'IRO1FAZR0001',
    side: 'BUY',
    antiDoubleSpend: true,
  };

  it('should render symbol, price, quantity, and total valuation', () => {
    const onChange = vi.fn();

    render(
      <OrderForm
        orderConfig={mockOrderConfig}
        onChange={onChange}
      />
    );

    expect(screen.getByText('فزر')).toBeInTheDocument();
    expect(screen.getByDisplayValue('25000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('500')).toBeInTheDocument();

    // 25,000 * 500 = 12,500,000 Rials / 1,250,000 Tomans
    expect(screen.getByText(/12,500,000 ریال/)).toBeInTheDocument();
    expect(screen.getByText(/1,250,000 تومان/)).toBeInTheDocument();
  });

  it('should trigger price stepping on plus and minus clicks', () => {
    const onChange = vi.fn();

    render(
      <OrderForm
        orderConfig={mockOrderConfig}
        onChange={onChange}
      />
    );

    const plusBtn = screen.getByTitle('افزایش ۵۰ ریال');
    fireEvent.click(plusBtn);
    expect(onChange).toHaveBeenCalledWith({ price: 25050 });

    const minusBtn = screen.getByTitle('کاهش ۵۰ ریال');
    fireEvent.click(minusBtn);
    expect(onChange).toHaveBeenCalledWith({ price: 24950 });
  });

  it('should calculate +7% ceiling price on preset click', () => {
    const onChange = vi.fn();

    render(
      <OrderForm
        orderConfig={mockOrderConfig}
        onChange={onChange}
      />
    );

    const presetBtn = screen.getByText('تنظیم روی حداکثر (+۷٪)');
    fireEvent.click(presetBtn);
    // 25000 * 1.07 = 26750
    expect(onChange).toHaveBeenCalledWith({ price: 26750 });
  });

  it('should render live bourse refresh button', () => {
    const onChange = vi.fn();

    render(
      <OrderForm
        orderConfig={mockOrderConfig}
        onChange={onChange}
      />
    );

    expect(screen.getByText('بروزرسانی لحظه‌ای بورس')).toBeInTheDocument();
  });
});
