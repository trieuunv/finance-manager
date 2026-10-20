import { IsDateString, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpsertExchangeRateDto {
  @IsString()
  @Length(3, 3)
  fromCurrency: string;

  @IsString()
  @Length(3, 3)
  @IsOptional()
  toCurrency?: string;

  @IsNumber()
  @Min(0.000001)
  rate: number;

  @IsDateString()
  @IsOptional()
  effectiveDate?: string;
}
