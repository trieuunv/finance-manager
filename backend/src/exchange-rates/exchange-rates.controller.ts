import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';
import { UpsertExchangeRateDto } from './dto/upsert-exchange-rate.dto';
import { ConvertQueryDto } from './dto/convert-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('exchange-rates')
@UseGuards(JwtAuthGuard)
export class ExchangeRatesController {
  constructor(private readonly service: ExchangeRatesService) {}

  @Get()
  list(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.list(from, to);
  }

  @Get('convert')
  async convert(@Query() query: ConvertQueryDto) {
    const result = await this.service.convert(query.amount, query.from, query.to);
    return { success: true, data: { ...query, result } };
  }

  /** Rates are shared by all users, so only admins (ADMIN_EMAILS) may write them. */
  @Post()
  @UseGuards(AdminGuard)
  upsert(@Body() dto: UpsertExchangeRateDto) {
    return this.service.upsert(dto);
  }
}
