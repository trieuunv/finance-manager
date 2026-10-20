import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toNumber } from '../common/utils/serialize';
import { CreateSplitBillDto } from './dto/create-split-bill.dto';
import { SettleShareDto } from './dto/settle-share.dto';
import { computeSplit } from './split-calculator';

type BillWithShares = Prisma.SplitBillGetPayload<{ include: { shares: true } }>;

@Injectable()
export class SplitBillsService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(bill: BillWithShares) {
    const shares = bill.shares.map((s) => ({
      ...s,
      amount: toNumber(s.amount),
      paidAmount: toNumber(s.paidAmount),
      outstanding: toNumber(s.amount) - toNumber(s.paidAmount),
    }));
    return {
      ...bill,
      totalAmount: toNumber(bill.totalAmount),
      myShare: toNumber(bill.myShare),
      shares,
      outstanding: shares.reduce((sum, s) => sum + s.outstanding, 0),
    };
  }

  async create(userId: string, dto: CreateSplitBillDto) {
    let split;
    try {
      split = computeSplit(dto.totalAmount, dto.participants, dto.includeMe ?? true);
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }

    if (dto.walletId) {
      const wallet = await this.prisma.wallet.findFirst({ where: { id: dto.walletId, userId } });
      if (!wallet) throw new NotFoundException('Ví không tồn tại');
      if (Number(wallet.balance) < dto.totalAmount) {
        throw new BadRequestException('Số dư trong ví không đủ để thanh toán hóa đơn');
      }
    }
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({ where: { id: dto.categoryId } });
      if (!category) throw new NotFoundException('Danh mục không tồn tại');
    }

    const billDate = dto.billDate ? new Date(dto.billDate) : new Date();

    const bill = await this.prisma.$transaction(async (tx) => {
      const created = await tx.splitBill.create({
        data: {
          userId,
          walletId: dto.walletId || null,
          title: dto.title,
          totalAmount: dto.totalAmount,
          myShare: split.myShare,
          billDate,
          note: dto.note,
          shares: { create: split.shares },
        },
        include: { shares: true },
      });

      if (dto.walletId) {
        await tx.transaction.create({
          data: {
            userId,
            walletId: dto.walletId,
            categoryId: dto.categoryId || null,
            amount: dto.totalAmount,
            type: TransactionType.EXPENSE,
            transactionDate: billDate,
            note: `[Chia hóa đơn] ${dto.title}`,
          },
        });
        await tx.wallet.update({
          where: { id: dto.walletId },
          data: { balance: { decrement: dto.totalAmount } },
        });
      }
      return created;
    });

    return { success: true, data: this.serialize(bill) };
  }

  async findAll(userId: string) {
    const bills = await this.prisma.splitBill.findMany({
      where: { userId },
      include: { shares: true },
      orderBy: { billDate: 'desc' },
    });
    return { success: true, data: bills.map((b) => this.serialize(b)) };
  }

  async findOne(userId: string, id: string) {
    const bill = await this.prisma.splitBill.findFirst({
      where: { id, userId },
      include: { shares: true },
    });
    if (!bill) throw new NotFoundException('Hóa đơn chia không tồn tại');
    return { success: true, data: this.serialize(bill) };
  }

  /** Who owes the user how much, summed over all open shares. */
  async balances(userId: string) {
    const shares = await this.prisma.splitShare.findMany({
      where: { splitBill: { userId }, settledAt: null },
    });
    const totals = new Map<string, number>();
    for (const s of shares) {
      const outstanding = toNumber(s.amount) - toNumber(s.paidAmount);
      totals.set(s.participantName, (totals.get(s.participantName) ?? 0) + outstanding);
    }
    const data = [...totals.entries()]
      .map(([participantName, owes]) => ({ participantName, owes }))
      .sort((a, b) => b.owes - a.owes);
    return { success: true, data, totalOwed: data.reduce((sum, d) => sum + d.owes, 0) };
  }

  async settle(userId: string, billId: string, shareId: string, dto: SettleShareDto) {
    const share = await this.prisma.splitShare.findFirst({
      where: { id: shareId, splitBillId: billId, splitBill: { userId } },
      include: { splitBill: true },
    });
    if (!share) throw new NotFoundException('Phần chia không tồn tại');

    const wallet = await this.prisma.wallet.findFirst({ where: { id: dto.walletId, userId } });
    if (!wallet) throw new NotFoundException('Ví không tồn tại');

    const outstanding = toNumber(share.amount) - toNumber(share.paidAmount);
    const amount = dto.amount ?? outstanding;
    if (outstanding <= 0) throw new BadRequestException('Phần chia này đã được thanh toán đủ');
    if (amount > outstanding) {
      throw new BadRequestException(`Số tiền vượt quá số còn nợ (${outstanding})`);
    }
    const fullyPaid = amount >= outstanding;

    await this.prisma.$transaction([
      this.prisma.splitShare.update({
        where: { id: shareId },
        data: {
          paidAmount: { increment: amount },
          settledAt: fullyPaid ? new Date() : null,
        },
      }),
      this.prisma.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          amount,
          type: TransactionType.INCOME,
          transactionDate: new Date(),
          note: `[Chia hóa đơn] ${share.participantName} trả: ${share.splitBill.title}`,
        },
      }),
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      }),
    ]);

    return this.findOne(userId, billId);
  }

  /** Deletes the bill record only; recorded wallet transactions are left untouched. */
  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.splitBill.delete({ where: { id } });
    return { success: true, message: 'Đã xóa hóa đơn chia' };
  }
}
