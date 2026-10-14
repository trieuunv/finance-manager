import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { ScanReceiptDto } from './dto/scan-receipt.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ocr')
@UseGuards(JwtAuthGuard)
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post('scan-receipt')
  async scanReceipt(@Request() req, @Body() dto: ScanReceiptDto) {
    return this.ocrService.scanReceipt(req.user.id, dto);
  }

  @Get('receipts/:transactionId')
  async getReceipt(@Request() req, @Param('transactionId') transactionId: string) {
    return this.ocrService.getReceiptForTransaction(req.user.id, transactionId);
  }
}
