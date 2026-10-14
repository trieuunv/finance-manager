import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { RecurringTransactionsService } from './recurring-transactions.service';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('recurring-transactions')
@UseGuards(JwtAuthGuard)
export class RecurringTransactionsController {
  constructor(private readonly recurringService: RecurringTransactionsService) {}

  @Get()
  async findAll(@Request() req) {
    return this.recurringService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.recurringService.findOne(req.user.id, id);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateRecurringTransactionDto) {
    return this.recurringService.create(req.user.id, dto);
  }

  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateRecurringTransactionDto,
  ) {
    return this.recurringService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.recurringService.remove(req.user.id, id);
  }

  @Post(':id/execute')
  async executeNow(@Request() req, @Param('id') id: string) {
    return this.recurringService.executeNow(req.user.id, id);
  }
}
