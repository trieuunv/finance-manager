import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  async findAll(@CurrentUser('id') userId: string, @Query('month') month?: number, @Query('year') year?: number) {
    return this.budgetsService.findAll(userId, month, year);
  }

  @Post()
  async createOrUpdate(@CurrentUser('id') userId: string, @Body() dto: CreateBudgetDto) {
    return this.budgetsService.createOrUpdate(userId, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.budgetsService.remove(userId, id);
  }
}
