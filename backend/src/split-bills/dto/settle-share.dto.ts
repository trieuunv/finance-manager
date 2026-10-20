import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SettleShareDto {
  /** Wallet that receives the money. */
  @IsString()
  walletId: string;

  /** Defaults to the full outstanding amount of the share. */
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  amount?: number;
}
