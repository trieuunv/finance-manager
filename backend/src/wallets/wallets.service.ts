import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { TransferWalletDto } from './dto/transfer-wallet.dto';
import { WalletType, TransactionType } from '@prisma/client';
import { serializeWallet } from '../common/utils/serialize';
import { convertAmount, ExchangeRatesService } from '../exchange-rates/exchange-rates.service';

@Injectable()
export class WalletsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exchangeRates: ExchangeRatesService,
  ) {}

  async findAll(userId: string) {
    const wallets = await this.prisma.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    const serialized = wallets.map(serializeWallet);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { baseCurrency: true },
    });
    const baseCurrency = user?.baseCurrency || 'VND';
    const counted = serialized.filter((w) => !w.isExcludedFromTotal);
    const rates = await this.exchangeRates.loadLookup([
      baseCurrency,
      ...counted.map((w) => w.currency),
    ]);

    let netWorth = 0;
    const missingRates: string[] = [];
    for (const w of counted) {
      const converted = convertAmount(w.balance, w.currency, baseCurrency, rates);
      if (converted === null) {
        if (!missingRates.includes(w.currency)) missingRates.push(w.currency);
      } else {
        netWorth += converted;
      }
    }

    return {
      success: true,
      data: serialized,
      netWorth,
      baseCurrency,
      missingRates,
    };
  }

  async findOne(userId: string, id: string) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { id, userId },
    });

    if (!wallet) {
      throw new NotFoundException('Ví không tồn tại hoặc không thuộc về người dùng');
    }

    return {
      success: true,
      data: serializeWallet(wallet),
    };
  }

  async create(userId: string, dto: CreateWalletDto) {
    const wallet = await this.prisma.wallet.create({
      data: {
        userId,
        name: dto.name,
        type: (dto.type as WalletType) || WalletType.CASH,
        balance: dto.balance !== undefined ? dto.balance : 0,
        currency: dto.currency || 'VND',
        isExcludedFromTotal: dto.isExcludedFromTotal || false,
      },
    });

    return {
      success: true,
      data: serializeWallet(wallet),
    };
  }

  async update(userId: string, id: string, dto: UpdateWalletDto) {
    await this.findOne(userId, id);

    const updated = await this.prisma.wallet.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type ? (dto.type as WalletType) : undefined,
        balance: dto.balance !== undefined ? dto.balance : undefined,
        currency: dto.currency,
        isExcludedFromTotal: dto.isExcludedFromTotal,
      },
    });

    return {
      success: true,
      data: serializeWallet(updated),
    };
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.wallet.delete({
      where: { id },
    });

    return { success: true, message: 'Đã xóa ví thành công' };
  }

  async transfer(userId: string, dto: TransferWalletDto) {
    const fromId = dto.sourceWalletId || dto.fromWalletId;
    const toId = dto.destinationWalletId || dto.toWalletId;

    if (!fromId || !toId) {
      throw new BadRequestException('Vui lòng chỉ định ví nguồn và ví đích');
    }

    if (fromId === toId) {
      throw new BadRequestException('Ví chuyển và ví nhận phải khác nhau');
    }

    const fromWallet = await this.prisma.wallet.findFirst({
      where: { id: fromId, userId },
    });
    const toWallet = await this.prisma.wallet.findFirst({
      where: { id: toId, userId },
    });

    if (!fromWallet || !toWallet) {
      throw new NotFoundException('Một trong các ví chuyển không hợp lệ');
    }

    const totalDebit = dto.amount + (dto.transferFee || 0);

    if (Number(fromWallet.balance) < totalDebit) {
      throw new BadRequestException('Số dư trong ví không đủ để thực hiện chuyển khoản');
    }

    let creditAmount = dto.amount;
    if (fromWallet.currency !== toWallet.currency) {
      const converted = await this.exchangeRates.convert(
        dto.amount,
        fromWallet.currency,
        toWallet.currency,
      );
      if (converted === null) {
        throw new BadRequestException(
          `Chưa có tỷ giá ${fromWallet.currency} -> ${toWallet.currency}`,
        );
      }
      creditAmount = Math.round(converted * 100) / 100;
    }

    const transferDate = dto.transferDate ? new Date(dto.transferDate) : new Date();

    const [updatedFrom, updatedTo, transaction] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: fromWallet.id },
        data: { balance: { decrement: totalDebit } },
      }),
      this.prisma.wallet.update({
        where: { id: toWallet.id },
        data: { balance: { increment: creditAmount } },
      }),
      this.prisma.transaction.create({
        data: {
          userId,
          walletId: fromWallet.id,
          destinationWalletId: toWallet.id,
          type: TransactionType.TRANSFER,
          amount: dto.amount,
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
        fromWalletNewBalance: Number(updatedFrom.balance),
        toWalletNewBalance: Number(updatedTo.balance),
      },
    };
  }
}
