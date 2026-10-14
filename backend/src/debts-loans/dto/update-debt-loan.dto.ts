import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { DebtStatus, DebtType } from '@prisma/client';

export class UpdateDebtLoanDto {
  @IsString()
  @IsOptional()
  personName?: string;

  @IsEnum(DebtType)
  @IsOptional()
  type?: DebtType;

  @IsNumber()
  @Min(1000)
  @IsOptional()
  totalAmount?: number;

  @IsNumber()
  @IsOptional()
  remainingAmount?: number;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsNumber()
  @IsOptional()
  interestRate?: number;

  @IsEnum(DebtStatus)
  @IsOptional()
  status?: DebtStatus;
}
