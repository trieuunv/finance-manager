import { Body, Controller, Delete, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  async findAll(@Request() req, @Query('month') month?: number, @Query('year') year?: number) {
    return this.budgetsService.findAll(req.user.id, month, year);
  }

  @Post()
  async createOrUpdate(@Request() req, @Body() dto: CreateBudgetDto) {
    return this.budgetsService.createOrUpdate(req.user.id, dto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.budgetsService.remove(req.user.id, id);
  }
}
