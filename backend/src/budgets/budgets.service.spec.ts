import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BudgetsService } from './budgets.service';

const makePrisma = () => ({
  budget: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  category: { findFirst: jest.fn() },
  transaction: { aggregate: jest.fn() },
});

describe('BudgetsService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: BudgetsService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new BudgetsService(prisma as any);
  });

  describe('findAll status thresholds', () => {
    const run = async (spent: number | null) => {
      prisma.budget.findMany.mockResolvedValue([{ id: 'b1', categoryId: 'c1', limitAmount: 1000 }]);
      prisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: spent } });
      const res = await service.findAll('u1', 5, 2026);
      return res.data[0];
    };

    it('OK below 80%', async () => {
      const b = await run(799);
      expect(b.status).toBe('OK');
      expect(b.remaining).toBe(201);
    });

    it('WARNING at 80%', async () => {
      expect((await run(800)).status).toBe('WARNING');
    });

    it('DANGER at 100% with remaining clamped to 0', async () => {
      const b = await run(1500);
      expect(b.status).toBe('DANGER');
      expect(b.percentage).toBe(150);
      expect(b.remaining).toBe(0);
    });

    it('handles no spending', async () => {
      expect((await run(null)).spent).toBe(0);
    });
  });

  describe('createOrUpdate', () => {
    const dto = { categoryId: 'c1', limitAmount: 500, month: 5, year: 2026 } as any;

    beforeEach(() => {
      prisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
    });

    it('requires a category', async () => {
      await expect(
        service.createOrUpdate('u1', { ...dto, categoryId: undefined }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects non-positive limit', async () => {
      await expect(service.createOrUpdate('u1', { ...dto, limitAmount: 0 })).rejects.toThrow(
        'lớn hơn 0',
      );
    });

    it('rejects unknown category', async () => {
      prisma.category.findFirst.mockResolvedValue(null);
      await expect(service.createOrUpdate('u1', dto)).rejects.toThrow(NotFoundException);
    });

    it('creates with notify defaults true', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'c1' });
      prisma.budget.findFirst.mockResolvedValue(null);
      prisma.budget.create.mockResolvedValue({ id: 'b1', limitAmount: 500 });

      await service.createOrUpdate('u1', dto);

      expect(prisma.budget.create.mock.calls[0][0].data).toMatchObject({
        userId: 'u1',
        notifyAt80: true,
        notifyAt100: true,
        limitAmount: 500,
      });
      expect(prisma.budget.update).not.toHaveBeenCalled();
    });

    it('updates existing budget and keeps existing notify flags', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'c1' });
      prisma.budget.findFirst.mockResolvedValue({ id: 'b1', notifyAt80: false, notifyAt100: true });
      prisma.budget.update.mockResolvedValue({ id: 'b1', limitAmount: 500 });

      await service.createOrUpdate('u1', dto);

      const call = prisma.budget.update.mock.calls[0][0];
      expect(call.where).toEqual({ id: 'b1' });
      expect(call.data).toMatchObject({ limitAmount: 500, notifyAt80: false, notifyAt100: true });
      expect(prisma.budget.create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('404 when not owned', async () => {
      prisma.budget.findFirst.mockResolvedValue(null);
      await expect(service.remove('u1', 'b1')).rejects.toThrow(NotFoundException);
      expect(prisma.budget.delete).not.toHaveBeenCalled();
    });

    it('deletes owned budget', async () => {
      prisma.budget.findFirst.mockResolvedValue({ id: 'b1' });
      await service.remove('u1', 'b1');
      expect(prisma.budget.delete).toHaveBeenCalledWith({ where: { id: 'b1' } });
    });
  });
});
