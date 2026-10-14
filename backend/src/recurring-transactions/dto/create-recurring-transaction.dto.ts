import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { FrequencyType, TransactionType } from '@prisma/client';

export class CreateRecurringTransactionDto {
  @IsString()
  @IsNotEmpty()
  walletId: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsNumber()
  @Min(1000)
  amount: number;

  @IsEnum(TransactionType)
  @IsNotEmpty()
  type: TransactionType; // EXPENSE, INCOME

  @IsEnum(FrequencyType)
  @IsOptional()
  frequency?: FrequencyType; // DAILY, WEEKLY, MONTHLY, YEARLY

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
