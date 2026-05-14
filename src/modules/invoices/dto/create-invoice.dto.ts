import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { InvoiceStatus } from '@prisma/client';

export class CreateInvoiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ example: 'Sarah Johnson' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  customerName?: string;

  @ApiPropertyOptional({ example: 'sarah@example.com' })
  @Transform(({ value }) => emptyStringToUndefined(value))
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  customerEmail?: string;

  @ApiPropertyOptional({ example: '+447900123456' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  customerPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bookingId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quoteId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supportTicketId?: string;

  @ApiPropertyOptional({ example: 'USI-20260514-0001' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  invoiceNumber?: string;

  @ApiPropertyOptional({ example: '2026-05-14T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @ApiPropertyOptional({ example: '2026-05-28T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ example: 120 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ example: 'GBP' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ enum: InvoiceStatus })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiPropertyOptional({ example: 'https://pay.example.com/invoice/123' })
  @Transform(({ value }) => emptyStringToUndefined(value))
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  paymentLink?: string;

  @ApiPropertyOptional({ example: 'Monzo invoice for May house clean.' })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  notes?: string;
}

function emptyStringToUndefined(value: unknown) {
  return typeof value === 'string' && value.trim() === '' ? undefined : value;
}
