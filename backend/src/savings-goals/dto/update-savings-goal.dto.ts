import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { GoalStatus } from '@prisma/client';

export class UpdateSavingsGoalDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @Min(1000)
  @IsOptional()
  targetAmount?: number;

  @IsDateString()
  @IsOptional()
  targetDate?: string;

  @IsEnum(GoalStatus)
  @IsOptional()
  status?: GoalStatus;
}
