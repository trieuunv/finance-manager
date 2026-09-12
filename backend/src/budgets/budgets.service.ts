import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

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
        const expenseWhere: any = {
          userId,
          type: 'EXPENSE',
          transactionDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        };

        if (b.categoryId) {
          expenseWhere.categoryId = b.categoryId;
        }

        const agg = await this.prisma.transaction.aggregate({
          where: expenseWhere,
          _sum: { amount: true },
        });

        const spent = agg._sum.amount || 0;
        const percentage = Math.round((spent / b.amount) * 10000) / 100;
        let status = 'OK';
        if (percentage >= 100) status = 'DANGER';
        else if (percentage >= 80) status = 'WARNING';

        return {
          ...b,
          spent,
          remaining: Math.max(0, b.amount - spent),
          percentage,
          status,
        };
      }),
    );

    return {
      success: true,
      data: enriched,
    };
  }

  async createOrUpdate(userId: string, dto: CreateBudgetDto) {
    const existing = await this.prisma.budget.findFirst({
      where: {
        userId,
        categoryId: dto.categoryId || null,
        month: dto.month,
        year: dto.year,
      },
    });

    let budget;
    if (existing) {
      budget = await this.prisma.budget.update({
        where: { id: existing.id },
        data: { amount: dto.amount },
        include: { category: true },
      });
    } else {
      budget = await this.prisma.budget.create({
        data: {
          userId,
          categoryId: dto.categoryId || null,
          amount: dto.amount,
          month: dto.month,
          year: dto.year,
        },
        include: { category: true },
      });
    }

    return { success: true, data: budget };
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
