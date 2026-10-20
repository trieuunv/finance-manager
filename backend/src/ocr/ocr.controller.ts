import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { ScanReceiptDto } from './dto/scan-receipt.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('ocr')
@UseGuards(JwtAuthGuard)
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post('scan-receipt')
  async scanReceipt(@CurrentUser('id') userId: string, @Body() dto: ScanReceiptDto) {
    return this.ocrService.scanReceipt(userId, dto);
  }

  @Get('receipts/:transactionId')
  async getReceipt(@CurrentUser('id') userId: string, @Param('transactionId') transactionId: string) {
    return this.ocrService.getReceiptForTransaction(userId, transactionId);
  }
}
