import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';
import { FrequencyType, TransactionType } from '@prisma/client';
import { serializeWallet } from '../common/utils/serialize';

@Injectable()
export class RecurringTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  private calculateNextDate(from: Date, frequency: FrequencyType): Date {
    const next = new Date(from);
    switch (frequency) {
      case FrequencyType.DAILY:
        next.setDate(next.getDate() + 1);
        break;
      case FrequencyType.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case FrequencyType.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        break;
      case FrequencyType.YEARLY:
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  }

  private serialize(rt: any) {
    return {
      ...rt,
      amount: Number(rt.amount),
      wallet: rt.wallet ? serializeWallet(rt.wallet) : undefined,
    };
  }

  async findAll(userId: string) {
    const list = await this.prisma.recurringTransaction.findMany({
      where: { userId },
      include: {
        wallet: true,
        category: true,
      },
      orderBy: { nextExecutionDate: 'asc' },
    });

    return {
      success: true,
      data: list.map((item) => this.serialize(item)),
    };
  }

  async findOne(userId: string, id: string) {
    const item = await this.prisma.recurringTransaction.findFirst({
      where: { id, userId },
      include: {
        wallet: true,
        category: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Giao dịch định kỳ không tồn tại');
    }

    return {
      success: true,
      data: this.serialize(item),
    };
  }

  async create(userId: string, dto: CreateRecurringTransactionDto) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { id: dto.walletId, userId },
    });
    if (!wallet) throw new NotFoundException('Ví không tồn tại');

    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Danh mục không tồn tại');

    const startDate = new Date(dto.startDate);
    const endDate = dto.endDate ? new Date(dto.endDate) : null;
    const frequency = dto.frequency || FrequencyType.MONTHLY;

    const recurring = await this.prisma.recurringTransaction.create({
      data: {
        userId,
        walletId: dto.walletId,
        categoryId: dto.categoryId,
        amount: dto.amount,
        type: dto.type,
        frequency,
        startDate,
        endDate,
        nextExecutionDate: startDate,
        isActive: true,
      },
      include: {
        wallet: true,
        category: true,
      },
    });

    return {
      success: true,
      data: this.serialize(recurring),
    };
  }

  async update(userId: string, id: string, dto: UpdateRecurringTransactionDto) {
    await this.findOne(userId, id);

    const updated = await this.prisma.recurringTransaction.update({
      where: { id },
      data: {
        walletId: dto.walletId,
        categoryId: dto.categoryId,
        amount: dto.amount,
        type: dto.type,
        frequency: dto.frequency,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        isActive: dto.isActive,
      },
      include: {
        wallet: true,
        category: true,
      },
    });

    return {
      success: true,
      data: this.serialize(updated),
    };
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.recurringTransaction.delete({
      where: { id },
    });

    return { success: true, message: 'Đã xóa thiết lập giao dịch định kỳ thành công' };
  }

  async executeNow(userId: string, id: string) {
    const item = await this.prisma.recurringTransaction.findFirst({
      where: { id, userId },
      include: { wallet: true, category: true },
    });

    if (!item) throw new NotFoundException('Giao dịch định kỳ không tồn tại');
    if (!item.isActive) throw new BadRequestException('Giao dịch định kỳ này đang bị tạm dừng');

    const amount = Number(item.amount);

    if (item.type === TransactionType.EXPENSE && Number(item.wallet.balance) < amount) {
      throw new BadRequestException('Số dư ví không đủ để thực thi giao dịch định kỳ');
    }

    const nextDate = this.calculateNextDate(item.nextExecutionDate, item.frequency);
    const isExpired = item.endDate && nextDate > item.endDate;

    const [transaction, updatedWallet, updatedRecurring] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          userId,
          walletId: item.walletId,
          categoryId: item.categoryId,
          amount: item.amount,
          type: item.type,
          transactionDate: new Date(),
          note: `[Định kỳ ${item.frequency}] ${item.category.name}`,
        },
      }),
      this.prisma.wallet.update({
        where: { id: item.walletId },
        data: {
          balance:
            item.type === TransactionType.EXPENSE
              ? { decrement: amount }
              : { increment: amount },
        },
      }),
      this.prisma.recurringTransaction.update({
        where: { id: item.id },
        data: {
          nextExecutionDate: nextDate,
          isActive: isExpired ? false : item.isActive,
        },
      }),
    ]);

    return {
      success: true,
      message: `Đã thực thi thành công giao dịch định kỳ ${amount.toLocaleString()} VND`,
      data: {
        transaction: {
          ...transaction,
          amount: Number(transaction.amount),
        },
        walletNewBalance: Number(updatedWallet.balance),
        nextExecutionDate: updatedRecurring.nextExecutionDate,
      },
    };
  }
}
