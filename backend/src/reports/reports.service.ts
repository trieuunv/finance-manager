import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string, month?: number, year?: number) {
    const currentDate = new Date();
    const targetMonth = month ? Number(month) : currentDate.getMonth() + 1;
    const targetYear = year ? Number(year) : currentDate.getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        transactionDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        category: true,
      },
    });

    let totalIncome = 0;
    let totalExpense = 0;

    const categoryMap: {
      [id: string]: {
        categoryName: string;
        categoryIcon: string;
        categoryColor: string;
        totalAmount: number;
      };
    } = {};

    for (const t of transactions) {
      if (t.type === 'INCOME') {
        totalIncome += t.amount;
      } else if (t.type === 'EXPENSE') {
        totalExpense += t.amount;

        const catName = t.category?.name || 'Khác';
        const catIcon = t.category?.icon || 'category';
        const catColor = t.category?.color || '#38BDF8';
        const catId = t.categoryId || 'other';

        if (!categoryMap[catId]) {
          categoryMap[catId] = {
            categoryName: catName,
            categoryIcon: catIcon,
            categoryColor: catColor,
            totalAmount: 0,
          };
        }
        categoryMap[catId].totalAmount += t.amount;
      }
    }

    const categoryBreakdown = Object.values(categoryMap).map((item) => ({
      ...item,
      percentage: totalExpense > 0 ? Math.round((item.totalAmount / totalExpense) * 10000) / 100 : 0,
    })).sort((a, b) => b.totalAmount - a.totalAmount);

    const netSavings = totalIncome - totalExpense;

    return {
      success: true,
      data: {
        period: `${targetMonth.toString().padStart(2, '0')}/${targetYear}`,
        month: targetMonth,
        year: targetYear,
        totalIncome,
        totalExpense,
        netSavings,
        categoryBreakdown,
      },
    };
  }
}
