import { Module } from '@nestjs/common';
import { DebtsLoansService } from './debts-loans.service';
import { DebtsLoansController } from './debts-loans.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DebtsLoansController],
  providers: [DebtsLoansService],
  exports: [DebtsLoansService],
})
export class DebtsLoansModule {}
