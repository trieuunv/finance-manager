import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WalletsService } from './wallets.service';

const makePrisma = () => ({
  wallet: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: { findUnique: jest.fn() },
  transaction: { create: jest.fn() },
  $transaction: jest.fn(),
});

const wallet = (over: Record<string, any> = {}) => ({
  id: 'w1',
  userId: 'u1',
  name: 'Cash',
  type: 'CASH',
  balance: 1000,
  currency: 'VND',
  isExcludedFromTotal: false,
  ...over,
});

describe('WalletsService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let rates: { convert: jest.Mock; loadLookup: jest.Mock };
  let service: WalletsService;

  beforeEach(() => {
    prisma = makePrisma();
    rates = { convert: jest.fn(), loadLookup: jest.fn() };
    service = new WalletsService(prisma as any, rates as any);
  });

  describe('findOne', () => {
    it('404 when wallet not owned by user', async () => {
      prisma.wallet.findFirst.mockResolvedValue(null);
      await expect(service.findOne('u1', 'w1')).rejects.toThrow(NotFoundException);
      expect(prisma.wallet.findFirst).toHaveBeenCalledWith({ where: { id: 'w1', userId: 'u1' } });
    });
  });

  describe('findAll', () => {
    it('sums net worth in base currency, skipping excluded wallets', async () => {
      prisma.wallet.findMany.mockResolvedValue([
        wallet({ id: 'a', balance: 1000, currency: 'VND' }),
        wallet({ id: 'b', balance: 2, currency: 'USD' }),
        wallet({ id: 'c', balance: 999999, currency: 'VND', isExcludedFromTotal: true }),
      ]);
      prisma.user.findUnique.mockResolvedValue({ baseCurrency: 'VND' });
      rates.loadLookup.mockResolvedValue({
        find: (f: string, t: string) => (f === 'USD' && t === 'VND' ? 25000 : null),
      });

      const res = await service.findAll('u1');

      expect(res.netWorth).toBe(51000);
      expect(res.missingRates).toEqual([]);
    });

    it('reports currencies with no rate once', async () => {
      prisma.wallet.findMany.mockResolvedValue([
        wallet({ id: 'a', balance: 5, currency: 'EUR' }),
        wallet({ id: 'b', balance: 7, currency: 'EUR' }),
      ]);
      prisma.user.findUnique.mockResolvedValue({ baseCurrency: 'VND' });
      rates.loadLookup.mockResolvedValue({ find: () => null });

      const res = await service.findAll('u1');

      expect(res.netWorth).toBe(0);
      expect(res.missingRates).toEqual(['EUR']);
    });
  });

  describe('create', () => {
    it('applies defaults', async () => {
      prisma.wallet.create.mockResolvedValue(wallet());
      await service.create('u1', { name: 'Cash' } as any);
      expect(prisma.wallet.create.mock.calls[0][0].data).toMatchObject({
        userId: 'u1',
        type: 'CASH',
        balance: 0,
        currency: 'VND',
        isExcludedFromTotal: false,
      });
    });
  });

  describe('remove', () => {
    it('does not delete a wallet that is not owned', async () => {
      prisma.wallet.findFirst.mockResolvedValue(null);
      await expect(service.remove('u1', 'w1')).rejects.toThrow(NotFoundException);
      expect(prisma.wallet.delete).not.toHaveBeenCalled();
    });
  });

  describe('transfer', () => {
    const setupWallets = (from: any, to: any) =>
      prisma.wallet.findFirst.mockImplementation(({ where }: any) =>
        Promise.resolve(where.id === from.id ? from : where.id === to.id ? to : null),
      );

    beforeEach(() => {
      prisma.wallet.update.mockImplementation(({ where, data }: any) => ({ id: where.id, data }));
      prisma.transaction.create.mockImplementation((arg: any) => ({ id: 't1', ...arg }));
      prisma.$transaction.mockImplementation((ops: any[]) =>
        Promise.resolve(ops.map((_, i) => (i === 2 ? { id: 't1' } : { balance: 123 }))),
      );
    });

    it('needs both wallet ids', async () => {
      await expect(service.transfer('u1', { amount: 1 } as any)).rejects.toThrow(
        'ví nguồn và ví đích',
      );
    });

    it('rejects same wallet', async () => {
      await expect(
        service.transfer('u1', { fromWalletId: 'w1', toWalletId: 'w1', amount: 1 } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('404 when a wallet is not found', async () => {
      setupWallets(wallet({ id: 'w1' }), wallet({ id: 'zzz' }));
      await expect(
        service.transfer('u1', { fromWalletId: 'w1', toWalletId: 'w2', amount: 1 } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects insufficient balance including fee', async () => {
      setupWallets(wallet({ id: 'w1', balance: 100 }), wallet({ id: 'w2' }));
      await expect(
        service.transfer('u1', {
          fromWalletId: 'w1',
          toWalletId: 'w2',
          amount: 100,
          transferFee: 1,
        } as any),
      ).rejects.toThrow('không đủ');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('debits amount + fee and credits amount for same currency', async () => {
      setupWallets(wallet({ id: 'w1', balance: 1000 }), wallet({ id: 'w2' }));

      const res = await service.transfer('u1', {
        fromWalletId: 'w1',
        toWalletId: 'w2',
        amount: 100,
        transferFee: 5,
      } as any);

      const calls = prisma.wallet.update.mock.calls.map((c) => c[0]);
      expect(calls[0].data.balance).toEqual({ decrement: 105 });
      expect(calls[1].data.balance).toEqual({ increment: 100 });
      expect(rates.convert).not.toHaveBeenCalled();
      expect(res.data.transactionId).toBe('t1');
    });

    it('converts across currencies and rounds to 2 decimals', async () => {
      setupWallets(
        wallet({ id: 'w1', balance: 1000, currency: 'VND' }),
        wallet({ id: 'w2', currency: 'USD' }),
      );
      rates.convert.mockResolvedValue(3.456789);

      await service.transfer('u1', { fromWalletId: 'w1', toWalletId: 'w2', amount: 100 } as any);

      expect(rates.convert).toHaveBeenCalledWith(100, 'VND', 'USD');
      expect(prisma.wallet.update.mock.calls[1][0].data.balance).toEqual({ increment: 3.46 });
    });

    it('fails when no exchange rate exists', async () => {
      setupWallets(
        wallet({ id: 'w1', balance: 1000, currency: 'VND' }),
        wallet({ id: 'w2', currency: 'EUR' }),
      );
      rates.convert.mockResolvedValue(null);

      await expect(
        service.transfer('u1', { fromWalletId: 'w1', toWalletId: 'w2', amount: 100 } as any),
      ).rejects.toThrow('Chưa có tỷ giá');
    });
  });
});
