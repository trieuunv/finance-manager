import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  async getSummary(
    @CurrentUser('id') userId: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.reportsService.getSummary(userId, month, year);
  }

  @Get('cash-flow')
  async getCashFlow(
    @CurrentUser('id') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('walletIds') walletIds?: string,
  ) {
    return this.reportsService.getCashFlow(userId, startDate, endDate, walletIds);
  }
}
