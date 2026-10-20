import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { DebtsLoansService } from './debts-loans.service';
import { CreateDebtLoanDto } from './dto/create-debt-loan.dto';
import { UpdateDebtLoanDto } from './dto/update-debt-loan.dto';
import { CreateDebtPaymentDto } from './dto/create-debt-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DebtStatus, DebtType } from '@prisma/client';

@Controller('debts-loans')
@UseGuards(JwtAuthGuard)
export class DebtsLoansController {
  constructor(private readonly debtsLoansService: DebtsLoansService) {}

  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('type') type?: DebtType,
    @Query('status') status?: DebtStatus,
  ) {
    return this.debtsLoansService.findAll(userId, { type, status });
  }

  @Get(':id')
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.debtsLoansService.findOne(userId, id);
  }

  @Post()
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateDebtLoanDto) {
    return this.debtsLoansService.create(userId, dto);
  }

  @Put(':id')
  async update(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdateDebtLoanDto) {
    return this.debtsLoansService.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.debtsLoansService.remove(userId, id);
  }

  @Post(':id/payments')
  async addPayment(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateDebtPaymentDto,
  ) {
    return this.debtsLoansService.addPayment(userId, id, dto);
  }

  @Get(':id/payments')
  async getPayments(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.debtsLoansService.getPayments(userId, id);
  }
}
