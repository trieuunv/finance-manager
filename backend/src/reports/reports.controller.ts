import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  async getSummary(
    @Request() req,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.reportsService.getSummary(req.user.id, month, year);
  }

  @Get('cash-flow')
  async getCashFlow(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('walletIds') walletIds?: string,
  ) {
    return this.reportsService.getCashFlow(req.user.id, startDate, endDate, walletIds);
  }
}
