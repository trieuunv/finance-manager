import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WalletsModule } from './wallets/wallets.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { BudgetsModule } from './budgets/budgets.module';
import { ReportsModule } from './reports/reports.module';
import { SavingsGoalsModule } from './savings-goals/savings-goals.module';
import { DebtsLoansModule } from './debts-loans/debts-loans.module';
import { TagsModule } from './tags/tags.module';
import { RecurringTransactionsModule } from './recurring-transactions/recurring-transactions.module';
import { OcrModule } from './ocr/ocr.module';
import { ExchangeRatesModule } from './exchange-rates/exchange-rates.module';
import { SplitBillsModule } from './split-bills/split-bills.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    ExchangeRatesModule,
    AuthModule,
    WalletsModule,
    CategoriesModule,
    TransactionsModule,
    BudgetsModule,
    ReportsModule,
    SavingsGoalsModule,
    DebtsLoansModule,
    TagsModule,
    RecurringTransactionsModule,
    OcrModule,
    SplitBillsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
