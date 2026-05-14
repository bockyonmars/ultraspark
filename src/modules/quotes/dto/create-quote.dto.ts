import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { QuoteDocumentType, QuoteStatus } from '@prisma/client';

export class CreateQuoteLineItemDto {
  @ApiProperty({ example: 'Standard house cleaning' })
  @IsString()
  @MaxLength(160)
  serviceName!: string;

  @ApiPropertyOptional({ example: 'Kitchen, bathrooms, bedrooms, and living areas.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 35 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rate!: number;

  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  quantity!: number;
}

export class CreateQuoteDto {
  @ApiPropertyOptional({ enum: QuoteDocumentType })
  @IsOptional()
  @IsEnum(QuoteDocumentType)
  documentType?: QuoteDocumentType;

  @ApiPropertyOptional({ example: 'USQ-20260514-0001' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  quoteNumber?: string;

  @ApiProperty({ example: 'Sarah Johnson' })
  @IsString()
  @MaxLength(200)
  customerName!: string;

  @ApiProperty({ example: 'sarah@example.com' })
  @IsEmail()
  @MaxLength(200)
  customerEmail!: string;

  @ApiPropertyOptional({ example: '+447900123456' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  customerPhone?: string;

  @ApiPropertyOptional({ example: '221B Baker Street, London' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  customerAddress?: string;

  @ApiPropertyOptional({ example: 'Same as customer address' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  serviceAddress?: string;

  @ApiPropertyOptional({ example: '2026-05-14T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({ example: '2026-06-13T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ example: 'UltraSpark Cleaning Admin' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  preparedBy?: string;

  @ApiPropertyOptional({ enum: QuoteStatus })
  @IsOptional()
  @IsEnum(QuoteStatus)
  status?: QuoteStatus;

  @ApiPropertyOptional({ example: 'Payment due on completion unless agreed otherwise.' })
  @IsOptional()
  @IsString()
  @MaxLength(1500)
  paymentTerms?: string;

  @ApiPropertyOptional({ example: 'Customer to provide parking access.' })
  @IsOptional()
  @IsString()
  @MaxLength(1500)
  specialInstructions?: string;

  @ApiPropertyOptional({ example: 'General cleaning, surfaces, floors, bathrooms, kitchen.' })
  @IsOptional()
  @IsString()
  @MaxLength(2500)
  included?: string;

  @ApiPropertyOptional({ example: 'Carpet shampooing and external windows.' })
  @IsOptional()
  @IsString()
  @MaxLength(2500)
  excluded?: string;

  @ApiPropertyOptional({ example: 'Quote valid for 14 days.' })
  @IsOptional()
  @IsString()
  @MaxLength(2500)
  notes?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showSignature?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  tax?: number;

  @ApiProperty({ type: [CreateQuoteLineItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteLineItemDto)
  lineItems!: CreateQuoteLineItemDto[];
}
