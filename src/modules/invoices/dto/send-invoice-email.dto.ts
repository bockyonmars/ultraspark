import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SendInvoiceEmailDto {
  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  to!: string;

  @ApiPropertyOptional({ example: 'accounts@example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  cc?: string;

  @ApiPropertyOptional({ example: 'owner@example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bcc?: string;

  @ApiProperty({ example: 'Your Invoice from UltraSpark Cleaning' })
  @IsString()
  @MaxLength(180)
  subject!: string;

  @ApiProperty({ example: 'Hi Sarah, please find your invoice attached.' })
  @IsString()
  @MaxLength(8000)
  body!: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  includePaymentLink?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  attachInvoicePdf?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supportTicketId?: string;
}
