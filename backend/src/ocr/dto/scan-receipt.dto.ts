import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ScanReceiptDto {
  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsString()
  @IsOptional()
  imageBase64?: string;

  @IsString()
  @IsOptional()
  merchantHint?: string;

  @IsNumber()
  @IsOptional()
  amountHint?: number;

  @IsString()
  @IsOptional()
  transactionId?: string;
}
