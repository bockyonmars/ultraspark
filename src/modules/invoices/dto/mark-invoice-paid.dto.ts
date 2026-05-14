import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class MarkInvoicePaidDto {
  @ApiPropertyOptional({ example: '2026-05-14T12:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({ example: 'Monzo bank transfer' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'Paid in full.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  paymentNotes?: string;
}
