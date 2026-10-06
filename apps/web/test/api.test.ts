import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../src/lib/api';

describe('Web API Client Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should fetch server status successfully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        state: 'IDLE',
        config: { order: { symbol: 'فزر' } },
        timeSync: { synchronized: true, offsetMs: 0.5 },
      }),
    });

    const status = await api.getStatus();
    expect(status.state).toBe('IDLE');
    expect(status.config.order.symbol).toBe('فزر');
    expect(global.fetch).toHaveBeenCalledWith('/api/status', expect.anything());
  });

  it('should send post request for armSniper', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Sniper Armed' }),
    });

    const result = await api.armSniper();
    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/sniper/arm',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('should handle API errors and throw descriptive exception', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'موجودی حساب کافی نیست' }),
    });

    await expect(api.disarmSniper()).rejects.toThrow('موجودی حساب کافی نیست');
  });

  it('should handle symbols query', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ symbol: 'فزر', name: 'پویا زرکان' }],
    });

    const result = await api.getSymbols('فزر');
    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe('فزر');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/symbols?q=%D9%81%D8%B2%D8%B1',
      expect.anything()
    );
  });

  it('should handle getIpos request', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ symbol: 'زشک', name: 'حسنانو', isIpo: true }],
    });

    const result = await api.getIpos();
    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe('زشک');
    expect(global.fetch).toHaveBeenCalledWith('/api/symbols/ipos', expect.anything());
  });

  it('should handle refreshSymbols request', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, totalSymbols: 3304, ipoCount: 15, newIpos: ['زشک'] }),
    });

    const result = await api.refreshSymbols();
    expect(result.success).toBe(true);
    expect(result.totalSymbols).toBe(3304);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/symbols/refresh',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
