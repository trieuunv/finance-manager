import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class DepositSavingsGoalDto {
  @IsString()
  @IsNotEmpty()
  walletId: string;

  @IsNumber()
  @Min(1000)
  amount: number;

  @IsString()
  @IsOptional()
  note?: string;
}
