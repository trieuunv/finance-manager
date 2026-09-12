import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateBudgetDto {
  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsInt()
  @Min(2020)
  year: number;
}
