import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateBudgetDto {
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  amount?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  limitAmount?: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsInt()
  @Min(2020)
  year: number;

  @IsBoolean()
  @IsOptional()
  notifyAt80?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyAt100?: boolean;
}
