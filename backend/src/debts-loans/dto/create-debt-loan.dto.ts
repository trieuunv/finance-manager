import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { DebtType } from '@prisma/client';

export class CreateDebtLoanDto {
  @IsString()
  @IsNotEmpty()
  personName: string;

  @IsEnum(DebtType)
  @IsNotEmpty()
  type: DebtType; // BORROWED (đi vay), LENT (cho vay)

  @IsNumber()
  @Min(1000)
  totalAmount: number;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsNumber()
  @IsOptional()
  interestRate?: number;

  @IsString()
  @IsOptional()
  walletId?: string; // Ví nguồn giải ngân hoặc nhận tiền ban đầu
}
