import { FrequencyType, TransactionType } from '@prisma/client';
import { RecurringTransactionsService } from './recurring-transactions.service';

const day = (d: string) => new Date(`${d}T00:00:00.000Z`);

function setup(item: Record<string, unknown>, walletBalance: number) {
  let balance = walletBalance;
  let nextDate = item.nextExecutionDate as Date;
  const created: Date[] = [];

  const tx = {
    recurringTransaction: {
      updateMany: jest.fn(({ where, data }) => {
        if (where.nextExecutionDate.getTime() !== nextDate.getTime()) return { count: 0 };
        nextDate = data.nextExecutionDate;
        return { count: 1 };
      }),
    },
    transaction: {
      create: jest.fn(({ data }) => {
        created.push(data.transactionDate);
        return { ...data, id: 't' };
      }),
    },
    wallet: {
      update: jest.fn(({ data }) => {
        balance += data.balance.increment ?? -data.balance.decrement;
        return { balance };
      }),
    },
  };
  const prisma = {
    recurringTransaction: {
      findMany: jest.fn(() => [{ ...item, wallet: { balance }, category: { name: 'Nhà' } }]),
    },
    $transaction: jest.fn((fn) => fn(tx)),
  };
  const service = new RecurringTransactionsService(prisma as never);
  return { service, created, getBalance: () => balance };
}

const base = {
  id: 'r1',
  userId: 'u1',
  walletId: 'w1',
  categoryId: 'c1',
  amount: 100,
  type: TransactionType.EXPENSE,
  frequency: FrequencyType.DAILY,
  endDate: null,
  isActive: true,
};

describe('RecurringTransactionsService.processDue', () => {
  it('books every missed occurrence on its scheduled date', async () => {
    const { service, created, getBalance } = setup(
      { ...base, nextExecutionDate: day('2026-01-01') },
      1000,
    );
    const r = await service.processDue(day('2026-01-03'));
    expect(r).toEqual({ executed: 3, skipped: 0 });
    expect(created.map((d) => d.toISOString().slice(0, 10))).toEqual([
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
    ]);
    expect(getBalance()).toBe(700);
  });

  it('stops and skips when balance is insufficient', async () => {
    const { service, getBalance } = setup(
      { ...base, nextExecutionDate: day('2026-01-01') },
      150,
    );
    const r = await service.processDue(day('2026-01-05'));
    expect(r).toEqual({ executed: 1, skipped: 1 });
    expect(getBalance()).toBe(50);
  });

  it('does not run past endDate', async () => {
    const { service } = setup(
      { ...base, nextExecutionDate: day('2026-01-01'), endDate: day('2026-01-02') },
      1000,
    );
    const r = await service.processDue(day('2026-01-10'));
    expect(r.executed).toBe(2);
  });

  it('does nothing when another worker already claimed the schedule', async () => {
    const { service } = setup({ ...base, nextExecutionDate: day('2026-01-01') }, 1000);
    // simulate race: findMany returns stale date
    (service as never as { prisma: { recurringTransaction: { findMany: jest.Mock } } }).prisma
      .recurringTransaction.findMany.mockReturnValueOnce([
        {
          ...base,
          nextExecutionDate: day('2025-12-31'),
          wallet: { balance: 1000 },
          category: { name: 'Nhà' },
        },
      ]);
    const r = await service.processDue(day('2026-01-01'));
    expect(r.executed).toBe(0);
  });

  it('keeps processing other schedules when one fails', async () => {
    const { service, created } = setup({ ...base, nextExecutionDate: day('2026-01-01') }, 1000);
    const prisma = (service as never as { prisma: { recurringTransaction: { findMany: jest.Mock } } })
      .prisma;
    const good = prisma.recurringTransaction.findMany();
    prisma.recurringTransaction.findMany.mockReturnValueOnce([
      { ...base, id: 'bad', nextExecutionDate: undefined, wallet: { balance: 1000 }, category: {} },
      ...good,
    ]);
    const r = await service.processDue(day('2026-01-01'));
    expect(r.executed).toBe(1);
    expect(created).toHaveLength(1);
  });
});
