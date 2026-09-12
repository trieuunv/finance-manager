import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class TransferWalletDto {
  @IsString()
  @IsNotEmpty()
  fromWalletId: string;

  @IsString()
  @IsNotEmpty()
  toWalletId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsDateString()
  @IsOptional()
  transferDate?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
