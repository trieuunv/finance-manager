import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateTransactionDto {
  @IsString()
  @IsOptional()
  walletId?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  amount?: number;

  @IsString()
  @IsOptional()
  type?: string;

  @IsDateString()
  @IsOptional()
  transactionDate?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
