import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class TransferWalletDto {
  @IsString()
  @IsOptional()
  fromWalletId?: string;

  @IsString()
  @IsOptional()
  sourceWalletId?: string;

  @IsString()
  @IsOptional()
  toWalletId?: string;

  @IsString()
  @IsOptional()
  destinationWalletId?: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsNumber()
  @IsOptional()
  transferFee?: number;

  @IsDateString()
  @IsOptional()
  transferDate?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
