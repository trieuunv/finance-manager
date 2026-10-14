import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { DebtsLoansService } from './debts-loans.service';
import { CreateDebtLoanDto } from './dto/create-debt-loan.dto';
import { UpdateDebtLoanDto } from './dto/update-debt-loan.dto';
import { CreateDebtPaymentDto } from './dto/create-debt-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DebtStatus, DebtType } from '@prisma/client';

@Controller('debts-loans')
@UseGuards(JwtAuthGuard)
export class DebtsLoansController {
  constructor(private readonly debtsLoansService: DebtsLoansService) {}

  @Get()
  async findAll(
    @Request() req,
    @Query('type') type?: DebtType,
    @Query('status') status?: DebtStatus,
  ) {
    return this.debtsLoansService.findAll(req.user.id, { type, status });
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.debtsLoansService.findOne(req.user.id, id);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateDebtLoanDto) {
    return this.debtsLoansService.create(req.user.id, dto);
  }

  @Put(':id')
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateDebtLoanDto) {
    return this.debtsLoansService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.debtsLoansService.remove(req.user.id, id);
  }

  @Post(':id/payments')
  async addPayment(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CreateDebtPaymentDto,
  ) {
    return this.debtsLoansService.addPayment(req.user.id, id, dto);
  }

  @Get(':id/payments')
  async getPayments(@Request() req, @Param('id') id: string) {
    return this.debtsLoansService.getPayments(req.user.id, id);
  }
}
