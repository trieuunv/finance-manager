import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SplitBillsService } from './split-bills.service';
import { CreateSplitBillDto } from './dto/create-split-bill.dto';
import { SettleShareDto } from './dto/settle-share.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('split-bills')
@UseGuards(JwtAuthGuard)
export class SplitBillsController {
  constructor(private readonly service: SplitBillsService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.service.findAll(userId);
  }

  @Get('balances')
  balances(@CurrentUser('id') userId: string) {
    return this.service.balances(userId);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.findOne(userId, id);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateSplitBillDto) {
    return this.service.create(userId, dto);
  }

  @Post(':id/shares/:shareId/settle')
  settle(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('shareId') shareId: string,
    @Body() dto: SettleShareDto,
  ) {
    return this.service.settle(userId, id, shareId, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.remove(userId, id);
  }
}
