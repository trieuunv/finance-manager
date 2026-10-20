import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionType } from '@prisma/client';
import { serializeWallet } from '../common/utils/serialize';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';

const TRANSACTION_INCLUDE = {
  wallet: true,
  category: true,
  destinationWallet: true,
  tags: { include: { tag: true } },
} as const;

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exchangeRates: ExchangeRatesService,
  ) {}

  private serialize(t: any) {
    if (!t) return t;
    return {
      ...t,
      amount: Number(t.amount),
      wallet: t.wallet ? serializeWallet(t.wallet) : undefined,
      destinationWallet: t.destinationWallet ? serializeWallet(t.destinationWallet) : undefined,
      tags: t.tags ? t.tags.map((tt: any) => tt.tag || tt) : [],
    };
  }

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
      where.type = query.type as TransactionType;
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
      include: TRANSACTION_INCLUDE,
      orderBy: { transactionDate: 'desc' },
      take: query.limit ? Number(query.limit) : undefined,
    });

    return {
      success: true,
      data: transactions.map((t) => this.serialize(t)),
    };
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: TRANSACTION_INCLUDE,
    });

    if (!transaction) {
      throw new NotFoundException('Giao dịch không tồn tại');
    }

    return { success: true, data: this.serialize(transaction) };
  }

  async create(userId: string, dto: CreateTransactionDto) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { id: dto.walletId, userId },
    });
    if (!wallet) {
      throw new NotFoundException('Ví không tồn tại');
    }

    const txType = (dto.type as TransactionType) || TransactionType.EXPENSE;

    if (txType === TransactionType.EXPENSE && Number(wallet.balance) < dto.amount) {
      throw new BadRequestException('Số dư trong ví không đủ để thực hiện chi tiêu');
    }

    const destWalletId = dto.destinationWalletId || dto.toWalletId || null;
    const transactionDate = dto.transactionDate ? new Date(dto.transactionDate) : new Date();

    const tagsCreate = dto.tagIds && dto.tagIds.length > 0
      ? {
          create: dto.tagIds.map((tagId) => ({ tagId })),
        }
      : undefined;

    let destCredit = dto.amount;
    if (txType === TransactionType.TRANSFER && destWalletId) {
      const destWallet = await this.prisma.wallet.findFirst({
        where: { id: destWalletId, userId },
      });
      if (!destWallet) throw new NotFoundException('Ví đích không tồn tại');
      if (destWallet.currency !== wallet.currency) {
        const converted = await this.exchangeRates.convert(
          dto.amount,
          wallet.currency,
          destWallet.currency,
        );
        if (converted === null) {
          throw new BadRequestException(
            `Chưa có tỷ giá ${wallet.currency} -> ${destWallet.currency}`,
          );
        }
        destCredit = Math.round(converted * 100) / 100;
      }
    }

    const balanceChange =
      txType === TransactionType.EXPENSE
        ? -dto.amount
        : txType === TransactionType.INCOME
          ? dto.amount
          : txType === TransactionType.TRANSFER && destWalletId
            ? -dto.amount
            : 0;

    const { transaction, updatedWallet } = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          id: dto.id || undefined,
          userId,
          walletId: dto.walletId,
          categoryId: dto.categoryId || null,
          destinationWalletId: destWalletId,
          amount: dto.amount,
          destinationAmount: txType === TransactionType.TRANSFER && destWalletId ? destCredit : null,
          type: txType,
          transactionDate,
          note: dto.note || '',
          tags: tagsCreate,
        },
        include: TRANSACTION_INCLUDE,
      });

      if (txType === TransactionType.TRANSFER && destWalletId) {
        await tx.wallet.update({
          where: { id: destWalletId },
          data: { balance: { increment: destCredit } },
        });
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: balanceChange } },
      });

      return { transaction, updatedWallet };
    });

    // Check Budget Alert
    let budgetAlert = {
      has_warning: false,
      budget_percentage: 0,
      message: '',
    };

    if (txType === TransactionType.EXPENSE && dto.categoryId) {
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
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

        const totalExpenseAgg = await this.prisma.transaction.aggregate({
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

        const currentSpent = Number(totalExpenseAgg._sum.amount || 0);
        const limit = Number(budget.limitAmount);
        const percentage = limit > 0 ? Math.round((currentSpent / limit) * 10000) / 100 : 0;

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
        transaction: this.serialize(transaction),
        updatedWalletBalance: Number(updatedWallet.balance),
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

    const existingAmount = Number(existing.amount);

    // Revert old balance
    if (existing.type === TransactionType.EXPENSE) {
      await this.prisma.wallet.update({
        where: { id: existing.walletId },
        data: { balance: { increment: existingAmount } },
      });
    } else if (existing.type === TransactionType.INCOME) {
      await this.prisma.wallet.update({
        where: { id: existing.walletId },
        data: { balance: { decrement: existingAmount } },
      });
    }

    const newType = dto.type ? (dto.type as TransactionType) : existing.type;
    const newAmount = dto.amount !== undefined ? dto.amount : existingAmount;

    const updated = await this.prisma.transaction.update({
      where: { id },
      data: {
        walletId: dto.walletId || existing.walletId,
        categoryId: dto.categoryId !== undefined ? dto.categoryId : existing.categoryId,
        amount: newAmount,
        type: newType,
        transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : existing.transactionDate,
        note: dto.note !== undefined ? dto.note : existing.note,
      },
      include: TRANSACTION_INCLUDE,
    });

    // Apply new balance
    if (updated.type === TransactionType.EXPENSE) {
      await this.prisma.wallet.update({
        where: { id: updated.walletId },
        data: { balance: { decrement: newAmount } },
      });
    } else if (updated.type === TransactionType.INCOME) {
      await this.prisma.wallet.update({
        where: { id: updated.walletId },
        data: { balance: { increment: newAmount } },
      });
    }

    return { success: true, data: this.serialize(updated) };
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Giao dịch không tồn tại');
    }

    const amount = Number(existing.amount);

    // Revert wallet balance
    if (existing.type === TransactionType.EXPENSE) {
      await this.prisma.wallet.update({
        where: { id: existing.walletId },
        data: { balance: { increment: amount } },
      });
    } else if (existing.type === TransactionType.INCOME) {
      await this.prisma.wallet.update({
        where: { id: existing.walletId },
        data: { balance: { decrement: amount } },
      });
    } else if (existing.type === TransactionType.TRANSFER && existing.destinationWalletId) {
      await this.prisma.wallet.update({
        where: { id: existing.walletId },
        data: { balance: { increment: amount } },
      });
      await this.prisma.wallet.update({
        where: { id: existing.destinationWalletId },
        data: { balance: { decrement: Number(existing.destinationAmount ?? amount) } },
      });
    }

    await this.prisma.transaction.delete({ where: { id } });

    return { success: true, message: 'Đã xóa giao dịch và khôi phục số dư ví' };
  }
}
