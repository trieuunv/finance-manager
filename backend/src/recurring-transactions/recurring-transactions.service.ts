import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';
import { FrequencyType, Prisma, TransactionType } from '@prisma/client';
import { serializeWallet } from '../common/utils/serialize';

type RecurringWithRelations = Prisma.RecurringTransactionGetPayload<{
  include: { wallet: true; category: true };
}>;

/** Safety cap so a very old schedule cannot book unbounded occurrences in one run. */
const MAX_CATCH_UP_PER_RUN = 31;

@Injectable()
export class RecurringTransactionsService {
  private readonly logger = new Logger(RecurringTransactionsService.name);
  private processing = false;

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

  /**
   * Runs one occurrence: creates the transaction at `txDate`, moves the wallet balance and
   * advances nextExecutionDate. Returns null when another worker already advanced this
   * schedule (optimistic lock on nextExecutionDate), so no occurrence is booked twice.
   */
  private async runOnce(item: RecurringWithRelations, txDate: Date) {
    const amount = Number(item.amount);
    const nextDate = this.calculateNextDate(item.nextExecutionDate, item.frequency);
    const isExpired = !!item.endDate && nextDate > item.endDate;

    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.recurringTransaction.updateMany({
        where: { id: item.id, nextExecutionDate: item.nextExecutionDate, isActive: true },
        data: { nextExecutionDate: nextDate, isActive: isExpired ? false : item.isActive },
      });
      if (claimed.count === 0) return null;

      const transaction = await tx.transaction.create({
        data: {
          userId: item.userId,
          walletId: item.walletId,
          categoryId: item.categoryId,
          amount: item.amount,
          type: item.type,
          transactionDate: txDate,
          note: `[Định kỳ ${item.frequency}] ${item.category.name}`,
        },
      });
      const wallet = await tx.wallet.update({
        where: { id: item.walletId },
        data: {
          balance:
            item.type === TransactionType.EXPENSE
              ? { decrement: amount }
              : { increment: amount },
        },
      });
      return { transaction, wallet, nextDate, isExpired };
    });
  }

  /** Runs every hour; books all schedules whose nextExecutionDate has passed. */
  @Cron(CronExpression.EVERY_HOUR)
  async processDue(now: Date = new Date()) {
    if (this.processing) return { executed: 0, skipped: 0 };
    this.processing = true;
    let executed = 0;
    let skipped = 0;

    try {
      const dueItems = await this.prisma.recurringTransaction.findMany({
        where: { isActive: true, nextExecutionDate: { lte: now } },
        include: { wallet: true, category: true },
      });

      for (const due of dueItems) {
        let item: RecurringWithRelations = due;
        let balance = Number(item.wallet.balance);

        for (let i = 0; i < MAX_CATCH_UP_PER_RUN && item.nextExecutionDate <= now; i++) {
          if (item.endDate && item.nextExecutionDate > item.endDate) break;

          if (item.type === TransactionType.EXPENSE && balance < Number(item.amount)) {
            this.logger.warn(`Bỏ qua định kỳ ${item.id}: ví ${item.walletId} không đủ số dư`);
            skipped++;
            break;
          }

          const result = await this.runOnce(item, item.nextExecutionDate);
          if (!result) break;
          executed++;
          balance = Number(result.wallet.balance);
          item = { ...item, nextExecutionDate: result.nextDate, isActive: !result.isExpired };
          if (result.isExpired) break;
        }
      }
    } catch (error) {
      this.logger.error('Xử lý giao dịch định kỳ thất bại', error as Error);
    } finally {
      this.processing = false;
    }

    return { executed, skipped };
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

    const result = await this.runOnce(item, new Date());
    if (!result) throw new BadRequestException('Giao dịch định kỳ vừa được thực thi, thử lại sau');

    return {
      success: true,
      message: `Đã thực thi thành công giao dịch định kỳ ${amount.toLocaleString()} VND`,
      data: {
        transaction: {
          ...result.transaction,
          amount: Number(result.transaction.amount),
        },
        walletNewBalance: Number(result.wallet.balance),
        nextExecutionDate: result.nextDate,
      },
    };
  }
}
