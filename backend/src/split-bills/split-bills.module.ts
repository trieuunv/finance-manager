import { Module } from '@nestjs/common';
import { SplitBillsController } from './split-bills.controller';
import { SplitBillsService } from './split-bills.service';

@Module({
  controllers: [SplitBillsController],
  providers: [SplitBillsService],
})
export class SplitBillsModule {}
