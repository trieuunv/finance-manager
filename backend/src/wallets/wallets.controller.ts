import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { TransferWalletDto } from './dto/transfer-wallet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  async findAll(@Request() req) {
    return this.walletsService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.walletsService.findOne(req.user.id, id);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateWalletDto) {
    return this.walletsService.create(req.user.id, dto);
  }

  @Patch(':id')
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateWalletDto) {
    return this.walletsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.walletsService.remove(req.user.id, id);
  }

  @Post('transfer')
  async transfer(@Request() req, @Body() dto: TransferWalletDto) {
    return this.walletsService.transfer(req.user.id, dto);
  }
}
