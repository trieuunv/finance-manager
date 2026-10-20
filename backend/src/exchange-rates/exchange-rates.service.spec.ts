import { convertAmount, RateLookup } from './exchange-rates.service';

const lookup = (table: Record<string, number>): RateLookup => ({
  find: (f, t) => table[`${f}->${t}`] ?? null,
});

describe('convertAmount', () => {
  it('returns the same amount for the same currency', () => {
    expect(convertAmount(10, 'VND', 'VND', lookup({}))).toBe(10);
  });

  it('uses the direct rate', () => {
    expect(convertAmount(2, 'USD', 'VND', lookup({ 'USD->VND': 25000 }))).toBe(50000);
  });

  it('falls back to the inverse rate', () => {
    expect(convertAmount(50000, 'VND', 'USD', lookup({ 'USD->VND': 25000 }))).toBe(2);
  });

  it('returns null when no rate is known', () => {
    expect(convertAmount(1, 'EUR', 'VND', lookup({}))).toBeNull();
  });
});
