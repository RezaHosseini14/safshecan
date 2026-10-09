import { describe, expect, it } from 'vitest';
import { ApiError, apiUrl } from '../src/lib/api';

describe('frontend api client', () => {
  it('sends browser calls only under /api', () => {
    expect(apiUrl('/sniper/disarm')).toBe('/api/sniper/disarm');
    expect(apiUrl('/market/quote')).toBe('/api/market/quote');
  });

  it('refuses a path that would leave the api prefix', () => {
    expect(() => apiUrl('https://broker.example/order')).toThrow(ApiError);
  });
});
