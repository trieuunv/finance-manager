import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';

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
      const amount = Number(t.amount);
      if (t.type === TransactionType.INCOME) {
        totalIncome += amount;
      } else if (t.type === TransactionType.EXPENSE) {
        totalExpense += amount;

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
        categoryMap[catId].totalAmount += amount;
      }
    }

    const categoryBreakdown = Object.values(categoryMap)
      .map((item) => ({
        ...item,
        percentage: totalExpense > 0 ? Math.round((item.totalAmount / totalExpense) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

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

  async getCashFlow(
    userId: string,
    startDate?: string,
    endDate?: string,
    walletIds?: string[] | string,
  ) {
    const where: any = { userId };

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) {
        where.transactionDate.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.transactionDate.lte = end;
      }
    }

    if (walletIds) {
      const ids = Array.isArray(walletIds) ? walletIds : walletIds.split(',');
      where.walletId = { in: ids };
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: { category: true },
    });

    let totalIncome = 0;
    let totalExpense = 0;

    const categoryMap: {
      [id: string]: {
        categoryName: string;
        amount: number;
      };
    } = {};

    for (const t of transactions) {
      const amount = Number(t.amount);
      if (t.type === TransactionType.INCOME) {
        totalIncome += amount;
      } else if (t.type === TransactionType.EXPENSE) {
        totalExpense += amount;
        const catName = t.category?.name || 'Khác';
        const catId = t.categoryId || 'other';

        if (!categoryMap[catId]) {
          categoryMap[catId] = {
            categoryName: catName,
            amount: 0,
          };
        }
        categoryMap[catId].amount += amount;
      }
    }

    const netSavings = totalIncome - totalExpense;
    const savingsRatePercentage = totalIncome > 0
      ? Math.round((netSavings / totalIncome) * 10000) / 100
      : 0;

    const categoriesBreakdown = Object.values(categoryMap)
      .map((item) => ({
        categoryName: item.categoryName,
        amount: item.amount,
        percentage: totalExpense > 0 ? Math.round((item.amount / totalExpense) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      success: true,
      data: {
        totalIncome,
        totalExpense,
        netSavings,
        savingsRatePercentage,
        categoriesBreakdown,
      },
    };
  }
}
