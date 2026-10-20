import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { TransferWalletDto } from './dto/transfer-wallet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.walletsService.findAll(userId);
  }

  @Get(':id')
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.walletsService.findOne(userId, id);
  }

  @Post()
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateWalletDto) {
    return this.walletsService.create(userId, dto);
  }

  @Patch(':id')
  async update(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdateWalletDto) {
    return this.walletsService.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.walletsService.remove(userId, id);
  }

  @Post('transfer')
  async transfer(@CurrentUser('id') userId: string, @Body() dto: TransferWalletDto) {
    return this.walletsService.transfer(userId, dto);
  }
}
