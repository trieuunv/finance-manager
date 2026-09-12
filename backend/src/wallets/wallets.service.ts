import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { TransferWalletDto } from './dto/transfer-wallet.dto';

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const wallets = await this.prisma.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    const netWorth = wallets
      .filter((w) => !w.isExcludedFromTotal)
      .reduce((sum, w) => sum + w.balance, 0);

    return {
      success: true,
      data: wallets,
      netWorth,
    };
  }

  async findOne(userId: string, id: string) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { id, userId },
    });

    if (!wallet) {
      throw new NotFoundException('Ví không tồn tại hoặc không thuộc về người dùng');
    }

    return { success: true, data: wallet };
  }

  async create(userId: string, dto: CreateWalletDto) {
    const wallet = await this.prisma.wallet.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type || 'CASH',
        balance: dto.balance || 0,
        currency: dto.currency || 'VND',
        isExcludedFromTotal: dto.isExcludedFromTotal || false,
      },
    });

    return { success: true, data: wallet };
  }

  async update(userId: string, id: string, dto: UpdateWalletDto) {
    await this.findOne(userId, id);

    const updated = await this.prisma.wallet.update({
      where: { id },
      data: { ...dto },
    });

    return { success: true, data: updated };
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.wallet.delete({
      where: { id },
    });

    return { success: true, message: 'Đã xóa ví thành công' };
  }

  async transfer(userId: string, dto: TransferWalletDto) {
    if (dto.fromWalletId === dto.toWalletId) {
      throw new BadRequestException('Ví chuyển và ví nhận phải khác nhau');
    }

    const fromWallet = await this.prisma.wallet.findFirst({
      where: { id: dto.fromWalletId, userId },
    });
    const toWallet = await this.prisma.wallet.findFirst({
      where: { id: dto.toWalletId, userId },
    });

    if (!fromWallet || !toWallet) {
      throw new NotFoundException('Một trong các ví chuyển không hợp lệ');
    }

    if (fromWallet.balance < dto.amount) {
      throw new BadRequestException('Số dư trong ví không đủ để thực hiện chuyển khoản');
    }

    const transferDate = dto.transferDate ? new Date(dto.transferDate) : new Date();

    const [updatedFrom, updatedTo, transaction] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: fromWallet.id },
        data: { balance: { decrement: dto.amount } },
      }),
      this.prisma.wallet.update({
        where: { id: toWallet.id },
        data: { balance: { increment: dto.amount } },
      }),
      this.prisma.transaction.create({
        data: {
          userId,
          walletId: fromWallet.id,
          type: 'TRANSFER',
          amount: dto.amount,
          fromWalletId: fromWallet.id,
          toWalletId: toWallet.id,
          transactionDate: transferDate,
          note: dto.note || `Chuyển từ ${fromWallet.name} sang ${toWallet.name}`,
        },
      }),
    ]);

    return {
      success: true,
      message: 'Chuyển tiền giữa các ví thành công',
      data: {
        transactionId: transaction.id,
        fromWalletNewBalance: updatedFrom.balance,
        toWalletNewBalance: updatedTo.balance,
      },
    };
  }
}
