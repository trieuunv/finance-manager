import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDebtLoanDto } from './dto/create-debt-loan.dto';
import { UpdateDebtLoanDto } from './dto/update-debt-loan.dto';
import { CreateDebtPaymentDto } from './dto/create-debt-payment.dto';
import { DebtStatus, DebtType, TransactionType } from '@prisma/client';
import { serializeWallet } from '../common/utils/serialize';

@Injectable()
export class DebtsLoansService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(dl: any) {
    const total = Number(dl.totalAmount);
    const remaining = Number(dl.remainingAmount);
    const paid = Math.max(0, total - remaining);
    const progress = total > 0 ? Math.min(100, Math.round((paid / total) * 10000) / 100) : 0;

    return {
      ...dl,
      totalAmount: total,
      remainingAmount: remaining,
      paidAmount: paid,
      paidPercentage: progress,
      interestRate: Number(dl.interestRate || 0),
      payments: dl.payments
        ? dl.payments.map((p: any) => ({
            ...p,
            amount: Number(p.amount),
            wallet: p.wallet ? serializeWallet(p.wallet) : undefined,
          }))
        : undefined,
    };
  }

  async findAll(userId: string, query?: { type?: DebtType; status?: DebtStatus }) {
    const where: any = { userId };
    if (query?.type) where.type = query.type;
    if (query?.status) where.status = query.status;

    const items = await this.prisma.debtLoan.findMany({
      where,
      include: {
        payments: {
          include: { wallet: true },
          orderBy: { paymentDate: 'desc' },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const serialized = items.map((i) => this.serialize(i));

    // Summary calculations
    let totalBorrowed = 0;
    let remainingBorrowed = 0;
    let totalLent = 0;
    let remainingLent = 0;

    for (const item of serialized) {
      if (item.type === DebtType.BORROWED) {
        totalBorrowed += item.totalAmount;
        if (item.status === DebtStatus.ACTIVE) remainingBorrowed += item.remainingAmount;
      } else if (item.type === DebtType.LENT) {
        totalLent += item.totalAmount;
        if (item.status === DebtStatus.ACTIVE) remainingLent += item.remainingAmount;
      }
    }

    return {
      success: true,
      summary: {
        totalBorrowed,
        remainingBorrowed,
        totalLent,
        remainingLent,
        netDebtPosition: remainingLent - remainingBorrowed,
      },
      data: serialized,
    };
  }

  async findOne(userId: string, id: string) {
    const item = await this.prisma.debtLoan.findFirst({
      where: { id, userId },
      include: {
        payments: {
          include: { wallet: true },
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Khoản nợ/cho vay không tồn tại');
    }

    return {
      success: true,
      data: this.serialize(item),
    };
  }

  async create(userId: string, dto: CreateDebtLoanDto) {
    let wallet: any = null;
    if (dto.walletId) {
      wallet = await this.prisma.wallet.findFirst({
        where: { id: dto.walletId, userId },
      });
      if (!wallet) {
        throw new NotFoundException('Ví liên kết không tồn tại');
      }

      if (dto.type === DebtType.LENT && Number(wallet.balance) < dto.totalAmount) {
        throw new BadRequestException('Số dư trong ví không đủ để thực hiện cho vay');
      }
    }

    const dueDate = dto.dueDate ? new Date(dto.dueDate) : null;

    const debtLoan = await this.prisma.debtLoan.create({
      data: {
        userId,
        personName: dto.personName,
        type: dto.type,
        totalAmount: dto.totalAmount,
        remainingAmount: dto.totalAmount,
        dueDate,
        interestRate: dto.interestRate || 0,
        status: DebtStatus.ACTIVE,
      },
    });

    // If wallet was provided, update balance accordingly
    if (wallet) {
      if (dto.type === DebtType.BORROWED) {
        // User borrowed money, cash received into wallet
        await this.prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: dto.totalAmount } },
        });
        await this.prisma.transaction.create({
          data: {
            userId,
            walletId: wallet.id,
            type: TransactionType.INCOME,
            amount: dto.totalAmount,
            transactionDate: new Date(),
            note: `Nhận khoản đi vay từ ${dto.personName}`,
          },
        });
      } else if (dto.type === DebtType.LENT) {
        // User lent money out of wallet
        await this.prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: { decrement: dto.totalAmount } },
        });
        await this.prisma.transaction.create({
          data: {
            userId,
            walletId: wallet.id,
            type: TransactionType.EXPENSE,
            amount: dto.totalAmount,
            transactionDate: new Date(),
            note: `Cho ${dto.personName} vay tiền`,
          },
        });
      }
    }

    return {
      success: true,
      data: this.serialize(debtLoan),
    };
  }

  async update(userId: string, id: string, dto: UpdateDebtLoanDto) {
    await this.findOne(userId, id);

    const updated = await this.prisma.debtLoan.update({
      where: { id },
      data: {
        personName: dto.personName,
        type: dto.type,
        totalAmount: dto.totalAmount,
        remainingAmount: dto.remainingAmount,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        interestRate: dto.interestRate,
        status: dto.status,
      },
    });

    return {
      success: true,
      data: this.serialize(updated),
    };
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.debtLoan.delete({
      where: { id },
    });

    return { success: true, message: 'Đã xóa khoản nợ/cho vay thành công' };
  }

  async addPayment(userId: string, id: string, dto: CreateDebtPaymentDto) {
    const debt = await this.prisma.debtLoan.findFirst({
      where: { id, userId },
    });
    if (!debt) {
      throw new NotFoundException('Khoản nợ/cho vay không tồn tại');
    }

    if (debt.status === DebtStatus.FULLY_PAID) {
      throw new BadRequestException('Khoản nợ/cho vay này đã được thanh toán đầy đủ');
    }

    const currentRemaining = Number(debt.remainingAmount);
    if (dto.amount > currentRemaining) {
      throw new BadRequestException(
        `Số tiền trả (${dto.amount.toLocaleString()} VND) vượt quá dư nợ còn lại (${currentRemaining.toLocaleString()} VND)`,
      );
    }

    const wallet = await this.prisma.wallet.findFirst({
      where: { id: dto.walletId, userId },
    });
    if (!wallet) {
      throw new NotFoundException('Ví không tồn tại');
    }

    // For BORROWED: User pays money to lender -> wallet decrements
    // For LENT: User receives money from borrower -> wallet increments
    if (debt.type === DebtType.BORROWED && Number(wallet.balance) < dto.amount) {
      throw new BadRequestException('Số dư trong ví không đủ để thanh toán nợ');
    }

    const newRemaining = Math.max(0, currentRemaining - dto.amount);
    const isFullyPaid = newRemaining === 0;
    const paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : new Date();

    const [updatedWallet, updatedDebt, payment] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance:
            debt.type === DebtType.BORROWED
              ? { decrement: dto.amount }
              : { increment: dto.amount },
        },
      }),
      this.prisma.debtLoan.update({
        where: { id: debt.id },
        data: {
          remainingAmount: newRemaining,
          status: isFullyPaid ? DebtStatus.FULLY_PAID : debt.status,
        },
      }),
      this.prisma.debtPayment.create({
        data: {
          debtLoanId: debt.id,
          walletId: wallet.id,
          amount: dto.amount,
          paymentDate,
          note: dto.note || `Thanh toán khoản ${debt.type === DebtType.BORROWED ? 'nợ' : 'cho vay'} với ${debt.personName}`,
        },
      }),
    ]);

    return {
      success: true,
      message: isFullyPaid
        ? `🎉 Khoản ${debt.type === DebtType.BORROWED ? 'nợ' : 'cho vay'} với ${debt.personName} đã được thanh toán hoàn tất!`
        : `Đã ghi nhận thanh toán ${dto.amount.toLocaleString()} VND thành công`,
      data: {
        debtLoan: this.serialize(updatedDebt),
        payment: {
          ...payment,
          amount: Number(payment.amount),
        },
        walletNewBalance: Number(updatedWallet.balance),
      },
    };
  }

  async getPayments(userId: string, id: string) {
    await this.findOne(userId, id);

    const payments = await this.prisma.debtPayment.findMany({
      where: { debtLoanId: id },
      include: { wallet: true },
      orderBy: { paymentDate: 'desc' },
    });

    return {
      success: true,
      data: payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
    };
  }
}
