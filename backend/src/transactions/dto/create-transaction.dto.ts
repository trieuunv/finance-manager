import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  @IsOptional()
  id?: string; // Optional client-side generated UUID for offline sync

  @IsString()
  @IsNotEmpty()
  walletId: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsNotEmpty()
  type: string; // EXPENSE, INCOME, TRANSFER

  @IsString()
  @IsOptional()
  fromWalletId?: string;

  @IsString()
  @IsOptional()
  toWalletId?: string;

  @IsDateString()
  @IsOptional()
  transactionDate?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
