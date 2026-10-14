import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateSavingsGoalDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(1000)
  targetAmount: number;

  @IsNumber()
  @IsOptional()
  currentAmount?: number;

  @IsDateString()
  @IsOptional()
  targetDate?: string;
}
