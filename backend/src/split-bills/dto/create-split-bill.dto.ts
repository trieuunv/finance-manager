import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class SplitParticipantDto {
  @IsString()
  name: string;

  /** Fixed amount; omit to split the remainder equally. */
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  amount?: number;
}

export class CreateSplitBillDto {
  @IsString()
  title: string;

  @IsNumber()
  @Min(0.01)
  totalAmount: number;

  /** Wallet that paid the bill; when set, an EXPENSE transaction is recorded. */
  @IsString()
  @IsOptional()
  walletId?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsBoolean()
  @IsOptional()
  includeMe?: boolean;

  @IsDateString()
  @IsOptional()
  billDate?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SplitParticipantDto)
  participants: SplitParticipantDto[];
}
