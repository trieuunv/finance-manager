import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { TransactionType } from '@prisma/client';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(b: any, spent: number) {
    const limit = Number(b.limitAmount);
    const percentage = limit > 0 ? Math.round((spent / limit) * 10000) / 100 : 0;
    let status = 'OK';
    if (percentage >= 100) status = 'DANGER';
    else if (percentage >= 80) status = 'WARNING';

    return {
      ...b,
      amount: limit, // for backward compatibility with frontend
      limitAmount: limit,
      spent,
      spentAmount: spent,
      remaining: Math.max(0, limit - spent),
      percentage,
      status,
    };
  }

  async findAll(userId: string, month?: number, year?: number) {
    const currentDate = new Date();
    const targetMonth = month ? Number(month) : currentDate.getMonth() + 1;
    const targetYear = year ? Number(year) : currentDate.getFullYear();

    const budgets = await this.prisma.budget.findMany({
      where: {
        userId,
        month: targetMonth,
        year: targetYear,
      },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const enriched = await Promise.all(
      budgets.map(async (b) => {
        const agg = await this.prisma.transaction.aggregate({
          where: {
            userId,
            categoryId: b.categoryId,
            type: TransactionType.EXPENSE,
            transactionDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: { amount: true },
        });

        const spent = Number(agg._sum.amount || 0);
        return this.serialize(b, spent);
      }),
    );

    return {
      success: true,
      data: enriched,
    };
  }

  async createOrUpdate(userId: string, dto: CreateBudgetDto) {
    if (!dto.categoryId) {
      throw new BadRequestException('Vui lòng chọn danh mục cho ngân sách');
    }

    const targetAmount = dto.limitAmount || dto.amount || 0;
    if (targetAmount <= 0) {
      throw new BadRequestException('Hạn mức ngân sách phải lớn hơn 0');
    }

    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    const existing = await this.prisma.budget.findFirst({
      where: {
        userId,
        categoryId: dto.categoryId,
        month: dto.month,
        year: dto.year,
      },
    });

    let budget;
    if (existing) {
      budget = await this.prisma.budget.update({
        where: { id: existing.id },
        data: {
          limitAmount: targetAmount,
          notifyAt80: dto.notifyAt80 !== undefined ? dto.notifyAt80 : existing.notifyAt80,
          notifyAt100: dto.notifyAt100 !== undefined ? dto.notifyAt100 : existing.notifyAt100,
        },
        include: { category: true },
      });
    } else {
      budget = await this.prisma.budget.create({
        data: {
          userId,
          categoryId: dto.categoryId,
          limitAmount: targetAmount,
          month: dto.month,
          year: dto.year,
          notifyAt80: dto.notifyAt80 !== undefined ? dto.notifyAt80 : true,
          notifyAt100: dto.notifyAt100 !== undefined ? dto.notifyAt100 : true,
        },
        include: { category: true },
      });
    }

    const startOfMonth = new Date(dto.year, dto.month - 1, 1);
    const endOfMonth = new Date(dto.year, dto.month, 0, 23, 59, 59, 999);
    const agg = await this.prisma.transaction.aggregate({
      where: {
        userId,
        categoryId: dto.categoryId,
        type: TransactionType.EXPENSE,
        transactionDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { amount: true },
    });

    const spent = Number(agg._sum.amount || 0);

    return { success: true, data: this.serialize(budget, spent) };
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Ngân sách không tồn tại');
    }

    await this.prisma.budget.delete({ where: { id } });

    return { success: true, message: 'Đã xóa ngân sách thành công' };
  }
}
