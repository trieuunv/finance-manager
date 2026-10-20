import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';
import { UpsertExchangeRateDto } from './dto/upsert-exchange-rate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('exchange-rates')
@UseGuards(JwtAuthGuard)
export class ExchangeRatesController {
  constructor(private readonly service: ExchangeRatesService) {}

  @Get()
  list(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.list(from, to);
  }

  @Get('convert')
  async convert(
    @Query('amount') amount: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const result = await this.service.convert(Number(amount), from, to);
    return { success: true, data: { amount: Number(amount), from, to, result } };
  }

  @Post()
  upsert(@Body() dto: UpsertExchangeRateDto) {
    return this.service.upsert(dto);
  }
}
