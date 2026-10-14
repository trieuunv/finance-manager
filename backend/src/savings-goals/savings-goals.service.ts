import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSavingsGoalDto } from './dto/create-savings-goal.dto';
import { UpdateSavingsGoalDto } from './dto/update-savings-goal.dto';
import { DepositSavingsGoalDto } from './dto/deposit-savings-goal.dto';
import { GoalStatus, TransactionType } from '@prisma/client';

@Injectable()
export class SavingsGoalsService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(goal: any) {
    const target = Number(goal.targetAmount);
    const current = Number(goal.currentAmount);
    const progress = target > 0 ? Math.min(100, Math.round((current / target) * 10000) / 100) : 0;
    const remaining = Math.max(0, target - current);

    return {
      ...goal,
      targetAmount: target,
      currentAmount: current,
      progressPercentage: progress,
      remainingAmount: remaining,
      contributions: goal.contributions
        ? goal.contributions.map((c: any) => ({
            ...c,
            amount: Number(c.amount),
          }))
        : undefined,
    };
  }

  async findAll(userId: string) {
    const goals = await this.prisma.savingsGoal.findMany({
      where: { userId },
      include: {
        contributions: {
          include: { wallet: true },
          orderBy: { contributionDate: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: goals.map((g) => this.serialize(g)),
    };
  }

  async findOne(userId: string, id: string) {
    const goal = await this.prisma.savingsGoal.findFirst({
      where: { id, userId },
      include: {
        contributions: {
          include: { wallet: true },
          orderBy: { contributionDate: 'desc' },
        },
      },
    });

    if (!goal) {
      throw new NotFoundException('Mục tiêu tiết kiệm không tồn tại');
    }

    return {
      success: true,
      data: this.serialize(goal),
    };
  }

  async create(userId: string, dto: CreateSavingsGoalDto) {
    const goal = await this.prisma.savingsGoal.create({
      data: {
        userId,
        name: dto.name,
        targetAmount: dto.targetAmount,
        currentAmount: dto.currentAmount || 0,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
      },
    });

    return {
      success: true,
      data: this.serialize(goal),
    };
  }

  async update(userId: string, id: string, dto: UpdateSavingsGoalDto) {
    await this.findOne(userId, id);

    const updated = await this.prisma.savingsGoal.update({
      where: { id },
      data: {
        name: dto.name,
        targetAmount: dto.targetAmount,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
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

    await this.prisma.savingsGoal.delete({
      where: { id },
    });

    return { success: true, message: 'Đã xóa mục tiêu tiết kiệm thành công' };
  }

  async deposit(userId: string, id: string, dto: DepositSavingsGoalDto) {
    const goal = await this.prisma.savingsGoal.findFirst({
      where: { id, userId },
    });
    if (!goal) {
      throw new NotFoundException('Mục tiêu tiết kiệm không tồn tại');
    }

    if (goal.status === GoalStatus.CANCELLED) {
      throw new BadRequestException('Mục tiêu tiết kiệm này đã bị hủy');
    }

    const wallet = await this.prisma.wallet.findFirst({
      where: { id: dto.walletId, userId },
    });
    if (!wallet) {
      throw new NotFoundException('Ví nguồn không tồn tại');
    }

    if (Number(wallet.balance) < dto.amount) {
      throw new BadRequestException('Số dư trong ví không đủ để nạp vào mục tiêu tiết kiệm');
    }

    const newCurrent = Number(goal.currentAmount) + dto.amount;
    const isAchieved = newCurrent >= Number(goal.targetAmount);

    const [updatedWallet, updatedGoal, contribution] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: dto.amount } },
      }),
      this.prisma.savingsGoal.update({
        where: { id: goal.id },
        data: {
          currentAmount: { increment: dto.amount },
          status: isAchieved ? GoalStatus.ACHIEVED : goal.status,
        },
      }),
      this.prisma.savingsGoalContribution.create({
        data: {
          savingsGoalId: goal.id,
          walletId: wallet.id,
          amount: dto.amount,
          note: dto.note || `Nạp vào quỹ "${goal.name}"`,
        },
      }),
    ]);

    return {
      success: true,
      message: isAchieved
        ? `🎉 Chúc mừng! Bạn đã hoàn thành 100% mục tiêu tiết kiệm "${goal.name}"!`
        : `Đã nạp thành công ${dto.amount.toLocaleString()} VND vào mục tiêu "${goal.name}"`,
      data: {
        goal: this.serialize(updatedGoal),
        contribution: {
          ...contribution,
          amount: Number(contribution.amount),
        },
        walletNewBalance: Number(updatedWallet.balance),
      },
    };
  }

  async getContributions(userId: string, id: string) {
    await this.findOne(userId, id);

    const contributions = await this.prisma.savingsGoalContribution.findMany({
      where: { savingsGoalId: id },
      include: { wallet: true },
      orderBy: { contributionDate: 'desc' },
    });

    return {
      success: true,
      data: contributions.map((c) => ({
        ...c,
        amount: Number(c.amount),
      })),
    };
  }
}
