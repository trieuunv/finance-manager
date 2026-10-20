import { computeSplit } from './split-calculator';

describe('computeSplit', () => {
  it('splits equally including the payer, leftover cents to first people', () => {
    const r = computeSplit(100, [{ name: 'A' }, { name: 'B' }], true);
    expect(r.myShare).toBe(33.34);
    expect(r.shares.map((s) => s.amount)).toEqual([33.33, 33.33]);
    expect(r.myShare + r.shares.reduce((s, x) => s + x.amount, 0)).toBeCloseTo(100, 2);
  });

  it('excludes the payer when includeMe is false', () => {
    const r = computeSplit(90000, [{ name: 'A' }, { name: 'B' }, { name: 'C' }], false);
    expect(r.myShare).toBe(0);
    expect(r.shares.map((s) => s.amount)).toEqual([30000, 30000, 30000]);
  });

  it('keeps fixed amounts and splits the remainder', () => {
    const r = computeSplit(100000, [{ name: 'A', amount: 40000 }, { name: 'B' }], true);
    expect(r.shares).toEqual([
      { participantName: 'A', amount: 40000 },
      { participantName: 'B', amount: 30000 },
    ]);
    expect(r.myShare).toBe(30000);
  });

  it('rejects fixed amounts above total', () => {
    expect(() => computeSplit(100, [{ name: 'A', amount: 150 }], true)).toThrow();
  });

  it('rejects all-fixed amounts that do not add up', () => {
    expect(() => computeSplit(100, [{ name: 'A', amount: 40 }], false)).toThrow();
  });
});
