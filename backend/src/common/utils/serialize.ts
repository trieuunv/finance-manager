/** Prisma Decimal -> number (null/undefined -> 0). */
export const toNumber = (value: unknown): number => Number(value ?? 0);

/** Serialize a wallet row so Decimal balance becomes a plain number. */
export const serializeWallet = <T extends { balance: unknown }>(wallet: T) => ({
  ...wallet,
  balance: toNumber(wallet.balance),
});

/** Percentage rounded to 2 decimals; 0 when total is not positive. */
export const percentOf = (part: number, total: number): number =>
  total > 0 ? Math.round((part / total) * 10000) / 100 : 0;
