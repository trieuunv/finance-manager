import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    query: {
      startDate?: string;
      endDate?: string;
      walletId?: string;
      categoryId?: string;
      type?: string;
      search?: string;
      limit?: number;
    },
  ) {
    const where: any = { userId };

    if (query.walletId) {
      where.walletId = query.walletId;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.startDate || query.endDate) {
      where.transactionDate = {};
      if (query.startDate) {
        where.transactionDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.transactionDate.lte = new Date(query.endDate);
      }
    }

    if (query.search) {
      where.note = { contains: query.search, mode: 'insensitive' };
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        wallet: true,
        category: true,
        fromWallet: true,
        toWallet: true,
      },
      orderBy: { transactionDate: 'desc' },
      take: query.limit ? Number(query.limit) : undefined,
    });

    return {
      success: true,
      data: transactions,
    };
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: {
        wallet: true,
        category: true,
        fromWallet: true,
        toWallet: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Giao dịch không tồn tại');
    }

    return { success: true, data: transaction };
  }

  async create(userId: string, dto: CreateTransactionDto) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { id: dto.walletId, userId },
    });
    if (!wallet) {
      throw new NotFoundException('Ví không tồn tại');
    }

    if (dto.type === 'EXPENSE' && wallet.balance < dto.amount) {
      throw new BadRequestException('Số dư trong ví không đủ để thực hiện chi tiêu');
    }

    const transactionDate = dto.transactionDate ? new Date(dto.transactionDate) : new Date();

    const transaction = await this.prisma.transaction.create({
      data: {
        id: dto.id || undefined,
        userId,
        walletId: dto.walletId,
        categoryId: dto.categoryId || null,
        amount: dto.amount,
        type: dto.type,
        fromWalletId: dto.fromWalletId || null,
        toWalletId: dto.toWalletId || null,
        transactionDate,
        note: dto.note || '',
      },
      include: {
        wallet: true,
        category: true,
      },
    });

    // Update wallet balance
    let balanceChange = 0;
    if (dto.type === 'EXPENSE') balanceChange = -dto.amount;
    else if (dto.type === 'INCOME') balanceChange = dto.amount;

    const updatedWallet = await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: balanceChange } },
    });

    // Check Budget Alert
    let budgetAlert = {
      has_warning: false,
      budget_percentage: 0,
      message: '',
    };

    if (dto.type === 'EXPENSE' && dto.categoryId) {
      const month = transactionDate.getMonth() + 1;
      const year = transactionDate.getFullYear();

      const budget = await this.prisma.budget.findFirst({
        where: {
          userId,
          categoryId: dto.categoryId,
          month,
          year,
        },
        include: { category: true },
      });

      if (budget) {
        // Calculate total expenses for this category in month
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

        const totalExpenseAgg = await this.prisma.transaction.aggregate({
          where: {
            userId,
            categoryId: dto.categoryId,
            type: 'EXPENSE',
            transactionDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: { amount: true },
        });

        const currentSpent = totalExpenseAgg._sum.amount || 0;
        const percentage = Math.round((currentSpent / budget.amount) * 10000) / 100;

        if (percentage >= 100) {
          budgetAlert = {
            has_warning: true,
            budget_percentage: percentage,
            message: `⚠️ CẢNH BÁO ĐỎ: Chi tiêu danh mục "${budget.category?.name || 'Ngân sách'}" đã ĐẠT ${percentage}% (vượt hạn mức)!`,
          };
        } else if (percentage >= 80) {
          budgetAlert = {
            has_warning: true,
            budget_percentage: percentage,
            message: `⚡ CẢNH BÁO VÀNG: Chi tiêu danh mục "${budget.category?.name || 'Ngân sách'}" đã chạm ${percentage}% hạn mức tháng!`,
          };
        }
      }
    }

    return {
      success: true,
      data: {
        transaction,
        updatedWalletBalance: updatedWallet.balance,
        budgetAlert,
      },
    };
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const existing = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Giao dịch không tồn tại');
    }

    // Revert old balance
    if (existing.type === 'EXPENSE') {
      await this.prisma.wallet.update({
        where: { id: existing.walletId },
        data: { balance: { increment: existing.amount } },
      });
    } else if (existing.type === 'INCOME') {
      await this.prisma.wallet.update({
        where: { id: existing.walletId },
        data: { balance: { decrement: existing.amount } },
      });
    }

    const updated = await this.prisma.transaction.update({
      where: { id },
      data: {
        walletId: dto.walletId || existing.walletId,
        categoryId: dto.categoryId !== undefined ? dto.categoryId : existing.categoryId,
        amount: dto.amount || existing.amount,
        type: dto.type || existing.type,
        transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : existing.transactionDate,
        note: dto.note !== undefined ? dto.note : existing.note,
      },
      include: { wallet: true, category: true },
    });

    // Apply new balance
    if (updated.type === 'EXPENSE') {
      await this.prisma.wallet.update({
        where: { id: updated.walletId },
        data: { balance: { decrement: updated.amount } },
      });
    } else if (updated.type === 'INCOME') {
      await this.prisma.wallet.update({
        where: { id: updated.walletId },
        data: { balance: { increment: updated.amount } },
      });
    }

    return { success: true, data: updated };
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Giao dịch không tồn tại');
    }

    // Revert wallet balance
    if (existing.type === 'EXPENSE') {
      await this.prisma.wallet.update({
        where: { id: existing.walletId },
        data: { balance: { increment: existing.amount } },
      });
    } else if (existing.type === 'INCOME') {
      await this.prisma.wallet.update({
        where: { id: existing.walletId },
        data: { balance: { decrement: existing.amount } },
      });
    }

    await this.prisma.transaction.delete({ where: { id } });

    return { success: true, message: 'Đã xóa giao dịch và khôi phục số dư ví' };
  }
}
