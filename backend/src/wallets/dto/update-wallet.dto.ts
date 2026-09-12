import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateWalletDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsNumber()
  @IsOptional()
  balance?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsBoolean()
  @IsOptional()
  isExcludedFromTotal?: boolean;
}
